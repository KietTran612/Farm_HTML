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
      row: 0,
      column: 0,
      tileClass: "tile-r0-c0",
      zClass: "tile-z0",
      unlocked: true,
      cropId: "carrot",
      cropName: "Cà rốt",
      growthState: "seeded"
    });
  });
});
