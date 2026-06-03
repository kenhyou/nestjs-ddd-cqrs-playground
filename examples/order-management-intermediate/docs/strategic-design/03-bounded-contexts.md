# Phase 3 — Bounded Context Identification

**Decision date**: 2026-05-29
**Decided by**: User (Ken)

## Final Bounded Contexts

### BC-1: Order

- **Subdomain**: Order Fulfillment (Core)
- **Core Aggregate**: `Order` (Aggregate Root) + `OrderItem` (child Entity within the same Aggregate)
- **Responsibility**: The Customer bundles products and declares them as an order unit, and owns that order's lifecycle (PENDING → CONFIRMED → SHIPPED, CANCELLED).
- **Internal vocabulary**: Order, OrderItem, OrderId, OrderItemId, OrderStatus, OrderTotal, OrderPlaced, OrderConfirmed, OrderCancelled, OrderShipped
- **Boundary rationale**: Within this boundary, "cancel" means *withdrawing the intent to order* (customer intent). It does not need to know the actual flow of money. "Confirm" is the moment the customer and the business align on the intent to fulfill.

### BC-2: Payment

- **Subdomain**: Payment Settlement (Supporting)
- **Core Aggregate**: `Payment`
- **Responsibility**: Performs monetary charge, settlement, and refund for a single Order, and records the resulting state.
- **Internal vocabulary**: Payment, PaymentId, PaymentStatus (REQUESTED / SUCCEEDED / FAILED / REFUNDED), Refund, Settlement
- **Boundary rationale**: Within this boundary the word "cancel" does not exist. The words it knows are *FAILED* and *REFUNDED*. "Refund" is a financial event where money actually moves, not a statement that an order was cancelled.

## Cross-BC Decisions

### D1: Transaction on order confirmation (Option A1)

**Decision**: Order confirmation (Order → CONFIRMED) and the creation of a new Payment record are in the **same transaction**.

- A single `@Transactional()` on `ConfirmOrderCommandHandler`.
- The Order state transition and the new Payment record are committed together.
- Rationale: this tier is synchronous, with no message queue. If split, it is possible to have an orphan state where only the Order is CONFIRMED but no Payment record exists → data integrity breaks. The Outbox pattern is an Advanced-tier learning topic.

### D2: Location of PaymentStatusQueryPort (Option B1)

**Decision**: `PaymentStatusQueryPort` is **defined in BC-1 (Order)'s `application/ports/`** and implemented in BC-2 (Payment)'s `infra/`.

- `OrderModule` does not import `PaymentModule` wholesale.
- `OrderModule` only brings in `TypeOrmModule.forFeature([PaymentOrmEntity])` and binds the Port.
- Rationale: keep the dependency direction one-way (Order → Payment). Avoid the pressure toward `forwardRef()`. Learn the pattern where a Cross-BC Port lets "the downstream consumer declare the information it needs in its own language."

### D3: Refund flow (Option C2 = stated in the PRD)

**Decision**: When an Order is cancelled, the refund is a **separate manual Operator action**, not an automatic Saga.

- `IssueRefundCommandHandler` transitions the Payment to REFUNDED.
- The Order transitions to CANCELLED via a separate `CancelOrderCommandHandler`.
- The two Commands are independent transactions.
- Rationale: stated in the PRD — an automatic Saga is an Advanced-tier learning topic. In this tier the Operator runs two explicit actions.

## Dependency Direction

```
BC-1 (Order) ─── creates Payment record (same TX, write) ───> BC-2 (Payment)
BC-1 (Order) ─── PaymentStatusQueryPort (read-only query) ──> BC-2 (Payment)
BC-2 (Payment) ─── stores orderId (plain column, no FK) ────> BC-1 (Order)
```

- Order is the active side (knows about and calls Payment).
- Payment is the passive side (does not know Order; stores only the ID).
- Runtime dependency: one-way (Order → Payment).

## Autonomy & Blast Radius

| When a BC fails | Impact on the other BC |
|---|---|
| Payment fails | The Order SHIPPED transition is blocked. Order creation/cancellation/lookup keep working |
| Order fails | Payment can still change state independently (no runtime Order reference) |

## Boundary Conflicts (Resolved)

- **OrderCancelled** → belongs to BC-1. An expression of customer intent, not a refund confirmation.
- **RefundIssued** → belongs to BC-2. Reverse movement of money, a financial event.
- **OrderShipped** → belongs to BC-1. In this tier, Shipment is not a separate BC but an Order status flag.

## Translation Points

- **OrderConfirmed → Payment creation**: the Order BC creates the Payment record in the same transaction. Only `orderId` crosses the boundary.
- **PaymentStatusQueryPort: Order reads Payment status**: Order defines the Port in its own language ("can this order be shipped?"). Payment infra returns `PaymentStatus` as-is. Order does not import Payment's internal model.
- **RefundIssued ↔ OrderCancelled**: each BC handles it independently via its own Command. The Operator runs the two Commands explicitly.

## Naming

- Keep BC names short: **`Order`** / **`Payment`** (to avoid confusion with the full domain name "Order Management").
- NestJS module names: `OrderModule`, `PaymentModule`.
- Directories: `src/order/`, `src/payment/`.
