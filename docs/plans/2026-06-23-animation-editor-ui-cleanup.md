# Animation Editor UI Simplification & Cleanup Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Clean up the Animation Editor sidebar by removing now-obsolete Selection tools, Create Group actions, and Split/Merge operations since layers are defined upfront via the Crop Editor lasso tracing.

**Architecture:** Remove selection HTML panels and split action buttons from `crop-animation-editor.html`. In `src/animation-editor.ts`, remove selection brush/lasso event listeners, split/merge handlers, and cleanup unused variables to minimize complexity.

**Tech Stack:** TypeScript, SCSS, HTML.

---

### Task 84: Remove Obsolete Selection and Group Actions from HTML

**Files:**
- Modify: `crop-animation-editor.html`

**Step 1: Clean up the dynamic sidebar layout**
Modify [crop-animation-editor.html](file:///d:/soflware/Unity/Source/Farm_HTML/crop-animation-editor.html) to completely remove the Selection panel and the Split/Merge buttons, renaming the Groups section to Layers:

Replace the entire contents of `<aside class="animation-panel group-panel">` with:
```html
        <aside class="animation-panel group-panel">
          <div class="panel-section" id="panel-groups">
            <h2>Layers</h2>
            <div id="group-list" class="group-list">
              <p class="animation-empty">Run Suggest Candidates to inspect groups.</p>
            </div>
          </div>
        </aside>
```

---

### Task 85: Clean Up SCSS Styles for Selection Tools

**Files:**
- Modify: `src/styles/animation-editor.scss`

**Step 1: Remove Selection-related styles**
Remove selector classes like `.selection-tool-selector`, `.selection-status`, `.selection-actions`, and `.pivot-grid` (since pivot forms are inline now) in [src/styles/animation-editor.scss](file:///d:/soflware/Unity/Source/Farm_HTML/src/styles/animation-editor.scss).

---

### Task 86: Remove Selection, Merge and Split Logic from TS

**Files:**
- Modify: `src/animation-editor.ts`

**Step 1: Remove selection and action button event listeners**
Modify `setupEvents()` in [src/animation-editor.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/animation-editor.ts) to remove listeners for:
- `auto-classify-btn` (we keep suggest candidates button)
- `merge-groups-btn`
- `split-left-right-btn`
- `split-top-bottom-btn`
- `split-color-btn`
- `create-group-btn`
- `remove-from-group-btn`
- `tool-rect-btn`, `tool-brush-btn`, `tool-lasso-btn` and pointer/drag selection event logic.

**Step 2: Remove unused variables and imports**
Remove the following variables and imports:
- `selectedPathIndices`
- `activeTool`
- `lassoPoints`
- `setupDragSelection()`, `handleCreateGroupFromSelection()`, `handleRemoveSelectionFromGroup()`, `handleMergeGroups()`, `handleSplitGroup()`
- Import `mergeGroups`, `relabelGroup`, `splitGroup`, `isIntersecting`, `type SplitMode` from `groupEditor.ts` (only keep `relabelGroup` and `serializeGroupedSvg`).

**Step 3: Update `updateActionState()`**
Simplify `updateActionState()` to only enable/disable `auto-classify-btn`, `preview-animation-btn`, and `save-animation-btn` based on stages list status.

---

### Task 87: Verify build and user review

**Files:**
- Modify: `docs/plans/task.md`
- Modify: `docs/plans/current-handoff.md`

**Step 1: Compile production build**
Run: `npm run build`
Expected: Compile succeeds with no errors.

**Step 2: Update task tracker and handoff**
Update [task.md](file:///d:/soflware/Unity/Source/Farm_HTML/docs/plans/task.md) and [current-handoff.md](file:///d:/soflware/Unity/Source/Farm_HTML/docs/plans/current-handoff.md).
Prepare for user manual review.
