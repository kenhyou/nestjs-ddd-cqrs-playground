---
name: Reservation / Booking
slug: reservation-booking
core-aggregates: [Room, Reservation, CheckInOut]
learning-focus: Time-range VO, conflict validation, Cross-BC Port
---

# Reservation / Booking

## Overview

A system for reserving resources such as rooms, lodging, or equipment for time slots. The core learning points are a time-range VO (`DateRange`) and conflict validation. Higher tiers split check-in/check-out into a separate BC and add notification events, cancellation policy, and no-show penalties.

DDD learning value: `DateRange` domain methods such as `overlaps()`, `contains()`, and `durationMinutes()`, Cross-BC Port patterns where Reservation reads Room data, and a state machine from PENDING to CONFIRMED to CHECKED_IN to CHECKED_OUT or CANCELLED.

Reference example: `docs/reservation-management/` contains an in-progress intermediate implementation.

## Universal Actors

- **Primary**: Customer who makes reservations.
- **Secondary**: Admin who registers resources.

## Universal Domain Events

- RoomRegistered
- RoomDeactivated
- ReservationCreated
- ReservationConfirmed
- ReservationCancelled
- CheckedIn
- CheckedOut
- NoShow
- ReminderSent
- OverlappingReservationRejected
- CancellationFeeApplied

---

## Tier: Basic

**Target learning pattern**: Single Aggregate, simple CRUD.

**Scope**: One Room Aggregate. Register, query, and deactivate rooms. No reservation behavior yet.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Admin
   - Secondary: N/A

2. **Domain Events (5)**:
   - RoomRegistered
   - RoomActivated
   - RoomDeactivated
   - RoomCapacityUpdated
   - RoomDeleted

3. **KPIs**: N/A

4. **Differentiation**: N/A

5. **Out of Scope**:
   - Reservation behavior
   - Time-range handling
   - Notifications
   - Payment
   - Authentication/authorization

### Suggested BC Candidate

- **Single BC**: `Room Registry` -- room master data.

### Key Learning Goals

- VO: `RoomId`, `RoomName`, and positive `Capacity` with upper-bound validation.
- Aggregate Root activation/deactivation transitions.
- Single-Aggregate CQRS with commands for register/deactivate and queries for get/list.

---

## Tier: Intermediate

**Target learning pattern**: 2 Aggregates, 2 BCs, Cross-BC Port, DateRange VO, conflict validation.

**Scope**: Room and Reservation split into 2 BCs. Time-range reservations with conflict validation. Includes check-in/check-out state transitions.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Customer
   - Secondary: Admin

2. **Domain Events (7-8)**:
   - RoomRegistered
   - ReservationCreated
   - ReservationConfirmed
   - CheckedIn
   - CheckedOut
   - ReservationCancelled
   - OverlappingReservationRejected

3. **KPIs**: N/A

4. **Differentiation**: N/A

5. **Out of Scope**:
   - Payment
   - Notification delivery
   - Authentication/authorization
   - No-show penalties and cancellation fees
   - Statistics/analytics

### Suggested BC Candidates

- **BC-1: Room Registry** (Supporting) -- room registration and management.
- **BC-2: Reservation** (Core) -- reservation lifecycle and conflict validation.

### Key Learning Goals

- Composite VO: `DateRange` with start, end, `overlaps()`, `contains()`, `durationMinutes()`, and `isInPast()`.
- Cross-BC Port: `RoomQueryPort` checks room existence from Reservation.
- Domain Service: `ReservationConflictChecker` for cross-aggregate logic.
- Complex state machine with five states and branches.
- No foreign-key constraints across BCs; domain validation only.
- UL distinction: `Room` as master data in Room BC versus reservable target in Reservation BC.

---

## Tier: Advanced

**Target learning pattern**: 3+ BCs, Domain Events, policy engine, notification events.

**Scope**: Separate Room, Reservation, CheckInOut, Policy, and Notification BCs. Publish notification events. Add cancellation-fee policy and no-show handling.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Customer
   - Secondary: Admin
   - Tertiary: Scheduler system for reminders and no-show handling

2. **Domain Events (10-12)**:
   - RoomRegistered
   - ReservationCreated
   - ReservationConfirmed
   - CheckedIn
   - CheckedOut
   - NoShow
   - ReservationCancelled
   - CancellationFeeApplied
   - ReminderSent
   - OverlappingReservationRejected
   - CheckInWindowExpired
   - PolicyViolated

3. **KPIs**: N/A

4. **Differentiation**: N/A

5. **Out of Scope**:
   - External payment gateway integration; calculate fees only.
   - Real SMS/email delivery; publish events only.
   - Authentication
   - UI/UX

### Suggested BC Candidates

- **BC-1: Room Registry** (Supporting) -- room master data.
- **BC-2: Reservation** (Core) -- reservation lifecycle.
- **BC-3: Check-In/Out** (Core) -- actual entry/exit tracking with a lifecycle separate from Reservation.
- **BC-4: Notification** (Generic) -- consumes domain events and enqueues notifications.
- **BC-5: Cancellation Policy** (Supporting) -- cancellation fee and no-show penalty policy engine.

### Key Learning Goals

- Publish/subscribe Domain Events through `@nestjs/cqrs` EventBus.
- Eventual Consistency from Reservation to Notification.
- ACL: Cancellation Policy translates Reservation information into its own model.
- Scheduled domain events for time-based automatic processing such as NoShow.
- Policy engine with PolicyRule and Specification patterns.
- Same-word-different-meaning: Reservation lifecycle versus CheckIn/Out usage record.
