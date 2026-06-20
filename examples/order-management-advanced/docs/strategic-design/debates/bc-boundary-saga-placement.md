# Phase 3 Debate — BC Boundaries (focus: Saga placement)

Date: 2026-06-03. Four roles invoked concurrently, blind to each other, 300-word cap.

## Consensus across all four roles

Three domain BCs: **Order**, **Payment**, **Shipment**. Each owns its own aggregate(s) and data; cross-BC references are by **ID only**; collaboration is **event-driven** (no synchronous cross-BC command calls on the fulfillment path).

## The one real conflict: where does the Saga / Process Manager live?

| Role | Position on the Saga | Core argument |
|---|---|---|
| **Domain Expert** | Inside the **Order BC** | The Saga's vocabulary is entirely Order-shaped ("is this order ready for payment?", "has this order timed out?"). It holds no Payment/Shipment concepts of its own; it speaks Order. |
| **Solution Architect** | **Co-deployed with Order BC** | The Saga is the upstream publisher; Payment/Shipment are downstream. Extracting it forces the Saga to read Order state to compensate → Customer/Supplier dependency back into Order = the exact cyclic coupling it was meant to avoid. |
| **Tech Lead** | Its **own NestJS module** (`FulfillmentSagaModule`), separate from `OrderModule` | Operational: the Saga owns timeout state (`expectedPaymentBy`), retry counters, and the Scheduler (`@Interval`). Those don't belong on the Order aggregate. Failure isolation: a throwing scheduler shouldn't block Order command handling. Saga has its own state machine (STARTED → PAYMENT_PENDING → … → COMPLETED/COMPENSATING/CANCELLED). |
| **Product Owner** | **Bundle with Order in Wave 1** | Saga's lifecycle is exactly as long as the Order's. Splitting before Wave 1 ships creates a release dependency with zero added user value. Separation is a later "BC extraction practice" refactor, not an MVP requirement. |

**Reconciliation note:** Tech Lead argues about NestJS *modules*, the other three about *Bounded Contexts*. These are not the same level. A single BC can contain multiple modules. So "Saga is part of the Order BC" (DE/SA/PO) and "Saga is its own module" (TL) can both be true: the Saga belongs to the **Order BC** but may be implemented as a **separate module** (`FulfillmentSagaModule`) within that context for timeout/scheduler isolation.

## Other notable role outputs

- **Solution Architect — relationship patterns (Phase 4 seed):** Order→Payment and Order→Shipment = **Customer/Supplier** (Order drives the event contract). Payment→gateway and Shipment→carrier = **ACL**. Shared event schemas = **Published Language**. Payment/Shipment are **Conformist** on the published event shapes; they never import Order.
- **Tech Lead — Transactional Outbox (Phase 4 seed):** one shared `OutboxModule` (infrastructure, not a BC): single `outbox_events` table (`id, aggregate_id, event_type, payload, occurred_at, published_at, idempotency_key`). Each domain module appends rows inside its own `@Transactional()`. One relay (`@Interval`) delivers at-least-once; subscribers dedupe on `idempotency_key`.
- **Tech Lead — transaction boundaries:** PlaceOrder / ConfirmOrder / ProcessPayment / DispatchShipment / Saga-step-advance each = one `@Transactional()` that writes the aggregate change + the outbox row together. Never span a transaction across two BC modules.
- **Product Owner — release waves:** Wave 1 = Order + Saga + Outbox + timeout/compensation (the actual learning objective). Wave 2 = Payment + Shipment (buildable in parallel). Wave 3 = optional Notification BC (deferred; out of PRD scope).
- **Domain Expert — same-word-different-meaning (Phase 5 seeds):**
  - **"amount"**: in Order = sum of line items (what the customer chose); in Payment = the charge submitted to the gateway (can diverge with coupons/partial payment). Must never be the same field.
  - **"confirmed"**: a real state in Order; the word does not exist in Payment (requested/succeeded/failed/refunded) or Shipment (dispatched/delivered).
  - **"status"**: in Order = commercial/lifecycle state; in Shipment = physical location in the carrier network; in Payment = settlement state.
