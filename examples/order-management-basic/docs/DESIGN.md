# Order Management Basic — Domain Design

## Domain Overview

An order management system in which a customer creates an order, adds items, and can request cancellation before shipping.

**Core scenarios**:
- A customer creates an order and adds items
- An order can be cancelled before shipping
- An order is confirmed and then shipped

---

## Aggregate / Entity

| Name | Type | Responsibility |
|------|------|----------------|
| **Order** | Aggregate Root | Manages the order's state and items |
| **OrderItem** | Child Entity (owned by Order) | Manages the item's attributes |

---

## Value Objects

| VO | Contained Values | Validation |
|----|------------------|------------|
| `OrderId` | string (UUID) | Valid UUID |
| `OrderItemId` | string (UUID) | Valid UUID |
| `Money` | amount, currency | Non-negative, same-currency arithmetic only, item summation |

---

## State Transitions

```
PENDING ──→ CONFIRMED ──→ SHIPPED
   │              │
   └──────────────┴──→ CANCELLED
```

| Transition | Condition |
|------------|-----------|
| PENDING → CONFIRMED | At least one item |
| PENDING → CANCELLED | None |
| CONFIRMED → SHIPPED | None |
| CONFIRMED → CANCELLED | None |
| SHIPPED → (any) | Not allowed — terminal state |

---

## Use Cases

| Action | Type | Input | Output |
|--------|------|-------|--------|
| Create order | Command | customerId, items | void |
| Add item | Command | OrderId, item | void |
| Confirm order | Command | OrderId | void |
| Cancel order | Command | OrderId | void |
| Ship order | Command | OrderId | void |
| Get order | Query | OrderId | Order |

---

## Expected API Endpoints

| Method | Path | Use Case |
|--------|------|----------|
| POST | `/orders` | Create order |
| POST | `/orders/:id/items` | Add item |
| POST | `/orders/:id/confirm` | Confirm order |
| POST | `/orders/:id/cancel` | Cancel order |
| POST | `/orders/:id/ship` | Ship order |
| GET | `/orders/:id` | Get order |

---

## Aggregate Decisions

| Aggregate Root | Invariants Protected in One Transaction | Why This Boundary |
|----------------|-----------------------------------------|-------------------|
| Order | (1) At least one item on confirmation. (2) Total = sum of item prices (kept consistent on every change). | OrderItem cannot exist without Order. To protect the invariants atomically they must live inside the same transactional boundary. |

---

## Consistency Boundaries per Use Case

| Use Case | Aggregate Modified | Consistency | Notes |
|----------|-------------------|-------------|-------|
| Create order | Order | strong | Single Aggregate, single transaction |
| Add item | Order | strong | Single Aggregate, single transaction |
| Confirm order | Order | strong | State transition + total recomputation |
| Cancel order | Order | strong | State transition only |
| Ship order | Order | strong | State transition only |
| Get order | — | — | Query, no Aggregate modification |
