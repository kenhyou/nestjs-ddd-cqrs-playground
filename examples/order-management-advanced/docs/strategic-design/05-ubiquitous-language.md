# Phase 5 — Ubiquitous Language

Role: **Domain Expert**.

## Order BC Glossary

| Term | Definition (in this BC) | Meaning in other BCs |
|---|---|---|
| Order | The root aggregate representing a customer's purchase intent, owning a lifecycle from PENDING to DELIVERED or CANCELLED. | Not present. |
| OrderItem | A child entity of Order: one line of the purchase — product, quantity, agreed unit price at placement. | Not present. |
| Confirmed | The state an Order enters after the customer's intent is locked and payment has been requested. Goods are not yet secured; confirmation = committed to pursuing fulfillment. | In Payment BC, "confirmed" is not a state. In Shipment BC, it does not exist. |
| Fulfillment Saga | The process object that orchestrates payment, then shipment, across BCs. Not an Order state — a coordinator living alongside the Order. | Not present by name. |
| Compensation | A deliberate reversal the saga triggers when a downstream step fails after an earlier one succeeded (e.g. refund after payment succeeded but shipment failed). | In Payment BC this manifests as a Refund (a payment concept with its own rules). The word "compensation" belongs to the saga. |
| Timeout | A saga policy: if a downstream BC does not respond within a window, the saga treats the step as failed and begins compensation. | Not used elsewhere. |
| Correlation | The identifier linking all saga steps back to the same Order, so incoming BC events route to the correct in-flight instance. | Payment calls it a reference ID; Shipment an order reference. The saga owns the canonical concept. |
| In-Flight State | The persisted checkpoint of a running saga instance: which step completed, which is pending, whether compensation began. | Not present. |

## Payment BC Glossary

| Term | Definition (in this BC) | Meaning in other BCs |
|---|---|---|
| Payment | The aggregate representing one attempt to collect money for an Order — a discrete financial record, not a workflow step. | Order BC uses "payment" loosely to mean "the payment phase of fulfillment" — a different idea. |
| Amount | The exact monetary figure the BC is authorized to collect or has collected (currency + value). | Order BC's amount = sum of OrderItem prices. Must agree at creation but can diverge after a partial refund. |
| Settlement | The transition REQUESTED → SUCCEEDED: money actually moved, not merely requested. | Not used elsewhere. |
| Refund | A reversal producing a REFUNDED Payment, with its own audit trail. Not simply "undoing" an Order. | Order BC uses "cancel" when the customer rescinds. Refund is Payment's consequence of that cancellation. |
| Failed | The gateway declined or the request timed out; terminal, a new Payment may be attempted. | Shipment BC also uses "failed" but for a carrier dispatch failure. Local to each BC. |
| Gateway | The external interface behind the ACL through which payment instructions leave the BC. | Not present. |

## Shipment BC Glossary

| Term | Definition (in this BC) | Meaning in other BCs |
|---|---|---|
| Shipment | The aggregate for one physical dispatch of goods: parcel, carrier, tracking reference, lifecycle. | Order BC knows only that "shipment was requested"; it does not model the Shipment aggregate. |
| Dispatch | The moment PENDING → DISPATCHED: the carrier accepted the parcel and a tracking number exists. | Not used elsewhere. |
| Pending | Request received but the carrier has not yet confirmed pickup. | Order uses PENDING_SHIPMENT (waiting for this BC to start); Payment's REQUESTED plays a structurally similar role. Three BCs, three waiting situations. |
| Delivered | The carrier confirms the parcel reached the recipient — a Shipment terminal state. | Order BC also reaches DELIVERED, but that is triggered *downstream* by a ShipmentDelivered event — not the same state. |
| Carrier | The external logistics partner behind the ACL (Shipment's analogue of Payment's Gateway). | Not present. |
| Failed | The carrier could not collect or deliver. | Payment BC also uses FAILED, for a declined payment. Same word, separate failure domains. |

## Same Word, Different Meaning

The core learning payoff of the BC split. Conflating any of these would cause a real bug.

- **"Pending"** — Order: the very first state before any action. Shipment: waiting on the carrier. Payment's equivalent waiting state is REQUESTED, not PENDING. A shared `pending` enum/event loses which boundary you're in, so a listener can't know whether to act.
- **"Confirmed"** — Order: committed to fulfillment, *payment merely requested* (says nothing about money moving). A payment person hears "confirmed" as *payment settled*. A rule "only ship confirmed orders" is ambiguous: `Order.status = CONFIRMED` vs `Payment.status = SUCCEEDED`? The bug: goods dispatched before payment clears.
- **"Amount"** — Order: sum of line items at placement, frozen in OrderItems. Payment: the value authorized through the gateway. A partial refund changes the Payment amount without changing the Order amount. Code reading "the amount" without knowing the BC computes wrong reconciliation totals.
- **"Cancel" vs "Refund"** — Order: cancel transitions an Order to CANCELLED. Payment: refund produces a REFUNDED Payment. Different operations on different aggregates. A cancellation does **not** automatically produce a refund — none exists if payment never settled. Conflating them produces phantom refunds, or misses the refund when an Order is cancelled after settlement.
- **"Failed"** — Payment: gateway declined/timed out (may trigger a retry payment). Shipment: carrier could not dispatch/deliver (may trigger re-dispatch or full Order cancellation). A saga listening for a generic "failed" event can't pick the right compensation branch.
