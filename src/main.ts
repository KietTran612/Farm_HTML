import {
  buySeed,
  clearDeadCrop,
  harvestCrop,
  plantSeed,
  removePest,
  tickGame,
  unlockPlot,
  upgradeSoil,
  waterCrop
} from "./core/actions";
import { createInitialGameState } from "./core/state";
import { LocalStorageSaveRepository } from "./core/storage";
import type { GameState } from "./core/types";
import "./styles/main.scss";
import { renderApp } from "./ui/render";
import { createViewModel } from "./ui/viewModel";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root element");
}

const saveRepository = new LocalStorageSaveRepository();
let state: GameState = saveRepository.load() ?? createInitialGameState();
let selectedSeed = state.progression.unlockedCrops[0] ?? "carrot";
let activePlotId: string | null = null;
let shopOpen = false;

function render(): void {
  renderApp(app!, createViewModel(state, Date.now(), selectedSeed), { activePlotId, shopOpen });
}

function persistAndRender(): void {
  saveRepository.save(state);
  render();
}

function runAction(action: () => GameState): void {
  try {
    state = action();
    persistAndRender();
  } catch (error) {
    console.warn(error instanceof Error ? error.message : error);
  }
}

app.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const button = target.closest<HTMLButtonElement>("button[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const plotId = button.dataset.plotId;
  const cropId = button.dataset.cropId;

  if (action === "open-plot" && plotId) {
    activePlotId = plotId;
    shopOpen = false;
    render();
    return;
  }

  if (action === "open-shop") {
    activePlotId = null;
    shopOpen = true;
    render();
    return;
  }

  if (action === "close-popup") {
    activePlotId = null;
    shopOpen = false;
    render();
    return;
  }

  if (action === "select-seed" && cropId) {
    selectedSeed = cropId;
    render();
    return;
  }

  if (action === "buy-seed" && cropId) {
    runAction(() => buySeed(state, cropId));
    return;
  }

  if (action === "plant" && plotId) {
    runAction(() => plantSeed(state, plotId, selectedSeed));
    return;
  }

  if (action === "water" && plotId) {
    runAction(() => waterCrop(state, plotId));
    return;
  }

  if (action === "remove-pest" && plotId) {
    runAction(() => removePest(state, plotId));
    return;
  }

  if (action === "harvest" && plotId) {
    runAction(() => harvestCrop(state, plotId));
    return;
  }

  if (action === "clear-dead" && plotId) {
    runAction(() => clearDeadCrop(state, plotId));
    return;
  }

  if (action === "unlock-plot" && plotId) {
    runAction(() => unlockPlot(state, plotId));
    return;
  }

  if (action === "upgrade-soil" && plotId) {
    runAction(() => upgradeSoil(state, plotId));
    return;
  }
});

setInterval(() => {
  state = tickGame(state);
  saveRepository.save(state);
  render();
}, 1000);

render();
