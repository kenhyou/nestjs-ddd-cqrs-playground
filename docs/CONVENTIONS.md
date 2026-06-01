# Implementation Conventions

Cross-playthrough conventions for the four-layer DDD + CQRS structure. This exists so guidance stays consistent across playthroughs **without** re-reading prior code each time. When a new convention is decided, **update this file**.

- **Authoritative reference**: `examples/order-management-basic/` (git-tracked, committed). When in doubt, match it.
- For **layering rules, method order, boolean naming**, see `CLAUDE.md` (authoritative — not duplicated here).
- For the **8-phase curriculum and per-layer tests**, see `PLAN.md` (authoritative).
- This file covers **file/folder naming, class skeletons, and testing conventions**.

> **Known deviations — do NOT copy from `workspace/reservation-management`** (a gitignored practice run):
> 1. its query handlers return **domain models** via the repository port — violates the read-bypass rule (use Query Port → Read Model);
> 2. it uses `infra/persistence/orm/...` — we use a flat `infra/` (below).
>
> **Project deviations from the reference that ARE our standard** (intentional): two-method ID VO (`generate()` + `create(value)`); command handler files named `*.command.handler.ts` (for symmetry with `*.command.ts` and `*.query.handler.ts`); keep the service facade.

---

## Folder structure (per Bounded Context)

```text
src/<bc>/
├── presenters/http/{controllers,dtos,filters}
├── application/
│   ├── commands/                 # command data containers
│   │   └── handlers/             # @CommandHandler classes
│   ├── queries/                  # query data containers
│   │   ├── dtos/                 # <name>.read-model.ts
│   │   └── handlers/             # @QueryHandler classes
│   ├── ports/                    # abstract-class ports (repository, query, cross-BC)
│   └── services/                 # thin CommandBus/QueryBus facade
├── domain/
│   ├── models/                   # aggregates + entities (.model.ts)
│   ├── vo/                       # value objects (.vo.ts)
│   ├── enums/                    # plain enums (.enum.ts) — status, method
│   ├── factories/                # (.factory.ts)
│   ├── services/                 # domain services
│   └── exceptions/               # (.exception.ts)
└── infra/                        # FLAT — no persistence/orm/ nesting
    ├── entities/                 # <aggregate>.entity.ts (TypeORM)
    ├── mappers/                  # <aggregate>.mapper.ts
    ├── repositories/             # <aggregate>.repository.ts (write impl)
    ├── queries/                  # <aggregate>.query.ts (read/Query Port impl)
    └── adapters/                 # cross-BC ACL adapters (only where this BC consumes another)
src/shared/                       # framework-free cross-cutting (e.g. assert-uuid), global filter
```

Multi-BC playthroughs use **per-BC path aliases**: `@order/*`, `@payment/*`, `@shared/*` (tsconfig `paths` + Jest `moduleNameMapper`).

---

## File naming

| Artifact | Pattern | Example |
|---|---|---|
| Value Object | `<name>.vo.ts` | `money.vo.ts`, `order-id.vo.ts` |
| Plain enum (status/method) | `<name>.enum.ts` in `domain/enums/` | `order-status.enum.ts`, `payment-method.enum.ts` |
| Aggregate / Entity | `<name>.model.ts` | `order.model.ts`, `order-item.model.ts` |
| Factory | `<name>.factory.ts` | `order.factory.ts` |
| Domain Service | `<name>.ts` (descriptive) | `payment-coordinator.ts` |
| Domain Exception | `<name>.exception.ts` | `order-not-found.exception.ts` |
| Repository Port (write) | `<aggregate>.repository.port.ts` | `order.repository.port.ts` |
| Query Port (read) | `<aggregate>.query.port.ts` | `order.query.port.ts` |
| Cross-BC Port (ACL) | `<capability>.port.ts` | `payment-command.port.ts`, `payment-status-query.port.ts` |
| Read Model DTO | `<name>.read-model.ts` in `queries/dtos/` | `order.read-model.ts` |
| Command | `<verb>-<aggregate>.command.ts` | `create-order.command.ts` |
| Command Handler | `<verb>-<aggregate>.command.handler.ts` (class `…CommandHandler`) | `create-order.command.handler.ts` |
| Query | `<verb>-<name>.query.ts` | `get-order.query.ts` |
| Query Handler | `<verb>-<name>.query.handler.ts` | `get-order.query.handler.ts` |
| Service Facade | `<aggregate>.service.ts` | `order.service.ts` |
| ORM Entity | `<aggregate>.entity.ts` in `infra/entities/` | `order.entity.ts` |
| Mapper | `<aggregate>.mapper.ts` in `infra/mappers/` | `order.mapper.ts` |
| Repository impl | `<aggregate>.repository.ts` in `infra/repositories/` | `order.repository.ts` |
| Query impl | `<aggregate>.query.ts` in `infra/queries/` (class `…Query`) | `order.query.ts` |
| Cross-BC Adapter | `<capability>.adapter.ts` in `infra/adapters/` | `payment-command.adapter.ts` |
| Request DTO | `<verb>-<aggregate>.request.ts` in `presenters/http/dtos/` | `create-order.request.ts` |
| Test | `<source>.spec.ts` next to source | `order.model.spec.ts` |

---

## Naming inside classes

- **Getters are entity-prefixed** for id/status/items/total: `getOrderId()`, `getOrderStatus()`, `getOrderItems()`, `getTotalPrice()`, `getOrderItemId()`, `getPaymentId()`, `getPaymentStatus()`. Already-descriptive attributes keep their name: `getCustomerId()`, `getUnitPrice()`, `getQuantity()`, `getAmount()`, `getMethod()`. Fields mirror the getters (`orderId`, `orderStatus`, `orderItems`, `totalPrice`).
- **ID VO factories use two methods** (project standard, an intentional deviation from the reference's overloaded `create()`): `OrderId.generate()` for a new id, `OrderId.create(value)` to wrap/validate an existing one. Clearer intent at call sites.
- **Identity rule**: an aggregate's **own** id is a VO (`paymentId: PaymentId`); a reference to a **foreign** aggregate is a plain `string` (`orderId: string`) — no FK, no foreign VO import.

---

## Class skeletons

### Value Object
`private constructor` → `static create(...)` (validates) / `static generate()` for ID VOs → getters → `equals()` → domain methods. Values `readonly`.

### Aggregate / Entity
`private constructor` (parameter properties) → `static create()` (new, `generate()`s id) / `static reconstitute()` (from DB, receives id, no events) → behavior (guard → mutate) → derived queries → getters. Mutable state fields non-`readonly`; rest `readonly`. Collection getters return a **copy** (`[...this.orderItems]`).

### Port (abstract class — never interface)
```ts
export abstract class OrderRepositoryPort {
  abstract save(order: Order): Promise<void>;
  abstract findById(orderId: OrderId): Promise<Order | null>;
}
```
`abstract class` survives compilation and doubles as the runtime DI token. Bound to an impl in **exactly one module**.

### Command (data container, primitives only)
```ts
export class CreateOrderCommand {
  constructor(public readonly customerId: string, public readonly items: ItemInput[]) {}
}
```

### Command Handler (orchestration only — no business rules)
`@CommandHandler(Cmd)` + `implements ICommandHandler<Cmd>` (single type param even when `execute` returns a value). Convert primitives → load aggregate / build via factory → call domain method → save → optionally return an id. If an `if (status === ...)` appears here, the rule belongs in the aggregate/domain service.

### Query Handler (read path — bypasses domain)
Injects a **Query Port** (not the repository), returns a **Read Model DTO** (not a domain model). Never calls `reconstitute()` or a Mapper.

### Service Facade (kept — per PLAN.md 2.5 and DESIGN.md)
`@Injectable`, injects `CommandBus` + `QueryBus`, one thin method per use case. Controllers call the facade, not the buses directly. (The basic reference injects buses straight into the controller; we keep the facade.)

### Infra
- **Entity**: `@Entity('<table>')`, snake_case columns via `name:`, status as `{ type: 'simple-enum', enum: XStatus }`, money as `decimal` + a separate currency column, `@CreateDateColumn`. `@OneToMany`/`@ManyToOne` only **within** an aggregate (`cascade`, `eager` ok there); across aggregates store the foreign id as a plain indexed column.
- **Mapper**: `@Injectable`, `toOrm(domain)` / `toDomain(entity)` (calls `reconstitute`); inject child mappers for child entities.
- **Repository**: `implements XRepositoryPort`, `@InjectRepository(XEntity)` + injected mapper; returns/accepts domain models.
- **Query impl**: `implements XQueryPort`, projects entities directly into Read Model DTOs (no mapper, no `reconstitute`).

### Cross-BC ACL
Cross-BC Ports speak **primitives** (`{ orderId, amount, currency, method }`), never another BC's VOs/types. The **adapter** (consumer BC's `infra/adapters/`) translates primitives ↔ the producer BC's domain types and delegates to its repository/query port. Each BC defines its **own** `Money` etc. — no shared kernel for domain VOs (sharing a framework-free *utility* like `assert-uuid` is fine).

---

## Testing conventions

- Tests are `*.spec.ts` next to the source; written **during** each phase.
- **Domain tests use zero mocks.** If a domain test needs a mock, the design is wrong.
- **Handler tests mock only the Ports** (`jest.fn()` / fake); use the **real** Factory/Domain Service.
- **Every state transition needs a positive AND a negative test.** Happy-path-only tests hide missing guards.
- **Don't unit-test plain `enum`s** — `Status.X === 'X'` is a tautology.
- **Assert on error *type*, not message.** Until Phase 7's typed exceptions, use bare `.toThrow()` — never couple to message copy.
- **`npm test` green ≠ types OK.** `ts-jest` (`isolatedModules`) skips full type-checking. Always run `npx tsc --noEmit` as a separate gate.
- Request DTOs use `class-validator` decorators (PLAN.md 4.1) even though the basic reference omitted them.
- Keep test helpers local (`buildItem()` / `buildConfirmedOrder()`), not inline IIFEs.

---

## Maintenance

When a new convention or correction emerges, **edit this file in the same session**. It is the single source of truth for structure/naming so future work doesn't re-derive it from prior code.
