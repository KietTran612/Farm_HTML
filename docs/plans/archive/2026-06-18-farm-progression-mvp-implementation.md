# Farm Progression MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable HTML/CSS/TypeScript farm MVP with planting, watering, pest removal, harvesting, progression, localStorage persistence, and a 3x3 board backed by dynamic rows/columns data.

**Architecture:** This is the execution index for the MVP. Detailed task steps are split into phase files so each worker can focus on one bounded area while preserving the full TDD-style instructions and verification commands.

**Tech Stack:** Vite, TypeScript, Vitest, HTML, SCSS, localStorage.

---

## Source Documents

- Design spec: `docs/plans/2026-06-18-farm-progression-mvp-design.md`
- Project rules: `AGENTS.md`
- Live tracker: `docs/plans/task.md`
- Handoff: `docs/plans/current-handoff.md`

## Phase Order

Implement phases in this order. Each phase should be completed and verified before moving to the next phase.

| Phase | Status | Plan File | Scope |
|---|---|---|---|
| **Phase 0: Scaffold And Data** | [ ] | `docs/plans/2026-06-18-farm-mvp-phase-0-scaffold-data.md` | Vite scaffold, TypeScript/Vitest config, static crop/progression data, initial 3x3 dynamic layout state. |
| **Phase 1: Core Gameplay** | [ ] | `docs/plans/2026-06-18-farm-mvp-phase-1-core-gameplay.md` | Derived growth state, water/pest/death logic, planting, watering, pest removal, harvest, XP, unlocks, soil upgrades. |
| **Phase 2: Persistence** | [ ] | `docs/plans/2026-06-18-farm-mvp-phase-2-persistence.md` | `SaveRepository` boundary and localStorage implementation with focused tests. |
| **Phase 3: UI And Wiring** | [ ] | `docs/plans/2026-06-18-farm-mvp-phase-3-ui-wiring.md` | View model, DOM render, SCSS class-based visuals, app event loop, save/load wiring, browser smoke review. |

## Execution Rules

- Keep implementation files small and focused.
- Use the phase files as the source of truth for exact file contents and test commands.
- Do not commit unless the user explicitly asks for a commit.
- Follow `AGENTS.md` verification scope: use the smallest test/build/browser check that proves the changed behavior.
- After each phase, update `docs/plans/task.md` and `docs/plans/current-handoff.md`.
- If a phase reveals a design issue, pause and update the relevant plan/design doc before continuing.

## Completion Criteria

- `npm test` passes.
- `npm run build` passes.
- Browser smoke review verifies the MVP loop:
  - HUD renders coin, level, XP.
  - Board renders 3x3.
  - Selecting/buying seeds works.
  - Planting consumes seed.
  - Watering and pest removal work.
  - Harvesting a ready crop adds coin/XP.
  - localStorage persists after refresh.

## Self-Review

- The long implementation plan has been split into four phase files.
- Each phase file keeps the original task-level detail and verification commands.
- This index stays short enough to use as the entry point for future sessions.
