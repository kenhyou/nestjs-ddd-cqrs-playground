# Strategic Design Workflow - 6 Phases

This document describes the step-by-step procedure referenced by `SKILL.md`. Each phase defines input, procedure, output artifacts, and exit conditions.

**Paths** are relative to the project root.
- **PRD mode**: `<output-dir>` = `workspace/<playthrough>/docs/strategic-design/`.
- **Socratic mode**: `<output-dir>` = `docs/<domain>/strategic-design/`.

`<playthrough>` or `<domain>` is decided in Phase 0.

**Rule**: every phase requires user confirmation before moving to the next phase. AI must not auto-advance.

---

## Mode Branching

The skill determines mode at entry.

| Mode | Trigger | Phase 0/1 Behavior | Output Location |
|---|---|---|---|
| **PRD** | `/strategic-design --prd <path>` or a `workspace/<playthrough>/product-requirements.md` path | read PRD, extract domain/scope/five answers, confirm once, then Phase 2 | `workspace/<playthrough>/docs/strategic-design/` |
| **Socratic** | `/strategic-design <domain>` and similar triggers | ask five questions one by one | `docs/<domain>/strategic-design/` |

Phases 2-6 are identical in both modes.

---

## Phase 0: Setup

### Input

The user's initial request or a PRD file path.

### Procedure: PRD Mode

1. Read `workspace/<playthrough>/product-requirements.md`.
2. Decide output directory: `workspace/<playthrough>/docs/strategic-design/`.
   - If it exists, ask whether to continue or restart.
3. Choose learning mode: Guided or Observation.
4. Show the extracted domain scope and ask for confirmation.
5. If the PRD has Suggested BC Candidates, Phases 1-2 may be shortened as validation.

### Procedure: Socratic Mode

1. Confirm the domain name and agree on a directory-friendly name.
2. Decide output directory: `docs/<domain>/strategic-design/`.
   - If it exists, ask whether to continue or restart.
3. Choose learning mode: Guided or Observation.
4. Agree on one paragraph describing the domain scope.
5. Ask whether the user already has BC candidates; if yes, shorten Phases 1-2 as validation.

### Output

- Create `<output-dir>/`.
- Create an empty `STRATEGIC.md` skeleton from `output-templates/strategic.md`.

### Exit Condition

The user explicitly confirms domain or PRD, learning mode, and domain scope.

---

## Phase 1: Domain Discovery

### Input

Phase 0 domain scope or the PRD file.

### Procedure: PRD Mode

1. Copy the PRD's five "Pre-baked Discovery Answers" into `<output-dir>/01-discovery.md`.
2. Show the pre-filled result and ask whether to proceed or edit.
3. If the user requests edits, apply only those edits and confirm again.
4. **Pre-debate BC guess (required):** before Phase 2 begins, ask the user to write their own initial Bounded Context candidate list — name + one-line responsibility for each, three to six entries is typical. Save to `<output-dir>/initial-bc-guess.md` with a timestamp. The PRD's `Suggested BC Candidates` (if any) must not be shown to the user before this step. The user is not allowed to skip — rough guesses are the point; the Phase 6 reflection compares against this file.
5. Move to Phase 2.

### Procedure: Socratic Mode

Ask questions from `references/socratic-questions.md` one by one.

Required questions:
1. Who are the primary and secondary actors?
2. What are 5-10 core domain events?
3. What are 2-3 key business KPIs?
4. What differentiates this system from competitors or similar systems?
5. What is explicitly out of scope?

### Output

`<output-dir>/01-discovery.md` with:
- one-line domain definition
- primary and secondary users
- domain events
- key KPIs
- in-scope and out-of-scope items

PRD mode also writes `<output-dir>/initial-bc-guess.md`:
- timestamped header
- 3-6 BC candidates with name + one-line responsibility

### Exit Condition

- PRD mode: the user confirms the pre-filled discovery result **and** has written `initial-bc-guess.md`.
- Socratic mode: the user answers all five questions and the artifact is written.

### Agents

None.

---

## Phase 2: Subdomain Classification

### Input

`01-discovery.md`.

### Procedure

1. Invoke **Domain Expert** once.
   - Input: summary of Phase 1.
   - Request: Core/Supporting/Generic classification with reasoning based on business meaning.
2. Invoke **Product Owner** once.
   - Input: Phase 1; hide Domain Expert output.
   - Request: Core/Supporting/Generic classification with business-value hypotheses.
3. Present both results side by side and highlight differences.
4. Ask the user to decide:
   - adopt one result,
   - combine and edit,
   - or request an additional debate round.
5. User final decision confirms the classification table.

### Output

`<output-dir>/02-subdomains.md`:
- Core/Supporting/Generic table
- differentiation marker per Subdomain
- one paragraph summarizing the user's final classification rationale

### Exit Condition

The user explicitly approves the classification table.

### Agents

Domain Expert + Product Owner, with additional rounds only on user request.

---

## Phase 3: Bounded Context Identification

### Input

Phase 1 and 2 artifacts.

### Procedure

**3-1. Prepare briefing**
- Summarize Phase 1 domain discovery and Phase 2 Subdomain classification.
- Pass this same briefing to each agent.

**3-2. Invoke all four agents concurrently**
Limit each initial answer to 300 words.

| Agent | Request |
|---|---|
| Domain Expert | propose BC boundaries where domain language changes meaning |
| Solution Architect | propose BC split by change frequency, data cohesion, and autonomy |
| Tech Lead | propose BC split by team size, deployment unit, transaction boundary, and performance |
| Product Owner | propose BC split by business priority and release unit |

**3-3. Extract differences**
- Summarize the four splits in a table.
- Present only meaningful differences to the user.
- Save raw outputs to `<output-dir>/debates/bc-boundary-{date}.md`.

**3-4. Optional user-led additional rounds**
If the user identifies a conflict point, invoke the relevant agents again. Do not run extra rounds automatically.

**3-5. User final decision**
The user confirms the BC split and writes or approves one paragraph of rationale.

### Output

- `<output-dir>/03-bounded-contexts.md` with BC list, responsibilities, included concepts, excluded concepts, owning Subdomain, and autonomy level.
- `<output-dir>/debates/bc-boundary-{topic}.md` with raw agent outputs, difference table, extra rounds if any, and final decision.

### Exit Condition

- The user explicitly confirms the BC list.
- The user writes one paragraph explaining the decision. Do not outsource this to AI.

### Agents

All four roles plus user-led extra rounds.

---

## Phase 4: Context Map

### Input

BC list from Phase 3.

### Procedure

1. Invoke **Solution Architect**.
   - Request: choose from the nine relationship patterns and include dependency direction.
   - Reference: `references/output-templates/context-map-notation.md`.
2. Invoke **Tech Lead**.
   - Input: Phase 3 BC list plus Architect relationship proposal.
   - Request: decide implementation communication mechanisms such as synchronous REST, async events, RPC, shared DB, or file transfer.
3. Present the combined result to the user.
4. User reviews, edits, and confirms.
5. Generate a Mermaid diagram.

### Output

`<output-dir>/04-context-map.md`:
- Mermaid diagram
- relationship detail table: upstream BC, downstream BC, pattern, communication mechanism, notes
- one paragraph of decision rationale

### Exit Condition

The user confirms the Context Map.

### Agents

Solution Architect + Tech Lead.

---

## Phase 5: Ubiquitous Language

### Input

BC list from Phase 3.

### Procedure

1. Invoke **Domain Expert** once for all BCs or once per BC.
   - Request: define 5-15 core terms per BC and actively find same-word-different-meaning cases.
2. Organize the result as a glossary per BC.
3. Highlight same-word-different-meaning cases for the user.
4. Let the user revise.

### Output

`<output-dir>/05-ubiquitous-language.md`:
- term-definition table per BC
- separate section for same-word-different-meaning cases

### Exit Condition

- Every BC has at least five terms.
- At least one same-word-different-meaning case is found. If none exists, ask Domain Expert again.

### Agents

Domain Expert.

---

## Phase 6: Consolidation and Reflection

### Input

All Phase 1-5 artifacts.

### Procedure

1. Consolidate Phase 1-5 notes into `STRATEGIC.md`:
   - domain overview
   - Subdomain classification
   - Bounded Contexts
   - Context Map
   - Ubiquitous Language
   - reflection section reserved for the user, including a **"What changed in my thinking"** subsection (PRD mode)
2. Ask the three reflection questions from `references/socratic-questions.md`:
   - What decision differed most from your initial intuition?
   - What would you do differently next time?
   - How does this affect Tactical Design (`DESIGN.md`)?
3. **PRD mode only:** open `<output-dir>/initial-bc-guess.md` side by side with the final BC list and ask the user to list, in bullet points, which guesses survived, which were merged or split, and which were renamed and why. This goes into the "What changed in my thinking" subsection.
4. The user writes the reflection directly.
5. Suggest Tactical handoff: start DESIGN.md by mapping BCs to Aggregates.

### Output

- Completed `<output-dir>/STRATEGIC.md` including reflection.
- PRD mode reflection contains the "What changed in my thinking" comparison against `initial-bc-guess.md`.

### Exit Condition

- `STRATEGIC.md` is complete.
- The user has written at least one paragraph of reflection.
- PRD mode: reflection includes the comparison against `initial-bc-guess.md`.

### Agents

None.

---

## Overall Flow

```text
Phase 0: Setup
  -> Phase 1: Discovery
  -> Phase 2: Subdomains, Domain Expert + Product Owner
  -> Phase 3: BC Identification, all four roles
  -> Phase 4: Context Map, Solution Architect + Tech Lead
  -> Phase 5: Ubiquitous Language, Domain Expert
  -> Phase 6: Consolidation + user reflection
  -> Handoff to Tactical Design in DESIGN.md
```

Do not move to the next phase until the current phase's exit condition is met.
