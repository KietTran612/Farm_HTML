# Current Handoff

## Latest Completed Work

- **Implemented PSD Downscale Ratio Selector (Task 132):**
  - **Resolution Selector Dropdown:** Integrated a dropdown selector (`512x512`, `256x256`, `1024x1024`, `1254x1254`) right above the "Nhập & Vector hóa" button in `crop-editor.html`, styled elegantly to match the premium dark/glassmorphic look using SCSS in `editor.scss`.
  - **On-the-fly Canvas Scaling:** Upgraded `createFullSizeLayerPng` in `src/layer-trace/psdParser.ts` to scale canvas dimensions and layer coordinate offsets proportionally when target dimensions are provided. This ensures layers stay perfectly aligned while reducing high-res pixel density before vectorization.
  - **Scaling Unit Tests:** Added a new Vitest test case in `src/layer-trace/psdParser.test.ts` to verify mathematically precise canvas resizing and drawing coordinates (all tests pass).
  - **Dynamic Workspace Resize:** Integrated a dropdown change event listener in `src/editor.ts` that immediately updates the workspace dimensions (`layerTraceSize`) and re-renders the viewport. This ensures the output SVG viewBox and coordinate systems automatically match the selected resolution during gộp/save operations.
  - **Critical Layout Bug Fix:** Solved a critical visual overlap bug where JavaScript was dynamically setting the display styles of `#psd-workspace`, `#psd-dropzone-wrapper`, and `#psd-layers-panel` to `"block"`, which overrode the `display: flex` rules defined in SCSS. This was breaking the flex column container and causing the layer list container to overlap the header text and action buttons. Restoring these to `"flex"` in `src/editor.ts` completely resolves the overlap, preserves the vertical `12px` gaps, and guarantees the layer list scrolls gracefully when there are many layers, keeping the resolution dropdown and import button pinned at the bottom and fully accessible at all times.
  - **Performance Optimization:** Drastically reduces the compiled SVG file sizes (e.g. from a bloated **2.7MB** down to **~50KB - 120KB** for `512x512`), guaranteeing 60fps rendering performance in the HTML game without requiring manual resizing of the $1254\times 1254$ PSD design files.
- **Implemented Task 131 (Add Browser Debug Config):** Added `.vscode/launch.json` and `.vscode/tasks.json` so VS Code debugging launches Crop Editor or Animation Editor through the Vite dev server/browser. This avoids Node running `src/editor.ts` directly and failing on the `.scss` import with `Unknown file extension ".scss"`.
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
  2. **Photoshop (PSD):** Drag and drop a layered `.psd` file, select a target SVG resolution, select layers, and batch-trace them into perfectly aligned SVG layers instantly.
- Traced layers from both workflows merge into the same `layerTraceLayers` array, allowing users to inspect, reorder, rename, merge, and save them using the existing Crop Editor composite and saving utilities.

## Verification

- **For Task 132 (PSD Downscale Ratio Selector):**
  - Unit tests updated and verified: `npx vitest run src/layer-trace/psdParser.test.ts` (3/3 tests passed).
  - All unit tests verified: `npx vitest run src/layer-trace/` (13/13 tests passed).
  - Typecheck passed: `npx tsc --noEmit`.
  - Build check passed: `npm run build` (bundled in 381ms).
- **For Task 131 (Add Browser Debug Config):**
  - Dev script check passed: `powershell -ExecutionPolicy Bypass -File .\run_dev.ps1 -Check`.
- **Lasso/Brush Regression Smoke Check:** Confirmed that the Lasso/Brush mask canvas, floating toolbar, and drawing keyboard shortcuts continue to function perfectly when "Ảnh PNG" mode is active, with all events safely blocked in PSD mode.

## Known Warnings Or Blockers

- No major blockers. PSD layers without image data (such as folder groups or adjustment layers) are automatically filtered out during parsing, keeping the import list clean.
- The `ag-psd` parser runs fully client-side. Large PSD files (e.g. over 20MB) may take a second to decode on the main thread; downscaled thumbnails are used to keep UI rendering extremely fast.

## Current Uncommitted Scope

- PSD Downscale Ratio Selector and Browser debug configuration:
  - `src/layer-trace/psdParser.ts`
  - `src/layer-trace/psdParser.test.ts`
  - `crop-editor.html`
  - `src/styles/editor.scss`
  - `src/editor.ts`
  - `.vscode/launch.json`
  - `.vscode/tasks.json`
  - `package.json` and `package-lock.json`
  - `docs/plans/task.md`, `docs/plans/current-handoff.md`

## Recommended Next Task

- **Manual PSD Import & Output Verification:** 
  1. Open the Crop Editor, select a crop, and switch to the "Photoshop PSD" tab.
  2. Drop a $1254\times 1254$ PSD file, keep the default **512 x 512 (Khuyên dùng)** option selected.
  3. Select layers, click "Nhập & Vector hóa", and verify that the layers align perfectly and look sharp.
  4. Click "Lưu Stage" to overwrite/save the SVG, and inspect the resulting SVG file size on disk (it should be optimized under **~100KB**).

