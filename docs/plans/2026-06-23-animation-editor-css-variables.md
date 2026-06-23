# SVG Animation Customization using CSS Custom Properties Plan

**Goal:** Implement dynamic motion parameter customization (speed, delay, angle, vertical bounce offset, and scale breathing) for layer-based crop animations in the Crop Animation Editor. This allows developers to fine-tune unique organic behaviors for each layer of a crop stage without writing new hardcoded CSS keyframes.

## Tech Stack & Architecture Decisions

1. **CSS Custom Properties & Keyframes (Primary Approach):**
   - We will define motion parameters per group inside `animations.json`.
   - In the sidebar, each group row will show sliders for Speed/Duration, Delay/Phase, Sway Angle, Vertical Offset, and Scale.
   - At runtime/preview, the editor will query these configs and programmatically apply them as CSS Custom Properties on the group elements (e.g., `node.style.setProperty('--anim-duration', '2800ms')`).
   - This satisfies the project rules by keeping the saved SVG assets completely clean (no static inline `style="..."` attributes saved to the disk files).
   
2. **GSAP (GreenSock Animation Platform) - Note for Future:**
   - GSAP and its MorphSVG plugin are reserved for future phases. They are highly suitable for growth transitions (e.g., a sprout growing into a full plant) and custom mouse/click reactions where keyframes are insufficient.
   - We will not integrate GSAP in this phase to prevent dependency bloating and keep the idle sway loops lightweight and hardware-accelerated.

3. **SMIL (Synchronized Multimedia Integration Language) - Rejected/Removed:**
   - SMIL (e.g. `<animateTransform>`) is completely excluded from our roadmap. It is difficult to modify dynamically via web UI controls, does not synchronize well with structured metadata config, and requires complicated SVG markup preservation.

---

## Proposed Schema in `animations.json`

```json
{
  "label": "leaf_1",
  "animation": "soft-sway",
  "pivot": { "x": 13, "y": 90 },
  "motion": {
    "durationMs": 2800,
    "delayMs": 120,
    "angleDeg": 1.4,
    "yPx": 2,
    "scale": 1.02
  }
}
```

---

## Proposed Changes

### Animation Presets & SCSS Refactoring

#### [MODIFY] [animation-editor.scss](file:///d:/soflware/Unity/Source/Farm_HTML/src/styles/animation-editor.scss)
- Update preset keyframes to read values from CSS custom properties with fallback values:
  - `crop-soft-sway` using `var(--anim-duration, 2.8s)` and `var(--anim-delay, 0s)` for timeline, and `var(--anim-angle, 1.2deg)` for rotation degree.
  - `crop-sway-left` / `crop-sway-right` using `var(--anim-duration, 2.4s)`, `var(--anim-delay, 0s)`, and `var(--anim-angle, 1deg)`.
  - `crop-leaf-breathe` using `var(--anim-duration, 2.6s)`, `var(--anim-delay, 0s)`, and `var(--anim-scale, 1.02)`.
  - `crop-bob` using `var(--anim-duration, 2.2s)`, `var(--anim-delay, 0s)`, and `var(--anim-y, 1px)`.

### Editor Logic & UI Implementation

#### [MODIFY] [animation-editor.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/animation-editor.ts)
- Declare a state object `let partMotions: Record<string, MotionConfig> = {};` where `MotionConfig` holds the duration, delay, angle, vertical offset, and scale.
- In `selectStage()`, load `motion` configurations from `animationsMetadata` into `partMotions`.
- Add helper `applyMotionToDomNode(node: SVGGElement, motion: MotionConfig)` to set properties:
  - Use `node.style.setProperty(...)` when value is defined.
  - Use `node.style.removeProperty(...)` when value is undefined to avoid empty/invalid property values.
- In `decoratePreviewGroups()`, query `partMotions[group.id]` and call `applyMotionToDomNode(node, motion)`.
- In `renderGroupList()`, inside `.group-row__details`, render sliders/inputs for:
  - **Speed / Duration:** `1000ms` - `5000ms` (Step `100ms`).
  - **Delay / Phase:** `0ms` - `3000ms` (Step `50ms`).
  - **Sway Angle:** `0deg` - `10deg` (Step `0.1deg`).
  - **Offset Y (Bob):** `0px` - `10px` (Step `1px`).
  - **Scale (Breathe):** `1.00` - `1.15` (Step `0.01`).
- **State Preservation & Performance Optimization:**
  - Wire input event listeners to save values to `partMotions` and apply CSS variables directly to the active group element in the DOM.
  - Use the existing `cssEscape(groupId)` helper function defined at the bottom of the file (or browser's native `CSS.escape()`) to target the query selector safely:
    ```typescript
    const motion = partMotions[groupId];
    const node = preview.querySelector(`[data-group-id="${cssEscape(groupId)}"]`);
    if (node) applyMotionToDomNode(node, motion);
    ```
  - This avoids calling `renderPreview()` (which rebuilds DOM and resets scroll/focus) during dragging or active edits of inputs/sliders.
- **Cache Synchronization on Save:**
  - In `handleSave()`, write the `motion` parameters into `parts` config payload so they are serialized into `animations.json`.
  - Upon successful fetch response, merge the updated configuration into the existing stage configuration inside the global cache `animationsMetadata` so stage switches do not revert UI values:
    ```typescript
    if (!animationsMetadata) {
      animationsMetadata = { crop: cropName, stages: {} };
    }
    if (!animationsMetadata.stages) {
      animationsMetadata.stages = {};
    }
    const existingStage = animationsMetadata.stages[activeStage.stageId] || {};
    animationsMetadata.stages[activeStage.stageId] = {
      ...existingStage,
      sourceFile: activeStage.sourceFile || `${activeStage.stageId}.svg`,
      groupedFile: activeStage.groupedFile,
      parts
    };
    ```

---

## Verification Plan

### Automated Tests
- Run typecheck and compilation check: `npm run build`.
- Add test case in `src/animation-editor.test.ts` or a new test file validating `motion` serialization and stage configuration recovery.
- Run tests: `npx vitest run <changed-test-files>`.

### Manual Verification
- Load `http://localhost:4000/crop-animation-editor.html?crop=corn` in a browser.
- Select a stage and open a layer's card.
- Adjust the Speed/Duration, Sway Angle, or Delay sliders and confirm that:
  - The preview sways faster, wider, or lags behind other elements according to the sliders.
  - The changes are visible in real-time.
  - Click "Save Grouped SVG", refresh the page, and check if the sliders and sways restore to the exact values you configured.
