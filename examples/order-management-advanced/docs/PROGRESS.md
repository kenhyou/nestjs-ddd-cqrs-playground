# Order Management (Advanced) — 8-Phase Coding Progress

**Playthrough**: order-management-advanced
**Based on**: [DESIGN.md](DESIGN.md) · [strategic-design/STRATEGIC.md](strategic-design/STRATEGIC.md) · root `PLAN.md`
**Tier**: Advanced — 3 BCs (`order` incl. Fulfillment Saga, `payment`, `shipment`) + shared `outbox`; Domain Events, Transactional Outbox, idempotent at-least-once consumers, stateful Saga/Process Manager, ACL, compensation + timeout (Scheduler)

> Each Phase writes its tests alongside the code (tests are not deferred). "Tests" items come from `PLAN.md`'s "Tests for This Layer" + the Advanced Pass Criteria (outbox atomicity, saga retry + duplicate-delivery).
> Decision tags **D1–D6** refer to DESIGN.md.

---

## Phase -1: Domain Design — ✅ Done

- [x] Strategic Design (`strategic-design/STRATEGIC.md`) — 3 BCs, event-driven Context Map, UL
- [x] Tactical Design (`DESIGN.md`) — D1–D6 walkthrough decisions recorded
- [x] PROGRESS.md (this document)

---

## Phase 0: Project Setup — ✅ Done

- [x] 0.1 Scaffold: `@nestjs/cli@11 new code --package-manager npm --skip-git` (Nest core ^11.0.1, TS ^5.7.3, Jest ^30)
- [x] 0.2 Install deps (pinned exact): `@nestjs/cqrs@11.0.3 @nestjs/config@4.0.4 @nestjs/schedule@6.1.3 typeorm@0.3.30 @nestjs/typeorm@11.0.1 typeorm-transactional@0.5.0 sqlite3@5.1.7 reflect-metadata@0.2.2 class-validator@0.15.1 class-transformer@0.5.1`
  - `@nestjs/schedule@6.1.3` is **new for this tier** (the outbox relay + saga timeout `@Interval`). (8 audit warnings are all sqlite3 build-time transitive deps — ignored.)
- [x] 0.3 Folder structure — **3 BCs + `shared` + `outbox`** (per CONVENTIONS.md: `presenters/http/{controllers,dtos,filters}`, flat `application/{commands/handlers,queries/{dtos,handlers},events/handlers,ports,services}`, `domain/{models,vo,enums,factories,services,exceptions}`, flat `infra/{entities,mappers,repositories,queries,adapters}`):
  - [x] `order/` (+ `infra/scheduler` for saga timeout, no adapters — coordination is event-driven)
  - [x] `payment/` + `shipment/` (each with `infra/adapters` for the gateway/carrier ACL)
  - [x] `outbox/{entities,repositories,relay}` — shared infra (D2: `outbox_events`; D3: `processed_messages`; `OutboxRelayService`)
  - [x] `shared/{exceptions,filters}` (global DomainExceptionFilter, Phase 7)
  - [x] Deleted the default `app.controller/service(.spec)`
- [x] 0.4 Path aliases: `@order/*`, `@payment/*`, `@shipment/*`, `@outbox/*`, `@shared/*` (tsconfig `paths` + Jest `moduleNameMapper`, `<rootDir>` = src)
- [x] NestJS Checkpoint: `ConfigModule.forRoot({ isGlobal: true })` + `ScheduleModule.forRoot()` (app.module.ts), `import 'reflect-metadata'` at top of `main.ts`
- [x] **Verify**: `npx tsc --noEmit` OK; `npm run start` → `Nest application successfully started` (ConfigModule + ScheduleModule initialized)

---

## Phase 1: Domain Layer (pure, no framework dependency) — ✅ Done (core; 2 items deferred)

> Advanced difference vs intermediate: aggregates **record Domain Events** (drained via `pullEvents()`, D2b) and the **`FulfillmentSaga` Process Manager** carries orchestration policy as pure methods (D1).
> Saga built incrementally in 7 small steps (start → payment leg → shipment leg → shipment-fail compensation → refund → timeout → reconstitute). Saga outputs are **commands** (`RequestPayment/RequestShipment/RequestRefund`), per the command/event-split decision.

### Order BC — ✅
- [x] VO: `OrderId`, `OrderItemId`, `Money`, `Quantity` (integer ≥ 1) + enums `OrderStatus` (incl. `PENDING_SHIPMENT`/`DELIVERED`), `SagaStatus`
- [x] Entity: `OrderItem` (`getLineTotal()`)
- [x] Aggregate Root: `Order`
  - [x] `create()` → PENDING (records `OrderPlacedEvent`); `confirm()` → CONFIRMED (records `OrderConfirmedEvent`, carries `totalPrice`)
  - [x] `markPendingShipment()`, `ship()` (records `OrderShippedEvent`), `deliver()` (records `OrderDeliveredEvent`)
  - [x] `cancel()` → CANCELLED via allow-list (PENDING/CONFIRMED/PENDING_SHIPMENT); **rejected from SHIPPED/DELIVERED** (D6a)
  - [ ] denormalized `paymentStatus`/`shipmentStatus` setters — **deferred to Phase 4 / saga→Order wiring**
  - [x] `pullEvents()` event-recording pattern; `reconstitute()` (no events)
- [x] **Aggregate Root: `FulfillmentSaga` (Process Manager, D1)** — pure, keyed by `orderId`
  - [x] state machine AWAITING_PAYMENT → AWAITING_SHIPMENT → COMPLETED; COMPENSATING → CANCELLED
  - [x] `start()`, `onPaymentSucceeded()`, `onPaymentFailed()`, `onShipmentDispatched()`, `onShipmentDelivered()`, `onShipmentFailed()`, `onRefundIssued()`, `onTimeout()` + `reconstitute()`
  - [x] out-of-state events are **no-ops** (Layer-1 idempotency, D3) — proven by duplicate/out-of-order tests
- [ ] Factory: `OrderFactory` — **deferred to Phase 2** (built where `CreateOrder` handler needs it)

### Payment BC — ✅
- [x] VO: `PaymentId`, own `Money`, enums `PaymentMethod`, `PaymentStatus`
- [x] Aggregate Root: `Payment` — `create(orderId, amount, method)` (records `PaymentRequestedEvent`), `succeed(gatewayRef)` (stores `gatewayRef`), `fail()`, `refund()`; `pullEvents()`; `reconstitute()`
- [x] `orderId` plain string (no Order VO import)

### Shipment BC — ✅
- [x] VO: `ShipmentId`, `TrackingCode`, enum `ShipmentStatus`
- [x] Aggregate Root: `Shipment` — `create(orderId)` (no event), `dispatch(trackingCode)` (validate→mutate, records `ShipmentDispatchedEvent`), `deliver()`, `fail()` (**from PENDING**, D6); `pullEvents()`; `reconstitute()`
- [x] `orderId` plain string

### Tests — ✅ (85 tests / 14 suites green)
- [x] VO: invalid input rejected, value-based `equals()`
- [x] Aggregate transition guards (positive + negative per transition; cancel-after-SHIPPED rejected; dispatch validate-before-mutate)
- [x] **`FulfillmentSaga` state machine**: each transition + out-of-state no-op (idempotency Layer 1) + which command it records
- [x] event recording: `pullEvents()` drains once
- [x] **Verify**: `tsc` OK; **zero framework imports in `domain/`** ✓ (Basic pass criterion met)

---

## Phase 2: Application Layer (CQRS + Ports + event handlers)

### Order BC
- [x] Ports (write): `OrderRepositoryPort`, `SagaRepositoryPort`. `OrderQueryPort` (read) → query step below.
- [x] Shared messaging contract: `shared/messaging/{InboundMessage, MessageHandler}` (envelope + string dispatch, D4).
- [x] Commands + Handlers: `CreateOrderCommandHandler`, `ConfirmOrderCommandHandler` (Order + outbox only — saga NOT created here, D4a), `CancelOrderCommandHandler` (routes compensation through `saga.onCancelRequested()`, D6a)
- [x] **Saga event handlers** (`application/events/handlers`): `OrderConfirmed`→start, `PaymentSucceeded`/`PaymentFailed`/`RefundIssued`, `ShipmentDispatched`/`ShipmentDelivered`/`ShipmentFailed` → load saga(+Order), call domain method, persist (one TX, D4b). Correlation key `orderId` added to all consumed events. **`OrderTimedOut` handler + Scheduler → Phase 3.** Dedup (D3) + `@Transactional` wrapping → Phase 3.
- [x] Query: `GetOrderQueryHandler`; facade `OrderService` (read path: `OrderQueryPort` → `OrderReadModel`, no `reconstitute`; facade fronts all use cases)

### Payment BC
- [x] Ports: `PaymentRepositoryPort`, `PaymentQueryPort`, **`PaymentGatewayPort`** (ACL, D5 — primitive-only `charge`/`refund`, no domain types leak)
- [x] Event handlers: `RequestPaymentHandler` (`RequestPayment` → create + charge(ACL) + succeed/fail) and `RequestRefundHandler` (`RequestRefund` → refund; **throws on failed refund** so the saga isn't stranded in COMPENSATING)
- [x] Query: `GetPaymentQueryHandler` (read path: `PaymentQueryPort` → `PaymentReadModel`, no `reconstitute`) + thin `PaymentService` facade (query-only — Payment has no commands) + `get-payment.query.handler.spec.ts`

### Shipment BC
- [x] Ports: `ShipmentRepositoryPort`, `ShipmentQueryPort`, **`CarrierPort`** (ACL, D5 — primitive-only `dispatch`, no domain types leak)
- [x] Event handlers: `RequestShipmentHandler` (`RequestShipment` → create + dispatch(ACL); carrier-reject → `Shipment.fail()` → `ShipmentFailedEvent` → saga compensates with refund). **No separate cancel handler**: the saga emits only `RequestPayment`/`RequestShipment`/`RequestRefund` (compensation is refund-only), and `CarrierPort` has no `cancel()`, so `Shipment.fail()` is reachable only via a failed dispatch.
- [x] Query: `GetShipmentQueryHandler` (read path: `ShipmentQueryPort` → `ShipmentReadModel`, no `reconstitute`) + thin `ShipmentService` facade (query-only) + `get-shipment.query.handler.spec.ts`

### Tests
- [x] Command handlers (Order BC): Port mock → domain method → save (happy + not-found; cancel covers no-saga + cancel-after-SHIPPED rejected)
- [x] **Saga event handlers**: given event, verify saga(+Order) transition + recorded outbox message (Ports mocked). Logical-duplicate no-apply covered at the saga (Layer 1); message-id dedup test → Phase 3.
- [x] Query handler: returns Read Model directly (no `reconstitute`) — `get-order/payment/shipment.query.handler.spec.ts` (identity-returns Port object + not-found throws)
- [x] **Verify**: no `infra/` imports in `application/` (grep clean); `tsc` OK; full suite 126 tests / 31 suites green

---

## Phase 3: Infrastructure Layer (TypeORM + Outbox + ACL + Scheduler)

### Shared OutboxModule (D2/D3) — the heart of this tier
- [x] ORM entity `OutboxEventEntity` (`outbox_events`; `id` = `@PrimaryColumn` uuid set in code = dedup key; `payload` `simple-json`; `publishedAt` nullable + `@Index`); `ProcessedMessageEntity` (`processed_messages`, composite PK `(consumerName, messageId)`)
- [x] `OutboxRepository` — `append()` serializes `pullEvents()` into rows (**no `@Transactional` → joins caller's save TX**, D2b); `findUnpublished()`/`markPublished()` (own TX, separate from publish); `tryMarkProcessed()` dedup helper
- [x] **`OutboxRelayService`** (`@Interval(1000)`): `findUnpublished(100)` oldest-first → `MessageDispatcher.dispatch()` → stamp `publishedAt` in a **separate** TX (at-least-once); self-overlap guard; per-row failure leaves row for retry (no dead-letter at this tier)
- [x] **`MessageDispatcher`** (the relay→consumer bridge): discovers all `MessageHandler`s via `DiscoveryService`, indexes by `messageType`, runs each in one `@Transactional` with `tryMarkProcessed(handlerClassName, messageId)` (D3) — `consumer_name` = handler class name
- [x] dedup helper: insert `(consumer, message_id)`; unique-violation → skip (D3)
- [x] Tests (integration, real SQLite `:memory:`): `outbox.repository.spec.ts` (append/find/markPublished round-trip, batch limit, dedup scoping) + `message-dispatcher.spec.ts` (routing, **duplicate re-delivery → handler runs once** = Advanced criterion). Each spec tears down the `default` transactional DS in `afterAll`.

### Order BC
- [x] `OrderEntity` (+ items `@OneToMany` eager+cascade, denormalized `paymentStatus`/`shipmentStatus` cols left null until Phase 4), `OrderItemEntity` (`@ManyToOne` Order — same Aggregate, FK allowed), **`FulfillmentSagaEntity`** (`orderId` PK, plain column, no FK)
- [x] Mappers (`OrderMapper`, `FulfillmentSagaMapper`); `OrderRepository`, `SagaRepository` (both `@Transactional` save → `outbox.append()` in same TX; saga rows tagged aggregateType `order`); `OrderQuery` (denormalized cols → `'NONE'` when null)
- [x] **Saga timeout Scheduler** (`infra/scheduler/saga-timeout.scheduler.ts`, `@Interval(1000)`): polls sagas in `AWAITING_*` with `awaitingUntil < now` → loads via `SagaRepository`, drives `saga.onTimeout()` (→ CANCELLED, or COMPENSATING + `RequestRefund` to outbox), saves in one `@Transactional`. Domain extended (Phase-1 touch): `FulfillmentSaga` now carries `awaitingUntil` (set on entering AWAITING_*, cleared on exit; `STEP_TIMEOUT_MS=30s`) + optional `reconstitute` arg; `FulfillmentSagaEntity` + mapper round-trip it. Drives `onTimeout()` directly — no separate `OrderTimedOut` event in the implemented design. Spec: `saga-timeout.scheduler.spec.ts` (cancel / compensate / not-yet-due / non-awaiting-ignored).

### Payment BC
- [x] `PaymentEntity` (`orderId` plain `@Column`+`@Index`, no FK); `PaymentMapper`; `PaymentRepository` (+outbox, `@Transactional`); `PaymentQuery`
- [x] **ACL: `MockPaymentGatewayAdapter implements PaymentGatewayPort`** — ugly external shape `{txnId,resultCode,rawStatus}`, adapter translates; **force-fail hook** = `FORCE_FAIL_AMOUNT` sentinel (D4c/D5)

### Shipment BC
- [x] `ShipmentEntity` (`orderId` plain, no FK; `trackingCode` nullable); `ShipmentMapper` (full round-trip incl. `trackingCode` — `Shipment.reconstitute` extended with an optional `trackingCode` arg, gap fixed); `ShipmentRepository` (+outbox); `ShipmentQuery`
- [x] **ACL: `MockCarrierAdapter implements CarrierPort`** — ugly external shape `{statusCode,waybillNo}`, translate; force-fail via `forceFail` flag (carrier sees only orderId, no amount sentinel)

### Tests
- [x] Mapper round-trip (Order+items, Saga, Payment, Shipment) — Shipment spec documents the trackingCode reload gap
- [x] Repository: SQLite in-memory save→find; **outbox row written in the same TX as the aggregate (atomicity)** — `payment.repository.spec.ts` (template; Order/Shipment repos are structurally identical, integration test not duplicated)
- [x] **Outbox relay**: same row delivered twice → consumer dedups (Advanced Pass Criteria) — covered by `message-dispatcher.spec.ts`. _Relay-level publish-failure-retry is exercised by the per-row try/catch but not yet asserted in a dedicated relay spec._
- [x] ACL adapter: ugly external model → clean domain outcome (truth table incl. force-fail) — `mock-payment-gateway.adapter.spec.ts`, `mock-carrier.adapter.spec.ts`
- [x] `orderId` columns carry **no FK** (Aggregate boundary, all 3 BCs) — grep-verified: only `OrderItem→Order` relation exists (same Aggregate)

---

## Phase 4: Presenters Layer (HTTP)

- [x] Order: `CreateOrderRequest` (+ nested `CreateOrderItemRequest`, class-validator), `OrderController` — `POST /orders` (→ `{orderId}`, 201), `POST /:id/confirm` (200), `POST /:id/cancel` (200), `GET /orders/:id` (denormalized status). Controllers call only the `OrderService` facade.
- [x] Payment: `PaymentController` `GET /payments/:id` (inspection only — no create endpoint, D-note)
- [x] Shipment: `ShipmentController` `GET /shipments/:id` (inspection only)
- [x] `ParseUUIDPipe` on all `:id` params (non-uuid → 400)
- [x] Tests: controller e2e (Service mock + supertest) — `order/payment/shipment.controller.spec.ts`: happy paths, DTO validation → 400 (empty items + unknown property), bad uuid → 400. Global `ValidationPipe` now `whitelist`+`forbidNonWhitelisted`+`transform`.
- [x] **Verify**: `tsc` OK; app boots with all routes mapped (`/orders` POST/confirm/cancel/GET, `/payments/:id`, `/shipments/:id`); controllers import only their own `application` facade (no cross-BC, no `infra`)

---

## Phase 5: Module Wiring (DI) — event-driven, no forwardRef

- [x] `OutboxModule`: `forFeature([OutboxEventEntity, ProcessedMessageEntity])` + `DiscoveryModule`; provides `OutboxRepository`/`MessageDispatcher`/`OutboxRelayService`; **exports `OutboxRepository`**; imported by all 3 BC modules
- [x] `PaymentModule`: `CqrsModule`, `forFeature([PaymentEntity])`, handlers, bind `PaymentRepositoryPort`/`PaymentQueryPort`/`PaymentGatewayPort`→impls; exports `PaymentService`
- [x] `ShipmentModule`: `CqrsModule`, `forFeature([ShipmentEntity])`, handlers, bind `ShipmentRepositoryPort`/`ShipmentQueryPort`/`CarrierPort`→impls; exports `ShipmentService` (no cancel handler — see Phase 2/3 note)
- [x] `OrderModule`: `CqrsModule`, entities (Order/Item/Saga), 3 command handlers + query + 7 saga event handlers, `OrderFactory`, `SagaTimeoutScheduler`; bind `OrderRepositoryPort`/`SagaRepositoryPort`/`OrderQueryPort`→impls; exports `OrderService`
- [x] **No BC imports another BC's `infra/`; coordination is via outbox events; zero `forwardRef()`** (Advanced Pass Criteria) — handlers discovered app-wide by `MessageDispatcher` via `DiscoveryService`
- [x] `AppModule`: `TypeOrmModule.forRootAsync` (sqlite, `autoLoadEntities`, `synchronize`) + `dataSourceFactory`→`addTransactionalDataSource` (returns un-initialized; Nest initializes); `ScheduleModule.forRoot()`; imports all modules
- [x] `main.ts`: `initializeTransactionalContext()` before `NestFactory`; global `ValidationPipe({ whitelist, transform })`
- [x] Tests: DI smoke (`app.module.spec.ts`, `.compile()`) resolves facades + relay + dispatcher + scheduler
- [x] **Verify**: app boots (`DB_PATH=:memory: npm run start` → "Nest application successfully started", all 4 modules initialized, no errors); `synchronize` creates all 7 tables

---

## Phase 6: curl / Integration (live server)

> Live run 2026-06-20 (`DB_PATH` file db, relay+schedulers active). First pass surfaced GAP A/B + a SQLite concurrency bug; all three fixed and re-verified (second run, **zero errors**).

- [x] **Happy path**: create → confirm → relay drives `PENDING→CONFIRMED→PENDING_SHIPMENT→SHIPPED→DELIVERED` across 3 BCs; saga `COMPLETED`; final `{status:DELIVERED, paymentStatus:SUCCEEDED, shipmentStatus:DELIVERED}`. (GAP A fixed — see below.)
- [x] **Eventual consistency**: `GET` returns intermediate states (`PENDING`→`CONFIRMED`→`PENDING_SHIPMENT`→`SHIPPED`→`DELIVERED`) as the saga converges, one relay tick each.
- [x] **Compensation 1 (payment fail)**: `FORCE_FAIL_AMOUNT` (99999) → payment `FAILED` → saga `CANCELLED` → **order `CANCELLED`, `paymentStatus=FAILED`** (GAP B fixed).
- [x] **Compensation 2 (shipment fail)**: exercised live with `CARRIER_FORCE_FAIL=true` — payment succeeds → dispatch fails → `ShipmentFailed` (saga COMPENSATING, order `shipmentStatus=FAILED`) → `RequestRefund` → payment `REFUNDED` → `RefundIssued` → saga `CANCELLED` + order `CANCELLED`. Final `{CANCELLED, paymentStatus:REFUNDED, shipmentStatus:FAILED}`, zero errors. (Force-fail wired config-side per D4c: `MockCarrierAdapter` reads `CARRIER_FORCE_FAIL` from `ConfigService`; no public endpoint.)
- [x] **Compensation 3 (cancel-after-SHIPPED rejected)**: `POST /:id/cancel` on a SHIPPED order → **409 `OrderNotCancellableException`**.
- [x] **Timeout**: Scheduler fires on a saga past its `awaitingUntil`; AWAITING_PAYMENT→direct cancel (order cancelled in scheduler), AWAITING_SHIPMENT→`RequestRefund`→`RefundIssued`→order cancelled. (First run observed it compensating the then-stalled happy order; with GAP A fixed the happy path completes before the 30s deadline.)
- [x] Schema check: `PRAGMA foreign_key_list` — **no FK** on `payments`/`shipments`/`fulfillment_sagas`; `order_items`→`orders` FK present (same Aggregate). Outbox drains to 0 unpublished; dedup one row per handler per order.
- [x] **Exception matrix (Phase 7 live)**: malformed uuid→400, bad body→400, missing→404, invalid transition→409, not-cancellable→409, **zero 500s**.

> **GAP A — FIXED**: `ShipmentDeliveryScheduler` (`@Interval`, `shipment/infra/scheduler/`) simulates a carrier delivery callback — marks DISPATCHED shipments DELIVERED → `ShipmentDelivered` → saga `COMPLETED` + order `DELIVERED`.
> **GAP B — FIXED**: saga handlers now update the Order on every leg — `recordPaymentStatus`/`recordShipmentStatus` denormalized projections (D4b), and `PaymentFailedHandler`/`RefundIssuedHandler`/`SagaTimeoutScheduler` cancel the Order (`Order.isCancellable()` guard respects D6a). `Order.reconstitute` + `OrderMapper` round-trip the denormalized columns.
> **SQLite concurrency — FIXED**: switched the app datasource from async `sqlite3` to **`better-sqlite3`** (synchronous) — the three `@Interval` writers + HTTP commands were interleaving `BEGIN`s on SQLite's single connection (`cannot start a transaction within a transaction`). Tests still use in-memory `sqlite` (no concurrency). `logging` is now env-gated (`DB_LOG=1`).

---

## Phase 7: Domain Exception Handling

- [x] Shared `DomainException` base (`shared/exceptions/`, framework-free, `category: NOT_FOUND/CONFLICT`, `name` = subclass)
- [x] Concrete: `Order/Payment/ShipmentNotFoundException` + `SagaNotFoundException` (NOT_FOUND); `InvalidOrder/Payment/ShipmentStateException`, `OrderNotCancellableException` (CONFLICT, D6a) — in each BC's `domain/exceptions/`
- [x] Replace generic `Error` in guards/handlers; messages preserved (all aggregate state-transition guards + every not-found in command/query/saga handlers). VO validation + `Order.create`/`Shipment.create` input guards + the refund operational throws intentionally left as `Error` (not client-facing rule violations)
- [x] `DomainExceptionFilter` (`shared/filters/`, `@Catch(DomainException)`) → `STATUS_BY_CATEGORY` 404/409 map → `{statusCode,error,message}`; registered globally in `main.ts`
- [x] Tests: `domain-exception.filter.spec.ts` — NOT_FOUND→404, CONFLICT (invalid state + not-cancellable)→409 with body, **ValidationPipe 400 not hijacked** (filter only catches `DomainException`)
- [x] **Verify**: `tsc` OK; full suite 168/46 green. Live curl matrix (malformed→400 / missing→404 / invalid transition→409 / zero 500s) deferred to the Phase 6 walkthrough.

---

## Phase 8: Test Strategy (index)

| Layer | Phase | Test Type | Mock |
|---|---|---|---|
| Domain (VO, Model, **Saga PM**) | 1 | Pure unit | None |
| Application Handler + **saga event handlers** | 2 | Unit | Port + dedup |
| Infra (Repo, Mapper, **Outbox relay**, ACL) | 3 | Integration | Real SQLite |
| Presenters | 4 | e2e | Service only |
| Module Wiring | 5 | DI smoke | Optional override |
| Exception Filter | 7 | Filter mapping | None |
| **Saga retry + duplicate delivery** | 2/3 | Integration | Real relay |

---

## Advanced Pass Criteria (completion judgment)

- [ ] All Intermediate criteria (0 framework imports in `domain/`; Service Placement documented; cross-BC wiring in one module; single `@Transactional()` multi-repo write; composite VO tested)
- [ ] At least one Domain Event has a documented **failure policy** + **idempotency key** in DESIGN.md ✅ (full event table present)
- [ ] At least one Domain Event uses the **outbox**: row inserted in the same TX as the Aggregate change; relay delivers async
- [ ] At least one **Saga path tested for retry AND duplicate delivery**
- [ ] **No `forwardRef()`** to break BC cycles — events/shared abstractions instead
- [ ] Can explain the **eventual-consistency boundary**: what briefly disagrees (`PENDING_SHIPMENT` while saga in flight) and how it converges

> Tier limits (DESIGN.md "Open Questions"): in-process bus + single DB; dead-letter is a sketch; full refund only; cancel-after-SHIPPED rejected; single relay instance.
