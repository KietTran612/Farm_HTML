# Isometric Farm Board UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the farm board from a flat grid to a 2.5D/isometric board while keeping existing gameplay state, actions, persistence, and crop logic unchanged.

**Architecture:** This is a UI-only pass. `GameState`, crop definitions, progression, save/load, and gameplay actions stay as they are. The renderer adds stable tile classes from row/column data, and SCSS owns all tile positioning, perspective, z-order, crop anchoring, and responsive behavior.

**Tech Stack:** Vite, TypeScript, SCSS, DOM rendering, Vitest.

---

## Scope

In scope:

- Add isometric board classes and markup in `src/ui/render.ts`.
- Extend `PlotViewModel` with stable tile/z-order class data.
- Convert farm-board styling in `src/styles/main.scss` to an isometric presentation.
- Keep click/tap targets usable.
- Preserve all current actions: plant, water, remove pest, harvest, clear dead, unlock plot, upgrade soil.
- Run focused tests, build, and browser smoke review.

Out of scope:

- No Canvas/WebGL.
- No React/Vue/Tailwind.
- No gameplay/economy changes.
- No board expansion beyond current 3x3.
- No character movement.
- No new crop content.

## Design Rules

- Do not use inline `style` attributes for tile positioning or normal styling.
- Use generated classes such as `tile-r0-c0`, `tile-z2`, and `farm-board--isometric`.
- SCSS must own transforms, positioning, visual depth, and responsive behavior.
- Crops should visually sit on the tile, not inside a floating card.
- Text/buttons should remain readable and clickable.

## Task 0: View Model Tile Classes

**Files:**
- Modify: `src/ui/viewModel.ts`
- Modify: `src/ui/viewModel.test.ts`

- [ ] **Step 1: Add failing view model expectation**

Update the first plot expectation in `src/ui/viewModel.test.ts`:

```ts
expect(viewModel.plots[0]).toMatchObject({
  id: "plot-0-0",
  row: 0,
  column: 0,
  tileClass: "tile-r0-c0",
  zClass: "tile-z0",
  unlocked: true,
  cropId: "carrot",
  cropName: "Cà rốt",
  growthState: "seeded"
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm test -- src/ui/viewModel.test.ts
```

Expected: FAIL because `tileClass` and `zClass` are not implemented.

- [ ] **Step 3: Extend `PlotViewModel`**

In `src/ui/viewModel.ts`, add these properties to `PlotViewModel`:

```ts
tileClass: string;
zClass: string;
```

In the plot mapper, add:

```ts
tileClass: `tile-r${plot.row}-c${plot.column}`,
zClass: `tile-z${plot.row + plot.column}`,
```

- [ ] **Step 4: Verify**

Run:

```bash
npm test -- src/ui/viewModel.test.ts
```

Expected: PASS.

## Task 1: Isometric Renderer Markup

**Files:**
- Modify: `src/ui/render.ts`

- [ ] **Step 1: Add board mode class**

Change the farm board element in `renderApp`:

```html
<section class="farm-board farm-board--isometric farm-board--cols-${viewModel.layout.columns}">
```

- [ ] **Step 2: Wrap each plot in an isometric tile**

For locked plots, render:

```html
<article class="iso-tile ${plot.tileClass} ${plot.zClass}">
  <button class="iso-tile__ground plot locked" data-action="unlock-plot" data-plot-id="${plot.id}">Mở ô</button>
</article>
```

For empty plots, render:

```html
<article class="iso-tile ${plot.tileClass} ${plot.zClass}">
  <div class="iso-tile__ground plot empty">
    <button data-action="plant" data-plot-id="${plot.id}">Gieo ${selectedSeed}</button>
    <button data-action="upgrade-soil" data-plot-id="${plot.id}">Nâng đất (Lvl ${plot.soilLevel})</button>
  </div>
</article>
```

For planted plots, render:

```html
<article class="iso-tile ${plot.tileClass} ${plot.zClass}">
  <div class="iso-tile__ground plot planted">
    <div class="iso-tile__crop">
      <div class="${classes}"></div>
    </div>
    <strong>${plot.cropName}</strong>
    <span>${plot.growthState ?? ""}</span>
    <small>${plot.canHarvest ? "Sẵn sàng" : formatSeconds(plot.remainingGrowMs)}</small>
    <div class="plot-actions">...</div>
  </div>
</article>
```

- [ ] **Step 3: Verify build**

Run:

```bash
npm run build
```

Expected: PASS.

## Task 2: Isometric SCSS

**Files:**
- Modify: `src/styles/main.scss`

- [ ] **Step 1: Add isometric board container**

Add:

```scss
.farm-board--isometric {
  position: relative;
  min-height: 480px;
  overflow: visible;

  .iso-tile {
    position: absolute;
    width: 148px;
    height: 112px;
  }

  .iso-tile__ground {
    position: relative;
    width: 148px;
    height: 112px;
    transform: rotateX(58deg) rotateZ(45deg);
    transform-style: preserve-3d;
  }
}
```

- [ ] **Step 2: Add explicit 3x3 tile position classes**

Add:

```scss
.tile-r0-c0 { left: 180px; top: 0; }
.tile-r0-c1 { left: 284px; top: 52px; }
.tile-r0-c2 { left: 388px; top: 104px; }
.tile-r1-c0 { left: 76px; top: 52px; }
.tile-r1-c1 { left: 180px; top: 104px; }
.tile-r1-c2 { left: 284px; top: 156px; }
.tile-r2-c0 { left: -28px; top: 104px; }
.tile-r2-c1 { left: 76px; top: 156px; }
.tile-r2-c2 { left: 180px; top: 208px; }

.tile-z0 { z-index: 10; }
.tile-z1 { z-index: 20; }
.tile-z2 { z-index: 30; }
.tile-z3 { z-index: 40; }
.tile-z4 { z-index: 50; }
```

- [ ] **Step 3: Keep labels and controls readable**

Add:

```scss
.farm-board--isometric {
  .plot > strong,
  .plot > span,
  .plot > small,
  .plot-actions,
  .plot.empty > button {
    transform: rotateZ(-45deg) rotateX(-58deg);
  }
}
```

- [ ] **Step 4: Anchor crop above the tile**

Add:

```scss
.iso-tile__crop {
  position: absolute;
  left: 50%;
  top: 12px;
  transform: translateX(-50%) rotateZ(-45deg) rotateX(-58deg);
  transform-origin: center bottom;
  z-index: 2;
}
```

- [ ] **Step 5: Verify build**

Run:

```bash
npm run build
```

Expected: PASS.

## Task 3: Browser Review And Cleanup

**Files:**
- Modify if needed: `src/ui/render.ts`
- Modify if needed: `src/styles/main.scss`
- Modify: `docs/plans/task.md`
- Modify: `docs/plans/current-handoff.md`

- [ ] **Step 1: Run focused checks**

Run:

```bash
npm test -- src/ui/viewModel.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 2: Browser smoke review**

Run:

```bash
npm run dev -- --port 3000 --strictPort
```

Open `http://127.0.0.1:3000` and verify:

- Board appears as 2.5D/isometric tiles.
- 3x3 layout is readable and not clipped.
- Locked, empty, planted, dry, pest, dead, and harvestable states remain visible.
- Buttons are clickable.
- Plant, water, remove pest, harvest, unlock plot, and upgrade soil actions still work.
- Mobile width does not overlap the sidebar and board.

- [ ] **Step 3: Update workflow docs**

Update `docs/plans/task.md`:

```md
| **Task 10: Execute Isometric Farm Board UI** | [x] | Converted the farm board to 2.5D/isometric DOM + SCSS while preserving gameplay. |
```

Update `docs/plans/current-handoff.md` with the completed work and verification results.

## Completion Criteria

- No inline normal styling in renderer.
- `npm test -- src/ui/viewModel.test.ts` passes.
- `npm run build` passes.
- Browser smoke review confirms the isometric board is readable and interactive.
