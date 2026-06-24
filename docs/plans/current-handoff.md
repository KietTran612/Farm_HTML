# Current Handoff

## Latest Completed Work

- **Implemented Task 115 (Add Folder Selection in Crop Editor):** Added a Folder selection dropdown side-by-side with the PNG selection dropdown in `crop-editor.html`. Expanded the left column width in `src/styles/editor.scss` (from `minmax(220px, 280px)` to `minmax(320px, 420px)`) to provide more space for the side-by-side dropdown layout. Resolved Sass deprecation warnings across `editor.scss` by importing `sass:color` and replacing all legacy `darken()` calls with `color.adjust()`. Updated the Vite middleware (`editorMiddleware.ts`) to recursively scan crop folders and group PNG assets under their relative paths (defaulting to `[Gốc]` for the root directory). Implemented dynamic loading and event handling in `src/editor.ts` and updated corresponding unit tests.
- **Implemented Task 114 (Load Existing Stage SVG on Stage Select):** Updated the stage dropdown selector (`#layer-stage-select`) change event handler in `src/editor.ts` to call `handleSavedStageSelection(layerStageSelect.value)` instead of only calling `renderLayerCompositePreview`. This loads the existing SVG and its layers for the selected stage, matching the behavior of clicking the stage item in the sidebar.
- **Implemented Task 112 (Adjust Animation Editor Columns and Fix Encoding):** Repositioned the columns in `crop-animation-editor.html` and adjusted the CSS grid layout in `src/styles/animation-editor.scss` to place the Layer Properties panel next to the Layer Browser (State/Layers list) and shifted the SVG Preview workspace to the end (right side). Replaced all corrupted/mangled characters in the UI templates of `src/animation-editor.ts` with encoding-safe unicode escapes (`\u25BC`, `\u00B7`, `\u23F9`, `\u25B6`, `\u{1F441}`). Also cleaned up a duplicated variable and style block in `animation-editor.scss` that caused a Sass compilation error.
- **Implemented Task 111 (Compact Animation Editor Layer Workflow):** Reworked `crop-animation-editor.html` so stage selection is a compact dropdown, layer selection sits below it in the left panel, and editable layer controls live in a dedicated `Layer Properties` panel. Stage changes reload data through the existing `selectStage` flow and select the first available layer by default. Added dirty-state guarding before crop/stage switches and validation before saving animation metadata.
- **Implemented Task 110 (Reorder Layer Pivot Controls):** Moved the `Pivot Point` field above `Animation` inside each Animation Editor layer card. No save/load, pivot, animation, or motion logic was changed.
- **Implemented Task 109 (Show Relevant Motion Controls Only):** Added per-animation motion key metadata and changed Animation Editor layer cards to render only the sliders that affect the selected animation preset. `none` no longer shows unused motion controls, while existing motion metadata remains compatible.
- **Implemented Task 108 (Sync Existing Animated Crop Data):** Audited existing `animations.json` files for animated crops and confirmed no orphan/missing part IDs after sync. Refreshed `src/assets/crops/potato/stage01.grouped.svg` from the current `stage01.svg` because the Crop Editor source SVG was newer while group IDs still matched.
- **Implemented Task 107 (Prune Missing Animation Layers On Save):** `handleSaveStageAnimationRequest` now reads layer `data-group-id`s from the sanitized grouped SVG and removes animation `parts` entries whose group IDs no longer exist before writing `animations.json`.
- **Implemented Task 106 (Draggable Pivot Marker):** Added a draggable pivot marker handle in the Animation Editor SVG preview. Dragging converts pointer coordinates into selected-layer bounds percentages, clamps the pivot to the selected layer bounds, updates `partPivots`, syncs the X/Y inputs, switches the pivot preset to `Custom`, and keeps the existing save metadata format. Fixed the drag handler to target the real `#svg-preview` container.
- **Implemented Task 105 (Compact Crop Editor Trace Step):** Reduced Step 3 (`Trace layer bang lasso mask`) panel padding, header spacing, grid gap, and lasso/preview minimum height so the trace workspace fits better within the current browser window without changing trace behavior.
- **Implemented Task 104 (Compact Planning Context):** Compacted `task.md`, `current-handoff.md`, and `index.md` so new sessions read only current project state instead of long historical logs. Older completed plan files were moved under `docs/plans/archive/`, while recently relevant workflow plans remain in `docs/plans/`.
- **Implemented Task 103 (Temporarily Hide Suggest Candidates Button):** Added `hidden` to the Animation Editor `Suggest Candidates` button and a `.btn[hidden]` SCSS rule so the control is not shown while preserving its existing DOM id and TypeScript handler.
- **Implemented Task 102 (Selected Layer Bounds Outline):** Added a padded SVG `selection-bounds` rectangle for the selected layer in Animation Editor preview so users can see the selected layer's visual extent.
- **Implemented Tasks 96-101 (CSS Variable Motion Controls):** Added per-layer motion sliders for duration, delay, sway angle, Y offset, and scale. Motion metadata loads from and saves to `animations.json`, preview SVG groups receive dynamic `--anim-*` custom properties, and first-time grouped stage saves update the metadata cache.

## Current Workflow State

- The active crop-art workflow is lasso masked layer tracing in `crop-editor.html`, followed by grouped SVG animation tuning in `crop-animation-editor.html`.
- The old full-PNG candidate workflow and auto-trace batch path are superseded by the lasso layer workflow.
- No detailed implementation plan is currently active. Read a detailed plan from `index.md` only when the next user task specifically needs it.

## Verification

- **For Task 114 (Load Existing Stage SVG on Stage Select):**
  - Unit tests passed: `npx vitest run src/layer-trace/` (composer, parser, and viewport tests passed).
  - Build check passed: `npm run build`.
  - Browser smoke check passed: Used browser automation to open `http://127.0.0.1:4000/crop-editor.html?crop=potato`, select Potato, choose "Stage 00" from the "Luu vao stage" dropdown, and verify that the layers list updated with Stage 00 layers (`leaf_1`, `leaf_2`, `leaves`).
- **For Task 113 (Implement Merge Layers in Crop Editor):**
  - Unit tests passed: `npx vitest run`
  - Build check passed: `npm run build`
- **For Task 112 (Adjust Animation Editor Columns and Fix Encoding):**
  - Unit tests passed: `npx vitest run src/animation-editor/stageValidation.test.ts src/animation-editor/motionConfig.test.ts src/animation-editor/groupEditor.test.ts`
  - Build check passed: `npm run build`
- **For Task 111 (Compact Animation Editor Layer Workflow):**
  - TDD red check: `npx vitest run src/animation-editor/stageValidation.test.ts` failed because `stageValidation` did not exist.
  - Focused tests passed: `npx vitest run src/animation-editor/stageValidation.test.ts src/animation-editor/motionConfig.test.ts`.
  - `npm run build` passed.
  - Browser smoke on `http://127.0.0.1:4000/crop-animation-editor.html?crop=potato` confirmed the stage dropdown exists, old stage cards are gone, inline row details are gone, first layer is selected by default, and layer properties render separately. Changing from `dead` to `stage00` reloaded the layer list and selected the first layer for the new stage.
  - Dirty-stage browser smoke was interrupted by the automation dialog handling after triggering `window.confirm`; code path is implemented through the stage/crop change handlers.
- **For Task 110 (Reorder Layer Pivot Controls):**
  - `npm run build` passed.
  - Browser smoke passed on `http://127.0.0.1:4000/crop-animation-editor.html?crop=potato`: first layer card field labels read `Pivot Point`, then `Animation`.
- **For Task 109 (Show Relevant Motion Controls Only):**
  - TDD red check: `npx vitest run src/animation-editor/motionConfig.test.ts` failed because `getMotionKeysForAnimation` did not exist.
  - Focused test passed: `npx vitest run src/animation-editor/motionConfig.test.ts`.
  - `npm run build` passed.
  - Browser smoke passed on `http://127.0.0.1:4000/crop-animation-editor.html?crop=potato`: verified `none` shows no motion sliders; `soft-sway` shows duration/delay/angle; `sway-left` shows duration/delay/angle/y; `leaf-breathe` shows duration/delay/scale; `bob` shows duration/delay/y.
- **For Task 108 (Sync Existing Animated Crop Data):**
  - Read-only audit found animated crop data only for `corn` and `potato`.
  - Before sync, no animation part orphan IDs were found against current grouped SVGs; `potato/stage01.svg` was newer than `potato/stage01.grouped.svg` with matching group IDs.
  - Refreshed `potato/stage01.grouped.svg` from `potato/stage01.svg`; SHA256 hashes now match.
  - Post-sync audit reported `ANIMATION_SYNC_ISSUES=0`.
- **For Task 107 (Prune Missing Animation Layers On Save):**
  - TDD red check: `npx vitest run scripts/vite-plugins/editorMiddleware.test.ts` failed when payload included `removedLayer` but grouped SVG only contained `keptLayer`.
  - Focused tests passed: `npx vitest run scripts/vite-plugins/editorMiddleware.test.ts`.
  - `npm run build` passed.
- **For Task 106 (Draggable Pivot Marker):**
  - TDD red check: `npx vitest run src/animation-editor/pivotDrag.test.ts` first failed because `pivotDrag` did not exist.
  - Focused tests passed: `npx vitest run src/animation-editor/pivotDrag.test.ts src/animation-editor/selectionOverlay.test.ts src/animation-editor/motionConfig.test.ts`.
  - `npm run build` passed.
  - After user reported the marker could be grabbed but not moved, fixed the drag handler's preview element lookup from `animation-preview` to `svg-preview`; focused tests and `npm run build` passed again.
  - After user requested pivot to stay within the layer area, clamped pivot render, transform-origin, drag output, and X/Y input display to `0-100`; focused tests and `npm run build` passed again.
  - Browser drag smoke not run because browser automation policy blocked access to `http://127.0.0.1:4000`.
- **For Task 105 (Compact Crop Editor Trace Step):**
  - `npm run build` passed.
  - Browser smoke passed on `http://127.0.0.1:4000/crop-editor.html`: at a 1280x720 viewport, `.editor-workspace` reported `needsScroll: false`; Step 3 measured 447px tall with lasso/preview panes at 360px.
  - Reproduced the selected-PNG overflow with Potato `World_Crop_Potato_Body_Dead.png`, then verified after the CSS fix that document horizontal overflow is false and `.editor-workspace` has no horizontal or vertical overflow at 1280x720.
  - Height-responsive follow-up: `npm run build` passed after changing Step 3 layout to flex-fill the panel height. Browser re-check not run because the browser automation policy blocked access to `http://127.0.0.1:4000`.
- **For Task 104 (Compact Planning Context):** App validation not run - docs-only planning cleanup.
- **For Task 103 (Temporarily Hide Suggest Candidates Button):**
  - `npm run build` passed.
  - Browser smoke passed on `http://127.0.0.1:4000/crop-animation-editor.html?crop=corn`: confirmed `auto-classify-btn` exists with `hidden=true` and computed `display: none`.
- **For Task 102 (Selected Layer Bounds Outline):**
  - Focused tests passed: `npx vitest run src/animation-editor/selectionOverlay.test.ts src/animation-editor/motionConfig.test.ts src/animation-editor/groupEditor.test.ts`.
  - `npm run build` passed.
  - Browser smoke passed on `http://localhost:4000/crop-animation-editor.html?crop=corn`: selected the first Corn Dead layer and confirmed `.selection-bounds` renders with nonzero width/height while the pivot marker remains visible.

## Known Warnings Or Blockers

- Observed untracked file outside the current task scope: `docs/crop_art_prompt_spec.md`.
- Observed crop asset changes remain in the worktree: `src/assets/crops/potato/meta.json`, `src/assets/crops/potato/stage01.svg`, `src/assets/crops/potato/animations.json`, `src/assets/crops/potato/dead.grouped.svg`, `src/assets/crops/potato/stage00.grouped.svg`, and `src/assets/crops/potato/stage01.grouped.svg`.
- Corn VTracer raw SVG sizes can be large. Prefer tuned presets or lasso layer selection for runtime-ready assets.

## Current Uncommitted Scope

- **Crop Editor folder selection:** `crop-editor.html`, `src/editor.ts`, `src/styles/editor.scss`, `scripts/vite-plugins/editorMiddleware.ts`, `scripts/vite-plugins/editorMiddleware.test.ts`, `docs/plans/task.md`, and `docs/plans/current-handoff.md`.
- **Crop Editor load stage SVG on stage select:** `src/editor.ts`, `docs/plans/task.md`, and `docs/plans/current-handoff.md`.
- **Animation Editor compact layer workflow:** `crop-animation-editor.html`, `src/animation-editor.ts`, `src/styles/animation-editor.scss`, `src/animation-editor/stageValidation.ts`, `src/animation-editor/stageValidation.test.ts`, `docs/plans/task.md`, and `docs/plans/current-handoff.md`.
- **Animation Editor layer field order:** `src/animation-editor.ts`, `docs/plans/task.md`, and `docs/plans/current-handoff.md`.
- **Animation Editor relevant motion controls:** `src/animation-editor.ts`, `src/animation-editor/motionConfig.ts`, `src/animation-editor/motionConfig.test.ts`, `docs/plans/task.md`, and `docs/plans/current-handoff.md`.
- **Existing animated data sync:** `src/assets/crops/potato/stage01.grouped.svg`, `docs/plans/task.md`, and `docs/plans/current-handoff.md`.
- **Animation save orphan pruning:** `scripts/vite-plugins/editorMiddleware.ts`, `scripts/vite-plugins/editorMiddleware.test.ts`, `docs/plans/task.md`, and `docs/plans/current-handoff.md`.
- **Animation Editor draggable pivot:** `src/animation-editor.ts`, `src/animation-editor/pivotDrag.ts`, `src/animation-editor/pivotDrag.test.ts`, `src/styles/animation-editor.scss`, `docs/plans/task.md`, and `docs/plans/current-handoff.md`.
- **Crop Editor compact trace step:** `src/styles/editor.scss`, `docs/plans/task.md`, and `docs/plans/current-handoff.md`.
- **Planning cleanup:** `docs/plans/task.md`, `docs/plans/current-handoff.md`, `docs/plans/index.md`, and archived historical plan file moves under `docs/plans/archive/`.
- **Observed crop asset changes:** `src/assets/crops/potato/meta.json`, `src/assets/crops/potato/stage01.svg`, `src/assets/crops/potato/animations.json`, `src/assets/crops/potato/dead.grouped.svg`, `src/assets/crops/potato/stage00.grouped.svg`, and `src/assets/crops/potato/stage01.grouped.svg`.

## Recommended Next Task

- **Manual Save/Refresh Verification for Motion Controls:** Open `http://localhost:4000/crop-animation-editor.html?crop=corn`, adjust one layer's motion sliders, click "Save Grouped SVG", refresh, and confirm the sliders and animation behavior restore from `animations.json`.
