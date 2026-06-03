# Getting Started with Domain-Driven Design

A beginner's introduction to **Domain-Driven Design (DDD)** and a concrete, staged path for learning it inside this repository.

If you have never written a line of DDD code, start here. You don't need to read a 500-page book first — you need a mental model and a place to practice. This document gives you both.

---

## 1. Why DDD exists

Most software doesn't fail because the algorithms are hard. It fails because, over time, **nobody can say what the code is supposed to do anymore.** Business rules get scattered across controllers, services, SQL, and the occasional `if` buried in a utility file. A new requirement arrives, and changing it safely means archaeology.

DDD is a response to that. Its bet is simple:

> The hardest part of most business software is the **business**, not the technology. So put the business model at the center, and let the technology serve it.

That's the whole philosophy. Everything else — aggregates, bounded contexts, value objects — is tooling in service of that one idea.

### The shift in thinking

Most of us learn to build software **database-first**:

1. Design the tables.
2. Write CRUD endpoints.
3. Sprinkle business logic wherever it's convenient.

This works until the rules get complex. Then the logic ends up everywhere and nowhere — a condition checked in the controller here, re-checked in a service there, silently violated by a third path that forgot. This is the **anemic domain model**: objects that are just bags of data, with all the real behavior living outside them.

DDD flips the order:

1. Understand the business — its language, its rules, its boundaries.
2. Model that directly in code: objects that *enforce their own rules*.
3. Treat the database as a detail you plug in underneath.

A `BankAccount` that lets you set `balance = -1000` from anywhere is anemic. A `BankAccount` whose only way to lose money is `withdraw(amount)` — which *refuses* to overdraw — is a **rich domain model**. DDD is the discipline of building the second kind, consistently, even when the domain is large.

---

## 2. The one example that makes it click

Consider the word **"Product"** in an e-commerce company.

- To the **Catalog** team, a Product is a *name, description, price, and photos*.
- To the **Warehouse** team, a Product is a *weight, dimensions, and shelf location*.
- To the **Shipping** team, a Product is a *package size and fragility*.

There is no single "correct" Product. Forcing all three teams to share one giant `Product` class produces a monster that serves none of them well and breaks whenever any team changes anything.

DDD's answer: **let each team have its own Product, valid only inside its own boundary.** Those boundaries are called **Bounded Contexts**, and learning to find them is half of DDD. The other half is modeling the rules *inside* one boundary really well.

That's the two-level structure of DDD:

| Level | Question it answers | Who's involved |
|---|---|---|
| **Strategic Design** | How do we split a big business into well-bounded parts, and how do they talk? | Domain experts, architects, product, developers |
| **Tactical Design** | Inside one part, how do we model the rules in code so they can't be violated? | Developers |

You'll spend your first weeks mostly on Tactical Design (it's concrete and code-shaped). Strategic Design clicks later, once you've felt the pain it prevents.

---

## 3. Strategic Design — splitting the business

Strategic Design is about managing **complexity through boundaries**. The vocabulary:

- **Domain** — the entire business problem your software addresses (e.g., "online retail").
- **Subdomain** — a coherent slice of it (catalog, ordering, payment, shipping). Subdomains come in three flavors worth knowing early:
  - **Core** — what makes this business special; where your best effort goes.
  - **Supporting** — necessary but not a differentiator.
  - **Generic** — solved problems you could buy off the shelf (auth, email).
- **Ubiquitous Language** — one shared vocabulary used *identically* by business people, in documents, and in code. If the business says "confirm an order," the method is `order.confirm()`, not `order.setStatusToApproved()`. When the language in the code drifts from the language in the meeting room, bugs follow.
- **Bounded Context** — the boundary within which a term has one precise meaning (the "Product" story above). Usually one Bounded Context ≈ one deployable module/service.
- **Context Map** — how the Bounded Contexts relate: who depends on whom, and the *style* of that integration (e.g., a downstream context shielding itself with an **Anti-Corruption Layer (ACL)** so the other side's vocabulary can't leak in).

The deliverable of Strategic Design isn't code — it's a shared understanding: *these are our contexts, this is our language, this is how they connect.*

---

## 4. Tactical Design — modeling inside a boundary

Tactical Design is the pattern toolkit for turning one Bounded Context's rules into code that defends itself. The essentials, smallest to largest:

- **Value Object (VO)** — an immutable thing defined *only by its values*, with no identity. `Money(1000, "KRW")` is interchangeable with any other `Money(1000, "KRW")`. VOs are where you put small invariants: a `Money` that refuses negative amounts, a `Quantity` that must be a positive integer, an `Email` that must be well-formed. **Start here** — VOs are the easiest win in DDD, and they clean up code immediately.
- **Entity** — a thing with an **identity** that persists through change. An `Order` is the same order whether its status is `PENDING` or `SHIPPED`. Two orders with identical fields are still different orders.
- **Aggregate** — a small cluster of Entities and VOs that must stay consistent *as a unit*. An `Order` plus its `OrderItem`s is one Aggregate: you can't have an order line without an order.
- **Aggregate Root** — the *one* Entity that outside code is allowed to touch. You change `OrderItem`s only by calling methods on `Order`. This is how the Aggregate guarantees its invariants — there's exactly one front door, and it checks every rule. **The Aggregate boundary is also your transaction boundary and your consistency boundary** — one of the most important ideas in DDD.
- **Domain Service** — a home for a rule that genuinely doesn't belong to any single Aggregate (e.g., "this reservation must not overlap *any other* reservation for the same room"). It operates on Aggregates handed to it; it does **not** reach into the database itself.
- **Repository** — the abstraction for saving and loading whole Aggregates. The domain talks to a repository *interface*; the database lives behind it.
- **Domain Event** — a record that something meaningful happened (`OrderConfirmed`). Events let one part of the system react to another without being directly wired to it — the foundation for the Advanced tier (Sagas, eventual consistency).
- **Factory** — encapsulates the creation of a valid Aggregate from raw input.

The golden rule that ties these together: **rules live inside the model.** If you find a business rule expressed as an `if` in a controller or service, it probably belongs on an Aggregate method, in a VO's constructor, or in a Domain Service.

---

## 5. Mindset shifts that trip up beginners

These are the lessons that usually cost people the most time. Internalize them early:

1. **Model behavior, not data.** Don't ask "what fields does an Order have?" Ask "what can happen to an Order, and what must always be true?" Methods first, getters last.
2. **Make illegal states unrepresentable.** If an order can't ship before it's paid, there should be no code path that ships an unpaid order — not a comment asking you not to.
3. **The database is a detail.** Design the model as if persistence were free, then map it to tables afterward. The ORM entity is *not* your domain model.
4. **Reference other Aggregates by ID, not by object.** An Aggregate should be loadable on its own. A `Payment` holds an `orderId` (a plain value), not a live `Order` object — no foreign-key web binding everything together.
5. **Separate reads from writes (CQRS).** The command side goes through the rich domain model to enforce rules. The query side can skip the model entirely and read flat data straight from the database — reads don't change anything, so they don't need the rule-enforcement machinery. (This repo applies CQRS throughout; see the root [README](../README.md).)
6. **Test the domain with zero mocks.** A well-designed Aggregate or VO is a pure function of its inputs. If a domain test *needs* a mock, that's a smell telling you a dependency leaked into the model.

---

## 6. A learning path (the part that matters)

DDD is a craft. You learn it by building the same patterns enough times that they stop feeling like patterns and start feeling like common sense. This repository is built for exactly that: you repeat one architecture across many domains and three difficulty tiers. (See the root [README](../README.md) and [PLAN.md](../PLAN.md) for the full workflow.)

### Stage 0 — Get just enough theory (a few hours)

Read this document. Then skim **Domain-Driven Design Distilled** (below) or Martin Fowler's two short articles. **Do not** start with Eric Evans' original book — it's the deep end, and it makes far more sense *after* you've built something.

### Stage 1 — One Aggregate, end to end (Basic tier)

Goal: get comfortable with Value Objects, an Aggregate Root, state-transition methods, and the four-layer + CQRS structure — without the distraction of multiple contexts.

- Study the worked reference: [`examples/order-management-basic/`](../examples/order-management-basic/) — a single `Order` Aggregate, a linear state machine, one Bounded Context. Read its [README](../examples/order-management-basic/README.md), then the `domain/` layer, then follow the write path out to the controller.
- Then build your **own** Basic playthrough: pick a domain from [`docs/domain-ideas/`](domain-ideas/), choose the `basic` tier, and follow the 8-phase curriculum in [PLAN.md](../PLAN.md).
- **You've finished this tier when:** your `domain/` folder has zero framework imports, every state transition has a positive *and* a negative test, and your read path never touches the domain model.

### Stage 2 — Two Aggregates and a boundary (Intermediate tier)

Goal: feel the seam *between* models — cross-Aggregate rules, a second Bounded Context, an Anti-Corruption Layer, and a transaction that spans two Aggregates.

- Study the reference: [`examples/order-management-intermediate/`](../examples/order-management-intermediate/) — `Order` and `Payment` in two Bounded Contexts, linked by ID only, with a Cross-BC Port (ACL), a pure `PaymentCoordinator` Domain Service, and a single `@Transactional()` spanning both. Its [README](../examples/order-management-intermediate/README.md) walks through the design decisions.
- Then run the **Strategic Design** workshop yourself with `/strategic-design` (see the root [README](../README.md)). Write down your guess at the Bounded Contexts *before* the discussion, and a short "what changed in my thinking" *after*. That before/after is where the strategic lessons actually land.
- Build your own Intermediate playthrough.
- **You've finished this tier when:** a cross-Aggregate policy lives in a Domain Service (with a written reason why), your two repositories commit under one `@Transactional()`, and no module imports another context's `infra/`.

### Stage 3 — Many parts, talking asynchronously (Advanced tier)

Goal: eventual consistency. Domain Events, a Saga / Process Manager coordinating a multi-step workflow, the Transactional Outbox pattern, and compensating actions when a step fails.

- This is where "the order ships automatically when payment succeeds" becomes an *event flow* across contexts rather than one big transaction.
- Build an Advanced playthrough once Stages 1–2 feel routine. The pass criteria (outbox publish, Saga retry + duplicate-delivery tests, no `forwardRef()`) are in [PLAN.md](../PLAN.md).

### Stage 4 — Go back to the books

Now Eric Evans' **Domain-Driven Design** and Vaughn Vernon's **Implementing Domain-Driven Design** will read very differently — you'll recognize the problems they describe because you've hit them yourself.

> **The most common beginner mistake** is to read three books and write zero aggregates. Reverse it. Read a little, build a lot, and return to the theory with scar tissue. The patterns only make sense once you've felt the pain they prevent.

---

## 7. Reference shelf

### Books

1. **Domain-Driven Design Distilled** — Vaughn Vernon. Short and focused; the best first book. Read it during Stage 0–1.
2. **Implementing Domain-Driven Design** — Vaughn Vernon. The practical, code-oriented follow-up. Best during Stage 2–3.
3. **Domain-Driven Design** — Eric Evans. The original. Philosophical and dense — most rewarding *after* you've built something (Stage 4).
4. **Learning Domain-Driven Design** — Vlad Khononov. A modern, approachable alternative first read if you prefer it to Distilled.

### Online

1. **Martin Fowler** — [Bounded Context](https://martinfowler.com/bliki/BoundedContext.html) · [Anemic Domain Model](https://martinfowler.com/bliki/AnemicDomainModel.html). Two short, foundational reads.
2. **Khalil Stemmler** — [DDD articles](https://khalilstemmler.com/articles/categories/domain-driven-design/). Especially useful here: Node.js / TypeScript examples of DDD and Clean Architecture.
3. **Microsoft Architecture Guide** — [Design a DDD-oriented microservice](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-oriented-microservice). A solid end-to-end walkthrough with CQRS.

---

## 8. One-page glossary

| Term | In one sentence |
|---|---|
| **Domain** | The whole business problem the software solves. |
| **Subdomain** | A slice of the domain — Core (your edge), Supporting, or Generic (buy it). |
| **Ubiquitous Language** | One shared vocabulary, identical in conversation, docs, and code. |
| **Bounded Context** | The boundary inside which a term has exactly one meaning. |
| **Context Map** | How Bounded Contexts depend on and integrate with each other. |
| **Anti-Corruption Layer (ACL)** | A translation layer that stops another context's vocabulary from leaking in. |
| **Entity** | A thing with a lasting identity that survives state changes. |
| **Value Object** | An immutable thing defined only by its values, with no identity. |
| **Aggregate** | A cluster of objects kept consistent as one unit. |
| **Aggregate Root** | The single entity that is the Aggregate's only entry point. |
| **Domain Service** | A rule that spans multiple Aggregates and belongs to none of them. |
| **Repository** | The abstraction for saving and loading whole Aggregates. |
| **Domain Event** | A record that something meaningful happened in the domain. |
| **Factory** | Encapsulated creation of a valid Aggregate. |
| **CQRS** | Separate the write path (through the model) from the read path (around it). |

---

**Next step:** open the [root README](../README.md), pick a domain and the Basic tier, and start your first playthrough. Build first; the theory will catch up.
