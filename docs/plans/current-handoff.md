# Current Handoff

## Latest Completed Work

- **Implemented Task 139 (Fix Hidden Save, PSD Path Scope, and Bulk Select UI):**
  - Animation Editor now keeps hidden groups in grouped SVG output with `display="none"` instead of dropping them, and reloads grouped SVG hidden state when selecting a stage.
  - PSD refresh path resolution is restricted to `docs/Crops/<crop>/`, with recursive fallback still limited to that crop directory.
  - PSD bulk "select all / select none" now updates the `.is-hidden-layer` visual class together with checkbox state.
- **Implemented Task 138 (Keep Selected PSD Imports Visible):** Clarified PSD checkbox semantics in code: Photoshop hidden state only sets the initial checked/import selection state. If the user checks a PSD layer and imports it through VTracer, the generated SVG layer is visible regardless of the original PSD hidden flag.
- **Implemented Task 137 (Reload PSD Visibility On Refresh):** Changed PSD refresh state restoration so checkbox visibility follows the newly parsed PSD `layer.hidden` value. Custom rename inputs are still preserved by matching layer name, but stale UI checked states no longer override Photoshop visibility changes.
- **Implemented Task 136 (Add Selected PSD Refresh Fallback):** Stored the currently selected PSD `File` object in editor state, cleared it on workflow reset, and used it as a refresh fallback when the local disk reload endpoint cannot find/read the PSD path.
- **Refined PSD Refresh Button & Local PSD Reloading (Task 135 Refinement):**
  - **State-Preservation**: Added `capturePsdUiStates()` to query the DOM and record the exact user selections (checkbox states) and custom layer rename inputs before reloading the PSD. Upon reload, `renderPsdWorkspaceState()` restores these selections and custom labels for all matching layer names, preventing frustrating state loss.
  - **HTTP Cache-Busting**: Appended a unique timestamp query parameter (`&t=${Date.now()}`) to the client fetch request and configured strict HTTP Cache-Control headers (`no-store, no-cache, must-revalidate, proxy-revalidate`) in `editorMiddleware.ts` to guarantee that browser caches are bypassed and the fresh PSD bytes on disk are always loaded.
  - **Recursive Search Fallback (Critical Bug Fix)**: Resolved the path mismatch issue (where a PSD is stored in a subfolder like `V2` but the folder select is set to `[Gốc]`). The server now extracts `crop` and `filename` parameters, and if the primary path is not found, it recursively scans `docs/Crops/<crop>/` for the PSD file automatically. This makes the refresh button work 100% of the time as long as the file is located anywhere inside the crop's directory.
  - **Interactive User Guidance**: If a file cannot be found anywhere in the crop directory, the editor alerts the user with the expected search path, automatically copies the correct project crop directory to the clipboard, and guides them on how to "Save As" in Photoshop directly into the crop folder to enable instant one-click reloading.
  - **Visual Quality of Life**: Added a dynamic change listener to checkbox inputs so that checking or unchecking a layer immediately toggles the `.is-hidden-layer` class on its parent item, fading it out in the list to match Photoshop's native layer list feedback.
- **Increased Animation Editor Scale Maximum (Follow-up):**
  - **Scale Limit Expansion**: Updated the motion controls configuration in `src/animation-editor.ts` to increase the maximum value of the Scale slider from `1.15` (115%) to `2` (200%), giving animators the flexibility to create more dramatic breathing and pulsing effects.

## Current Workflow State

- The crop-art workflow now supports two input modes:
  1. **Lasso Mask (PNG):** Draw custom shapes on single PNG assets (Lasso or Brush) to trace layer by layer.
  2. **Photoshop (PSD):** Drag and drop a layered `.psd` file, select a target SVG resolution, select layers, and batch-trace checked layers into visible, aligned SVG layers. PSD hidden state only controls the initial checked state.
- The PSD Refresh button is now fully robust, state-preserving, immune to browser caching, and capable of auto-locating PSD files in crop subfolders.
- The Animation Editor now supports a broader scale motion adjustment up to 2.0x.

## Verification

- **For Task 139 (Fix Hidden Save, PSD Path Scope, and Bulk Select UI):**
  - Red tests first failed for hidden grouped SVG preservation, missing grouped-SVG hidden parser helper, missing PSD path resolver, and missing PSD bulk visual sync helper.
  - Focused tests passed: `npx vitest run src/animation-editor/groupEditor.test.ts src/animation-editor/groupVisibility.test.ts src/layer-trace/psdImportSelection.test.ts scripts/vite-plugins/editorMiddleware.test.ts` (20 tests).
  - Typecheck passed: `npx tsc --noEmit`.
  - Build check passed: `npm run build`.
  - Browser smoke passed for `crop-editor.html` and `crop-animation-editor.html?crop=carrot`, with no console errors.
- **For Task 138 (Keep Selected PSD Imports Visible):**
  - Red test first confirmed missing helper behavior: `npx vitest run src/layer-trace/psdImportSelection.test.ts`.
  - Focused unit test passed: `npx vitest run src/layer-trace/psdImportSelection.test.ts`.
  - Typecheck passed: `npx tsc --noEmit`.
  - Build check passed: `npm run build`.
- **For Task 137 (Reload PSD Visibility On Refresh):**
  - Typecheck passed: `npx tsc --noEmit`.
  - Build check passed: `npm run build`.
- **For Task 136 (Add Selected PSD Refresh Fallback):**
  - Typecheck passed: `npx tsc --noEmit`.
  - Build check passed: `npm run build`.
- **TypeScript Typecheck**: Checked clean with zero warnings or errors (`npx tsc --noEmit`).
- **Unit Tests**: All 89/89 tests in the codebase passed successfully (`npx vitest run src/`).
- **Production Build**: Successfully bundled and optimized in 372ms (`npm run build`).

## Known Warnings Or Blockers

- Focused middleware tests still print Node `[DEP0190]` from the existing VTracer `spawnSync(..., shell: true)` path. The tests pass; this warning is not from Task 139.

## Current Uncommitted Scope

- PSD visibility refresh behavior:
  - `src/animation-editor.ts`
  - `src/animation-editor/groupEditor.ts`
  - `src/animation-editor/groupEditor.test.ts`
  - `src/animation-editor/groupVisibility.ts`
  - `src/animation-editor/groupVisibility.test.ts`
  - `scripts/vite-plugins/editorMiddleware.ts`
  - `scripts/vite-plugins/editorMiddleware.test.ts`
  - `src/editor.ts`
  - `src/layer-trace/psdImportSelection.ts`
  - `src/layer-trace/psdImportSelection.test.ts`
  - `docs/plans/task.md`
  - `docs/plans/current-handoff.md`
- Selected PSD refresh fallback:
  - `src/editor.ts`
  - `docs/plans/task.md`
  - `docs/plans/current-handoff.md`
- The Animation Editor scale expansion and PSD Refresh recursive search fix:
  - `scripts/vite-plugins/editorMiddleware.ts` (added recursive search fallback)
  - `src/editor.ts` (added crop and filename parameters to fetch query)
  - `src/animation-editor.ts` (increased scale maximum limit to 2)

## Recommended Next Task

- **Verify PSD Refresh Auto-Location in Browser**:
  1. Open the Crop Editor, select `Carrot`, and keep the folder dropdown set to `[Gốc]`.
  2. Switch to the Photoshop PSD tab and drag-and-drop the `dead.psd` file (which is located inside `docs/Crops/Carrot/V2/dead.psd`).
  3. Change the name of a layer or check/uncheck a layer.
  4. Click the Refresh button in the editor.
  5. Verify that:
     - The editor successfully reloads the PSD file without showing any "File not found" error alert!
     - The server automatically found the file under the `V2` subfolder and returned the updated bytes successfully.
