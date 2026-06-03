# Order Management (Intermediate Tier)

A reference implementation of an order management system applying DDD Strategic/Tactical Design and CQRS on top of a NestJS 4-Layer architecture.

> This is the Intermediate Tier — **two Aggregates** (`Order`, `Payment`) across **two Bounded Contexts**, linked by ID only, with a **Cross-BC Port (ACL)**, a pure **Domain Service**, and a single **`@Transactional()`** spanning two repositories.

---

## Core Concepts

| Area | Applied |
|------|---------|
| **DDD Strategic Design** | 2 Bounded Contexts (`Order`, `Payment`), Subdomain classification (Core/Supporting), Context Map, Ubiquitous Language |
| **DDD Tactical Design** | 2 Aggregate Roots, Value Objects, state-transition invariants, cross-Aggregate references by ID only |
| **Anti-Corruption Layer** | Cross-BC Ports speak primitives; an adapter translates to the other BC's domain types |
| **Domain Service** | `PaymentCoordinator.canShip(order, isPaid)` — a pure rule crossing two Aggregates |
| **CQRS** | Separate Command/Query paths, distinct Read Model, Query bypasses the domain |
| **Transactions** | One `@Transactional()` commits an Order transition + a new Payment together (CLS, no `EntityManager` in `application/`) |
| **Exception mapping** | Typed `DomainException` + a `@Catch` filter mapping categories to HTTP status |
| **4-Layer Architecture** | presenters / application / domain / infra, per BC |

---

## Tech Stack

- **Framework**: NestJS 11
- **CQRS**: `@nestjs/cqrs`
- **ORM**: TypeORM 0.3 + sqlite3
- **Transactions**: `typeorm-transactional` (`@Transactional()`, CLS)
- **Validation**: `class-validator` / `class-transformer`
- **Language**: TypeScript 5 (strict null checks)
- **Test**: Jest (unit + integration + controller e2e), Supertest

---

## Bounded Contexts

```
┌─────────────────────────────┐         ┌─────────────────────────────┐
│  BC: Order (Core)           │         │  BC: Payment (Supporting)   │
│  Aggregate: Order + Item    │         │  Aggregate: Payment         │
│                             │         │                             │
│  application/ports/         │  ACL    │  application/ports/         │
│   PaymentCommandPort   ─────┼────────▶│   PaymentRepositoryPort     │
│   PaymentStatusQueryPort ───┼────────▶│   PaymentQueryPort          │
│  infra/adapters/  (translate primitives ↔ Payment domain types)     │
└─────────────────────────────┘         └─────────────────────────────┘
        Order → Payment is one-way. Payment stores orderId as a plain
        column (no FK) and never imports Order.
```

- **Order** owns the order lifecycle and, on confirmation, asks Payment to create a payment record **in the same transaction**.
- **Payment** owns settlement (`succeed`/`fail`) and `refund`. It knows the Order only by `orderId`.
- The dependency is **unidirectional** (`order → payment`) and wired through `PaymentPortsModule` — no `forwardRef()`.

---

## Architecture

```
presenters/http     # Controller, Request DTO (class-validator)
      ↓
application         # Command/Query Handler, Service facade, Ports (incl. Cross-BC ACL Ports)
      ↓
domain              # Aggregate, Entity, VO, Domain Service, Exceptions — no framework deps
      ↑
infra               # TypeORM Entity, Repository, Mapper, Query, Cross-BC Adapter
```

**Dependency direction**: top to bottom. Infrastructure implements Ports defined by the application layer to invert the dependency.

### CQRS Path Separation

```
Command path:  Controller → OrderService → CommandBus → CommandHandler → RepositoryPort → DB
                                                              ↓
                                                       Aggregate (domain)

Query path:    Controller → OrderService → QueryBus → QueryHandler → QueryPort → DB
                                                            ↓
                                                      ReadModel (DTO, bypasses domain)
```

**Rule**: Query Handlers never call `reconstitute()` or a Mapper. Read Model DTOs are projected directly from the ORM.

---

## Directory Structure

```
src/
├── order/                              # BC: Order
│   ├── domain/
│   │   ├── vo/                         # OrderId, OrderItemId, Money, Quantity
│   │   ├── enums/                      # order-status.enum.ts
│   │   ├── models/                     # order.model.ts (Root), order-item.model.ts
│   │   ├── factories/                  # order.factory.ts
│   │   ├── services/                   # payment-coordinator.ts (pure Domain Service)
│   │   └── exceptions/                 # *.exception.ts (category-based)
│   ├── application/
│   │   ├── commands/handlers/          # create / confirm / cancel / ship
│   │   ├── queries/{dtos,handlers}/    # OrderReadModel
│   │   ├── ports/                      # order.repository.port, order.query.port,
│   │   │                               #   payment-command.port, payment-status-query.port (ACL)
│   │   └── services/                   # order.service.ts (facade)
│   ├── infra/
│   │   ├── entities/  mappers/  repositories/  queries/
│   │   └── adapters/                   # PaymentCommandAdapter, PaymentStatusQueryAdapter (ACL impl)
│   ├── presenters/http/{controllers,dtos}/
│   ├── order.module.ts
│   └── payment-ports.module.ts         # ACL bridge: binds the Cross-BC Ports
│
├── payment/                            # BC: Payment (mirrors the 4 layers)
│   └── ... domain / application / infra / presenters / payment.module.ts
│
└── shared/
    ├── exceptions/                     # DomainException base (category: NOT_FOUND | CONFLICT)
    └── filters/                        # DomainExceptionFilter (@Catch → HTTP status)
```

---

## Domain Model

### Order Aggregate

- **Invariants**: a confirmed order has ≥ 1 item; `totalAmount = Σ(unitPrice × quantity)`; `SHIPPED` is terminal (cannot be cancelled); shipping requires payment success.
- **State transitions**:
  ```
  PENDING ──confirm()──→ CONFIRMED ──ship(isReadyToShip)──→ SHIPPED
     │                       │
     └────cancel()───────────┴──→ CANCELLED
  ```

### Payment Aggregate

- **Invariants**: state transitions follow the allowed graph only; `amount` is immutable after creation; `refund()` only from `SUCCEEDED`.
- **State transitions**:
  ```
  REQUESTED ──succeed()──→ SUCCEEDED ──refund()──→ REFUNDED
      │
      └──fail()──→ FAILED
  ```

### Value Objects

| VO | Validation |
|----|------------|
| `OrderId`, `OrderItemId`, `PaymentId` | UUID v4; two-method factory (`generate()` / `create(value)`) |
| `Money` | Non-negative finite amount, same-currency arithmetic only (defined separately per BC) |
| `Quantity` | Integer ≥ 1 |

> Cross-Aggregate reference: `Payment.orderId` is a plain `string` (indexed, no FK), not an `OrderId` VO — each Aggregate is independently loadable.

---

## API

### Order

| Method | Path | Use Case |
|--------|------|----------|
| `POST` | `/orders` | Create an order → `{ orderId }` |
| `POST` | `/orders/:id/confirm` | Confirm (body `{ paymentMethod }`) — **creates a Payment in the same TX** |
| `POST` | `/orders/:id/cancel` | Cancel the order |
| `POST` | `/orders/:id/ship` | Ship (allowed only if confirmed **and** paid) |
| `GET` | `/orders/:id` | Read the order (Read Model) |

### Payment

| Method | Path | Use Case |
|--------|------|----------|
| `POST` | `/payments/:id/settle` | Settle (body `{ result: "SUCCEEDED" \| "FAILED" }`) |
| `POST` | `/payments/:id/refund` | Refund a succeeded payment |
| `GET` | `/payments/:id` | Read the payment (Read Model) |

### Error taxonomy

| Status | When |
|--------|------|
| `400` | Malformed body (`ValidationPipe`) or malformed `:id` (`ParseUUIDPipe`) |
| `404` | Aggregate not found (`*NotFoundException`, category `NOT_FOUND`) |
| `409` | Invalid state transition (`Invalid*StateException`, category `CONFLICT`) |

### Request Examples

```bash
# Create → Confirm (creates Payment) → Settle → Ship
ORDER=$(curl -s -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"customerId":"c1","items":[{"productId":"p1","productName":"Laptop","unitPrice":1500000,"currency":"KRW","quantity":1}]}')
OID=$(echo "$ORDER" | sed -E 's/.*"orderId":"([^"]+)".*/\1/')

curl -X POST "http://localhost:3000/orders/$OID/confirm" \
  -H "Content-Type: application/json" -d '{"paymentMethod":"CARD"}'

# (look up the payment id for the order, then:)
curl -X POST "http://localhost:3000/payments/<paymentId>/settle" \
  -H "Content-Type: application/json" -d '{"result":"SUCCEEDED"}'

curl -X POST "http://localhost:3000/orders/$OID/ship"
curl "http://localhost:3000/orders/$OID"
```

---

## Getting Started

### Install

```bash
cd code
npm install
```

### Run

```bash
npm run start          # development
npm run start:dev      # watch mode
```

The default port is `3000`. A SQLite database file (`order-management.sqlite`) is created at the project root. `main.ts` calls `initializeTransactionalContext()` before bootstrap and registers a global `ValidationPipe` + `DomainExceptionFilter`.

### Test

```bash
npm test               # 98 tests across 31 suites (unit + integration + controller e2e)
npm run test:cov       # coverage
```

All tests run under the default Jest config as `*.spec.ts`: pure domain unit tests, port-mocked handler tests, real-SQLite repository/mapper/query integration tests, the `@Transactional` rollback integration test, controller e2e (`INestApplication` + Supertest), a DI smoke test, and the exception-filter mapping test.

---

## Key Design Decisions

### 1. Aggregate boundary = transaction boundary = consistency boundary

Within an Aggregate (`Order` ↔ `OrderItem`) `@OneToMany`/`@ManyToOne` is fine. Across Aggregates (`Payment` → `Order`), store only the foreign ID (`orderId`) with `@Index()` — never a real FK. Each Aggregate loads and stays consistent on its own.

### 2. Cross-BC Port (ACL) speaks primitives

`PaymentCommandPort`/`PaymentStatusQueryPort` are defined in **Order's** application layer and expose primitives (`orderId`, `amount`, `currency`, `method`). The adapters in `order/infra/adapters/` translate to Payment's domain types and delegate to Payment's ports. Order domain/application code never imports Payment vocabulary — so splitting Payment into its own service later means swapping one adapter class.

### 3. The Cross-BC binding lives in `PaymentPortsModule`

The adapters depend on `PaymentRepositoryPort`/`PaymentQueryPort`, which only resolve where `PaymentModule` is imported. So the port binding lives in `PaymentPortsModule` (which imports `PaymentModule` and exports the two ACL ports), not in `OrderModule`. `OrderModule` just imports `PaymentPortsModule` — one-way, no `forwardRef()`.

### 4. Pure Domain Service, fact injected

`PaymentCoordinator.canShip(order, isPaid)` is a rule over two Aggregates but takes `isPaid` as a boolean argument. The handler obtains the fact via `PaymentStatusQueryPort` and passes it in, so the domain never depends on a Port.

### 5. One `@Transactional()` for confirm + Payment creation

`ConfirmOrderCommandHandler` confirms the Order **and** creates the Payment under a single `@Transactional()`. If payment creation throws, the order transition rolls back too — proven by an integration test. Transaction context propagates via CLS; `application/` contains no `EntityManager`/`QueryRunner`.

### 6. Category-based domain exceptions

`DomainException` carries a semantic `category` (`NOT_FOUND` / `CONFLICT`), not an HTTP number — the domain stays transport-agnostic. `DomainExceptionFilter` owns the `category → status` table. Malformed ids are rejected earlier by `ParseUUIDPipe` (400), so a bad id never reaches the not-found path.

### 7. Query path bypasses the domain

`OrderQueryPort`/`PaymentQueryPort` are separate from the repository ports and return flat Read Model DTOs projected straight from ORM entities — no `reconstitute()`, no Mapper on the read side.

---

## Design Documents

- [Strategic Design](docs/strategic-design/STRATEGIC.md) — Bounded Contexts, Subdomains, Context Map, Ubiquitous Language
- [Tactical Design](docs/DESIGN.md) — Aggregates, VOs, state transitions, Service Placement, Consistency Boundaries
- [Progress](docs/PROGRESS.md) — the 8-phase build log with per-phase lessons

---

## Tiers

- **Basic Tier**: a single Aggregate and a single BC — see [`../order-management-basic`](../order-management-basic).
- **Intermediate Tier** (this): 2 Aggregates / 2 BCs, Cross-BC Port (ACL), Domain Service, `@Transactional`, exception filter.
- **Advanced Tier**: Domain Events, Saga/Process Manager, outbox — `PaymentSucceeded → auto-ship`, `RefundIssued ↔ OrderCancelled` compensation.

---

## License

MIT
