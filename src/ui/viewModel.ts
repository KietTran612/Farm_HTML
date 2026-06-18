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
