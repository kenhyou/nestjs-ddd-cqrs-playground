# Phase 2 — Subdomain Classification

Roles consulted independently (outputs hidden from each other): **Domain Expert** (business meaning) + **Product Owner** (business value / release priority).

## Classification Table

| Subdomain | Type | Rationale | Differentiator |
|---|---|---|---|
| **Order** | Core | Richest domain vocabulary; the lifecycle (PENDING → CONFIRMED → SHIPPED → DELIVERED, CANCELLED) is the spine every event is framed against. `PaymentRequested`, `ShipmentDispatched`, `RefundIssued` are all "for/against an Order". | yes |
| **Fulfillment Orchestration (Saga)** | Core | Encodes the business policy of *what must happen, in what order, and what must be undone* — happy path, compensation, timeout. Has its own language. The defining complexity of the advanced tier. | yes |
| **Payment** | Supporting | Real internal complexity (requested/succeeded/failed/refunded) but exists in service of the Order lifecycle. Refund is a Payment state transition, not a separate subdomain. | no |
| **Shipment** | Supporting | Own state machine (dispatched/delivered/failed) but its purpose is answering "did the customer receive the order?" | no |
| **External Integrations** (mocked payment gateway + carrier) | Generic | Off-the-shelf in reality (Stripe, EasyPost); zero differentiation; deliberately thin stubs reached only through an Anti-Corruption Layer. | no |

## Decision Rationale (summarizing the user's decisions)

Both the Domain Expert and Product Owner independently surfaced **Fulfillment Orchestration / Saga** as a distinct subdomain not present in the initial guess, and both classified it **Core**. The user adopted this: in an advanced playthrough whose entire purpose is the orchestration, naming the saga as its own Core subdomain forces it to be a first-class design concern rather than buried inside Order. Important nuance recorded for Phase 3: **a subdomain is not a Bounded Context** — the saga is expected to be *implemented inside the Order BC* (the PRD states the Order BC owns the Saga), so this Core subdomain may not become its own deployable context. That subdomain≠BC gap is an intentional learning point.

The user accepted the Product Owner's argument that the mocked **payment gateway + carrier** form a **Generic** subdomain (off-the-shelf, behind an ACL), reinforcing the ACL learning goal. Per the user's call, **Refund / Compensation** is *not* a separate subdomain — it is absorbed into Payment (as a state transition) plus the Saga (which decides when to compensate).
