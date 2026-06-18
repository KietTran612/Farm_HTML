import { getLevelForXp } from "../data/progression";
import type { FarmLayout, GameState, Plot } from "./types";

export const SCHEMA_VERSION = 1;

export function createPlots(layout: FarmLayout, unlockedCount: number): Plot[] {
  const plots: Plot[] = [];

  for (let row = 0; row < layout.rows; row += 1) {
    for (let column = 0; column < layout.columns; column += 1) {
      const index = row * layout.columns + column;
      plots.push({
        id: `plot-${row}-${column}`,
        row,
        column,
        unlocked: index < unlockedCount,
        soilLevel: 1,
        crop: null
      });
    }
  }

  return plots;
}

export function createInitialGameState(now: number = Date.now()): GameState {
  const level = getLevelForXp(0);
  const layout: FarmLayout = { rows: 3, columns: 3 };

  return {
    schemaVersion: SCHEMA_VERSION,
    player: {
      id: "local-player",
      coins: 25,
      xp: 0,
      farmLevel: level.level
    },
    farm: {
      layout,
      plots: createPlots(layout, level.maxUnlockedPlots)
    },
    inventory: {
      seeds: {
        carrot: 3
      }
    },
    progression: {
      unlockedCrops: [...level.unlockedCrops]
    },
    timestamps: {
      createdAt: now,
      updatedAt: now,
      lastSavedAt: now
    }
  };
}
