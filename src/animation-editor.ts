import "./styles/animation-editor.scss";
import { ANIMATION_PRESETS, PIVOT_PRESETS, getDefaultPivotForPart, type PivotPoint } from "./animation-editor/animationPresets";
import { classifySvgPaths, parseSvgPathBounds, type CropGroup, type ClassifiedPath } from "./animation-editor/groupClassifier";
import { mergeGroups, relabelGroup, serializeGroupedSvg, splitGroup, isIntersecting, type SplitMode } from "./animation-editor/groupEditor";

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

let selectedPathIndices = new Set<number>();
interface CachedPathBBox {
  pathIndex: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}
let cachedPathBBoxes: CachedPathBBox[] = [];
let activeTool: "rect" | "brush" | "lasso" = "rect";
let lassoPoints: { x: number; y: number }[] = [];

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
    partAnimations[group.id] = animationSelect.value;
    renderPreview();
    updateActionState();
  });

  const pivotPresetSelect = document.getElementById("pivot-preset-select") as HTMLSelectElement | null;
  pivotPresetSelect?.addEventListener("change", () => {
    if (!selectedGroupId) return;
    const group = activeGroups.find((entry) => entry.id === selectedGroupId);
    const preset = PIVOT_PRESETS.find((entry) => entry.id === pivotPresetSelect.value);
    if (!group || !preset || preset.id === "custom") return;

    partPivots[group.id] = { ...preset.pivot };
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

      partPivots[group.id] = {
        x: clampPercent(Number(pivotXInput.value)),
        y: clampPercent(Number(pivotYInput.value))
      };
      const preset = document.getElementById("pivot-preset-select") as HTMLSelectElement | null;
      if (preset) preset.value = "custom";
      renderPreview();
      updateActionState();
    });
  });

  document.getElementById("create-group-btn")?.addEventListener("click", handleCreateGroupFromSelection);
  document.getElementById("remove-from-group-btn")?.addEventListener("click", handleRemoveSelectionFromGroup);

  const toolRectBtn = document.getElementById("tool-rect-btn") as HTMLButtonElement | null;
  const toolBrushBtn = document.getElementById("tool-brush-btn") as HTMLButtonElement | null;
  const toolLassoBtn = document.getElementById("tool-lasso-btn") as HTMLButtonElement | null;
  [toolRectBtn, toolBrushBtn, toolLassoBtn].forEach((btn) => {
    btn?.addEventListener("click", () => {
      activeTool = (btn.dataset.tool || "rect") as typeof activeTool;
      toolRectBtn?.classList.toggle("is-active", activeTool === "rect");
      toolBrushBtn?.classList.toggle("is-active", activeTool === "brush");
      toolLassoBtn?.classList.toggle("is-active", activeTool === "lasso");
      // Clear any leftover selection box UI or lasso overlays
      const preview = document.getElementById("svg-preview");
      preview?.querySelector(".selection-box")?.remove();
      preview?.querySelector(".lasso-preview")?.remove();
    });
  });

  setupDragSelection();
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
  selectedPathIndices.clear();
  isPreviewingAnimation = false;

  // 1. Group Restoring (load existing grouped SVG & legacy fallback)
  const parser = new DOMParser();
  const doc = parser.parseFromString(stage.activeSvg, "image/svg+xml");
  const allPathsInDoc = Array.from(doc.querySelectorAll("path"));
  const groupElements = Array.from(doc.querySelectorAll("g[data-group-id]"));

  if (groupElements.length > 0) {
    activeGroups = groupElements.map((gEl) => {
      const groupId = gEl.getAttribute("data-group-id") || "";
      const classAttr = gEl.getAttribute("class") || "";
      const labelMatch = classAttr.match(/\bcrop-part--([a-zA-Z0-9_-]+)/);
      const label = labelMatch ? labelMatch[1] : "other";

      const pathElements = Array.from(gEl.querySelectorAll("path"));
      const paths = pathElements.map((pathEl) => {
        const index = allPathsInDoc.indexOf(pathEl);
        const dataIndexAttr = pathEl.getAttribute("data-original-index");
        const pathIndex = dataIndexAttr ? Number(dataIndexAttr) : index;

        const markup = pathEl.outerHTML;
        const fill = pathEl.getAttribute("fill") || "unknown";
        
        const transformAttr = pathEl.getAttribute("transform") || "";
        const translateMatch = transformAttr.match(/translate\(\s*(-?\d+(?:\.\d+)?)(?:[\s,]+(-?\d+(?:\.\d+)?))?\s*\)/i);
        const tx = translateMatch ? Number(translateMatch[1]) : 0;
        const ty = translateMatch && translateMatch[2] ? Number(translateMatch[2]) : 0;
        const d = pathEl.getAttribute("d") || "";
        const bounds = parseSvgPathBounds(d, tx, ty);

        return {
          id: `path-${pathIndex}`,
          markup,
          fill,
          colorFamily: "unknown" as any,
          pathIndex,
          bounds,
          center: {
            x: (bounds.minX + bounds.maxX) / 2,
            y: (bounds.minY + bounds.maxY) / 2
          }
        };
      });

      return {
        id: groupId,
        label,
        suggestedPart: label,
        colorFamily: "unknown" as any,
        regionX: "center" as any,
        regionY: "middle" as any,
        hidden: false,
        paths
      };
    });

    const groupedPathIndices = new Set(activeGroups.flatMap(g => g.paths.map(p => p.pathIndex)));
    const unassignedPathElements = allPathsInDoc.filter(pathEl => {
      const index = allPathsInDoc.indexOf(pathEl);
      const dataIndexAttr = pathEl.getAttribute("data-original-index");
      const pathIndex = dataIndexAttr ? Number(dataIndexAttr) : index;
      return !groupedPathIndices.has(pathIndex);
    });

    if (unassignedPathElements.length > 0) {
      const unassignedPaths = unassignedPathElements.map((pathEl) => {
        const index = allPathsInDoc.indexOf(pathEl);
        const dataIndexAttr = pathEl.getAttribute("data-original-index");
        const pathIndex = dataIndexAttr ? Number(dataIndexAttr) : index;
        const markup = pathEl.outerHTML;
        const fill = pathEl.getAttribute("fill") || "unknown";
        const d = pathEl.getAttribute("d") || "";
        const transformAttr = pathEl.getAttribute("transform") || "";
        const translateMatch = transformAttr.match(/translate\(\s*(-?\d+(?:\.\d+)?)(?:[\s,]+(-?\d+(?:\.\d+)?))?\s*\)/i);
        const tx = translateMatch ? Number(translateMatch[1]) : 0;
        const ty = translateMatch && translateMatch[2] ? Number(translateMatch[2]) : 0;
        const bounds = parseSvgPathBounds(d, tx, ty);

        return {
          id: `path-${pathIndex}`,
          markup,
          fill,
          colorFamily: "unknown" as any,
          pathIndex,
          bounds,
          center: {
            x: (bounds.minX + bounds.maxX) / 2,
            y: (bounds.minY + bounds.maxY) / 2
          }
        };
      });

      activeGroups.push({
        id: "group-unassigned",
        label: "other",
        suggestedPart: "other",
        colorFamily: "unknown" as any,
        regionX: "center" as any,
        regionY: "middle" as any,
        hidden: false,
        paths: unassignedPaths
      });
    }
  } else {
    // Raw SVG load - all to unassigned fallback
    const unassignedPaths = allPathsInDoc.map((pathEl, index) => {
      const markup = pathEl.outerHTML;
      const fill = pathEl.getAttribute("fill") || "unknown";
      const d = pathEl.getAttribute("d") || "";
      const transformAttr = pathEl.getAttribute("transform") || "";
      const translateMatch = transformAttr.match(/translate\(\s*(-?\d+(?:\.\d+)?)(?:[\s,]+(-?\d+(?:\.\d+)?))?\s*\)/i);
      const tx = translateMatch ? Number(translateMatch[1]) : 0;
      const ty = translateMatch && translateMatch[2] ? Number(translateMatch[2]) : 0;
      const bounds = parseSvgPathBounds(d, tx, ty);

      return {
        id: `path-${index}`,
        markup,
        fill,
        colorFamily: "unknown" as any,
        pathIndex: index,
        bounds,
        center: {
          x: (bounds.minX + bounds.maxX) / 2,
          y: (bounds.minY + bounds.maxY) / 2
        }
      };
    });

    activeGroups = [{
      id: "group-unassigned",
      label: "other",
      suggestedPart: "other",
      colorFamily: "unknown" as any,
      regionX: "center" as any,
      regionY: "middle" as any,
      hidden: false,
      paths: unassignedPaths
    }];
  }

  // 2. Metadata Migration / Load Config Compatibility
  const stageParts = payload?.animations.stages?.[stageId]?.parts || {};
  partAnimations = {};
  partPivots = {};

  activeGroups.forEach((group) => {
    let config = stageParts[group.id];
    if (!config) {
      config = stageParts[group.label];
    }
    partAnimations[group.id] = config?.animation || "none";
    partPivots[group.id] = config?.pivot || getDefaultPivotForPart(group.label);
  });

  renderStageList();
  renderPreview();
  renderGroupList();
  renderAnimationSelect();
  renderPivotControls();
  updateSelectionVisuals();
  updateActionState();
  setStatus(`${formatStageLabel(stage.stageId)} loaded.`);
}

function handleAutoClassify() {
  if (!activeStage) return;
  const result = classifySvgPaths(activeStage.activeSvg, cropName);
  activeGroups = result.groups.map((group) => ({
    ...group,
    label: group.suggestedPart
  }));
  activeGroups.forEach((group) => {
    if (!partPivots[group.id]) {
      partPivots[group.id] = getDefaultPivotForPart(group.label);
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
  updateSelectionVisuals();
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
  const mergedId = `group-${label}-${Date.now()}`;
  activeGroups = mergeGroups(activeGroups, checked, label);
  activeGroups.forEach((g) => {
    if (g.label === label && g.id.startsWith("merged-")) {
      g.id = mergedId;
    }
  });
  partPivots[mergedId] = partPivots[mergedId] || getDefaultPivotForPart(label);
  selectedGroupId = mergedId;
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
    partPivots[group.id] = partPivots[group.id] || getDefaultPivotForPart(group.label);
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
    activeGroups.map((group) => [group.id, {
      label: group.label,
      animation: partAnimations[group.id] || "none",
      pivot: partPivots[group.id] || getDefaultPivotForPart(group.label)
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

  cachePathBBoxes();
  decoratePreviewGroups(preview);
  updateSelectionVisuals();
}

function decoratePreviewGroups(preview: HTMLElement) {
  const selected = activeGroups.find((group) => group.id === selectedGroupId);
  for (const group of activeGroups) {
    const node = preview.querySelector<SVGGElement>(`[data-group-id="${cssEscape(group.id)}"]`);
    if (!node) continue;

    node.classList.toggle("is-selected-group", group.id === selectedGroupId);
    node.classList.toggle("is-hidden-group", group.hidden);
    node.classList.toggle("is-dimmed-group", previewMode === "solo" && Boolean(selected) && group.id !== selectedGroupId);

    const preset = ANIMATION_PRESETS.find((entry) => entry.id === (partAnimations[group.id] || "none"));
    if (preset?.cssClass) {
      node.classList.add(preset.cssClass);
    }

    const pivot = partPivots[group.id] || getDefaultPivotForPart(group.label);
    node.style.transformOrigin = `${pivot.x}% ${pivot.y}%`;
  }

  renderPivotMarker(preview);
}

function renderPivotMarker(preview: HTMLElement) {
  preview.querySelector(".pivot-marker")?.remove();
  const group = activeGroups.find((entry) => entry.id === selectedGroupId);
  const svg = preview.querySelector("svg");
  if (!group || !svg || previewMode === "normal") return;

  const pivot = partPivots[group.id] || getDefaultPivotForPart(group.label);
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
    container.innerHTML = `<p class="animation-empty">Run Suggest Candidates to inspect groups.</p>`;
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
        const oldDefault = getDefaultPivotForPart(oldGroup.label);
        const currentPivot = partPivots[oldGroup.id];
        if (currentPivot && currentPivot.x === oldDefault.x && currentPivot.y === oldDefault.y) {
          partPivots[oldGroup.id] = getDefaultPivotForPart(target.value);
        }
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
  select.value = group ? partAnimations[group.id] || "none" : "none";
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

  const pivot = partPivots[group.id] || getDefaultPivotForPart(group.label);
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

function cachePathBBoxes() {
  cachedPathBBoxes = [];
  const preview = document.getElementById("svg-preview");
  if (!preview) return;

  const svg = preview.querySelector("svg");
  if (!svg) return;

  const paths = Array.from(svg.querySelectorAll("path"));
  paths.forEach((pathEl) => {
    const dataIndexAttr = pathEl.getAttribute("data-original-index");
    const pathIndex = dataIndexAttr ? Number(dataIndexAttr) : paths.indexOf(pathEl);

    try {
      // Browser DOM layout CTM + BBox is the true geometry source of truth
      const bbox = pathEl.getBBox();
      const ctm = pathEl.getCTM();

      if (ctm) {
        const p1 = svg.createSVGPoint(); p1.x = bbox.x; p1.y = bbox.y;
        const p2 = svg.createSVGPoint(); p2.x = bbox.x + bbox.width; p2.y = bbox.y;
        const p3 = svg.createSVGPoint(); p3.x = bbox.x; p3.y = bbox.y + bbox.height;
        const p4 = svg.createSVGPoint(); p4.x = bbox.x + bbox.width; p4.y = bbox.y + bbox.height;

        const tp1 = p1.matrixTransform(ctm);
        const tp2 = p2.matrixTransform(ctm);
        const tp3 = p3.matrixTransform(ctm);
        const tp4 = p4.matrixTransform(ctm);

        const xs = [tp1.x, tp2.x, tp3.x, tp4.x];
        const ys = [tp1.y, tp2.y, tp3.y, tp4.y];

        const bounds = {
          minX: Math.min(...xs),
          minY: Math.min(...ys),
          maxX: Math.max(...xs),
          maxY: Math.max(...ys)
        };

        cachedPathBBoxes.push({ pathIndex, bounds });
        updatePathBoundsInActiveGroups(pathIndex, bounds);
      } else {
        throw new Error("CTM not available");
      }
    } catch (e) {
      // Test environment fallback using parseSvgPathBounds
      const d = pathEl.getAttribute("d") || "";
      const transform = pathEl.getAttribute("transform") || "";
      const translateMatch = transform.match(/translate\(\s*(-?\d+(?:\.\d+)?)(?:[\s,]+(-?\d+(?:\.\d+)?))?\s*\)/i);
      const tx = translateMatch ? Number(translateMatch[1]) : 0;
      const ty = translateMatch && translateMatch[2] ? Number(translateMatch[2]) : 0;
      const bounds = parseSvgPathBounds(d, tx, ty);
      
      cachedPathBBoxes.push({ pathIndex, bounds });
      updatePathBoundsInActiveGroups(pathIndex, bounds);
    }
  });
}

function updatePathBoundsInActiveGroups(pathIndex: number, bounds: { minX: number; minY: number; maxX: number; maxY: number }) {
  activeGroups.forEach((group) => {
    const path = group.paths.find((p) => p.pathIndex === pathIndex);
    if (path) {
      path.bounds = bounds;
      path.center = {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2
      };
    }
  });
}

function updateSelectionVisuals() {
  const preview = document.getElementById("svg-preview");
  if (!preview) return;

  const svg = preview.querySelector("svg");
  if (!svg) return;

  const paths = Array.from(svg.querySelectorAll("path"));
  paths.forEach((pathEl) => {
    const dataIndexAttr = pathEl.getAttribute("data-original-index");
    const pathIndex = dataIndexAttr ? Number(dataIndexAttr) : paths.indexOf(pathEl);
    
    pathEl.classList.toggle("is-selected-path", selectedPathIndices.has(pathIndex));
  });

  const status = document.getElementById("selection-status");
  if (status) {
    status.textContent = `Selected: ${selectedPathIndices.size} paths`;
  }

  const createGroupBtn = document.getElementById("create-group-btn") as HTMLButtonElement | null;
  const removeFromGroupBtn = document.getElementById("remove-from-group-btn") as HTMLButtonElement | null;
  if (createGroupBtn) createGroupBtn.disabled = selectedPathIndices.size === 0;
  if (removeFromGroupBtn) removeFromGroupBtn.disabled = selectedPathIndices.size === 0;
}

function getSvgCoordinates(clientX: number, clientY: number, svg: SVGSVGElement): { x: number; y: number } {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const transformed = pt.matrixTransform(svg.getScreenCTM()!.inverse());
  return { x: transformed.x, y: transformed.y };
}

function handleCreateGroupFromSelection() {
  if (selectedPathIndices.size === 0) return;

  const labelSelect = document.getElementById("selection-label-select") as HTMLSelectElement | null;
  const label = labelSelect?.value || "other";
  const groupId = `group-${label}-${Date.now()}`;

  const pathsToGroup: ClassifiedPath[] = [];
  
  for (const pathIndex of selectedPathIndices) {
    let foundPath: ClassifiedPath | null = null;
    for (const group of activeGroups) {
      const p = group.paths.find((item) => item.pathIndex === pathIndex);
      if (p) {
        foundPath = p;
        group.paths = group.paths.filter((item) => item.pathIndex !== pathIndex);
        break;
      }
    }
    if (foundPath) {
      pathsToGroup.push(foundPath);
    }
  }

  activeGroups = activeGroups.filter((g) => g.paths.length > 0);

  activeGroups.push({
    id: groupId,
    label,
    suggestedPart: label,
    colorFamily: "unknown" as any,
    regionX: "center",
    regionY: "middle",
    hidden: false,
    paths: pathsToGroup.sort((a, b) => a.pathIndex - b.pathIndex)
  });

  partAnimations[groupId] = "none";
  partPivots[groupId] = getDefaultPivotForPart(label);

  selectedPathIndices.clear();
  renderPreview();
  renderGroupList();
  updateSelectionVisuals();
  updateActionState();
  setStatus(`Created group ${label} with ${pathsToGroup.length} paths.`);
}

function handleRemoveSelectionFromGroup() {
  if (selectedPathIndices.size === 0) return;

  let unassignedGroup = activeGroups.find((g) => g.id === "group-unassigned");
  if (!unassignedGroup) {
    unassignedGroup = {
      id: "group-unassigned",
      label: "other",
      suggestedPart: "other",
      colorFamily: "unknown" as any,
      regionX: "center",
      regionY: "middle",
      hidden: false,
      paths: []
    };
    activeGroups.push(unassignedGroup);
  }

  for (const pathIndex of selectedPathIndices) {
    let foundPath: ClassifiedPath | null = null;
    for (const group of activeGroups) {
      if (group.id === "group-unassigned") continue;
      const p = group.paths.find((item) => item.pathIndex === pathIndex);
      if (p) {
        foundPath = p;
        group.paths = group.paths.filter((item) => item.pathIndex !== pathIndex);
        break;
      }
    }

    if (foundPath) {
      if (!unassignedGroup.paths.some((item) => item.pathIndex === pathIndex)) {
        unassignedGroup.paths.push(foundPath);
      }
    }
  }

  activeGroups = activeGroups.filter((g) => g.paths.length > 0);
  
  if (unassignedGroup) {
    unassignedGroup.paths.sort((a, b) => a.pathIndex - b.pathIndex);
  }

  selectedPathIndices.clear();
  renderPreview();
  renderGroupList();
  updateSelectionVisuals();
  updateActionState();
  setStatus(`Removed selected paths from custom groups.`);
}

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

function setupDragSelection() {
  const preview = document.getElementById("svg-preview");
  if (!preview) return;

  preview.addEventListener("mousedown", (evt) => {
    if (evt.button !== 0) return;

    if ((evt.target as HTMLElement).closest(".segmented-control") || (evt.target as HTMLElement).closest("button") || (evt.target as HTMLElement).closest("select") || (evt.target as HTMLElement).closest("input")) {
      return;
    }

    const svg = preview.querySelector("svg");
    if (!svg) return;

    evt.preventDefault();
    isDragging = true;
    dragStartX = evt.clientX;
    dragStartY = evt.clientY;

    if (activeTool === "rect") {
      preview.querySelector(".selection-box")?.remove();

      const box = document.createElement("div");
      box.className = "selection-box";
      const previewRect = preview.getBoundingClientRect();
      box.style.left = `${evt.clientX - previewRect.left}px`;
      box.style.top = `${evt.clientY - previewRect.top}px`;
      box.style.width = "0px";
      box.style.height = "0px";
      preview.appendChild(box);
    } else if (activeTool === "brush") {
      // Paint select tool
      if (!evt.shiftKey && !evt.altKey && !evt.ctrlKey) {
        selectedPathIndices.clear();
      }
      paintSelectAtPoint(evt.clientX, evt.clientY, evt.altKey || evt.ctrlKey);
    } else if (activeTool === "lasso") {
      lassoPoints = [];
      const coords = getSvgCoordinates(evt.clientX, evt.clientY, svg);
      lassoPoints.push(coords);

      svg.querySelector(".lasso-preview")?.remove();
      const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      polygon.setAttribute("class", "lasso-preview");
      polygon.setAttribute("points", `${coords.x},${coords.y}`);
      svg.appendChild(polygon);
    }
  });

  window.addEventListener("mousemove", (evt) => {
    if (!isDragging) return;

    const preview = document.getElementById("svg-preview");
    if (!preview) return;

    if (activeTool === "rect") {
      const box = preview.querySelector(".selection-box") as HTMLElement | null;
      if (!box) return;

      const previewRect = preview.getBoundingClientRect();
      const currentX = evt.clientX;
      const currentY = evt.clientY;

      const left = Math.min(dragStartX, currentX) - previewRect.left;
      const top = Math.min(dragStartY, currentY) - previewRect.top;
      const width = Math.abs(dragStartX - currentX);
      const height = Math.abs(dragStartY - currentY);

      box.style.left = `${left}px`;
      box.style.top = `${top}px`;
      box.style.width = `${width}px`;
      box.style.height = `${height}px`;
    } else if (activeTool === "brush") {
      // Paint select
      paintSelectAtPoint(evt.clientX, evt.clientY, evt.altKey || evt.ctrlKey);
    } else if (activeTool === "lasso") {
      const svg = preview.querySelector("svg");
      if (!svg) return;
      const coords = getSvgCoordinates(evt.clientX, evt.clientY, svg);
      lassoPoints.push(coords);

      const polygon = svg.querySelector(".lasso-preview");
      if (polygon) {
        const pointsStr = lassoPoints.map(p => `${p.x},${p.y}`).join(" ");
        polygon.setAttribute("points", pointsStr);
      }
    }
  });

  window.addEventListener("mouseup", (evt) => {
    if (!isDragging) return;
    isDragging = false;

    const preview = document.getElementById("svg-preview");
    const svg = preview?.querySelector("svg");
    if (!preview || !svg) return;

    if (activeTool === "rect") {
      const box = preview.querySelector(".selection-box");
      if (!box) return;
      const boxRect = box.getBoundingClientRect();
      box.remove();

      const diffX = Math.abs(evt.clientX - dragStartX);
      const diffY = Math.abs(evt.clientY - dragStartY);

      if (diffX < 4 && diffY < 4) {
        const target = evt.target as SVGElement;
        if (target && target.tagName.toLowerCase() === "path") {
          const dataIndexAttr = target.getAttribute("data-original-index");
          const paths = Array.from(svg.querySelectorAll("path"));
          const pathIndex = dataIndexAttr ? Number(dataIndexAttr) : paths.indexOf(target as SVGPathElement);

          if (evt.shiftKey) {
            selectedPathIndices.add(pathIndex);
          } else if (evt.altKey || evt.ctrlKey) {
            selectedPathIndices.delete(pathIndex);
          } else {
            if (selectedPathIndices.has(pathIndex)) {
              selectedPathIndices.delete(pathIndex);
            } else {
              selectedPathIndices.add(pathIndex);
            }
          }
        }
      } else {
        const topLeft = getSvgCoordinates(boxRect.left, boxRect.top, svg);
        const bottomRight = getSvgCoordinates(boxRect.right, boxRect.bottom, svg);

        const selectionSvgBounds = {
          minX: Math.min(topLeft.x, bottomRight.x),
          minY: Math.min(topLeft.y, bottomRight.y),
          maxX: Math.max(topLeft.x, bottomRight.x),
          maxY: Math.max(topLeft.y, bottomRight.y)
        };

        const newlySelected: number[] = [];
        cachedPathBBoxes.forEach((cached) => {
          if (isIntersecting(cached.bounds, selectionSvgBounds)) {
            newlySelected.push(cached.pathIndex);
          }
        });

        if (evt.shiftKey) {
          newlySelected.forEach(idx => selectedPathIndices.add(idx));
        } else if (evt.altKey || evt.ctrlKey) {
          newlySelected.forEach(idx => selectedPathIndices.delete(idx));
        } else {
          selectedPathIndices.clear();
          newlySelected.forEach(idx => selectedPathIndices.add(idx));
        }
      }
    } else if (activeTool === "brush") {
      // Paint brush selection completes
    } else if (activeTool === "lasso") {
      svg.querySelector(".lasso-preview")?.remove();

      const diffX = Math.abs(evt.clientX - dragStartX);
      const diffY = Math.abs(evt.clientY - dragStartY);

      if (diffX < 4 && diffY < 4) {
        const target = evt.target as SVGElement;
        if (target && target.tagName.toLowerCase() === "path") {
          const dataIndexAttr = target.getAttribute("data-original-index");
          const paths = Array.from(svg.querySelectorAll("path"));
          const pathIndex = dataIndexAttr ? Number(dataIndexAttr) : paths.indexOf(target as SVGPathElement);

          if (evt.shiftKey) {
            selectedPathIndices.add(pathIndex);
          } else if (evt.altKey || evt.ctrlKey) {
            selectedPathIndices.delete(pathIndex);
          } else {
            if (selectedPathIndices.has(pathIndex)) {
              selectedPathIndices.delete(pathIndex);
            } else {
              selectedPathIndices.add(pathIndex);
            }
          }
        }
      } else if (lassoPoints.length > 2) {
        const newlySelected: number[] = [];
        cachedPathBBoxes.forEach((cached) => {
          const center = {
            x: (cached.bounds.minX + cached.bounds.maxX) / 2,
            y: (cached.bounds.minY + cached.bounds.maxY) / 2
          };
          if (isPointInPolygon(center, lassoPoints)) {
            newlySelected.push(cached.pathIndex);
          }
        });

        if (evt.shiftKey) {
          newlySelected.forEach(idx => selectedPathIndices.add(idx));
        } else if (evt.altKey || evt.ctrlKey) {
          newlySelected.forEach(idx => selectedPathIndices.delete(idx));
        } else {
          selectedPathIndices.clear();
          newlySelected.forEach(idx => selectedPathIndices.add(idx));
        }
      }
      lassoPoints = [];
    }

    updateSelectionVisuals();
  });
}

function paintSelectAtPoint(clientX: number, clientY: number, isSubtracting: boolean) {
  const el = document.elementFromPoint(clientX, clientY) as SVGElement | null;
  if (!el) return;

  const preview = document.getElementById("svg-preview");
  if (!preview || !preview.contains(el)) return;

  if (el.tagName.toLowerCase() === "path") {
    const svg = preview.querySelector("svg");
    if (!svg) return;
    const paths = Array.from(svg.querySelectorAll("path"));
    const dataIndexAttr = el.getAttribute("data-original-index");
    const pathIndex = dataIndexAttr ? Number(dataIndexAttr) : paths.indexOf(el as SVGPathElement);

    if (isSubtracting) {
      if (selectedPathIndices.has(pathIndex)) {
        selectedPathIndices.delete(pathIndex);
        updateSelectionVisuals();
      }
    } else {
      if (!selectedPathIndices.has(pathIndex)) {
        selectedPathIndices.add(pathIndex);
        updateSelectionVisuals();
      }
    }
  }
}

function isPointInPolygon(point: { x: number; y: number }, polygon: Array<{ x: number; y: number }>): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
