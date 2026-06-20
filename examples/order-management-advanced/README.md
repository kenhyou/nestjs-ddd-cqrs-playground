# Order Management (Advanced Tier)

A reference implementation of an **event-driven, eventually-consistent order fulfillment system** built with NestJS. It applies DDD (tactical patterns), CQRS, and a strict four-layer architecture across three Bounded Contexts, coordinated entirely by a **Transactional Outbox** and a stateful **Saga / Process Manager**.

> This is the Advanced Tier — 3 Aggregates across 3 Bounded Contexts, Domain Events, Transactional Outbox, idempotent at-least-once consumers, compensation, and timeouts. (See also the Basic and Intermediate tiers in `examples/`.)

The interesting part is not the domain (orders, payments, shipments) but the **mechanics of doing it correctly**: no dual writes, at-least-once delivery made safe by idempotent consumers, compensation, timeouts, and anti-corruption layers around mocked external systems.

---

## Core Concepts

| Area | Applied |
|------|---------|
| **DDD Strategic Design** | 3 Bounded Contexts (`order`, `payment`, `shipment`), event-driven Context Map, Ubiquitous Language |
| **DDD Tactical Design** | Aggregates, Value Objects, Domain Events, a **Process Manager** (`FulfillmentSaga`) |
| **CQRS** | Separate Command/Query paths; the Query path bypasses the domain and returns Read Model DTOs |
| **4-Layer Architecture** | presenters / application / domain / infra |
| **Transactional Outbox** | State change + emitted events commit in one transaction; a polling relay delivers asynchronously |
| **Idempotency** | At-least-once relay + `message_id` dedup at consumers + saga state-machine guards |
| **Saga + Compensation** | Payment → shipment orchestration, refunds on failure, per-step timeouts |
| **Anti-Corruption Layer** | Mock gateway/carrier expose an ugly external shape; adapters translate it |

---

## Tech Stack

- **Framework**: NestJS 11
- **CQRS**: `@nestjs/cqrs`
- **ORM**: TypeORM 0.3 + `better-sqlite3`, with `typeorm-transactional` (`@Transactional()` via CLS)
- **Scheduling**: `@nestjs/schedule` (outbox relay, saga timeout, delivery simulation)
- **Validation**: `class-validator` / `class-transformer` (global `ValidationPipe`)
- **Test**: Jest (unit + integration + e2e), Supertest

> **Why `better-sqlite3`?** The async `sqlite3` driver keeps a single connection; with several `@Interval` writers (relay + schedulers) plus HTTP commands, their transactions interleave and SQLite rejects the concurrent `BEGIN` (`cannot start a transaction within a transaction`). The synchronous `better-sqlite3` driver serializes transactions and removes the race. (Tests use in-memory `sqlite` — no concurrency there.)

---

## Architecture

```
            HTTP (controllers, DTOs, ParseUUIDPipe, ValidationPipe)
                              │  presenters/http
                              ▼
        application  (CQRS handlers, Ports, Saga event handlers, Service facade)
                              │
                              ▼
              domain  (Aggregates, VOs, Domain Events, FulfillmentSaga)
                              ▲
                              │  implements Ports
        infra  (TypeORM entities/repositories/queries, ACL adapters, schedulers)
```

**Dependency direction**: top to bottom. Infrastructure implements Ports (`abstract class` DI tokens) defined by the application layer.

- **Bounded Contexts** communicate **only via domain events** through the outbox — no BC imports another BC's `infra/`, and there is zero `forwardRef()`.
- **Aggregate boundaries are real**: `Order ↔ OrderItem` is one aggregate (FK allowed); every cross-aggregate reference (`payment.orderId`, `shipment.orderId`, `saga.orderId`) is a plain indexed column with **no FK**.

### The happy-path flow (every step is asynchronous, driven by the outbox relay)

```
POST /orders             → Order(PENDING)
POST /orders/:id/confirm → Order(CONFIRMED) + OrderConfirmed ─┐
                                                              │ relay
  OrderConfirmed     → StartSaga              → RequestPayment
  RequestPayment     → Payment.charge (ACL)   → PaymentSucceeded
  PaymentSucceeded   → saga + Order(PENDING_SHIPMENT) → RequestShipment
  RequestShipment    → Shipment.dispatch (ACL)→ ShipmentDispatched
  ShipmentDispatched → saga + Order(SHIPPED)
  ShipmentDelivered* → saga(COMPLETED) + Order(DELIVERED)
```

`*` Delivery is simulated by a carrier-callback scheduler (`ShipmentDeliveryScheduler`), mirroring a real carrier webhook.

**Compensation & timeout:** a declined payment cancels the order; a failed dispatch triggers a refund then cancels the order; a saga that sits in an `AWAITING_*` step past its deadline is compensated by `SagaTimeoutScheduler`. Cancelling an order that has already shipped is rejected (`409`).

---

## Running

```bash
cd code
npm install
npm run start          # http://localhost:3000  (creates ./order-management.sqlite)
npm run start:dev      # watch mode
```

```bash
npm test               # 46 suites / 170 tests
npm run test:cov       # coverage
```

Environment variables (all optional):

| Var | Default | Purpose |
|-----|---------|---------|
| `PORT` | `3000` | HTTP port |
| `DB_PATH` | `order-management.sqlite` | SQLite file (use `:memory:` for ephemeral) |
| `DB_LOG` | `0` | `1` enables TypeORM query logging |
| `CARRIER_FORCE_FAIL` | `false` | `true` makes every shipment dispatch fail (demoes shipment-fail compensation) |

---

## API

| Method & path | Description |
|---|---|
| `POST /orders` | Create an order → `{ orderId }` |
| `POST /orders/:id/confirm` | Confirm → starts the fulfillment saga |
| `POST /orders/:id/cancel` | Cancel (rejected with `409` once shipped) |
| `GET /orders/:id` | Order read model (incl. denormalized `paymentStatus`/`shipmentStatus`) |
| `GET /payments/:id` | Payment read model (inspection only) |
| `GET /shipments/:id` | Shipment read model (inspection only) |

Payment/shipment aggregates are created by event handlers, never by HTTP.

### Try it (curl)

**Happy path — converges to `DELIVERED`:**

```bash
ID=$(curl -s -X POST localhost:3000/orders -H 'content-type: application/json' \
  -d '{"customerId":"c1","items":[{"productId":"p1","productName":"Widget","unitPrice":100,"currency":"USD","quantity":2}]}' \
  | jq -r .orderId)

curl -s -X POST localhost:3000/orders/$ID/confirm
# poll — status walks PENDING → CONFIRMED → PENDING_SHIPMENT → SHIPPED → DELIVERED
curl -s localhost:3000/orders/$ID | jq
```

**Payment-failure compensation** — order total `99999` is the gateway force-fail sentinel:

```bash
ID=$(curl -s -X POST localhost:3000/orders -H 'content-type: application/json' \
  -d '{"customerId":"c2","items":[{"productId":"x","productName":"Pricey","unitPrice":99999,"currency":"USD","quantity":1}]}' \
  | jq -r .orderId)
curl -s -X POST localhost:3000/orders/$ID/confirm
# converges to CANCELLED, paymentStatus=FAILED
```

**Shipment-failure compensation** — boot with the carrier failing:

```bash
CARRIER_FORCE_FAIL=true npm run start
# any confirmed order → dispatch fails → refund → CANCELLED (paymentStatus=REFUNDED, shipmentStatus=FAILED)
```

---

## Project structure

```
code/src/
├── order/                         # BC: Order + FulfillmentSaga (Process Manager)
│   ├── presenters/http/           #   controllers, request DTOs
│   ├── application/               #   commands, queries, ports, saga event handlers, service
│   ├── domain/                    #   Order, OrderItem, FulfillmentSaga, VOs, events, exceptions
│   └── infra/                     #   entities, mappers, repositories, queries, scheduler (timeout)
├── payment/                       # BC: Payment (+ gateway ACL adapter)
├── shipment/                      # BC: Shipment (+ carrier ACL adapter, delivery scheduler)
├── outbox/                        # shared infra: outbox tables, relay, message dispatcher
│   ├── entities/                  #   outbox_events, processed_messages
│   ├── repositories/              #   OutboxRepository (append in caller's TX, dedup, relay reads)
│   └── relay/                     #   OutboxRelayService (@Interval), MessageDispatcher (discovery)
├── shared/                        # DomainException base + filter, AggregateRoot, messaging contract
└── app.module.ts                  # TypeORM + transactional datasource + ScheduleModule wiring
```

---

## How the outbox works

1. **Write side** — each aggregate records domain events; `pullEvents()` drains them. The BC repository serializes them into `outbox_events` rows **in the same `@Transactional` as the aggregate save** (`OutboxRepository.append` has no transaction of its own — it joins the caller's).
2. **Relay** — `OutboxRelayService` polls unpublished rows every second, hands each to the `MessageDispatcher`, then stamps `published_at` in a **separate** transaction (a crash in between simply redelivers next tick).
3. **Dispatch + dedup** — `MessageDispatcher` discovers every `MessageHandler` across all modules (Nest `DiscoveryService`) and routes by `messageType`. Each handler runs in one transaction that first claims `(consumerName, messageId)` in `processed_messages`; a duplicate claim is a unique-violation → the handler is skipped. Claim and effect commit together, so redelivery is harmless.

---

## Notes & known trade-offs (learning scope)

- In-process event bus + a single SQLite database; a single relay instance (no sharding).
- Dead-lettering is not implemented — a permanently failing row is retried indefinitely.
- The carrier force-fail hook is **per-process config** (`CARRIER_FORCE_FAIL`), not a per-order sentinel, because the carrier only receives `orderId`. The payment force-fail uses a per-order amount sentinel (`99999`).
- Saga step timeout is a fixed 30s constant (`FulfillmentSaga.STEP_TIMEOUT_MS`).

---

## Design docs

- [Strategic Design](docs/strategic-design/STRATEGIC.md) — Bounded Contexts, Subdomains, Context Map, Ubiquitous Language
- [Tactical Design](docs/DESIGN.md) — Aggregates, VOs, the saga model, outbox/idempotency schema, decisions (D1–D6)
- [Build progress](docs/PROGRESS.md) — the 8-phase build log with live-verification results
- [Product requirements](product-requirements.md)
