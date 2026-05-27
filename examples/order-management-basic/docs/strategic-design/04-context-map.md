# Phase 4 — Context Map

---

## Structural Summary

The Basic Tier has a single BC, so there are no BC-to-BC relationships. All external systems are Out of Scope (mocked).

```
[Client]
    │  Open Host Service (REST API / Published Language)
    ▼
[Order Management BC]
    │          │          │          │
[Identity]  [Inventory] [Payment] [Shipment]
 (mocked)    (mocked)   (mocked)   (mocked)
```

---

## Relationship Definitions

| Relationship | Pattern | How It's Handled |
|--------------|---------|------------------|
| Client → Order BC | Open Host Service + Published Language | REST API; DTO plays the role of the Published Language |
| Order BC → Inventory | Customer/Supplier + ACL (future) | From Intermediate onwards — omitted for now |
| Order BC → Payment | Customer/Supplier + ACL (future) | From Intermediate onwards — omitted for now |
| Order BC → Notification | Separate Ways | Events are published only; no subscribers |

---

## User Decision

**`customerId`: treat as a plain string**

- No `CustomerPort` declared in the Basic Tier
- Add the Port when needed during the Intermediate transition
- Rationale: as long as external customer attributes do not flow into the Order domain, an ACL is unnecessary

---

## Cautions for Future Extension

- When integrating Inventory/Payment → a Port (abstract class) must be declared in `application/ports/`
- The `Item` vocabulary: in this BC it means "an order line"; in an Inventory BC it means "a stock unit" — translation in the ACL will be required
