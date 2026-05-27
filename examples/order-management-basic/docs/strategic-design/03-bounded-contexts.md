# Phase 3 — Bounded Context Identification

---

## Final BC Composition (User Decision)

| BC Name | Classification | Responsibilities |
|---------|---------------|------------------|
| **Order Management** | Core | Order creation, item composition, state transitions, total calculation |

---

## Internal Structure

```
Order Management BC
└── Order (Aggregate Root)
    └── OrderItem (Child Entity)
```

- `OrderItem` is manipulated only through `Order` — no direct external access
- State transitions (PENDING → CONFIRMED → SHIPPED / CANCELLED) are protected inside the Order Aggregate
- Total calculation is recomputed inside Order whenever items change

---

## Rationale for the User's Decision

> "I think OrderItem is best managed within the boundary called Order."

The core reasons all four roles recommended a single BC:
- Invariants ("at least one item", "no modification after CONFIRMED") can only be enforced atomically within the same transactional boundary
- Splitting would create circular dependencies between BCs → would require `forwardRef()` → a design anti-pattern

---

## Vocabulary-Boundary Cautions

- `Item`: in this BC means "an order line belonging to a specific Order"
- In a future Inventory/Catalog BC, `Item` would mean "a stock unit" or "a product master" — beware of vocabulary collisions

---

## Discussion Record

→ [debates/bc-boundary-order-item.md](debates/bc-boundary-order-item.md)
