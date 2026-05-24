---
name: strategic-design
description: Learning tool for DDD Strategic Design, including Bounded Context identification, Context Map, Ubiquitous Language, and Subdomain classification through a four-role multi-agent discussion. Use when the user asks to start Strategic Design, derive Bounded Contexts, build a Context Map, define Ubiquitous Language, classify Subdomains, run `/strategic-design <domain>`, or run `/strategic-design --prd <path>`. Follows a 6-phase workflow: Setup -> Discovery -> Subdomain -> BC Identification -> Context Map -> UL -> Consolidation. Supports Socratic mode, where the user answers five questions, and PRD mode, where `product-requirements.md` pre-fills Phase 0/1. Outputs to `workspace/<playthrough>/docs/strategic-design/` in PRD mode or `docs/<sub-project>/strategic-design/` in Socratic mode. Tactical Design such as Aggregates and VOs belongs in DESIGN.md. Core principle: AI presents options; the user decides at every phase.
version: 0.2.0
---

# strategic-design

A learning skill for running DDD Strategic Design through multi-role debate. When the user provides a domain, four roles -- Domain Expert, Solution Architect, Tech Lead, and Product Owner -- discuss it from separate viewpoints. The user makes the final decisions while Strategic Design artifacts accumulate phase by phase.

---

## Non-Negotiable Principles

### 1. AI Does Not Decide

- Every phase ends only when the user explicitly decides.
- AI presents options, differences, and debate; the final choice belongs to the user.
- If the user says "just decide for me", force two options plus trade-offs and ask the user to choose.

### 2. Phases Are Not Skipped

- Order is Phase 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6.
- Do not automatically proceed to the next phase.
- If the user already has BC candidates, run Phases 1 and 2 briefly in validation mode.

### 3. Role Separation Must Be Strong

- Hide other roles' outputs when invoking subagents.
- Do not create weak consensus. Conflict is a learning resource.

### 4. Reflection Is Written by the User

- The reflection section in Phase 6 is not ghostwritten by AI.
- Even a short reflection must be typed by the user.
- In PRD mode, the reflection must include a **"What changed in my thinking"** bullet list comparing `initial-bc-guess.md` (written in step 6 of PRD entry) to the final BCs in `STRATEGIC.md`. At minimum: which guesses survived, which were merged or split, and which were renamed and why.

---

## Trigger Clarification

### Use This Skill For

- "Start Strategic Design"
- "Help with strategic design"
- "Let's derive Bounded Contexts"
- "BC split"
- "Build a Context Map"
- "Define Ubiquitous Language"
- "Classify Subdomains"
- `/strategic-design <domain-name>` for Socratic mode
- `/strategic-design --prd <path>` for PRD mode
- A path such as `workspace/<playthrough>/product-requirements.md`

### Do Not Use This Skill For

- Tactical Design such as Aggregate, VO, or Repository. The user writes `docs/<sub-project>/DESIGN.md`.
- Code implementation. Use the NestJS 8-phase curriculum separately.
- Short DDD concept questions such as "what is a Bounded Context?" Answer normally without activating the skill.

---

## Entry Procedure

When the user uses a trigger phrase, determine the mode first.

### Mode Detection

- **PRD mode**: trigger includes `--prd <path>` or the user provides a `workspace/<playthrough>/product-requirements.md` path.
- **Socratic mode**: all other cases.

### PRD Mode Entry

1. **Read PRD file**
   - Read `workspace/<playthrough>/product-requirements.md`.
   - If missing, stop and tell the user the PRD file was not found.

2. **Parse PRD**
   - Domain name from `# <Domain Name>` or frontmatter `name`.
   - Playthrough slug from the containing directory.
   - Tier: basic, intermediate, or advanced.
   - Five discovery answers: users, domain events, KPIs, differentiation, out of scope.
   - Suggested BC candidates if present.

3. **Choose output directory**
   - Path: `workspace/<playthrough>/docs/strategic-design/`.
   - If it exists, ask whether to continue existing work or restart.

4. **Choose learning mode**
   - **Guided**: user decides at every step; recommended early.
   - **Observation**: user observes role debate; one extra debate round may be automatic.

5. **Confirm pre-filled discovery**
   - Copy PRD content into `01-discovery.md`.
   - Show it once and ask whether to proceed or edit.
   - If the user agrees, Phase 0/1 ends.

6. **Initial BC candidates (pre-debate)**
   - **Required before Phase 2 starts.** Ask the user to list their own initial Bounded Context guesses: name + one-line responsibility each. Three to six entries is typical.
   - Save the list to `workspace/<playthrough>/docs/strategic-design/initial-bc-guess.md` with a timestamp.
   - Do not let the user skip this step. If they say "I don't know", ask them to write down even rough guesses — being wrong here is the point. The post-debate reflection compares against this file.
   - The PRD's `Suggested BC Candidates`, if any, must not be shown to the user before they write their own guess.

7. **Shortened validation mode**
   - If Suggested BC Candidates exist, shorten Phases 1 and 2 as validation, but do not skip them.

### Socratic Mode Entry

1. **Confirm domain name**
   - Ask if the user did not provide one.
   - Agree on a directory-friendly name such as `ecommerce`, `library-loan`, or `subscription-billing`.

2. **Check existing progress**
   - Check whether `docs/<domain>/strategic-design/` exists.
   - If it exists, ask whether to continue or restart.
   - If it does not exist, start Phase 0.

3. **Choose learning mode**
   - **Guided**: user decides each step.
   - **Observation**: user mainly observes role debate.

4. **Ask about existing BC candidates**
   - If the user already has candidates, run Phases 1 and 2 briefly as validation.

---

## 6-Phase Workflow Summary

See [references/workflow.md](references/workflow.md) for details. Move forward only after each phase's exit condition is met.

| Phase | Content | Agents | Output |
|---|---|---|---|
| 0 | Setup | None | directory + empty STRATEGIC.md skeleton |
| 1 | Domain Discovery | None in Socratic mode | `01-discovery.md` |
| 2 | Subdomain classification | domain-expert + product-owner | `02-subdomains.md` |
| 3 | BC identification | all four roles + user-led extra rounds | `03-bounded-contexts.md` + `debates/...` |
| 4 | Context Map | solution-architect + tech-lead | `04-context-map.md` |
| 5 | Ubiquitous Language | domain-expert | `05-ubiquitous-language.md` |
| 6 | Consolidation + reflection | None; user writes reflection | consolidated `STRATEGIC.md` |

### Phase 3: BC Identification

1. The skill prepares a briefing from Phase 1 and 2.
2. Invoke four agents concurrently and hide their results from each other. Limit each response to 300 words.
3. Extract only differences between the four outputs and present them to the user.
4. If the user selects a conflict point, invoke another debate round. Do not do this automatically.
5. The user makes the final decision and writes one paragraph explaining the decision.
6. Save raw debate notes under `docs/<domain>/strategic-design/debates/bc-boundary-{topic}.md` or the PRD-mode equivalent.

---

## References

| File | Purpose |
|---|---|
| [references/workflow.md](references/workflow.md) | detailed input/procedure/output/exit conditions for each phase |
| [references/role-prompts.md](references/role-prompts.md) | source of truth for the four role prompts |
| [references/socratic-questions.md](references/socratic-questions.md) | questions for Phases 1 and 6 |
| [references/anti-patterns.md](references/anti-patterns.md) | common BC-splitting mistakes and skill responses |
| [references/output-templates/strategic.md](references/output-templates/strategic.md) | full STRATEGIC.md template |
| [references/output-templates/context-map-notation.md](references/output-templates/context-map-notation.md) | nine relationship patterns and Mermaid notation |
| [references/output-templates/ubiquitous-language.md](references/output-templates/ubiquitous-language.md) | UL glossary template |
| [references/examples/ecommerce-walkthrough.md](references/examples/ecommerce-walkthrough.md) | completed ecommerce example |

---

## Agents

Four agents are defined under `.claude/agents/`. Use their `subagent_type` when invoking Task.

| Agent | subagent_type | Phases |
|---|---|---|
| Domain Expert | `domain-expert` | 2, 3, 5 |
| Solution Architect | `solution-architect` | 3, 4 |
| Tech Lead | `tech-lead` | 3, 4 |
| Product Owner | `product-owner` | 2, 3 |

### Agent Invocation Notes

- Do not include other agents' results in the input, especially in Phase 3.
- Specify a response length limit, such as 300 words.
- Provide only summarized outputs from previous phases, not the full context.
- Concurrent invocation is allowed.

---

## Output Directories

### PRD Mode

```text
workspace/<playthrough>/docs/strategic-design/
|-- STRATEGIC.md
|-- 01-discovery.md
|-- 02-subdomains.md
|-- 03-bounded-contexts.md
|-- 04-context-map.md
|-- 05-ubiquitous-language.md
`-- debates/
    `-- bc-boundary-{topic}.md
```

`<playthrough>` is the directory containing the PRD, such as `inventory-basic`.

### Socratic Mode

```text
docs/<sub-project>/strategic-design/
|-- STRATEGIC.md
|-- 01-discovery.md
|-- 02-subdomains.md
|-- 03-bounded-contexts.md
|-- 04-context-map.md
|-- 05-ubiquitous-language.md
`-- debates/
    `-- bc-boundary-{topic}.md
```

`<sub-project>` is the domain name agreed in Phase 0.

---

## Common Traps and Responses

### Trap 1: User Asks AI to Decide

Refuse the decision. Present two options with trade-offs and ask the user to choose.

### Trap 2: User Wants to Skip Phases

Offer shortened validation mode, but still run each phase.

### Trap 3: Four Agent Results Are Too Similar

See [references/anti-patterns.md](references/anti-patterns.md). Re-invoke with stronger role-specific prohibitions.

### Trap 4: BC Is Too Large or Too Small

Use Anti-Patterns 3 and 4 in [references/anti-patterns.md](references/anti-patterns.md) to guide the user.

### Trap 5: No Same-Word-Different-Meaning Case in Phase 5

Invoke Domain Expert again and ask whether the BC split is meaningful enough. If no cases emerge, reconsider the split.

---

## Handoff

After Phase 6:
- `STRATEGIC.md` is complete.
- Suggested next step:
  - **PRD mode**: start Tactical Design in `workspace/<playthrough>/docs/DESIGN.md` by mapping BCs to Aggregates.
  - **Socratic mode**: start Tactical Design in `docs/<sub-project>/DESIGN.md`.
- The user writes Tactical Design directly or starts the NestJS 8-phase curriculum.
