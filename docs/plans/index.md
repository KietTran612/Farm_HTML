# Plan Index

Use this file as a routing map only. Do not read detailed plan files unless the user's current task specifically needs that plan.

## Current Context

- **Active implementation plan:** `2026-06-25-psd-layer-importer.md` - Bộ nhập Layer Photoshop (PSD) trực tiếp trên trình duyệt.
- **Current workflow:** `crop-editor.html` uses lasso masked layer tracing or PSD layer import to compose grouped SVG stages; `crop-animation-editor.html` tunes grouped SVG animation, pivots, motion variables, and layer preview.
- **Superseded workflow:** Old full-PNG candidate review, inline candidate preparation, and auto-trace batch workflow are no longer the active path.

## Recently Relevant Plans

- `2026-06-25-psd-layer-importer.md` - Bộ nhập Layer Photoshop (PSD) trực tiếp trên trình duyệt.
- `2026-06-23-crop-specific-soil-plots.md` - Mảnh đất riêng cho từng loại cây trồng sử dụng Vite import.meta.glob.
- `2026-06-23-animation-editor-css-variables.md` - CSS variable motion controls for SVG animation editor layers.
- `2026-06-23-animation-editor-pivot-marker-alignment.md` - Pivot marker and selected layer bounds alignment context.
- `2026-06-23-animation-editor-layer-preview.md` - Per-layer independent animation preview controls.
- `2026-06-23-animation-editor-ui-cleanup.md` - Removal of obsolete selection, split, and merge controls from Animation Editor.
- `2026-06-23-animation-editor-embedded-controls.md` - Embedded animation and pivot controls inside layer cards.
- `2026-06-23-hybrid-trace-preset.md` - Hybrid trace preset implementation.
- `2026-06-22-edit-saved-layered-stages.md` - Reopening and editing saved layered SVG stages.

## Historical Completed Plans

- `archive/2026-06-18-farm-progression-mvp-design.md` - Farm Progression MVP design spec.
- `archive/2026-06-18-farm-progression-mvp-implementation.md` - Farm Progression MVP execution index.
- `archive/2026-06-18-farm-mvp-phase-0-scaffold-data.md` - Scaffold, TypeScript/Vitest setup, data, and initial state.
- `archive/2026-06-18-farm-mvp-phase-1-core-gameplay.md` - Growth, actions, XP, unlocks, and soil upgrades.
- `archive/2026-06-18-farm-mvp-phase-2-persistence.md` - SaveRepository boundary and localStorage persistence.
- `archive/2026-06-18-farm-mvp-phase-3-ui-wiring.md` - View model, DOM render, app wiring, and browser smoke review.
- `archive/2026-06-18-isometric-farm-board-ui-implementation.md` - 2.5D/isometric farm board UI implementation.
- `archive/2026-06-19-crop-art-system-setup.md` - Reusable SCSS/native SVG crop art setup.
- `archive/2026-06-19-vtracer-cli-crop-pipeline.md` - Local VTracer CLI crop PNG-to-SVG pipeline.
- `archive/2026-06-19-vtracer-preset-tuning.md` - VTracer preset quality tuning.
- `2026-06-22-crop-animation-editor.md` - Crop-level SVG group and animation editor foundation.
- `2026-06-22-crop-animation-editor-visual-grouping.md` - Interactive visual grouping plan; current editor now relies on lasso-derived grouped layers.
- `archive/2026-06-22-integrate-vite-middleware-api.md` - Vite middleware API endpoints.
- `archive/2026-06-22-clean-obsolete-plans-and-tasks.md` - Earlier cleanup plan for obsolete task and plan entries.
- `archive/2026-06-23-hybrid-trace-preset-design.md` - Draft design spec for Hybrid Trace Preset; implementation plan superseded it.

## Archived Obsolete Plans

- `archive/2026-06-19-html-crop-editor-implementation.md` - Old in-browser HTML Crop Art Editor candidate workflow.
- `archive/2026-06-22-html-crop-editor-layout.md` - Old HTML Crop Editor candidate workflow layout.
- `archive/2026-06-22-html-crop-editor-logic-verification.md` - Old HTML Crop Editor candidate workflow logic and E2E verification.

## Planned Next

- Manually verify save/refresh persistence for Animation Editor motion controls when the user asks to perform that workflow.
