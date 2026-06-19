import type { AppViewModel, PlotViewModel } from "./viewModel";
import { renderCropArt } from "./crop-art/cropArt";

export type RenderUiState = {
  activePlotId: string | null;
  shopOpen: boolean;
};

function formatSeconds(ms: number): string {
  return `${Math.ceil(ms / 1000)}s`;
}

function plotContent(plot: PlotViewModel): string {
  if (!plot.unlocked) {
    return `
      <article class="iso-tile ${plot.tileClass} ${plot.zClass}">
        <button class="iso-tile__ground plot locked" data-action="open-plot" data-plot-id="${plot.id}">
          <span class="iso-tile__content">Mở ô</span>
        </button>
      </article>
    `;
  }

  if (!plot.cropId) {
    return `
      <article class="iso-tile ${plot.tileClass} ${plot.zClass}">
        <button class="iso-tile__ground plot empty" data-action="open-plot" data-plot-id="${plot.id}">
          <span class="iso-tile__content plot-summary">Đất trống</span>
        </button>
      </article>
    `;
  }

  const cropId = plot.cropId;
  const cropName = plot.cropName ?? plot.cropId;
  const growthState = plot.growthState;

  if (!growthState) {
    return "";
  }

  return `
    <article class="iso-tile ${plot.tileClass} ${plot.zClass}">
      <button class="iso-tile__ground plot planted" data-action="open-plot" data-plot-id="${plot.id}">
        <div class="iso-tile__crop">
          ${renderCropArt({
            instanceId: plot.id,
            cropId,
            cropName,
            growthState,
            soilLevel: plot.soilLevel,
            isDry: plot.isDry,
            hasPest: plot.hasPest,
            isDead: plot.isDead
          })}
        </div>
        <div class="iso-tile__content plot-summary">
          <strong>${plot.cropName}</strong>
          <span>${plot.growthState ?? ""}</span>
          <small>${plot.canHarvest ? "Sẵn sàng" : formatSeconds(plot.remainingGrowMs)}</small>
        </div>
      </button>
    </article>
  `;
}


function plotPopup(plot: PlotViewModel, selectedSeed: string): string {
  if (!plot.unlocked) {
    return `
      <section class="popup-card plot-popup" role="dialog" aria-modal="true" aria-labelledby="plot-popup-title">
        <header class="popup-card__header">
          <h2 id="plot-popup-title">Ô đất khóa</h2>
          <button class="popup-card__close" data-action="close-popup" aria-label="Đóng">×</button>
        </header>
        <p>Mở ô đất này để trồng thêm cây.</p>
        <button data-action="unlock-plot" data-plot-id="${plot.id}">Mở ô</button>
      </section>
    `;
  }

  if (!plot.cropId) {
    return `
      <section class="popup-card plot-popup" role="dialog" aria-modal="true" aria-labelledby="plot-popup-title">
        <header class="popup-card__header">
          <h2 id="plot-popup-title">Đất trống</h2>
          <button class="popup-card__close" data-action="close-popup" aria-label="Đóng">×</button>
        </header>
        <p>Đất cấp ${plot.soilLevel}</p>
        <div class="popup-actions">
          <button data-action="plant" data-plot-id="${plot.id}">Gieo ${selectedSeed}</button>
          <button data-action="upgrade-soil" data-plot-id="${plot.id}">Nâng đất (Lvl ${plot.soilLevel})</button>
        </div>
      </section>
    `;
  }

  return `
    <section class="popup-card plot-popup" role="dialog" aria-modal="true" aria-labelledby="plot-popup-title">
      <header class="popup-card__header">
        <h2 id="plot-popup-title">${plot.cropName}</h2>
        <button class="popup-card__close" data-action="close-popup" aria-label="Đóng">×</button>
      </header>
      <div class="plot-popup__status">
        <span>Giai đoạn: ${plot.growthState ?? ""}</span>
        <span>${plot.canHarvest ? "Sẵn sàng thu hoạch" : `Còn ${formatSeconds(plot.remainingGrowMs)}`}</span>
        <span>Đất cấp ${plot.soilLevel}</span>
      </div>
      <div class="popup-actions">
        <button data-action="water" data-plot-id="${plot.id}">Tưới</button>
        <button data-action="remove-pest" data-plot-id="${plot.id}" ${plot.hasPest ? "" : "disabled"}>Bắt sâu</button>
        <button data-action="harvest" data-plot-id="${plot.id}" ${plot.canHarvest ? "" : "disabled"}>Thu</button>
        <button data-action="clear-dead" data-plot-id="${plot.id}" ${plot.isDead ? "" : "disabled"}>Dọn</button>
        <button data-action="upgrade-soil" data-plot-id="${plot.id}">Nâng đất (Lvl ${plot.soilLevel})</button>
      </div>
    </section>
  `;
}

function shopPopup(viewModel: AppViewModel): string {
  return `
    <section class="popup-card shop-popup" role="dialog" aria-modal="true" aria-labelledby="shop-popup-title">
      <header class="popup-card__header">
        <h2 id="shop-popup-title">Hạt giống</h2>
        <button class="popup-card__close" data-action="close-popup" aria-label="Đóng">×</button>
      </header>
      <div class="shop-popup__seeds">
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
      </div>
      <section class="shop-popup__upgrades">
        <h3>Nâng cấp</h3>
        <p>Mở ô: ${viewModel.costs.plotUnlockCost} coin</p>
        <p>Nâng đất: ${viewModel.costs.soilUpgradeCost} coin</p>
      </section>
    </section>
  `;
}

function activePopup(viewModel: AppViewModel, uiState: RenderUiState): string {
  const activePlot = uiState.activePlotId
    ? viewModel.plots.find((plot) => plot.id === uiState.activePlotId)
    : undefined;

  if (!activePlot && !uiState.shopOpen) {
    return "";
  }

  return `
    <div class="popup-layer">
      ${activePlot ? plotPopup(activePlot, viewModel.selectedSeed) : ""}
      ${uiState.shopOpen ? shopPopup(viewModel) : ""}
    </div>
  `;
}

export function renderApp(
  root: HTMLElement,
  viewModel: AppViewModel,
  uiState: RenderUiState = { activePlotId: null, shopOpen: false }
): void {
  root.innerHTML = `
    <main class="app-shell">
      <header class="hud">
        <div><strong>Coin</strong><span>${viewModel.hud.coins}</span></div>
        <div><strong>Level</strong><span>${viewModel.hud.farmLevel}</span></div>
        <div><strong>XP</strong><span>${viewModel.hud.xp}${viewModel.hud.nextLevelXp ? ` / ${viewModel.hud.nextLevelXp}` : ""}</span></div>
      </header>

      <section class="game-layout">
        <section class="farm-board farm-board--isometric farm-board--cols-${viewModel.layout.columns}">
          ${viewModel.plots.map((plot) => plotContent(plot)).join("")}
        </section>

        <aside class="sidebar">
          <button class="shop-button" data-action="open-shop">Shop</button>
          <p>Hạt giống: ${viewModel.seedOptions.find((seed) => seed.cropId === viewModel.selectedSeed)?.name ?? viewModel.selectedSeed}</p>
          <p>Mở shop để mua hạt giống và xem chi phí nâng cấp.</p>
        </aside>
      </section>
      ${activePopup(viewModel, uiState)}
    </main>
  `;
}
