# Per-Layer Animation Preview Button in Animation Editor Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Add a "Preview" button inside each layer's row (group row) in the Animation Editor group list so users can preview the animation of that specific layer/group independently (while all other layers remain static).

**Architecture:** 
1. Render a new `Preview` / `Stop` button inside the dynamic group row controls template in `src/animation-editor.ts`.
2. Define a state variable `soloPreviewGroupId` to track which layer is currently in independent preview mode.
3. Toggle `soloPreviewGroupId` on button click, making sure to clear any global animation preview to avoid conflicts.
4. Modify `decoratePreviewGroups` in `src/animation-editor.ts` to add the `.is-animating` class to the SVG `<g>` element if it matches the `soloPreviewGroupId` or if global preview is active.
5. Update `src/styles/animation-editor.scss` to trigger the keyframe animations on either global preview wrapper class OR directly on `.crop-part.is-animating`.

**Tech Stack:** TypeScript, SCSS, HTML.

---

### Task 88: Add Part Preview Button and Logic in TS

**Files:**
- Modify: `src/animation-editor.ts`

**Step 1: Add state variable**
Add a state variable `let soloPreviewGroupId = "";` near the other global variables.

**Step 2: Update `renderGroupList()` template to include preview button**
Inside `renderGroupList()`, add a preview button to the `.group-row__controls` markup:
```html
        <div class="group-row__controls">
          <select class="form-control group-label-select" data-action="label">
            ${renderPartOptions(group.label)}
          </select>
          <button class="btn btn-secondary group-preview-btn" type="button" data-action="preview-part">
            ${soloPreviewGroupId === group.id ? "Stop" : "Preview"}
          </button>
          <button class="btn btn-secondary group-visibility-btn" type="button" data-action="visibility">${group.hidden ? "Show" : "Hide"}</button>
        </div>
```

**Step 3: Wire up click event for per-layer preview**
Inside the `renderGroupList()` loop, listen for click events on `[data-action="preview-part"]`:
- Toggle `soloPreviewGroupId` between `groupId` and `""`.
- If `soloPreviewGroupId` becomes active, set `isPreviewingAnimation = false` to stop global preview.
- Call `renderPreview()`, `renderGroupList()`, and `updateActionState()`.

**Step 4: Update global preview event listener**
In `setupEvents()`, modify the click listener for `preview-animation-btn` to clear `soloPreviewGroupId = ""` when global preview is toggled on.

**Step 5: Update `decoratePreviewGroups()`**
In `decoratePreviewGroups()`, determine if a group should animate:
```typescript
const isAnimating = isPreviewingAnimation || (soloPreviewGroupId === group.id);
node.classList.toggle("is-animating", isAnimating);
```

---

### Task 89: Update Animation SCSS Selectors

**Files:**
- Modify: `src/styles/animation-editor.scss`

**Step 1: Adjust keyframe animation selectors**
Modify `src/styles/animation-editor.scss` to apply animations to either `.is-previewing-animation .crop-part` or `.crop-part.is-animating`:
```scss
.is-previewing-animation .crop-part,
.crop-part.is-animating {
  &.anim-soft-sway {
    animation: crop-soft-sway 2.8s ease-in-out infinite;
  }

  &.anim-sway-left {
    transform-origin: 80% 90%;
    animation: crop-sway-left 2.4s ease-in-out infinite;
  }

  &.anim-sway-right {
    transform-origin: 20% 90%;
    animation: crop-sway-right 2.4s ease-in-out infinite;
  }

  &.anim-leaf-breathe {
    transform-origin: 50% 100%;
    animation: crop-leaf-breathe 2.6s ease-in-out infinite;
  }

  &.anim-bob {
    animation: crop-bob 2.2s ease-in-out infinite;
  }
}
```

---

### Task 90: Verify build, tests, and manual preview

**Files:**
- Modify: `docs/plans/task.md`
- Modify: `docs/plans/current-handoff.md`

**Step 1: Compile and test**
- Run `npm run build` to confirm compilation.
- Run `npm run test` to check unit tests.

**Step 2: Update task tracker and handoff**
Record progress in [task.md](file:///d:/soflware/Unity/Source/Farm_HTML/docs/plans/task.md) and [current-handoff.md](file:///d:/soflware/Unity/Source/Farm_HTML/docs/plans/current-handoff.md).
