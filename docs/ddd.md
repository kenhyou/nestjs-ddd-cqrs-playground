# DDD (Domain-Driven Design) Guide

**Domain-Driven Design (DDD)** is a design approach for solving complex business problems and building software that can evolve over time.

This document summarizes core DDD concepts, implementation patterns, and study resources.

---

## 1. What Is DDD?

The core idea of DDD is that the heart of software should be the business domain it solves, not the technology, technical tricks, or database structure.

A database-first approach often starts with tables and adds business logic on top. DDD instead places real-world business rules and processes at the center of the software model.

DDD is usually discussed through two design lenses:

1. **Strategic Design**: the big-picture design of the business, usually involving planners, domain experts, and developers.
2. **Tactical Design**: code-level implementation patterns, usually driven by developers.

---

## 2. Strategic Design

Strategic Design reduces business complexity by dividing the system and defining how the parts communicate.

- **Domain and Subdomain**: The domain is the entire business activity the software addresses, such as ecommerce. Subdomains are smaller areas within it, such as accounts, orders, payment, and shipping.
- **Ubiquitous Language**: A shared language used by planners, business experts, developers, and other participants with the same meaning. The same terms should appear consistently in conversations, documents, and code.
- **Bounded Context**: A boundary where a term has a specific meaning. For example, `Product` may mean name, price, and description in a Catalog context, but weight, volume, and package condition in a Shipping context.
- **Context Map**: A map of relationships between Bounded Contexts, including dependency direction and integration style.

---

## 3. Tactical Design

Tactical Design provides patterns for implementing a domain model in code.

- **Entity**: A domain model with identity. It is considered the same object over time even when its state changes. Example: `Order` remains the same order when its status changes from PENDING to CONFIRMED.
- **Value Object (VO)**: An immutable object defined only by its values, without identity. Example: `Money` with the same amount and currency is the same value.
- **Aggregate**: A cluster of related Entities and Value Objects that must remain consistent as a unit.
- **Aggregate Root**: The only Entity that external code may directly access in an Aggregate. Example: `Order` is the Aggregate Root and `OrderItem` is modified only through `Order`.
- **Domain Event**: An object representing something important that happened in the domain, such as `OrderConfirmedEvent`.
- **Repository**: An abstraction that stores and loads Aggregates, often backed by a database.
- **Domain Service**: A stateless service for business logic that does not naturally belong inside one Entity or Value Object.

---

## 4. Recommended Learning Resources

DDD can feel abstract, so start with concise material and then implement the patterns in code.

### Books

1. **Domain-Driven Design Distilled** by Vaughn Vernon: a short, focused introduction to Strategic and Tactical Design.
2. **Implementing Domain-Driven Design** by Vaughn Vernon: a deeper implementation-oriented book with concrete architectural guidance.
3. **Domain-Driven Design** by Eric Evans: the original DDD book. It is more philosophical and abstract, so it is better after some practical experience.

### Online Resources

1. **Martin Fowler**
   - [Bounded Context](https://martinfowler.com/bliki/BoundedContext.html)
   - [Anemic Domain Model](https://martinfowler.com/bliki/AnemicDomainModel.html)
2. **Khalil Stemmler**
   - [Domain-Driven Design articles](https://khalilstemmler.com/articles/categories/domain-driven-design/)
   - Useful for Node.js and TypeScript examples of DDD and Clean Architecture.
3. **Microsoft Architecture Guide**
   - [Design a DDD-oriented microservice](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-oriented-microservice)
