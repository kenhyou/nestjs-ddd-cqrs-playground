# Phase 1 — Domain Discovery (PRD validation mode)

**Source**: `workspace/order-management-intermediate/product-requirements.md`
**Mode**: Validation (PRD already contains discovery answers)

## 1. Domain

**Name**: Order Management
**Tier**: Intermediate
**One-line**: A system where a customer creates / confirms / cancels an order, and the order transitions to a shipped state or is cancelled depending on the payment result.

## 2. Primary / Secondary Actors

- **Primary**: Customer — creates, confirms, and cancels orders
- **Secondary**: Operator — manual payment retry, refund processing

## 3. Domain Events (8)

| Event | Trigger |
|---|---|
| OrderPlaced | A new order is created in PENDING |
| OrderConfirmed | The order is confirmed (triggers a Payment request) |
| OrderCancelled | The order is cancelled before shipping |
| PaymentRequested | A payment request is created together with order confirmation |
| PaymentSucceeded | The payment succeeds |
| PaymentFailed | The payment fails / is rejected |
| OrderShipped | After payment success, the order transitions to the shipped state (status flag) |
| RefundIssued | A refund is processed for a paid order |

## 4. KPI / Differentiation

N/A — learning project

## 5. Out of Scope

- A real payment gateway (Payment is an internal Aggregate; the result is mocked)
- Real shipping / carrier integration
- Inventory / stock-reservation Saga (Advanced, or inventory-management)
- Notifications
- Authentication / authorization
- Statistics / analytics

## 6. Key Domain Concepts (from PRD)

- **Order Aggregate**: PENDING -> CONFIRMED -> SHIPPED, CANCELLED (from PENDING/CONFIRMED)
- **Payment Aggregate**: REQUESTED -> SUCCEEDED -> REFUNDED, FAILED (from REQUESTED)
- **Cross-Aggregate Rules**:
  1. The Order SHIPPED transition is allowed only when Payment is SUCCEEDED (decided by a Domain Service).
  2. Cancelling a paid Order triggers RefundIssued (a manual Operator action in this tier).
  3. References between Aggregates are by ID only (`Payment.orderId: OrderId`).

## Validation

The content defined in the PRD above is sufficient for Phase 1 Discovery. After user review, proceed to Phase 2.
