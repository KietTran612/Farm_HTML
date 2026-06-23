# Merge Layers in Crop Editor Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Build a "Merge Layers" capability in the Crop Editor (`crop-editor.html`) that allows users to enter a merge mode, click and highlight multiple layers in the list (and visually on the SVG preview), and merge their paths into a single layer.

**Architecture:** 
- Add a new "Merge Layers" and "Cancel" button to `crop-editor.html`. Rename "Save Layered SVG" to "Save".
- Maintain state (`isMergeMode: boolean`, `mergeSelectedIndices: Set<number>`) in `src/editor.ts`.
- In merge mode, click events on layer rows toggle their inclusion in `mergeSelectedIndices`, disabling rename and drag/drop.
- Toggle a `.is-merge-mode` class on `document.body` to coordinate global layout states.
- Export `prefixInternalIds` and `sanitizeToken` from `src/layer-trace/layerComposer.ts`.
- To prevent gradient/element ID collisions when merging, run `prefixInternalIds` on each sub-layer's SVG body using its own unique `groupId` prefix *before* concatenating them.
- Merged layer's SVG body combines the pre-prefixed child paths of all selected layers, keeping the target layer's groupId and label.
- Highlight selected layer rows and corresponding preview SVG `<g>` elements using `.is-selected-for-merge` styles in SCSS. Use a bright orange drop-shadow filter for the SVG preview groups (since CSS `outline` does not render on SVG groups).
- Disable the lasso drawing canvas during merge mode by setting `pointer-events: none` and `cursor: not-allowed` on the canvas when `body.is-merge-mode` is active.

**Tech Stack:** TypeScript, HTML5 Canvas, SVG, SCSS.

---

### Task 1: Update HTML buttons in `crop-editor.html`

**Files:**
- Modify: [crop-editor.html](file:///d:/soflware/Unity/Source/Farm_HTML/crop-editor.html)

**Step 1: Modify buttons in HTML**
Change "Save Layered SVG" text to "Save", and add "Merge Layers" and "Cancel" buttons.

```html
              <div class="layer-actions">
                <button id="clear-layer-mask-btn" class="btn btn-secondary" type="button">Clear Lasso</button>
                <button id="trace-layer-btn" class="btn btn-primary" type="button" disabled>Trace Layer</button>
                <button id="merge-layers-btn" class="btn btn-secondary" type="button" disabled>Merge Layers</button>
                <button id="cancel-merge-btn" class="btn btn-secondary" type="button" hidden>Cancel</button>
                <button id="save-layer-composite-btn" class="btn btn-success" type="button" disabled>Save</button>
              </div>
```

---

### Task 2: Implement SCSS highlighting in `src/styles/editor.scss`

**Files:**
- Modify: [editor.scss](file:///d:/soflware/Unity/Source/Farm_HTML/src/styles/editor.scss)

**Step 1: Add highlight classes for merge mode**
Add styles for `.is-selected-for-merge` on layer rows and on SVG group preview elements, plus cursor styles and canvas protection for merge mode.

```scss
/* Merge mode styles */
body.is-merge-mode {
  .layer-mask-canvas {
    pointer-events: none;
    cursor: not-allowed;
    opacity: 0.85;
  }
  
  .layer-list {
    .layer-row {
      cursor: pointer;
      
      &:hover:not(.is-selected-for-merge) {
        background-color: darken($forest-pastel, 3%);
        border-color: rgba(66, 139, 77, 0.35);
      }
      
      // Disable interaction of other child buttons during merge
      button, .rename-icon, .drag-handle {
        pointer-events: none;
        opacity: 0.35;
      }
    }
  }
}

.layer-row.is-selected-for-merge {
  background-color: #ffe8cc !important;
  border-color: #ff922b !important;
  color: #d9480f !important;
  box-shadow: 0 0 0 2px rgba(253, 126, 20, 0.25);
  
  .layer-index-indicator {
    color: #d9480f !important;
  }
}

.layer-composite-preview {
  .crop-part.is-selected-for-merge {
    filter: drop-shadow(0 0 8px #ff922b) drop-shadow(0 0 2px #ff922b);
    opacity: 0.95;
  }
}
```

---

### Task 3: Export helper functions from `layerComposer.ts`

**Files:**
- Modify: [layerComposer.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/layer-trace/layerComposer.ts)

**Step 1: Export prefixInternalIds and sanitizeToken**
Change signature keywords:
```typescript
export function prefixInternalIds(svgText: string, prefix: string): string { ... }
export function sanitizeToken(value: string): string { ... }
```

---

### Task 4: Implement Merge Mode logic in `src/editor.ts`

**Files:**
- Modify: [editor.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/editor.ts)

**Step 1: Add state variables**
At the top of the file, declare state for merge mode:
```typescript
let isMergeMode = false;
let mergeSelectedIndices = new Set<number>();
```

**Step 2: Import helpers from layerComposer**
Import the helpers from `./layer-trace/layerComposer`:
```typescript
import { composeLayeredSvg, prefixInternalIds, sanitizeToken, type SvgLayerInput } from "./layer-trace/layerComposer";
```

**Step 3: Add event listeners and helper methods**
Attach click event listeners to `#merge-layers-btn` and `#cancel-merge-btn`.
```typescript
  const mergeLayersBtn = document.getElementById("merge-layers-btn") as HTMLButtonElement | null;
  const cancelMergeBtn = document.getElementById("cancel-merge-btn") as HTMLButtonElement | null;

  mergeLayersBtn?.addEventListener("click", handleMergeButtonClick);
  cancelMergeBtn?.addEventListener("click", handleCancelMerge);
```

**Step 4: Implement merge action handlers**
To prevent gradient/element ID collisions, run `prefixInternalIds` on each sub-layer's SVG body using its own unique `groupId` prefix *before* combining them.
```typescript
function handleMergeButtonClick() {
  if (!isMergeMode) {
    // Enter Merge Mode
    isMergeMode = true;
    mergeSelectedIndices.clear();
    clearLayerMask(); // Clear any active lasso drawing
    document.body.classList.add("is-merge-mode");
    renderLayerTraceState();
  } else {
    // Perform Merge
    if (mergeSelectedIndices.size < 2) return;
    performMerge();
  }
}

function handleCancelMerge() {
  isMergeMode = false;
  mergeSelectedIndices.clear();
  document.body.classList.remove("is-merge-mode");
  renderLayerTraceState();
}

function readSvgBody(svgText: string): string {
  return svgText.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i)?.[1] || svgText;
}

function performMerge() {
  const sorted = Array.from(mergeSelectedIndices).sort((a, b) => a - b);
  const targetIndex = sorted[0];
  const layersToMerge = sorted.map(idx => layerTraceLayers[idx]);

  // Prefix internal IDs of each layer using its own groupId to prevent collision before combining
  const combinedBody = layersToMerge.map(layer => {
    const rawBody = readSvgBody(layer.svgText);
    const prefix = sanitizeToken(layer.groupId);
    return prefixInternalIds(rawBody, prefix);
  }).join("\n");
  
  const mergedSvgText = `<svg xmlns="http://www.w3.org/2000/svg">${combinedBody}</svg>`;

  layerTraceLayers[targetIndex] = {
    groupId: layerTraceLayers[targetIndex].groupId,
    label: layerTraceLayers[targetIndex].label,
    svgText: mergedSvgText,
    hidden: layersToMerge.every(l => l.hidden)
  };

  // Remove other layers in reverse order
  for (let i = sorted.length - 1; i > 0; i--) {
    layerTraceLayers.splice(sorted[i], 1);
  }

  isMergeMode = false;
  mergeSelectedIndices.clear();
  document.body.classList.remove("is-merge-mode");
  renderLayerTraceState();
  showStatus("success", `Merged ${sorted.length} layers.`);
}
```

**Step 5: Guard `startInlineRename()`**
Add guard at the top of `startInlineRename()` to prevent double-click renames during merge mode.
```typescript
function startInlineRename(index: number) {
  if (isMergeMode) return;
  ...
}
```

**Step 6: Update `renderLayerList()` to support highlight and row clicks**
Disable drag&drop and edit styles when in merge mode, and handle row toggle clicks:
- Modify `renderLayerList()` to add `.is-selected-for-merge` to row template.
- Disable `draggable="true"` if `isMergeMode === true`.
- Add row click listener to toggle merge selection.

Row template changes:
```typescript
    <div class="layer-row ${layer.hidden ? "is-hidden" : ""} ${isMergeMode && mergeSelectedIndices.has(index) ? "is-selected-for-merge" : ""}" draggable="${!isMergeMode}" data-layer-index="${index}">
```

Row click listener at the end of `renderLayerList`:
```typescript
  rows.forEach((row) => {
    const index = Number(row.dataset.layerIndex);
    row.addEventListener("click", (event) => {
      if (!isMergeMode) return;
      const target = event.target as HTMLElement;
      if (target.closest("button") || target.closest(".rename-icon")) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (mergeSelectedIndices.has(index)) {
        mergeSelectedIndices.delete(index);
      } else {
        mergeSelectedIndices.add(index);
      }
      
      // Update Merge button text dynamically
      const mergeBtn = document.getElementById("merge-layers-btn") as HTMLButtonElement | null;
      if (mergeBtn) {
        mergeBtn.textContent = `Confirm Merge (${mergeSelectedIndices.size})`;
        mergeBtn.disabled = mergeSelectedIndices.size < 2;
      }
      
      renderLayerTraceState();
    });
  });
```

**Step 7: Update `renderLayerCompositePreview()` to highlight preview groups**
Add class `.is-selected-for-merge` to preview groups in merge mode.
```typescript
  if (isMergeMode) {
    mergeSelectedIndices.forEach((index) => {
      const gEl = preview.querySelector(`g[data-layer-index="${index}"]`);
      if (gEl) {
        gEl.classList.add("is-selected-for-merge");
      }
    });
  }
```

**Step 8: Update `updateLayerTraceButtons()` to manage button visibilities**
```typescript
function updateLayerTraceButtons() {
  const traceBtn = document.getElementById("trace-layer-btn") as HTMLButtonElement | null;
  const saveBtn = document.getElementById("save-layer-composite-btn") as HTMLButtonElement | null;
  const mergeBtn = document.getElementById("merge-layers-btn") as HTMLButtonElement | null;
  const cancelBtn = document.getElementById("cancel-merge-btn") as HTMLButtonElement | null;
  const clearBtn = document.getElementById("clear-layer-mask-btn") as HTMLButtonElement | null;

  if (isMergeMode) {
    // Hide or disable other buttons
    if (traceBtn) traceBtn.disabled = true;
    if (saveBtn) saveBtn.disabled = true;
    if (clearBtn) clearBtn.disabled = true;
    
    if (cancelBtn) cancelBtn.hidden = false;
    
    if (mergeBtn) {
      mergeBtn.disabled = mergeSelectedIndices.size < 2;
      mergeBtn.textContent = `Confirm Merge (${mergeSelectedIndices.size})`;
      mergeBtn.className = "btn btn-success"; // Turn to success/confirm style
    }
  } else {
    if (cancelBtn) cancelBtn.hidden = true;
    
    if (mergeBtn) {
      mergeBtn.disabled = layerTraceLayers.length < 2;
      mergeBtn.textContent = "Merge Layers";
      mergeBtn.className = "btn btn-secondary";
    }
    
    if (traceBtn) {
      traceBtn.disabled = !layerTraceImage || layerLassoPoints.length < 3;
    }
    if (saveBtn) {
      saveBtn.disabled = !layerTraceSize || layerTraceLayers.length === 0;
    }
    if (clearBtn) {
      clearBtn.disabled = false;
    }
  }
}
```

---

### Verification Plan

#### Automated Tests
- Run `npm run build` to verify no TypeScript compilation errors.
- Run unit tests: `npx vitest run`

#### Manual Verification
- Open `http://localhost:4000/crop-editor.html?crop=carrot`
- Select a PNG and trace at least 2 layers.
- Verify the "Save" button works.
- Verify the "Merge Layers" button is enabled.
- Click "Merge Layers" -> Confirm "Cancel" button appears, other trace buttons are disabled.
- Click a layer in the sidebar -> Verify it is highlighted in orange, SVG paths on preview are highlighted with a orange glow drop-shadow.
- Click another layer -> Confirm "Confirm Merge (2)" is enabled.
- Click "Confirm Merge (2)" -> Verify they merge into one layer, names are preserved, preview updates, and merge mode exits.
- Click "Save" and verify file saves successfully.
