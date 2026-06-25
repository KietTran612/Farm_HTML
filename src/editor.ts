import "./styles/editor.scss";
import { composeLayeredSvg, prefixInternalIds, sanitizeToken, type SvgLayerInput } from "./layer-trace/layerComposer";
import { parseLayeredSvg } from "./layer-trace/layerParser";
import { toUnscaledCanvasPoint } from "./layer-trace/layerViewport";
import { drawStrokeOnMask, clearMask } from "./layer-trace/brushMask";
import { parsePsdFile, createFullSizeLayerPng, type FlatPsdLayer } from "./layer-trace/psdParser";
import { getInitialPsdLayerSelectedState, getImportedPsdLayerHiddenState, setPsdLayerCheckboxSelection } from "./layer-trace/psdImportSelection";


interface CropFolder {
  name: string;
  pngs: string[];
}

interface Crop {
  name: string;
  folders: CropFolder[];
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
  },
  hybridDetailedCandidate: {
    isHybrid: 1
  }
};

const defaultStages = ["stage00", "stage01", "stage02", "stage03", "dead"];

let activeCrop = "";
let cropsList: Crop[] = [];
let targetStages = [...defaultStages];
let mappedStages: Record<string, string> = {};
let layerTraceImage: HTMLImageElement | null = null;
let layerTraceSize: { width: number; height: number } | null = null;
let layerLassoPoints: Array<{ x: number; y: number }> = [];
let isDrawingLayerMask = false;
let layerTraceLayers: SvgLayerInput[] = [];
let draggedIndex: number | null = null;
let layerTraceZoom = 1;
let isMergeMode = false;
let mergeSelectedIndices = new Set<number>();
let activeTool: "lasso" | "brush" | "eraser" = "lasso";
let brushSize = 15;
let brushMaskCanvas: HTMLCanvasElement | null = null;
let brushMaskCtx: CanvasRenderingContext2D | null = null;
let tintCanvas: HTMLCanvasElement | null = null;
let tintCtx: CanvasRenderingContext2D | null = null;
let lastBrushPoint: { x: number; y: number } | null = null;
let lastMousePosition: { x: number; y: number } | null = null;
let isFocusMode = false;
let activeInputMode: "png" | "psd" = "png";
let loadedPsdLayers: FlatPsdLayer[] = [];
let psdWidth = 0;
let psdHeight = 0;
let psdFileName = "";
let selectedPsdFile: File | null = null;
let projectPath = "";

const layerTraceZoomMin = 1;
const layerTraceZoomMax = 4;
const layerTraceZoomStep = 0.25;

document.addEventListener("DOMContentLoaded", () => {
  setupUIEventListeners();
  void initEditor();
});

async function initEditor() {
  showStatus("loading", "Dang tai danh sach crop...");

  try {
    // Fetch the absolute project path dynamically from the server
    const pathResponse = await fetch("/api/editor/project-path");
    if (pathResponse.ok) {
      const pathData = await pathResponse.json() as { projectPath: string };
      projectPath = pathData.projectPath;
    }

    const cropsResponse = await fetch("/api/editor/crops");
    if (!cropsResponse.ok) {
      throw new Error("Khong the tai danh sach crop.");
    }

    cropsList = await cropsResponse.json() as Crop[];
    populateCropDropdown();

    // Automatically select the first crop by default
    if (cropsList.length > 0) {
      const firstCrop = cropsList[0].name.toLowerCase();
      const cropSelect = document.getElementById("crop-select") as HTMLSelectElement | null;
      if (cropSelect) {
        cropSelect.value = firstCrop;
      }
      await handleCropSelection(firstCrop);
    }

    renderStagesSidebar();
    renderLayerTraceState();
    applyPreset("hybridDetailedCandidate");
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
  const zoomOutBtn = document.getElementById("layer-zoom-out-btn") as HTMLButtonElement | null;
  const zoomInBtn = document.getElementById("layer-zoom-in-btn") as HTMLButtonElement | null;
  const zoomResetBtn = document.getElementById("layer-zoom-reset-btn") as HTMLButtonElement | null;
  const mergeLayersBtn = document.getElementById("merge-layers-btn") as HTMLButtonElement | null;
  const cancelMergeBtn = document.getElementById("cancel-merge-btn") as HTMLButtonElement | null;

  mergeLayersBtn?.addEventListener("click", handleMergeButtonClick);
  cancelMergeBtn?.addEventListener("click", handleCancelMerge);

  const folderSelect = document.getElementById("folder-select") as HTMLSelectElement | null;
  folderSelect?.addEventListener("change", () => handleFolderSelection());

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
  layerCanvas?.addEventListener("pointerleave", handleLayerPointerLeave);

  const toolLassoBtn = document.getElementById("tool-lasso-btn") as HTMLButtonElement | null;
  const toolBrushBtn = document.getElementById("tool-brush-btn") as HTMLButtonElement | null;
  const toolEraserBtn = document.getElementById("tool-eraser-btn") as HTMLButtonElement | null;
  const brushSizeInput = document.getElementById("brush-size-input") as HTMLInputElement | null;
  const brushSizeValue = document.getElementById("brush-size-value");

  toolLassoBtn?.addEventListener("click", () => setTool("lasso"));
  toolBrushBtn?.addEventListener("click", () => setTool("brush"));
  toolEraserBtn?.addEventListener("click", () => setTool("eraser"));

  brushSizeInput?.addEventListener("input", () => {
    if (brushSizeInput) {
      brushSize = Number(brushSizeInput.value);
      if (brushSizeValue) brushSizeValue.textContent = `${brushSize}px`;
      drawLayerMaskCanvas();
    }
  });

  clearLayerMaskBtn?.addEventListener("click", clearLayerMask);
  traceLayerBtn?.addEventListener("click", () => void handleTraceLayer());
  saveLayerCompositeBtn?.addEventListener("click", () => void handleSaveLayerComposite());
  layerStageSelect?.addEventListener("change", () => {
    if (layerStageSelect.value) {
      void handleSavedStageSelection(layerStageSelect.value);
    }
  });
  toggleTraceParamsBtn?.addEventListener("click", toggleTraceParameters);
  zoomOutBtn?.addEventListener("click", () => setLayerTraceZoom(layerTraceZoom - layerTraceZoomStep));
  zoomInBtn?.addEventListener("click", () => setLayerTraceZoom(layerTraceZoom + layerTraceZoomStep));
  zoomResetBtn?.addEventListener("click", () => setLayerTraceZoom(1));
  window.addEventListener("resize", applyLayerTraceZoom);

  const toolFocusBtn = document.getElementById("tool-focus-btn") as HTMLButtonElement | null;

  const toggleFocusMode = () => {
    isFocusMode = !isFocusMode;
    const appWrapper = document.querySelector(".editor-app");
    if (appWrapper) {
      appWrapper.classList.toggle("focus-mode", isFocusMode);
    }
    toolFocusBtn?.classList.toggle("active", isFocusMode);

    if (toolFocusBtn) {
      if (isFocusMode) {
        toolFocusBtn.title = "Thu nhỏ khung vẽ (F)";
        toolFocusBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/></svg>`;
      } else {
        toolFocusBtn.title = "Mở rộng khung vẽ (F)";
        toolFocusBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`;
      }
    }

    requestAnimationFrame(() => {
      applyLayerTraceZoom();
    });
  };

  toolFocusBtn?.addEventListener("click", toggleFocusMode);

  window.addEventListener("keydown", (event) => {
    if (activeInputMode !== "png") return;
    const labelInput = document.getElementById("layer-label-input");
    if (document.activeElement === labelInput) return;

    const key = event.key.toLowerCase();
    if (key === "f") {
      event.preventDefault();
      toggleFocusMode();
    } else if (key === "l") {
      setTool("lasso");
    } else if (key === "b") {
      setTool("brush");
    } else if (key === "e") {
      setTool("eraser");
    } else if (key === "[") {
      if (activeTool !== "lasso") {
        brushSize = Math.max(5, brushSize - 2);
        const brushSizeInput = document.getElementById("brush-size-input") as HTMLInputElement | null;
        const brushSizeValue = document.getElementById("brush-size-value");
        if (brushSizeInput) brushSizeInput.value = String(brushSize);
        if (brushSizeValue) brushSizeValue.textContent = `${brushSize}px`;
        drawLayerMaskCanvas();
      }
    } else if (key === "]") {
      if (activeTool !== "lasso") {
        brushSize = Math.min(50, brushSize + 2);
        const brushSizeInput = document.getElementById("brush-size-input") as HTMLInputElement | null;
        const brushSizeValue = document.getElementById("brush-size-value");
        if (brushSizeInput) brushSizeInput.value = String(brushSize);
        if (brushSizeValue) brushSizeValue.textContent = `${brushSize}px`;
        drawLayerMaskCanvas();
      }
    }
  });

  const presetSelect = document.getElementById("preset-select") as HTMLSelectElement | null;
  presetSelect?.addEventListener("change", () => {
    applyPreset(presetSelect.value);
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

  // PSD Input Mode Switcher listeners
  const modePngBtn = document.getElementById("mode-png-btn");
  const modePsdBtn = document.getElementById("mode-psd-btn");
  modePngBtn?.addEventListener("click", () => setInputMode("png"));
  modePsdBtn?.addEventListener("click", () => setInputMode("psd"));

  setupPsdEventListeners();
}

function populateCropDropdown() {
  const cropSelect = document.getElementById("crop-select") as HTMLSelectElement | null;
  if (!cropSelect || cropsList.length === 0) return;

  cropSelect.innerHTML = cropsList
    .map((crop) => `<option value="${crop.name.toLowerCase()}">${crop.name}</option>`)
    .join("");
}

async function handleCropSelection(cropName: string) {
  activeCrop = cropName;
  mappedStages = {};
  targetStages = [...defaultStages];
  resetFolderSelection();
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
    if (crop && crop.folders) {
      renderFolderOptions(crop.folders);

      // Mặc định chọn thư mục gốc "[Gốc]" nếu có, nếu không thì chọn thư mục đầu tiên
      let defaultFolder = crop.folders.find(f => f.name === "[Gốc]");
      if (!defaultFolder && crop.folders.length > 0) {
        defaultFolder = crop.folders[0];
      }

      if (defaultFolder) {
        const folderSelect = document.getElementById("folder-select") as HTMLSelectElement | null;
        if (folderSelect) {
          folderSelect.value = defaultFolder.name;
        }
        renderPngOptions(defaultFolder.pngs);
      }
    }
    await loadExistingMeta(activeCrop);
    renderStagesSidebar();
    showStatus("info", "Chon PNG, ve lasso quanh mot phan anh, roi trace thanh layer.");
  } catch (error: any) {
    showStatus("error", `Khong the tai crop: ${error.message}`);
  }
}

function handleFolderSelection() {
  const folderSelect = document.getElementById("folder-select") as HTMLSelectElement | null;
  if (!folderSelect) return;

  const folderName = folderSelect.value;
  resetPngSelection();
  resetLayerWorkflow();

  if (!folderName || !activeCrop) {
    showStatus("info", "Chon folder de hien thi danh sach anh PNG.");
    return;
  }

  const crop = cropsList.find((item) => item.name.toLowerCase() === activeCrop);
  if (!crop) return;

  const folder = crop.folders.find((f) => f.name === folderName);
  if (folder) {
    renderPngOptions(folder.pngs);
  }
  showStatus("info", "Chon PNG trong folder, ve lasso quanh mot phan anh, roi trace thanh layer.");
}

function resetFolderSelection() {
  const folderSelect = document.getElementById("folder-select") as HTMLSelectElement | null;
  if (folderSelect) {
    folderSelect.innerHTML = `<option value="">-- Chon Folder --</option>`;
  }
}

function renderFolderOptions(folders: CropFolder[]) {
  const folderSelect = document.getElementById("folder-select") as HTMLSelectElement | null;
  if (!folderSelect) return;

  folderSelect.innerHTML = folders
    .map((folder) => `<option value="${folder.name}">${folder.name}</option>`)
    .join("");
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

  // Initialize brush mask canvas at native resolution
  brushMaskCanvas = document.createElement("canvas");
  brushMaskCanvas.width = layerTraceImage.naturalWidth;
  brushMaskCanvas.height = layerTraceImage.naturalHeight;
  brushMaskCtx = brushMaskCanvas.getContext("2d");
  if (brushMaskCtx) {
    clearMask(brushMaskCtx, brushMaskCanvas.width, brushMaskCanvas.height);
  }

  // Initialize persistent overlay tint canvas to eliminate per-frame GC allocations
  tintCanvas = document.createElement("canvas");
  tintCanvas.width = layerTraceImage.naturalWidth;
  tintCanvas.height = layerTraceImage.naturalHeight;
  tintCtx = tintCanvas.getContext("2d");

  layerTraceZoom = 1;
  layerTraceSize = {
    width: layerTraceImage.naturalWidth,
    height: layerTraceImage.naturalHeight
  };
  canvas.closest(".layer-mask-editor")?.classList.add("has-image");
  applyLayerTraceZoom();
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

  const pt = readCanvasPoint(canvas, event);
  lastMousePosition = pt;

  if (activeTool === "lasso") {
    if (layerLassoPoints.length === 0) {
      layerLassoPoints = [pt];
    } else {
      layerLassoPoints.push(pt);
    }
  } else {
    lastBrushPoint = pt;
    if (brushMaskCtx) {
      drawStrokeOnMask(brushMaskCtx, pt, pt, brushSize, activeTool);
    }
  }

  isDrawingLayerMask = true;
  drawLayerMaskCanvas();
  updateLayerTraceButtons();
}

function handleLayerPointerMove(event: PointerEvent) {
  if (!layerTraceImage) return;
  const canvas = event.currentTarget as HTMLCanvasElement;
  const nextPoint = readCanvasPoint(canvas, event);
  lastMousePosition = nextPoint;

  if (!isDrawingLayerMask) {
    if (activeTool !== "lasso") {
      drawLayerMaskCanvas();
    }
    return;
  }

  if (activeTool === "lasso") {
    const previousPoint = layerLassoPoints[layerLassoPoints.length - 1];
    if (!previousPoint || Math.hypot(nextPoint.x - previousPoint.x, nextPoint.y - previousPoint.y) >= 3) {
      layerLassoPoints.push(nextPoint);
      drawLayerMaskCanvas();
    }
  } else {
    if (brushMaskCtx && lastBrushPoint) {
      drawStrokeOnMask(brushMaskCtx, lastBrushPoint, nextPoint, brushSize, activeTool);
      lastBrushPoint = nextPoint;
      drawLayerMaskCanvas();
    }
  }
}

function handleLayerPointerUp(event: PointerEvent) {
  if (!isDrawingLayerMask) return;
  const canvas = event.currentTarget as HTMLCanvasElement;
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
  isDrawingLayerMask = false;
  lastBrushPoint = null;
  drawLayerMaskCanvas();
  updateLayerTraceButtons();
}

function handleLayerPointerLeave(event: PointerEvent) {
  lastMousePosition = null;
  handleLayerPointerUp(event);
}

function readCanvasPoint(canvas: HTMLCanvasElement, event: PointerEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return toUnscaledCanvasPoint(
    { clientX: event.clientX, clientY: event.clientY },
    rect,
    { width: canvas.width, height: canvas.height }
  );
}

function setLayerTraceZoom(nextZoom: number) {
  layerTraceZoom = Math.min(layerTraceZoomMax, Math.max(layerTraceZoomMin, nextZoom));
  applyLayerTraceZoom();
}

function applyLayerTraceZoom() {
  const editor = document.querySelector<HTMLElement>(".layer-mask-editor");
  const canvas = document.getElementById("layer-mask-canvas") as HTMLCanvasElement | null;
  const zoomValue = document.getElementById("layer-zoom-value");
  const zoomOutBtn = document.getElementById("layer-zoom-out-btn") as HTMLButtonElement | null;
  const zoomInBtn = document.getElementById("layer-zoom-in-btn") as HTMLButtonElement | null;
  const zoomResetBtn = document.getElementById("layer-zoom-reset-btn") as HTMLButtonElement | null;

  if (!editor || !canvas || !layerTraceImage || canvas.width === 0 || canvas.height === 0) {
    if (zoomValue) {
      zoomValue.textContent = "100%";
    }
    [zoomOutBtn, zoomInBtn, zoomResetBtn].forEach((button) => {
      if (button) {
        button.disabled = true;
      }
    });
    return;
  }

  const availableWidth = Math.max(1, editor.clientWidth - 24);
  const availableHeight = Math.max(1, editor.clientHeight - 24);
  const fitScale = Math.min(availableWidth / canvas.width, availableHeight / canvas.height, 1);
  const displayWidth = Math.round(canvas.width * fitScale * layerTraceZoom);
  const displayHeight = Math.round(canvas.height * fitScale * layerTraceZoom);

  editor.style.setProperty("--layer-mask-display-width", `${displayWidth}px`);
  editor.style.setProperty("--layer-mask-display-height", `${displayHeight}px`);
  editor.classList.toggle("is-zoomed", layerTraceZoom > 1);

  if (zoomValue) {
    zoomValue.textContent = `${Math.round(layerTraceZoom * 100)}%`;
  }
  if (zoomOutBtn) {
    zoomOutBtn.disabled = layerTraceZoom <= layerTraceZoomMin;
  }
  if (zoomInBtn) {
    zoomInBtn.disabled = layerTraceZoom >= layerTraceZoomMax;
  }
  if (zoomResetBtn) {
    zoomResetBtn.disabled = layerTraceZoom === 1;
  }
}

function drawLayerMaskCanvas() {
  if (activeInputMode !== "png") return;
  const canvas = document.getElementById("layer-mask-canvas") as HTMLCanvasElement | null;
  if (!canvas || !layerTraceImage) return;
  const context = canvas.getContext("2d");
  if (!context) return;

  // 1. Draw original crop image
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(layerTraceImage, 0, 0, canvas.width, canvas.height);

  // 2. Draw the brush selection overlay using the persistent offscreen tintCanvas
  if (brushMaskCanvas && tintCanvas && tintCtx) {
    context.save();
    context.globalAlpha = 0.35;

    // Refresh the green tinted mask on our persistent cache canvas
    tintCtx.save();
    tintCtx.globalCompositeOperation = "source-over"; // Reset to default first!
    tintCtx.clearRect(0, 0, tintCanvas.width, tintCanvas.height);
    tintCtx.drawImage(brushMaskCanvas, 0, 0);
    tintCtx.globalCompositeOperation = "source-in";
    tintCtx.fillStyle = "#428b4d"; // Premium Forest Green tint
    tintCtx.fillRect(0, 0, tintCanvas.width, tintCanvas.height);
    tintCtx.restore();

    // Draw onto the main viewport canvas
    context.drawImage(tintCanvas, 0, 0);
    context.restore();
  }

  // 3. Draw the lasso path (only if lasso tool is active)
  if (activeTool === "lasso" && layerLassoPoints.length > 0) {
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
      context.strokeStyle = "#428b4d";
      context.lineWidth = 1.5;
      context.stroke();
    } else if (isDrawingLayerMask && layerLassoPoints.length >= 2) {
      context.strokeStyle = "#428b4d";
      context.lineWidth = 1.5;
      context.stroke();
    }
    context.restore();
  }

  // 4. Draw the high-contrast circular brush cursor preview (if hovering and brush/eraser is active)
  if (activeTool !== "lasso" && lastMousePosition) {
    context.save();
    // Inner white circle
    context.beginPath();
    context.arc(lastMousePosition.x, lastMousePosition.y, brushSize, 0, Math.PI * 2);
    context.strokeStyle = "rgba(255, 255, 255, 0.85)";
    context.lineWidth = 1.5;
    context.stroke();

    // Outer dashed black circle for high contrast against any background color
    context.beginPath();
    context.arc(lastMousePosition.x, lastMousePosition.y, brushSize, 0, Math.PI * 2);
    context.strokeStyle = "rgba(0, 0, 0, 0.65)";
    context.lineWidth = 1;
    context.setLineDash([3, 3]);
    context.stroke();
    context.restore();
  }
}

function setTool(tool: "lasso" | "brush" | "eraser") {
  activeTool = tool;
  const toolLassoBtn = document.getElementById("tool-lasso-btn") as HTMLButtonElement | null;
  const toolBrushBtn = document.getElementById("tool-brush-btn") as HTMLButtonElement | null;
  const toolEraserBtn = document.getElementById("tool-eraser-btn") as HTMLButtonElement | null;
  const brushSizeContainer = document.getElementById("brush-size-container");

  [toolLassoBtn, toolBrushBtn, toolEraserBtn].forEach((btn) => btn?.classList.remove("active"));

  if (tool === "lasso") {
    toolLassoBtn?.classList.add("active");
    if (brushSizeContainer) brushSizeContainer.style.display = "none";
    if (brushMaskCtx && brushMaskCanvas) {
      clearMask(brushMaskCtx, brushMaskCanvas.width, brushMaskCanvas.height);
    }
  } else {
    if (tool === "brush") {
      toolBrushBtn?.classList.add("active");
    } else if (tool === "eraser") {
      toolEraserBtn?.classList.add("active");
    }
    if (brushSizeContainer) brushSizeContainer.style.display = "flex";
    layerLassoPoints = [];
  }
  drawLayerMaskCanvas();
  updateLayerTraceButtons();
}

function clearLayerMask() {
  layerLassoPoints = [];
  isDrawingLayerMask = false;
  if (brushMaskCtx && brushMaskCanvas) {
    clearMask(brushMaskCtx, brushMaskCanvas.width, brushMaskCanvas.height);
  }
  drawLayerMaskCanvas();
  updateLayerTraceButtons();
}

async function handleTraceLayer() {
  const hasLasso = activeTool === "lasso" && layerLassoPoints.length >= 3;
  const hasBrush = activeTool !== "lasso";
  if (!layerTraceImage || (!hasLasso && !hasBrush)) return;

  const imageDataUrl = createMaskedLayerDataUrl();
  if (!imageDataUrl) return;

  const labelInput = document.getElementById("layer-label-input") as HTMLInputElement | null;
  const label = sanitizeLayerLabel(labelInput?.value || "layer");
  showStatus("loading", `Dang trace layer ${label}...`);

  try {
    const presetSelect = document.getElementById("preset-select") as HTMLSelectElement | null;
    const response = await fetch("/api/editor/trace-layer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageDataUrl,
        preset: presetSelect?.value || "custom",
        params: getSliderParams()
      })
    });

    if (!response.ok) {
      const errorJson = await response.json();
      throw new Error(errorJson.error || "Trace layer failed.");
    }

    const result = await response.json() as TraceResult;
    layerTraceLayers.push({
      groupId: createLayerGroupId(label),
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
  if (!layerTraceImage) return null;
  const canvas = document.createElement("canvas");
  canvas.width = layerTraceImage.naturalWidth;
  canvas.height = layerTraceImage.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.save();
  if (activeTool === "lasso") {
    if (layerLassoPoints.length < 3) return null;
    context.beginPath();
    context.moveTo(layerLassoPoints[0].x, layerLassoPoints[0].y);
    for (const point of layerLassoPoints.slice(1)) {
      context.lineTo(point.x, point.y);
    }
    context.closePath();
    context.clip();
    context.drawImage(layerTraceImage, 0, 0, canvas.width, canvas.height);
  } else {
    if (!brushMaskCanvas) return null;
    context.drawImage(brushMaskCanvas, 0, 0);
    context.globalCompositeOperation = "source-in";
    context.drawImage(layerTraceImage, 0, 0, canvas.width, canvas.height);
  }
  context.restore();

  return canvas.toDataURL("image/png");
}

async function handleSaveLayerComposite() {
  if (!activeCrop || !layerTraceSize || layerTraceLayers.length === 0) return;
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
  if (!layerTraceSize) {
    throw new Error("No layer source loaded.");
  }

  return composeLayerSvg(stageId, layerTraceLayers);
}

function composeVisibleLayerSvg(stageId: string): string {
  if (!layerTraceSize) {
    throw new Error("No layer source loaded.");
  }

  return composeLayerSvg(stageId, layerTraceLayers.filter((layer) => !layer.hidden));
}

function composeLayerSvg(stageId: string, layers: SvgLayerInput[]): string {
  if (!layerTraceSize) {
    throw new Error("No layer source loaded.");
  }

  return composeLayeredSvg({
    width: layerTraceSize.width,
    height: layerTraceSize.height,
    cropId: activeCrop,
    stageId,
    layers
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

  if (isMergeMode) {
    list.classList.add("is-merge-mode");
  } else {
    list.classList.remove("is-merge-mode");
  }

  if (layerTraceLayers.length === 0) {
    list.innerHTML = `<p class="placeholder-text">Chua co layer nao.</p>`;
    return;
  }

  list.innerHTML = layerTraceLayers.map((layer, index) => `
    <div class="layer-row ${layer.hidden ? "is-hidden" : ""} ${isMergeMode && mergeSelectedIndices.has(index) ? "is-selected-for-merge" : ""}" draggable="${!isMergeMode}" data-layer-index="${index}">
      <div class="layer-row-left">
        <span class="drag-handle" title="Keo de sap xep">⋮⋮</span>
        <button class="layer-visibility-btn" type="button" data-layer-visibility="${index}" aria-pressed="${layer.hidden ? "true" : "false"}" title="${layer.hidden ? "Hien layer" : "An layer"}">
          <span class="layer-visibility-icon" aria-hidden="true"></span>
        </button>
        <span class="layer-label-text" data-layer-label-index="${index}" title="Double click de doi ten">${index + 1}. ${escapeHtml(layer.label)}</span>
        <span class="rename-icon" data-layer-rename-trigger="${index}" title="Doi ten">✎</span>
      </div>
      <div class="layer-row-right">
        <button class="btn btn-secondary btn-icon duplicate-btn" type="button" data-layer-duplicate="${index}" title="Nhan doi layer">
          <span class="duplicate-icon" aria-hidden="true"></span>
        </button>
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

  list.querySelectorAll<HTMLButtonElement>("[data-layer-visibility]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.layerVisibility);
      if (!Number.isFinite(index) || !layerTraceLayers[index]) return;
      layerTraceLayers[index].hidden = !layerTraceLayers[index].hidden;
      renderLayerTraceState();
    });
  });

  list.querySelectorAll<HTMLButtonElement>("[data-layer-duplicate]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.layerDuplicate);
      const sourceLayer = layerTraceLayers[index];
      if (!Number.isFinite(index) || !sourceLayer) return;
      layerTraceLayers.splice(index + 1, 0, duplicateLayer(sourceLayer));
      renderLayerTraceState();
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

  rows.forEach((row) => {
    const index = Number(row.dataset.layerIndex);
    row.addEventListener("click", (event) => {
      if (!isMergeMode) return;
      const target = event.target as HTMLElement;
      if (target.closest("button") || target.closest(".rename-icon")) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (mergeSelectedIndices.has(index)) {
        mergeSelectedIndices.delete(index);
      } else {
        mergeSelectedIndices.add(index);
      }

      const mergeBtn = document.getElementById("merge-layers-btn") as HTMLButtonElement | null;
      if (mergeBtn) {
        mergeBtn.textContent = `Confirm Merge (${mergeSelectedIndices.size})`;
        mergeBtn.disabled = mergeSelectedIndices.size < 2;
      }

      renderLayerTraceState();
    });
  });
}

function startInlineRename(index: number) {
  if (isMergeMode) return;
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
    <span class="layer-visibility-placeholder"></span>
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

  const visibleLayers = layerTraceLayers.filter((layer) => !layer.hidden);
  if (!layerTraceSize || layerTraceLayers.length === 0 || visibleLayers.length === 0) {
    preview.innerHTML = `<p class="placeholder-text">Composite SVG preview se hien thi o day.</p>`;
    return;
  }

  const stageId = (document.getElementById("layer-stage-select") as HTMLSelectElement | null)?.value || targetStages[0] || "stage00";
  preview.innerHTML = composeVisibleLayerSvg(stageId);

  if (isMergeMode) {
    mergeSelectedIndices.forEach((index) => {
      const gEl = preview.querySelector(`g[data-layer-index="${index}"]`);
      if (gEl) {
        gEl.classList.add("is-selected-for-merge");
      }
    });
  }
}

function updateLayerTraceButtons() {
  const traceBtn = document.getElementById("trace-layer-btn") as HTMLButtonElement | null;
  const saveBtn = document.getElementById("save-layer-composite-btn") as HTMLButtonElement | null;
  const mergeBtn = document.getElementById("merge-layers-btn") as HTMLButtonElement | null;
  const cancelBtn = document.getElementById("cancel-merge-btn") as HTMLButtonElement | null;
  const clearBtn = document.getElementById("clear-layer-mask-btn") as HTMLButtonElement | null;

  if (isMergeMode) {
    if (traceBtn) traceBtn.disabled = true;
    if (saveBtn) saveBtn.disabled = true;
    if (clearBtn) clearBtn.disabled = true;

    if (cancelBtn) cancelBtn.hidden = false;

    if (mergeBtn) {
      mergeBtn.disabled = mergeSelectedIndices.size < 2;
      mergeBtn.textContent = `Confirm Merge (${mergeSelectedIndices.size})`;
      mergeBtn.className = "btn btn-success";
    }
  } else {
    if (cancelBtn) cancelBtn.hidden = true;

    if (mergeBtn) {
      mergeBtn.disabled = layerTraceLayers.length < 2;
      mergeBtn.textContent = "Merge Layers";
      mergeBtn.className = "btn btn-secondary";
    }

    if (traceBtn) {
      const hasLasso = activeTool === "lasso" && layerLassoPoints.length >= 3;
      const hasBrush = activeTool !== "lasso";
      traceBtn.disabled = !layerTraceImage || (!hasLasso && !hasBrush);
    }
    if (saveBtn) {
      saveBtn.disabled = !layerTraceSize || layerTraceLayers.length === 0;
    }
    if (clearBtn) {
      clearBtn.disabled = false;
    }
  }
}

function resetLayerWorkflow() {
  layerTraceImage = null;
  layerTraceSize = null;
  layerLassoPoints = [];
  layerTraceLayers = [];
  isDrawingLayerMask = false;
  layerTraceZoom = 1;
  loadedPsdLayers = [];
  psdWidth = 0;
  psdHeight = 0;
  psdFileName = "";
  selectedPsdFile = null;
  const psdFileInput = document.getElementById("psd-file-input") as HTMLInputElement | null;
  if (psdFileInput) psdFileInput.value = "";
  renderPsdWorkspaceState();
  const canvas = document.getElementById("layer-mask-canvas") as HTMLCanvasElement | null;
  if (canvas) {
    const context = canvas.getContext("2d");
    context?.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
    const editor = canvas.closest<HTMLElement>(".layer-mask-editor");
    editor?.classList.remove("has-image");
    editor?.classList.remove("is-zoomed");
    editor?.style.removeProperty("--layer-mask-display-width");
    editor?.style.removeProperty("--layer-mask-display-height");
  }
  applyLayerTraceZoom();
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

  stagesList.querySelectorAll<HTMLElement>("[data-stage-id]").forEach((stageItem) => {
    stageItem.addEventListener("click", () => {
      const stageId = stageItem.getAttribute("data-stage-id") || "";
      void handleSavedStageSelection(stageId);
    });
  });
}

async function handleSavedStageSelection(stageId: string) {
  if (!activeCrop || !stageId) return;

  const stageSelect = document.getElementById("layer-stage-select") as HTMLSelectElement | null;
  if (stageSelect) {
    stageSelect.value = stageId;
  }

  const mappedFile = mappedStages[stageId];
  if (!mappedFile) {
    layerTraceLayers = [];
    if (activeInputMode === "psd" && psdWidth > 0 && psdHeight > 0) {
      layerTraceSize = getPsdTargetDimensions();
    } else {
      layerTraceSize = layerTraceImage
        ? { width: layerTraceImage.naturalWidth, height: layerTraceImage.naturalHeight }
        : null;
    }
    clearLayerMask();
    renderLayerTraceState();
    showStatus("info", `${formatStageName(stageId)} chua co SVG da luu. Trace layer moi roi save vao stage nay.`);
    return;
  }

  showStatus("loading", `Dang tai ${formatStageName(stageId)} da luu...`);

  try {
    const response = await fetch(`/src/assets/crops/${encodeURIComponent(activeCrop)}/${encodeURIComponent(mappedFile)}`);
    if (!response.ok) {
      throw new Error("Khong the tai SVG stage da luu.");
    }

    const parsed = parseLayeredSvg(await response.text());
    layerTraceLayers = parsed.layers;
    if (activeInputMode === "psd" && psdWidth > 0 && psdHeight > 0) {
      layerTraceSize = getPsdTargetDimensions();
    } else {
      layerTraceSize = {
        width: parsed.width,
        height: parsed.height
      };
    }
    layerLassoPoints = [];
    isDrawingLayerMask = false;
    layerTraceZoom = 1;
    applyLayerTraceZoom();
    drawLayerMaskCanvas();
    renderLayerTraceState();
    showStatus("info", `Da mo ${formatStageName(stageId)}. Layer cu co the rename, reorder, delete; lasso goc khong duoc luu.`);
  } catch (error: any) {
    showStatus("error", `Khong the mo stage da luu: ${error.message}`);
  }
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

function createLayerGroupId(label: string): string {
  return `${sanitizeLayerLabel(label)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function duplicateLayer(layer: SvgLayerInput): SvgLayerInput {
  const label = sanitizeLayerLabel(`${layer.label}-copy`);
  return {
    groupId: createLayerGroupId(label),
    label,
    svgText: layer.svgText,
    hidden: layer.hidden
  };
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

  const isHybrid = presetName === "hybridDetailedCandidate";
  const params = vtracerPresets[presetName];
  const isCustom = presetName === "custom";
  if (!params && !isHybrid && !isCustom) return;

  const paramKeysMap: Record<string, string> = {
    "color-precision": "color_precision",
    "filter-speckle": "filter_speckle",
    "gradient-step": "gradient_step",
    "corner-threshold": "corner_threshold",
    "segment-length": "segment_length",
    "splice-threshold": "splice_threshold"
  };

  Object.entries(paramKeysMap).forEach(([idSuffix, key]) => {
    const slider = document.getElementById(`param-${idSuffix}`) as HTMLInputElement | null;
    const display = document.getElementById(`val-${idSuffix}`);
    if (slider) {
      slider.disabled = isHybrid;
      if (!isHybrid && params && params[key] !== undefined) {
        slider.value = String(params[key]);
        if (display) {
          display.textContent = slider.value;
        }
      } else if (isHybrid && display) {
        display.textContent = "Auto";
      } else if (display) {
        display.textContent = slider.value;
      }
    }
  });
}

function handleMergeButtonClick() {
  if (!isMergeMode) {
    isMergeMode = true;
    mergeSelectedIndices.clear();
    clearLayerMask();
    document.body.classList.add("is-merge-mode");
    renderLayerTraceState();
  } else {
    if (mergeSelectedIndices.size < 2) return;
    performMerge();
  }
}

function handleCancelMerge() {
  isMergeMode = false;
  mergeSelectedIndices.clear();
  document.body.classList.remove("is-merge-mode");
  renderLayerTraceState();
}

function readSvgBody(svgText: string): string {
  return svgText.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i)?.[1] || svgText;
}

function performMerge() {
  const sorted = Array.from(mergeSelectedIndices).sort((a, b) => a - b);
  const targetIndex = sorted[0];
  const layersToMerge = sorted.map(idx => layerTraceLayers[idx]);

  const combinedBody = layersToMerge.map(layer => {
    const rawBody = readSvgBody(layer.svgText);
    const prefix = sanitizeToken(layer.groupId);
    return prefixInternalIds(rawBody, prefix);
  }).join("\n");

  const mergedSvgText = `<svg xmlns="http://www.w3.org/2000/svg">${combinedBody}</svg>`;

  layerTraceLayers[targetIndex] = {
    groupId: layerTraceLayers[targetIndex].groupId,
    label: layerTraceLayers[targetIndex].label,
    svgText: mergedSvgText,
    hidden: layersToMerge.every(l => l.hidden)
  };

  for (let i = sorted.length - 1; i > 0; i--) {
    layerTraceLayers.splice(sorted[i], 1);
  }

  isMergeMode = false;
  mergeSelectedIndices.clear();
  document.body.classList.remove("is-merge-mode");
  renderLayerTraceState();
  showStatus("success", `Merged ${sorted.length} layers.`);
}

function setInputMode(mode: "png" | "psd") {
  activeInputMode = mode;

  const pngBtn = document.getElementById("mode-png-btn");
  const psdBtn = document.getElementById("mode-psd-btn");
  const pngSelect = document.getElementById("png-select");
  const maskEditor = document.querySelector(".layer-mask-editor") as HTMLElement | null;
  const psdWorkspace = document.getElementById("psd-workspace");
  const traceLayerBtn = document.getElementById("trace-layer-btn") as HTMLButtonElement | null;
  const clearLassoBtn = document.getElementById("clear-layer-mask-btn") as HTMLButtonElement | null;

  if (pngBtn && psdBtn) {
    if (mode === "png") {
      pngBtn.classList.add("active");
      pngBtn.setAttribute("aria-selected", "true");
      psdBtn.classList.remove("active");
      psdBtn.setAttribute("aria-selected", "false");
    } else {
      psdBtn.classList.add("active");
      psdBtn.setAttribute("aria-selected", "true");
      pngBtn.classList.remove("active");
      pngBtn.setAttribute("aria-selected", "false");
    }
  }

  if (pngSelect) {
    pngSelect.style.display = mode === "png" ? "block" : "none";
  }
  if (maskEditor) {
    maskEditor.style.display = mode === "png" ? "block" : "none";
  }
  if (psdWorkspace) {
    psdWorkspace.style.display = mode === "psd" ? "flex" : "none";
  }

  if (traceLayerBtn) {
    traceLayerBtn.style.display = mode === "png" ? "inline-block" : "none";
  }
  if (clearLassoBtn) {
    clearLassoBtn.style.display = mode === "png" ? "inline-block" : "none";
  }

  if (mode === "png") {
    layerTraceSize = layerTraceImage
      ? { width: layerTraceImage.naturalWidth, height: layerTraceImage.naturalHeight }
      : null;
    showStatus("info", "Chon crop va PNG nguon, sau do dung lasso de trace tung layer.");
  } else {
    if (psdWidth > 0 && psdHeight > 0) {
      layerTraceSize = getPsdTargetDimensions();
    }
    showStatus("info", "Keo tha file PSD de giai nen va nhap layer tu dong.");
    renderPsdWorkspaceState();
  }
  renderLayerTraceState();
}

function setupPsdEventListeners() {
  const dropzone = document.getElementById("psd-dropzone");
  const fileInput = document.getElementById("psd-file-input") as HTMLInputElement | null;
  const importBtn = document.getElementById("psd-import-btn") as HTMLButtonElement | null;
  const selectAllBtn = document.getElementById("psd-select-all-btn");
  const selectNoneBtn = document.getElementById("psd-select-none-btn");
  const ratioSelect = document.getElementById("psd-ratio-select") as HTMLSelectElement | null;

  ratioSelect?.addEventListener("change", () => {
    if (activeInputMode === "psd" && psdWidth > 0 && psdHeight > 0) {
      layerTraceSize = getPsdTargetDimensions();
      renderLayerTraceState();
    }
  });

  dropzone?.addEventListener("click", () => {
    // Auto-copy the selected crop path to clipboard for fast navigation in file dialog
    const cropSelect = document.getElementById("crop-select") as HTMLSelectElement | null;
    const selectedCropName = cropSelect?.options[cropSelect.selectedIndex]?.text || "";
    const folderSelect = document.getElementById("folder-select") as HTMLSelectElement | null;
    const selectedFolder = folderSelect?.value || "";

    if (selectedCropName) {
      const baseDir = projectPath || "d:\\soflware\\Unity\\Source\\Farm_HTML";
      let absolutePath = `${baseDir}\\docs\\Crops\\${selectedCropName}`;
      if (selectedFolder && selectedFolder !== "[Gốc]") {
        absolutePath += `\\${selectedFolder}`;
      }

      navigator.clipboard.writeText(absolutePath).then(() => {
        showStatus("success", `Da sao chep duong dan vao Clipboard! Nhan Ctrl+V vao thanh dia chi cua hop thoai de mo nhanh.`);
      }).catch(err => {
        console.error("Failed to copy path:", err);
      });
    }

    fileInput?.click();
  });

  dropzone?.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone?.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone?.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      void handlePsdFileSelect(files[0]);
    }
  });

  fileInput?.addEventListener("change", () => {
    const files = fileInput.files;
    if (files && files.length > 0) {
      void handlePsdFileSelect(files[0]);
    }
  });

  selectAllBtn?.addEventListener("click", () => {
    setPsdLayersSelection(true);
  });

  selectNoneBtn?.addEventListener("click", () => {
    setPsdLayersSelection(false);
  });

  importBtn?.addEventListener("click", () => {
    void handleBatchPsdTrace();
  });

  const refreshFileBtn = document.getElementById("psd-refresh-file-btn");
  refreshFileBtn?.addEventListener("click", async () => {
    const cropSelect = document.getElementById("crop-select") as HTMLSelectElement | null;
    const selectedCropName = cropSelect?.options[cropSelect.selectedIndex]?.text || "";
    const folderSelect = document.getElementById("folder-select") as HTMLSelectElement | null;
    const selectedFolder = folderSelect?.value || "";

    if (!selectedCropName || !psdFileName) {
      showStatus("error", "Khong the xac dinh file PSD dang mo.");
      return;
    }

    const baseDir = projectPath || "d:\\soflware\\Unity\\Source\\Farm_HTML";
    let absolutePath = `${baseDir}\\docs\\Crops\\${selectedCropName}`;
    if (selectedFolder && selectedFolder !== "[Gốc]") {
      absolutePath += `\\${selectedFolder}`;
    }
    absolutePath += `\\${psdFileName}`;

    showStatus("loading", "Dang doc lai file PSD tu o dia...");

    // Capture current UI states to preserve selections and custom renames
    const preservedStates = capturePsdUiStates();

    try {
      // Append t=timestamp to bust browser cache, and crop/filename for recursive search fallback
      const response = await fetch(
        `/api/editor/read-local-psd?path=${encodeURIComponent(absolutePath)}` +
        `&crop=${encodeURIComponent(selectedCropName)}` +
        `&filename=${encodeURIComponent(psdFileName)}` +
        `&t=${Date.now()}`
      );
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({ error: "Khong the doc file tu o dia." }));
        const errorMessage = errJson.error || `Loi HTTP ${response.status}`;

        if (selectedPsdFile && selectedPsdFile.name === psdFileName) {
          const buffer = await selectedPsdFile.arrayBuffer();
          showStatus("loading", "Dang phan tich lai file PSD dang chon...");
          const result = parsePsdFile(buffer);

          loadedPsdLayers = result.layers;
          psdWidth = result.width;
          psdHeight = result.height;
          layerTraceSize = getPsdTargetDimensions();

          renderPsdWorkspaceState(preservedStates);
          showStatus("success", `Da nap lai file PSD dang chon (${psdWidth}x${psdHeight}px, ${loadedPsdLayers.length} layers).`);
          return;
        }
        
        showStatus("error", `Khong the tu dong tai lai PSD: ${errorMessage}`);
        
        let expectedFolder = `${baseDir}\\docs\\Crops\\${selectedCropName}`;
        if (selectedFolder && selectedFolder !== "[Gốc]") {
          expectedFolder += `\\${selectedFolder}`;
        }
        
        navigator.clipboard.writeText(expectedFolder).then(() => {
          alert(
            `Khong the tu dong tai lai file tu o dia!\n\n` +
            `Duong dan tim kiem: ${absolutePath}\n\n` +
            `De tinh nang tu dong tai lai hoat dong, ban hay luu file PSD cua minh vao dung thu muc crop cua du an:\n` +
            `${expectedFolder}\n\n` +
            `(Duong dan thu muc nay da duoc tu dong sao chep vao Clipboard. Ban chi can Save As PSD vao day trong Photoshop, sau do nhan nut Refresh trong editor de tai lai!)`
          );
        }).catch(() => {
          alert(
            `Khong the tu dong tai lai file tu o dia!\n\n` +
            `Duong dan tim kiem: ${absolutePath}\n\n` +
            `De tinh nang tu dong tai lai hoat dong, ban hay luu file PSD cua minh vao dung thu muc crop cua du an:\n` +
            `${expectedFolder}`
          );
        });
        return;
      }

      const buffer = await response.arrayBuffer();
      showStatus("loading", "Dang phan tich du lieu PSD moi...");
      const result = parsePsdFile(buffer);
      
      loadedPsdLayers = result.layers;
      psdWidth = result.width;
      psdHeight = result.height;
      layerTraceSize = getPsdTargetDimensions();

      renderPsdWorkspaceState(preservedStates);
      showStatus("success", `Da nap lai file PSD tu o dia thanh cong (${psdWidth}x${psdHeight}px, ${loadedPsdLayers.length} layers).`);
    } catch (error: any) {
      showStatus("error", `Loi khi tai lai file PSD: ${error.message}`);
    }
  });

  const changeFileBtn = document.getElementById("psd-change-file-btn");
  changeFileBtn?.addEventListener("click", () => {
    // Also auto-copy the path when selecting a different file
    const cropSelect = document.getElementById("crop-select") as HTMLSelectElement | null;
    const selectedCropName = cropSelect?.options[cropSelect.selectedIndex]?.text || "";
    const folderSelect = document.getElementById("folder-select") as HTMLSelectElement | null;
    const selectedFolder = folderSelect?.value || "";

    if (selectedCropName) {
      const baseDir = projectPath || "d:\\soflware\\Unity\\Source\\Farm_HTML";
      let absolutePath = `${baseDir}\\docs\\Crops\\${selectedCropName}`;
      if (selectedFolder && selectedFolder !== "[Gốc]") {
        absolutePath += `\\${selectedFolder}`;
      }

      navigator.clipboard.writeText(absolutePath).then(() => {
        showStatus("success", `Da sao chep duong dan vao Clipboard! Nhan Ctrl+V vao thanh dia chi cua hop thoai de mo nhanh.`);
      }).catch(err => {
        console.error("Failed to copy path:", err);
      });
    }

    fileInput?.click();
  });
}

async function handlePsdFileSelect(file: File) {
  if (!file.name.toLowerCase().endsWith(".psd")) {
    showStatus("error", "Chi ho tro file Photoshop .psd.");
    return;
  }

  showStatus("loading", "Dang phan tich file PSD...");
  selectedPsdFile = file;
  psdFileName = file.name;

  try {
    const buffer = await file.arrayBuffer();
    const result = parsePsdFile(buffer);

    loadedPsdLayers = result.layers;
    psdWidth = result.width;
    psdHeight = result.height;

    layerTraceSize = getPsdTargetDimensions();

    if (!activeCrop) {
      showStatus("error", "Vui long chon Crop truoc khi nhap PSD.");
      return;
    }

    renderPsdWorkspaceState();
    showStatus("success", `Da nap file ${file.name} (${psdWidth}x${psdHeight}px, ${loadedPsdLayers.length} layers).`);
  } catch (error: any) {
    showStatus("error", `Khong the doc file PSD: ${error.message}`);
  }
}

function capturePsdUiStates(): Map<string, { rename: string }> {
  const states = new Map<string, { rename: string }>();
  const items = document.querySelectorAll(".psd-layer-item");
  items.forEach((item) => {
    const idx = Number((item as HTMLElement).dataset.index);
    const layer = loadedPsdLayers[idx];
    if (layer) {
      const cb = item.querySelector(".psd-layer-checkbox") as HTMLInputElement | null;
      const inp = item.querySelector(".psd-layer-rename-input") as HTMLInputElement | null;
      if (cb && inp) {
        states.set(layer.name, {
          rename: inp.value
        });
      }
    }
  });
  return states;
}

function renderPsdWorkspaceState(preservedStates?: Map<string, { rename: string }>) {
  const dropzoneWrapper = document.getElementById("psd-dropzone-wrapper");
  const panel = document.getElementById("psd-layers-panel");
  const layersList = document.getElementById("psd-layers-list");
  const filename = document.getElementById("psd-filename");
  const dimensions = document.getElementById("psd-dimensions");
  const refreshFileBtn = document.getElementById("psd-refresh-file-btn");

  if (!panel || !dropzoneWrapper || !layersList) return;

  if (loadedPsdLayers.length === 0) {
    dropzoneWrapper.style.display = "flex";
    panel.style.display = "none";
    if (refreshFileBtn) refreshFileBtn.style.display = "none";
    return;
  }

  dropzoneWrapper.style.display = "none";
  panel.style.display = "flex";
  if (refreshFileBtn) refreshFileBtn.style.display = "inline-flex";

  if (filename) filename.textContent = psdFileName;
  if (dimensions) dimensions.textContent = `${psdWidth} x ${psdHeight}px`;

  layersList.innerHTML = "";

  // Render in reverse order (top-to-bottom) to match Photoshop's layers panel layout
  for (let i = loadedPsdLayers.length - 1; i >= 0; i--) {
    const layer = loadedPsdLayers[i];
    const item = document.createElement("div");
    
    // Check if we have preserved states for this layer
    const preserved = preservedStates?.get(layer.name);
    
    // Checked state always follows the freshly parsed PSD visibility on refresh.
    const isChecked = getInitialPsdLayerSelectedState({ sourceHidden: layer.hidden });
    const checkedAttr = isChecked ? "checked" : "";
    
    // Rename value: if preserved exists, use it. Otherwise, default to layer.name
    const renameVal = preserved ? preserved.rename : layer.name;
    
    // UI hidden visual state class
    const isHiddenInUi = !isChecked;
    item.className = `psd-layer-item ${isHiddenInUi ? "is-hidden-layer" : ""}`;
    item.dataset.index = String(i);

    let thumbnailHtml = `<div class="layer-thumbnail-placeholder"></div>`;
    if (layer.canvas) {
      const thumbUrl = getLayerThumbnailUrl(layer.canvas);
      thumbnailHtml = `<img src="${thumbUrl}" class="layer-thumbnail" alt="${layer.name}" />`;
    }

    item.innerHTML = `
      <label class="psd-layer-label-wrapper">
        <input type="checkbox" class="psd-layer-checkbox" data-index="${i}" ${checkedAttr} />
        ${thumbnailHtml}
        <div class="psd-layer-info-group">
          <span class="psd-layer-name" title="${layer.name}">${layer.name}</span>
          <span class="psd-layer-meta">${layer.width}x${layer.height}px (x:${layer.left}, y:${layer.top})</span>
        </div>
      </label>
      <div class="psd-layer-input-group">
        <input type="text" class="form-control psd-layer-rename-input" data-index="${i}" value="${renameVal}" placeholder="Nhan layer" />
      </div>
      <div class="psd-layer-status" id="psd-layer-status-${i}">
        <span class="status-dot status-pending"></span>
        <span class="status-label">Cho</span>
      </div>
    `;

    layersList.appendChild(item);
  }

  const checkboxes = layersList.querySelectorAll(".psd-layer-checkbox");
  checkboxes.forEach((cb) => {
    cb.addEventListener("change", (e) => {
      // Toggle is-hidden-layer class on change
      const target = e.target as HTMLInputElement;
      const itemEl = target.closest(".psd-layer-item");
      if (itemEl) {
        if (target.checked) {
          itemEl.classList.remove("is-hidden-layer");
        } else {
          itemEl.classList.add("is-hidden-layer");
        }
      }
      updatePsdImportButtonState();
    });
  });

  updatePsdImportButtonState();
}

function getLayerThumbnailUrl(canvas: HTMLCanvasElement): string {
  const thumbCanvas = document.createElement("canvas");
  const maxDim = 48;
  const scale = Math.min(maxDim / canvas.width, maxDim / canvas.height, 1);
  thumbCanvas.width = canvas.width * scale;
  thumbCanvas.height = canvas.height * scale;
  const ctx = thumbCanvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
  }
  return thumbCanvas.toDataURL("image/png");
}

function updatePsdImportButtonState() {
  const importBtn = document.getElementById("psd-import-btn") as HTMLButtonElement | null;
  if (!importBtn) return;

  const checkedCount = document.querySelectorAll(".psd-layer-checkbox:checked").length;
  importBtn.disabled = checkedCount === 0;
  if (checkedCount === 0) {
    importBtn.textContent = "Chon it nhat 1 layer";
  } else {
    importBtn.textContent = `Nhap & Vector hoa (${checkedCount} layers)`;
  }
}

function setPsdLayersSelection(checked: boolean) {
  const checkboxes = document.querySelectorAll<HTMLInputElement>(".psd-layer-checkbox");
  checkboxes.forEach((cb) => {
    setPsdLayerCheckboxSelection(cb, checked);
  });
  updatePsdImportButtonState();
}

function getPsdTargetDimensions(): { width: number; height: number } {
  if (psdWidth <= 0 || psdHeight <= 0) {
    return { width: 1254, height: 1254 };
  }
  const ratioSelect = document.getElementById("psd-ratio-select") as HTMLSelectElement | null;
  const ratioVal = ratioSelect?.value || "1024";
  if (ratioVal === "original") {
    return { width: psdWidth, height: psdHeight };
  }
  const size = parseInt(ratioVal, 10);
  if (!isNaN(size)) {
    return { width: size, height: size };
  }
  return { width: psdWidth, height: psdHeight };
}

async function handleBatchPsdTrace() {
  const checkboxes = Array.from(document.querySelectorAll<HTMLInputElement>(".psd-layer-checkbox:checked"));
  if (checkboxes.length === 0) return;

  setPsdUiDisabled(true);

  // Read target dimensions
  const targetDims = getPsdTargetDimensions();
  layerTraceSize = targetDims;

  const progressContainer = document.getElementById("psd-progress-container");
  const progressBar = document.getElementById("psd-progress-bar");
  const progressText = document.getElementById("psd-progress-text");
  const progressPercent = document.getElementById("psd-progress-percent");

  if (progressContainer) progressContainer.style.display = "block";

  const total = checkboxes.length;
  let completed = 0;

  const updateProgress = (text: string) => {
    const percent = Math.round((completed / total) * 100);
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressPercent) progressPercent.textContent = `${percent}%`;
    if (progressText) progressText.textContent = text;
  };

  updateProgress("Dang chuan bi cac bo loc...");

  const presetSelect = document.getElementById("preset-select") as HTMLSelectElement | null;
  const preset = presetSelect?.value || "custom";
  const params = getSliderParams();

  // Sort in ascending index order (bottom-to-top) so they stack correctly in SVG DOM order (first written = bottommost)
  const sortedCheckboxes = [...checkboxes].sort((a, b) => {
    return Number(a.dataset.index) - Number(b.dataset.index);
  });

  for (const cb of sortedCheckboxes) {
    const idx = Number(cb.dataset.index);
    const layer = loadedPsdLayers[idx];

    const renameInput = document.querySelector(`.psd-layer-rename-input[data-index="${idx}"]`) as HTMLInputElement | null;
    const label = sanitizeLayerLabel(renameInput?.value || layer.name);
    const groupId = createLayerGroupId(label);

    const statusEl = document.getElementById(`psd-layer-status-${idx}`);
    if (statusEl) {
      statusEl.innerHTML = `<span class="status-dot status-loading"></span><span class="status-label">Dang trace...</span>`;
    }

    updateProgress(`Dang trace layer: ${label}...`);

    try {
      const imageDataUrl = createFullSizeLayerPng(
        layer.canvas,
        layer.left,
        layer.top,
        psdWidth,
        psdHeight,
        targetDims.width,
        targetDims.height
      );

      const response = await fetch("/api/editor/trace-layer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl,
          preset,
          params
        })
      });

      if (!response.ok) {
        const errorJson = await response.json();
        throw new Error(errorJson.error || "VTracer failed");
      }

      const result = await response.json() as TraceResult;

      let finalLabel = label;
      let finalGroupId = groupId;
      let suffix = 1;
      while (layerTraceLayers.some(l => l.groupId === finalGroupId)) {
        finalLabel = `${label}_${suffix}`;
        finalGroupId = createLayerGroupId(finalLabel);
        suffix++;
      }

      layerTraceLayers.push({
        groupId: finalGroupId,
        label: finalLabel,
        svgText: result.optimizedSvg,
        hidden: getImportedPsdLayerHiddenState({
          selectedForImport: cb.checked,
          sourceHidden: layer.hidden
        })
      });

      if (statusEl) {
        statusEl.innerHTML = `<span class="status-dot status-success"></span><span class="status-label">Xong</span>`;
      }
    } catch (error: any) {
      console.error(`Trace layer ${label} failed:`, error);
      if (statusEl) {
        statusEl.innerHTML = `<span class="status-dot status-error"></span><span class="status-label" title="${error.message}">Loi</span>`;
      }
      showStatus("error", `Trace layer ${label} that bai: ${error.message}`);
    }

    completed++;
    updateProgress(`Hoan thanh ${completed}/${total} layers`);
  }

  renderLayerTraceState();
  showStatus("success", `Da nhap thanh cong ${completed} layers tu PSD vao stage.`);

  setPsdUiDisabled(false);

  setTimeout(() => {
    if (progressContainer) progressContainer.style.display = "none";
    if (progressBar) progressBar.style.width = "0%";
  }, 3000);
}

function setPsdUiDisabled(disabled: boolean) {
  const fileInput = document.getElementById("psd-file-input") as HTMLInputElement | null;
  const importBtn = document.getElementById("psd-import-btn") as HTMLButtonElement | null;
  const selectAllBtn = document.getElementById("psd-select-all-btn") as HTMLButtonElement | null;
  const selectNoneBtn = document.getElementById("psd-select-none-btn") as HTMLButtonElement | null;
  const checkboxes = document.querySelectorAll<HTMLInputElement>(".psd-layer-checkbox");
  const renameInputs = document.querySelectorAll<HTMLInputElement>(".psd-layer-rename-input");
  const dropzone = document.getElementById("psd-dropzone");

  if (fileInput) fileInput.disabled = disabled;
  if (importBtn) importBtn.disabled = disabled;
  if (selectAllBtn) selectAllBtn.disabled = disabled;
  if (selectNoneBtn) selectNoneBtn.disabled = disabled;
  checkboxes.forEach((cb) => cb.disabled = disabled);
  renameInputs.forEach((inp) => inp.disabled = disabled);

  if (dropzone) {
    if (disabled) {
      dropzone.style.pointerEvents = "none";
      dropzone.style.opacity = "0.5";
    } else {
      dropzone.style.pointerEvents = "auto";
      dropzone.style.opacity = "1";
    }
  }
}
