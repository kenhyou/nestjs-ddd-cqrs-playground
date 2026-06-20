# Phase 3 — Bounded Contexts

Decided after a four-role concurrent debate. Raw notes: [debates/bc-boundary-saga-placement.md](debates/bc-boundary-saga-placement.md).

**Final split: 3 Bounded Contexts** — Order (containing the Fulfillment Saga as a separate module), Payment, Shipment. The Transactional Outbox is shared infrastructure, not a BC. No Notification BC (out of scope).

---

## BC-1: Order

- **Responsibility**: Owns the customer's purchase intent and the Order lifecycle (PENDING → CONFIRMED → PENDING_SHIPMENT → SHIPPED → DELIVERED, with CANCELLED reachable via cancel/compensation/timeout). Owns `Order` + `OrderItem`. **Also hosts the Fulfillment Saga / Process Manager** as a separate `FulfillmentSagaModule` within this BC: it reacts to Payment/Shipment events and drives compensating commands, timeouts, and retries.
- **Included concepts**: Order, OrderItem, order status/state machine, order total, confirm/cancel, FulfillmentSaga (correlation state, step counters, `expectedPaymentBy`/`expectedShipmentBy` timeouts), OrderTimedOut.
- **Excluded concepts**: payment settlement details (Payment BC), physical movement / carrier tracking (Shipment BC), the mocked gateway/carrier data models (behind ACLs in their respective BCs).
- **Owning Subdomain**: Core (Order) + Core (Fulfillment Orchestration).
- **Autonomy level**: independently deployable. The saga is a separate NestJS module *within* this BC for scheduler/timeout/failure isolation, but not a separate Bounded Context.

## BC-2: Payment

- **Responsibility**: Owns the financial act of settling an obligation for an order. Handles `PaymentRequested`, produces `PaymentSucceeded` / `PaymentFailed`, and issues `RefundIssued` when the saga compensates. Wraps the mocked payment gateway behind an Anti-Corruption Layer.
- **Included concepts**: Payment aggregate, payment state machine (REQUESTED → SUCCEEDED → REFUNDED; REQUESTED → FAILED), charge amount, refund, gateway ACL/adapter.
- **Excluded concepts**: order lifecycle and the decision of *when* to compensate (Order BC / saga); shipment.
- **Owning Subdomain**: Supporting (Payment) + Generic (gateway integration, behind ACL).
- **Autonomy level**: independently deployable. References the Order by `orderId` only; never imports Order internals — Conformist on the published event language.

## BC-3: Shipment

- **Responsibility**: Owns the physical movement of goods. Handles dispatch, produces `ShipmentDispatched` / `ShipmentFailed`, and tracks delivery. Wraps the mocked carrier behind an Anti-Corruption Layer.
- **Included concepts**: Shipment aggregate, shipment state machine (PENDING → DISPATCHED → DELIVERED; PENDING → FAILED), tracking/carrier status, carrier ACL/adapter.
- **Excluded concepts**: payment/refund (Payment BC); order intent and saga orchestration (Order BC).
- **Owning Subdomain**: Supporting (Shipment) + Generic (carrier integration, behind ACL).
- **Autonomy level**: independently deployable. References the Order by `orderId` only; Conformist on the published event language.

---

## Shared Infrastructure (not a Bounded Context)

- **Transactional Outbox**: a shared `OutboxModule` (single `outbox_events` table + relay). Each BC appends event rows inside the same `@Transactional()` as its aggregate change; one relay delivers at-least-once; subscribers dedupe on an idempotency key. Treated as technical infrastructure, not a domain BC.

---

## BC Split Decision Rationale (written by the user)

- Order: Order has its own state transitions. Also it is the core entity that drives other entities. Saga management of state transitions are mainly related to Order state in the end.
- Payment: It has its own state transitions.
- Shipment: It has its own state transitions.
