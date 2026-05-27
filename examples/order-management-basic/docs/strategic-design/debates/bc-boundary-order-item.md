# BC Boundary Debate — Splitting Order vs OrderItem

> Phase 3 discussion record

---

## The Question

Should OrderItem live in the same BC as Order, or be split into a separate BC?

## Position by Role

| Role | Position | Key Reason |
|------|----------|------------|
| Domain Expert | Single BC | Same language community; OrderItem has no meaning without Order |
| Solution Architect | Single BC | Invariants (at least one item, no modification after CONFIRMED) can only be enforced inside the same transactional boundary |
| Tech Lead | Single BC | Splitting risks `forwardRef` circular dependencies and adds operational overhead |
| Product Owner | Single BC | Same team, same release cycle — splitting only creates release coupling |

## Final User Decision

**Single BC (Order Management)**

> "I think OrderItem is best managed within the boundary called Order."

## Additional Learning Points

- `forwardRef()` is NestJS syntax, but in spirit it concretizes the DDD principle of unidirectional BC dependencies at the code level
- The vocabulary `Item` could collide with a future Inventory/Catalog BC — vocabulary-boundary awareness is needed
