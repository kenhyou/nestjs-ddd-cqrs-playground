# Strategic Design — Order Management (Basic Tier)

> Status: Completed

---

## 1. Domain Discovery

**Domain**: Order Management (Basic Tier)
**Actors**: Customer (Primary)
**Tier**: Basic — Single Aggregate Root, linear state machine, single BC

**Domain Events**: OrderPlaced / ItemAddedToOrder / OrderConfirmed / OrderCancelled / OrderShipped

**State Machine**:
```
PENDING ──→ CONFIRMED ──→ SHIPPED
   │              │
   └──────────────┴──→ CANCELLED
```

**Out of Scope**: Payment, real shipping, inventory reservation, auth, notifications, statistics

→ Details: [01-discovery.md](01-discovery.md)

---

## 2. Subdomain Classification

| Subdomain | Classification | Notes |
|-----------|---------------|-------|
| Order Lifecycle | Core | Order creation, confirmation, cancellation |
| Order Item Composition | Core | Item composition rules |
| Order State Transition | Supporting | Assists the Core with state transitions |
| Order Total Calculation | Generic | Generic arithmetic operations |

→ Details: [02-subdomains.md](02-subdomains.md)

---

## 3. Bounded Contexts

**Single BC: Order Management**

```
Order Management BC
└── Order (Aggregate Root)
    └── OrderItem (Child Entity)
```

- Invariants ("at least one item", "no modification after CONFIRMED") are protected solely by the Order Aggregate
- `OrderItem` is only manipulated through `Order`
- `customerId`: treated as a plain string in the Basic Tier (no CustomerPort declared)

→ Details: [03-bounded-contexts.md](03-bounded-contexts.md)

---

## 4. Context Map

**Relationships between BCs**: None (single BC)

**External relationships**:

| Relationship | Pattern |
|--------------|---------|
| Client → Order BC | Open Host Service + Published Language |
| Order BC → Inventory/Payment/Shipment | Customer/Supplier + ACL (from Intermediate onwards) |
| Order BC → Notification | Separate Ways |

→ Details: [04-context-map.md](04-context-map.md)

---

## 5. Ubiquitous Language

**Core terms**:
- **Order**: An officially accepted purchase intent — not a shopping cart
- **Confirmation**: An operational decision to fulfill — not payment, not a customer's order lookup
- **Cancellation**: A halt of fulfillment, only allowed from PENDING/CONFIRMED — not refund/return
- **Shipped**: A status flag marking entry into shipping — not actual physical delivery completion

**Watch out for same-word-different-meaning**: "cancel", "confirm"

→ Details: [05-ubiquitous-language.md](05-ubiquitous-language.md)

---

## 6. Reflection

**What changed in my thinking**

- **Correct guess**: Treating Order as a BC was right.
- **Revised guess**: I initially thought of OrderItem as an independent BC, but it ended up being a part of Order (a child Entity). OrderItem cannot exist independently without Order, and I learned that protecting invariants ("no modification after CONFIRMED", etc.) atomically requires being inside the same transactional boundary.
- **Biggest learning**: I realized during the design phase that the Domain Expert, Solution Architect, Tech Lead, and Product Owner each hold different positions. They view the same problem from different angles, and better designs emerge from those differences.
