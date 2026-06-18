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
const rice = crops.rice;

function plantedPlot(overrides: Partial<Plot["crop"]> = {}, cropId = "carrot"): Plot {
  return {
    id: "plot-0-0",
    row: 0,
    column: 0,
    unlocked: true,
    soilLevel: 1,
    crop: {
      cropId,
      plantedAt: 1_000_000_000,
      wateredAt: 1_000_000_000,
      pestAppearedAt: null,
      deadAt: null,
      growthPausedMs: 0,
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

    expect(derived.isDry).toBe(false);
    expect(derived.hasPest).toBe(false);
    expect(derived.isDead).toBe(true);
  });

  it("pauses growth while dry or pest-infested", () => {
    const dry = getPlotDerivedState(
      plantedPlot({ wateredAt: 1_000_000_000 }, "rice"),
      rice,
      1_000_451_000
    );
    expect(dry.remainingGrowMs).toBe(150_000);

    const infested = getPlotDerivedState(
      plantedPlot({ pestAppearedAt: 1_000_020_000 }),
      carrot,
      1_000_061_000
    );
    expect(infested.canHarvest).toBe(false);
    expect(infested.remainingGrowMs).toBe(40_000);
  });

  it("uses soil level to speed growth and extend water timeout", () => {
    const base = plantedPlot();
    const upgraded = { ...base, soilLevel: 2 };

    expect(getPlotDerivedState(base, carrot, 1_000_056_000).canHarvest).toBe(false);
    expect(getPlotDerivedState(upgraded, carrot, 1_000_056_000).canHarvest).toBe(true);
    expect(getPlotDerivedState(base, carrot, 1_000_181_000).isDead).toBe(true);
    expect(getPlotDerivedState(upgraded, carrot, 1_000_181_000).isDead).toBe(false);
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
    expect(shouldSpawnPest(plantedPlot({ deadAt: 1 }), carrot, 1_000_020_000, 0)).toBe(false);
    expect(shouldSpawnPest(plantedPlot({ pestAppearedAt: 1 }), carrot, 1_000_020_000, 0)).toBe(false);
  });
});
