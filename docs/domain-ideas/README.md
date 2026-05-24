# Domain Ideas - PRD Template Repository

This directory stores **Product Requirements Document (PRD) templates** for each domain idea. When a learner starts a new session and chooses a domain plus tier, the matching tier section is extracted into `workspace/<playthrough>/product-requirements.md`.

---

## File Layout

```text
docs/domain-ideas/
|-- README.md
|-- _template.md
|-- inventory-management.md
|-- order-management.md
|-- reservation-booking.md
|-- reservation-management.md
|-- subscription-billing.md
|-- forum-qa.md
|-- task-tracker.md
|-- library-loan.md
`-- membership-loyalty.md
```

Each domain file contains:
- **Overview**: a short description of the domain.
- **Universal Actors / Domain Events**: shared information independent of tier.
- **Tier: Basic / Intermediate / Advanced**: PRD content for each tier, including pre-baked discovery answers, BC candidates, and learning goals.

---

## Three Tiers

| Tier | Scope | Key Learning Points |
|---|---|---|
| **Basic** | 1 Aggregate Root, simple state transition, single BC | VO pattern, Aggregate Root, single-Aggregate CQRS |
| **Intermediate** | 2 Aggregates, 1-2 BCs, cross-aggregate validation | Multi-Aggregate design, Cross-BC Port, Domain Service, composite VOs |
| **Advanced** | 3+ Aggregates, 2+ BCs, Domain Events, Saga | Eventual Consistency, Process Manager, ACL, Conformist |

The tier describes the **learning scope**, not the inherent difficulty of the domain. For example, Subscription Billing advanced includes a dunning saga, while basic only covers starting and cancelling a subscription.

---

## Learning Flow

1. The user triggers a new learning session.
2. Claude presents the nine options in `docs/domain-ideas/`.
3. The user chooses a domain and tier: basic, intermediate, or advanced.
4. Claude creates `workspace/<idea-slug>-<tier>/product-requirements.md`.
5. The user reviews or edits the PRD.
6. Run `/strategic-design --prd workspace/<idea-slug>-<tier>/product-requirements.md`.
7. After Strategic Design, write Tactical Design at `workspace/<idea-slug>-<tier>/docs/DESIGN.md`.
8. Implement the NestJS 8-phase curriculum inside `workspace/<idea-slug>-<tier>/code/`.

---

## Adding a New Domain Idea

1. Copy `_template.md` to `docs/domain-ideas/<new-idea>.md`.
2. Fill all three tier sections.
3. Add the file to the layout list in this README.
4. Optionally add it to the domain ideas table in the top-level `PLAN.md`.
