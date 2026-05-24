---
name: <Domain Name>
slug: <directory-friendly-slug>
core-aggregates: [<Aggregate1>, <Aggregate2>, ...]
learning-focus: <one-line summary of what this domain teaches>
---

# <Domain Name>

## Overview

<One or two paragraphs explaining:>
- What kind of system this domain represents.
- Why this domain has value for learning DDD, especially what makes it different from other domains.

## Universal Actors

- **Primary**: <primary user>
- **Secondary**: <secondary user>

## Universal Domain Events

Only a subset is used in each tier.
- Event1: <description>
- Event2: <description>
- Event3: <description>
- ... (5-12 events)

---

## Tier: Basic

**Target learning pattern**: Single Aggregate, linear state transition, basic VO pattern.

**Scope**: 1 Aggregate Root. Simple CRUD plus 1-2 state transitions. No cross-aggregate behavior.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: <name>
   - Secondary: <name or N/A>

2. **Domain Events (5-7)**:
   - <Event 1>
   - <Event 2>
   - ...

3. **KPIs**: N/A (learning project)

4. **Differentiation**: N/A (learning project)

5. **Out of Scope**:
   - <feature 1>
   - <feature 2>
   - Authentication/authorization
   - Payment
   - Notification
   - Statistics/analytics

### Suggested BC Candidate

- **Single BC**: `<bc-name>` -- <short description>

### Key Learning Goals

- VO pattern: private constructor + static create + validation.
- Aggregate Root state-transition methods.
- Single-Aggregate commands and queries (CQRS basics).
- Factory + reconstitute pattern.

---

## Tier: Intermediate

**Target learning pattern**: 2 Aggregates, 1-2 BCs, cross-aggregate validation, Domain Service.

**Scope**: 2 Aggregate Roots. Branching state machine. Cross-aggregate policies. 1-2 BCs.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: <name>
   - Secondary: <name>

2. **Domain Events (7-10)**:
   - <Event 1>
   - <Event 2>
   - ...

3. **KPIs**: N/A (learning project)

4. **Differentiation**: N/A (learning project)

5. **Out of Scope**:
   - <items deliberately excluded from this tier>
   - Authentication/authorization
   - Payment
   - Notification
   - Statistics/analytics

### Suggested BC Candidates

- **BC-1**: `<name>` (Supporting) -- <responsibility>
- **BC-2**: `<name>` (Core) -- <responsibility>

### Key Learning Goals

- Multi-Aggregate design where each Aggregate owns its own transaction boundary.
- Cross-BC Port, such as the `RoomQueryPort` pattern.
- Domain Service for cross-aggregate logic.
- Composite VOs such as DateRange, Period, or Range with domain methods.
- Branching state machines.

---

## Tier: Advanced

**Target learning pattern**: Multi-BC, Domain Events, Saga/Process Manager, Eventual Consistency.

**Scope**: 3+ Aggregates. 2+ BCs. Domain Events publish/subscribe. Complex policy or Saga.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: <name>
   - Secondary: <name>
   - Tertiary: <name or system/scheduler>

2. **Domain Events (10-12)**:
   - <Event 1>
   - <Event 2>
   - ...

3. **KPIs**: N/A (learning project)

4. **Differentiation**: N/A (learning project)

5. **Out of Scope**:
   - <items excluded even in advanced scope>
   - Authentication/authorization, unless permission policy is part of the domain
   - External payment gateway integration, unless represented only by domain events
   - UI/UX
   - Statistics/analytics

### Suggested BC Candidates

- **BC-1**: `<name>` (Supporting) -- <responsibility>
- **BC-2**: `<name>` (Core) -- <responsibility>
- **BC-3**: `<name>` (Supporting or Generic) -- <responsibility>

### Key Learning Goals

- Publishing Domain Events with `@nestjs/cqrs` EventBus.
- Eventual Consistency between BCs through asynchronous event handlers.
- Saga / Process Manager for long-running workflows.
- Anti-Corruption Layer / Conformist patterns.
- Complex policy engines based on tier, time, or other dimensions.
- Concurrency control with optimistic locking and version fields.
