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

  it("keeps plot actions out of tiles until a plot popup is active", () => {
    const root = document.createElement("div");
    const state = plantSeed(createInitialGameState(1_000), "plot-0-0", "carrot", 2_000);
    const viewModel = createViewModel(state, 3_000, "carrot");

    renderApp(root, viewModel);

    expect(root.querySelector(".iso-tile [data-action='water']")).toBeNull();
    expect(root.querySelector(".plot-popup")).toBeNull();

    renderApp(root, viewModel, { activePlotId: "plot-0-0", shopOpen: false });

    expect(root.querySelector(".iso-tile [data-action='water']")).toBeNull();
    expect(root.querySelector(".plot-popup [data-action='water']")).not.toBeNull();
    expect(root.querySelector(".plot-popup [data-action='upgrade-soil']")).not.toBeNull();
  });

  it("renders shop contents only when the shop popup is open", () => {
    const root = document.createElement("div");
    const viewModel = createViewModel(createInitialGameState(1_000), 1_000, "carrot");

    renderApp(root, viewModel);

    expect(root.querySelector(".sidebar [data-action='buy-seed']")).toBeNull();
    expect(root.querySelector(".shop-popup")).toBeNull();

    renderApp(root, viewModel, { activePlotId: null, shopOpen: true });

    expect(root.querySelector(".sidebar [data-action='buy-seed']")).toBeNull();
    expect(root.querySelector(".shop-popup [data-action='buy-seed']")).not.toBeNull();
    expect(root.querySelector(".shop-popup [data-action='select-seed']")).not.toBeNull();
  });
});
