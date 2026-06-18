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
const SOIL_GROWTH_MULTIPLIER_BY_LEVEL: Record<number, number> = {
  1: 1,
  2: 0.9
};
const SOIL_WATER_TIMEOUT_MULTIPLIER_BY_LEVEL: Record<number, number> = {
  1: 1,
  2: 1.25
};

function getSoilGrowthMultiplier(soilLevel: number): number {
  return SOIL_GROWTH_MULTIPLIER_BY_LEVEL[soilLevel] ?? 1;
}

function getSoilWaterTimeoutMultiplier(soilLevel: number): number {
  return SOIL_WATER_TIMEOUT_MULTIPLIER_BY_LEVEL[soilLevel] ?? 1;
}

export function getEffectiveGrowDuration(crop: CropDefinition, soilLevel: number): number {
  return crop.growDuration * getSoilGrowthMultiplier(soilLevel);
}

export function getEffectiveWaterTimeout(crop: CropDefinition, soilLevel: number): number {
  return crop.waterTimeout * getSoilWaterTimeoutMultiplier(soilLevel);
}

export function getDryStartAt(plot: Plot, crop: CropDefinition): number {
  return (
    plot.crop?.wateredAt ??
    0
  ) + (getEffectiveWaterTimeout(crop, plot.soilLevel) * MS_PER_SECOND) / 2;
}

export function getWaterDeathAt(plot: Plot, crop: CropDefinition): number {
  return (
    plot.crop?.wateredAt ??
    0
  ) + getEffectiveWaterTimeout(crop, plot.soilLevel) * MS_PER_SECOND;
}

function getStoredPausedMs(plot: Plot): number {
  return plot.crop?.growthPausedMs ?? 0;
}

function getActivePauseMs(plot: Plot, crop: CropDefinition, now: number): number {
  if (!plot.crop || plot.crop.deadAt !== null) {
    return 0;
  }

  const dryStartAt = getDryStartAt(plot, crop);
  const dryPauseMs = now > dryStartAt ? now - dryStartAt : 0;
  const pestPauseMs =
    plot.crop.pestAppearedAt !== null ? Math.max(0, now - plot.crop.pestAppearedAt) : 0;

  return Math.max(dryPauseMs, pestPauseMs);
}

export function getTotalPausedMs(plot: Plot, crop: CropDefinition, now: number): number {
  return getStoredPausedMs(plot) + getActivePauseMs(plot, crop, now);
}

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

  const elapsedMs = Math.max(
    0,
    now - plot.crop.plantedAt - getTotalPausedMs(plot, crop, now)
  );
  const progress = elapsedMs / (getEffectiveGrowDuration(crop, plot.soilLevel) * MS_PER_SECOND);

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

  const dryStartAt = getDryStartAt(plot, crop);
  const waterDeathAt = getWaterDeathAt(plot, crop);
  const pestDeadline =
    plot.crop.pestAppearedAt === null
      ? Number.POSITIVE_INFINITY
      : plot.crop.pestAppearedAt + crop.pestTimeout * MS_PER_SECOND;
  const isDead = plot.crop.deadAt !== null || now > waterDeathAt || now > pestDeadline;
  const growthState = isDead ? "dead" : getCropGrowthState(plot, crop, now);
  const harvestAt =
    plot.crop.plantedAt +
    getEffectiveGrowDuration(crop, plot.soilLevel) * MS_PER_SECOND +
    getTotalPausedMs(plot, crop, now);

  return {
    growthState,
    isDry: !isDead && now > dryStartAt,
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
