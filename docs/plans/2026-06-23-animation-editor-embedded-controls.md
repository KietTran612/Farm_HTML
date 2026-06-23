# Embedded Animation & Pivot Controls in Animation Editor Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Refactor the Animation Editor to embed Animation and Pivot controllers directly inside each layer's row (group row) instead of having a single static panel at the bottom, automatically expanding when the layer is active and collapsing when inactive.

**Architecture:** Remove static Animation and Pivot panel sections from HTML, render select/input controls inside the dynamic group rows template in `src/animation-editor.ts`, add SCSS styles to layout the embedded controls and toggle visibility via the `.is-active` group row class, and bind events inside `renderGroupList` to update configurations and redraw previews.

**Tech Stack:** TypeScript, SCSS, HTML.

---

### Task 80: Embedded Controls HTML Cleanup

**Files:**
- Modify: `crop-animation-editor.html`

**Step 1: Remove static Animation and Pivot panels**
Modify [crop-animation-editor.html](file:///d:/soflware/Unity/Source/Farm_HTML/crop-animation-editor.html) to delete the two static sections from the bottom of the right side panel:

Remove this block:
```html
          <div class="panel-section">
            <h2>Animation</h2>
            <label class="field-label" for="animation-preset-select">Selected group preset</label>
            <select id="animation-preset-select" class="form-control" disabled></select>
          </div>

          <div class="panel-section">
            <h2>Pivot</h2>
            <label class="field-label" for="pivot-preset-select">Pivot preset</label>
            <select id="pivot-preset-select" class="form-control" disabled></select>
            <div class="pivot-grid">
              <label class="field-label" for="pivot-x-input">Pivot X %</label>
              <label class="field-label" for="pivot-y-input">Pivot Y %</label>
              <input id="pivot-x-input" class="form-control" type="number" min="0" max="100" step="1" value="50" disabled />
              <input id="pivot-y-input" class="form-control" type="number" min="0" max="100" step="1" value="100" disabled />
            </div>
          </div>
```

---

### Task 81: Embedded Controls SCSS Layout

**Files:**
- Modify: `src/styles/animation-editor.scss`

**Step 1: Add layout and visibility rules for dynamic controls**
Add styles in [src/styles/animation-editor.scss](file:///d:/soflware/Unity/Source/Farm_HTML/src/styles/animation-editor.scss) to layout details inside a group row and toggle display based on active state:
```scss
.group-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid $border-light;
  border-radius: 8px;
  background: $bg-primary;

  &.is-active {
    border-color: $forest-light;
    background: $forest-pastel;

    .group-row__details {
      display: flex; // Auto expand when active
    }
  }
}

.group-row__details {
  display: none; // Auto collapse when inactive
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px dashed $border;
}

.details-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label-sm {
  color: $muted;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.pivot-inputs-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  align-items: center;

  .pivot-input-wrapper {
    display: flex;
    align-items: center;
    gap: 4px;

    span {
      font-size: 11px;
      color: $muted;
      font-weight: 700;
    }
  }
}
```

---

### Task 82: Embedded Controls TS Logic and Event Wiring

**Files:**
- Modify: `src/animation-editor.ts`

**Step 1: Add helper methods to render options in dynamic template**
Modify [src/animation-editor.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/animation-editor.ts) to define helper functions that populate the dynamic selectors:
- `renderAnimationOptionsForGroup(groupId: string)`: returns HTML `<option>` tags with current selection.
- `renderPivotPresetOptionsForGroup(groupId: string)`: returns HTML `<option>` tags with current selection.

**Step 2: Update `renderGroupList()` template to include controls**
Update the group row template in `renderGroupList()` in [src/animation-editor.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/animation-editor.ts) to include the details container with selectors and number inputs.

**Step 3: Wire change & input events dynamically**
Inside the loop in `renderGroupList()`, find the embedded selectors/inputs and bind events:
- For animation selection: update `partAnimations[groupId] = value` and call `renderPreview()`.
- For pivot preset selection: update `partPivots[groupId] = preset.pivot`, update the number inputs value, and call `renderPreview()`.
- For pivot number inputs: update `partPivots[groupId] = { x, y }`, set preset selector to `custom`, and call `renderPreview()`.

**Step 4: Cleanup unused functions**
Remove `renderAnimationSelect()`, `renderPivotControls()` and their invocations, since the static controls no longer exist.

---

### Task 83: Verify build and manual review

**Files:**
- Modify: `docs/plans/task.md`
- Modify: `docs/plans/current-handoff.md`

**Step 1: Compile production build**
Run: `npm run build`
Expected: Compile succeeds with no errors.

**Step 2: Update task tracker and handoff**
Update [task.md](file:///d:/soflware/Unity/Source/Farm_HTML/docs/plans/task.md) and [current-handoff.md](file:///d:/soflware/Unity/Source/Farm_HTML/docs/plans/current-handoff.md).
Prepare for user manual review.
