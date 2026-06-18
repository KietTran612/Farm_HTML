import { beforeEach, describe, expect, it } from "vitest";
import { createInitialGameState } from "./state";
import { LocalStorageSaveRepository } from "./storage";

describe("LocalStorageSaveRepository", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and loads game state", () => {
    const repo = new LocalStorageSaveRepository("farm-test-save");
    const state = createInitialGameState(1_000);

    repo.save(state);

    const loaded = repo.load();
    expect(loaded?.schemaVersion).toBe(state.schemaVersion);
    expect(loaded?.player).toEqual(state.player);
    expect(loaded?.farm).toEqual(state.farm);
    expect(loaded?.inventory).toEqual(state.inventory);
    expect(loaded?.progression).toEqual(state.progression);
    expect(loaded?.timestamps.createdAt).toBe(1_000);
    expect(typeof loaded?.timestamps.lastSavedAt).toBe("number");
  });

  it("returns null for missing or invalid save data", () => {
    const repo = new LocalStorageSaveRepository("farm-test-save");
    expect(repo.load()).toBeNull();

    localStorage.setItem("farm-test-save", "{bad json");
    expect(repo.load()).toBeNull();
  });

  it("clears save data", () => {
    const repo = new LocalStorageSaveRepository("farm-test-save");
    repo.save(createInitialGameState(1_000));
    repo.clear();

    expect(repo.load()).toBeNull();
  });
});
