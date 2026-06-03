---
name: Order Management
slug: order-management
tier: intermediate
playthrough: order-management-intermediate
core-aggregates: [Order, Payment]
learning-focus: Separating the transaction boundaries between 2 Aggregates, Cross-BC Port, coordinating cross-Aggregate policy with a Domain Service
---

# Order Management — Intermediate

## Overview

A system where a customer creates and confirms an Order, which starts a Payment, and depending on the payment result the order transitions to a shipped state or is cancelled.

This tier's learning value is to build, hands-on, a structure where **two Aggregates each have their own independent transaction boundary yet collaborate through domain rules**. `Order` and `Payment` belong to different BCs, and the `Order` BC looks up only the minimal status via `PaymentStatusQueryPort` without knowing Payment's internal structure. Coupling between Aggregates is kept as ID references, and the rule that crosses the two Aggregates is handled by a Domain Service (`PaymentCoordinator`).

Where the Basic tier taught Entity collaboration inside a single Aggregate, the Intermediate tier's goal is to internalize, at the code level, the DDD principle that **Aggregate boundary = transaction boundary = consistency boundary**.

## Universal Actors

- **Primary**: Customer — creates, confirms, and cancels orders
- **Secondary**: Operator — manual payment retry, refund processing

## Universal Domain Events

Events used in this tier:
- **OrderPlaced**: a new order is created in the PENDING state
- **OrderConfirmed**: the order is confirmed (the trigger for a Payment request)
- **OrderCancelled**: the order is cancelled before shipping
- **PaymentRequested**: a payment request is created together with order confirmation
- **PaymentSucceeded**: the payment succeeds
- **PaymentFailed**: the payment fails or is rejected
- **OrderShipped**: after payment success, the order transitions to the shipped state (status flag only)
- **RefundIssued**: a refund is processed for a paid order

---

## Tier: Intermediate

**Target learning pattern**: 2 Aggregates, 1-2 BCs, cross-aggregate validation, Domain Service.

**Scope**: add a `Payment` Aggregate alongside the `Order` Aggregate. On order confirmation a Payment Aggregate is created; on payment success shipping is possible, on failure a forced cancellation. A Domain Service coordinates the rules between Aggregates.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Customer
   - Secondary: Operator — manual payment retry or refund processing

2. **Domain Events (7-9)**:
   - OrderPlaced
   - OrderConfirmed
   - OrderCancelled
   - PaymentRequested
   - PaymentSucceeded
   - PaymentFailed
   - OrderShipped
   - RefundIssued

3. **KPIs**: N/A (learning project)

4. **Differentiation**: N/A (learning project)

5. **Out of Scope**:
   - Real payment gateway integration — Payment is treated as an internal Aggregate with a mocked result
   - Real shipping / carrier integration
   - Inventory / stock-reservation Saga (covered in the Advanced tier or inventory-management)
   - Notifications
   - Authentication/Authorization
   - Statistics/analytics

### Suggested BC Candidates

- **BC-1: Order** (Core) — order creation, state machine, amount calculation
- **BC-2: Payment** (Supporting) — one Payment Aggregate per Order. States: `requested`, `succeeded`, `failed`, `refunded`

### Key Learning Goals

- **Multi-Aggregate design**: `Order` and `Payment` each have an independent transaction boundary. References between Aggregates are by ID only.
- **Cross-BC Port**: `Order` looks up only Payment's minimal status via `PaymentStatusQueryPort`. It does not import Payment's internal structure.
- **Domain Service `PaymentCoordinator`**: decides whether the Order can transition to SHIPPED based on the latest Payment result.
- **Transactional boundaries**:
  - order confirmation + Payment request creation → one `@Transactional()` transaction
  - actual payment settlement (succeeded/failed) → a separate transaction
- **Refund**: not a free operation but a state-transition rule. `Payment.refund()` may be called only from the `succeeded` state.
- **Branching state machine**: the Order branches on the payment result (PENDING → CONFIRMED → (PaymentSucceeded → SHIPPED) | (PaymentFailed → CANCELLED))

### State Machines (Reference)

**Order**:
```
PENDING ──confirm()──> CONFIRMED ──ship()──> SHIPPED
   │                       │
   └──cancel()──> CANCELLED └──cancel()──> CANCELLED
```

**Payment**:
```
REQUESTED ──succeed()──> SUCCEEDED ──refund()──> REFUNDED
    │
    └──fail()──> FAILED
```

### Cross-Aggregate Rules

1. The Order can transition to SHIPPED only when payment success (`Payment.status === SUCCEEDED`) is confirmed → decided by `PaymentCoordinator.canShip(order)`.
2. When an Order is cancelled and the Payment is in the SUCCEEDED state, RefundIssued is triggered (in this tier the Operator runs the refund command manually; the automatic Saga is in the Advanced tier).
3. The Order knows of the Payment's existence by ID only, and the Payment holds `orderId: OrderId`.
