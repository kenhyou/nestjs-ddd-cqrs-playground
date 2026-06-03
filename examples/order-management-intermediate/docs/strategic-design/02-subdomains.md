# Phase 2 — Subdomain Classification

**Decision date**: 2026-05-29
**Decision**: Option A — 2 Subdomains
**Decided by**: User (Ken)

## Final Subdomains

### S1: Order Fulfillment — **Core**

- **Responsibility**: Decides what the Customer ordered, what state it is in, and when it can be cancelled. Owns the Order lifecycle (PENDING → CONFIRMED → SHIPPED, CANCELLED).
- **Why Core**: "What state is the order in" is the very reason this business exists. The Order lifecycle rules cannot be defined on its behalf by any other domain.

### S2: Payment Settlement — **Supporting**

- **Responsibility**: Tracks payment requests for an Order and enforces the state-transition rules (REQUESTED → SUCCEEDED → REFUNDED, FAILED).
- **Why Supporting**: It has its own business rules, but this domain's competitive edge is not "how we collect money" — it is "where the order is." Payment processing itself is an area that will eventually be replaced by an external gateway, and it is mocked in this tier.

## Discussion Summary

### Two Role Views (raw)

- **Domain Expert** proposed 2 Subdomains, treating SHIPPED as a status flag inside Order Fulfillment.
- **Product Owner** proposed 3 Subdomains, separating Fulfillment Status as Generic.

### Key Difference

"Should the SHIPPED state be a separate Subdomain, or part of Order Fulfillment?"

### Decision Rationale (user)

In this tier, SHIPPED is merely a status flag and does not carry enough business value to warrant separation as its own semantic unit. A Generic Subdomain is more naturally addressed in the Advanced tier, where real carrier integration / shipping systems come in. Therefore Option A is adopted.

## Polysemy / Vocabulary Notes (for Phase 5 UL)

Polysemy cautions raised by the Domain Expert — to be reflected in the Phase 5 Ubiquitous Language work.

### 1. "Cancel" — two different actions

- **Order Cancellation**: Occurs within Order Fulfillment. A Customer/Operator withdraws an order that has not yet shipped. Event: `OrderCancelled`.
- **Payment Cancellation/Void** (a real-world domain concept): Occurs within Payment Settlement. Withdrawal before the payment is approved.
  - In this project's scope it is folded into `PaymentFailed`, but **in reality "cancel" and "fail" mean different things**. This must be made explicit in the UL.

### 2. "Refund" — a different event from Order cancellation

- A refund is a state transition that can be initiated only on a Payment in the SUCCEEDED state.
- An Order moving to CANCELLED and a Payment moving to REFUNDED are **separate events**, each meaningful independently within its own Subdomain.
- There may be an ordering between them, but they are not the same action.

## Release Order (from Product Owner, retained as reference)

1. **P0** — Order Lifecycle (S1) first. Without the order state machine there is no product at all.
2. **P1** — Payment Settlement (S2). MVP = S1 + S2 together.
3. ~~P2 — Fulfillment Status~~ (not a separate Subdomain → folded into S1 as the SHIPPED flag in this tier)
