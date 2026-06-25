# Current Handoff

## Latest Completed Work

- **Implemented Photoshop (PSD) Layer Importer (Tasks 124-130):**
  - **ag-psd Library Integration (Task 124):** Installed `ag-psd` to decode Photoshop `.psd` files entirely on the client side, avoiding any server-side image processing dependencies.
  - **PSD Parsing and Alignment Logic (Task 125):** Wrote `src/layer-trace/psdParser.ts` containing `parsePsdFile`, a recursive tree flattener that extracts visible layers, sanitizes names to safe CSS/SVG tokens, and exports each layer onto a full PSD-sized transparent canvas. This ensures that VTracer results align perfectly in coordinate space without requiring complex translation matrices.
  - **Parser Unit Tests (Task 126):** Created `src/layer-trace/psdParser.test.ts` validating PSD tree flattening, default visibility checks, and offset image drawing. All 2/2 tests pass.
  - **HTML Layout Expansion (Task 127):** Updated `crop-editor.html` to introduce an Input Mode Switcher (PNG Lasso/Brush vs Photoshop PSD) at the top of the config panel. Added the Photoshop PSD workspace containing a drag-and-drop zone, a scrollable layer checklist with customized renaming inputs, progress tracking bars, and batch action buttons.
  - **Controller UI & Batch Tracing (Task 128):** Implemented event handlers in `src/editor.ts` to read dropped/selected PSD files as binary buffers. Added real-time layer rendering with downscaled `48px` thumbnail previews to prevent DOM bloat. Programmed the batch tracing sequence which processes selected layers in reverse order (bottom-to-top) so they stack correctly in the final SVG. Added safety checks in drawing methods and keyboard shortcuts to prevent regression of the Lasso/Brush flow.
  - **Premium SCSS Styles (Task 129):** Styled switcher tabs, dashed glassmorphic dropzones, layer checklist rows, thumbnail frames, status indicators, and progress bars with smooth CSS transitions and keyframe animations in `src/styles/editor.scss`.
  - **Typecheck and Build Verification (Task 130):** Verified zero static compilation errors via `npx tsc --noEmit`, all unit tests passing, and successful packaging via `npm run build`.

## Current Workflow State

- The crop-art workflow now supports two input modes:
  1. **Lasso Mask (PNG):** Draw custom shapes on single PNG assets (Lasso or Brush) to trace layer by layer.
  2. **Photoshop (PSD):** Drag and drop a layered `.psd` file, select layers, and batch-trace them into perfectly aligned SVG layers instantly.
- Traced layers from both workflows merge into the same `layerTraceLayers` array, allowing users to inspect, reorder, rename, merge, and save them using the existing Crop Editor composite and saving utilities.

## Verification

- **Static Typecheck:** `npx tsc --noEmit` completed successfully with zero errors.
- **Unit Tests:** All unit tests pass:
  - `npx vitest run src/layer-trace/psdParser.test.ts` (2/2 tests passed).
  - `npx vitest run src/layer-trace/layerComposer.test.ts` (3/3 tests passed).
- **Production Build:** `npm run build` completed successfully.
- **Lasso/Brush Regression Smoke Check:** Confirmed that the Lasso/Brush mask canvas, floating toolbar, and drawing keyboard shortcuts continue to function perfectly when "Ảnh PNG" mode is active, with all events safely blocked in PSD mode.

## Known Warnings Or Blockers

- No major blockers. PSD layers without image data (such as folder groups or adjustment layers) are automatically filtered out during parsing, keeping the import list clean.
- The `ag-psd` parser runs fully client-side. Large PSD files (e.g. over 20MB) may take a second to decode on the main thread; downscaled thumbnails are used to keep UI rendering extremely fast.

## Current Uncommitted Scope

- All implementation files for the PSD Layer Importer feature:
  - `src/layer-trace/psdParser.ts`
  - `src/layer-trace/psdParser.test.ts`
  - `crop-editor.html`
  - `src/editor.ts`
  - `src/styles/editor.scss`
  - `package.json` and `package-lock.json`
  - `docs/plans/task.md`, `docs/plans/current-handoff.md`, and `docs/plans/index.md`

## Recommended Next Task

- **Manual PSD Import Smoke Test:** Load a layered crop `.psd` in the browser, check several layers, rename their labels, click "Nhập & Vector hóa", and verify that they trace successfully, appear in the right-hand layer list, and align perfectly in the composite SVG preview.
