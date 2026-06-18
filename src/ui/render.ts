import type { AppViewModel, PlotViewModel } from "./viewModel";

function formatSeconds(ms: number): string {
  return `${Math.ceil(ms / 1000)}s`;
}

function plotContent(plot: PlotViewModel, selectedSeed: string): string {
  if (!plot.unlocked) {
    return `<button class="plot locked" data-action="unlock-plot" data-plot-id="${plot.id}">Mở ô</button>`;
  }

  if (!plot.cropId) {
    return `
      <div class="plot empty">
        <button data-action="plant" data-plot-id="${plot.id}">Gieo ${selectedSeed}</button>
        <button data-action="upgrade-soil" data-plot-id="${plot.id}">Nâng đất (Lvl ${plot.soilLevel})</button>
      </div>
    `;
  }

  const classes = [
    "crop",
    plot.cropClass ?? "",
    plot.templateClass ?? "",
    plot.growthState ? `state-${plot.growthState}` : "",
    plot.isDry ? "is-dry" : "",
    plot.hasPest ? "has-pest" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <div class="plot planted">
      <div class="${classes}"></div>
      <strong>${plot.cropName}</strong>
      <span>${plot.growthState ?? ""}</span>
      <small>${plot.canHarvest ? "Sẵn sàng" : formatSeconds(plot.remainingGrowMs)}</small>
      <div class="plot-actions">
        <button data-action="water" data-plot-id="${plot.id}">Tưới</button>
        <button data-action="remove-pest" data-plot-id="${plot.id}" ${plot.hasPest ? "" : "disabled"}>Bắt sâu</button>
        <button data-action="harvest" data-plot-id="${plot.id}" ${plot.canHarvest ? "" : "disabled"}>Thu</button>
        <button data-action="clear-dead" data-plot-id="${plot.id}" ${plot.isDead ? "" : "disabled"}>Dọn</button>
        <button data-action="upgrade-soil" data-plot-id="${plot.id}">Nâng đất (Lvl ${plot.soilLevel})</button>
      </div>
    </div>
  `;
}

export function renderApp(root: HTMLElement, viewModel: AppViewModel): void {
  root.innerHTML = `
    <main class="app-shell">
      <header class="hud">
        <div><strong>Coin</strong><span>${viewModel.hud.coins}</span></div>
        <div><strong>Level</strong><span>${viewModel.hud.farmLevel}</span></div>
        <div><strong>XP</strong><span>${viewModel.hud.xp}${viewModel.hud.nextLevelXp ? ` / ${viewModel.hud.nextLevelXp}` : ""}</span></div>
      </header>

      <section class="game-layout">
        <section class="farm-board farm-board--cols-${viewModel.layout.columns}">
          ${viewModel.plots.map((plot) => plotContent(plot, viewModel.selectedSeed)).join("")}
        </section>

        <aside class="sidebar">
          <section>
            <h2>Hạt giống</h2>
            ${viewModel.seedOptions
              .map(
                (seed) => `
                  <div class="seed-option-row">
                    <button class="seed-option ${seed.cropId === viewModel.selectedSeed ? "selected" : ""}"
                      data-action="select-seed"
                      data-crop-id="${seed.cropId}"
                      ${seed.unlocked ? "" : "disabled"}>
                      ${seed.name} (${seed.owned})
                    </button>
                    <button data-action="buy-seed" data-crop-id="${seed.cropId}" ${seed.unlocked ? "" : "disabled"}>
                      Mua (${seed.seedPrice} coin)
                    </button>
                  </div>
                `
              )
              .join("")}
          </section>

          <section>
            <h2>Nâng cấp</h2>
            <p>Mở ô: ${viewModel.costs.plotUnlockCost} coin</p>
            <p>Nâng đất: ${viewModel.costs.soilUpgradeCost} coin</p>
          </section>
        </aside>
      </section>
    </main>
  `;
}
