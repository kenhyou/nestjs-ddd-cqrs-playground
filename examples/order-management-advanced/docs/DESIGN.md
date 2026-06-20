# Order Management (Advanced) — Tactical Design

**Playthrough**: order-management-advanced
**Date**: 2026-06-04
**Based on**: [strategic-design/STRATEGIC.md](strategic-design/STRATEGIC.md)
**Tier**: Advanced (3 Aggregates, 3 BCs, Domain Events, Transactional Outbox, Fulfillment Saga, Eventual Consistency)

> This document moves the BC/UL/Context Map finalized in Strategic Design to an implementation-level model.
> The Strategic decisions (BC boundaries, dependency direction, event-driven coordination, ACL placement) are taken as-is, not re-debated.
> The detailed choices here (fields, VOs, saga model, outbox schema, idempotency) are decided interactively in the walkthrough (2026-06-04). Decisions are tagged **D1..Dn**.

---

## Domain Overview

A customer places and confirms an Order; confirmation starts a **Fulfillment Saga** that drives Payment then Shipment across three BCs, coordinated **only by Domain Events** through a Transactional Outbox. The customer briefly sees an in-flight `PENDING_SHIPMENT` state; the system converges to `DELIVERED` (happy path) or `CANCELLED` (any failure/timeout), with the saga issuing compensations (refunds, shipment cancellation).

Core learning value: **eventual consistency across BCs**, a stateful **Process Manager**, the **Transactional Outbox** (no dual-write), **idempotent at-least-once** consumers, and **ACL** isolation of mocked external systems.

**Core scenarios**:
1. **Happy path** — Confirm → saga requests payment → payment succeeds → saga requests shipment → dispatched → delivered → `Order: DELIVERED`, `Saga: COMPLETED`.
2. **Payment failure** — payment declined → saga cancels the order (no refund needed) → `CANCELLED`.
3. **Shipment failure (compensation)** — payment succeeded but dispatch fails → saga emits `RefundRequested` → refund issued → `CANCELLED`.
4. **Customer cancel after payment, before dispatch** — saga compensates (refund + cancel shipment if requested) → `CANCELLED`. After `SHIPPED`, cancel is rejected.
5. **Timeout** — saga stuck in `AWAITING_*` past its deadline → Scheduler fires `OrderTimedOut` → compensate by progress → `CANCELLED`.

---

## Aggregate / Entity

### BC-1: Order
- **Aggregate Root**: `Order` — owns the order lifecycle (PENDING → CONFIRMED → PENDING_SHIPMENT → SHIPPED → DELIVERED, CANCELLED) and the total. Also holds denormalized `paymentStatus` / `shipmentStatus` read-model columns (Phase 4).
- **Entity**: `OrderItem` — a product line inside `Order` (same Aggregate, `@OneToMany` allowed).
- **Aggregate Root**: `FulfillmentSaga` — the domain Process Manager (D1), keyed 1:1 by `orderId`, in the same BC but a **separate aggregate / separate transaction concern** from `Order`.

```text
Order (Aggregate Root)
 ├─ id: OrderId
 ├─ customerId: string            // ID reference only
 ├─ status: OrderStatus
 ├─ totalPrice: Money             // invariant: == Σ lineTotal
 ├─ paymentStatus: string | null  // denormalized read-model (updated by saga step)
 ├─ shipmentStatus: string | null // denormalized read-model
 └─ items: OrderItem[]            // same Aggregate
        OrderItem (Entity)
         ├─ id: OrderItemId
         ├─ productId: string     // ID snapshot
         ├─ productName: string   // snapshot at creation
         ├─ unitPrice: Money      // snapshot at creation
         └─ quantity: Quantity

FulfillmentSaga (Aggregate Root — see D1 for full fields)
 └─ orderId, status(SagaStatus), paymentId?, shipmentId?, awaiting*Until, compensationReason
```

### BC-2: Payment
- **Aggregate Root**: `Payment` — one payment attempt for an Order. No child Entity.
```text
Payment (Aggregate Root)
 ├─ id: PaymentId
 ├─ orderId: string               // ID reference only — plain @Column + @Index, no FK
 ├─ amount: Money                 // immutable after creation
 ├─ method: PaymentMethod
 ├─ gatewayRef: string | null     // translated from the gateway ACL outcome
 └─ status: PaymentStatus
```

### BC-3: Shipment
- **Aggregate Root**: `Shipment` — one physical dispatch for an Order. No child Entity.
```text
Shipment (Aggregate Root)
 ├─ id: ShipmentId
 ├─ orderId: string               // ID reference only — plain @Column + @Index, no FK
 ├─ trackingCode: TrackingCode | null  // set on dispatch (from carrier ACL)
 └─ status: ShipmentStatus
```

> **Aggregate boundary rule (CLAUDE.md)**: `Order ↔ OrderItem` are one Aggregate → `@OneToMany` allowed. `Payment.orderId`, `Shipment.orderId`, and `FulfillmentSaga.orderId` cross Aggregate boundaries → plain `@Column` + `@Index()`, never `@ManyToOne`/FK. The saga, though in the Order BC, references `Order` by id only.

---

## Value Objects

### BC-1: Order
| VO | Values | Validation Rules |
|---|---|---|
| `OrderId` | string (UUID) | - |
| `OrderItemId` | string (UUID) | - |
| `Money` | amount: number, currency: string | amount ≥ 0; `add`/`multiply` enforce matching currency |
| `Quantity` | value: number | integer, ≥ 1 |
| `OrderStatus` | enum | `PENDING` / `CONFIRMED` / `PENDING_SHIPMENT` / `SHIPPED` / `DELIVERED` / `CANCELLED` |
| `SagaStatus` | enum | `STARTED` / `AWAITING_PAYMENT` / `AWAITING_SHIPMENT` / `COMPLETED` / `COMPENSATING` / `CANCELLED` |

### BC-2: Payment
| VO | Values | Validation Rules |
|---|---|---|
| `PaymentId` | string (UUID) | - |
| `Money` | amount, currency | amount ≥ 0; matching currency (Payment defines its **own** `Money`, no shared kernel) |
| `PaymentMethod` | enum | `CARD` / `BANK_TRANSFER` / `VIRTUAL_ACCOUNT` |
| `PaymentStatus` | enum | `REQUESTED` / `SUCCEEDED` / `FAILED` / `REFUNDED` |

### BC-3: Shipment
| VO | Values | Validation Rules |
|---|---|---|
| `ShipmentId` | string (UUID) | - |
| `ShipmentStatus` | enum | `PENDING` / `DISPATCHED` / `DELIVERED` / `FAILED` |
| `TrackingCode` | value: string | non-empty when present |

> `Money` is defined **separately per BC** (no shared kernel). Cross-boundary it travels as primitives `{ amount, currency }` inside event payloads; each BC reconstructs its own `Money`. `orderId` is stored as a plain string in Payment/Shipment/Saga (not another BC's `OrderId` type).

---

## State Transitions

> Saga state machine is in **D1**. Below are the three domain aggregates.

### Order
```text
  PENDING ──confirm()──> CONFIRMED ──markPendingShipment()──> PENDING_SHIPMENT ──ship()──> SHIPPED ──deliver()──> DELIVERED
     │                       │                                     │
     │ cancel()              │ cancel()                            │ cancel()
     v                       v                                     v
  CANCELLED <───────────────┴─────────────────────────────────────┘
  (cancel rejected once SHIPPED/DELIVERED — D6a)
```
- `confirm()`: `PENDING→CONFIRMED`, records `OrderConfirmed`.
- `markPendingShipment()`: `CONFIRMED→PENDING_SHIPMENT` (saga step, after payment success).
- `ship()`: `PENDING_SHIPMENT→SHIPPED`, records `OrderShipped`.
- `deliver()`: `SHIPPED→DELIVERED`, records `OrderDelivered`.
- `cancel()`: → `CANCELLED` from `PENDING`/`CONFIRMED`/`PENDING_SHIPMENT`, records `OrderCancelled`. Rejected from `SHIPPED`/`DELIVERED` (`OrderNotCancellableException`).

### Payment
```text
  REQUESTED ──succeed()──> SUCCEEDED ──refund()──> REFUNDED
     │
     │ fail()
     v
   FAILED
```
- `create(orderId, amount, method)`: genesis = `REQUESTED`, records `PaymentRequested`.
- `succeed(gatewayRef)`: `REQUESTED→SUCCEEDED`, records `PaymentSucceeded`.
- `fail()`: `REQUESTED→FAILED`, records `PaymentFailed`.
- `refund()`: `SUCCEEDED→REFUNDED` (full refund), records `RefundIssued`.

### Shipment
```text
  PENDING ──dispatch()──> DISPATCHED ──deliver()──> DELIVERED
     │
     │ fail()
     v
   FAILED
```
- `create(orderId)`: genesis = `PENDING`.
- `dispatch(trackingCode)`: `PENDING→DISPATCHED`, records `ShipmentDispatched`.
- `deliver()`: `DISPATCHED→DELIVERED`, records `ShipmentDelivered`.
- `fail()`: `PENDING→FAILED`, records `ShipmentFailed`. (Cancellation of a not-yet-dispatched shipment during compensation also resolves here.)

---

## D1 — Fulfillment Saga / Process Manager

**Decision**: model the saga as a **domain Process Manager aggregate** (`FulfillmentSaga`) in `order/domain/models/`, keyed **1:1 by `orderId`**, with the accepted state set. Orchestration policy lives in pure domain methods; event handlers in `order/application/` load the saga, call a method, and persist the saga change + the resulting outbox row in one transaction.

### Identity & fields

```text
FulfillmentSaga (Aggregate Root, domain Process Manager)
 ├─ orderId: OrderId            // identity — one saga per Order (1:1)
 ├─ status: SagaStatus          // STARTED / AWAITING_PAYMENT / AWAITING_SHIPMENT / COMPLETED / COMPENSATING / CANCELLED
 ├─ paymentId: string | null    // captured from PaymentSucceeded/PaymentRequested correlation
 ├─ shipmentId: string | null   // captured from ShipmentDispatched correlation
 ├─ awaitingPaymentUntil: Date | null   // timeout deadline while AWAITING_PAYMENT
 ├─ awaitingShipmentUntil: Date | null  // timeout deadline while AWAITING_SHIPMENT
 └─ compensationReason: string | null   // why we entered COMPENSATING (payment_failed / shipment_failed / timeout / customer_cancel)
```

> The saga's identity **is** the `orderId` (no separate `SagaId`) — reinforces "saga lifecycle = Order lifecycle" (Phase 3 rationale). Each step still routes by `orderId` carried on every event.

### State machine

```text
                 (OrderConfirmed)
                       │
                       v
   STARTED ──emit PaymentRequested──> AWAITING_PAYMENT
                                          │
              PaymentSucceeded ───────────┤────────────── PaymentFailed / timeout
                       │                                        │
       emit ShipmentRequested                          (no settled payment)
                       v                                        v
              AWAITING_SHIPMENT                              CANCELLED
                  │        │
   ShipmentDispatched   ShipmentFailed / timeout / customer cancel-after-pay
   → OrderShipped            │
        │              emit RefundIssued (compensation)
   ShipmentDelivered          v
   → OrderDelivered      COMPENSATING ──RefundIssued ack──> CANCELLED
        │
        v
    COMPLETED   (terminal: success)
```

- The saga decides transitions in **pure domain methods** (e.g. `onPaymentSucceeded()`, `onShipmentFailed()`, `onTimeout(now)`); each method mutates `status` and **records the command/event to publish** (collected and written to the outbox in the same TX).
- `COMPENSATING` is entered only when a settled Payment must be reversed (shipment failure, timeout-after-payment, or customer cancel after payment). When no payment settled (payment failure / pre-payment timeout), the saga goes straight to `CANCELLED`.
- Terminal states: `COMPLETED` (happy path) and `CANCELLED` (any compensation/timeout/early-cancel path).

### New VO
- `SagaStatus` enum: `STARTED` / `AWAITING_PAYMENT` / `AWAITING_SHIPMENT` / `COMPLETED` / `COMPENSATING` / `CANCELLED`.

---

## D2 — Transactional Outbox

**Decision**: one shared `outbox_events` table in a `OutboxModule` (pure infrastructure, not a BC). Domain events are recorded by the aggregate and written to the outbox **by the repository, in the same `@Transactional()` as the aggregate save** (D2b: Option A). A polling relay delivers them at-least-once.

### Schema

```text
outbox_events
 ├─ id: uuid (pk)
 ├─ aggregate_type: 'order' | 'payment' | 'shipment'
 ├─ aggregate_id: string          // orderId / paymentId / shipmentId
 ├─ message_type: string          // 'PaymentRequested', 'PaymentSucceeded', 'ShipmentFailed', ...
 ├─ payload: jsonb
 ├─ occurred_at: timestamptz
 └─ published_at: timestamptz | null   // null = not yet relayed
```

### Mechanism

- **Write side**: each aggregate (`Order`, `Payment`, `Shipment`, `FulfillmentSaga`) collects domain events; `pullEvents()` drains them. The repository serializes drained events into `outbox_events` rows in the same transaction as the aggregate INSERT/UPDATE → aggregate state and emitted events can never diverge (no dual-write).
- **Relay**: `OutboxRelayService` with `@Interval(1000)`: select `WHERE published_at IS NULL` ordered by `occurred_at` (batch ~100), publish each row onto the in-process `EventBus`, then stamp `published_at` in a **separate** short transaction. A crash between publish and stamp re-delivers on the next tick → **at-least-once** (idempotency in D3 makes this safe).
- The relay is a single shared instance (acceptable single point of failure for this learning scope; production would shard per `aggregate_type`).

---

## D3 — Idempotency

**Decision**: two layers. Layer 1 is the saga's own state-machine guard (free); Layer 2 is an explicit **message-id dedup table** at the consumer boundary (D3: Option A).

### Layer 1 — state-machine guard (always on)
`FulfillmentSaga` (and the `Payment`/`Shipment` aggregates) ignore out-of-state events: a duplicate `PaymentSucceeded` arriving when the saga is already `AWAITING_SHIPMENT` is a no-op in the domain method. Good modeling gives logical-duplicate protection for free.

### Layer 2 — message-id dedup table
```text
processed_messages
 ├─ consumer_name: string         // e.g. 'FulfillmentSaga', 'PaymentModule', 'ShipmentModule'
 ├─ message_id: uuid              // = outbox_events.id (stable across relay re-delivery)
 ├─ processed_at: timestamptz
 └─ PRIMARY KEY (consumer_name, message_id)
```
- Each subscriber, on receiving a message: inside one `@Transactional()`, attempt to insert `(consumer_name, message_id)`. On unique-violation → already processed → return without side effects. Otherwise apply the aggregate change + (if applicable) append new outbox rows, all in the same TX.
- Because "processed" and "effect" commit atomically, a crash after the aggregate write but before commit re-runs cleanly (no processed row exists yet); a crash after commit is deduped on re-delivery.
- `message_id` = the outbox row `id`, which is stable across relay retries → precisely cancels at-least-once re-delivery. Logical duplicates (distinct rows, same meaning) are handled by Layer 1.

---

## D4 — Event-Driven Coordination (event flow + saga commands)

**Decisions**: coordination is **events, not direct cross-BC commands** (Phase 4). Saga start is **event-driven** (D4a); the saga **updates saga + Order in one TX** within the Order BC (D4b); Payment/Shipment outcomes **auto-settle with a force-fail hook** (D4c).

### Happy-path flow (each step = one `@Transactional()`, linked by the relay)

```
1. POST /orders/:id/confirm
   ConfirmOrderHandler:  Order.confirm() [PENDING→CONFIRMED], records OrderConfirmed
2. relay→ OrderConfirmed → SagaHandler (Order BC):
   FulfillmentSaga.start() [STARTED→AWAITING_PAYMENT], records PaymentRequested
3. relay→ PaymentRequested → PaymentHandler (Payment BC):
   Payment.create() [REQUESTED]; mock-settle → Payment.succeed(), records PaymentSucceeded
4. relay→ PaymentSucceeded → SagaHandler:
   saga.onPaymentSucceeded(paymentId) [AWAITING_PAYMENT→AWAITING_SHIPMENT]
   + Order.markPendingShipment() [CONFIRMED→PENDING_SHIPMENT]   (saga+Order, one TX)
   records ShipmentRequested
5. relay→ ShipmentRequested → ShipmentHandler (Shipment BC):
   Shipment.create() [PENDING]; mock-dispatch → Shipment.dispatch(), records ShipmentDispatched
6. relay→ ShipmentDispatched → SagaHandler:
   Order.ship() [PENDING_SHIPMENT→SHIPPED], records OrderShipped     (saga+Order, one TX)
7. relay→ ShipmentDelivered → SagaHandler:
   Order.deliver() [SHIPPED→DELIVERED], saga.complete() [→COMPLETED], records OrderDelivered
```

### Rules
- **D4a — event-driven start**: `ConfirmOrder` writes only `Order(CONFIRMED)` + the `OrderConfirmed` outbox row. The saga is created by the `OrderConfirmed` subscriber (within the Order BC) — the saga is purely event-fed.
- **D4b — saga + Order in one TX**: the saga subscriber loads and updates both the `FulfillmentSaga` and the `Order` aggregate (same BC, same `orderId`) in one transaction, and writes the resulting outbox row(s) in the same TX. Matches the intermediate precedent of writing two aggregates per use case. The denormalized `paymentStatus` / `shipmentStatus` read-model columns (Phase 4) are updated on `Order` in this same step.
- **D4c — auto-settle + force-fail hook**: the mocked gateway/carrier adapters (D5) settle immediately, succeeding by default. A deterministic hook (e.g. a request flag or an amount sentinel) forces `PaymentFailed` / `ShipmentFailed` to exercise compensation. No manual `SettlePayment` command on the happy path.
- Every subscriber applies the D3 dedup (`processed_messages`) + the saga's state-machine guard.

### Delivery mechanism (decided in Phase 2): envelope + string dispatch

Cross-BC messages are delivered as a **generic envelope** — `{ messageId, messageType, payload }` — **not** as imported event classes. The relay reads outbox rows and routes each by its `messageType` **string** to handlers registered for that type. Consequences:
- **No cross-BC domain imports.** Only the type name + JSON payload cross a boundary (true Published Language). The Order saga handler never imports Payment's `PaymentSucceededEvent` class, etc.
- **The consuming handler is the ACL.** Each handler parses the JSON payload it cares about and translates it into its own domain call — exactly the "saga handler translates incoming events" role from the Phase 4 Context Map.
- A small shared contract (`shared/`) defines the envelope type (`InboundMessage`) and a handler base (`MessageHandler` with a `messageType` + `handle(message)`). The relay + router that dispatch by `messageType` are infra (Phase 3); BCs register their handlers at the module (Phase 5).
- This replaces the earlier sketch of using NestJS CQRS `@EventsHandler(Class)` for cross-BC events — that would force class imports across BCs. (In-BC event handling may still use the CQRS bus where no boundary is crossed.)

---

## D5 — Anti-Corruption Layer (mocked gateway / carrier)

**Decision**: Port + adapter with a **deliberately ugly external model** (D5: Option A), so the ACL translation is real. The force-fail hook (D4c) lives inside the mock.

### Payment side
```ts
// payment/application/ports/payment-gateway.port.ts
abstract class PaymentGatewayPort {
  abstract charge(input: { orderId: string; amount: number; currency: string }): Promise<PaymentOutcome>;
  abstract refund(input: { gatewayRef: string }): Promise<RefundOutcome>;
}
// PaymentOutcome = clean domain result: { settled: boolean; gatewayRef: string }

// payment/infra/adapters/mock-payment-gateway.adapter.ts
// fake gateway returns an external shape: { txnId, resultCode: '00' | '05', rawStatus: 'APPROVED' | 'DECLINED' }
// adapter maps resultCode === '00' → settled: true; '05' → settled: false
// force-fail hook: a sentinel amount (or per-test flag) makes the mock return '05'
```

### Shipment side (mirror)
```ts
// shipment/application/ports/carrier.port.ts
abstract class CarrierPort {
  abstract dispatch(input: { orderId: string }): Promise<DispatchOutcome>;
}
// DispatchOutcome = { dispatched: boolean; trackingCode: string }
// mock carrier returns external shape: { ref, status: 'ACCEPTED' | 'REJECTED', tracking_no }
// adapter maps status === 'ACCEPTED' → dispatched: true
```

- The adapter is the only place that knows the external vocabulary; `Payment` / `Shipment` domain code sees only the clean `*Outcome` types (UL anti-vocabulary).
- Ports bound to mock adapters in their BC module; swapping in a real gateway later is an adapter change only.

---

## D6 — Compensation Flows & Consistency Boundaries

**Decisions**: cancel allowed **until dispatch, rejected once SHIPPED** (D6a); event-driven compensation + `@Interval` Scheduler timeouts approved (D6b).

### Compensation flows

| # | Trigger | Saga action | Order ends |
|---|---|---|---|
| 1 | `PaymentFailed` (or pre-payment timeout) | no settled payment → straight to terminal | `CANCELLED` |
| 2 | `ShipmentFailed` (payment was SUCCEEDED) | → `COMPENSATING`, emit `RefundRequested`; on `RefundIssued` → terminal | `CANCELLED` |
| 3 | Customer cancels after payment, before dispatch | → `COMPENSATING`, emit `RefundRequested` (+ cancel shipment if already requested); on `RefundIssued` → terminal | `CANCELLED` |
| 4 | Timeout (`OrderTimedOut`) | compensate by progress: refund if paid, cancel shipment if dispatched | `CANCELLED` |

- **Refund as compensation** mirrors the request path: saga emits `RefundRequested` → Payment subscribes → `Payment.refund()` (legal only from `SUCCEEDED`) → `RefundIssued` → saga finalizes to `CANCELLED`. No synchronous cross-BC call.
- **Cancel cutoff (D6a)**: `CancelOrder` is allowed while `PENDING` / `CONFIRMED` / `PENDING_SHIPMENT`; if the saga shows a settled payment it routes through `COMPENSATING` (refund). Once `Order.status === SHIPPED` (or `DELIVERED`), cancel is **rejected** (`OrderNotCancellableException`).
- **Timeout (Scheduler)**: `awaitingPaymentUntil` / `awaitingShipmentUntil` deadlines live on the saga. A `@Interval` Scheduler in the saga module polls sagas still in `AWAITING_*` past deadline → `saga.onTimeout(now)` → emits `OrderTimedOut` + the appropriate compensation.

#### CancelOrder implementation (decided in Phase 2)
- **Route through the saga.** `CancelOrderCommandHandler` calls `Order.cancel()` first (the gate — rejects `SHIPPED`/`DELIVERED`), then loads the saga and calls `saga.onCancelRequested()`, saving both in one TX (the D4b saga+Order pattern). A still-`PENDING` order has no saga → `findByOrderId` is `null` → cancel the Order only, nothing to compensate.
- `onCancelRequested()` shares one private `cancelOrCompensate()` helper with `onTimeout()`: `AWAITING_PAYMENT → CANCELLED` (no refund); `AWAITING_SHIPMENT → COMPENSATING` + `RequestRefund`; any other (terminal) state is a no-op. Customer-cancel and timeout are behaviorally identical compensations under different names.
- **Cancel/payment race — accepted (not guarded).** Cancelling while `AWAITING_PAYMENT` goes straight to `CANCELLED`; a `PaymentSucceeded` arriving afterward hits the saga's state guard and is a no-op (no refund). Known limitation, identical to `onTimeout` in `AWAITING_PAYMENT`; a `CANCELLING` state to refund late settlements was considered and deferred to keep the state machine small.

### Consistency Boundaries per Use Case

| Use Case | Aggregates Modified | Boundary | Notes |
|---|---|---|---|
| CreateOrder | Order | strong | single aggregate, one TX |
| ConfirmOrder | Order | strong | `PENDING→CONFIRMED` + `OrderConfirmed` outbox row, one TX (D4a: saga NOT created here) |
| Start saga | FulfillmentSaga | strong | created on `OrderConfirmed`; `STARTED→AWAITING_PAYMENT` + `PaymentRequested` outbox |
| Settle payment | Payment | strong | `Payment.create`+mock-settle + outcome outbox row, one TX (Payment BC) |
| Saga on PaymentSucceeded | FulfillmentSaga + Order | strong (one TX, same BC) | `→AWAITING_SHIPMENT`, `Order→PENDING_SHIPMENT` + `ShipmentRequested` outbox (D4b) |
| Dispatch shipment | Shipment | strong | `Shipment.create`+mock-dispatch + outcome outbox, one TX (Shipment BC) |
| Saga on ShipmentDispatched/Delivered | FulfillmentSaga + Order | strong (one TX, same BC) | `Order→SHIPPED`/`DELIVERED`, saga `→COMPLETED` |
| **Full fulfillment (Confirm→Delivered)** | Order, Payment, Shipment, Saga | **eventual** | spans many TXs linked by outbox events; customer sees `PENDING_SHIPMENT` in-flight |
| CancelOrder (paid, pre-dispatch) | Order, Saga, then Payment | **compensation** | saga `→COMPENSATING`, `RefundRequested`→`Payment.refund`→`RefundIssued`→Order `CANCELLED` |
| Shipment/payment failure | per flow above | **compensation** | saga-driven refund/cancel |

Boundary values: `strong` (single TX) / `eventual` (separate TXs, event-linked) / `compensation` (saga undo step required).

---

## Use Cases

### BC-1: Order (HTTP-triggered)
| Action | Type | Actor | Input | Output | Notes |
|---|---|---|---|---|---|
| CreateOrder | Command | Customer | customerId, items[] | orderId | `PENDING`, records `OrderPlaced` |
| ConfirmOrder | Command | Customer | orderId | void | `PENDING→CONFIRMED` + `OrderConfirmed` outbox (saga NOT created here — D4a) |
| CancelOrder | Command | Customer/Operator | orderId | void | allowed until dispatch; routes through saga compensation if paid (D6a) |
| GetOrder | Query | any | orderId | OrderReadModel | bypasses domain, `OrderQueryPort`; includes denormalized payment/shipment status |

### BC-1: FulfillmentSaga (event-triggered — no HTTP)
| Handler | Reacts to | Effect |
|---|---|---|
| StartSaga | `OrderConfirmed` | create saga `AWAITING_PAYMENT`, emit `PaymentRequested` |
| OnPaymentSucceeded | `PaymentSucceeded` | `→AWAITING_SHIPMENT`, `Order→PENDING_SHIPMENT`, emit `ShipmentRequested` |
| OnPaymentFailed | `PaymentFailed` | `Order→CANCELLED`, saga `→CANCELLED` |
| OnShipmentDispatched | `ShipmentDispatched` | `Order→SHIPPED`, record `OrderShipped` |
| OnShipmentDelivered | `ShipmentDelivered` | `Order→DELIVERED`, saga `→COMPLETED`, record `OrderDelivered` |
| OnShipmentFailed | `ShipmentFailed` | `→COMPENSATING`, emit `RefundRequested` |
| OnRefundIssued | `RefundIssued` | `Order→CANCELLED`, saga `→CANCELLED` |
| OnTimeout (Scheduler) | `@Interval` tick | for sagas past `awaiting*Until`: emit `OrderTimedOut` + compensate by progress |

### BC-2: Payment (event-triggered)
| Handler | Reacts to | Effect |
|---|---|---|
| ProcessPayment | `PaymentRequested` | `Payment.create()`; charge via gateway ACL; `succeed()`/`fail()` → outcome event |
| ProcessRefund | `RefundRequested` | `Payment.refund()` (from `SUCCEEDED`) → `RefundIssued` |
| GetPayment | Query | `PaymentQueryPort` (inspection) |

### BC-3: Shipment (event-triggered)
| Handler | Reacts to | Effect |
|---|---|---|
| ProcessShipment | `ShipmentRequested` | `Shipment.create()`; dispatch via carrier ACL; `dispatch()`/`fail()` → outcome event |
| CancelShipment | `ShipmentCancelRequested` (compensation) | `fail()` a not-yet-dispatched shipment |
| GetShipment | Query | `ShipmentQueryPort` (inspection) |

> Only `Order` exposes write endpoints. Payment and Shipment are driven entirely by events; their `GET` endpoints exist for inspection/debugging.

---

## Expected API Endpoints

| Method | Path | Action | Actor |
|---|---|---|---|
| POST | `/orders` | CreateOrder | Customer |
| POST | `/orders/:id/confirm` | ConfirmOrder | Customer |
| POST | `/orders/:id/cancel` | CancelOrder | Customer/Operator |
| GET | `/orders/:id` | GetOrder (incl. payment/shipment status) | any |
| GET | `/payments/:id` | GetPayment (inspection) | Operator |
| GET | `/shipments/:id` | GetShipment (inspection) | Operator |

> Force-fail for testing compensation is driven by the D4c mock hook (sentinel amount / config), not a public endpoint. No `POST /payments` or `POST /shipments` — those aggregates are created only by their event handlers.

---

## Service Placement

| Behavior | Location | Reason |
|---|---|---|
| Order/Payment/Shipment state transitions | Domain Method (`Order.*`, `Payment.*`, `Shipment.*`) | rule internal to a single Aggregate |
| Order total recomputation | Domain Method (`Order`) | Aggregate-internal invariant |
| **Saga orchestration policy** (next step / which compensation) | **Domain Method** on `FulfillmentSaga` (`onPaymentSucceeded`, `onShipmentFailed`, `onTimeout`, …) — **pure** | the process policy is domain knowledge (D1); pure + unit-testable |
| Loading aggregates, dedup check, writing outbox | Application (event/command handlers, `@Transactional()`) | orchestration & persistence, not a rule |
| Outbox relay (poll + publish + stamp) | Infra (`OutboxRelayService`, `@Interval`) | technical delivery mechanism (D2) |
| Saga timeout Scheduler (poll deadlines) | Application/Infra in the saga module (`@Interval`) | the "Scheduler/system actor"; drives `onTimeout` (D6) |
| Charge / refund / dispatch via external system | Infra adapter behind a Port (gateway/carrier ACL) | external I/O, translated at the boundary (D5) |
| Event→outbox serialization | Infra (repository, same TX as save) | mechanical, keeps state+events atomic (D2b) |

> `FulfillmentSaga` is a **pure domain Process Manager** in `order/domain/models/`. Its methods take facts (e.g. `paymentId`, `now`) as arguments and return/record the next message to emit; they never import application Ports or infra (CLAUDE.md layer rule). The application handler supplies the facts and persists the result + outbox row.

---

## Domain Events (full table)

All cross-step messages flow through the **outbox** (D2) and are deduped by **message-id** (D3). `idempotency key` below is the natural business id carried in the payload; the actual dedup key is the outbox `message_id` per consumer.

| Event | Publisher BC | Subscriber | Mechanism | Failure Policy | Business id |
|---|---|---|---|---|---|
| `OrderPlaced` | Order | (read model) | outbox | retry, then log | orderId |
| `OrderConfirmed` | Order | FulfillmentSaga | outbox | retry, then dead-letter | orderId |
| `PaymentRequested` | Order (saga) | Payment | outbox | retry, then dead-letter | orderId |
| `PaymentSucceeded` | Payment | FulfillmentSaga | outbox | retry, then dead-letter | paymentId |
| `PaymentFailed` | Payment | FulfillmentSaga | outbox | retry, then dead-letter | paymentId |
| `ShipmentRequested` | Order (saga) | Shipment | outbox | retry, then dead-letter | orderId |
| `ShipmentDispatched` | Shipment | FulfillmentSaga | outbox | retry, then dead-letter | shipmentId |
| `ShipmentDelivered` | Shipment | FulfillmentSaga | outbox | retry, then dead-letter | shipmentId |
| `ShipmentFailed` | Shipment | FulfillmentSaga | outbox | retry, then dead-letter | shipmentId |
| `OrderShipped` | Order (saga) | (read model) | outbox | retry, then log | orderId |
| `OrderDelivered` | Order (saga) | (read model) | outbox | retry, then log | orderId |
| `OrderCancelled` | Order (saga) | (read model) | outbox | retry, then log | orderId |
| `RefundRequested` | Order (saga) | Payment | outbox | retry, then dead-letter | orderId |
| `RefundIssued` | Payment | FulfillmentSaga | outbox | retry, then dead-letter | paymentId |
| `ShipmentCancelRequested` | Order (saga) | Shipment | outbox | retry, then dead-letter | orderId |
| `OrderTimedOut` | Order (saga/Scheduler) | FulfillmentSaga | outbox | retry, then dead-letter | orderId |

> Publish mechanism is `outbox` for everything (Advanced default). `retry, then dead-letter` is a sketch: the relay re-delivers unpublished rows; a row exceeding N attempts would be flagged for manual review (dead-letter table is a stretch goal, not required).

---

## Open Questions / Tier Limits

- **In-process bus, single DB**: outbox + relay run inside one NestJS modular monolith with one shared database. Real brokers (Kafka/RabbitMQ) and per-service DBs are out of scope; the patterns (outbox, idempotency, saga) are identical regardless.
- **Dead-letter / max-retries**: modeled as a "retry then flag" sketch. A real dead-letter table + retry counter is a stretch goal, not required to pass the tier.
- **No partial payments / multiple attempts**: one `Payment` per Order, full refund only (mirrors intermediate). Partial refunds out of scope.
- **Cancel after SHIPPED**: rejected (D6a). A return/refund-after-delivery flow is intentionally out of scope.
- **Relay single point of failure**: one shared relay (D2). Production would shard per `aggregate_type`.
- **Saga + Order in one TX (D4b)**: pragmatic, justified by same-BC + 1:1 keying. The purist one-aggregate-per-TX alternative is noted but not used.
- **Read model**: `GetOrder` reads denormalized `paymentStatus`/`shipmentStatus` on the Order table (Phase 4); no synchronous cross-BC query port.
