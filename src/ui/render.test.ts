import { describe, expect, it } from "vitest";
import { plantSeed } from "../core/actions";
import { createInitialGameState } from "../core/state";
import { renderApp } from "./render";
import { createViewModel } from "./viewModel";

describe("renderApp", () => {
  it("renders isometric board classes without inline style attributes", () => {
    const root = document.createElement("div");
    const state = plantSeed(createInitialGameState(1_000), "plot-0-0", "carrot", 2_000);

    renderApp(root, createViewModel(state, 3_000, "carrot"));

    expect(root.querySelector(".farm-board--isometric")).not.toBeNull();
    expect(root.querySelector(".tile-r0-c0.tile-z0")).not.toBeNull();
    expect(root.querySelector(".iso-tile__ground")).not.toBeNull();
    expect(root.querySelector(".iso-tile__crop .crop--carrot")).not.toBeNull();
    expect(root.querySelector("[style]")).toBeNull();
  });

  it("keeps locked tile label in a readable content layer", () => {
    const root = document.createElement("div");

    renderApp(root, createViewModel(createInitialGameState(1_000), 1_000, "carrot"));

    const lockedTile = root.querySelector(".plot.locked");
    expect(lockedTile?.querySelector(".iso-tile__content")).not.toBeNull();
  });
});
