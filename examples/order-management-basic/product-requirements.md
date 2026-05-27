# Product Requirements Document
# Order Management — Basic Tier

## 1. Overview

A single-BC order management system where customers create orders, add items, and confirm or cancel them.

**Target Learning Pattern**: A single Aggregate Root containing child Entities, a linear state machine, and basic VO patterns.

---

## 2. Scope

### In Scope

- An `Order` Aggregate Root owning a collection of `OrderItem` Entities
- Order creation, item add/remove
- Order confirmation (PENDING → CONFIRMED)
- Order cancellation (PENDING or CONFIRMED → CANCELLED)
- A shipping status flag (CONFIRMED → SHIPPED, no real shipping integration)

### Out of Scope

- Payment processing
- Real shipping / carrier integration
- Inventory or inventory reservation
- Authentication / authorization
- Notifications
- Statistics / analytics

---

## 3. Actors

| Role | Description |
|------|-------------|
| **Customer** | The primary user who creates orders and checks their status |

---

## 4. Domain Events

| Event | Trigger |
|-------|---------|
| `OrderPlaced` | A new order is registered in the system in the PENDING state |
| `ItemAddedToOrder` | An item is added while the order is in PENDING |
| `OrderConfirmed` | The order is confirmed for fulfillment |
| `OrderCancelled` | The order is cancelled before shipping |
| `OrderShipped` | The order transitions to the shipped state (status flag) |

---

## 5. State Machine

```
PENDING ──→ CONFIRMED ──→ SHIPPED
   │              │
   └──────────────┴──→ CANCELLED
```

- `PENDING`: Initial state. Items can be added or removed.
- `CONFIRMED`: Confirmed state. Shipping can be processed.
- `SHIPPED`: Shipping completed (terminal state).
- `CANCELLED`: Cancelled (terminal state). Reachable from PENDING or CONFIRMED.

---

## 6. Core Business Rules

1. An order must have at least one item before it can be confirmed.
2. Items cannot be added or removed while the order is in CONFIRMED or SHIPPED state.
3. An order in SHIPPED state cannot be cancelled.
4. `OrderItem` must not be accessed directly from external code — it can only be manipulated through `Order`.
5. The order total is recomputed whenever items change.

---

## 7. Value Objects

| VO | Validation |
|----|------------|
| `OrderId` | UUID |
| `OrderItemId` | UUID |
| `Money` | Non-negative, same-currency arithmetic only, item summation |

---

## 8. BC Composition

| BC | Classification | Description |
|----|---------------|-------------|
| **Order Management** | Core | Order creation, state machine, total calculation |

---

## 9. Core Learning Goals

- Aggregate Root and child Entity: `Order` owns `OrderItem`; external code never touches `OrderItem` directly
- Independent ID VOs per Entity: `OrderId` vs `OrderItemId`
- `Money` VO: non-negative validation, same-currency arithmetic, item summation
- `Order` state machine: PENDING → CONFIRMED → SHIPPED; CANCELLED reachable from PENDING/CONFIRMED
- Separating `create()` and `reconstitute()` factories — new orders start in PENDING, restored orders keep their stored state

---

## 10. Discovery Answers (Pre-baked)

1. **Primary/Secondary Users**: Customer / N/A
2. **Domain Events**: OrderPlaced, ItemAddedToOrder, OrderConfirmed, OrderCancelled, OrderShipped
3. **KPIs**: N/A (learning project)
4. **Differentiation**: N/A (learning project)
5. **Out of Scope**: Payment, real shipping, inventory reservation, auth, notifications, statistics
