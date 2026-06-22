import "./styles/editor.scss";
import { composeLayeredSvg, type SvgLayerInput } from "./layer-trace/layerComposer";

interface Crop {
  name: string;
  pngs: string[];
}

interface TraceParams {
  colormode: string;
  mode: string;
  hierarchical: string;
  color_precision: number;
  filter_speckle: number;
  gradient_step: number;
  corner_threshold: number;
  segment_length: number;
  splice_threshold: number;
  path_precision: number;
}

interface TraceResult {
  optimizedSvg: string;
  metrics: {
    optimized: {
      pathCount: number;
    };
  };
}

const vtracerPresets: Record<string, Record<string, number>> = {
  gameClean: {
    color_precision: 7,
    filter_speckle: 5,
    gradient_step: 14,
    corner_threshold: 60,
    segment_length: 4.0,
    splice_threshold: 45
  },
  gameDetailed: {
    color_precision: 8,
    filter_speckle: 3,
    gradient_step: 6,
    corner_threshold: 60,
    segment_length: 3.5,
    splice_threshold: 45
  },
  animationCandidate: {
    color_precision: 7,
    filter_speckle: 6,
    gradient_step: 14,
    corner_threshold: 60,
    segment_length: 4.0,
    splice_threshold: 45
  },
  tinyRuntime: {
    color_precision: 6,
    filter_speckle: 8,
    gradient_step: 20,
    corner_threshold: 70,
    segment_length: 4.5,
    splice_threshold: 50
  }
};

const defaultStages = ["stage00", "stage01", "stage02", "stage03", "dead"];

let activeCrop = "";
let cropsList: Crop[] = [];
let targetStages = [...defaultStages];
let mappedStages: Record<string, string> = {};
let layerTraceImage: HTMLImageElement | null = null;
let layerLassoPoints: Array<{ x: number; y: number }> = [];
let isDrawingLayerMask = false;
let layerTraceLayers: SvgLayerInput[] = [];
let draggedIndex: number | null = null;

document.addEventListener("DOMContentLoaded", () => {
  setupUIEventListeners();
  void initEditor();
});

async function initEditor() {
  showStatus("loading", "Dang tai danh sach crop...");

  try {
    const cropsResponse = await fetch("/api/editor/crops");
    if (!cropsResponse.ok) {
      throw new Error("Khong the tai danh sach crop.");
    }

    cropsList = await cropsResponse.json() as Crop[];
    populateCropDropdown();
    renderStagesSidebar();
    renderLayerTraceState();
    applyPreset("animationCandidate");
    showStatus("info", "Chon crop va PNG nguon, sau do dung lasso de trace tung layer.");
  } catch (error: any) {
    showStatus("error", `Loi khoi tao editor: ${error.message}`);
  }
}

function setupUIEventListeners() {
  const cropSelect = document.getElementById("crop-select") as HTMLSelectElement | null;
  const pngSelect = document.getElementById("png-select") as HTMLSelectElement | null;
  const addStageBtn = document.getElementById("add-stage-btn") as HTMLButtonElement | null;
  const removeStageBtn = document.getElementById("remove-stage-btn") as HTMLButtonElement | null;
  const animationEditorBtn = document.getElementById("open-animation-editor-btn") as HTMLButtonElement | null;
  const layerCanvas = document.getElementById("layer-mask-canvas") as HTMLCanvasElement | null;
  const clearLayerMaskBtn = document.getElementById("clear-layer-mask-btn") as HTMLButtonElement | null;
  const traceLayerBtn = document.getElementById("trace-layer-btn") as HTMLButtonElement | null;
  const saveLayerCompositeBtn = document.getElementById("save-layer-composite-btn") as HTMLButtonElement | null;
  const layerStageSelect = document.getElementById("layer-stage-select") as HTMLSelectElement | null;
  const toggleTraceParamsBtn = document.getElementById("toggle-trace-params-btn") as HTMLButtonElement | null;

  cropSelect?.addEventListener("change", () => void handleCropSelection(cropSelect.value));
  pngSelect?.addEventListener("change", () => void handlePngSelection());
  addStageBtn?.addEventListener("click", handleAddStage);
  removeStageBtn?.addEventListener("click", handleRemoveStage);
  animationEditorBtn?.addEventListener("click", () => {
    if (activeCrop) {
      window.location.href = `/crop-animation-editor.html?crop=${encodeURIComponent(activeCrop)}`;
    }
  });
  layerCanvas?.addEventListener("pointerdown", handleLayerPointerDown);
  layerCanvas?.addEventListener("pointermove", handleLayerPointerMove);
  layerCanvas?.addEventListener("pointerup", handleLayerPointerUp);
  layerCanvas?.addEventListener("pointerleave", handleLayerPointerUp);
  clearLayerMaskBtn?.addEventListener("click", clearLayerMask);
  traceLayerBtn?.addEventListener("click", () => void handleTraceLayer());
  saveLayerCompositeBtn?.addEventListener("click", () => void handleSaveLayerComposite());
  layerStageSelect?.addEventListener("change", renderLayerCompositePreview);
  toggleTraceParamsBtn?.addEventListener("click", toggleTraceParameters);

  const presetSelect = document.getElementById("preset-select") as HTMLSelectElement | null;
  presetSelect?.addEventListener("change", () => {
    if (presetSelect.value !== "custom") {
      applyPreset(presetSelect.value);
    }
  });

  [
    "color-precision",
    "filter-speckle",
    "gradient-step",
    "corner-threshold",
    "segment-length",
    "splice-threshold"
  ].forEach((paramId) => {
    const slider = document.getElementById(`param-${paramId}`) as HTMLInputElement | null;
    const valueDisplay = document.getElementById(`val-${paramId}`);
    slider?.addEventListener("input", () => {
      if (valueDisplay) {
        valueDisplay.textContent = slider.value;
      }
      if (presetSelect) {
        presetSelect.value = "custom";
      }
    });
  });
}

function populateCropDropdown() {
  const cropSelect = document.getElementById("crop-select") as HTMLSelectElement | null;
  if (!cropSelect) return;

  cropSelect.innerHTML = `<option value="">-- Chon crop --</option>${cropsList
    .map((crop) => `<option value="${crop.name.toLowerCase()}">${crop.name}</option>`)
    .join("")}`;
}

async function handleCropSelection(cropName: string) {
  activeCrop = cropName;
  mappedStages = {};
  targetStages = [...defaultStages];
  resetPngSelection();
  resetLayerWorkflow();
  syncAnimationEditorButton();

  if (!activeCrop) {
    renderStagesSidebar();
    showStatus("info", "Chon crop de bat dau.");
    return;
  }

  showStatus("loading", `Dang tai cau hinh ${activeCrop}...`);

  try {
    const crop = cropsList.find((item) => item.name.toLowerCase() === activeCrop);
    renderPngOptions(crop?.pngs || []);
    await loadExistingMeta(activeCrop);
    renderStagesSidebar();
    showStatus("info", "Chon PNG, ve lasso quanh mot phan anh, roi trace thanh layer.");
  } catch (error: any) {
    showStatus("error", `Khong the tai crop: ${error.message}`);
  }
}

function resetPngSelection() {
  const pngSelect = document.getElementById("png-select") as HTMLSelectElement | null;
  if (pngSelect) {
    pngSelect.innerHTML = `<option value="">-- Chon PNG --</option>`;
  }
}

function renderPngOptions(pngs: string[]) {
  const pngSelect = document.getElementById("png-select") as HTMLSelectElement | null;
  if (!pngSelect) return;

  pngSelect.innerHTML = `<option value="">-- Chon PNG --</option>${pngs
    .map((pngPath) => {
      const filename = pngPath.split("/").pop() || pngPath;
      return `<option value="${pngPath}">${filename}</option>`;
    })
    .join("")}`;
}

async function loadExistingMeta(cropName: string) {
  const metaResponse = await fetch(`/src/assets/crops/${cropName}/meta.json`);
  const contentType = metaResponse.headers.get("content-type") || "";
  if (!metaResponse.ok || !contentType.includes("application/json")) {
    return;
  }

  const meta = await metaResponse.json();
  if (!meta?.stages) {
    return;
  }

  mappedStages = meta.stages;
  targetStages = Array.from(new Set([...defaultStages, ...Object.keys(meta.stages)]));
  sortStages();
}

async function handlePngSelection() {
  const pngSelect = document.getElementById("png-select") as HTMLSelectElement | null;
  const pngPath = pngSelect?.value || "";

  resetLayerWorkflow();

  if (!pngPath) {
    showStatus("info", "Chon PNG de ve lasso layer.");
    return;
  }

  try {
    await loadLayerTraceImage(pngPath);
    showStatus("info", "Ve lasso quanh mot phan anh, dat label, roi bam Trace Layer.");
  } catch (error: any) {
    showStatus("error", `Khong the tai PNG: ${error.message}`);
  }
}

function toggleTraceParameters() {
  const traceParameters = document.querySelector(".trace-parameters");
  const toggleButton = document.getElementById("toggle-trace-params-btn") as HTMLButtonElement | null;
  if (!traceParameters || !toggleButton) return;

  const isCollapsed = traceParameters.classList.toggle("is-collapsed");
  toggleButton.setAttribute("aria-expanded", String(!isCollapsed));
  toggleButton.textContent = isCollapsed ? "Mo tham so" : "Thu gon";
}

function getSliderParams(): TraceParams {
  return {
    colormode: "color",
    mode: "spline",
    hierarchical: "cutout",
    color_precision: readNumberInput("param-color-precision", 5),
    filter_speckle: readNumberInput("param-filter-speckle", 12),
    gradient_step: readNumberInput("param-gradient-step", 24),
    corner_threshold: readNumberInput("param-corner-threshold", 60),
    segment_length: readNumberInput("param-segment-length", 6),
    splice_threshold: readNumberInput("param-splice-threshold", 45),
    path_precision: 3
  };
}

function readNumberInput(id: string, fallback: number): number {
  const input = document.getElementById(id) as HTMLInputElement | null;
  return input ? Number(input.value) : fallback;
}

async function loadLayerTraceImage(pngPath: string) {
  layerTraceImage = await loadImage(`/${pngPath}`);
  layerLassoPoints = [];
  const canvas = document.getElementById("layer-mask-canvas") as HTMLCanvasElement | null;
  if (!canvas || !layerTraceImage) return;

  canvas.width = layerTraceImage.naturalWidth;
  canvas.height = layerTraceImage.naturalHeight;
  canvas.parentElement?.classList.add("has-image");
  drawLayerMaskCanvas();
  updateLayerTraceButtons();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load image: ${src}`));
    image.src = src;
  });
}

function handleLayerPointerDown(event: PointerEvent) {
  if (!layerTraceImage) return;
  const canvas = event.currentTarget as HTMLCanvasElement;
  canvas.setPointerCapture(event.pointerId);
  layerLassoPoints = [readCanvasPoint(canvas, event)];
  isDrawingLayerMask = true;
  drawLayerMaskCanvas();
  updateLayerTraceButtons();
}

function handleLayerPointerMove(event: PointerEvent) {
  if (!isDrawingLayerMask || !layerTraceImage) return;
  const canvas = event.currentTarget as HTMLCanvasElement;
  const nextPoint = readCanvasPoint(canvas, event);
  const previousPoint = layerLassoPoints[layerLassoPoints.length - 1];
  if (!previousPoint || Math.hypot(nextPoint.x - previousPoint.x, nextPoint.y - previousPoint.y) >= 3) {
    layerLassoPoints.push(nextPoint);
    drawLayerMaskCanvas();
  }
}

function handleLayerPointerUp(event: PointerEvent) {
  if (!isDrawingLayerMask) return;
  const canvas = event.currentTarget as HTMLCanvasElement;
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
  isDrawingLayerMask = false;
  drawLayerMaskCanvas();
  updateLayerTraceButtons();
}

function readCanvasPoint(canvas: HTMLCanvasElement, event: PointerEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height
  };
}

function drawLayerMaskCanvas() {
  const canvas = document.getElementById("layer-mask-canvas") as HTMLCanvasElement | null;
  if (!canvas || !layerTraceImage) return;
  const context = canvas.getContext("2d");
  if (!context) return;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(layerTraceImage, 0, 0, canvas.width, canvas.height);

  if (layerLassoPoints.length === 0) return;

  context.save();
  context.beginPath();
  context.moveTo(layerLassoPoints[0].x, layerLassoPoints[0].y);
  for (const point of layerLassoPoints.slice(1)) {
    context.lineTo(point.x, point.y);
  }
  if (!isDrawingLayerMask && layerLassoPoints.length >= 3) {
    context.closePath();
    context.fillStyle = "rgba(66, 139, 77, 0.22)";
    context.fill();
  }
  context.strokeStyle = "#ffb238";
  context.lineWidth = 4;
  context.setLineDash([12, 8]);
  context.stroke();
  context.restore();
}

function clearLayerMask() {
  layerLassoPoints = [];
  isDrawingLayerMask = false;
  drawLayerMaskCanvas();
  updateLayerTraceButtons();
}

async function handleTraceLayer() {
  if (!layerTraceImage || layerLassoPoints.length < 3) return;
  const imageDataUrl = createMaskedLayerDataUrl();
  if (!imageDataUrl) return;

  const labelInput = document.getElementById("layer-label-input") as HTMLInputElement | null;
  const label = sanitizeLayerLabel(labelInput?.value || "layer");
  showStatus("loading", `Dang trace layer ${label}...`);

  try {
    const response = await fetch("/api/editor/trace-layer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageDataUrl,
        params: getSliderParams()
      })
    });

    if (!response.ok) {
      const errorJson = await response.json();
      throw new Error(errorJson.error || "Trace layer failed.");
    }

    const result = await response.json() as TraceResult;
    layerTraceLayers.push({
      groupId: `${label}-${Date.now()}`,
      label,
      svgText: result.optimizedSvg
    });
    clearLayerMask();
    renderLayerTraceState();
    showStatus("success", `Da trace layer ${label} (${result.metrics.optimized.pathCount} paths).`);
  } catch (error: any) {
    showStatus("error", `Trace layer that bai: ${error.message}`);
  }
}

function createMaskedLayerDataUrl(): string | null {
  if (!layerTraceImage || layerLassoPoints.length < 3) return null;
  const canvas = document.createElement("canvas");
  canvas.width = layerTraceImage.naturalWidth;
  canvas.height = layerTraceImage.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.save();
  context.beginPath();
  context.moveTo(layerLassoPoints[0].x, layerLassoPoints[0].y);
  for (const point of layerLassoPoints.slice(1)) {
    context.lineTo(point.x, point.y);
  }
  context.closePath();
  context.clip();
  context.drawImage(layerTraceImage, 0, 0, canvas.width, canvas.height);
  context.restore();

  return canvas.toDataURL("image/png");
}

async function handleSaveLayerComposite() {
  if (!activeCrop || !layerTraceImage || layerTraceLayers.length === 0) return;
  const stageSelect = document.getElementById("layer-stage-select") as HTMLSelectElement | null;
  const stageId = stageSelect?.value || targetStages[0] || "stage00";
  const compositeSvg = composeCurrentLayerSvg(stageId);

  showStatus("loading", `Dang luu layered SVG cho ${formatStageName(stageId)}...`);

  try {
    const response = await fetch("/api/editor/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cropName: activeCrop,
        stages: {
          [stageId]: compositeSvg
        }
      })
    });

    if (!response.ok) {
      const errorJson = await response.json();
      throw new Error(errorJson.error || "Save failed.");
    }

    mappedStages[stageId] = `${stageId}.svg`;
    renderStagesSidebar();
    showStatus("success", `Da luu layered SVG cho ${formatStageName(stageId)}.`);
  } catch (error: any) {
    showStatus("error", `Luu layered SVG that bai: ${error.message}`);
  }
}

function composeCurrentLayerSvg(stageId: string): string {
  if (!layerTraceImage) {
    throw new Error("No PNG selected.");
  }

  return composeLayeredSvg({
    width: layerTraceImage.naturalWidth,
    height: layerTraceImage.naturalHeight,
    cropId: activeCrop,
    stageId,
    layers: layerTraceLayers
  });
}

function renderLayerTraceState() {
  renderLayerStageOptions();
  renderLayerList();
  renderLayerCompositePreview();
  updateLayerTraceButtons();
}

function renderLayerStageOptions() {
  const select = document.getElementById("layer-stage-select") as HTMLSelectElement | null;
  if (!select) return;
  const fallbackStage = targetStages.find((stage) => stage === "stage03") || targetStages[0] || "stage00";
  const currentValue = targetStages.includes(select.value) ? select.value : fallbackStage;

  select.innerHTML = targetStages
    .map((stageId) => `<option value="${stageId}" ${stageId === currentValue ? "selected" : ""}>${formatStageName(stageId)}</option>`)
    .join("");
}

function renderLayerList() {
  const list = document.getElementById("layer-list");
  if (!list) return;

  if (layerTraceLayers.length === 0) {
    list.innerHTML = `<p class="placeholder-text">Chua co layer nao.</p>`;
    return;
  }

  list.innerHTML = layerTraceLayers.map((layer, index) => `
    <div class="layer-row" draggable="true" data-layer-index="${index}">
      <div class="layer-row-left">
        <span class="drag-handle" title="Keo de sap xep">⋮⋮</span>
        <span class="layer-label-text" data-layer-label-index="${index}" title="Double click de doi ten">${index + 1}. ${escapeHtml(layer.label)}</span>
        <span class="rename-icon" data-layer-rename-trigger="${index}" title="Doi ten">✎</span>
      </div>
      <div class="layer-row-right">
        <button class="btn btn-secondary btn-icon sort-btn sort-up" type="button" data-layer-up="${index}" title="Di chuyen len" ${index === 0 ? "disabled" : ""}>↑</button>
        <button class="btn btn-secondary btn-icon sort-btn sort-down" type="button" data-layer-down="${index}" title="Di chuyen xuong" ${index === layerTraceLayers.length - 1 ? "disabled" : ""}>↓</button>
        <button class="btn btn-secondary btn-icon delete-btn" type="button" data-layer-delete="${index}" title="Xoa layer">x</button>
      </div>
    </div>
  `).join("");

  list.querySelectorAll<HTMLButtonElement>("[data-layer-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      layerTraceLayers.splice(Number(button.dataset.layerDelete), 1);
      renderLayerTraceState();
    });
  });

  list.querySelectorAll<HTMLButtonElement>("[data-layer-up]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.layerUp);
      if (index > 0) {
        const temp = layerTraceLayers[index];
        layerTraceLayers[index] = layerTraceLayers[index - 1];
        layerTraceLayers[index - 1] = temp;
        renderLayerTraceState();
      }
    });
  });

  list.querySelectorAll<HTMLButtonElement>("[data-layer-down]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.layerDown);
      if (index < layerTraceLayers.length - 1) {
        const temp = layerTraceLayers[index];
        layerTraceLayers[index] = layerTraceLayers[index + 1];
        layerTraceLayers[index + 1] = temp;
        renderLayerTraceState();
      }
    });
  });

  list.querySelectorAll<HTMLElement>("[data-layer-label-index], [data-layer-rename-trigger]").forEach((el) => {
    const isTrigger = el.hasAttribute("data-layer-rename-trigger");
    const index = Number(isTrigger ? el.getAttribute("data-layer-rename-trigger") : el.getAttribute("data-layer-label-index"));

    const eventType = isTrigger ? "click" : "dblclick";
    el.addEventListener(eventType, () => {
      startInlineRename(index);
    });
  });

  const rows = list.querySelectorAll<HTMLDivElement>(".layer-row");
  rows.forEach((row) => {
    const index = Number(row.dataset.layerIndex);

    row.addEventListener("dragstart", (e) => {
      draggedIndex = index;
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
      }
      row.classList.add("is-dragging");
    });

    row.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (draggedIndex !== null && draggedIndex !== index) {
        row.classList.add("is-drag-over");
      }
    });

    row.addEventListener("dragleave", () => {
      row.classList.remove("is-drag-over");
    });

    row.addEventListener("drop", (e) => {
      e.preventDefault();
      row.classList.remove("is-drag-over");
      if (draggedIndex !== null && draggedIndex !== index) {
        const draggedItem = layerTraceLayers[draggedIndex];
        layerTraceLayers.splice(draggedIndex, 1);
        layerTraceLayers.splice(index, 0, draggedItem);
        draggedIndex = null;
        renderLayerTraceState();
      }
    });

    row.addEventListener("dragend", () => {
      rows.forEach((r) => {
        r.classList.remove("is-dragging");
        r.classList.remove("is-drag-over");
      });
      draggedIndex = null;
    });
  });
}

function startInlineRename(index: number) {
  const list = document.getElementById("layer-list");
  if (!list) return;

  const row = list.querySelector(`.layer-row[data-layer-index="${index}"]`) as HTMLDivElement | null;
  if (!row) return;

  row.setAttribute("draggable", "false");
  row.classList.add("is-editing");

  const rowLeft = row.querySelector(".layer-row-left");
  if (!rowLeft) return;

  const originalLabel = layerTraceLayers[index].label;

  rowLeft.innerHTML = `
    <span class="drag-handle" style="visibility: hidden">⋮⋮</span>
    <span class="layer-index-indicator">${index + 1}. </span>
    <input type="text" class="form-control layer-rename-input" value="${escapeHtml(originalLabel)}" />
  `;

  const input = rowLeft.querySelector(".layer-rename-input") as HTMLInputElement | null;
  if (input) {
    input.focus();
    input.select();

    let finished = false;

    const saveRename = () => {
      if (finished) return;
      finished = true;
      const newVal = sanitizeLayerLabel(input.value);
      layerTraceLayers[index].label = newVal;
      renderLayerTraceState();
    };

    const cancelRename = () => {
      if (finished) return;
      finished = true;
      renderLayerTraceState();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveRename();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelRename();
      }
    });

    input.addEventListener("blur", () => {
      saveRename();
    });
  }
}

function renderLayerCompositePreview() {
  const preview = document.getElementById("layer-composite-preview");
  if (!preview) return;

  if (!layerTraceImage || layerTraceLayers.length === 0) {
    preview.innerHTML = `<p class="placeholder-text">Composite SVG preview se hien thi o day.</p>`;
    return;
  }

  const stageId = (document.getElementById("layer-stage-select") as HTMLSelectElement | null)?.value || targetStages[0] || "stage00";
  preview.innerHTML = composeCurrentLayerSvg(stageId);
}

function updateLayerTraceButtons() {
  const traceBtn = document.getElementById("trace-layer-btn") as HTMLButtonElement | null;
  const saveBtn = document.getElementById("save-layer-composite-btn") as HTMLButtonElement | null;
  if (traceBtn) {
    traceBtn.disabled = !layerTraceImage || layerLassoPoints.length < 3;
  }
  if (saveBtn) {
    saveBtn.disabled = !layerTraceImage || layerTraceLayers.length === 0;
  }
}

function resetLayerWorkflow() {
  layerTraceImage = null;
  layerLassoPoints = [];
  layerTraceLayers = [];
  isDrawingLayerMask = false;
  const canvas = document.getElementById("layer-mask-canvas") as HTMLCanvasElement | null;
  if (canvas) {
    const context = canvas.getContext("2d");
    context?.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
    canvas.parentElement?.classList.remove("has-image");
  }
  renderLayerTraceState();
}

function renderStagesSidebar() {
  const stagesList = document.getElementById("stages-list");
  const totalStagesBadge = document.getElementById("total-stages-badge");

  if (totalStagesBadge) {
    totalStagesBadge.textContent = activeCrop ? String(targetStages.length) : "0";
  }
  renderLayerStageOptions();

  if (!stagesList) return;
  if (!activeCrop) {
    stagesList.innerHTML = `<li class="placeholder-text stage-placeholder">Chua chon crop</li>`;
    return;
  }

  stagesList.innerHTML = targetStages.map((stageId) => {
    const isMapped = Boolean(mappedStages[stageId]);
    const filename = mappedStages[stageId] || "Chua gan";
    return `
      <li class="stage-item ${isMapped ? "is-mapped" : ""}" data-stage-id="${stageId}">
        <span class="stage-name">
          <span class="stage-dot ${isMapped ? "is-mapped" : ""}"></span>
          ${formatStageName(stageId)}
        </span>
        <span class="stage-badge">${escapeHtml(filename)}</span>
      </li>
    `;
  }).join("");
}

function handleAddStage() {
  if (!activeCrop) return;
  const nextNum = targetStages.reduce((max, stageId) => {
    const match = stageId.match(/^stage(\d+)$/);
    return match ? Math.max(max, Number(match[1]) + 1) : max;
  }, 0);
  targetStages.push(`stage${String(nextNum).padStart(2, "0")}`);
  sortStages();
  renderStagesSidebar();
  renderLayerTraceState();
}

function handleRemoveStage() {
  if (!activeCrop || targetStages.length <= 1) return;
  const removableStages = targetStages.filter((stageId) => stageId !== "dead");
  const stageToRemove = removableStages[removableStages.length - 1] || targetStages[targetStages.length - 1];
  targetStages = targetStages.filter((stageId) => stageId !== stageToRemove);
  delete mappedStages[stageToRemove];
  renderStagesSidebar();
  renderLayerTraceState();
}

function sortStages() {
  targetStages.sort((a, b) => {
    if (a === "dead") return 1;
    if (b === "dead") return -1;
    const matchA = a.match(/^stage(\d+)$/);
    const matchB = b.match(/^stage(\d+)$/);
    if (matchA && matchB) {
      return Number(matchA[1]) - Number(matchB[1]);
    }
    return a.localeCompare(b);
  });
}

function syncAnimationEditorButton() {
  const animationEditorBtn = document.getElementById("open-animation-editor-btn") as HTMLButtonElement | null;
  if (animationEditorBtn) {
    animationEditorBtn.disabled = !activeCrop;
  }
}

function sanitizeLayerLabel(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "layer";
}

function formatStageName(stageId: string): string {
  if (stageId.startsWith("stage")) return `Stage ${stageId.replace("stage", "")}`;
  return stageId.charAt(0).toUpperCase() + stageId.slice(1);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showStatus(type: "loading" | "success" | "error" | "info", message: string) {
  const footerStatus = document.getElementById("footer-status");
  if (!footerStatus) return;

  footerStatus.innerHTML = `
    <span class="status-icon ${type}">${type === "loading" ? "..." : type === "success" ? "OK" : type === "error" ? "ERR" : "i"}</span>
    <span class="status-message">${message}</span>
  `;
}

function applyPreset(presetName: string) {
  const presetSelect = document.getElementById("preset-select") as HTMLSelectElement | null;
  if (presetSelect) {
    presetSelect.value = presetName;
  }

  const params = vtracerPresets[presetName];
  if (!params) return;

  setInputValueAndLabel("color-precision", params.color_precision);
  setInputValueAndLabel("filter-speckle", params.filter_speckle);
  setInputValueAndLabel("gradient-step", params.gradient_step);
  setInputValueAndLabel("corner-threshold", params.corner_threshold);
  setInputValueAndLabel("segment-length", params.segment_length);
  setInputValueAndLabel("splice-threshold", params.splice_threshold);
}

function setInputValueAndLabel(idSuffix: string, value: any) {
  if (value === undefined) return;
  const slider = document.getElementById(`param-${idSuffix}`) as HTMLInputElement | null;
  const display = document.getElementById(`val-${idSuffix}`);
  if (slider) {
    slider.value = String(value);
  }
  if (display) {
    display.textContent = String(value);
  }
}
