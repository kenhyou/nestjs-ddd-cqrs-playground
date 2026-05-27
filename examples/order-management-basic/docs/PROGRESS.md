# Order Management Basic — Progress

## Phase -1: Domain Design
- [x] Strategic Design (`docs/strategic-design/STRATEGIC.md`)
- [x] Tactical Design (`docs/DESIGN.md`)

## Phase 0: NestJS Project Setup
- [x] Run `nest new`, create directory structure
- [x] Install TypeORM and SQLite dependencies

## Phase 1: Domain Layer
- [x] Write `OrderId`, `OrderItemId` VOs and tests
- [x] Write `Money` VO and tests
- [x] Write `OrderStatus` enum
- [x] Write `OrderItem` Entity
- [x] Write `Order` Aggregate Root (`create`, `reconstitute`, state-transition methods)
- [x] Domain unit tests (no NestJS/TypeORM imports)

## Phase 2: Application Layer
- [x] Write Command / Query classes
- [x] Write Command Handlers (CreateOrder, AddItem, ConfirmOrder, CancelOrder, ShipOrder)
- [x] Write Query Handler (GetOrder)
- [x] Write Repository Port (abstract class)
- [x] Write Query Port (abstract class)

## Phase 3: Infrastructure Layer
- [x] Write TypeORM Entities
- [x] Write Mappers (Domain ↔ ORM)
- [x] Write TypeORM Repository implementations (OrderRepository, OrderQuery)

## Phase 4: Presenter Layer
- [x] Write DTOs
- [x] Write Controller

## Phase 5: Module Assembly
- [x] Write `OrderModule` (Port ↔ implementation binding)
- [x] Wire up `AppModule`

## Phase 6: E2E Tests
- [x] Happy-path e2e test
- [x] Invariant-violation e2e test (attempt to cancel from SHIPPED state)

## Basic Pass Criteria Checklist
- [x] No NestJS/TypeORM imports in VO/Aggregate Root tests
- [x] At least one happy-path e2e test
- [x] At least one invariant-violation e2e test
- [x] No `reconstitute()` call inside Query Handlers
- [x] Able to describe the Aggregate boundary and invariants in one sentence
  - **Answer**: The Order Aggregate protects Order and OrderItem together, and an Order must have at least one OrderItem.
