---
name: Library Loan
slug: library-loan
core-aggregates: [Book, Loan, Reservation, Member]
learning-focus: Loan/return cycle, overdue policy, member tier
---

# Library Loan

## Overview

A library lending system. Members borrow Books through Loans, then return or renew them. Overdue loans trigger penalties such as fees or borrowing suspension. Popular books can have Reservation queues. Higher tiers add member-tier policies, reservation queue assignment, and overdue notifications.

DDD learning value: state changes over time, policy engines for tier-based loan limits, queue domain modeling, and cooperation between multiple lifecycles such as Book availability and Loan lifecycle.

## Universal Actors

- **Primary**: Member who borrows and returns books.
- **Secondary**: Librarian who registers books and members and handles overdue cases.
- **Tertiary**: Scheduler system that detects overdue loans and emits notifications.

## Universal Domain Events

- BookRegistered
- BookCopyAdded
- BookRetired
- MemberRegistered
- MemberSuspended
- MemberTierChanged
- LoanCreated
- LoanRenewed
- LoanReturned
- LoanOverdue
- LateFeeAssessed
- LateFeePaid
- ReservationQueued
- ReservationFulfilled
- ReservationCancelled
- LoanLimitReached

---

## Tier: Basic

**Target learning pattern**: Single Aggregate, availability state transition.

**Scope**: One Book Aggregate. Register, query, and retire books. No loan behavior.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Librarian
   - Secondary: N/A

2. **Domain Events (5)**:
   - BookRegistered
   - BookCopyAdded
   - BookCopyRetired
   - BookInfoUpdated
   - BookCatalogued

3. **KPIs**: N/A

4. **Differentiation**: N/A

5. **Out of Scope**:
   - Loan and Member until intermediate tier
   - Reservation
   - Overdue handling
   - Notifications
   - Authentication

### Suggested BC Candidate

- **Single BC**: `Book Catalog` -- book master data and copies.

### Key Learning Goals

- VO: `Isbn`, `BookId`, `CopyId`, `Title`, `Author`, and `CallNumber`.
- Aggregate Root: Book with BookCopy child entities, revisiting the Order/OrderItem pattern.
- Copy-level states such as AVAILABLE and RETIRED.
- Single-Aggregate CQRS.

---

## Tier: Intermediate

**Target learning pattern**: 3 Aggregates, 2 BCs, time-based state transition, overdue policy.

**Scope**: Book, Member, and Loan Aggregates across 2 BCs. Borrow, return, and renew. Automatic transition from on-time to overdue as time passes. Calculate late fees. Use a single member tier; differentiated tier policy waits until advanced tier.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Member
   - Secondary: Librarian

2. **Domain Events (8-10)**:
   - BookRegistered
   - MemberRegistered
   - LoanCreated
   - LoanRenewed
   - LoanReturned
   - LoanOverdue
   - LateFeeAssessed
   - LateFeePaid
   - LoanLimitReached

3. **KPIs**: N/A

4. **Differentiation**: N/A

5. **Out of Scope**:
   - Reservation queue until advanced tier
   - Tier-specific member policies until advanced tier
   - Notifications
   - Authentication
   - External payment; late fee is calculated internally only.

### Suggested BC Candidates

- **BC-1: Library Catalog** (Supporting) -- Book and copy availability.
- **BC-2: Loan Management** (Core) -- Member, Loan lifecycle, and overdue handling.

### Key Learning Goals

- Time-based state transition: `Loan.checkOverdue(now)` as a domain method with injected time.
- VO: `LoanPeriod`, `DueDate`, `LateFee` as Money, and `LoanStatus`.
- Cross-BC Port: `BookAvailabilityQueryPort` lets Loan BC check availability.
- Domain Service: `LoanLimitChecker` for concurrent-loan limits per member.
- Aggregate references by ID only.
- Simple late-fee policy such as a fixed daily fee.

---

## Tier: Advanced

**Target learning pattern**: 4+ BCs, policy engine, reservation-queue Saga, member tiers.

**Scope**: Separate Book, Member, Loan, Reservation, Policy, and Notification BCs. Apply differentiated policies for BRONZE/SILVER/GOLD member tiers, including loan limits and periods. Reservation queue assigns the next waiting member when a book is returned. Add overdue notification workflow.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Member
   - Secondary: Librarian
   - Tertiary: Scheduler system for overdue detection, notifications, and reservation expiration

2. **Domain Events (12-14)**:
   - BookRegistered / BookRetired
   - MemberRegistered / MemberTierChanged / MemberSuspended
   - LoanCreated / LoanRenewed / LoanReturned
   - LoanOverdue
   - LateFeeAssessed / LateFeePaid
   - ReservationQueued
   - ReservationFulfilled
   - ReservationExpired
   - LoanLimitReached
   - MemberLoanPrivilegeRevoked

3. **KPIs**: N/A

4. **Differentiation**: N/A

5. **Out of Scope**:
   - Real SMS/email delivery; publish events only.
   - Authentication
   - External payment; calculate late fees only.
   - UI/UX
   - Statistics

### Suggested BC Candidates

- **BC-1: Library Catalog** (Supporting) -- Book and copies.
- **BC-2: Member Management** (Supporting) -- Member, tier, suspension, and restoration.
- **BC-3: Loan Management** (Core) -- Loan lifecycle.
- **BC-4: Reservation Queue** (Core) -- FIFO waitlist and next-member notification.
- **BC-5: Lending Policy** (Supporting) -- tier-specific policy engine for limits, periods, and late fees.
- **BC-6: Notification** (Generic) -- overdue and availability notifications.

### Key Learning Goals

- Domain Event publish/subscribe: LoanReturned -> ReservationQueue notifies the next waiting member.
- Saga: reservation -> availability notification -> expiration if not picked up in time -> next waiting member.
- Policy engine: `LendingPolicy` with tier-specific Specification rules.
- Same-word-different-meaning: Reservation here means a book waitlist entry, not a time-slot booking.
- Multi-BC coordination between Loan and Reservation.
- Time-based transitions such as LoanOverdue and ReservationExpired emitted by a scheduler.
