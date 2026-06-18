import { crops } from "../data/crops";
import {
  getLevelForXp,
  plotUnlockCost,
  soilUpgradeCost
} from "../data/progression";
import { getDryStartAt, getPlotDerivedState, tickPlotCare } from "./growth";
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

function getCropForPlot(plot: Plot) {
  return plot.crop ? crops[plot.crop.cropId] : undefined;
}

function markDeadIfCareExpired(plot: Plot, now: number): Plot {
  if (!plot.crop || plot.crop.deadAt !== null) {
    return plot;
  }

  const crop = getCropForPlot(plot);
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

  return plot;
}

function pauseDryUntilNow(plot: Plot, now: number): Plot {
  const checked = markDeadIfCareExpired(plot, now);
  if (!checked.crop || checked.crop.deadAt !== null) {
    return checked;
  }

  const crop = getCropForPlot(checked);
  if (!crop) {
    return checked;
  }

  const dryStartAt = getDryStartAt(plot, crop);
  const dryPausedMs = now > dryStartAt ? now - dryStartAt : 0;
  if (dryPausedMs <= 0) {
    return checked;
  }

  return {
    ...checked,
    crop: {
      ...checked.crop,
      growthPausedMs: (checked.crop.growthPausedMs ?? 0) + dryPausedMs
    }
  };
}

function pausePestUntilNow(plot: Plot, now: number): Plot {
  const checked = markDeadIfCareExpired(plot, now);
  if (!checked.crop || checked.crop.deadAt !== null || checked.crop.pestAppearedAt === null) {
    return checked;
  }

  return {
    ...checked,
    crop: {
      ...checked.crop,
      growthPausedMs:
        (checked.crop.growthPausedMs ?? 0) + Math.max(0, now - checked.crop.pestAppearedAt)
    }
  };
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
      deadAt: null,
      growthPausedMs: 0
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
      (() => {
        const paused = pauseDryUntilNow(plot, now);
        return paused.crop && paused.crop.deadAt === null
          ? { ...paused, crop: { ...paused.crop, wateredAt: now } }
          : paused;
      })()
    ),
    now
  );
}

export function removePest(
  state: GameState,
  plotId: string,
  now: number = Date.now()
): GameState {
  return touch(
    updatePlot(state, plotId, (plot) =>
      (() => {
        const paused = pausePestUntilNow(plot, now);
        return paused.crop && paused.crop.deadAt === null
          ? { ...paused, crop: { ...paused.crop, pestAppearedAt: null } }
          : paused;
      })()
    ),
    now
  );
}

export function clearDeadCrop(
  state: GameState,
  plotId: string,
  now: number = Date.now()
): GameState {
  return touch(
    updatePlot(state, plotId, (plot) => {
      if (!plot.crop) {
        return plot;
      }
      const crop = getCropForPlot(plot);
      const derived = getPlotDerivedState(plot, crop, now);
      return plot.crop.deadAt !== null || derived.isDead ? { ...plot, crop: null } : plot;
    }),
    now
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
  if (getPlotOrThrow(state, plotId).unlocked) throw new Error("Plot is already unlocked");

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
