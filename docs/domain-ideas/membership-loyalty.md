---
name: Membership / Loyalty
slug: membership-loyalty
core-aggregates: [Member, PointAccount, PointTransaction, Reward, Tier]
learning-focus: Earning/spending points, tier transitions, policy engine
---

# Membership / Loyalty

## Overview

A membership points and tier system. Members earn points through activities, spend them, or redeem Rewards. Tier changes affect earn rates and reward options. Higher tiers add point expiration, tier demotion, reward catalog inventory, and policy engines.

DDD learning value: append-only PointTransaction model, deriving current balance from history, tier-transition state machine, and time-based expiration policies.

## Universal Actors

- **Primary**: Member who earns and spends points.
- **Secondary**: Admin who registers rewards and manages policies.
- **Tertiary**: Scheduler system for point expiration and tier recalculation.

## Universal Domain Events

- MemberRegistered
- MemberDeactivated
- PointEarned
- PointSpent
- PointExpired
- PointAdjusted
- TierPromoted
- TierDemoted
- RewardRegistered
- RewardRedeemed
- RewardOutOfStock
- LoyaltyPolicyChanged

---

## Tier: Basic

**Target learning pattern**: Single Aggregate, simple accumulation.

**Scope**: One Member Aggregate. Register members and earn/spend points with a simple balance field. No history, tiers, or rewards.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Member
   - Secondary: Admin

2. **Domain Events (5-6)**:
   - MemberRegistered
   - PointEarned
   - PointSpent
   - PointAdjusted
   - MemberDeactivated
   - InsufficientPointsRejected

3. **KPIs**: N/A

4. **Differentiation**: N/A

5. **Out of Scope**:
   - PointTransaction history until intermediate tier
   - Tier
   - Reward redemption
   - Point expiration
   - Notifications
   - Authentication

### Suggested BC Candidate

- **Single BC**: `Member` -- Member Aggregate Root with a `points` balance field.

### Key Learning Goals

- VO: `MemberId`, `Points` with non-negative validation and add/subtract methods, and `MemberStatus`.
- Aggregate Root: `earn(points)` and `spend(points)`, with a domain exception for insufficient balance.
- Simple accumulation/decrement model.
- Single-Aggregate CQRS.

---

## Tier: Intermediate

**Target learning pattern**: 2 Aggregates, history model, tier transition.

**Scope**: Member and PointTransaction Aggregates. Balance is derived from append-only PointTransaction history. Add Bronze/Silver/Gold tiers and automatic tier evaluation based on accumulated points.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Member
   - Secondary: Admin

2. **Domain Events (8-10)**:
   - MemberRegistered
   - PointEarned
   - PointSpent
   - PointAdjusted
   - PointTransactionRecorded
   - TierPromoted
   - TierDemoted
   - InsufficientPointsRejected

3. **KPIs**: N/A

4. **Differentiation**: N/A

5. **Out of Scope**:
   - Reward redemption until advanced tier
   - Point expiration until advanced tier
   - External notifications
   - Authentication
   - Statistics

### Suggested BC Candidates

- **BC-1: Membership** (Core) -- Member and Tier management.
- **BC-2: Point Ledger** (Core) -- append-only PointTransaction history model.

### Key Learning Goals

- Append-only model: PointTransaction is never edited; corrections are new transactions.
- Domain Service: `PointBalanceCalculator` derives current balance from history, or Member caches it.
- Tier-transition machine: `TierPolicy` using Specification rules such as accumulated points >= N.
- Cross-BC Port: `PointBalanceQueryPort`.
- Domain event flow: PointEarned -> evaluate accumulated points -> emit TierPromoted.

---

## Tier: Advanced

**Target learning pattern**: 4+ BCs, policy engine, point-expiration Saga, reward redemption.

**Scope**: Separate Membership, PointLedger, Reward, Policy, Redemption, and Notification BCs. Points expire N months after earning, earn rate varies by tier, rewards have catalog/inventory, and tier demotion is activity-based.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Member
   - Secondary: Admin
   - Tertiary: Scheduler system for expiration and tier recalculation

2. **Domain Events (12-14)**:
   - MemberRegistered / MemberDeactivated
   - PointEarned
   - PointSpent
   - PointExpired
   - PointTransactionRecorded
   - TierPromoted / TierDemoted
   - TierActivityRecorded
   - RewardRegistered / RewardOutOfStock
   - RewardRedeemed
   - LoyaltyPolicyChanged

3. **KPIs**: N/A

4. **Differentiation**: N/A

5. **Out of Scope**:
   - Real notification delivery; publish events only.
   - External payment gateway integration for reward costs.
   - Authentication
   - UI

### Suggested BC Candidates

- **BC-1: Membership** (Core) -- Member and Tier lifecycle.
- **BC-2: Point Ledger** (Core) -- earn/spend/expire PointTransaction history.
- **BC-3: Reward Catalog** (Supporting) -- Reward master data and inventory.
- **BC-4: Redemption** (Core) -- Saga that exchanges points for rewards.
- **BC-5: Loyalty Policy** (Supporting) -- earn rates, expiration periods, and tier-transition rules.
- **BC-6: Notification** (Generic) -- tier-change and near-expiration notifications.

### Key Learning Goals

- Domain Event publish/subscribe.
- Saga: Redemption deducts points, decrements Reward inventory, publishes events, and compensates on failure.
- Policy engine for tier earn rates, time-based bonuses, and expiration periods using `LoyaltyPolicy` plus Specification.
- Eventual Consistency: PointEarned -> TierEvaluation -> TierPromoted asynchronously.
- Time-based domain event: PointExpired using FIFO consumption of oldest earned points first.
- Same-word-different-meaning: Point as ledger transaction unit, tier-evaluation metric, and redemption currency.
- Append-only history model plus derived balance.
