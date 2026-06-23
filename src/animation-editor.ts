import "./styles/animation-editor.scss";
import { ANIMATION_PRESETS, PIVOT_PRESETS, getDefaultPivotForPart, type PivotPoint } from "./animation-editor/animationPresets";
import { classifySvgPaths, parseSvgPathBounds, type CropGroup } from "./animation-editor/groupClassifier";
import { relabelGroup, serializeGroupedSvg } from "./animation-editor/groupEditor";
import { createSelectionBoundsRect } from "./animation-editor/selectionOverlay";
import { calculatePivotFromSvgPoint } from "./animation-editor/pivotDrag";
import { validateStageAnimationData } from "./animation-editor/stageValidation";
import {
  buildAnimationPartsConfig,
  getDefaultMotionForAnimation,
  getMotionKeysForAnimation,
  mergeStageAnimationCache,
  type MotionConfigKey,
  type MotionConfig
} from "./animation-editor/motionConfig";

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
      parts?: Record<string, { animation: string; pivot?: PivotPoint; motion?: MotionConfig }>;
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
let partMotions: Record<string, MotionConfig> = {};
let soloPreviewGroupId = "";
let animationsMetadata: any = null;
let draggingPivotGroupId = "";
let isDirty = false;

document.addEventListener("DOMContentLoaded", () => {
  setupEvents();
  void initAnimationEditor();
});

function setupEvents() {
  const cropSelect = document.getElementById("animation-crop-select") as HTMLSelectElement | null;
  cropSelect?.addEventListener("change", () => {
    const nextCrop = cropSelect.value;
    if (!nextCrop || nextCrop === cropName) return;
    if (isDirty && !window.confirm("Stage hien tai co thay doi chua luu. Doi crop se bo cac thay doi nay. Tiep tuc?")) {
      cropSelect.value = cropName;
      return;
    }
    window.location.href = `/crop-animation-editor.html?crop=${encodeURIComponent(nextCrop)}`;
  });

  document.getElementById("animation-stage-select")?.addEventListener("change", (event) => {
    const select = event.currentTarget as HTMLSelectElement;
    const nextStageId = select.value;
    if (!nextStageId || nextStageId === activeStage?.stageId) return;
    if (isDirty && !window.confirm("Stage hien tai co thay doi chua luu. Doi stage se bo cac thay doi nay. Tiep tuc?")) {
      select.value = activeStage?.stageId || "";
      return;
    }
    selectStage(nextStageId);
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
    animationsMetadata = payload.animations;
    renderStageSelect();
    setStatus("Select a stage to begin.");

    const firstStage = stages.find((stage) => stage.activeSvg);
    if (firstStage) {
      selectStage(firstStage.stageId);
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

function renderStageSelect() {
  const select = document.getElementById("animation-stage-select") as HTMLSelectElement | null;
  if (!select) return;

  if (stages.length === 0) {
    select.innerHTML = `<option value="">No saved stage SVGs</option>`;
    select.disabled = true;
    return;
  }

  select.innerHTML = stages.map((stage) => `
    <option value="${stage.stageId}" ${activeStage?.stageId === stage.stageId ? "selected" : ""} ${stage.activeSvg ? "" : "disabled"}>
      ${formatStageLabel(stage.stageId)}
    </option>
  `).join("");
  select.disabled = stages.every((stage) => !stage.activeSvg);
}

function selectStage(stageId: string) {
  const stage = stages.find((entry) => entry.stageId === stageId);
  if (!stage) return;

  activeStage = stage;
  activeGroups = [];
  selectedGroupId = "";
  soloPreviewGroupId = "";
  isPreviewingAnimation = false;
  isDirty = false;

  if (!stage.activeSvg) {
    renderStageSelect();
    renderPreview();
    renderGroupList();
    renderLayerProperties();
    updateActionState();
    setStatus(`${formatStageLabel(stage.stageId)} has no SVG data.`, true);
    return;
  }

  // 1. Group Restoring (load existing grouped SVG & legacy fallback)
  const parser = new DOMParser();
  const doc = parser.parseFromString(stage.activeSvg, "image/svg+xml");
  if (doc.querySelector("parsererror")) {
    renderStageSelect();
    renderPreview();
    renderGroupList();
    renderLayerProperties();
    updateActionState();
    setStatus(`${formatStageLabel(stage.stageId)} SVG data could not be parsed.`, true);
    return;
  }
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
  const stageParts = animationsMetadata?.stages?.[stageId]?.parts || {};
  partAnimations = {};
  partPivots = {};
  partMotions = {};

  activeGroups.forEach((group) => {
    let config = stageParts[group.id];
    if (!config) {
      config = stageParts[group.label];
    }
    partAnimations[group.id] = config?.animation || "none";
    partPivots[group.id] = config?.pivot || getDefaultPivotForPart(group.label);
    if (config?.motion) {
      partMotions[group.id] = { ...config.motion };
    }
  });

  selectedGroupId = activeGroups[0]?.id || "";

  renderStageSelect();
  renderPreview();
  renderGroupList();
  renderLayerProperties();
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
  partMotions = {};
  selectedGroupId = activeGroups[0]?.id || "";
  previewMode = "overlay";
  isPreviewingAnimation = false;
  setDirty(true);
  syncModeButtons();
  renderPreview();
  renderGroupList();
  renderLayerProperties();
  updateActionState();
  setStatus(`Classified ${activeGroups.length} groups for ${formatStageLabel(activeStage.stageId)}.`);
}

function handlePreviewAnimation() {
  isPreviewingAnimation = !isPreviewingAnimation;
  if (isPreviewingAnimation) {
    soloPreviewGroupId = "";
  }
  renderPreview();
  renderGroupList();
  setStatus(isPreviewingAnimation ? "Animation preview is running." : "Animation preview stopped.");
}

async function handleSave() {
  if (!activeStage || activeGroups.length === 0) return;
  const validation = validateStageAnimationData({
    stage: activeStage,
    groups: activeGroups,
    animations: partAnimations,
    pivots: partPivots,
    motions: partMotions
  });
  if (!validation.valid) {
    setStatus(`Save blocked: ${validation.errors[0]}`, true);
    return;
  }

  const groupedSvg = serializeGroupedSvg(activeStage.activeSvg, activeGroups, cropName, activeStage.stageId);
  const groupedFile = `${activeStage.stageId}.grouped.svg`;
  const parts = buildAnimationPartsConfig(activeGroups, partAnimations, partPivots, partMotions);

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

  animationsMetadata = mergeStageAnimationCache(animationsMetadata, cropName, activeStage.stageId, {
    sourceFile: activeStage.sourceFile || `${activeStage.stageId}.svg`,
    groupedFile,
    parts
  });

  activeStage.groupedSvg = groupedSvg;
  activeStage.groupedFile = groupedFile;
  activeStage.activeSvg = groupedSvg;
  activeStage.activeFile = activeStage.groupedFile;
  activeStage.hasGroupedSvg = true;
  setDirty(false);
  renderStageSelect();
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

    const isAnimating = isPreviewingAnimation || (soloPreviewGroupId === group.id);
    node.classList.toggle("is-animating", isAnimating);

    const rawPivot = partPivots[group.id] || getDefaultPivotForPart(group.label);
    const pivot = {
      x: clampPercent(rawPivot.x),
      y: clampPercent(rawPivot.y)
    };
    node.style.transformOrigin = `${pivot.x}% ${pivot.y}%`;
    applyMotionToDomNode(node, partMotions[group.id] || {});
  }

  renderSelectionOverlay(preview);
}

function applyMotionToDomNode(node: SVGGElement, motion: MotionConfig) {
  setMotionProperty(node, "--anim-duration", motion.durationMs, "ms");
  setMotionProperty(node, "--anim-delay", motion.delayMs, "ms");
  setMotionProperty(node, "--anim-angle", motion.angleDeg, "deg");
  setMotionProperty(node, "--anim-y", motion.yPx, "px");
  setMotionProperty(node, "--anim-scale", motion.scale);
}

function setMotionProperty(node: SVGGElement, name: string, value: number | undefined, unit = "") {
  if (value === undefined) {
    node.style.removeProperty(name);
    return;
  }
  node.style.setProperty(name, `${value}${unit}`);
}

function getMotionValueForGroup(groupId: string): Required<MotionConfig> {
  const animation = partAnimations[groupId] || "none";
  return {
    ...getDefaultMotionForAnimation(animation),
    ...(partMotions[groupId] || {})
  };
}

function renderMotionControlsForGroup(groupId: string): string {
  const motion = getMotionValueForGroup(groupId);
  const animation = partAnimations[groupId] || "none";
  const motionKeys = getMotionKeysForAnimation(animation);
  if (motionKeys.length === 0) return "";

  return `
    <div class="details-field motion-field">
      <span class="field-label-sm">Motion</span>
      ${motionKeys.map((key) => renderMotionControl(key, motion[key])).join("")}
    </div>
  `;
}

function renderMotionControl(key: MotionConfigKey, value: number): string {
  const controls: Record<MotionConfigKey, { label: string; min: string; max: string; step: string }> = {
    durationMs: { label: "Duration", min: "1000", max: "5000", step: "100" },
    delayMs: { label: "Delay", min: "0", max: "3000", step: "50" },
    angleDeg: { label: "Angle", min: "0", max: "10", step: "0.1" },
    yPx: { label: "Offset Y", min: "0", max: "10", step: "1" },
    scale: { label: "Scale", min: "1", max: "1.15", step: "0.01" }
  };
  const control = controls[key];

  return `
      <label class="motion-control">
        <span>${control.label} <strong data-motion-value="${key}">${formatMotionValue(key, value)}</strong></span>
        <input type="range" min="${control.min}" max="${control.max}" step="${control.step}" data-action="motion" data-motion-key="${key}" value="${value}" />
      </label>`;
}

function formatMotionValue(key: MotionConfigKey, value: number): string {
  if (key === "durationMs" || key === "delayMs") return `${Math.round(value)}ms`;
  if (key === "angleDeg") return `${value.toFixed(1)}deg`;
  if (key === "yPx") return `${Math.round(value)}px`;
  return value.toFixed(2);
}

function applyMotionToPreviewGroup(groupId: string) {
  const preview = document.getElementById("svg-preview");
  const node = preview?.querySelector<SVGGElement>(`[data-group-id="${cssEscape(groupId)}"]`);
  if (node) {
    applyMotionToDomNode(node, partMotions[groupId] || {});
  }
}

function getGroupBounds(node: SVGGElement, group: CropGroup) {
  try {
    if (typeof node.getBBox === "function") {
      const bbox = node.getBBox();
      if (bbox.width > 0 || bbox.height > 0) {
        return {
          minX: bbox.x,
          minY: bbox.y,
          maxX: bbox.x + bbox.width,
          maxY: bbox.y + bbox.height
        };
      }
    }
  } catch (e) {
    // Fallback to static bounds on error
  }
  return combineGroupBounds(group);
}

function getSvgPointFromPointer(svg: SVGSVGElement, event: PointerEvent) {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const matrix = svg.getScreenCTM();
  if (!matrix) return null;
  return point.matrixTransform(matrix.inverse());
}

function updatePivotControls(groupId: string, pivot: PivotPoint) {
  if (groupId !== selectedGroupId) return;
  const panel = document.getElementById("layer-properties");
  if (!panel) return;

  const xInput = panel.querySelector<HTMLInputElement>('[data-action="pivot-x"]');
  const yInput = panel.querySelector<HTMLInputElement>('[data-action="pivot-y"]');
  const presetSelect = panel.querySelector<HTMLSelectElement>('[data-action="pivot-preset"]');
  if (xInput) xInput.value = String(Math.round(pivot.x));
  if (yInput) yInput.value = String(Math.round(pivot.y));
  if (presetSelect) presetSelect.value = "custom";
}

function applyDraggedPivot(event: PointerEvent) {
  if (!draggingPivotGroupId) return;
  const preview = document.getElementById("svg-preview");
  const svg = preview?.querySelector<SVGSVGElement>("svg");
  const group = activeGroups.find((entry) => entry.id === draggingPivotGroupId);
  if (!preview || !svg || !group) return;

  const point = getSvgPointFromPointer(svg, event);
  if (!point) return;

  const node = preview.querySelector<SVGGElement>(`[data-group-id="${cssEscape(group.id)}"]`);
  const bounds = node ? getGroupBounds(node, group) : combineGroupBounds(group);
  const nextPivot = calculatePivotFromSvgPoint(
    { x: point.x, y: point.y },
    bounds,
    partPivots[group.id] || getDefaultPivotForPart(group.label)
  );

  partPivots[group.id] = nextPivot;
  setDirty(true);
  updatePivotControls(group.id, nextPivot);
  decoratePreviewGroups(preview);
}

function endPivotDrag() {
  if (!draggingPivotGroupId) return;
  draggingPivotGroupId = "";
  document.body.classList.remove("is-dragging-pivot");
  window.removeEventListener("pointermove", applyDraggedPivot);
  window.removeEventListener("pointerup", endPivotDrag);
  window.removeEventListener("pointercancel", endPivotDrag);
}

function startPivotDrag(event: PointerEvent, groupId: string) {
  event.preventDefault();
  event.stopPropagation();
  draggingPivotGroupId = groupId;
  document.body.classList.add("is-dragging-pivot");
  window.addEventListener("pointermove", applyDraggedPivot);
  window.addEventListener("pointerup", endPivotDrag);
  window.addEventListener("pointercancel", endPivotDrag);
  applyDraggedPivot(event);
}

function renderPivotMarker(preview: HTMLElement) {
  preview.querySelector(".pivot-marker")?.remove();
  const group = activeGroups.find((entry) => entry.id === selectedGroupId);
  const svg = preview.querySelector("svg");
  if (!group || !svg) return;

  const rawPivot = partPivots[group.id] || getDefaultPivotForPart(group.label);
  const pivot = {
    x: clampPercent(rawPivot.x),
    y: clampPercent(rawPivot.y)
  };
  const node = preview.querySelector<SVGGElement>(`[data-group-id="${cssEscape(group.id)}"]`);
  const bounds = node ? getGroupBounds(node, group) : combineGroupBounds(group);

  const markerX = bounds.minX + ((bounds.maxX - bounds.minX) * pivot.x) / 100;
  const markerY = bounds.minY + ((bounds.maxY - bounds.minY) * pivot.y) / 100;
  const marker = document.createElementNS("http://www.w3.org/2000/svg", "g");
  marker.setAttribute("class", "pivot-marker");
  marker.setAttribute("data-group-id", group.id);
  marker.setAttribute("transform", `translate(${markerX} ${markerY})`);
  marker.innerHTML = `
    <circle class="pivot-marker__hit" r="18" />
    <circle r="7" />
    <path d="M-14 0 H14 M0 -14 V14" />
  `;
  marker.addEventListener("pointerdown", (event) => startPivotDrag(event, group.id));
  svg.appendChild(marker);
}

function renderSelectionOverlay(preview: HTMLElement) {
  preview.querySelector(".selection-bounds")?.remove();
  preview.querySelector(".pivot-marker")?.remove();
  const group = activeGroups.find((entry) => entry.id === selectedGroupId);
  const svg = preview.querySelector("svg");
  if (!group || !svg) return;

  const node = preview.querySelector<SVGGElement>(`[data-group-id="${cssEscape(group.id)}"]`);
  const bounds = node ? getGroupBounds(node, group) : combineGroupBounds(group);
  const rect = createSelectionBoundsRect(bounds);
  svg.appendChild(rect);
  renderPivotMarker(preview);
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
  {
    const container = document.getElementById("group-list");
    if (!container) return;

    if (activeGroups.length === 0) {
      container.innerHTML = `<p class="animation-empty">${activeStage ? "No editable layers in this stage." : "Select a stage to inspect layers."}</p>`;
      renderLayerProperties();
      return;
    }

    container.innerHTML = activeGroups.map((group) => `
      <article class="group-row ${group.id === selectedGroupId ? "is-active" : ""}" data-group-id="${group.id}">
        <div class="group-row__main">
          <button class="group-row__select" type="button" data-action="select">
            <div class="group-row__select-header">
              <span class="group-row__arrow">\u25BC</span>
              <span class="group-row__label">${group.label}</span>
            </div>
            <span class="group-row__meta">${group.paths.length} paths &middot; ${group.colorFamily}</span>
          </button>
          <div class="group-row__controls">
            <button class="group-preview-btn ${soloPreviewGroupId === group.id ? "is-active" : ""}" type="button" data-action="preview-part" title="${soloPreviewGroupId === group.id ? "Stop Preview" : "Preview Animation"}">
              ${soloPreviewGroupId === group.id ? "\u23F9" : "\u25B6"}
            </button>
            <button class="group-visibility-btn ${group.hidden ? "is-hidden-btn" : ""}" type="button" data-action="visibility" title="${group.hidden ? "Show Layer" : "Hide Layer"}">
              \u{1F441}
            </button>
          </div>
        </div>
      </article>
    `).join("");

    container.querySelectorAll<HTMLElement>(".group-row").forEach((row) => {
      const groupId = row.dataset.groupId || "";
      row.querySelector('[data-action="select"]')?.addEventListener("click", () => {
        selectedGroupId = groupId;
        renderPreview();
        renderGroupList();
        renderLayerProperties();
        updateActionState();
      });

      row.querySelector('[data-action="preview-part"]')?.addEventListener("click", (event) => {
        event.stopPropagation();
        if (soloPreviewGroupId === groupId) {
          soloPreviewGroupId = "";
        } else {
          soloPreviewGroupId = groupId;
          selectedGroupId = groupId;
          isPreviewingAnimation = false;
        }
        renderPreview();
        renderGroupList();
        renderLayerProperties();
        updateActionState();
      });

      row.querySelector('[data-action="visibility"]')?.addEventListener("click", (event) => {
        event.stopPropagation();
        activeGroups = activeGroups.map((group) => group.id === groupId ? { ...group, hidden: !group.hidden } : group);
        setDirty(true);
        renderPreview();
        renderGroupList();
        renderLayerProperties();
      });
    });
    return;
  }
}


function renderLayerProperties() {
  const container = document.getElementById("layer-properties");
  if (!container) return;

  const group = activeGroups.find((entry) => entry.id === selectedGroupId);
  if (!activeStage) {
    container.innerHTML = `<p class="animation-empty">Select a stage to edit layer properties.</p>`;
    return;
  }
  if (!group) {
    container.innerHTML = `<p class="animation-empty">Select a layer to edit its properties.</p>`;
    return;
  }

  const defaultPivot = getDefaultPivotForPart(group.label);
  const pivot = partPivots[group.id] || defaultPivot;
  container.innerHTML = `
    <div class="layer-properties__header">
      <span class="layer-properties__title">${group.label}</span>
      <span class="layer-properties__meta">${group.paths.length} paths &middot; ${group.colorFamily}</span>
    </div>
    <div class="details-field">
      <span class="field-label-sm">Layer Label</span>
      <select class="form-control group-label-select" data-action="label">
        ${renderPartOptions(group.label)}
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
    <div class="details-field">
      <span class="field-label-sm">Animation</span>
      <select class="form-control group-animation-select" data-action="animation">
        ${renderAnimationOptionsForGroup(group.id)}
      </select>
    </div>
    ${renderMotionControlsForGroup(group.id)}
  `;

  container.querySelector<HTMLSelectElement>('[data-action="label"]')?.addEventListener("change", (event) => {
    const target = event.currentTarget as HTMLSelectElement;
    const oldGroup = activeGroups.find((entry) => entry.id === group.id);
    activeGroups = relabelGroup(activeGroups, group.id, target.value);
    if (oldGroup) {
      const oldDefault = getDefaultPivotForPart(oldGroup.label);
      const currentPivot = partPivots[oldGroup.id];
      if (currentPivot && currentPivot.x === oldDefault.x && currentPivot.y === oldDefault.y) {
        partPivots[oldGroup.id] = getDefaultPivotForPart(target.value);
      }
    }
    selectedGroupId = group.id;
    setDirty(true);
    renderPreview();
    renderGroupList();
    renderLayerProperties();
    updateActionState();
  });

  container.querySelector<HTMLSelectElement>('[data-action="animation"]')?.addEventListener("change", (event) => {
    const target = event.currentTarget as HTMLSelectElement;
    partAnimations[group.id] = target.value;
    if (!partMotions[group.id]) {
      partMotions[group.id] = getDefaultMotionForAnimation(target.value);
    }
    setDirty(true);
    renderPreview();
    renderLayerProperties();
    updateActionState();
  });

  container.querySelector<HTMLSelectElement>('[data-action="pivot-preset"]')?.addEventListener("change", (event) => {
    const target = event.currentTarget as HTMLSelectElement;
    const preset = PIVOT_PRESETS.find((p) => p.id === target.value);
    if (preset && preset.id !== "custom") {
      partPivots[group.id] = { ...preset.pivot };
      const xInput = container.querySelector<HTMLInputElement>('[data-action="pivot-x"]');
      const yInput = container.querySelector<HTMLInputElement>('[data-action="pivot-y"]');
      if (xInput) xInput.value = String(preset.pivot.x);
      if (yInput) yInput.value = String(preset.pivot.y);
      setDirty(true);
      renderPreview();
      updateActionState();
    }
  });

  const xInput = container.querySelector<HTMLInputElement>('[data-action="pivot-x"]');
  const yInput = container.querySelector<HTMLInputElement>('[data-action="pivot-y"]');
  [xInput, yInput].forEach((input) => {
    input?.addEventListener("input", () => {
      if (!xInput || !yInput) return;
      const nextPivot = {
        x: clampPercent(Number(xInput.value)),
        y: clampPercent(Number(yInput.value))
      };
      partPivots[group.id] = nextPivot;
      xInput.value = String(Math.round(nextPivot.x));
      yInput.value = String(Math.round(nextPivot.y));
      const presetSelect = container.querySelector<HTMLSelectElement>('[data-action="pivot-preset"]');
      if (presetSelect) {
        presetSelect.value = "custom";
      }
      setDirty(true);
      renderPreview();
      updateActionState();
    });
  });

  container.querySelectorAll<HTMLInputElement>('[data-action="motion"]').forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.motionKey as keyof Required<MotionConfig> | undefined;
      if (!key) return;
      partMotions[group.id] = {
        ...getMotionValueForGroup(group.id),
        [key]: Number(input.value)
      };
      const display = container.querySelector<HTMLElement>(`[data-motion-value="${key}"]`);
      if (display) {
        display.textContent = formatMotionValue(key, Number(input.value));
      }
      setDirty(true);
      applyMotionToPreviewGroup(group.id);
      updateActionState();
    });
  });
}

function renderPartOptions(value: string): string {
  const PART_TRANSLATIONS: Record<string, string> = {
    "base": "gốc",
    "stem": "thân",
    "leaves": "lá",
    "leaves-left": "lá trái",
    "leaves-right": "lá phải",
    "fruit": "quả/trái",
    "ears": "bắp",
    "tassels": "râu ngô",
    "flower": "hoa",
    "dead-leaf": "lá úa/chết",
    "other": "khác"
  };
  const parts = ["base", "stem", "leaves", "leaves-left", "leaves-right", "fruit", "ears", "tassels", "flower", "dead-leaf", "other"];
  const unique = Array.from(new Set([value, ...parts]));
  return unique.map((part) => {
    const translation = PART_TRANSLATIONS[part];
    const label = translation ? `${part} (${translation})` : part;
    return `<option value="${part}" ${part === value ? "selected" : ""}>${label}</option>`;
  }).join("");
}

function updateActionState() {
  const hasStage = Boolean(activeStage);
  const hasGroups = activeGroups.length > 0;
  setDisabled("auto-classify-btn", !hasStage);
  setDisabled("preview-animation-btn", !hasGroups);
  setDisabled("save-animation-btn", !hasGroups);
}

function setDirty(value: boolean) {
  isDirty = value;
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


