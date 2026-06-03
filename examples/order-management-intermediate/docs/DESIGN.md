# Order Management (Intermediate) — Tactical Design

**Playthrough**: order-management-intermediate
**Date**: 2026-05-29
**Based on**: [strategic-design/STRATEGIC.md](strategic-design/STRATEGIC.md)
**Tier**: Intermediate (2 Aggregates, 2 BCs, Domain Service, Cross-BC Port)

> This document moves the BC/UL/Context Map finalized in Strategic Design to an implementation-level model.
> The Strategic decisions (BC boundaries, dependency direction, Port location, event ownership) are taken as-is, not re-debated.
> The detailed choices in this document (fields, VOs, method signatures, service placement) were decided in the walkthrough (2026-05-29).

---

## Domain Overview

When a customer bundles products to create and confirm an Order, a Payment is created in the REQUESTED state within the same transaction. An Operator settles the payment (SUCCEEDED/FAILED), and only a paid order can transition to shipped (SHIPPED). After a successful payment, the Operator processes a refund (REFUNDED) as a separate command.

Core learning value: **Aggregate boundary = transaction boundary = consistency boundary**. The two Aggregates (`Order`, `Payment`) belong to different BCs and are linked by ID only; the rule crossing the two Aggregates (`canShip`) is handled by a pure Domain Service, and calls crossing the boundary are handled by a Cross-BC Port (ACL).

**Core scenarios**:
1. The customer creates an order from a product list → `PENDING`.
2. The customer confirms the order → `CONFIRMED` + a `Payment(REQUESTED)` is created in the same TX.
3. The Operator settles the payment → `SUCCEEDED` or `FAILED`.
4. On payment success, the Operator starts shipping → `SHIPPED` (requires confirmation of payment success).
5. Before shipping, the customer/Operator may cancel; for paid amounts, the Operator issues a refund.

---

## Aggregate / Entity

### BC-1: Order

- **Aggregate Root**: `Order` — owns the order lifecycle (PENDING → CONFIRMED → SHIPPED, CANCELLED) and the total.
- **Entity**: `OrderItem` — an individual product line belonging to `Order`. Cannot exist independently outside the Order (inside the same Aggregate).

```text
Order (Aggregate Root)
 ├─ id: OrderId
 ├─ customerId: string            // identifier from another context, ID reference only
 ├─ status: OrderStatus
 ├─ totalAmount: Money            // denormalized stored value, recomputed when items change (invariant: == Σ lineTotal)
 └─ items: OrderItem[]            // same Aggregate, @OneToMany allowed
        OrderItem (Entity)
         ├─ id: OrderItemId
         ├─ productId: string     // no Catalog BC → ID snapshot only
         ├─ productName: string   // snapshot at creation time (independent of later catalog changes)
         ├─ unitPrice: Money      // price snapshot at creation time
         └─ quantity: Quantity
```

### BC-2: Payment

- **Aggregate Root**: `Payment` — a payment attempt for a single Order. Owns method, amount, and status.
- No Entity (single root).

```text
Payment (Aggregate Root)
 ├─ id: PaymentId
 ├─ orderId: string               // references the Order Aggregate by ID only. No FK, plain column + @Index
 ├─ amount: Money                 // immutable after creation
 ├─ method: PaymentMethod
 └─ status: PaymentStatus
```

> **Aggregate boundary rule (CLAUDE.md)**: `Order ↔ OrderItem` are the same Aggregate, so `@OneToMany`/`@ManyToOne` are allowed. `Payment.orderId` references another Aggregate, so `@ManyToOne`/FK are forbidden — only a plain `@Column` + `@Index()`.

---

## Value Objects

### BC-1: Order

| VO | Values | Validation Rules |
|---|---|---|
| `OrderId` | string (UUID) | - |
| `OrderItemId` | string (UUID) | - |
| `Money` | amount: number, currency: string | amount ≥ 0; arithmetic (`add`/`multiply`) enforces matching currency |
| `Quantity` | value: number | integer, ≥ 1 |
| `OrderStatus` | enum | `PENDING` / `CONFIRMED` / `SHIPPED` / `CANCELLED` |

### BC-2: Payment

| VO | Values | Validation Rules |
|---|---|---|
| `PaymentId` | string (UUID) | - |
| `Money` | amount: number, currency: string | amount ≥ 0; enforces matching currency (Payment BC defines its own; does not share a type with Order's Money) |
| `PaymentMethod` | enum | `CARD` / `BANK_TRANSFER` / `VIRTUAL_ACCOUNT` |
| `PaymentStatus` | enum | `REQUESTED` / `SUCCEEDED` / `FAILED` / `REFUNDED` |

> **`Money` is defined separately per BC** (no shared kernel). When crossing the boundary it is passed as primitives (`{ amount, currency }`) and each BC reconstructs it with its own `Money` → ACL.
> **`orderId` is stored as a plain string in Payment**, not a VO (it does not import Order BC's `OrderId` type).

---

## State Transitions

### Order

```text
            confirm()              ship(isReadyToShip)
  PENDING ───────────> CONFIRMED ─────────────────────> SHIPPED
     │                     │
     │ cancel()            │ cancel()
     v                     v
  CANCELLED ◄──────────────┘
```

- `confirm()`: `PENDING → CONFIRMED`, publishes `OrderConfirmed`.
- `ship(isReadyToShip)`: `CONFIRMED → SHIPPED`. Guard: `status === CONFIRMED && isReadyToShip === true`. Publishes `OrderShipped`.
- `cancel()`: `PENDING` or `CONFIRMED → CANCELLED`. Publishes `OrderCancelled`. Not allowed from `SHIPPED`.

### Payment

```text
              succeed()              refund()
  REQUESTED ───────────> SUCCEEDED ──────────> REFUNDED
     │
     │ fail()
     v
   FAILED
```

- `create(orderId, amount, method)`: the factory creates it directly in the `REQUESTED` state, publishes `PaymentRequested` (genesis = REQUESTED).
- `succeed()`: `REQUESTED → SUCCEEDED`, publishes `PaymentSucceeded`.
- `fail()`: `REQUESTED → FAILED`, publishes `PaymentFailed` (a pre-approval void is also absorbed into this state).
- `refund()`: `SUCCEEDED → REFUNDED` (full refund, no amount argument), publishes `RefundIssued`.

---

## Use Cases

### BC-1: Order

| Action | Type | Actor | Input | Output | Notes |
|---|---|---|---|---|---|
| CreateOrder | Command | Customer | customerId, items[] { productId, productName, unitPrice, quantity } | orderId | items created in bulk (atomic), `PENDING`, `OrderPlaced` |
| ConfirmOrder | Command | Customer | orderId, paymentMethod | void | `PENDING → CONFIRMED`; **Payment created in the same TX** (D1) |
| CancelOrder | Command | Customer/Operator | orderId | void | `PENDING`/`CONFIRMED → CANCELLED`; does not touch Payment (D3) |
| ShipOrder | Command | Operator | orderId | void | look up `isPaid` → `PaymentCoordinator.canShip` → `ship()` |
| GetOrder | Query | any | orderId | OrderReadModel | bypasses domain, `OrderQueryPort` |

### BC-2: Payment

| Action | Type | Actor | Input | Output | Notes |
|---|---|---|---|---|---|
| SettlePayment | Command | Operator/mock | paymentId, result (`SUCCEEDED`\|`FAILED`) | void | calls `succeed()`/`fail()` per result; **separate TX** from order confirmation |
| IssueRefund | Command | Operator | paymentId | void | `SUCCEEDED → REFUNDED` |
| GetPayment | Query | any | paymentId (or orderId) | PaymentReadModel | bypasses domain, `PaymentQueryPort` |

> Payment is not *created* directly via HTTP. It is created only during `ConfirmOrder` processing, in the same TX, via `PaymentCommandPort.createPayment()`.

---

## Expected API Endpoints

| Method | Path | Action | Actor |
|---|---|---|---|
| POST | `/orders` | CreateOrder | Customer |
| POST | `/orders/:id/confirm` | ConfirmOrder (body: `{ paymentMethod }`) | Customer |
| POST | `/orders/:id/cancel` | CancelOrder | Customer/Operator |
| POST | `/orders/:id/ship` | ShipOrder | Operator |
| GET | `/orders/:id` | GetOrder | any |
| POST | `/payments/:id/settle` | SettlePayment (body: `{ result }`) | Operator |
| POST | `/payments/:id/refund` | IssueRefund | Operator |
| GET | `/payments/:id` | GetPayment | any |

---

## Cross-BC Ports (ACL)

Defined in Order BC's `application/ports/`, implemented by Payment BC's `infra` adapters. The boundary is crossed with primitives only.

```ts
// src/order/application/ports/payment-command.port.ts   (D4: write ACL)
abstract class PaymentCommandPort {
  abstract createPayment(input: {
    orderId: string; amount: number; currency: string; method: string;
  }): Promise<void>;
}

// src/order/application/ports/payment-status-query.port.ts   (D2: read ACL)
abstract class PaymentStatusQueryPort {
  abstract isPaid(orderId: string): Promise<boolean>;  // adapter: status === SUCCEEDED → true
}
```

- `PaymentCommandAdapter` / `PaymentStatusQueryAdapter` (in `src/order/infra/adapters/`) delegate to Payment's `PaymentRepositoryPort`/`PaymentQueryPort`.
- The adapters translate primitives ↔ Payment's `Money`/`PaymentMethod`/`PaymentStatus`. Order domain code does not know Payment vocabulary (UL Anti-Vocabulary).
- Module wiring: `PaymentPortsModule` exports only the two adapters → `OrderModule` does not import `PaymentModule` wholesale. (Details: [strategic-design/04-context-map.md](strategic-design/04-context-map.md))

---

## Aggregate Decisions

| Aggregate Root | Invariants in One Transaction | Why This Boundary |
|---|---|---|
| `Order` | `totalAmount == Σ(item.unitPrice × item.quantity)`; items ≥ 1; state transitions follow only the allowed graph | `OrderItem` is meaningless outside Order. Items/total must be recomputed and committed together in one TX so the denormalized total does not break |
| `Payment` | state transitions follow only the allowed graph; `amount` is immutable after creation; `refund` only from `SUCCEEDED` | One Payment per Order. Settlement/refund happen in independent TXs. References Order by ID only (no FK) to keep each independently loadable with its own consistency boundary |

---

## Consistency Boundaries per Use Case

| Use Case | Aggregates Modified | Boundary | Notes |
|---|---|---|---|
| CreateOrder | Order | strong | single Aggregate, one TX |
| ConfirmOrder | Order + Payment(new) | strong | **D1**: one `@Transactional()` commits the Order transition + Payment creation together |
| CancelOrder | Order | strong | state transition only. Payment unchanged |
| ShipOrder | Order (Payment read-only lookup) | strong (Order) | Payment status is read via the Port only, never modified |
| SettlePayment | Payment | strong | independent TX from order confirmation |
| IssueRefund | Payment | strong | single Aggregate |
| Refund→Cancel (manual Operator flow) | Payment, then Order | **eventual / manual** | **D5**: two independent TXs. If Cancel fails after Refund succeeds, an inconsistency window → allowed via manual retry in this tier. Saga compensation in Advanced |

Boundary values: `strong` (single TX) / `eventual` (separate TX, event-linked) / `compensation` (requires Saga compensation).

---

## Service Placement

| Behavior | Location | Reason |
|---|---|---|
| Order state transitions (`confirm`/`cancel`, `ship`'s own-state guard) | Domain Method (`Order.*`) | rule internal to a single Aggregate |
| Total recomputation (`totalAmount`) | Domain Method (`Order`) | Aggregate-internal invariant |
| **Shippability decision** (`CONFIRMED && isPaid`) | **Domain Service** (`PaymentCoordinator.canShip(order, isPaid)`, **pure**) | a rule crossing two Aggregates. But to avoid depending on a Port, the `isPaid` fact is injected as an argument |
| Looking up the payment-success fact | Application (`ShipOrderCommandHandler` via `PaymentStatusQueryPort`) | cross-BC lookup orchestration, not a rule |
| Payment creation on confirmation | Application (`ConfirmOrderCommandHandler` via `PaymentCommandPort`, `@Transactional()`) | cross-BC write orchestration |
| Payment state transitions (`succeed`/`fail`/`refund`) | Domain Method (`Payment.*`) | rule internal to a single Aggregate |

> `PaymentCoordinator` is a **pure domain service** located in `src/order/domain/services/`:
> `canShip(order: Order, isPaid: boolean): boolean = order.isConfirmed() && isPaid`.
> The handler obtains the fact via `port.isPaid(orderId)` and injects it → the domain does not import an application Port (complies with the CLAUDE.md layer rule).

---

## Domain Events

In this tier the cross-aggregate link is made **not by events but by a Port + the same TX** (D1). Therefore events are only published; there are no automatic cross-BC subscribers (shipping is also a manual Operator command). Events are a record for future Advanced evolution and for the read side.

| Event | Publisher BC | Subscriber BC | Publish Mechanism | Failure Policy | Idempotency Key |
|---|---|---|---|---|---|
| `OrderPlaced` | Order | (none this tier) | in-process | best-effort log | orderId |
| `OrderConfirmed` | Order | (none — Payment creation is direct via Port/same TX) | in-process | best-effort log | orderId |
| `OrderCancelled` | Order | (none) | in-process | best-effort log | orderId |
| `OrderShipped` | Order | (none) | in-process | best-effort log | orderId |
| `PaymentRequested` | Payment | (none) | in-process | best-effort log | paymentId |
| `PaymentSucceeded` | Payment | (none this tier — shipping is manual by Operator) | in-process | best-effort log | paymentId |
| `PaymentFailed` | Payment | (none) | in-process | best-effort log | paymentId |
| `RefundIssued` | Payment | (none — Order cancellation is manual by Operator) | in-process | best-effort log | paymentId |

> **Advanced evolution memo**: `PaymentSucceeded → automatic ShipOrder`, `RefundIssued ↔ OrderCancelled` Saga compensation, and `OrderShipped → ShipmentDispatched` (split into a Shipment BC) are all next-tier topics. ([strategic-design/05-ubiquitous-language.md](strategic-design/05-ubiquitous-language.md))

---

## Open Questions / Tier Limits

- **D5 inconsistency window**: if Cancel fails after Refund, a *Payment REFUNDED + Order CONFIRMED* state can temporarily exist. This tier allows it via manual handling.
- Partial refunds, multiple payment attempts, real PSP integration, inventory reservation, and notifications are out of scope (PRD "Out of Scope").
