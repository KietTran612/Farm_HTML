import "./styles/animation-editor.scss";
import { ANIMATION_PRESETS, PIVOT_PRESETS, getDefaultPivotForPart, type PivotPoint } from "./animation-editor/animationPresets";
import { classifySvgPaths, type CropGroup } from "./animation-editor/groupClassifier";
import { mergeGroups, relabelGroup, serializeGroupedSvg, splitGroup, type SplitMode } from "./animation-editor/groupEditor";

interface StageAsset {
  stageId: string;
  sourceFile?: string;
  groupedFile?: string;
  sourceSvg?: string;
  groupedSvg?: string;
  activeSvg: string;
  activeFile: string;
  hasGroupedSvg: boolean;
}

interface CropListEntry {
  name: string;
}

interface CropStageAssetsResponse {
  cropName: string;
  stages: StageAsset[];
  animations: {
    stages?: Record<string, {
      parts?: Record<string, { animation: string; pivot?: PivotPoint }>;
    }>;
  };
}

let cropName = "";
let stages: StageAsset[] = [];
let activeStage: StageAsset | null = null;
let activeGroups: CropGroup[] = [];
let selectedGroupId = "";
let previewMode: "normal" | "overlay" | "solo" = "normal";
let isPreviewingAnimation = false;
let partAnimations: Record<string, string> = {};
let partPivots: Record<string, PivotPoint> = {};

document.addEventListener("DOMContentLoaded", () => {
  setupEvents();
  void initAnimationEditor();
});

function setupEvents() {
  const cropSelect = document.getElementById("animation-crop-select") as HTMLSelectElement | null;
  cropSelect?.addEventListener("change", () => {
    const nextCrop = cropSelect.value;
    if (!nextCrop || nextCrop === cropName) return;
    window.location.href = `/crop-animation-editor.html?crop=${encodeURIComponent(nextCrop)}`;
  });

  document.getElementById("auto-classify-btn")?.addEventListener("click", handleAutoClassify);
  document.getElementById("preview-animation-btn")?.addEventListener("click", handlePreviewAnimation);
  document.getElementById("save-animation-btn")?.addEventListener("click", () => void handleSave());
  document.getElementById("merge-groups-btn")?.addEventListener("click", handleMergeGroups);
  document.getElementById("split-left-right-btn")?.addEventListener("click", () => handleSplitGroup("left-right"));
  document.getElementById("split-top-bottom-btn")?.addEventListener("click", () => handleSplitGroup("top-bottom"));
  document.getElementById("split-color-btn")?.addEventListener("click", () => handleSplitGroup("fill-color"));

  document.querySelectorAll<HTMLButtonElement>(".mode-btn").forEach((button) => {
    button.addEventListener("click", () => {
      previewMode = (button.dataset.mode || "normal") as typeof previewMode;
      document.querySelectorAll(".mode-btn").forEach((entry) => entry.classList.toggle("is-active", entry === button));
      renderPreview();
    });
  });

  const animationSelect = document.getElementById("animation-preset-select") as HTMLSelectElement | null;
  animationSelect?.addEventListener("change", () => {
    if (!selectedGroupId) return;
    const group = activeGroups.find((entry) => entry.id === selectedGroupId);
    if (!group) return;
    partAnimations[group.label] = animationSelect.value;
    renderPreview();
    updateActionState();
  });

  const pivotPresetSelect = document.getElementById("pivot-preset-select") as HTMLSelectElement | null;
  pivotPresetSelect?.addEventListener("change", () => {
    if (!selectedGroupId) return;
    const group = activeGroups.find((entry) => entry.id === selectedGroupId);
    const preset = PIVOT_PRESETS.find((entry) => entry.id === pivotPresetSelect.value);
    if (!group || !preset || preset.id === "custom") return;

    partPivots[group.label] = { ...preset.pivot };
    renderPivotControls();
    renderPreview();
    updateActionState();
  });

  const pivotXInput = document.getElementById("pivot-x-input") as HTMLInputElement | null;
  const pivotYInput = document.getElementById("pivot-y-input") as HTMLInputElement | null;
  [pivotXInput, pivotYInput].forEach((input) => {
    input?.addEventListener("input", () => {
      const group = activeGroups.find((entry) => entry.id === selectedGroupId);
      if (!group || !pivotXInput || !pivotYInput) return;

      partPivots[group.label] = {
        x: clampPercent(Number(pivotXInput.value)),
        y: clampPercent(Number(pivotYInput.value))
      };
      const preset = document.getElementById("pivot-preset-select") as HTMLSelectElement | null;
      if (preset) preset.value = "custom";
      renderPreview();
      updateActionState();
    });
  });
}

async function initAnimationEditor() {
  const params = new URLSearchParams(window.location.search);
  cropName = params.get("crop") || "";

  if (!cropName) {
    renderMissingCrop();
    return;
  }

  setText("animation-title", `${cropName} Animation Editor`);
  setText("animation-subtitle", "Choose a saved stage, classify paths, edit groups, and preview per-part animation.");
  void populateCropSwitcher(cropName);
  setStatus("Loading stage assets...");

  try {
    const response = await fetch(`/api/editor/crop-stage-assets?crop=${encodeURIComponent(cropName)}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Could not load crop stage assets.");
    }

    const payload = await response.json() as CropStageAssetsResponse;
    stages = payload.stages;
    renderStageList();
    setStatus("Select a stage to begin.");

    const firstStage = stages.find((stage) => stage.activeSvg);
    if (firstStage) {
      selectStage(firstStage.stageId, payload);
    }
  } catch (error: any) {
    setStatus(`Error: ${error.message}`, true);
  }
}

async function populateCropSwitcher(selectedCrop: string) {
  const select = document.getElementById("animation-crop-select") as HTMLSelectElement | null;
  if (!select) return;

  try {
    const response = await fetch("/api/editor/crops");
    if (!response.ok) throw new Error("Could not load crop list.");

    const crops = await response.json() as CropListEntry[];
    const selectedValue = selectedCrop.toLowerCase();
    select.innerHTML = crops.map((crop) => {
      const value = crop.name.toLowerCase();
      return `<option value="${value}" ${value === selectedValue ? "selected" : ""}>${crop.name}</option>`;
    }).join("");
    select.disabled = crops.length === 0;
  } catch {
    select.innerHTML = `<option value="${selectedCrop}">${selectedCrop}</option>`;
    select.disabled = true;
  }
}

function renderMissingCrop() {
  const root = document.querySelector(".animation-app");
  if (!root) return;
  root.innerHTML = `
    <main class="animation-missing">
      <h1>Missing crop</h1>
      <p>Open this tool from the crop editor after selecting a crop.</p>
      <a class="btn btn-primary" href="/crop-editor.html">Back to Crop Editor</a>
    </main>
  `;
}

function renderStageList() {
  const container = document.getElementById("animation-stage-list");
  if (!container) return;

  if (stages.length === 0) {
    container.innerHTML = `<p class="animation-empty">No saved stage SVGs found for this crop.</p>`;
    return;
  }

  container.innerHTML = stages.map((stage) => `
    <button class="stage-card ${activeStage?.stageId === stage.stageId ? "is-active" : ""}" type="button" data-stage-id="${stage.stageId}" ${stage.activeSvg ? "" : "disabled"}>
      <span class="stage-card__name">${formatStageLabel(stage.stageId)}</span>
      <span class="stage-card__file">${stage.activeFile || "No SVG"}</span>
      ${stage.hasGroupedSvg ? `<span class="stage-card__badge">Grouped</span>` : ""}
    </button>
  `).join("");

  container.querySelectorAll<HTMLButtonElement>(".stage-card").forEach((button) => {
    button.addEventListener("click", () => selectStage(button.dataset.stageId || ""));
  });
}

function selectStage(stageId: string, payload?: CropStageAssetsResponse) {
  const stage = stages.find((entry) => entry.stageId === stageId);
  if (!stage) return;

  activeStage = stage;
  activeGroups = [];
  selectedGroupId = "";
  isPreviewingAnimation = false;
  partAnimations = payload?.animations.stages?.[stageId]?.parts
    ? Object.fromEntries(Object.entries(payload.animations.stages[stageId].parts || {}).map(([part, config]) => [part, config.animation]))
    : {};
  partPivots = payload?.animations.stages?.[stageId]?.parts
    ? Object.fromEntries(Object.entries(payload.animations.stages[stageId].parts || {}).map(([part, config]) => [part, config.pivot || getDefaultPivotForPart(part)]))
    : {};

  renderStageList();
  renderPreview();
  renderGroupList();
  renderAnimationSelect();
  renderPivotControls();
  updateActionState();
  setStatus(`${formatStageLabel(stage.stageId)} loaded from ${stage.activeFile}.`);
}

function handleAutoClassify() {
  if (!activeStage) return;
  const result = classifySvgPaths(activeStage.activeSvg, cropName);
  activeGroups = result.groups.map((group) => ({
    ...group,
    label: group.suggestedPart
  }));
  activeGroups.forEach((group) => {
    if (!partPivots[group.label]) {
      partPivots[group.label] = getDefaultPivotForPart(group.label);
    }
  });
  selectedGroupId = activeGroups[0]?.id || "";
  previewMode = "overlay";
  isPreviewingAnimation = false;
  syncModeButtons();
  renderPreview();
  renderGroupList();
  renderAnimationSelect();
  renderPivotControls();
  updateActionState();
  setStatus(`Classified ${activeGroups.length} groups for ${formatStageLabel(activeStage.stageId)}.`);
}

function handleMergeGroups() {
  const checked = getCheckedGroupIds();
  if (checked.length < 2) {
    setStatus("Select at least two groups to merge.", true);
    return;
  }
  const first = activeGroups.find((group) => group.id === checked[0]);
  const label = first?.label || "merged";
  activeGroups = mergeGroups(activeGroups, checked, label);
  partPivots[label] = partPivots[label] || getDefaultPivotForPart(label);
  selectedGroupId = activeGroups.find((group) => group.label === label)?.id || activeGroups[0]?.id || "";
  renderPreview();
  renderGroupList();
  renderAnimationSelect();
  renderPivotControls();
  updateActionState();
}

function handleSplitGroup(mode: SplitMode) {
  if (!selectedGroupId) return;
  activeGroups = splitGroup(activeGroups, selectedGroupId, mode);
  activeGroups.forEach((group) => {
    partPivots[group.label] = partPivots[group.label] || getDefaultPivotForPart(group.label);
  });
  selectedGroupId = activeGroups[0]?.id || "";
  renderPreview();
  renderGroupList();
  renderAnimationSelect();
  renderPivotControls();
  updateActionState();
}

function handlePreviewAnimation() {
  isPreviewingAnimation = !isPreviewingAnimation;
  renderPreview();
  setStatus(isPreviewingAnimation ? "Animation preview is running." : "Animation preview stopped.");
}

async function handleSave() {
  if (!activeStage || activeGroups.length === 0) return;
  const groupedSvg = serializeGroupedSvg(activeStage.activeSvg, activeGroups, cropName, activeStage.stageId);
  const parts = Object.fromEntries(
    activeGroups.map((group) => [group.label, {
      animation: partAnimations[group.label] || "none",
      pivot: partPivots[group.label] || getDefaultPivotForPart(group.label)
    }])
  );

  setStatus("Saving grouped SVG and animation metadata...");
  const response = await fetch("/api/editor/save-stage-animation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cropName,
      stageId: activeStage.stageId,
      groupedSvg,
      animationConfig: { parts }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    setStatus(`Save failed: ${error.error || "Unknown error"}`, true);
    return;
  }

  activeStage.groupedSvg = groupedSvg;
  activeStage.groupedFile = `${activeStage.stageId}.grouped.svg`;
  activeStage.activeSvg = groupedSvg;
  activeStage.activeFile = activeStage.groupedFile;
  activeStage.hasGroupedSvg = true;
  renderStageList();
  setStatus(`Saved ${activeStage.groupedFile}.`);
}

function renderPreview() {
  const preview = document.getElementById("svg-preview");
  if (!preview) return;

  preview.className = `crop-animation-preview mode-${previewMode}${isPreviewingAnimation ? " is-previewing-animation" : ""}`;
  if (!activeStage) {
    preview.innerHTML = `<p class="animation-empty">No stage selected.</p>`;
    return;
  }

  preview.innerHTML = activeGroups.length > 0
    ? serializeGroupedSvg(activeStage.activeSvg, activeGroups, cropName, activeStage.stageId)
    : activeStage.activeSvg;

  decoratePreviewGroups(preview);
}

function decoratePreviewGroups(preview: HTMLElement) {
  const selected = activeGroups.find((group) => group.id === selectedGroupId);
  for (const group of activeGroups) {
    const node = preview.querySelector<SVGGElement>(`[data-group-id="${cssEscape(group.id)}"]`);
    if (!node) continue;

    node.classList.toggle("is-selected-group", group.id === selectedGroupId);
    node.classList.toggle("is-hidden-group", group.hidden);
    node.classList.toggle("is-dimmed-group", previewMode === "solo" && Boolean(selected) && group.id !== selectedGroupId);

    const preset = ANIMATION_PRESETS.find((entry) => entry.id === (partAnimations[group.label] || "none"));
    if (preset?.cssClass) {
      node.classList.add(preset.cssClass);
    }

    const pivot = partPivots[group.label] || getDefaultPivotForPart(group.label);
    node.style.transformOrigin = `${pivot.x}% ${pivot.y}%`;
  }

  renderPivotMarker(preview);
}

function renderPivotMarker(preview: HTMLElement) {
  preview.querySelector(".pivot-marker")?.remove();
  const group = activeGroups.find((entry) => entry.id === selectedGroupId);
  const svg = preview.querySelector("svg");
  if (!group || !svg || previewMode === "normal") return;

  const pivot = partPivots[group.label] || getDefaultPivotForPart(group.label);
  const bounds = combineGroupBounds(group);
  const markerX = bounds.minX + ((bounds.maxX - bounds.minX) * pivot.x) / 100;
  const markerY = bounds.minY + ((bounds.maxY - bounds.minY) * pivot.y) / 100;
  const marker = document.createElementNS("http://www.w3.org/2000/svg", "g");
  marker.setAttribute("class", "pivot-marker");
  marker.setAttribute("transform", `translate(${markerX} ${markerY})`);
  marker.innerHTML = `
    <circle r="7" />
    <path d="M-14 0 H14 M0 -14 V14" />
  `;
  svg.appendChild(marker);
}

function renderGroupList() {
  const container = document.getElementById("group-list");
  if (!container) return;

  if (activeGroups.length === 0) {
    container.innerHTML = `<p class="animation-empty">Run Auto Classify to inspect groups.</p>`;
    return;
  }

  container.innerHTML = activeGroups.map((group) => `
    <article class="group-row ${group.id === selectedGroupId ? "is-active" : ""}" data-group-id="${group.id}">
      <div class="group-row__main">
        <label class="group-row__merge">
          <input type="checkbox" class="group-merge-check" value="${group.id}" />
        </label>
        <button class="group-row__select" type="button" data-action="select">
          <span class="group-row__label">${group.label}</span>
          <span class="group-row__meta">${group.paths.length} paths · ${group.colorFamily}</span>
        </button>
      </div>
      <div class="group-row__controls">
        <select class="form-control group-label-select" data-action="label">
          ${renderPartOptions(group.label)}
        </select>
        <button class="btn btn-secondary group-visibility-btn" type="button" data-action="visibility">${group.hidden ? "Show" : "Hide"}</button>
      </div>
    </article>
  `).join("");

  container.querySelectorAll<HTMLElement>(".group-row").forEach((row) => {
    const groupId = row.dataset.groupId || "";
    row.querySelector('[data-action="select"]')?.addEventListener("click", () => {
      selectedGroupId = groupId;
      renderPreview();
      renderGroupList();
      renderAnimationSelect();
      updateActionState();
    });

    row.querySelector<HTMLSelectElement>('[data-action="label"]')?.addEventListener("change", (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      const oldGroup = activeGroups.find((group) => group.id === groupId);
      activeGroups = relabelGroup(activeGroups, groupId, target.value);
      if (oldGroup) {
        partAnimations[target.value] = partAnimations[oldGroup.label] || "none";
        partPivots[target.value] = partPivots[oldGroup.label] || getDefaultPivotForPart(target.value);
      }
      selectedGroupId = groupId;
      renderPreview();
      renderGroupList();
      renderAnimationSelect();
      renderPivotControls();
      updateActionState();
    });

    row.querySelector('[data-action="visibility"]')?.addEventListener("click", () => {
      activeGroups = activeGroups.map((group) => group.id === groupId ? { ...group, hidden: !group.hidden } : group);
      renderPreview();
      renderGroupList();
    });
  });
}

function renderAnimationSelect() {
  const select = document.getElementById("animation-preset-select") as HTMLSelectElement | null;
  if (!select) return;

  const group = activeGroups.find((entry) => entry.id === selectedGroupId);
  select.innerHTML = ANIMATION_PRESETS.map((preset) => `<option value="${preset.id}">${preset.label}</option>`).join("");
  select.disabled = !group;
  select.value = group ? partAnimations[group.label] || "none" : "none";
}

function renderPivotControls() {
  const presetSelect = document.getElementById("pivot-preset-select") as HTMLSelectElement | null;
  const xInput = document.getElementById("pivot-x-input") as HTMLInputElement | null;
  const yInput = document.getElementById("pivot-y-input") as HTMLInputElement | null;
  if (!presetSelect || !xInput || !yInput) return;

  const group = activeGroups.find((entry) => entry.id === selectedGroupId);
  presetSelect.innerHTML = PIVOT_PRESETS.map((preset) => `<option value="${preset.id}">${preset.label}</option>`).join("");
  presetSelect.disabled = !group;
  xInput.disabled = !group;
  yInput.disabled = !group;

  if (!group) {
    xInput.value = "50";
    yInput.value = "100";
    presetSelect.value = "bottom-center";
    return;
  }

  const pivot = partPivots[group.label] || getDefaultPivotForPart(group.label);
  xInput.value = String(pivot.x);
  yInput.value = String(pivot.y);
  const matchingPreset = PIVOT_PRESETS.find((preset) => preset.pivot.x === pivot.x && preset.pivot.y === pivot.y);
  presetSelect.value = matchingPreset?.id || "custom";
}

function renderPartOptions(value: string): string {
  const parts = ["base", "stem", "leaves", "leaves-left", "leaves-right", "fruit", "ears", "tassels", "flower", "dead-leaf", "other"];
  const unique = Array.from(new Set([value, ...parts]));
  return unique.map((part) => `<option value="${part}" ${part === value ? "selected" : ""}>${part}</option>`).join("");
}

function updateActionState() {
  const hasStage = Boolean(activeStage);
  const hasGroups = activeGroups.length > 0;
  const hasSelected = Boolean(selectedGroupId);
  setDisabled("auto-classify-btn", !hasStage);
  setDisabled("preview-animation-btn", !hasGroups);
  setDisabled("save-animation-btn", !hasGroups);
  setDisabled("merge-groups-btn", !hasGroups);
  setDisabled("split-left-right-btn", !hasSelected);
  setDisabled("split-top-bottom-btn", !hasSelected);
  setDisabled("split-color-btn", !hasSelected);
  renderPivotControls();
}

function getCheckedGroupIds(): string[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>(".group-merge-check:checked")).map((input) => input.value);
}

function syncModeButtons() {
  document.querySelectorAll<HTMLButtonElement>(".mode-btn").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === previewMode);
  });
}

function setDisabled(id: string, disabled: boolean) {
  const button = document.getElementById(id) as HTMLButtonElement | null;
  if (button) button.disabled = disabled;
}

function setStatus(message: string, isError = false) {
  const status = document.getElementById("animation-status");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function setText(id: string, value: string) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function formatStageLabel(stageId: string): string {
  if (stageId.startsWith("stage")) return `Stage ${stageId.replace("stage", "")}`;
  return stageId.charAt(0).toUpperCase() + stageId.slice(1);
}

function cssEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 50;
  return Math.min(100, Math.max(0, value));
}

function combineGroupBounds(group: CropGroup) {
  return {
    minX: Math.min(...group.paths.map((path) => path.bounds.minX)),
    minY: Math.min(...group.paths.map((path) => path.bounds.minY)),
    maxX: Math.max(...group.paths.map((path) => path.bounds.maxX)),
    maxY: Math.max(...group.paths.map((path) => path.bounds.maxY))
  };
}
