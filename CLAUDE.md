# NestJS DDD + CQRS Learning Platform

## Platform Overview

A learning platform for practicing NestJS, CQRS, and four-layer DDD architecture by applying the same pattern across multiple domains. Each learning session, called a **playthrough**, follows the same workflow: choose a domain idea and tier -> generate a PRD -> Strategic Design -> Tactical Design -> 8-phase coding.

Learning outputs such as PRD, Strategic Design, Tactical Design, and code are isolated under `workspace/`, which is ignored by Git. The same domain can be repeated with different tiers or different design choices.

## Directory Structure

```text
nestjs/                            # learning platform root
|-- CLAUDE.md                      # this document
|-- PLAN.md                        # 8-phase curriculum and tier model
|-- PROGRESS.md                    # reference example index
|-- docs/                          # learning materials tracked by Git
|   |-- domain-ideas/              # PRD template repository: 7 domains x 3 tiers
|   |   |-- README.md
|   |   |-- _template.md
|   |   |-- inventory-management.md
|   |   |-- reservation-booking.md
|   |   |-- subscription-billing.md
|   |   |-- forum-qa.md
|   |   |-- task-tracker.md
|   |   |-- library-loan.md
|   |   `-- membership-loyalty.md
|   |-- order-management/          # reference example with completed DESIGN/PROGRESS docs
|   `-- reservation-management/    # reference example with Strategic and Tactical docs
|-- order-management/              # reference code: completed NestJS app
|-- reservation-management/        # reference code: multi-aggregate pattern
`-- workspace/                     # learning outputs ignored by Git
    `-- <playthrough>/             # e.g. inventory-basic or forum-qa-advanced
        |-- product-requirements.md
        |-- docs/
        |   |-- strategic-design/  # output from /strategic-design
        |   |-- DESIGN.md          # Tactical Design
        |   `-- PROGRESS.md        # 8-phase checklist
        `-- code/                  # NestJS app
            `-- src/
```

## Starting a Learning Session

When starting a new domain session:

1. **Trigger**: the user says something like "start DDD learning", "start a new domain", or "start learning".
2. **Choose domain**: Claude presents the seven options in `docs/domain-ideas/`.
3. **Choose tier**: basic, intermediate, or advanced.
   - **Basic**: 1 Aggregate, linear state transition, single BC.
   - **Intermediate**: 2 Aggregates, 1-2 BCs, cross-aggregate validation, Domain Service.
   - **Advanced**: 3+ Aggregates, 2+ BCs, Domain Events, Saga.
4. **Confirm playthrough name**: default is `<idea-slug>-<tier>`, such as `inventory-basic`; the user may change it.
5. **Generate PRD**: create `workspace/<playthrough>/product-requirements.md` from the selected tier section.
6. **Review PRD**: the user reads and edits if needed.
7. **Strategic Design**: run `/strategic-design --prd workspace/<playthrough>/product-requirements.md`.
   - Output: `workspace/<playthrough>/docs/strategic-design/`.
8. **Tactical Design**: create `workspace/<playthrough>/docs/DESIGN.md` interactively from STRATEGIC.md; see PLAN.md Phase -1.
9. **8-phase coding**: implement under `workspace/<playthrough>/code/`; progress lives in `workspace/<playthrough>/docs/PROGRESS.md`.

Important rules:
- All learning outputs stay under `workspace/`, which is Git-ignored.
- Reference examples live in `order-management/` and `reservation-management/`.
- `docs/domain-ideas/<idea>.md` contains domain information and pre-baked answers for all three tiers.

## Reference Implementations

| Name | Domain | Learning Pattern | Status |
|---|---|---|---|
| `order-management` | Order management | Single BC, Order/OrderItem (Root + child Entity) | Complete |
| `reservation-management` | Room reservation | 2 BCs, Cross-BC Port, Domain Service | In progress, for reference |

New learning work happens under `workspace/`. The examples above are pattern references only.

## Collaboration Style

- The user writes the code for each step. Claude provides guidance.
- After each step, the user runs verification commands and shares results for feedback.
- Support order: hint first, then more specific guidance, then code if needed.

## Progress

Track sub-project progress with checkboxes in `PROGRESS.md`.

## Learning Plan

See `PLAN.md` for the 8-phase curriculum and next domain candidates.

## Strategic Design Skill

Use the `/strategic-design` skill to start Strategic Design for a new domain. It runs a multi-agent discussion with four roles: Domain Expert, Solution Architect, Tech Lead, and Product Owner.

Two modes are supported:
- **PRD mode**: `/strategic-design --prd workspace/<playthrough>/product-requirements.md`. This is recommended for the learning workflow. The skill fills Phase 0/1 from the PRD's pre-baked discovery answers and outputs to `workspace/<playthrough>/docs/strategic-design/`.
- **Socratic mode**: `/strategic-design <domain>`. The skill asks five Phase 1 questions and outputs to `docs/<domain>/strategic-design/`.

Keep Strategic Design separate from Tactical Design (`DESIGN.md`) because they operate at different abstraction levels.

## Architecture Summary

```text
presenters/http/     # HTTP entry point: Controller, DTO
      v
application/         # use-case orchestration: Service, Command/Query Handler, Port
      v
domain/              # pure business rules: VO, Model, Factory
      ^
infra/               # external implementations: TypeORM Repository, Mapper
```

Dependencies flow from top to bottom. Infrastructure implements Ports defined in the application layer.

## Core Rules

- No TypeORM or NestJS imports inside `domain/`, except `@Injectable` where this project explicitly allows it.
- No `infra/` imports inside `application/`.
- Ports are `abstract class` values so they can be used as runtime DI tokens.
- A module is the only place where a Port is bound to an implementation.

## Code Conventions

### Domain Class Method Order

Aggregate Roots and Entities under `domain/models/` follow this order, based on `order-management/order.model.ts`.

1. **Field declaration** through `private constructor` parameter properties.
2. **Static factories** such as `static create()` and `static reconstitute()`.
3. **Getters** such as `getId()` and `getStatus()`.
4. **Business behavior** such as `addItem()`, `confirm()`, `cancel()`, and state-transition methods.
5. **Derived calculations / queries** such as `getTotalPrice()` and `isActive()`.

Group methods by category and leave one blank line between categories.

Classic DDD often emphasizes behavior before getters, but this project keeps the order above for consistency.

### VO Method Order

Value Objects under `domain/vo/` follow this order:

1. `private constructor`
2. `static create()` with validation
3. `getValue()` / `getX()` getters
4. `equals()`
5. Domain methods such as `overlaps()` and `contains()`

### Naming Rules

- Existence queries: use `exists()`, not `isExists` or `doesExist`.
- State/property booleans: use `is~` only for adjective-like states such as `isActive`, `isExpired`, and `isEmpty`.
- Verb booleans: use the verb itself, such as `overlaps`, `contains`, and `equals`.
