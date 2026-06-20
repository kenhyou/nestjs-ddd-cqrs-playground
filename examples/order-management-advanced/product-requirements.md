---
name: Order Management
slug: order-management
tier: advanced
playthrough: order-management-advanced
core-aggregates: [Order, Payment, Shipment]
learning-focus: Multi-BC Domain Events, fulfillment Saga / Process Manager, Eventual Consistency, Transactional Outbox, idempotent handlers, Anti-Corruption Layer
---

# Order Management — Advanced

## Overview

A system where a customer places an Order, the Order is confirmed, and the fulfillment of that order is driven across three Bounded Contexts — **Order**, **Payment**, and **Shipment** — that collaborate **asynchronously through Domain Events** rather than direct calls.

This tier's learning value is to build, hands-on, the runtime backbone of an event-driven system: each BC writes its event rows in the **same DB transaction** as its Aggregate change (Transactional Outbox), a relay delivers those events, a **Saga / Process Manager** drives the happy path and compensations, subscribers are **idempotent**, and the customer experiences **eventual consistency** (briefly seeing an in-flight state) before the system converges deterministically.

Where the Basic tier taught Entity collaboration inside a single Aggregate, and the Intermediate tier taught two Aggregates with separate transaction boundaries collaborating through a Domain Service and a Cross-BC Query Port, the Advanced tier's goal is to internalize, at the code level, that **across BCs, consistency is eventual, coordination is event-driven, and every cross-context interaction must be idempotent and compensatable**.

## Universal Actors

- **Primary**: Customer — places, confirms, and cancels orders; tracks fulfillment status
- **Secondary**: Operator — manual payment retry, manual refund, manual intervention on stuck sagas
- **Tertiary**: Scheduler / system actor — drives retries, timeouts, and the outbox relay

## Universal Domain Events

Events used in this tier (10-12):
- **OrderPlaced**: a new order is created in the PENDING state
- **OrderConfirmed**: the order is confirmed — the trigger that starts the fulfillment saga
- **OrderCancelled**: the order is cancelled (before shipment, or via compensation)
- **PaymentRequested**: a payment request is created for a confirmed order
- **PaymentSucceeded**: the payment cleared
- **PaymentFailed**: the payment was declined or errored
- **OrderShipped**: the order transitioned to a shipped state after dispatch
- **OrderDelivered**: the order reached the customer
- **ShipmentDispatched**: the shipment left the warehouse
- **ShipmentFailed**: the shipment could not be dispatched/delivered
- **RefundIssued**: a refund was processed against a paid order (compensation)
- **OrderTimedOut**: the saga exceeded its time budget and was forced to terminate/compensate

---

## Tier: Advanced

**Target learning pattern**: Multi-BC, Domain Events, fulfillment Saga, Eventual Consistency, Transactional Outbox.

**Scope**: add a `Shipment` Aggregate in its own BC alongside `Order` and `Payment`. The three BCs coordinate through Domain Events delivered via an outbox. A Saga drives the happy path (`OrderConfirmed → PaymentRequested → PaymentSucceeded → ShipmentDispatched → OrderDelivered`) and compensations handle payment failure, shipment failure, customer-initiated cancellation, and timeouts.

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
   - Real payment gateway calls — treat them as a publishable event behind an Anti-Corruption Layer; outcome is mocked
   - Real carrier integration — treat Shipment outcomes as events
   - UI/UX
   - Inventory / stock-reservation Saga (covered in inventory-management)
   - Authentication; authorization may be modeled as policy if needed
   - Notifications (beyond emitting the events a Notification BC could later subscribe to)

### Suggested BC Candidates

- **BC-1: Order** (Core) — order placement and lifecycle; owns the fulfillment Saga / Process Manager
- **BC-2: Payment** (Supporting) — payment requests, settlements, refunds; ACL over the mocked gateway
- **BC-3: Shipment** (Supporting) — dispatch and delivery tracking

### Key Learning Goals

- **Domain Events across BCs**: each BC publishes events; subscribers in other BCs react asynchronously. No synchronous cross-BC command calls on the fulfillment path.
- **Transactional Outbox**: Order, Payment, and Shipment each write event rows in the **same DB transaction** as their Aggregate change; a relay polls/delivers them. Aggregate state and emitted events can never diverge.
- **Saga / Process Manager**: a stateful coordinator (owned by the Order BC) drives the happy path and reacts to each event, deciding the next command or a compensation.
- **Idempotent event handlers**: every subscriber dedupes on event id or business key, so at-least-once delivery is safe.
- **Eventual consistency**: the customer briefly sees `PENDING_SHIPMENT` (or similar in-flight status) while the saga is in flight; the system converges deterministically.
- **Compensation**: payment failure, shipment failure, customer cancellation after payment, and timeout each have a defined compensating action (e.g. RefundIssued, OrderCancelled).
- **Anti-Corruption Layer**: the (mocked) external payment gateway has its own data model; an ACL isolates it from the `Payment` Aggregate so gateway shapes never leak inward.

### State Machines (Reference)

**Order**:
```
PENDING ──confirm()──> CONFIRMED ──(saga in flight)──> PENDING_SHIPMENT ──dispatched──> SHIPPED ──delivered──> DELIVERED
   │                       │                                  │
   └──cancel()──>          ├──PaymentFailed──> CANCELLED       └──ShipmentFailed──> CANCELLED (+ refund compensation)
       CANCELLED           └──cancel()──> CANCELLED
                           (timeout)──> CANCELLED (+ compensation as needed)
```

**Payment**:
```
REQUESTED ──succeed()──> SUCCEEDED ──refund()──> REFUNDED
    │
    └──fail()──> FAILED
```

**Shipment**:
```
PENDING ──dispatch()──> DISPATCHED ──deliver()──> DELIVERED
    │
    └──fail()──> FAILED
```

### Saga Flow (Happy Path)

```
OrderConfirmed
  → (Order saga) request payment
    → PaymentRequested → PaymentSucceeded
      → (Order saga) request shipment
        → ShipmentDispatched
          → (Order) OrderShipped
            → ShipmentDelivered
              → (Order) OrderDelivered  [terminal: success]
```

### Compensation Flows

1. **Payment fails** (`PaymentFailed`): the saga transitions the Order to CANCELLED. No shipment was requested, so no shipment compensation is needed.
2. **Shipment fails** (`ShipmentFailed`): payment already SUCCEEDED, so the saga issues a refund (`RefundIssued`) and transitions the Order to CANCELLED.
3. **Customer cancels after payment success but before dispatch**: the saga issues a refund and, if a shipment was already requested, requests its cancellation; Order → CANCELLED.
4. **Timeout** (`OrderTimedOut`): the scheduler detects a saga stuck past its time budget; the saga compensates based on how far it progressed (refund if paid, cancel shipment if dispatched) and terminates the Order in CANCELLED.

### Cross-Aggregate / Cross-BC Rules

1. BCs never call each other's command handlers synchronously on the fulfillment path. Coordination is event-driven only.
2. Each Aggregate references foreign Aggregates by **ID only** (`orderId`, `paymentId`, `shipmentId`) — no ORM relationships across Aggregates.
3. Every event-publishing operation persists its events through the **outbox** within the same transaction as the Aggregate write.
4. Every event handler is **idempotent**: re-delivery of the same event id or business key produces no additional effect.
5. The Saga owns the orchestration state; individual Aggregates do not know about each other's lifecycle beyond the events they receive.
6. The Payment gateway is reached only through an **ACL**; the gateway's data model never appears inside the `Payment` Aggregate.
