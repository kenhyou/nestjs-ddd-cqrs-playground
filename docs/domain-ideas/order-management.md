---
name: Order Management
slug: order-management
core-aggregates: [Order, OrderItem, Payment, Shipment]
learning-focus: Aggregate Root with child Entity, linear state machine, multi-BC e-commerce saga
---

# Order Management

## Overview

A system for placing customer Orders made up of OrderItems, transitioning Orders through a lifecycle of placement, confirmation, shipment, and cancellation, and (in higher tiers) coordinating Payment and Shipment as separate concerns.

DDD learning value: a textbook Aggregate Root with a child Entity (`Order` owning `OrderItem`), an unambiguous linear state machine, the boundary between an Aggregate and its internal Entities (external code only touches `Order`, never `OrderItem` directly), and at higher tiers a multi-BC saga where Payment and Shipment are coordinated through Domain Events.

## Universal Actors

- **Primary**: Customer who places orders and tracks their status.
- **Secondary**: Operator who confirms, cancels, or refunds orders on the customer's behalf.

## Universal Domain Events

- OrderPlaced: a new order entered the system in PENDING.
- OrderConfirmed: the order was confirmed for fulfillment.
- OrderCancelled: the order was cancelled before shipment.
- OrderShipped: the order left the warehouse.
- OrderDelivered: the order reached the customer.
- ItemAddedToOrder: an item was added while still PENDING.
- ItemRemovedFromOrder: an item was removed while still PENDING.
- OrderTotalRecalculated: the order total was recomputed after an item change.
- PaymentRequested: a payment was initiated for an order.
- PaymentSucceeded: the payment cleared.
- PaymentFailed: the payment was declined or errored.
- RefundIssued: a refund was processed against a paid order.

---

## Tier: Basic

**Target learning pattern**: Single Aggregate Root containing a child Entity, linear state transition, basic VO pattern.

**Scope**: One `Order` Aggregate Root that owns a collection of `OrderItem` Entities. Customers create orders, confirm them, or cancel them. No external systems, no payment, no shipment beyond a status flag. Single BC.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Customer
   - Secondary: N/A

2. **Domain Events (5-7)**:
   - OrderPlaced
   - ItemAddedToOrder
   - OrderConfirmed
   - OrderCancelled
   - OrderShipped (status flag only, no real fulfillment)

3. **KPIs**: N/A (learning project)

4. **Differentiation**: N/A (learning project)

5. **Out of Scope**:
   - Payment processing
   - Real shipment / carrier integration
   - Inventory or stock reservation
   - Authentication/authorization
   - Notifications
   - Statistics/analytics

### Suggested BC Candidate

- **Single BC**: `Order Management` — captures placement, confirmation, cancellation, and shipment status.

### Key Learning Goals

- Aggregate Root with child Entity: `Order` owns `OrderItem`; external code never touches `OrderItem` directly.
- Separate ID VOs per Entity: `OrderId` versus `OrderItemId`.
- `Money` VO with non-negative validation, same-currency arithmetic, and aggregation across items.
- State machine on `Order`: PENDING -> CONFIRMED -> SHIPPED; CANCELLED reachable from PENDING/CONFIRMED.
- `create()` vs `reconstitute()` factory split — new orders start in PENDING, restored orders preserve their stored status.

---

## Tier: Intermediate

**Target learning pattern**: 2 Aggregates, 1-2 BCs, cross-aggregate validation, Domain Service.

**Scope**: Add a `Payment` Aggregate alongside `Order`. Each confirmation triggers a Payment Aggregate; payment success allows shipment, failure forces cancellation. A Domain Service coordinates the cross-Aggregate rule.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Customer
   - Secondary: Operator who can manually retry or refund payments

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
   - Real payment gateway integration; treat Payment as an internal Aggregate with mocked outcome.
   - Real shipment / carrier integration
   - Inventory / stock reservation Saga
   - Notifications
   - Authentication/authorization

### Suggested BC Candidates

- **BC-1: Order** (Core) — placement, state machine, totals.
- **BC-2: Payment** (Supporting) — Payment Aggregate per Order with `requested`, `succeeded`, `failed`, `refunded` states.

### Key Learning Goals

- Multi-Aggregate design where `Order` and `Payment` each own a transaction boundary.
- Cross-BC Port: `Order` reads minimal Payment status through a `PaymentStatusQueryPort` instead of importing Payment internals.
- Domain Service `PaymentCoordinator` deciding whether an `Order` may transition to SHIPPED given the latest Payment outcome.
- Transactional consistency: confirming an Order and requesting a Payment happen under one `@Transactional()` boundary; the actual settlement is a separate transaction.
- Refund as a state-transition rule, not a free-form operation.

---

## Tier: Advanced

**Target learning pattern**: Multi-BC, Domain Events, fulfillment Saga, Eventual Consistency, Transactional Outbox.

**Scope**: Add a `Shipment` Aggregate in its own BC. Order, Payment, and Shipment coordinate via Domain Events through an outbox. Compensation handles payment failure, shipment failure, and customer-initiated cancellation after shipment.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Customer
   - Secondary: Operator
   - Tertiary: Scheduler / system actor that drives retries and timeouts

2. **Domain Events (10-12)**:
   - OrderPlaced
   - OrderConfirmed
   - OrderCancelled
   - PaymentRequested
   - PaymentSucceeded
   - PaymentFailed
   - OrderShipped
   - OrderDelivered
   - ShipmentDispatched
   - ShipmentFailed
   - RefundIssued
   - OrderTimedOut

3. **KPIs**: N/A (learning project)

4. **Differentiation**: N/A (learning project)

5. **Out of Scope**:
   - Real payment gateway calls; treat them as a publishable event.
   - Real carrier integration; treat Shipment outcomes as events.
   - UI/UX
   - Inventory / stock reservation Saga (covered in inventory-management).
   - Authentication; authorization can be modeled as policy if needed.

### Suggested BC Candidates

- **BC-1: Order** (Core) — Order placement and lifecycle.
- **BC-2: Payment** (Supporting) — payment requests, settlements, refunds.
- **BC-3: Shipment** (Supporting) — dispatch and delivery tracking.

### Key Learning Goals

- Publish Domain Events from each BC; subscribers in other BCs react asynchronously.
- Transactional Outbox: Order, Payment, and Shipment write event rows in the same DB transaction as their Aggregate change; a relay delivers them.
- Saga / Process Manager driving the happy path (`OrderConfirmed -> PaymentRequested -> PaymentSucceeded -> ShipmentDispatched -> OrderDelivered`) and compensations.
- Idempotent event handlers: each subscriber dedupes on event id or business key.
- Eventual consistency: the customer briefly sees `PENDING_SHIPMENT` while the saga is in flight; the system converges deterministically.
- Anti-Corruption Layer for the (mocked) external payment gateway, isolating its data model from `Payment`.
