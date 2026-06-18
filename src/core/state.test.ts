import { describe, expect, it } from "vitest";
import { createInitialGameState } from "./state";

describe("createInitialGameState", () => {
  it("creates a 3x3 farm layout without hard-coding logic to 9 elsewhere", () => {
    const state = createInitialGameState(1_700_000_000_000);

    expect(state.farm.layout).toEqual({ rows: 3, columns: 3 });
    expect(state.farm.plots).toHaveLength(9);
    expect(state.farm.plots[0]).toMatchObject({
      id: "plot-0-0",
      row: 0,
      column: 0,
      unlocked: true,
      soilLevel: 1,
      crop: null
    });
  });

  it("starts with carrot unlocked and later crops locked behind farm level", () => {
    const state = createInitialGameState(1_700_000_000_000);

    expect(state.player.farmLevel).toBe(1);
    expect(state.progression.unlockedCrops).toEqual(["carrot"]);
    expect(state.inventory.seeds).toEqual({ carrot: 3 });
  });
});
