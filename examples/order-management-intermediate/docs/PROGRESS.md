# Order Management (Intermediate) — 8-Phase Coding Progress

**Playthrough**: order-management-intermediate
**Based on**: [DESIGN.md](DESIGN.md) · [strategic-design/STRATEGIC.md](strategic-design/STRATEGIC.md) · root `PLAN.md`
**Tier**: Intermediate — 2 Aggregates (`Order`, `Payment`), 2 BCs (`order`, `payment`), Domain Service, Cross-BC Port (ACL), a single `@Transactional()` multi-repo write

> Each Phase writes its tests alongside the code (tests are not deferred to the end). Each Phase's "Tests" items come from `PLAN.md`'s "Tests for This Layer".

---

## Phase -1: Domain Design — ✅ Done

- [x] Strategic Design (`strategic-design/STRATEGIC.md`)
- [x] Tactical Design (`DESIGN.md`) — reflects the 4-round walkthrough decisions
- [x] PROGRESS.md (this document)

---

## Phase 0: Project Setup — ✅ Done

- [x] 0.1 Scaffold: `nest new code --package-manager npm --skip-git` (Nest CLI 11.0.21)
- [x] 0.2 Install dependencies (`--save-exact`, pinned exactly): `@nestjs/cqrs@11.0.3 @nestjs/config@4.0.4 typeorm@0.3.30 @nestjs/typeorm@11.0.1 typeorm-transactional@0.5.0 sqlite3@5.1.7 reflect-metadata@0.2.2 class-validator@0.15.1 class-transformer@0.5.1`
- [x] 0.3 Folder structure — **2 BCs + `shared`**:
  - [x] `src/order/{presenters/http/{controllers,requests,responses,filters},application/{services,commands,queries,ports/queries},domain/{models,factories,vo,services,exceptions},infra/{persistence/orm/{entities,repositories,mappers},query-repositories,adapters}}`
  - [x] `src/payment/{...same, minus adapters...}`
  - [x] `src/shared/{exceptions,filters}` (global DomainExceptionFilter, Phase 7)
  - [x] Deleted the default `app.controller/service(.spec)`
- [x] 0.4 Path alias: `@order/*`, `@payment/*`, `@shared/*` (`tsconfig.json` paths + Jest `moduleNameMapper`)
- [x] NestJS Checkpoint: `ConfigModule.forRoot({ isGlobal: true })` (app.module.ts), version pin, import `reflect-metadata` at the very top of `main.ts`
- [x] **Verify**: `npx tsc --noEmit` OK; `npm run start` → `Nest application successfully started`

---

## Phase 1: Domain Layer (pure, no framework dependency)

### Order BC — ✅ Done (events omitted in this tier; kept pure, same as reservation-management)
- [x] VO: `OrderId`, `OrderItemId`, `Money` (amount+currency, finite ≥ 0, matching currency), `Quantity` (integer ≥ 1), `OrderStatus` (plain string enum)
- [x] Entity: `OrderItem` (id, productId, productName, unitPrice, quantity, `getLineTotal()`)
- [x] Aggregate Root: `Order` (`.model.ts` suffix)
  - [x] `create(customerId, items)` → PENDING, computes `totalAmount` (single-currency invariant enforced by `Money.add`), id via `generate()`
  - [x] `confirm()` → CONFIRMED (only from PENDING)
  - [x] `ship(isReadyToShip)` → guard `status===CONFIRMED && isReadyToShip` → SHIPPED (defensive re-guard)
  - [x] `cancel()` → PENDING/CONFIRMED → CANCELLED (blocked from SHIPPED)
  - [x] `isConfirmed()` derived query; `getItems()` returns a copy (protects the invariant)
  - [x] `reconstitute(...)` separate factory
  - [ ] Events (OrderPlaced, etc.) — omitted in this tier (no subscribers). A pure event-collection pattern if needed
- [x] Factory: `OrderFactory` (`@Injectable`, primitives → VO)
- [x] **Domain Service: `PaymentCoordinator`** — pure, `canShip(order, isPaid) = order.isConfirmed() && isPaid` (no Port dependency)

### Payment BC — ✅ Done
- [x] VO: `PaymentId`, `Money` (own definition, intentionally duplicated from Order), `PaymentMethod` (CARD/BANK_TRANSFER/VIRTUAL_ACCOUNT), `PaymentStatus` (REQUESTED/SUCCEEDED/FAILED/REFUNDED)
- [x] Aggregate Root: `Payment`
  - [x] `create(orderId, amount, method)` → REQUESTED (genesis), id via `PaymentId.generate()`
  - [x] `succeed()` → only from REQUESTED → SUCCEEDED (guard)
  - [x] `fail()` → only from REQUESTED → FAILED (guard)
  - [x] `refund()` → only from SUCCEEDED → REFUNDED (guard, full amount)
  - [x] `reconstitute(...)` separate factory
  - [ ] Events omitted (this tier, no subscribers)
- [x] `orderId` is kept as a plain string (no import of Order's VO) — only the own identifier is a `PaymentId` VO

### Tests
- [x] (Order BC) VO: `create()` rejects invalid input, `equals()` is value-based — money/quantity/id specs (plain `enum` not tested — tautological)
- [x] (Order BC) Aggregate: state-transition invariants (double-confirm rejected, 3 ship guards, cancel-after-SHIPPED rejected, mixed-currency rejected)
- [x] (Order BC) `PaymentCoordinator`: canShip truth table (no mock needed); `OrderFactory`: primitives → VO build
- [x] (Payment BC) VO + Aggregate: positive/negative transition-guard pairs (succeed/fail only from REQUESTED, refund only from SUCCEEDED)
- [x] **Verify (whole Phase 1)**: `npx tsc --noEmit` OK (note: ts-jest `isolatedModules` means `npm test` green ≠ types OK — tsc is a separate gate); no imports in `domain/` other than `@nestjs/common`; 38 tests / 11 suites green

> Phase 1 done. Key lessons: (1) static factories must be `static`, (2) happy-path-only tests miss missing guards → positive+negative per transition, (3) own identifier is a VO, external references are plain strings, (4) `tsc` is a separate gate from jest.

---

## Phase 2: Application Layer (CQRS + Ports) — ✅ Done

### Order BC
- [x] Repository Port (write): `OrderRepositoryPort` (abstract class, `save`/`findById→Order|null`)
- [x] Query Port (read): `OrderQueryPort.findById(string)` → `OrderReadModel` (primitives)
- [x] **Cross-BC Ports (ACL, defined on the Order side)**:
  - [x] `PaymentCommandPort.createPayment(orderId, amount, currency, method)` (primitives, positional)
  - [x] `PaymentStatusQueryPort.isPaid(orderId: string): Promise<boolean>`
- [x] Commands + Handlers:
  - [x] `CreateOrderCommandHandler` (factory → save → return id)
  - [x] `ConfirmOrderCommandHandler` — `order.confirm()` + `PaymentCommandPort.createPayment()` (D1). **`@Transactional()` added in Phase 3.5** (after DataSource wiring)
  - [x] `CancelOrderCommandHandler` (Payment unchanged, D3 — verified Order-only)
  - [x] `ShipOrderCommandHandler` — `isPaid = PaymentStatusQueryPort.isPaid()` → `PaymentCoordinator.canShip(order, isPaid)` (real, sync) → `order.ship(isPaid)`
- [x] Query + Handler: `GetOrderQueryHandler` (bypasses domain, returns query port)
- [x] Thin facade: `OrderService` (CommandBus/QueryBus, pure delegation)

### Payment BC — ✅ Done
- [x] `PaymentRepositoryPort` (VO), `PaymentQueryPort` (primitives) → `PaymentReadModel`
- [x] Commands + Handlers:
  - [x] `SettlePaymentCommandHandler` (`SettlementResult` 'SUCCEEDED'|'FAILED' → `succeed()`/`fail()`)
  - [x] `IssueRefundCommandHandler` (`refund()`)
- [x] Query + Handler: `GetPaymentQueryHandler` (spec optional, same pattern as get-order)
- [x] Thin facade: `PaymentService` (pure delegation)

### Tests
- [x] Command Handler: Repository Port mock → verify findById → domain method → save, happy + invariant
- [x] `ConfirmOrderCommandHandler`: verify `PaymentCommandPort` mock call (positional) + not-found
- [x] `ShipOrderCommandHandler`: `PaymentStatusQueryPort` mock + **real `PaymentCoordinator`** → canShip branch (paid/not paid)
- [x] Query Handler: Query Port mock, returns Read Model directly (no Repository Port injected)
- [x] **Verify**: `rg "from '.*infra" src/*/application/` → no results; `tsc` OK; 53 tests green
- [x] `get-payment` query handler spec — query port mock, returns Read Model directly (found) + passes null through (not-found), verified no Repository injected / no `reconstitute`

> Phase 2 lessons: (1) the pure domain service (`PaymentCoordinator`) must not be mocked — inject the real one, (2) `mockResolvedValue` is async-only (using it on the sync `canShip` makes the Promise truthy and defeats the `!` guard), (3) read-side ports are primitive (no VO), (4) watch the BC path — files kept getting created under payment/, (5) `@Transactional()` depends on infra (Phase 3.5), so it is deferred at the application stage.

---

## Phase 3: Infrastructure Layer (TypeORM)

> The actual structure is flat `infra/{entities,mappers,repositories,queries,adapters}` (CONVENTIONS.md). Entity file name `<agg>.entity.ts`.

### Order BC — ✅ Done
- [x] ORM Entity: `OrderEntity` (+ `totalAmount`/`totalCurrency`, `status` simple-enum), `OrderItemEntity` — same Aggregate → `@OneToMany`/`@ManyToOne` + `cascade`/`eager`
- [x] Mapper: `OrderMapper` (+ injects `OrderItemMapper`) — `Money` is decomposed/reassembled into amount+currency 2 columns
- [x] Repository (write): `OrderRepository implements OrderRepositoryPort` (eager loading)
- [x] Query (read): `OrderQuery implements OrderQueryPort` → projects directly to `OrderReadModel` (no Mapper/`reconstitute`)

### Payment BC — ✅ Done
- [x] ORM Entity: `PaymentEntity` — `orderId` is a plain `@Column` + `@Index()`, **no FK/`@ManyToOne`** (verified)
- [x] Mapper: `PaymentMapper`
- [x] Repository (write): `PaymentRepository`
- [x] Query (read): `PaymentQuery` (`findById` + `findByOrderId`) → `PaymentReadModel`

### Cross-BC Adapters (ACL) — ✅ Done
- [x] `PaymentCommandAdapter implements PaymentCommandPort` → injects **Payment's `PaymentRepositoryPort` (the port!)**, translates primitives → `Money`/`PaymentMethod`, `Payment.create` + save
- [x] `PaymentStatusQueryAdapter implements PaymentStatusQueryPort` → `PaymentQueryPort.findByOrderId` → `status==='SUCCEEDED'` → boolean
- [x] 3 boundary guards green: payment does not import order / order domain·app do not import payment / order does not import payment/infra

### Transactions (3D) — ✅ Done
- [x] Added `@Transactional()` to `ConfirmOrderCommandHandler` — no `EntityManager`/`QueryRunner` in `application/` (return type `Promise<void>`)
- [x] In the test setup, wrap the DataSource with `initializeTransactionalContext()` + `addTransactionalDataSource(...)` (SQLite :memory:, 3 entities)
- [x] Rollback integration test: if `createPayment` fails, the Order confirm is also rolled back (stays PENDING) — D1/Failure Mode
- [x] 3 scenarios in one file: happy (both commit) + not-found + rollback (`confirm-order.command.handler.spec.ts` = integration test)
- [x] `main.ts`: `initializeTransactionalContext()` (before NestFactory) + `addTransactionalDataSource(...)` — **completed in Phase 5** (for the runtime app; @Transactional behavior and rollback verified via live curl)

### Tests
- [x] Mapper round-trip (Order+items, Payment)
- [x] Repository: SQLite in-memory integration — save→findById equality, eager loading
- [x] Read Model: Query Port returns a DTO, no `reconstitute`
- [x] Adapter: PaymentCommandAdapter (inspect the Payment passed to save), PaymentStatusQueryAdapter (status→boolean truth table)
- [x] Transaction rollback (3D) — 3 integration-test scenarios green

> Phase 3 lessons: (1) an Adapter depends on the other BC's **port** (not the concrete impl) — a concrete class with private members is nominal and cannot be mocked, (2) "X is not a constructor" = the import is undefined (empty file / not exported), (3) sqlite returns decimal→number (other DBs return string), (4) infra dirs are all plural (including mappers), (5) **once `@Transactional()` is attached, that handler can no longer be unit-tested with mocked ports — it needs `initializeTransactionalContext()` + a real DataSource, so it automatically becomes an integration test**. Wiring both BCs' infra together is normal only in an integration test (the boundary guards are judged against production code).

---

## Phase 4: Presenters Layer (HTTP) — ✅ Implementation done (tests now also done)

### Order BC — ✅
- [x] Request DTO: `CreateOrderRequest` (+ nested items, `@IsArray`/`@ArrayNotEmpty`/`@ValidateNested({each})`/`@Type`), `ConfirmOrderRequest` (`paymentMethod` = `@IsString`/`@IsNotEmpty` only — `@IsEnum(PaymentMethod)` avoided as a boundary violation)
- [x] Controller `OrderController` (`@Controller('orders')`, **injects the `OrderService` facade** — not the buses directly):
  - [x] `POST /orders` (→ `{orderId}`), `POST /orders/:id/confirm`, `/cancel`, `/ship`, `GET /orders/:id`
- [x] Query responses return `OrderReadModel` directly (no remapping Response DTO)

### Payment BC — ✅
- [x] Request DTO: `SettlePaymentRequest` (`result` = `@IsIn(['SUCCEEDED','FAILED'])` — a literal union has no runtime value, so `@IsEnum` is impossible; `SettlementResult` uses `import type`)
- [x] Controller `PaymentController` (`@Controller('payments')`, injects `PaymentService`):
  - [x] `POST /payments/:id/settle`, `/refund`, `GET /payments/:id`
- [x] **Verify**: `tsc` OK; 2 presenter boundary guards green (order presenter ↛ @payment, payment presenter ↛ @order)

### Tests — ✅ Done
- [x] DTO validation: invalid payload → 400 (`ValidationPipe` whitelist/forbidNonWhitelisted/transform + supertest) — empty items / unknown field / **nested `items.0.quantity` < 1** / missing customerId / settle `@IsIn` violation all verified as 400
- [x] Controller e2e: Service mock + supertest — `order.controller.spec.ts` (create happy + delegation, confirm/get delegation, ParseUUIDPipe malformed → 400, rejected payload never reaches the service), `payment.controller.spec.ts` (settle/refund/get delegation + `@IsIn`/ParseUUIDPipe 400). The global `DomainExceptionFilter` is also registered to simultaneously confirm it does not hijack ValidationPipe's 400

> Phase 4 lessons: (1) the controller goes through the facade (`OrderService`) — injecting the buses directly is the basic example's way, but we keep the facade (CONVENTIONS.md), (2) `@Param('id')` is the token name (no colon) — `@Param(':id')` yields undefined, (3) a string-literal union has no runtime value, so `@IsEnum` is impossible → `@IsIn([...])`, (4) under `isolatedModules`+`emitDecoratorMetadata`, a type-only symbol in a decorated signature requires `import type`, (5) using `@IsEnum(PaymentMethod)` in the Order presenter is a BC boundary violation — method validity is Payment's invariant.

---

## Phase 5: Module Wiring (DI) — ✅ Done (boot verified)

- [x] `PaymentModule`: `CqrsModule`, `forFeature([PaymentEntity])`, providers (`PaymentMapper`/`PaymentService`/2 handlers/`GetPaymentQueryHandler`) + `{provide: PaymentRepositoryPort, useClass: PaymentRepository}`, `{provide: PaymentQueryPort, useClass: PaymentQuery}`; **exports: `PaymentRepositoryPort`, `PaymentQueryPort`** (consumed by the ACL adapters)
- [x] `PaymentPortsModule` (ACL bridge, **`src/order/payment-ports.module.ts`**): imports `PaymentModule`; **binds + exports the ports here** — `{provide: PaymentCommandPort, useClass: PaymentCommandAdapter}`, `{provide: PaymentStatusQueryPort, useClass: PaymentStatusQueryAdapter}`, exports both ports
  - Design correction: place the binding in `PaymentPortsModule`, not `OrderModule` — the adapters' deps (`PaymentRepositoryPort`/`PaymentQueryPort`) resolve only in an injector that imported `PaymentModule`. If `OrderModule` bound via `useClass`, a new adapter would be created in Order's injector → dep unresolved.
- [x] `OrderModule`: `CqrsModule`, `forFeature([OrderEntity, OrderItemEntity])`, **`PaymentPortsModule`**; providers + `OrderMapper`/`OrderItemMapper`, `OrderFactory`, `PaymentCoordinator`, `OrderService`, 4 command handlers, `GetOrderQueryHandler`, `{provide: OrderRepositoryPort,...}`, `{provide: OrderQueryPort,...}`
  - [x] **`OrderModule` does not import `PaymentModule` directly** (goes through PaymentPortsModule) ✅
  - [x] **Zero `forwardRef()`** ✅
- [x] `AppModule`: `TypeOrmModule.forRootAsync(...)` (SQLite) + **`addTransactionalDataSource(new DataSource(options))` in `dataSourceFactory`** (enables runtime `@Transactional`), imports `OrderModule`+`PaymentModule`
- [x] `main.ts`: `initializeTransactionalContext()` (**before `NestFactory.create`**) + global `ValidationPipe` (whitelist/forbidNonWhitelisted/**transform** — required to instantiate nested DTOs)
- [x] **Verify**: `npm run start` boots cleanly + `order-management.sqlite` has the 3 tables `orders`/`order_items`/`payments` (the CREATE TABLE log is just not printed because `logging:false` is the default — synchronize did run)

### Tests — ✅ Done
- [x] DI smoke: `Test.createTestingModule({ imports:[AppModule] }).compile()` succeeds (`app.module.spec.ts`) — facades/handlers resolve + **cross-BC `PaymentCommandPort` resolves within the Order graph** (proves the ACL wiring)
- [x] override: `.overrideProvider(OrderRepositoryPort).useClass(InMemoryOrderRepository)` → verified with `toBeInstanceOf`. **Single compile** (AppModule's `addTransactionalDataSource` runs only once per file — `initializeTransactionalContext()` in beforeAll, sqlite file cleaned with `rmSync` in afterAll)

> Phase 5 lessons: (1) place the cross-BC port binding in the module that can resolve the adapter's deps (= `PaymentPortsModule`, which imported `PaymentModule`), (2) `addTransactionalDataSource` goes in `forRootAsync`'s `dataSourceFactory` — without it the runtime `@Transactional` throws "No data source", (3) `initializeTransactionalContext()` goes before `NestFactory.create`, (4) no `CREATE TABLE` log ≠ failure — `logging` defaults to false; verify via the .sqlite tables/boot log, (5) Nest modules are singletons — importing `PaymentModule` from both AppModule and PaymentPortsModule yields the same instance.

---

## Phase 6: curl Integration — ✅ Done (live server verified)

- [x] Full happy flow: create → get(PENDING) → confirm (**= cross-BC Payment creation, @Transactional**) → settle(SUCCEEDED) → ship → get(SHIPPED) — all pass
- [x] Branch: attempt ship while unpaid → rejected (canShip=false, though currently 500)
- [x] cancel: cancelling PENDING succeeds (→CANCELLED), cancelling after SHIPPED rejected (guard fires, 500)
- [x] refund: only SUCCEEDED refunds (→REFUNDED), re-refunding a REFUNDED rejected (guard, 500)
- [x] ValidationPipe: empty items / unknown field (forbidNonWhitelisted) / quantity<1 (nested `items.0.quantity`) / settle bad enum → all **clean 400 + message** ✅
- [x] Schema check: `payments.order_id` has only an `@Index`, **no FK to `orders`** (Aggregate boundary confirmed at the DB level)

> Phase 6 key finding: the whole stack works + every guard fires correctly. **The only flaw is uniform** — domain-invariant violations are generic `Error`, so Nest's default filter maps them to `500` (the validation stage is already clean 400). This is **the motivation for Phase 7 (Domain Exception + Filter)**: invalid transition → 409/422, not-found → 404. (Note: `GET /orders/:id` with a missing id returns null/200 — a query-side design choice; whether to map 404 is decided in Phase 7. Payment lookup is by paymentId only, so there is no HTTP endpoint to find a payment by orderId in this tier — an intentional gap.)

---

## Phase 7: Domain Exception Handling — ✅ Done (live verified)

- [x] **Shared** base `DomainException extends Error` (`src/shared/exceptions/`, abstract `category: 'NOT_FOUND'|'CONFLICT'`) — adopted a single shared base instead of the original "per-BC base" (the filter/mapping table is a shared concern, handled by one `@Catch`). The domain importing `@shared` is the same pattern as the existing `assert-uuid`, so it is not a rule violation
- [x] 4 concrete exceptions: `OrderNotFoundException`/`PaymentNotFoundException` (NOT_FOUND), `InvalidOrderStateException`/`InvalidPaymentStateException` (CONFLICT) — `<bc>/domain/exceptions/<name>.exception.ts`
- [x] Replace generic `Error`: model state-transition guards (order confirm/ship×2/cancel, payment succeed/fail/refund) → `Invalid*StateException`; handler not-found (confirm/cancel/ship/settle/refund) → `*NotFoundException`. **Messages preserved** (the existing message-based asserts do not break, 70 tests stay green)
- [x] `DomainExceptionFilter` (`@Catch(DomainException)`, `src/shared/filters/`) → `category`→status mapping table (`NOT_FOUND:404, CONFLICT:409`), registered globally in `main.ts` (`useGlobalFilters`)
- [x] **Bonus: `ParseUUIDPipe`** applied to all `:id` params (7 across both controllers) — a malformed UUID returns **400** before entering the handler (previously `OrderId.create`'s `assert-uuid` threw a generic Error → 500)
- [x] **Verify (live curl)**: malformed id → 400, valid-nonexistent → 404, invalid transition (re-confirm / cancel-after-SHIPPED / double refund) → 409, body validation → 400. **Zero 500s on client input**. Error taxonomy settled: 400 (input) · 404 (not found) · 409 (state conflict) · 500 (genuine server faults only)

### Tests — ✅ Done
- [x] Filter mapping unit test (`domain-exception.filter.spec.ts`): NOT_FOUND→404 · CONFLICT→409 + body (`{statusCode,error,message}`), the 4 concrete exceptions' categories, routing of real exceptions
- [x] Boundary: `ValidationPipe`'s `BadRequestException` is not hijacked by the domain filter — proven by the controller e2e keeping validation → 400 with `DomainExceptionFilter` registered (`@Catch(DomainException)` does not catch other exceptions)
- [x] non-DomainException pass-through: ParseUUIDPipe's 400 (BadRequest) is not caught by the filter = same mechanism confirmed

> Phase 7 lessons: (1) the category (semantic) approach — the domain does not know HTTP numbers, the filter has the single responsibility of category→status, (2) **the not-found mapping trap**: `XId.create(badId)` runs before `findById`, so a malformed id blows up as `assert-uuid`'s generic Error, not as not-found → handle it at the edge with `ParseUUIDPipe` (keeps the domain pure), (3) a generic Error is always 500 under Nest's default filter — use a typed exception + `@Catch` for meaningful status, (4) preserving messages keeps the existing message-based tests from breaking.

---

## Phase 8: Test Strategy (index)

| Layer | Phase | Test Type | Mock |
|---|---|---|---|
| Domain (VO, Model, `PaymentCoordinator`) | 1 | Pure unit | None |
| Application Handler | 2 | Unit | Port only |
| Infra (Repository, Mapper, Adapter) | 3 | Integration | Real SQLite |
| Presenters (Controller) | 4 | e2e (`INestApplication`) | Service only |
| Module Wiring | 5 | DI smoke (`.compile()`) | Optional override |
| Exception Filter | 7 | Filter mapping | None |

---

## Intermediate Pass Criteria (completion judgment)

- [x] Meets the Basic criteria: 0 NestJS/TypeORM imports in `domain/` (only 2 `@Injectable` — allowed), happy + invariant flow verified via live curl, Query Handler uses no `reconstitute()`/Mapper ✅
- [x] **DESIGN.md "Service Placement"** filled in + each cross-Aggregate policy location (Domain Service vs Application) stated with reasons ✅ (DESIGN.md complete)
- [x] Cross-BC Port bound in **exactly one module (`PaymentPortsModule`)**, no module imports another BC's `infra/` ✅ (verified)
- [x] One use case (`ConfirmOrder`) writes 2 repositories under a **single `@Transactional()`**; no `EntityManager`/`QueryRunner`/`dataSource.transaction` in `application/` ✅ (atomicity proven by the rollback integration test)
- [x] Composite VO (`Money` matching-currency arithmetic) has its own test ✅ (both BCs' `money.vo.spec.ts`)

> **🎉 order-management-intermediate complete** — Phases -1 ~ 7 + all Intermediate Pass Criteria met. **98 tests / 31 suites green**, `tsc` clean, full live-server flow + error taxonomy verified. (The deferred Phase 4/5/7 tests + the optional `get-payment` spec are all written. The only remaining unchecked items are intentional tier exclusions = Domain Events/Saga → Advanced topics.)

> Note: this tier's limitation (the D5 Refund-Cancel inconsistency window) is allowed via manual handling. Automatic Saga/Outbox/auto-ship are Advanced topics.
