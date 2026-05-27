# Order Management (Basic Tier)

A reference implementation of an order management system applying DDD Strategic/Tactical Design and CQRS on top of a NestJS 4-Layer architecture.

> This is the Basic Tier — a single Aggregate (`Order`), a single Bounded Context, and a linear state machine.

---

## Core Concepts

| Area | Applied |
|------|---------|
| **DDD Strategic Design** | Single BC (`Order Management`), Subdomain classification, Ubiquitous Language |
| **DDD Tactical Design** | Aggregate Root + Child Entity, Value Object, state-transition invariants |
| **CQRS** | Separate Command/Query paths, distinct Read Model, Query bypasses the domain |
| **4-Layer Architecture** | presenters / application / domain / infra |
| **Port-Adapter** | `abstract class` Ports bound to implementations in the Module |

---

## Tech Stack

- **Framework**: NestJS 11
- **CQRS**: `@nestjs/cqrs`
- **ORM**: TypeORM 0.3 + better-sqlite3
- **Language**: TypeScript 5.7 (strict null checks)
- **Test**: Jest (unit + e2e), Supertest

---

## Architecture

```
presenters/http     # Controller, Request DTO
      ↓
application         # Command/Query Handler, Port
      ↓
domain              # Aggregate, Entity, Value Object — no external dependencies
      ↑
infra               # TypeORM Entity, Repository implementations, Mapper
```

**Dependency direction**: top to bottom. Infrastructure implements Ports defined by the application layer to invert the dependency.

### CQRS Path Separation

```
Command path:  Controller → CommandBus → CommandHandler → OrderRepositoryPort → DB
                                                ↓
                                          Order Aggregate (domain)

Query path:    Controller → QueryBus → QueryHandler → OrderQueryPort → DB
                                              ↓
                                        OrderReadModel (DTO, bypasses domain)
```

**Rule**: Query Handlers never call `Order.reconstitute()`. Read Model DTOs are built directly from the ORM.

---

## Directory Structure

```
src/order/
├── domain/                          # Domain layer (no TypeORM/NestJS imports)
│   ├── vo/                          # Value Objects
│   │   ├── order-id.vo.ts
│   │   ├── order-item-id.vo.ts
│   │   └── money.vo.ts
│   ├── enums/
│   │   └── order-status.enum.ts
│   └── models/
│       ├── order.model.ts           # Aggregate Root
│       └── order-item.model.ts      # Child Entity
│
├── application/
│   ├── commands/                    # CreateOrder, AddOrderItem, Confirm, Cancel, Ship
│   │   └── handlers/
│   ├── queries/
│   │   ├── handlers/
│   │   └── dtos/                    # OrderReadModel
│   └── ports/
│       ├── order.repository.port.ts # Write Port (abstract class)
│       └── order.query.port.ts      # Read Port (abstract class)
│
├── infra/
│   ├── entities/                    # TypeORM Entity
│   ├── mapper/                      # Domain ↔ ORM Mapper
│   ├── repositories/                # OrderRepositoryPort implementation
│   └── queries/                     # OrderQueryPort implementation
│
├── presenters/
│   └── http/
│       ├── controllers/
│       └── dtos/                    # Request DTO
│
└── order.module.ts                  # Port ↔ implementation binding
```

---

## Domain Model

### Order Aggregate

- **Invariants**:
  - A confirmed (`CONFIRMED`) order must have at least one item.
  - Total price = sum of (item unit price × quantity). Recomputed on every item change.
  - `SHIPPED` is terminal — cannot be cancelled.
- **State transitions**:
  ```
  PENDING ──→ CONFIRMED ──→ SHIPPED
     │              │
     └──────────────┴──→ CANCELLED
  ```

### Value Objects

| VO | Validation |
|----|------------|
| `OrderId`, `OrderItemId` | UUID v4 format |
| `Money` | Non-negative amount, same-currency arithmetic only |

---

## API

| Method | Path | Use Case |
|--------|------|----------|
| `POST` | `/orders` | Create an order → returns `{ orderId }` |
| `POST` | `/orders/:id/items` | Add an item |
| `POST` | `/orders/:id/confirm` | Confirm the order |
| `POST` | `/orders/:id/cancel` | Cancel the order |
| `POST` | `/orders/:id/ship` | Ship the order |
| `GET` | `/orders/:id` | Read the order (Read Model) |

### Request Examples

```bash
# Create an order
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "c1",
    "items": [{"name": "Laptop", "quantity": 1, "unitPrice": 1500000, "currency": "KRW"}]
  }'
# → { "orderId": "<uuid>" }

# Confirm
curl -X POST http://localhost:3000/orders/<uuid>/confirm

# Read
curl http://localhost:3000/orders/<uuid>
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
npm run start:prod     # production
```

The default port is `3000`. A SQLite database file (`order.db`) is created at the project root.

### Test

```bash
npm test               # unit tests (45)
npm run test:e2e       # e2e tests (in-memory SQLite, 2)
npm run test:cov       # coverage
```

---

## Key Design Decisions

### 1. Aggregate boundary and FK

Inside the same Aggregate (`Order` ↔ `OrderItem`), `@OneToMany`/`@ManyToOne` is fine. Across Aggregates, store only the foreign Aggregate ID with `@Index()` — never a real FK constraint. Each Aggregate must be independently loadable and own its own consistency boundary.

### 2. Port = `abstract class`

NestJS's DI container cannot use a TypeScript `interface` as a runtime token. Defining a Port as an `abstract class` gives you both compile-time type-checking and a runtime DI token.

### 3. Query path bypasses the domain

`OrderQueryPort` is intentionally separate from `OrderRepositoryPort`. Calling `Order.reconstitute()` on the read path would:
- Force the full Aggregate to be loaded for a trivial query, and
- Couple read-side requirements (joins, projections) to the domain model's shape.

Reads return a flat `OrderReadModel` DTO assembled directly from ORM entities.

### 4. `create()` vs `reconstitute()`

- `create()`: builds a new object and enforces every invariant.
- `reconstitute()`: rebuilds the object from persistence with no validation.

Mappers always call `reconstitute()`.

### 5. Command can return the new ID

Strict CQRS insists Commands return `void`, but for client ergonomics `CreateOrderCommandHandler` returns the newly generated `orderId`. The domain keeps the responsibility of generating the ID while the client gets what it needs for follow-up calls — a pragmatic compromise.

### 6. HTTP DTO vs Command/Query DTO

- HTTP Request DTO: no constructor, only public properties — works with JSON deserialization.
- Command/Query DTO: constructor with positional arguments — preserves TypeScript type safety in code-driven creation paths.

---

## Design Documents

- [Strategic Design](docs/strategic-design/STRATEGIC.md) — Bounded Context, Subdomain, Context Map, Ubiquitous Language
- [Tactical Design](docs/DESIGN.md) — Aggregate, Entity, VO, state transitions, Use Cases

---

## Next Steps

This is the **Basic Tier** — a single Aggregate and a single BC. Suggested learning path:

- **Intermediate Tier**: multiple Aggregates, Domain Services, Exception Filters mapping domain errors to HTTP status codes.
- **Advanced Tier**: multiple BCs, Domain Events, Saga, Anti-Corruption Layer.

---

## License

MIT
