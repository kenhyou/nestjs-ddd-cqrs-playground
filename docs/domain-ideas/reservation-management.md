---
name: Reservation Management
slug: reservation-management
core-aggregates: [Room, Reservation, CheckInOut]
learning-focus: Multi-Aggregate cross-BC, DateRange VO with overlap detection, Domain Service for conflict checking
---

# Reservation Management

## Overview

A meeting-room reservation system where rooms are registered as resources and customers reserve them for specific time ranges. The defining problem is **time-range conflict detection**: the same room cannot host two overlapping reservations.

DDD learning value: a multi-Aggregate split (`Room` and `Reservation`) where each Aggregate owns its own transaction boundary; ID-only references between Aggregates; a Cross-BC Port (`RoomQueryPort`) that lets the Reservation BC read Room facts without importing them; a Domain Service (`ReservationConflictChecker`) for a rule that no single Aggregate can express; and a careful split between **scheduled** time (intent) and **actual** time (`checkedInAt`, `checkedOutAt`) — the same word ("time") meaning different things.

This domain idea is more concrete and meeting-room-specific than the generic [reservation-booking](reservation-booking.md). Pick this one when you want to drill multi-Aggregate + Cross-BC mechanics; pick reservation-booking when you want a broader booking-style domain (lodging, equipment, etc.) with a longer fulfillment flow.

## Universal Actors

- **Primary**: Customer who reserves rooms.
- **Secondary**: Administrator who registers rooms and manages their availability.

## Universal Domain Events

- RoomRegistered: a new room is available for reservation.
- RoomCapacityChanged: a room's capacity was updated.
- RoomDeactivated: a room is no longer available.
- ReservationCreated: a reservation entered PENDING.
- ReservationConfirmed: a reservation moved to CONFIRMED.
- ReservationCancelled: a reservation was cancelled.
- CheckedIn: the customer arrived and started using the room.
- CheckedOut: the customer left the room.
- NoShow: the scheduled start passed without check-in.
- OverlappingReservationRejected: a create attempt was rejected for overlap.
- ReservationReminderSent: an upcoming-reservation reminder was sent.

---

## Tier: Basic

**Target learning pattern**: Single Aggregate, linear state transition, time-range VO.

**Scope**: One `Reservation` Aggregate per customer-per-time-range. Rooms are referenced by id only and assumed to exist (no Room Aggregate, no cross-BC check). Conflict detection is done inline by querying the same Aggregate's repository. Single BC.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Customer
   - Secondary: N/A

2. **Domain Events (5-7)**:
   - ReservationCreated
   - ReservationConfirmed
   - ReservationCancelled
   - OverlappingReservationRejected

3. **KPIs**: N/A (learning project)

4. **Differentiation**: N/A (learning project)

5. **Out of Scope**:
   - Room as a separate Aggregate; room ids are strings supplied by the caller.
   - Cross-BC validation (capacity, room existence).
   - Check-in / check-out flow.
   - No-show detection.
   - Notifications.
   - Authentication/authorization.

### Suggested BC Candidate

- **Single BC**: `Reservation` — create, confirm, cancel; overlap is checked within the same BC by reading sibling reservations.

### Key Learning Goals

- `DateRange` VO with `overlaps()`, `contains()`, `durationMinutes()`, and `isInPast()`.
- State machine: PENDING -> CONFIRMED -> CANCELLED.
- Overlap detection as an Application Service routine: load reservations for the same `roomId`, call `DateRange.overlaps()` over the result set.
- Past-time rejection: reservations whose `start` is already past are refused at creation.
- Single ID VO per Entity (`ReservationId`).

---

## Tier: Intermediate

**Target learning pattern**: 2 Aggregates, 2 BCs, Cross-BC Port, Domain Service, composite VO.

**Scope**: Promote `Room` to its own Aggregate Root in its own BC. The Reservation BC depends on the Room BC through a read-only `RoomQueryPort`. A Domain Service `ReservationConflictChecker` encapsulates overlap detection across multiple reservations. Add check-in / check-out to the Reservation lifecycle, with explicit `scheduledRange` vs `checkedInAt` / `checkedOutAt` time semantics.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Customer
   - Secondary: Administrator who registers rooms

2. **Domain Events (7-9)**:
   - RoomRegistered
   - ReservationCreated
   - ReservationConfirmed
   - ReservationCancelled
   - CheckedIn
   - CheckedOut
   - OverlappingReservationRejected

3. **KPIs**: N/A (learning project)

4. **Differentiation**: N/A (learning project)

5. **Out of Scope**:
   - No-show detection or automatic cancellation.
   - Cancellation policy (fees, deadlines).
   - Notifications and reminders.
   - Authentication/authorization.

### Suggested BC Candidates

- **BC-1: Room Registry** (Supporting) — register rooms, expose their identity and capacity.
- **BC-2: Reservation** (Core) — reservation lifecycle, conflict checking, check-in / check-out.

### Key Learning Goals

- Two independent Aggregate Roots referenced by id only (`Reservation.roomId: RoomId`).
- One transaction per Aggregate write; do not modify both `Room` and `Reservation` in one transaction.
- Cross-BC Port `RoomQueryPort` exposed in `application/ports/` and implemented inside the Room BC's `infra/`.
- Domain Service `ReservationConflictChecker` that consumes a list of sibling reservations and a candidate `DateRange`, then decides.
- Time semantics: `scheduledRange` (intent) vs `checkedInAt` / `checkedOutAt` (actual). Early checkout is allowed; no-show is implied when `scheduledRange.start` is past with no check-in.
- HTTP 409 Conflict mapping for `OverlappingReservationException`.
- No FK constraint between Reservations and Rooms at the DB level; integrity is enforced by domain validation via `RoomQueryPort.exists()`.

---

## Tier: Advanced

**Target learning pattern**: Multi-BC, Domain Events, scheduler-driven Saga, cancellation policy engine, Transactional Outbox.

**Scope**: Split Check-In/Out into its own BC. Add a Notification BC that subscribes to reservation events. Introduce a no-show detector (scheduled Saga). Add a cancellation policy engine that decides whether a cancellation is free or incurs a fee.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Customer
   - Secondary: Administrator
   - Tertiary: Scheduler / system actor that runs no-show and reminder jobs

2. **Domain Events (10-12)**:
   - RoomRegistered
   - RoomCapacityChanged
   - ReservationCreated
   - ReservationConfirmed
   - ReservationCancelled
   - CheckedIn
   - CheckedOut
   - NoShow
   - OverlappingReservationRejected
   - ReservationReminderSent
   - CancellationFeeApplied

3. **KPIs**: N/A (learning project)

4. **Differentiation**: N/A (learning project)

5. **Out of Scope**:
   - Real payment processing for fees; publish a `CancellationFeeApplied` event only.
   - Real notification delivery (SMS / email); publish `ReservationReminderSent` only.
   - UI/UX.
   - Authentication; authorization can be modeled as domain policy.

### Suggested BC Candidates

- **BC-1: Room Registry** (Supporting) — room lifecycle.
- **BC-2: Reservation** (Core) — placement, confirmation, cancellation, conflict detection.
- **BC-3: Check-In / Check-Out** (Core or Supporting depending on autonomy) — actual room usage tracking; subscribes to `ReservationConfirmed`, emits `CheckedIn` / `CheckedOut` / `NoShow`.
- **BC-4: Notification** (Generic) — reminders and confirmation messages driven by reservation events.

### Key Learning Goals

- Publish Domain Events through the Transactional Outbox; relay delivers asynchronously to subscribers.
- Scheduler-driven Saga: a periodic job inspects `scheduledRange.start` for confirmed-but-not-checked-in reservations and emits `NoShow`.
- Cancellation policy engine: tier or time-window-based rule that decides fee vs free; encoded as a Domain Service over `Reservation` plus a `CancellationPolicy` VO.
- Eventual Consistency: a reservation can be `CONFIRMED` while the Notification BC is still catching up; the system converges within seconds.
- Idempotent event handlers in Notification and Check-In/Out BCs, keyed by reservation id + event type.
- Anti-Corruption Layer between Reservation and Notification BCs so the Notification model never leaks reservation specifics back.
