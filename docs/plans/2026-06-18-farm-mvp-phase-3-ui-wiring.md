# Farm MVP Phase 3 - UI And Wiring Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the playable browser UI, SCSS class-based crop visuals, interaction loop, and persistence wiring.

**Architecture:** Render the UI from a view model derived from `GameState`. Keep event handlers thin by calling core actions and saving through the repository.

**Tech Stack:** TypeScript, HTML, SCSS, Vite, localStorage.

**Parent Plan:** `docs/plans/2026-06-18-farm-progression-mvp-implementation.md`

---

### Task 5: View Model And DOM Rendering

**Files:**
- Create: `src/ui/viewModel.ts`
- Create: `src/ui/render.ts`
- Modify: `src/styles/main.scss`
- Test: `src/ui/viewModel.test.ts`

- [ ] **Step 1: Write view model tests**

Create `src/ui/viewModel.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { plantSeed } from "../core/actions";
import { createInitialGameState } from "../core/state";
import { createViewModel } from "./viewModel";

describe("createViewModel", () => {
  it("creates render data for hud, crops, plots, and sidebar", () => {
    const state = plantSeed(createInitialGameState(1_000), "plot-0-0", "carrot", 2_000);
    const viewModel = createViewModel(state, 3_000, "carrot");

    expect(viewModel.hud.coins).toBe(25);
    expect(viewModel.hud.farmLevel).toBe(1);
    expect(viewModel.selectedSeed).toBe("carrot");
    expect(viewModel.plots[0]).toMatchObject({
      id: "plot-0-0",
      unlocked: true,
      cropId: "carrot",
      cropName: "Cà rốt",
      growthState: "seeded"
    });
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm test -- src/ui/viewModel.test.ts
```

Expected: FAIL because `src/ui/viewModel.ts` does not exist.

- [ ] **Step 3: Implement view model**

Create `src/ui/viewModel.ts`:

```ts
import { crops } from "../data/crops";
import { levelDefinitions, plotUnlockCost, soilUpgradeCost } from "../data/progression";
import { getPlotDerivedState } from "../core/growth";
import type { CropGrowthState, GameState } from "../core/types";

export type PlotViewModel = {
  id: string;
  row: number;
  column: number;
  unlocked: boolean;
  soilLevel: number;
  cropId: string | null;
  cropName: string | null;
  growthState: CropGrowthState | null;
  isDry: boolean;
  hasPest: boolean;
  isDead: boolean;
  canHarvest: boolean;
  remainingGrowMs: number;
  cropClass: string | null;
  templateClass: string | null;
};

export type AppViewModel = {
  hud: {
    coins: number;
    xp: number;
    farmLevel: number;
    nextLevelXp: number | null;
  };
  selectedSeed: string;
  unlockedCrops: string[];
  seedOptions: Array<{
    cropId: string;
    name: string;
    seedPrice: number;
    owned: number;
    unlocked: boolean;
  }>;
  plots: PlotViewModel[];
  layout: {
    columns: number;
  };
  costs: {
    plotUnlockCost: number;
    soilUpgradeCost: number;
  };
};

export function createViewModel(
  state: GameState,
  now: number,
  selectedSeed: string
): AppViewModel {
  const nextLevel = levelDefinitions.find((level) => level.level > state.player.farmLevel);

  return {
    hud: {
      coins: state.player.coins,
      xp: state.player.xp,
      farmLevel: state.player.farmLevel,
      nextLevelXp: nextLevel?.requiredXp ?? null
    },
    selectedSeed,
    unlockedCrops: [...state.progression.unlockedCrops],
    seedOptions: Object.values(crops).map((crop) => ({
      cropId: crop.id,
      name: crop.name,
      seedPrice: crop.seedPrice,
      owned: state.inventory.seeds[crop.id] ?? 0,
      unlocked: state.progression.unlockedCrops.includes(crop.id)
    })),
    layout: {
      columns: state.farm.layout.columns
    },
    plots: state.farm.plots.map((plot) => {
      const crop = plot.crop ? crops[plot.crop.cropId] : undefined;
      const derived = getPlotDerivedState(plot, crop, now);

      return {
        id: plot.id,
        row: plot.row,
        column: plot.column,
        unlocked: plot.unlocked,
        soilLevel: plot.soilLevel,
        cropId: plot.crop?.cropId ?? null,
        cropName: crop?.name ?? null,
        growthState: derived.growthState,
        isDry: derived.isDry,
        hasPest: derived.hasPest,
        isDead: derived.isDead,
        canHarvest: derived.canHarvest,
        remainingGrowMs: derived.remainingGrowMs,
        cropClass: crop ? `crop--${crop.id}` : null,
        templateClass: crop ? `crop--${crop.template}` : null
      };
    }),
    costs: {
      plotUnlockCost,
      soilUpgradeCost
    }
  };
}
```

- [ ] **Step 4: Implement renderer**

Create `src/ui/render.ts`:

```ts
import type { AppViewModel, PlotViewModel } from "./viewModel";

function formatSeconds(ms: number): string {
  return `${Math.ceil(ms / 1000)}s`;
}

function plotContent(plot: PlotViewModel, selectedSeed: string): string {
  if (!plot.unlocked) {
    return `<button class="plot locked" data-action="unlock-plot" data-plot-id="${plot.id}">Mở ô</button>`;
  }

  if (!plot.cropId) {
    return `<button class="plot empty" data-action="plant" data-plot-id="${plot.id}">Gieo ${selectedSeed}</button>`;
  }

  const classes = [
    "crop",
    plot.cropClass ?? "",
    plot.templateClass ?? "",
    plot.growthState ? `state-${plot.growthState}` : "",
    plot.isDry ? "is-dry" : "",
    plot.hasPest ? "has-pest" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <div class="plot planted">
      <div class="${classes}"></div>
      <strong>${plot.cropName}</strong>
      <span>${plot.growthState ?? ""}</span>
      <small>${plot.canHarvest ? "Sẵn sàng" : formatSeconds(plot.remainingGrowMs)}</small>
      <div class="plot-actions">
        <button data-action="water" data-plot-id="${plot.id}">Tưới</button>
        <button data-action="remove-pest" data-plot-id="${plot.id}" ${plot.hasPest ? "" : "disabled"}>Bắt sâu</button>
        <button data-action="harvest" data-plot-id="${plot.id}" ${plot.canHarvest ? "" : "disabled"}>Thu</button>
        <button data-action="clear-dead" data-plot-id="${plot.id}" ${plot.isDead ? "" : "disabled"}>Dọn</button>
      </div>
    </div>
  `;
}

export function renderApp(root: HTMLElement, viewModel: AppViewModel): void {
  root.innerHTML = `
    <main class="app-shell">
      <header class="hud">
        <div><strong>Coin</strong><span>${viewModel.hud.coins}</span></div>
        <div><strong>Level</strong><span>${viewModel.hud.farmLevel}</span></div>
        <div><strong>XP</strong><span>${viewModel.hud.xp}${viewModel.hud.nextLevelXp ? ` / ${viewModel.hud.nextLevelXp}` : ""}</span></div>
      </header>

      <section class="game-layout">
        <section class="farm-board farm-board--cols-${viewModel.layout.columns}">
          ${viewModel.plots.map((plot) => plotContent(plot, viewModel.selectedSeed)).join("")}
        </section>

        <aside class="sidebar">
          <section>
            <h2>Hạt giống</h2>
            ${viewModel.seedOptions
              .map(
                (seed) => `
                  <button class="seed-option ${seed.cropId === viewModel.selectedSeed ? "selected" : ""}"
                    data-action="select-seed"
                    data-crop-id="${seed.cropId}"
                    ${seed.unlocked ? "" : "disabled"}>
                    ${seed.name} (${seed.owned}) - ${seed.seedPrice} coin
                  </button>
                  <button data-action="buy-seed" data-crop-id="${seed.cropId}" ${seed.unlocked ? "" : "disabled"}>Mua</button>
                `
              )
              .join("")}
          </section>

          <section>
            <h2>Nâng cấp</h2>
            <p>Mở ô: ${viewModel.costs.plotUnlockCost} coin</p>
            <p>Nâng đất: ${viewModel.costs.soilUpgradeCost} coin</p>
          </section>
        </aside>
      </section>
    </main>
  `;
}
```

- [ ] **Step 5: Replace SCSS with app layout and crop visuals**

Replace `src/styles/main.scss` with:

```scss
:root {
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  color: #26412c;
  background: #f5f0df;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button {
  min-height: 36px;
  border: 1px solid #b8a978;
  border-radius: 8px;
  background: #fff8dc;
  color: #26412c;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.app-shell {
  min-height: 100vh;
  padding: 20px;
}

.hud {
  display: flex;
  gap: 12px;
  max-width: 1120px;
  margin: 0 auto 16px;
}

.hud div {
  display: grid;
  min-width: 120px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fff8dc;
}

.game-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
  max-width: 1120px;
  margin: 0 auto;
}

.farm-board {
  display: grid;
  gap: 12px;

  &--cols-3 {
    grid-template-columns: repeat(3, minmax(120px, 1fr));
  }
}

.plot {
  min-height: 150px;
  padding: 12px;
  border-radius: 8px;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.18), transparent 30%),
    linear-gradient(145deg, #b87947, #8b5a37);
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.18);
}

.plot.empty,
.plot.locked {
  width: 100%;
  color: #fff8dc;
}

.plot.locked {
  filter: grayscale(0.5) brightness(0.8);
}

.plot.planted {
  display: grid;
  place-items: center;
  gap: 6px;
  color: #fff8dc;
}

.plot-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  width: 100%;
}

.crop {
  position: relative;
  width: 56px;
  height: 56px;
  transition:
    transform 0.3s ease,
    opacity 0.3s ease,
    filter 0.3s ease;
}

.crop--carrot {
  --leaf: #58b947;
  --fruit: #f27a2a;
}

.crop--strawberry {
  --leaf: #4caf50;
  --fruit: #d93838;
  --flower: #fff0f5;
}

.crop--rice {
  --leaf: #7aa342;
  --fruit: #e8c85a;
}

.crop::before,
.crop::after {
  position: absolute;
  content: "";
  border-radius: 999px;
}

.crop::before {
  inset: 18px 14px 8px;
  background: var(--leaf);
  box-shadow:
    -12px -2px 0 -2px var(--leaf),
    12px -4px 0 -3px var(--leaf);
}

.crop::after {
  inset: 28px 20px 4px;
  background: var(--fruit);
}

.state-seeded {
  transform: scale(0.35);
  opacity: 0.8;
}

.state-sprout {
  transform: scale(0.5);
}

.state-grown {
  transform: scale(0.75);
}

.state-preHarvest {
  transform: scale(0.9);
}

.state-harvestable {
  animation: harvest-ready 1.2s ease-in-out infinite;
  transform: scale(1);
}

.state-dead {
  filter: grayscale(1) brightness(0.65);
  transform: scale(0.75) rotate(-6deg);
}

.is-dry {
  filter: saturate(0.7) brightness(0.85);
}

.has-pest {
  box-shadow: 0 0 0 4px rgba(82, 58, 30, 0.3);
}

.sidebar {
  display: grid;
  align-content: start;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  background: #fff8dc;
}

.seed-option {
  display: block;
  width: 100%;
  margin-bottom: 6px;
}

.seed-option.selected {
  border-color: #4d8f52;
  background: #dff0c8;
}

@keyframes harvest-ready {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.08);
  }
}

@media (max-width: 760px) {
  .game-layout {
    grid-template-columns: 1fr;
  }

  .farm-board {
    grid-template-columns: repeat(3, minmax(88px, 1fr));
  }

  .plot {
    min-height: 132px;
  }
}
```

- [ ] **Step 6: Verify Task 5**

Run:

```bash
npm test -- src/ui/viewModel.test.ts
npm run build
```

Expected: tests pass and build completes.

---

### Task 6: App Wiring, Save/Load, And Interaction Loop

**Files:**
- Modify: `src/main.ts`
- Test: `src/core/actions.test.ts`

- [ ] **Step 1: Add missing clear-dead action test**

Append this test inside `describe("gameplay actions", ...)` in `src/core/actions.test.ts`:

```ts
it("clears dead crops for free", () => {
  const planted = plantSeed(createInitialGameState(1_000), "plot-0-0", "carrot", 2_000);
  const dead = {
    ...planted,
    farm: {
      ...planted.farm,
      plots: planted.farm.plots.map((plot) =>
        plot.id === "plot-0-0" && plot.crop
          ? { ...plot, crop: { ...plot.crop, deadAt: 3_000 } }
          : plot
      )
    }
  };

  expect(clearDeadCrop(dead, "plot-0-0").farm.plots[0].crop).toBeNull();
});
```

Update the import list:

```ts
import {
  buySeed,
  clearDeadCrop,
  harvestCrop,
  plantSeed,
  removePest,
  tickGame,
  unlockPlot,
  upgradeSoil,
  waterCrop
} from "./actions";
```

- [ ] **Step 2: Verify clear-dead action test**

Run:

```bash
npm test -- src/core/actions.test.ts
```

Expected: tests pass.

- [ ] **Step 3: Wire the app**

Replace `src/main.ts` with:

```ts
import {
  buySeed,
  clearDeadCrop,
  harvestCrop,
  plantSeed,
  removePest,
  tickGame,
  unlockPlot,
  waterCrop
} from "./core/actions";
import { createInitialGameState } from "./core/state";
import { LocalStorageSaveRepository } from "./core/storage";
import type { GameState } from "./core/types";
import "./styles/main.scss";
import { renderApp } from "./ui/render";
import { createViewModel } from "./ui/viewModel";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root element");
}

const saveRepository = new LocalStorageSaveRepository();
let state: GameState = saveRepository.load() ?? createInitialGameState();
let selectedSeed = state.progression.unlockedCrops[0] ?? "carrot";

function render(): void {
  renderApp(app, createViewModel(state, Date.now(), selectedSeed));
}

function persistAndRender(): void {
  saveRepository.save(state);
  render();
}

function runAction(action: () => GameState): void {
  try {
    state = action();
    persistAndRender();
  } catch (error) {
    console.warn(error instanceof Error ? error.message : error);
  }
}

app.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const button = target.closest<HTMLButtonElement>("button[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const plotId = button.dataset.plotId;
  const cropId = button.dataset.cropId;

  if (action === "select-seed" && cropId) {
    selectedSeed = cropId;
    render();
    return;
  }

  if (action === "buy-seed" && cropId) {
    runAction(() => buySeed(state, cropId));
    return;
  }

  if (action === "plant" && plotId) {
    runAction(() => plantSeed(state, plotId, selectedSeed));
    return;
  }

  if (action === "water" && plotId) {
    runAction(() => waterCrop(state, plotId));
    return;
  }

  if (action === "remove-pest" && plotId) {
    runAction(() => removePest(state, plotId));
    return;
  }

  if (action === "harvest" && plotId) {
    runAction(() => harvestCrop(state, plotId));
    return;
  }

  if (action === "clear-dead" && plotId) {
    runAction(() => clearDeadCrop(state, plotId));
    return;
  }

  if (action === "unlock-plot" && plotId) {
    runAction(() => unlockPlot(state, plotId));
  }
});

setInterval(() => {
  state = tickGame(state);
  saveRepository.save(state);
  render();
}, 1000);

render();
```

- [ ] **Step 4: Add soil upgrade UI action**

The renderer currently shows upgrade cost but has no per-plot upgrade button. Add this button to `plotContent` in `src/ui/render.ts` inside `.plot-actions`:

```html
<button data-action="upgrade-soil" data-plot-id="${plot.id}">Nâng đất ${plot.soilLevel}</button>
```

Update `src/main.ts` import list:

```ts
import {
  buySeed,
  clearDeadCrop,
  harvestCrop,
  plantSeed,
  removePest,
  tickGame,
  unlockPlot,
  upgradeSoil,
  waterCrop
} from "./core/actions";
```

Add event branch:

```ts
if (action === "upgrade-soil" && plotId) {
  runAction(() => upgradeSoil(state, plotId));
}
```

- [ ] **Step 5: Verify full MVP build**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and build completes.

- [ ] **Step 6: Browser smoke review**

Run:

```bash
npm run dev -- --port 3000 --strictPort
```

Open `http://127.0.0.1:3000` and verify:

- HUD renders coin, level, XP.
- Board renders 3x3.
- Selecting/buying seeds works.
- Planting consumes seed.
- Water and pest buttons do not crash.
- Harvesting a ready crop adds coin/XP.
- localStorage persists after page refresh.

Expected: one playable MVP loop works in the browser.

---

