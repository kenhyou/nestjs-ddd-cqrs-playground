---
name: Subscription Billing
slug: subscription-billing
core-aggregates: [Subscription, Invoice, Payment, BillingCycle]
learning-focus: Recurring jobs, state machines, payment Saga, dunning
---

# Subscription Billing

## Overview

A subscription-based billing system. When a user subscribes to a plan, invoices are generated periodically and payment proceeds automatically or manually. When payment fails, a dunning policy handles retries, notifications, suspension, or termination. Higher tiers add payment Saga, retry policy, and plan changes.

DDD learning value: separate lifecycle state machines for Subscription and Invoice, recurring jobs that create the next Billing Cycle, payment Saga around an external gateway and compensation, and a dunning policy engine.

## Universal Actors

- **Primary**: Subscriber.
- **Secondary**: Admin who manages plans and refunds.
- **Tertiary**: Scheduler system that issues invoices when billing cycles arrive.

## Universal Domain Events

- PlanRegistered
- SubscriptionStarted
- SubscriptionRenewed
- SubscriptionPaused
- SubscriptionResumed
- SubscriptionCancelled
- InvoiceIssued
- InvoicePaid
- InvoiceFailed
- PaymentRetryScheduled
- PaymentRetried
- DunningStarted
- SubscriptionSuspended
- SubscriptionTerminated
- RefundIssued
- PlanChanged

---

## Tier: Basic

**Target learning pattern**: Single Aggregate, simple state machine.

**Scope**: One Subscription Aggregate. Start, pause, resume, and cancel. No billing or payment.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Subscriber
   - Secondary: N/A

2. **Domain Events (5-6)**:
   - SubscriptionStarted
   - SubscriptionPaused
   - SubscriptionResumed
   - SubscriptionCancelled
   - SubscriptionExpired

3. **KPIs**: N/A

4. **Differentiation**: N/A

5. **Out of Scope**:
   - Invoice and Payment until intermediate tier
   - Payment gateway
   - Notifications
   - Refunds
   - Plan changes

### Suggested BC Candidate

- **Single BC**: `Subscription` -- subscription lifecycle only.

### Key Learning Goals

- VO: `SubscriptionId`, `PlanId`, `BillingPeriod`, and `SubscriptionStatus`.
- State machine: ACTIVE -> PAUSED -> ACTIVE -> CANCELLED.
- Expiration handling; `DateRange` may be reused.
- Single-Aggregate CQRS.

---

## Tier: Intermediate

**Target learning pattern**: 2 Aggregates, 2 BCs, invoice issuance, synchronous payment.

**Scope**: Subscription and Invoice Aggregates across 2 BCs. Issue invoices when a billing cycle arrives. Handle simple synchronous payment inside the domain without an external payment gateway. No Saga.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Subscriber
   - Secondary: Admin

2. **Domain Events (8-10)**:
   - SubscriptionStarted
   - SubscriptionRenewed
   - SubscriptionCancelled
   - InvoiceIssued
   - InvoicePaid
   - InvoiceFailed
   - InvoiceVoided
   - PaymentRecorded

3. **KPIs**: N/A

4. **Differentiation**: N/A

5. **Out of Scope**:
   - External payment gateway integration; use a domain-internal mock.
   - Retry and dunning until advanced tier.
   - Refund processing
   - Notification delivery
   - Plan changes

### Suggested BC Candidates

- **BC-1: Subscription Management** (Core) -- subscription lifecycle.
- **BC-2: Billing** (Core) -- invoice issuance and payment records.

### Key Learning Goals

- VO: `Money` with currency validation, `InvoiceNumber`, and `DueDate`.
- Invoice state machine: DRAFT -> ISSUED -> PAID / FAILED / VOIDED.
- Cross-BC Port: Billing references Subscription billing information through `SubscriptionQueryPort`.
- Domain event flow: `InvoiceIssued` schedules the next cycle.
- Time-based domain modeling through `BillingCycle`.

---

## Tier: Advanced

**Target learning pattern**: 3+ BCs, Saga, dunning, retry policy, external payment ACL.

**Scope**: Model Subscription, Invoice, Payment, and Dunning separately. Payment Saga calls an external payment gateway and compensates when needed. Dunning policy retries, suspends, and terminates. Include plan changes.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Subscriber
   - Secondary: Admin for refunds and forced termination
   - Tertiary: Scheduler and external payment gateway

2. **Domain Events (12-14)**:
   - SubscriptionStarted
   - SubscriptionRenewed
   - SubscriptionPaused
   - SubscriptionResumed
   - SubscriptionCancelled
   - SubscriptionSuspended
   - SubscriptionTerminated
   - PlanChanged
   - InvoiceIssued
   - InvoicePaid
   - InvoiceFailed
   - PaymentRetryScheduled
   - DunningStarted
   - RefundIssued

3. **KPIs**: N/A

4. **Differentiation**: N/A

5. **Out of Scope**:
   - Real external payment gateway integration such as Stripe; use a mock.
   - Real notification delivery; publish events only.
   - UI/UX
   - Tax handling
   - Authentication

### Suggested BC Candidates

- **BC-1: Subscription Management** (Core) -- subscription lifecycle and plan changes.
- **BC-2: Billing** (Core) -- invoice issuance.
- **BC-3: Payment** (Supporting) -- payment attempts and external gateway ACL.
- **BC-4: Dunning** (Supporting) -- overdue policy: retry, suspend, terminate.
- **BC-5: Catalog** (Generic) -- plan master data.

### Key Learning Goals

- Saga / Process Manager: issue invoice -> attempt payment -> enter dunning on failure -> retry.
- External-system ACL: translate PaymentGateway responses into the Payment BC model.
- Policy engine: `DunningPolicy` for retry count, interval, suspension, and termination conditions.
- Compensation through domain events such as refund after payment.
- Eventual Consistency between Subscription and Invoice states.
- Same-word-different-meaning: Subscription as lifecycle in Subscription BC versus billable target in Billing BC.
