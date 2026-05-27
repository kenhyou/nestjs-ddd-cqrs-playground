# Phase 1 — Domain Discovery

> Source: PRD (order-management-basic), Tier: Basic

---

## 1. Actors

| Role | Description |
|------|-------------|
| **Customer** (Primary) | The primary user who creates orders and checks their status |

---

## 2. Domain Events

| Event | Trigger |
|-------|---------|
| `OrderPlaced` | A new order is registered in the system in the PENDING state |
| `ItemAddedToOrder` | An item is added while the order is in PENDING |
| `OrderConfirmed` | The order is confirmed for fulfillment |
| `OrderCancelled` | The order is cancelled before shipping |
| `OrderShipped` | The order transitions to the shipped state (status flag) |

---

## 3. KPIs

N/A (learning project)

---

## 4. Differentiation

N/A (learning project)

---

## 5. Out of Scope

- Payment processing
- Real shipping / carrier integration
- Inventory or inventory reservation
- Authentication / authorization
- Notifications
- Statistics / analytics

---

## 6. State Machine

```
PENDING ──→ CONFIRMED ──→ SHIPPED
   │              │
   └──────────────┴──→ CANCELLED
```

---

## 7. Business Rules

1. An order must have at least one item before it can be confirmed
2. Items cannot be added or removed in CONFIRMED/SHIPPED state
3. An order in SHIPPED state cannot be cancelled
4. OrderItem must only be manipulated through Order
5. The order total is recomputed whenever items change
