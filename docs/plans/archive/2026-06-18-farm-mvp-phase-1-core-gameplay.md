# Farm MVP Phase 1 - Core Gameplay Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the pure gameplay rules for crop growth, care, death, harvesting, XP, unlocks, and soil upgrades.

**Architecture:** Keep gameplay as serializable state transitions and derived calculations. No DOM rendering or localStorage access belongs in this phase.

**Tech Stack:** TypeScript, Vitest.

**Parent Plan:** `docs/plans/2026-06-18-farm-progression-mvp-implementation.md`

---

### Task 2: Derived Growth, Water, Pest, And Death Logic

**Files:**
- Create: `src/core/growth.ts`
- Test: `src/core/growth.test.ts`

- [ ] **Step 1: Write growth logic tests**

Create `src/core/growth.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { crops } from "../data/crops";
import {
  getCropGrowthState,
  getPlotDerivedState,
  shouldSpawnPest,
  tickPlotCare
} from "./growth";
import type { Plot } from "./types";

const carrot = crops.carrot;

function plantedPlot(overrides: Partial<Plot["crop"]> = {}): Plot {
  return {
    id: "plot-0-0",
    row: 0,
    column: 0,
    unlocked: true,
    soilLevel: 1,
    crop: {
      cropId: "carrot",
      plantedAt: 1_000_000_000,
      wateredAt: 1_000_000_000,
      pestAppearedAt: null,
      deadAt: null,
      ...overrides
    }
  };
}

describe("getCropGrowthState", () => {
  it("derives growth states from plantedAt and now", () => {
    expect(getCropGrowthState(plantedPlot(), carrot, 1_000_010_000)).toBe("seeded");
    expect(getCropGrowthState(plantedPlot(), carrot, 1_000_020_000)).toBe("sprout");
    expect(getCropGrowthState(plantedPlot(), carrot, 1_000_035_000)).toBe("grown");
    expect(getCropGrowthState(plantedPlot(), carrot, 1_000_055_000)).toBe("preHarvest");
    expect(getCropGrowthState(plantedPlot(), carrot, 1_000_061_000)).toBe("harvestable");
  });

  it("keeps dead crops dead through deadAt", () => {
    expect(
      getCropGrowthState(plantedPlot({ deadAt: 1_000_005_000 }), carrot, 1_000_061_000)
    ).toBe("dead");
  });
});

describe("getPlotDerivedState", () => {
  it("derives dry and pest state without storing flags", () => {
    const derived = getPlotDerivedState(
      plantedPlot({ wateredAt: 1_000_000_000, pestAppearedAt: 1_000_030_000 }),
      carrot,
      1_000_181_000
    );

    expect(derived.isDry).toBe(true);
    expect(derived.hasPest).toBe(true);
    expect(derived.isDead).toBe(true);
  });
});

describe("tickPlotCare", () => {
  it("sets deadAt when water timeout is exceeded", () => {
    const plot = plantedPlot({ wateredAt: 1_000_000_000 });
    const next = tickPlotCare(plot, carrot, 1_000_181_000, 0);

    expect(next.crop?.deadAt).toBe(1_000_181_000);
  });

  it("sets pestAppearedAt once when random roll is below pest chance", () => {
    const plot = plantedPlot();
    const next = tickPlotCare(plot, carrot, 1_000_020_000, 0.01);

    expect(next.crop?.pestAppearedAt).toBe(1_000_020_000);
  });
});

describe("shouldSpawnPest", () => {
  it("does not spawn pests on dead or already infested crops", () => {
    expect(shouldSpawnPest(plantedPlot({ deadAt: 1 }), carrot, 0)).toBe(false);
    expect(shouldSpawnPest(plantedPlot({ pestAppearedAt: 1 }), carrot, 0)).toBe(false);
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm test -- src/core/growth.test.ts
```

Expected: FAIL because `src/core/growth.ts` does not exist.

- [ ] **Step 3: Implement derived growth logic**

Create `src/core/growth.ts`:

```ts
import type { CropDefinition, CropGrowthState, Plot } from "./types";

export type PlotDerivedState = {
  growthState: CropGrowthState | null;
  isDry: boolean;
  hasPest: boolean;
  isDead: boolean;
  canHarvest: boolean;
  remainingGrowMs: number;
};

const MS_PER_SECOND = 1000;

export function getCropGrowthState(
  plot: Plot,
  crop: CropDefinition,
  now: number
): CropGrowthState {
  if (!plot.crop) {
    return "dead";
  }

  if (plot.crop.deadAt !== null) {
    return "dead";
  }

  const elapsedSeconds = Math.max(0, (now - plot.crop.plantedAt) / MS_PER_SECOND);
  const progress = elapsedSeconds / crop.growDuration;

  if (progress < 0.2) return "seeded";
  if (progress < 0.4) return "sprout";
  if (progress < 0.7) return "grown";
  if (progress < 1) return "preHarvest";

  return "harvestable";
}

export function getPlotDerivedState(
  plot: Plot,
  crop: CropDefinition | undefined,
  now: number
): PlotDerivedState {
  if (!plot.crop || !crop) {
    return {
      growthState: null,
      isDry: false,
      hasPest: false,
      isDead: false,
      canHarvest: false,
      remainingGrowMs: 0
    };
  }

  const waterDeadline = plot.crop.wateredAt + crop.waterTimeout * MS_PER_SECOND;
  const pestDeadline =
    plot.crop.pestAppearedAt === null
      ? Number.POSITIVE_INFINITY
      : plot.crop.pestAppearedAt + crop.pestTimeout * MS_PER_SECOND;
  const isDead = plot.crop.deadAt !== null || now > waterDeadline || now > pestDeadline;
  const growthState = isDead ? "dead" : getCropGrowthState(plot, crop, now);
  const harvestAt = plot.crop.plantedAt + crop.growDuration * MS_PER_SECOND;

  return {
    growthState,
    isDry: !isDead && now > waterDeadline,
    hasPest: !isDead && plot.crop.pestAppearedAt !== null,
    isDead,
    canHarvest: growthState === "harvestable",
    remainingGrowMs: Math.max(0, harvestAt - now)
  };
}

export function shouldSpawnPest(
  plot: Plot,
  crop: CropDefinition,
  now: number,
  randomRoll: number
): boolean {
  if (!plot.crop || plot.crop.deadAt !== null || plot.crop.pestAppearedAt !== null) {
    return false;
  }

  const elapsedSeconds = Math.max(0, (now - plot.crop.plantedAt) / MS_PER_SECOND);
  if (elapsedSeconds < crop.growDuration * 0.2) {
    return false;
  }

  return randomRoll < crop.pestChance;
}

export function tickPlotCare(
  plot: Plot,
  crop: CropDefinition | undefined,
  now: number,
  randomRoll: number
): Plot {
  if (!plot.crop || !crop || plot.crop.deadAt !== null) {
    return plot;
  }

  const derived = getPlotDerivedState(plot, crop, now);
  if (derived.isDead) {
    return {
      ...plot,
      crop: {
        ...plot.crop,
        deadAt: now
      }
    };
  }

  if (shouldSpawnPest(plot, crop, now, randomRoll)) {
    return {
      ...plot,
      crop: {
        ...plot.crop,
        pestAppearedAt: now
      }
    };
  }

  return plot;
}
```

- [ ] **Step 4: Keep pest spawn deterministic in tests**

Confirm `shouldSpawnPest` receives `now` from the caller. The test assertions should use this signature:

```ts
expect(shouldSpawnPest(plantedPlot({ deadAt: 1 }), carrot, 1_000_020_000, 0)).toBe(false);
expect(shouldSpawnPest(plantedPlot({ pestAppearedAt: 1 }), carrot, 1_000_020_000, 0)).toBe(false);
```

- [ ] **Step 5: Verify Task 2**

Run:

```bash
npm test -- src/core/growth.test.ts
npm run build
```

Expected: tests pass and build completes.

---

### Task 3: Gameplay Actions And Progression

**Files:**
- Create: `src/core/actions.ts`
- Test: `src/core/actions.test.ts`

- [ ] **Step 1: Write action tests**

Create `src/core/actions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createInitialGameState } from "./state";
import {
  buySeed,
  harvestCrop,
  plantSeed,
  removePest,
  tickGame,
  unlockPlot,
  upgradeSoil,
  waterCrop
} from "./actions";

describe("gameplay actions", () => {
  it("plants seed by consuming inventory and setting timestamps", () => {
    const state = createInitialGameState(1_000);
    const next = plantSeed(state, "plot-0-0", "carrot", 2_000);

    expect(next.inventory.seeds.carrot).toBe(2);
    expect(next.farm.plots[0].crop).toMatchObject({
      cropId: "carrot",
      plantedAt: 2_000,
      wateredAt: 2_000,
      pestAppearedAt: null,
      deadAt: null
    });
  });

  it("waters and removes pests without storing derived flags", () => {
    const planted = plantSeed(createInitialGameState(1_000), "plot-0-0", "carrot", 2_000);
    const infested = {
      ...planted,
      farm: {
        ...planted.farm,
        plots: planted.farm.plots.map((plot) =>
          plot.id === "plot-0-0" && plot.crop
            ? { ...plot, crop: { ...plot.crop, pestAppearedAt: 3_000 } }
            : plot
        )
      }
    };

    expect(waterCrop(infested, "plot-0-0", 4_000).farm.plots[0].crop?.wateredAt).toBe(4_000);
    expect(removePest(infested, "plot-0-0").farm.plots[0].crop?.pestAppearedAt).toBeNull();
  });

  it("harvests mature crop and applies coin/xp progression", () => {
    const planted = plantSeed(createInitialGameState(1_000), "plot-0-0", "carrot", 2_000);
    const next = harvestCrop(planted, "plot-0-0", 63_000);

    expect(next.player.coins).toBe(37);
    expect(next.player.xp).toBe(8);
    expect(next.farm.plots[0].crop).toBeNull();
  });

  it("unlocks plots and upgrades soil when rules allow it", () => {
    const state = {
      ...createInitialGameState(1_000),
      player: { id: "local-player", coins: 100, xp: 40, farmLevel: 2 },
      progression: { unlockedCrops: ["carrot", "strawberry"] }
    };

    const unlocked = unlockPlot(state, "plot-1-1");
    expect(unlocked.player.coins).toBe(75);
    expect(unlocked.farm.plots.find((plot) => plot.id === "plot-1-1")?.unlocked).toBe(true);

    const upgraded = upgradeSoil(unlocked, "plot-0-0");
    expect(upgraded.player.coins).toBe(35);
    expect(upgraded.farm.plots[0].soilLevel).toBe(2);
  });

  it("buys seeds only for unlocked crops", () => {
    const state = createInitialGameState(1_000);
    const next = buySeed(state, "carrot");

    expect(next.player.coins).toBe(20);
    expect(next.inventory.seeds.carrot).toBe(4);
    expect(() => buySeed(state, "strawberry")).toThrow("Crop is not unlocked");
  });

  it("tickGame updates farm level and unlocks crops from xp", () => {
    const state = {
      ...createInitialGameState(1_000),
      player: { id: "local-player", coins: 25, xp: 40, farmLevel: 1 }
    };

    const next = tickGame(state, 2_000, () => 1);

    expect(next.player.farmLevel).toBe(2);
    expect(next.progression.unlockedCrops).toEqual(["carrot", "strawberry"]);
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm test -- src/core/actions.test.ts
```

Expected: FAIL because `src/core/actions.ts` does not exist.

- [ ] **Step 3: Implement pure gameplay actions**

Create `src/core/actions.ts`:

```ts
import { crops } from "../data/crops";
import {
  getLevelForXp,
  plotUnlockCost,
  soilUpgradeCost
} from "../data/progression";
import { getPlotDerivedState, tickPlotCare } from "./growth";
import type { GameState, Plot } from "./types";

type RandomSource = () => number;

function touch(state: GameState, now: number = Date.now()): GameState {
  return {
    ...state,
    timestamps: {
      ...state.timestamps,
      updatedAt: now
    }
  };
}

function updatePlot(state: GameState, plotId: string, updater: (plot: Plot) => Plot): GameState {
  return {
    ...state,
    farm: {
      ...state.farm,
      plots: state.farm.plots.map((plot) => (plot.id === plotId ? updater(plot) : plot))
    }
  };
}

function getPlotOrThrow(state: GameState, plotId: string): Plot {
  const plot = state.farm.plots.find((candidate) => candidate.id === plotId);
  if (!plot) {
    throw new Error(`Plot not found: ${plotId}`);
  }
  return plot;
}

export function plantSeed(
  state: GameState,
  plotId: string,
  cropId: string,
  now: number = Date.now()
): GameState {
  const crop = crops[cropId];
  if (!crop) throw new Error(`Unknown crop: ${cropId}`);
  if (!state.progression.unlockedCrops.includes(cropId)) throw new Error("Crop is not unlocked");
  if ((state.inventory.seeds[cropId] ?? 0) <= 0) throw new Error("No seeds available");

  const plot = getPlotOrThrow(state, plotId);
  if (!plot.unlocked) throw new Error("Plot is locked");
  if (plot.crop) throw new Error("Plot already has a crop");

  const planted = updatePlot(state, plotId, (current) => ({
    ...current,
    crop: {
      cropId,
      plantedAt: now,
      wateredAt: now,
      pestAppearedAt: null,
      deadAt: null
    }
  }));

  return touch(
    {
      ...planted,
      inventory: {
        seeds: {
          ...planted.inventory.seeds,
          [cropId]: (planted.inventory.seeds[cropId] ?? 0) - 1
        }
      }
    },
    now
  );
}

export function waterCrop(
  state: GameState,
  plotId: string,
  now: number = Date.now()
): GameState {
  return touch(
    updatePlot(state, plotId, (plot) =>
      plot.crop && plot.crop.deadAt === null
        ? { ...plot, crop: { ...plot.crop, wateredAt: now } }
        : plot
    ),
    now
  );
}

export function removePest(state: GameState, plotId: string): GameState {
  return touch(
    updatePlot(state, plotId, (plot) =>
      plot.crop
        ? { ...plot, crop: { ...plot.crop, pestAppearedAt: null } }
        : plot
    )
  );
}

export function clearDeadCrop(state: GameState, plotId: string): GameState {
  return touch(
    updatePlot(state, plotId, (plot) =>
      plot.crop?.deadAt !== null ? { ...plot, crop: null } : plot
    )
  );
}

export function harvestCrop(
  state: GameState,
  plotId: string,
  now: number = Date.now()
): GameState {
  const plot = getPlotOrThrow(state, plotId);
  if (!plot.crop) throw new Error("Plot has no crop");

  const crop = crops[plot.crop.cropId];
  const derived = getPlotDerivedState(plot, crop, now);
  if (!crop || !derived.canHarvest) throw new Error("Crop is not ready");

  const harvested = updatePlot(state, plotId, (current) => ({
    ...current,
    crop: null
  }));

  return touch(
    {
      ...harvested,
      player: {
        ...harvested.player,
        coins: harvested.player.coins + crop.sellPrice,
        xp: harvested.player.xp + crop.xpReward
      }
    },
    now
  );
}

export function buySeed(state: GameState, cropId: string): GameState {
  const crop = crops[cropId];
  if (!crop) throw new Error(`Unknown crop: ${cropId}`);
  if (!state.progression.unlockedCrops.includes(cropId)) throw new Error("Crop is not unlocked");
  if (state.player.coins < crop.seedPrice) throw new Error("Not enough coins");

  return touch({
    ...state,
    player: {
      ...state.player,
      coins: state.player.coins - crop.seedPrice
    },
    inventory: {
      seeds: {
        ...state.inventory.seeds,
        [cropId]: (state.inventory.seeds[cropId] ?? 0) + 1
      }
    }
  });
}

export function unlockPlot(state: GameState, plotId: string): GameState {
  const level = getLevelForXp(state.player.xp);
  const unlockedCount = state.farm.plots.filter((plot) => plot.unlocked).length;
  if (unlockedCount >= level.maxUnlockedPlots) throw new Error("No plot unlock available at this level");
  if (state.player.coins < plotUnlockCost) throw new Error("Not enough coins");

  return touch({
    ...updatePlot(state, plotId, (plot) => ({ ...plot, unlocked: true })),
    player: {
      ...state.player,
      coins: state.player.coins - plotUnlockCost
    }
  });
}

export function upgradeSoil(state: GameState, plotId: string): GameState {
  const level = getLevelForXp(state.player.xp);
  const plot = getPlotOrThrow(state, plotId);
  if (!plot.unlocked) throw new Error("Plot is locked");
  if (plot.soilLevel >= level.maxSoilLevel) throw new Error("Soil upgrade is locked");
  if (state.player.coins < soilUpgradeCost) throw new Error("Not enough coins");

  return touch({
    ...updatePlot(state, plotId, (current) => ({
      ...current,
      soilLevel: current.soilLevel + 1
    })),
    player: {
      ...state.player,
      coins: state.player.coins - soilUpgradeCost
    }
  });
}

export function tickGame(
  state: GameState,
  now: number = Date.now(),
  random: RandomSource = Math.random
): GameState {
  const level = getLevelForXp(state.player.xp);
  const plots = state.farm.plots.map((plot) => {
    const crop = plot.crop ? crops[plot.crop.cropId] : undefined;
    return tickPlotCare(plot, crop, now, random());
  });

  return touch(
    {
      ...state,
      player: {
        ...state.player,
        farmLevel: level.level
      },
      farm: {
        ...state.farm,
        plots
      },
      progression: {
        unlockedCrops: [...level.unlockedCrops]
      }
    },
    now
  );
}
```

- [ ] **Step 4: Verify Task 3**

Run:

```bash
npm test -- src/core/actions.test.ts src/core/growth.test.ts src/core/state.test.ts
npm run build
```

Expected: tests pass and build completes.

---

