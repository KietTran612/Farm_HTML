# Crop Animation Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a separate crop-level animation editor that can load saved stage SVGs, prepare semantic SVG groups, preview per-part animations, and save grouped SVG outputs without overwriting the original selected stage SVGs.

**Architecture:** Keep `crop-editor.html` focused on PNG-to-SVG tracing and stage assignment. Add `crop-animation-editor.html?crop=<crop>` as a separate crop-level workflow that lets the user choose saved stages, auto-classify path groups, manually refine groups at group level, preview animation presets, and save grouped stage SVGs plus crop animation metadata. The authoring metadata should record that future runtime SVG lookup prefers grouped stage SVGs when present and falls back to original stage SVGs; current board rendering still uses procedural crop renderers and needs a separate integration task before it consumes these authored SVG files.

**Tech Stack:** Vite dev middleware, TypeScript, SCSS, native inline SVG DOM manipulation, existing VTracer/SVGO metric helpers, Vitest, focused browser smoke validation.

---

## File Structure

- Modify `crop-editor.html`
  - Add one crop-level navigation button for the animation editor.
- Modify `src/editor.ts`
  - Enable the animation editor button after a crop is selected and navigate to `crop-animation-editor.html?crop=<crop>`.
- Modify `src/styles/editor.scss`
  - Style the new navigation button using semantic classes.
- Create `crop-animation-editor.html`
  - New page shell for crop-level animation setup.
- Create `src/animation-editor.ts`
  - Page controller for stage loading, group editing, animation preview, and save flow.
- Create `src/styles/animation-editor.scss`
  - Layout, group overlay, solo mode, and animation preview styles.
- Create `src/animation-editor/groupClassifier.ts`
  - Pure SVG path clustering and default semantic suggestions.
- Create `src/animation-editor/groupEditor.ts`
  - Pure operations for relabel, merge, split by region, split by fill color, visibility, and serialization.
- Create `src/animation-editor/animationPresets.ts`
  - Known animation presets and CSS class mappings.
- Create `src/animation-editor/groupClassifier.test.ts`
  - Focused unit tests for classifier clustering and semantic suggestions.
- Create `src/animation-editor/groupEditor.test.ts`
  - Focused unit tests for relabel, merge, split, and grouped SVG serialization.
- Create `src/animation-editor/animationPresets.test.ts`
  - Focused unit tests for stable animation preset IDs and labels.
- Modify `scripts/vite-plugins/editorMiddleware.ts`
  - Add endpoints for loading crop stage assets, saving grouped SVGs, and updating metadata.
- Modify crop authoring metadata shape under `src/assets/crops/<crop>/meta.json`
  - Preserve existing `stages`; add `groupedStages` and `animations`.
- Keep crop board runtime rendering unchanged in this plan
  - The current game board uses procedural `src/ui/crop-art/*` renderers, not `src/assets/crops/<crop>/meta.json`.
  - A later integration plan should make runtime use `meta.groupedStages?.[stage] ?? meta.stages[stage]` if the authored SVG pipeline is approved for gameplay.

---

## Data Contracts

### Crop meta

```json
{
  "cropName": "corn",
  "stages": {
    "stage01": "stage01.svg"
  },
  "groupedStages": {
    "stage01": "stage01.grouped.svg"
  },
  "animations": "animations.json"
}
```

### Animation metadata

```json
{
  "crop": "corn",
  "stages": {
    "stage01": {
      "sourceFile": "stage01.svg",
      "groupedFile": "stage01.grouped.svg",
      "parts": {
        "stem": { "animation": "soft-sway" },
        "leaves-left": { "animation": "sway-left" },
        "leaves-right": { "animation": "sway-right" },
        "base": { "animation": "none" }
      }
    }
  }
}
```

When saving one stage, merge this stage entry into the existing `animations.json` instead of replacing the whole file. Existing animation config for other stages must be preserved.

### Grouped SVG

```svg
<svg class="imported-crop imported-crop--corn imported-crop--stage01" viewBox="0 0 768 1024">
  <g class="crop-part crop-part--base">...</g>
  <g class="crop-part crop-part--stem">...</g>
  <g class="crop-part crop-part--leaves-left">...</g>
  <g class="crop-part crop-part--leaves-right">...</g>
</svg>
```

Before saving, sanitize grouped SVG content for local authoring safety:

- require a root `<svg>` element
- remove `<script>` and `<foreignObject>` elements
- remove attributes starting with `on`, such as `onclick`
- remove external `href` or `xlink:href` values that do not start with `#`
- keep local `url(#...)` paint references and prefix IDs when needed to avoid DOM collisions

---

### Task 1: Add Crop Editor Navigation

**Files:**
- Modify: `crop-editor.html`
- Modify: `src/editor.ts`
- Modify: `src/styles/editor.scss`
- Test: focused browser smoke in Task 9.

- [ ] **Step 1: Add one animation editor button**

Add one semantic button near the crop selector/header actions:

```html
<button id="open-animation-editor-btn" class="btn btn-secondary animation-editor-link" disabled>
  Animation Editor
</button>
```

- [ ] **Step 2: Wire crop-level navigation**

In `src/editor.ts`, enable the button when `activeCrop` is set and navigate to:

```ts
window.location.href = `/crop-animation-editor.html?crop=${encodeURIComponent(activeCrop)}`;
```

- [ ] **Step 3: Verify manually**

Run:

```powershell
npm run build
```

Expected: production build passes.

---

### Task 2: Add Animation Editor Page Shell

**Files:**
- Create: `crop-animation-editor.html`
- Create: `src/animation-editor.ts`
- Create: `src/styles/animation-editor.scss`

- [ ] **Step 1: Create the page shell**

The page should include:

- crop title and back button
- stage list panel
- preview toolbar: `Normal`, `Overlay`, `Solo`
- SVG preview stage
- group inspector panel
- animation preset panel
- footer actions: `Auto Classify`, `Save Grouped SVG`, `Preview Animation`

- [ ] **Step 2: Load the crop query parameter**

If `crop` is missing, render a blocking empty state with a link back to `crop-editor.html`.

- [ ] **Step 3: Verify manually**

Open:

```txt
http://localhost:4000/crop-animation-editor.html?crop=corn
```

Expected: the shell loads and shows a crop-level empty or loading state.

---

### Task 3: Add Middleware Stage Asset API

**Files:**
- Modify: `scripts/vite-plugins/editorMiddleware.ts`
- Test: `scripts/vite-plugins/editorMiddleware.test.ts`

- [ ] **Step 1: Add load endpoint**

Add `GET /api/editor/crop-stage-assets?crop=<crop>` returning:

```ts
{
  cropName: string;
  meta: {
    cropName: string;
    stages: Record<string, string>;
    groupedStages?: Record<string, string>;
    animations?: string;
  };
  stages: Array<{
    stageId: string;
  sourceFile?: string;
  groupedFile?: string;
  sourceSvg?: string;
  groupedSvg?: string;
  activeSvg: string;
  activeFile: string;
  hasGroupedSvg: boolean;
  }>;
  animations: Record<string, unknown>;
}
```

Reject crop names that contain path separators or `..`.

`sourceFile`, `groupedFile`, and `activeFile` are filenames relative to `src/assets/crops/<crop>/`. `sourceSvg`, `groupedSvg`, and `activeSvg` are SVG text contents for the editor preview.

- [ ] **Step 2: Add save endpoint**

Add `POST /api/editor/save-stage-animation` accepting:

```ts
{
  cropName: string;
  stageId: string;
  groupedSvg: string;
  animationConfig: Record<string, unknown>
}
```

Write:

- `src/assets/crops/<crop>/<stageId>.grouped.svg`
- `src/assets/crops/<crop>/animations.json`
- update `meta.json` with `groupedStages[stageId]` and `animations`.

Validate:

- `cropName` matches an existing crop asset directory and contains only letters, numbers, `_`, or `-`
- `stageId` matches an existing `meta.stages[stageId]`
- `groupedSvg` passes the SVG sanitization rules from this plan
- `animations.json` is merged by `stageId` and does not erase other stages

- [ ] **Step 3: Add focused middleware tests**

Test:

- path traversal is rejected
- stage assets prefer grouped SVG when present
- save writes grouped SVG and updates `meta.json`
- save merges `animations.json` without deleting other stage entries
- unsafe SVG elements and event attributes are removed or rejected

Run:

```powershell
npm test -- scripts/vite-plugins/editorMiddleware.test.ts
```

Expected: focused middleware tests pass.

---

### Task 4: Add Pure SVG Group Classifier

**Files:**
- Create: `src/animation-editor/groupClassifier.ts`
- Create: `src/animation-editor/groupClassifier.test.ts`

- [ ] **Step 1: Parse SVG paths into measurable items**

For each `<path>`, collect:

- original path markup
- fill color
- approximate bounding box from path coordinate tokens
- simple `translate(x y)` or `translate(x,y)` transform offsets from VTracer output
- center x/y
- path index

- [ ] **Step 2: Generate neutral clusters**

Cluster by:

- dominant fill family: green, yellow, red, orange, brown, neutral, unknown
- region: left, center, right, top, middle, bottom

Use neutral IDs such as `cluster-green-left-middle`.

- [ ] **Step 3: Suggest semantic labels**

Use crop-aware defaults only as suggestions:

- corn: `stem`, `leaves-left`, `leaves-right`, `ears`, `tassels`, `base`
- fallback crops: `base`, `leaves`, `fruit`, `stem`, `other`

- [ ] **Step 4: Test classifier behavior**

Run:

```powershell
npm test -- src/animation-editor/groupClassifier.test.ts
```

Expected: small SVG fixtures produce stable cluster IDs and suggested semantic labels.

---

### Task 5: Add Group Editing Operations

**Files:**
- Create: `src/animation-editor/groupEditor.ts`
- Create: `src/animation-editor/groupEditor.test.ts`

- [ ] **Step 1: Implement relabel**

Relabel one group without changing its path list.

- [ ] **Step 2: Implement merge**

Merge selected groups into one group and preserve path order by original path index.

- [ ] **Step 3: Implement split**

Support split modes:

- left/right by center x
- top/bottom by center y
- fill color family

- [ ] **Step 4: Implement serialization**

Serialize grouped SVG as semantic `<g class="crop-part crop-part--...">` groups.

- [ ] **Step 5: Test editor operations**

Run:

```powershell
npm test -- src/animation-editor/groupEditor.test.ts
```

Expected: relabel, merge, split, and serialization tests pass.

---

### Task 6: Build Animation Editor UI Behavior

**Files:**
- Modify: `src/animation-editor.ts`
- Modify: `src/styles/animation-editor.scss`

- [ ] **Step 1: Render stage list**

Show saved stages from metadata:

- selectable when `activeSvg` exists
- disabled with `No SVG` when no stage SVG exists
- badge `Grouped` when grouped SVG exists

- [ ] **Step 2: Render preview modes**

Support:

- Normal: original SVG appearance
- Overlay: group outlines/fill tint
- Solo: selected group visible, others dimmed

- [ ] **Step 3: Render group inspector**

Each group row has:

- semantic label dropdown
- path count
- select/highlight action
- hide/show toggle
- merge selection checkbox

- [ ] **Step 4: Render animation presets**

For selected group:

- `none`
- `soft-sway`
- `sway-left`
- `sway-right`
- `leaf-breathe`
- `bob`

- [ ] **Step 5: Save grouped stage**

Call `POST /api/editor/save-stage-animation` with grouped SVG and updated animation metadata.

---

### Task 7: Add Animation Preview Styles

**Files:**
- Create: `src/animation-editor/animationPresets.ts`
- Create: `src/animation-editor/animationPresets.test.ts`
- Modify: `src/styles/animation-editor.scss`

- [ ] **Step 1: Define preset names**

Export stable preset IDs and labels from `animationPresets.ts`.

- [ ] **Step 2: Add CSS animation classes**

Use semantic classes, not inline styles:

```scss
.is-previewing-animation .crop-part--leaves-left {
  animation: crop-leaf-left-sway 2.6s ease-in-out infinite;
}
```

- [ ] **Step 3: Test preset IDs**

Run:

```powershell
npm test -- src/animation-editor/animationPresets.test.ts
```

Expected: preset IDs and labels are stable, and every non-`none` preset maps to a CSS class.

- [ ] **Step 4: Verify preview**

Use browser smoke in Task 9 to confirm computed transforms change over time for an animated group.

---

### Task 8: Record Runtime Lookup Boundary

**Files:**
- Modify: `docs/plans/current-handoff.md`

- [ ] **Step 1: Keep gameplay renderer unchanged**

This plan creates grouped SVG files and authoring metadata only. Do not modify `src/ui/crop-art/*` or `src/ui/render.ts` in this implementation pass because the current board renderer still uses procedural crop art.

- [ ] **Step 2: Document the future runtime rule**

Record in the handoff that a later runtime integration should load authored crop SVG metadata with this preference:

```ts
const svgFile = meta.groupedStages?.[stageId] ?? meta.stages[stageId];
```

The later runtime integration needs its own focused plan and tests because it changes gameplay rendering, asset loading, and crop-art fallbacks.

---

### Task 9: Focused Verification

**Files:**
- Update: `docs/plans/task.md`
- Update: `docs/plans/current-handoff.md`
- Update: `docs/plans/index.md`

- [ ] **Step 1: Run focused unit tests**

Run:

```powershell
npm test -- scripts/vite-plugins/editorMiddleware.test.ts
npm test -- src/animation-editor/groupClassifier.test.ts
npm test -- src/animation-editor/groupEditor.test.ts
npm test -- src/animation-editor/animationPresets.test.ts
```

Expected: all focused tests pass.

- [ ] **Step 2: Run build**

Run:

```powershell
npm run build
```

Expected: production build passes.

- [ ] **Step 3: Run browser smoke**

Open:

```txt
http://localhost:4000/crop-editor.html
http://localhost:4000/crop-animation-editor.html?crop=corn
```

Verify:

- crop editor button opens animation editor for selected crop
- animation editor lists saved SVG stages
- selecting a stage renders SVG
- auto classify creates groups
- overlay and solo modes are readable
- relabel, merge, split update preview
- preview animation visibly moves selected semantic groups
- save writes grouped SVG and metadata

- [ ] **Step 4: Update handoff**

Record focused verification results and any known limitations. Do not run the full validation suite unless the user explicitly approves it.

---

### Task 10: Add Pivot Review And Editing

**Files:**
- Modify: `src/animation-editor.ts`
- Modify: `src/styles/animation-editor.scss`
- Modify: `src/animation-editor/animationPresets.ts`
- Modify: `src/animation-editor/animationPresets.test.ts`

- [ ] **Step 1: Define pivot defaults**

Add semantic-part pivot defaults:

```ts
{
  base: { x: 50, y: 100 },
  stem: { x: 50, y: 100 },
  "leaves-left": { x: 85, y: 90 },
  "leaves-right": { x: 15, y: 90 },
  fruit: { x: 50, y: 65 },
  ears: { x: 50, y: 65 },
  tassels: { x: 50, y: 95 },
  other: { x: 50, y: 100 }
}
```

- [ ] **Step 2: Add pivot controls**

For the selected group, render:

- pivot preset dropdown: `center`, `bottom-center`, `top-center`, `left-base`, `right-base`, `custom`
- numeric `pivotX` and `pivotY` inputs as percentages from `0` to `100`

- [ ] **Step 3: Show pivot marker**

In `Pivot Review` display, show a crosshair marker for the selected group using its pivot percentage and group bounding box.

- [ ] **Step 4: Apply pivot in preview**

Use the selected pivot as `transform-origin` for animation preview. This is editor-only preview styling; saved runtime data must live in `animations.json`.

- [ ] **Step 5: Save pivot metadata**

When saving a grouped stage, include:

```json
{
  "animation": "sway-left",
  "pivot": { "x": 85, "y": 90 }
}
```

- [ ] **Step 6: Run focused checks**

Run:

```powershell
npm test -- src/animation-editor/animationPresets.test.ts
npm run build
```

Expected: pivot defaults test and production build pass.

---

## Self-Review

- Spec coverage: This plan covers the separate crop-level animation editor, one navigation button from crop editor, stage selection inside the animation editor, auto classify, group review/editing, pivot review/editing, animation preview, grouped SVG output, `animations.json`, `meta.json` updates, and runtime lookup preference.
- Placeholder scan: No implementation step depends on undefined placeholders; detailed UI refinement is intentionally deferred to later improvement after practical review.
- Type consistency: `groupedStages`, `animations`, `stageId`, `sourceFile`, `groupedFile`, `groupedSvg`, and `animationConfig` are named consistently across data contracts and tasks.
- Scope check: Runtime game renderer integration is explicitly separated unless requested, keeping the first implementation focused on asset authoring.
