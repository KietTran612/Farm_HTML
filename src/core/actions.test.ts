import { describe, expect, it } from "vitest";
import { createInitialGameState } from "./state";
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
import { getPlotDerivedState } from "./growth";
import { crops } from "../data/crops";

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
      deadAt: null,
      growthPausedMs: 0
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
    expect(removePest(infested, "plot-0-0", 4_000).farm.plots[0].crop?.pestAppearedAt).toBeNull();
  });

  it("does not double-count pest pause when watering an infested crop", () => {
    const planted = plantSeed(createInitialGameState(1_000_000_000), "plot-0-0", "carrot", 1_000_000_000);
    const infested = {
      ...planted,
      farm: {
        ...planted.farm,
        plots: planted.farm.plots.map((plot) =>
          plot.id === "plot-0-0" && plot.crop
            ? { ...plot, crop: { ...plot.crop, pestAppearedAt: 1_000_020_000 } }
            : plot
        )
      }
    };

    const watered = waterCrop(infested, "plot-0-0", 1_000_021_000);

    expect(watered.farm.plots[0].crop?.growthPausedMs).toBe(0);
    expect(watered.farm.plots[0].crop?.pestAppearedAt).toBe(1_000_020_000);
  });

  it("does not revive crops that have already exceeded care timeout", () => {
    const planted = plantSeed(createInitialGameState(1_000_000_000), "plot-0-0", "carrot", 1_000_000_000);

    const watered = waterCrop(planted, "plot-0-0", 1_000_181_000);
    expect(watered.farm.plots[0].crop?.deadAt).toBe(1_000_181_000);

    const infested = {
      ...planted,
      farm: {
        ...planted.farm,
        plots: planted.farm.plots.map((plot) =>
          plot.id === "plot-0-0" && plot.crop
            ? { ...plot, crop: { ...plot.crop, pestAppearedAt: 1_000_010_000 } }
            : plot
        )
      }
    };
    const cleared = removePest(infested, "plot-0-0", 1_000_191_000);
    expect(cleared.farm.plots[0].crop?.deadAt).toBe(1_000_191_000);
  });

  it("clears crops that are dead by derived timeout even before the next tick", () => {
    const planted = plantSeed(createInitialGameState(1_000_000_000), "plot-0-0", "carrot", 1_000_000_000);
    const cleared = clearDeadCrop(planted, "plot-0-0", 1_000_181_000);

    expect(cleared.farm.plots[0].crop).toBeNull();
  });

  it("pauses growth while dry and resumes after watering", () => {
    const start = {
      ...createInitialGameState(1_000_000_000),
      inventory: { seeds: { carrot: 3, rice: 1 } },
      progression: { unlockedCrops: ["carrot", "rice"] }
    };
    const planted = plantSeed(start, "plot-0-0", "rice", 1_000_000_000);
    const wateredAfterDry = waterCrop(planted, "plot-0-0", 1_000_451_000);

    expect(wateredAfterDry.farm.plots[0].crop?.growthPausedMs).toBe(1_000);

    const derived = getPlotDerivedState(
      wateredAfterDry.farm.plots[0],
      crops.rice,
      1_000_600_500
    );
    expect(derived.canHarvest).toBe(false);
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

  it("does not charge coins when trying to unlock an already unlocked plot", () => {
    const state = {
      ...createInitialGameState(1_000),
      player: { id: "local-player", coins: 100, xp: 40, farmLevel: 2 }
    };

    expect(() => unlockPlot(state, "plot-0-0")).toThrow("Plot is already unlocked");
  });

  it("soil level improves growth timing and water tolerance", () => {
    const base = plantSeed(createInitialGameState(1_000_000_000), "plot-0-0", "carrot", 1_000_000_000);
    const upgraded = {
      ...base,
      farm: {
        ...base.farm,
        plots: base.farm.plots.map((plot) =>
          plot.id === "plot-0-0" ? { ...plot, soilLevel: 2 } : plot
        )
      }
    };

    expect(getPlotDerivedState(base.farm.plots[0], crops.carrot, 1_000_056_000).canHarvest).toBe(false);
    expect(getPlotDerivedState(upgraded.farm.plots[0], crops.carrot, 1_000_056_000).canHarvest).toBe(true);
    expect(getPlotDerivedState(base.farm.plots[0], crops.carrot, 1_000_181_000).isDead).toBe(true);
    expect(getPlotDerivedState(upgraded.farm.plots[0], crops.carrot, 1_000_181_000).isDead).toBe(false);
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
});
