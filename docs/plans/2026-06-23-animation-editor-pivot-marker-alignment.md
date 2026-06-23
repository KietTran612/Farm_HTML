# Animation Editor Pivot Marker Alignment Plan

**Goal:** Correct the placement of the visual Pivot Marker (circle and crosshair) in the SVG preview canvas to match the exact center of rotation of the selected layer/group, and resolve browser console errors (`translate(NaN NaN)`).

## Problem Analysis

1. **Path Parser Contamination (NaN):**
   - The regex in `parseSvgPathBounds` (`/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi`) fails to parse decimal numbers starting directly with a dot (e.g., `.5`, `-.5`, or `+.5`).
   - If a path coordinate is missing or failed to parse, the loop continues reading past the end of the `args` array, returning `undefined` and introducing `NaN` into the coordinate boundaries.
   - Any `NaN` in a path's bounds contaminates the entire layer's bounds, resulting in `translate(NaN NaN)` in the pivot marker transform attribute.

2. **Visual Misalignment:**
   - Static control-point bounds calculation (`combineGroupBounds`) does not always reflect the browser's visual bounding box (especially for curves or transformed elements).
   - The browser calculates rotation origin based on `transform-box: fill-box`, which aligns with the dynamic geometric bounds.
   - By querying the DOM element's actual geometry boundaries via `node.getBBox()`, we can guarantee the pivot marker aligns 1-to-1 with the browser's rotation origin.

---

## Proposed Changes

### SVG Path Parser Bounds Optimization

#### [MODIFY] [groupClassifier.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/animation-editor/groupClassifier.ts)

- Update the float parsing regex to `/[+-]?(?:\d*\.\d+|\d+)(?:[eE][+-]?\d+)?/g` to support direct dot decimals (e.g. `.35`).
- Add bounds-checking guards (e.g., `argIdx + 1 < args.length` for pairs) inside command parsing loops (`M`, `L`, `C`, `S`, `Q`, `T`, `A`) to prevent reading past the end of `args`.
- Filter out non-finite (`NaN`/`Infinity`) values in `addPoint()`.

### Pivot Marker Dynamic Resolution

#### [MODIFY] [animation-editor.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/animation-editor.ts)

- Add a `getGroupBounds(node: SVGGElement, group: CropGroup)` helper.
- Query `node.getBBox()` to retrieve the browser's dynamic bounding box coordinates.
- Implement a fallback to `combineGroupBounds(group)` if `getBBox()` is unimplemented or returns zero width/height (for JSDOM test runner support).
- Update `renderPivotMarker(preview)` to retrieve bounds using `getGroupBounds()`.

---

## Verification Plan

### Automated Tests
- Run `npm run test` (or `npx vitest`) to verify that the parser tests and the whole test suite pass (77/77 tests).
- Add a new unit test in `src/animation-editor/groupClassifier.test.ts` to verify that paths with dot-decimals (e.g., `d="M.5.5 L10 10"`) parse bounds correctly and do not result in `NaN`.

### Manual Verification
- Open the editor at `http://localhost:4000/crop-animation-editor.html?crop=corn` in a browser.
- Select a stage (e.g. Stage 03) and choose a layer.
- Verify that the Pivot Marker (circle/crosshair) is visible and positioned exactly where the layer rotates when animating.
- Adjust the Pivot presets (Center, Top center, Bottom center) and check that the marker matches the center of rotation perfectly.
- Confirm there are no console errors like `Error: <g> attribute transform: Expected number, "translate(NaN NaN)".`
