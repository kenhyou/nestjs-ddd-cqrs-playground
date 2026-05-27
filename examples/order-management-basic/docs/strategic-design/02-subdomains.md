# Phase 2 — Subdomain Classification

---

## Final Classification (User Decision)

| Subdomain | Classification | Description |
|-----------|---------------|-------------|
| **Order Lifecycle** | Core | Order creation, confirmation, cancellation — the heart of the business value |
| **Order Item Composition** | Core | Order item composition rules — the policy that drives service trust |
| **Order State Transition** | Supporting | State-transition rules — a supporting role for executing the Core correctly |
| **Order Total Calculation** | Generic | Total calculation — generic arithmetic |

---

## Rationale

1. **OrderItem as a separate subdomain**: Item composition rules (changes allowed before confirmation, locked after) are an independent concern and were separated.
2. **State Transition is Supporting**: State transition itself is not the reason users choose the service — it plays a supporting role.

---

## Key Discussion Points

- Domain Expert: OrderItem is internal vocabulary to Order, so a separate subdomain is unnecessary
- Product Owner: OrderItem composition rules drive service trust, so they should be split out as Core
- User's final decision: **Split into a separate subdomain**
