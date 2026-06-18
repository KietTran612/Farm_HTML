# Codex Project Rules

## Communication Language

Assistant responses addressed directly to the user must be in Vietnamese by default.

All other work products should keep following the existing project context and conventions. Markdown documents, plans, handoff files, code comments, commit messages, and other project files may be written in English when appropriate.

## Superpowers Plan And Task Locations

For this project, Codex Superpowers must use the same plan and task locations as the existing project workflow:

- Implementation plans: `docs/plans/YYYY-MM-DD-<feature-name>.md`
- Live task tracker: `<project-root>/docs/plans/task.md`

Codex and Antigravity may create task plans, handoff notes, or implementation trackers under `docs/plans/` when a task needs them.

Keep planning files concise. Do not move long implementation details or session logs into task trackers or handoff files.

Do not use `docs/superpowers/plans/` for this project unless the user explicitly asks for the Codex Superpowers default.

## Task Tracker Format

`docs/plans/task.md` must use a compact Markdown table. Each task row should follow this structure:

```md
| Task | Status | Notes |
|---|---|---|
| **Task 0: Short Task Name** | [x] | One concise sentence describing what was completed. |
| **Task 1: Next Task Name** | [ ] | One concise sentence describing the pending work. |
```

Use `[x]` for completed tasks and `[ ]` for pending or active tasks. Keep notes brief and avoid pasting logs, implementation details, or long handoff content into the task tracker.

## Antigravity Profile Boundary

The `.agent/` directory belongs to the Antigravity Superpowers profile. Do not modify `.agent/` unless the user explicitly asks to change the Antigravity profile.

Exception: agents may create, update, and delete temporary helper files under `.agent/scratch/` when those files are used as disposable task scratch space, such as scripts for validation, data inspection, or one-off project checks. Do not treat `.agent/scratch/` files as deliverable source files or include them in commits unless the user explicitly asks to promote them into the project workflow.

## User Approval Boundaries

Do not create a new brand, rename the product, or introduce new branding unless the user explicitly requests it.

Do not commit changes unless the user explicitly requests a commit.

Do not push code to any remote repository unless the user explicitly requests a push.

## Styling Rules

Use SCSS and semantic class names for layout, visual states, crop art, animations, and responsive behavior. Do not write inline `style` attributes into rendered HTML for normal styling. Renderers should attach classes such as `crop--carrot`, `state-sprout`, `is-dry`, or `farm-board--cols-3`, and SCSS should own the visual output.

CSS custom properties may be used inside SCSS. Passing CSS custom properties through inline HTML styles is allowed only when the value is truly runtime/user-generated and cannot be represented by a stable class.

## Verification Scope Policy

Do not run the full validation suite by default. Choose the smallest verification scope that proves the changed behavior.

- By default, run only the specific test case, test class, or filtered validation route for the core behavior currently being changed.
- Do not run an entire test suite, combined validation suite, or broad project validation route merely because a script or runner is available.
- Run all tests only when the user explicitly asks for all tests, requests release/final milestone validation, or explicitly approves a proposed broad validation scope.
- If the available runner cannot target the relevant test narrowly, do not fall back to running the whole suite. Use typecheck/build checks and the narrowest non-test validation available, then record the targeted test as not run.
- Docs-only changes: no app validation required.
- Helper or scratch changes: no app validation unless they affect project execution.
- TypeScript logic changes: run typecheck/build plus the narrowest available unit or logic validation for the changed behavior.
- Data model, persistence, inventory, economy, progression, or gameplay rule changes: run typecheck/build plus focused logic validation for the affected rules.
- HTML/CSS/UI layout changes: run typecheck/build when available, then perform the narrowest browser smoke review relevant to the changed screen or component.
- Save/load changes: verify localStorage behavior with a focused manual or automated persistence check.
- Runtime gameplay interaction, animation timing, or widget behavior changes: run typecheck/build plus the relevant browser smoke or interaction check.
- Treat "full validation suite" as running multiple broad validation routes together, such as all unit tests, full build, broad browser regression, and full end-to-end checks.
- Before running the full validation suite, ask the user for approval and wait for explicit acceptance. If the user does not approve full validation, run only the smallest targeted validation relevant to the changed scope.
- Full validation may be proposed for broad cross-system changes, release/final milestone validation, before a user-requested commit when the changed scope touches multiple systems, or when the user explicitly asks for full validation, but it still requires explicit user acceptance before running.
- If unsure, start with the narrowest relevant validation. Escalate to broader validation only when the targeted check fails in a way that suggests broader impact, the change crosses a listed boundary, or the user approves broader validation.

When a validation is intentionally skipped, record it as `not run - not relevant to this change` in the handoff instead of treating it as missing work.

## Active Context Guidelines

To minimize token usage, prevent context dilution, and maintain strict structural consistency across new sessions, any AI Agent starting a new chat thread MUST prioritize reading these lightweight files before executing any tasks or modifying files:

1. **Live Task Tracker**: [task.md](file:///d:/soflware/Unity/Source/Farm_HTML/docs/plans/task.md) - Concise completed/pending task state.
2. **Current Handoff**: [current-handoff.md](file:///d:/soflware/Unity/Source/Farm_HTML/docs/plans/current-handoff.md) - Latest completed work, verification status, known warnings, and recommended next task.
3. **Plan Index**: [index.md](file:///d:/soflware/Unity/Source/Farm_HTML/docs/plans/index.md) - Map of detailed plans to read only when relevant.

Do not read unrelated large historical files or perform broad workspace scans unless explicitly instructed.

## Handoff Update Protocol

After completing any new task, update:

1. [task.md](file:///d:/soflware/Unity/Source/Farm_HTML/docs/plans/task.md) with concise task status only.
2. [current-handoff.md](file:///d:/soflware/Unity/Source/Farm_HTML/docs/plans/current-handoff.md) with the latest completed work, verification results, known warnings or blockers, current uncommitted scope, and recommended next task.
3. [index.md](file:///d:/soflware/Unity/Source/Farm_HTML/docs/plans/index.md) only when adding a new detailed plan file.

Do not paste long logs or unrelated implementation details into handoff files. Link to the detailed plan instead.
