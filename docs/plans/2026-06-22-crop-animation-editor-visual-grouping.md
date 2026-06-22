# Crop Animation Editor Visual Grouping Implementation Plan

This plan details the implementation of **Interactive Visual Grouping (Rectangle Selection)** as the primary workflow for the Crop Animation Editor, replacing the rigid grid-based auto-classifier with a user-controlled selection model supported by auto-generated candidates.

## Goal

Provide a robust, high-performance editor workflow where artists can visually select multiple SVG paths (via dragging a selection rectangle or clicking paths) and group them into semantic parts (e.g., `leaves-left`, `stem`, `ears`) with stable `groupId` mappings, solving the limitations of automatic classifiers on overlapping/complex vector art.

---

## User Review Required

- *No pending user review items. All review corrections have been integrated directly into the proposed changes.*

---

## Open Questions

- *No open questions at this time.*

---

## Proposed Changes

### Component: Animation Editor Core

---

#### [MODIFY] [crop-animation-editor.html](file:///d:/soflware/Unity/Source/Farm_HTML/crop-animation-editor.html)
- Rename the button `#auto-classify-btn` label to `Suggest Candidates` to establish the correct helper mental model.
- Add selection status text to the preview toolbar showing the count of selected paths.
- Add visual grouping actions to the Group Panel:
  - Add button `Create Group from Selection`.
  - Add button `Remove Selected Paths from Group`.

---

#### [MODIFY] [groupClassifier.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/animation-editor/groupClassifier.ts)
- Implement `parseSvgPathBounds` as a fallback parser that handles path command letters (`M`, `L`, `H`, `V`, `C`, `S`, `Q`, `T`, `A`, `Z` and relative coordinates) to approximate bounding boxes. This parser is dedicated solely to Node/Vitest testing environments where SVG layout geometry is unavailable.
- Update `classifySvgPaths` to output neutral candidate IDs (e.g., `candidate-group-1`, `candidate-group-2`) and suggest labels (e.g. `leaf-candidate-1`, `ear-candidate-2`).

---

#### [MODIFY] [groupEditor.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/animation-editor/groupEditor.ts)
- **Path Preservation:** Update `serializeGroupedSvg` to ensure 100% path preservation.
  - Automatically detect any paths in the SVG that do not belong to any defined user group.
  - Group all these remaining paths into a default fallback group: label `other`, ID `group-unassigned`.
- **Stable Path Identity:**
  - Since grouping paths into `<g>` tags alters their order in the DOM relative to the original raw SVG, sequential indices will shift.
  - To prevent this, when serializing paths, each path will be written with a stable attribute:
    `data-original-index="${pathIndex}"`
  - Restoring group memberships and identifying unassigned paths during reload will be based strictly on this `data-original-index` identifier instead of the raw DOM element index.
- **Z-Index Layer Preservation:** 
  - *Architectural Limitation:* Wrapping paths inside `<g>` containers for CSS animation inevitably groups paths together, which can alter the interleaving z-order of overlapping parts.
  - To approximate the original layers as closely as possible, the serializer will sort groups in the serialized DOM output by the **minimum `data-original-index`** of the paths they contain.
  - This limitation is documented for the artist, who must visually verify layering in the preview and adjust/split groups if overlap sandwiching occurs.
- **Defs & Gradient Preservation:**
  - The serializer must extract and preserve `<defs>`, `<linearGradient>`, `<radialGradient>`, `<clipPath>`, and other styling/asset tags from the original SVG and place them at the beginning of the serialized SVG output to prevent losing fills/shading.
- Update `serializeGroupedSvg` to write groups using stable `groupId` keys as `data-group-id="${groupId}"` and class `class="crop-part crop-part--${label}"`.
- Implement a bounding box intersection check:
  ```ts
  export function isIntersecting(box: PathBounds, rect: PathBounds): boolean {
    return !(rect.minX > box.maxX || rect.maxX < box.minX || rect.minY > box.maxY || rect.maxY < box.minY);
  }
  ```

---

#### [MODIFY] [animation-editor.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/animation-editor.ts)
- **Group Restoring (Load Existing Grouped SVG & Legacy Fallback):**
  - When loading a stage SVG, parse it using the browser's `DOMParser`.
  - If `<g>` tags with `data-group-id` exist, reconstruct the `CropGroup` objects.
  - **Legacy Fallback Migration:**
    - If a path element is inside a `<g data-group-id="...">` but lacks a `data-original-index` attribute (indicating a legacy grouped file), assign it `data-original-index` sequentially based on its flat DOM traversal index.
    - Preserve its membership inside that parent group's `CropGroup`.
    - Saving again will write the `data-original-index` attribute on the SVG, automatically completing migration.
  - Map path elements back into their groups based on `data-original-index`.
  - Any path elements missing `data-original-index` or not wrapped in a custom group will be assigned to the `group-unassigned` group.
- **Group Path Removal Behavior:**
  - Clicking "Remove Selected Paths from Group" will:
    - Remove the selected paths from all of their current custom groups (regardless of selection spanning multiple groups).
    - Move these paths to the default `group-unassigned` (other) group.
    - If any custom group becomes empty (contains 0 paths), delete the group from the active groups list, and remove its animation/pivot metadata from `animations.json` upon save.
- **BBox Transform Matrix (Source of Truth):**
  - The **Browser DOM** is the exclusive source of truth for layout geometry. JSDOM in Node/Vitest environments does not support SVG geometry and will use mocked layout outputs.
  - In the browser, query `path.getBBox()` to get the local bounding box.
  - Query `path.getCTM()` to get the transformation matrix of the path relative to the root SVG container.
  - Transform all four corners of the local bounding box using the CTM matrix to calculate the exact, absolute bounding box in the SVG root space.
  - Cache these coordinates and centers for drag selection.
- **Drag Selection Logic:**
  - Track mouse events (`mousedown`, `mousemove`, `mouseup`) on the preview canvas.
  - Render an absolute-positioned selection rectangle `div` during mouse drag.
  - Map drag bounds from client coordinates (`clientX`/`clientY`) to SVG coordinate space using:
    `svg.getScreenCTM().inverse()`
  - Identify all paths whose cached bounding boxes intersect the selection rectangle.
- **Selection Modifiers:**
  - Holding `Shift` during drag/click adds paths to the active selection.
  - Holding `Alt` or `Ctrl` during drag/click subtracts paths from the active selection.
- **Visual Feedback:** Toggle the class `.is-selected-path` on `<path>` elements to draw high-visibility stroke outlines.
- **Stable Group ID Metadata & Migration:**
  - Maintain active groups using stable `groupId` keys (e.g. `group-leaves-left-178229`).
  - **Backward Compatibility:** When loading metadata:
    - If `parts` are keyed by legacy labels (e.g. `"ears": { "animation": "bob" }`), automatically map these configurations to any newly generated groups matching that label name.
    - Write the updated stable `groupId` layout back on save, performing automatic migration without data loss.

---

#### [MODIFY] [editorMiddleware.ts](file:///d:/soflware/Unity/Source/Farm_HTML/scripts/vite-plugins/editorMiddleware.ts)
- Update typescript interface `SaveStageAnimationPayload` and `CropStageAssetsResponse` to match the new `groupId`-based `animationConfig` payload structure.
- In `GET /api/editor/crop-stage-assets`, ensure the animations load path correctly parses and returns the full stable group config and legacy configuration fields to support the client-side migration flow.

---

#### [MODIFY] [animation-editor.scss](file:///d:/soflware/Unity/Source/Farm_HTML/src/styles/animation-editor.scss)
- Add styling for the visual selection drag box overlay (semi-transparent border/background).
- Add highlight outlines for `.is-selected-path` using high-contrast stroke styling to stand out against any crop fill color.

---

## Verification Plan

### Automated Tests
- Run unit tests for fallback path parser:
  ```powershell
  npm test -- src/animation-editor/groupClassifier.test.ts
  ```
- Run unit tests for group serialization, preserving unassigned paths and writing `data-original-index` attributes:
  ```powershell
  npm test -- src/animation-editor/groupEditor.test.ts
  ```
- Run middleware tests to confirm saving and loading metadata works properly:
  ```powershell
  npm test -- scripts/vite-plugins/editorMiddleware.test.ts
  ```

### Production Build
- Compile client assets:
  ```powershell
  npm run build
  ```

### Manual Verification
1. **Initial Load (Raw Stage SVG):** Open `http://localhost:4000/crop-animation-editor.html?crop=corn` with a stage that has not been grouped yet. Verify all paths load and are grouped under the default `other` group.
2. **Initial Load (Grouped Stage SVG & Legacy Fallback):** Load a stage that was previously grouped (e.g. `dead.grouped.svg`). Verify the editor correctly restores all previously saved groups (even if the SVG paths do not have `data-original-index` attributes), and places only leftover ungrouped paths in `other`.
3. **Visual Selection:** Click and drag a selection rectangle. Verify it translates mouse pixels to SVG coordinates correctly, displaying the overlay box and highlighting selected paths.
4. **Modifiers:** Confirm Shift key adds to selection, and Alt/Ctrl key subtracts paths.
5. **Group Creation & Path Removal:** 
   - Click "Create Group from Selection", assign label `tassels`, and verify they move to the new group.
   - Select a few paths from the newly created group and click "Remove Selected Paths from Group". Verify they are returned to `other`. 
   - Remove *all* paths from a group. Verify the empty group is automatically deleted from the group list and its animation config is removed from metadata upon save.
6. **Path Preservation & Z-Index:** Click "Save". Inspect the output `stageId.grouped.svg` to verify that:
   - All ungrouped paths are preserved.
   - `<defs>` and gradients are fully preserved.
   - Each path has a valid `data-original-index` attribute.
   - Groups are ordered in the DOM by minimum path index, verifying no obvious unacceptable layer regression and noting any sandwiching limitations.
7. **Reload & Migration:** Select a crop stage that was previously saved using the legacy label-based configuration. Verify the editor successfully imports legacy animation configs and maps them to their respective groups on screen.
