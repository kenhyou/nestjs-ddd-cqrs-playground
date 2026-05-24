# Learning Progress Overview

Playthroughs live under `workspace/<playthrough>/` (Git-ignored). Each playthrough holds its own `docs/DESIGN.md` and `docs/PROGRESS.md`.

---

## Starting a New Sub-Project

1. Create a playthrough folder: `workspace/<idea-slug>-<tier>/`.
2. Generate `workspace/<playthrough>/product-requirements.md` from the matching tier section in `docs/domain-ideas/<slug>.md`.
3. Run `/strategic-design --prd workspace/<playthrough>/product-requirements.md` to fill `workspace/<playthrough>/docs/strategic-design/`.
4. Author `workspace/<playthrough>/docs/DESIGN.md` (Phase -1).
5. Author `workspace/<playthrough>/docs/PROGRESS.md` with curriculum checkboxes; use `PLAN.md` as the reference.
6. Scaffold a NestJS app under `workspace/<playthrough>/code/` (Phase 0).
7. Proceed through Phases 0-8 in order, writing tests for each layer as you go (see `PLAN.md` "Tests for This Layer" subsections).

See the top of `PLAN.md` for the next domain ideas and tier selection guidance.
