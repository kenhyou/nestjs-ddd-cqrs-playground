# Phase 1 — Domain Discovery (PRD mode)

Source: [../../product-requirements.md](../../product-requirements.md) — tier: **advanced**.

## One-line Domain Definition

A system where a customer places an Order and its fulfillment is driven across three Bounded Contexts — Order, Payment, and Shipment — collaborating asynchronously through Domain Events (Transactional Outbox + Saga), with eventual consistency, idempotent handlers, and compensation flows.

## Users

- **Primary**: Customer — places, confirms, and cancels orders; tracks fulfillment status
- **Secondary**: Operator — manual payment retry, manual refund, manual intervention on stuck sagas
- **Tertiary**: Scheduler / system actor — drives retries, timeouts, and the outbox relay

## Domain Events (10-12)

- OrderPlaced — a new order is created in PENDING
- OrderConfirmed — the order is confirmed; trigger that starts the fulfillment saga
- OrderCancelled — the order is cancelled (before shipment, or via compensation)
- PaymentRequested — a payment request is created for a confirmed order
- PaymentSucceeded — the payment cleared
- PaymentFailed — the payment was declined or errored
- OrderShipped — the order transitioned to a shipped state after dispatch
- OrderDelivered — the order reached the customer
- ShipmentDispatched — the shipment left the warehouse
- ShipmentFailed — the shipment could not be dispatched/delivered
- RefundIssued — a refund was processed against a paid order (compensation)
- OrderTimedOut — the saga exceeded its time budget and was forced to terminate/compensate

## Key KPIs

N/A (learning project).

## Differentiation

N/A (learning project). Learning focus: multi-BC Domain Events, fulfillment Saga / Process Manager, eventual consistency, Transactional Outbox, idempotent handlers, Anti-Corruption Layer.

## In Scope

- Order placement and lifecycle (Order BC, Core) — owns the fulfillment Saga / Process Manager
- Payment requests, settlements, refunds (Payment BC, Supporting) — ACL over the mocked gateway
- Shipment dispatch and delivery tracking (Shipment BC, Supporting)
- Transactional Outbox + relay; idempotent event handlers; compensation flows; timeout handling

## Out of Scope

- Real payment gateway calls — treated as a publishable event behind an ACL; outcome mocked
- Real carrier integration — Shipment outcomes treated as events
- UI/UX
- Inventory / stock-reservation Saga (covered in inventory-management)
- Authentication; authorization may be modeled as policy if needed
- Notifications (beyond emitting events a Notification BC could later subscribe to)
