# Edit Saved Layered Stages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Crop Editor select an already saved SVG stage, rebuild its layer list from saved `<g class="crop-part ...">` groups, then delete/reorder/rename/add layers and save back to the same stage.

**Architecture:** Add a small parser beside `layerComposer` that converts saved layered SVG text into `SvgLayerInput[]` plus dimensions. Reuse the existing `/src/assets/crops/<crop>/<stage>.svg` files for loading, and keep existing save behavior so a loaded stage can be overwritten with the edited composite. Legacy SVGs without lasso metadata can still be edited structurally, but original lasso masks are not reconstructed.

**Tech Stack:** TypeScript, Vitest, DOMParser in browser, Vite dev middleware.

---

### Task 1: Add Saved Layer Parser

**Files:**
- Create: `src/layer-trace/layerParser.ts`
- Test: `src/layer-trace/layerParser.test.ts`

- [x] Write failing Vitest coverage for parsing `viewBox`, group id, group label, layer order, and drawable group body from a saved layered SVG.
- [x] Implement `parseLayeredSvg(svgText)` returning `{ width, height, layers }`.
- [x] Run `npx vitest run src/layer-trace/layerParser.test.ts`.

### Task 2: Load Stage SVG Into Crop Editor

**Files:**
- Modify: `src/editor.ts`
- Test: `src/layer-trace/layerParser.test.ts`

- [x] Add editor state for selected PNG path and loaded stage dimensions.
- [x] Add click handlers to stage sidebar rows and change handler to `layer-stage-select`.
- [x] Fetch mapped stage SVG from `/src/assets/crops/<crop>/<file>`, parse it, hydrate `layerTraceLayers`, set preview dimensions, and show a status that old layers can be deleted/reordered/renamed but lasso history is not available.
- [x] Keep add-new-layer flow working from the selected PNG; when no PNG is selected, loaded stage layers remain editable and saveable.

### Task 3: Save Loaded Stage Without PNG

**Files:**
- Modify: `src/editor.ts`
- Test: `src/layer-trace/layerComposer.test.ts`

- [x] Update compose/save guards so a loaded saved stage can be saved using parsed SVG dimensions even when no PNG is selected.
- [x] Preserve current behavior when tracing new layers from PNG.
- [x] Run focused tests for layer parser/composer and `npm run build`.

### Task 4: Handoff

**Files:**
- Modify: `docs/plans/task.md`
- Modify: `docs/plans/current-handoff.md`
- Modify: `docs/plans/index.md`

- [x] Record Task 70 completion and verification.
- [x] Add this plan to the plan index.
