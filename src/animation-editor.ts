import "./styles/animation-editor.scss";
import { ANIMATION_PRESETS, PIVOT_PRESETS, getDefaultPivotForPart, type PivotPoint } from "./animation-editor/animationPresets";
import { classifySvgPaths, parseSvgPathBounds, type CropGroup } from "./animation-editor/groupClassifier";
import { relabelGroup, serializeGroupedSvg } from "./animation-editor/groupEditor";

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

  document.querySelectorAll<HTMLButtonElement>(".mode-btn").forEach((button) => {
    button.addEventListener("click", () => {
      previewMode = (button.dataset.mode || "normal") as typeof previewMode;
      document.querySelectorAll(".mode-btn").forEach((entry) => entry.classList.toggle("is-active", entry === button));
      renderPreview();
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
  updateActionState();
  setStatus(`Classified ${activeGroups.length} groups for ${formatStageLabel(activeStage.stageId)}.`);
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

function renderAnimationOptionsForGroup(groupId: string): string {
  const current = partAnimations[groupId] || "none";
  return ANIMATION_PRESETS.map((preset) =>
    `<option value="${preset.id}" ${preset.id === current ? "selected" : ""}>${preset.label}</option>`
  ).join("");
}

function renderPivotPresetOptionsForGroup(groupId: string): string {
  const group = activeGroups.find((g) => g.id === groupId);
  const defaultPivot = getDefaultPivotForPart(group?.label || "");
  const currentPivot = partPivots[groupId] || defaultPivot;
  const matchingPreset = PIVOT_PRESETS.find((preset) => preset.pivot.x === currentPivot.x && preset.pivot.y === currentPivot.y);
  const currentPresetId = matchingPreset?.id || "custom";

  return PIVOT_PRESETS.map((preset) =>
    `<option value="${preset.id}" ${preset.id === currentPresetId ? "selected" : ""}>${preset.label}</option>`
  ).join("");
}

function renderGroupList() {
  const container = document.getElementById("group-list");
  if (!container) return;

  if (activeGroups.length === 0) {
    container.innerHTML = `<p class="animation-empty">Run Suggest Candidates to inspect groups.</p>`;
    return;
  }

  container.innerHTML = activeGroups.map((group) => {
    const defaultPivot = getDefaultPivotForPart(group.label);
    const pivot = partPivots[group.id] || defaultPivot;
    return `
      <article class="group-row ${group.id === selectedGroupId ? "is-active" : ""}" data-group-id="${group.id}">
        <div class="group-row__main">
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
        
        <div class="group-row__details">
          <div class="details-field">
            <span class="field-label-sm">Animation</span>
            <select class="form-control group-animation-select" data-action="animation">
              ${renderAnimationOptionsForGroup(group.id)}
            </select>
          </div>
          <div class="details-field">
            <span class="field-label-sm">Pivot Point</span>
            <select class="form-control group-pivot-select" data-action="pivot-preset">
              ${renderPivotPresetOptionsForGroup(group.id)}
            </select>
            <div class="pivot-inputs-row">
              <div class="pivot-input-wrapper">
                <span>X</span>
                <input class="form-control pivot-x-input" type="number" min="0" max="100" step="1" data-action="pivot-x" value="${Math.round(pivot.x)}" />
                <span>%</span>
              </div>
              <div class="pivot-input-wrapper">
                <span>Y</span>
                <input class="form-control pivot-y-input" type="number" min="0" max="100" step="1" data-action="pivot-y" value="${Math.round(pivot.y)}" />
                <span>%</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");

  container.querySelectorAll<HTMLElement>(".group-row").forEach((row) => {
    const groupId = row.dataset.groupId || "";
    row.querySelector('[data-action="select"]')?.addEventListener("click", () => {
      selectedGroupId = groupId;
      renderPreview();
      renderGroupList();
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
      updateActionState();
    });

    row.querySelector('[data-action="visibility"]')?.addEventListener("click", () => {
      activeGroups = activeGroups.map((group) => group.id === groupId ? { ...group, hidden: !group.hidden } : group);
      renderPreview();
      renderGroupList();
    });

    row.querySelector<HTMLSelectElement>('[data-action="animation"]')?.addEventListener("change", (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      partAnimations[groupId] = target.value;
      renderPreview();
      updateActionState();
    });

    row.querySelector<HTMLSelectElement>('[data-action="pivot-preset"]')?.addEventListener("change", (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      const preset = PIVOT_PRESETS.find((p) => p.id === target.value);
      if (preset && preset.id !== "custom") {
        partPivots[groupId] = { ...preset.pivot };
        const xInput = row.querySelector<HTMLInputElement>('[data-action="pivot-x"]');
        const yInput = row.querySelector<HTMLInputElement>('[data-action="pivot-y"]');
        if (xInput) xInput.value = String(preset.pivot.x);
        if (yInput) yInput.value = String(preset.pivot.y);
        renderPreview();
        updateActionState();
      }
    });

    const xInput = row.querySelector<HTMLInputElement>('[data-action="pivot-x"]');
    const yInput = row.querySelector<HTMLInputElement>('[data-action="pivot-y"]');
    [xInput, yInput].forEach((input) => {
      input?.addEventListener("input", () => {
        if (!xInput || !yInput) return;
        partPivots[groupId] = {
          x: clampPercent(Number(xInput.value)),
          y: clampPercent(Number(yInput.value))
        };
        const presetSelect = row.querySelector<HTMLSelectElement>('[data-action="pivot-preset"]');
        if (presetSelect) {
          presetSelect.value = "custom";
        }
        renderPreview();
        updateActionState();
      });
    });
  });
}

function renderPartOptions(value: string): string {
  const parts = ["base", "stem", "leaves", "leaves-left", "leaves-right", "fruit", "ears", "tassels", "flower", "dead-leaf", "other"];
  const unique = Array.from(new Set([value, ...parts]));
  return unique.map((part) => `<option value="${part}" ${part === value ? "selected" : ""}>${part}</option>`).join("");
}

function updateActionState() {
  const hasStage = Boolean(activeStage);
  const hasGroups = activeGroups.length > 0;
  setDisabled("auto-classify-btn", !hasStage);
  setDisabled("preview-animation-btn", !hasGroups);
  setDisabled("save-animation-btn", !hasGroups);
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


