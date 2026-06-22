# Clean Obsolete Plans And Tasks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean `docs/plans/` so the visible active context matches the current lasso masked PNG-to-layered-SVG workflow.

**Architecture:** Treat `task.md` and `index.md` as the lightweight active context. Preserve useful history in an archive section/file first, and move obsolete detailed plan files into `docs/plans/archive/` instead of flat deletion to keep clean yet complete history.

**Tech Stack:** Markdown docs only under `docs/plans/`.

---

### Task 1: Classify Current Planning Docs

**Files:**
- Read: `docs/plans/task.md`
- Read: `docs/plans/index.md`
- Read filenames under: `docs/plans/`

- [ ] Identify plans to keep as active because they still match the current workflow:
  - `2026-06-22-crop-animation-editor.md`
  - `2026-06-22-crop-animation-editor-visual-grouping.md`
  - this cleanup plan

- [ ] Identify plans to archive and move to `docs/plans/archive/` because they describe the old full-PNG candidate workflow:
  - `2026-06-19-html-crop-editor-implementation.md`
  - `2026-06-22-html-crop-editor-layout.md`
  - `2026-06-22-html-crop-editor-logic-verification.md`

- [ ] Identify task rows in `task.md` that should be marked as superseded:
  - Task 40: partial inline SVG candidate workflow
  - Task 41: old corn parts demo
  - Task 42: old procedural replacement decision
  - Task 46-49: old full-PNG crop-editor candidate workflow

### Task 2: Compact `task.md`

**Files:**
- Modify: `docs/plans/task.md`

- [ ] Keep the compact table format.
- [ ] Mark incomplete or obsolete workflow rows (Tasks 40-42, 46-49) as completed `[x]` with a note: `[Superseded] Superseded by Lasso masked layer tracing (Task 60)` so that they do not remain pending/active and sequential numbering is preserved.
- [ ] Keep recent completed rows for the current direction:
  - Task 51-58: crop animation/grouping foundation
  - Task 59-62: current crop-editor layer trace workflow and UI cleanup
- [ ] Add one pending next task row only if needed, for example:
  - `Review Layer Trace UX In Browser`

### Task 3: Clean `index.md`

**Files:**
- Modify: `docs/plans/index.md`

- [ ] Change `## Active Plans` to include only plans that guide current work (e.g., animation editor and grouping plans).
- [ ] Move older completed/historical plans (like progression MVP, 2.5D board, crop-art system, VTracer CLI setup/tuning) to `## Archived / Historical Plans`.
- [ ] Move the three obsolete plan files to `## Archived / Historical Plans` and list their updated paths under `docs/plans/archive/`.
- [ ] Remove the stale `Planned Next` line that points to executing visual grouping.

### Task 4: Move Obsolete Plans to Archive Folder

**Files:**
- Move: `docs/plans/2026-06-19-html-crop-editor-implementation.md` -> `docs/plans/archive/2026-06-19-html-crop-editor-implementation.md`
- Move: `docs/plans/2026-06-22-html-crop-editor-layout.md` -> `docs/plans/archive/2026-06-22-html-crop-editor-layout.md`
- Move: `docs/plans/2026-06-22-html-crop-editor-logic-verification.md` -> `docs/plans/archive/2026-06-22-html-crop-editor-logic-verification.md`

- [ ] Create `docs/plans/archive/` directory if it does not exist.
- [ ] Move the three obsolete plan files into the archive directory.
- [ ] Keep `2026-06-22-integrate-vite-middleware-api.md` under `docs/plans/` as the middleware concept is still active.

### Task 5: Update Handoff

**Files:**
- Modify: `docs/plans/current-handoff.md`

- [ ] Record only the cleanup result, verification, and recommended next task.
- [ ] For docs-only cleanup, record validation as:
  - `App validation not run - docs-only planning cleanup.`

