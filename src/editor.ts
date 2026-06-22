import "./styles/editor.scss";

interface Crop {
  name: string;
  pngs: string[];
}

interface VTracerPreset {
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
  rawSvg: string;
  optimizedSvg: string;
  metrics: {
    raw: {
      bytes: number;
      pathCount: number;
      groupCount: number;
      uniqueFillCount: number;
      viewBox: string | null;
    };
    optimized: {
      bytes: number;
      pathCount: number;
      groupCount: number;
      uniqueFillCount: number;
      viewBox: string | null;
    };
  };
}

// Global Application State
let activeCrop: string = "";
let cropsList: Crop[] = [];
let presets: Record<string, VTracerPreset> = {};
let targetStages: string[] = ["stage00", "stage01", "stage02", "stage03", "dead"];
let mappedStages: Record<string, string> = {}; // stageName -> filename
let tracedSvgs: Record<string, string> = {}; // cardId -> optimizedSvgContent
let selectedMappings: Record<string, string> = {}; // cardId -> stageId

// Debounce helper for live tracing
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  setupUIEventListeners();
  await initEditor();
});

async function initEditor() {
  showStatus("loading", "Đang tải cấu hình dự án...");
  try {
    // 1. Fetch crops list
    const cropsResponse = await fetch("/api/editor/crops");
    if (!cropsResponse.ok) throw new Error("Không thể tải danh sách cây trồng.");
    cropsList = await cropsResponse.json() as Crop[];

    // 2. Fetch presets config
    const presetsResponse = await fetch("/docs/Crops/vtracer-presets.json");
    if (!presetsResponse.ok) throw new Error("Không thể tải cấu hình presets VTracer.");
    presets = await presetsResponse.json() as Record<string, VTracerPreset>;

    // 3. Populate crop selector dropdown
    populateCropDropdown();

    showStatus("info", "Vui lòng chọn một loại cây trồng để bắt đầu.");
  } catch (error: any) {
    showStatus("error", `Lỗi khởi tạo: ${error.message}`);
  }
}

function setupUIEventListeners() {
  const cropSelect = document.getElementById("crop-select") as HTMLSelectElement | null;
  const pngSelect = document.getElementById("png-select") as HTMLSelectElement | null;
  const runTraceBtn = document.getElementById("run-trace-btn") as HTMLButtonElement | null;
  const saveConfigBtn = document.getElementById("save-config-btn") as HTMLButtonElement | null;
  const addStageBtn = document.getElementById("add-stage-btn") as HTMLButtonElement | null;
  const removeStageBtn = document.getElementById("remove-stage-btn") as HTMLButtonElement | null;

  cropSelect?.addEventListener("change", () => handleCropSelection(cropSelect.value));
  pngSelect?.addEventListener("change", () => handlePngSelection());
  runTraceBtn?.addEventListener("change", () => triggerTraceAll(true));
  runTraceBtn?.addEventListener("click", () => triggerTraceAll(true));
  saveConfigBtn?.addEventListener("click", () => handleSaveConfig());

  addStageBtn?.addEventListener("click", () => handleAddStage());
  removeStageBtn?.addEventListener("click", () => handleRemoveStage());

  // Set up listeners on all range sliders
  const sliderIds = [
    "color-precision",
    "filter-speckle",
    "gradient-step",
    "corner-threshold",
    "segment-length",
    "splice-threshold"
  ];

  const debouncedCustomTrace = debounce(() => {
    const liveTraceCheck = document.getElementById("live-trace-check") as HTMLInputElement | null;
    if (liveTraceCheck?.checked) {
      triggerSingleTrace("custom");
    }
  }, 350);

  sliderIds.forEach(paramId => {
    const slider = document.getElementById(`param-${paramId}`) as HTMLInputElement | null;
    const valueDisplay = document.getElementById(`val-${paramId}`);
    if (slider && valueDisplay) {
      slider.addEventListener("input", () => {
        valueDisplay.textContent = slider.value;
        debouncedCustomTrace();
      });
    }
  });
}

function populateCropDropdown() {
  const cropSelect = document.getElementById("crop-select") as HTMLSelectElement | null;
  if (!cropSelect) return;

  cropSelect.innerHTML = `<option value="">-- Chọn Cây Trồng --</option>` +
    cropsList.map(c => `<option value="${c.name.toLowerCase()}">${c.name}</option>`).join("");
}

async function handleCropSelection(cropName: string) {
  activeCrop = cropName;
  const pngSelect = document.getElementById("png-select") as HTMLSelectElement | null;
  const pngPreviewContainer = document.getElementById("png-preview-container");
  const candidatesGrid = document.getElementById("candidates-grid");

  if (!pngSelect) return;

  // Clear selections
  pngSelect.innerHTML = `<option value="">-- Chọn ảnh PNG --</option>`;
  if (pngPreviewContainer) {
    pngPreviewContainer.innerHTML = `<p class="placeholder-text">Chưa chọn ảnh PNG nguồn</p>`;
  }
  if (candidatesGrid) {
    candidatesGrid.innerHTML = `<p class="placeholder-text">Vui lòng chọn ảnh PNG để bắt đầu sinh các mẫu vector ứng viên.</p>`;
  }
  tracedSvgs = {};
  selectedMappings = {};

  if (!cropName) {
    renderStagesSidebar();
    showStatus("info", "Vui lòng chọn một loại cây trồng để bắt đầu.");
    return;
  }

  showStatus("loading", `Đang tải thông tin cây trồng ${cropName}...`);

  try {
    const crop = cropsList.find(c => c.name.toLowerCase() === cropName);
    if (crop) {
      pngSelect.innerHTML = `<option value="">-- Chọn ảnh PNG --</option>` +
        crop.pngs.map(p => {
          const filename = p.split("/").pop() || p;
          return `<option value="${p}">${filename}</option>`;
        }).join("");
    }

    // Attempt to load current mapping meta.json if exists
    mappedStages = {};
    const metaResponse = await fetch(`/src/assets/crops/${cropName}/meta.json`);
    const contentType = metaResponse.headers.get("content-type") || "";
    if (metaResponse.ok && contentType.includes("application/json")) {
      const meta = await metaResponse.json();
      if (meta && meta.stages) {
        mappedStages = meta.stages;
        // Parse stages from meta keys
        targetStages = Object.keys(meta.stages);
      }
    } else {
      // Default stages
      targetStages = ["stage00", "stage01", "stage02", "stage03", "dead"];
    }

    renderStagesSidebar();
    showStatus("info", `Đã chọn ${cropName}. Vui lòng chọn ảnh PNG nguồn để trace.`);
  } catch (error: any) {
    showStatus("error", `Lỗi tải cấu hình cây trồng: ${error.message}`);
  }
}

function renderStagesSidebar() {
  const stagesList = document.getElementById("stages-list");
  const totalStagesBadge = document.getElementById("total-stages-badge");

  if (totalStagesBadge) {
    totalStagesBadge.textContent = activeCrop ? String(targetStages.length) : "0";
  }

  if (!stagesList) return;

  if (!activeCrop) {
    stagesList.innerHTML = `<li class="placeholder-text" style="padding: 20px 0;">Chưa chọn cây trồng</li>`;
    return;
  }

  stagesList.innerHTML = targetStages.map(stageId => {
    const isMapped = !!mappedStages[stageId];
    const filename = mappedStages[stageId] || "Chưa gán";
    
    // Label normalization for nice UI display (e.g. stage00 -> Stage 00, dead -> Dead)
    let displayLabel = stageId.charAt(0).toUpperCase() + stageId.slice(1);
    if (stageId.startsWith("stage")) {
      const num = stageId.replace("stage", "");
      displayLabel = `Stage ${num}`;
    }

    return `
      <li class="stage-item ${isMapped ? 'is-mapped' : ''}" data-stage-id="${stageId}">
        <span class="stage-name">
          <span class="stage-dot" style="display:inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${isMapped ? '#428b4d' : '#e1dbcb'}"></span>
          ${displayLabel}
        </span>
        <span class="stage-badge">${filename}</span>
      </li>
    `;
  }).join("");
}

function handlePngSelection() {
  const pngSelect = document.getElementById("png-select") as HTMLSelectElement | null;
  const pngPreviewContainer = document.getElementById("png-preview-container");

  if (!pngSelect || !pngSelect.value) {
    if (pngPreviewContainer) {
      pngPreviewContainer.innerHTML = `<p class="placeholder-text">Chưa chọn ảnh PNG nguồn</p>`;
    }
    return;
  }

  const pngPath = pngSelect.value;
  const filename = pngPath.split("/").pop() || pngPath;

  if (pngPreviewContainer) {
    pngPreviewContainer.innerHTML = `
      <div style="text-align: center; color: #2c4130; display: flex; flex-direction: column; align-items: center; gap: 8px;">
        <img src="/${pngPath}" alt="${filename}" />
        <p style="font-weight: 600; margin: 0; font-size: 12px; overflow-wrap: anywhere; max-width: 100%;">${filename}</p>
      </div>
    `;
  }

  // Auto trigger tracing for all candidate cards
  triggerTraceAll();
}

function getSliderParams(): VTracerPreset {
  const color_precision = Number((document.getElementById("param-color-precision") as HTMLInputElement).value);
  const filter_speckle = Number((document.getElementById("param-filter-speckle") as HTMLInputElement).value);
  const gradient_step = Number((document.getElementById("param-gradient-step") as HTMLInputElement).value);
  const corner_threshold = Number((document.getElementById("param-corner-threshold") as HTMLInputElement).value);
  const segment_length = Number((document.getElementById("param-segment-length") as HTMLInputElement).value);
  const splice_threshold = Number((document.getElementById("param-splice-threshold") as HTMLInputElement).value);

  return {
    colormode: "color",
    mode: "spline",
    hierarchical: "stacked",
    color_precision,
    filter_speckle,
    gradient_step,
    corner_threshold,
    segment_length,
    splice_threshold,
    path_precision: 2
  };
}

function triggerTraceAll(forceCustom: boolean = false) {
  const candidatesGrid = document.getElementById("candidates-grid");
  const pngSelect = document.getElementById("png-select") as HTMLSelectElement | null;

  if (!candidatesGrid || !pngSelect || !pngSelect.value) return;

  // Initialize candidates grid with loading/blank cards
  const presetKeys = Object.keys(presets);
  const cards = [...presetKeys, "custom"];

  candidatesGrid.innerHTML = cards.map(cardId => {
    const isPreset = cardId !== "custom";
    const title = isPreset ? `Preset: ${cardId}` : "Custom (Sliders)";

    return `
      <div class="candidate-card" id="card-${cardId}" data-cand-id="${cardId}">
        <div class="card-header">
          <h4>${title}</h4>
          <span class="badge ${isPreset ? 'badge-preset' : ''}">${isPreset ? 'Preset' : 'Tùy chỉnh'}</span>
        </div>
        
        <div class="svg-preview" id="preview-${cardId}">
          <div class="loading-spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #428b4d; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite;"></div>
          <span style="font-size: 11px; color: #667c69; margin-top: 8px;">Tracing...</span>
        </div>
        
        <div class="metrics-table" id="metrics-${cardId}">
          <div class="metric-item">Size: <span class="val">-</span></div>
          <div class="metric-item">Paths: <span class="val">-</span></div>
          <div class="metric-item">Groups: <span class="val">-</span></div>
          <div class="metric-item">Colors: <span class="val">-</span></div>
        </div>
        
        <div class="mapping-control">
          <label for="select-${cardId}">Gán cho Stage:</label>
          <select id="select-${cardId}" class="form-control stage-select" disabled>
            <option value="">-- Loading --</option>
          </select>
        </div>
        
        <div class="duplicate-alert" id="alert-${cardId}">
          <span class="alert-icon">⚠️</span>
          <span class="alert-text">Stage này bị trùng lặp ở một card khác!</span>
        </div>
      </div>
    `;
  }).join("");

  // Style helper for spinner animation
  if (!document.getElementById("spinner-animation-style")) {
    const style = document.createElement("style");
    style.id = "spinner-animation-style";
    style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }

  // Trigger trace on each card asynchronously
  cards.forEach(cardId => {
    if (cardId === "custom" && !forceCustom) {
      const liveTraceCheck = document.getElementById("live-trace-check") as HTMLInputElement | null;
      if (!liveTraceCheck?.checked) {
        // Render custom card as idle/ready for manual click
        renderCustomCardIdle();
        return;
      }
    }
    triggerSingleTrace(cardId);
  });
}

function renderCustomCardIdle() {
  const preview = document.getElementById("preview-custom");
  const select = document.getElementById("select-custom") as HTMLSelectElement | null;

  if (preview) {
    preview.innerHTML = `
      <div style="text-align: center; color: #667c69; padding: 10px;">
        <span style="font-size: 24px; display:block; margin-bottom: 4px;">🛠️</span>
        <span style="font-size: 11px;">Nhấn "Trace Thủ Công" để xem kết quả tùy chỉnh</span>
      </div>
    `;
  }

  if (select) {
    select.innerHTML = `<option value="">-- Trống --</option>`;
    select.disabled = true;
  }
}

async function triggerSingleTrace(cardId: string) {
  const pngSelect = document.getElementById("png-select") as HTMLSelectElement | null;
  const preview = document.getElementById(`preview-${cardId}`);
  const metricsContainer = document.getElementById(`metrics-${cardId}`);
  const select = document.getElementById(`select-${cardId}`) as HTMLSelectElement | null;

  if (!pngSelect || !pngSelect.value || !preview) return;

  // Show loading
  preview.innerHTML = `
    <div class="loading-spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #428b4d; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite;"></div>
    <span style="font-size: 10px; color: #667c69; margin-top: 6px;">Tracing...</span>
  `;

  try {
    const inputPath = pngSelect.value;
    const params = cardId === "custom" ? getSliderParams() : presets[cardId];

    const response = await fetch("/api/editor/trace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputPath, params })
    });

    if (!response.ok) {
      const errorJson = await response.json();
      throw new Error(errorJson.error || "Trace failed.");
    }

    const result = await response.json() as TraceResult;

    // Cache SVG content
    tracedSvgs[cardId] = result.optimizedSvg;

    // 1. Render SVG Preview
    preview.innerHTML = result.optimizedSvg;

    // 2. Render Metrics Table
    if (metricsContainer) {
      const met = result.metrics.optimized;
      const sizeKB = (met.bytes / 1024).toFixed(1);
      metricsContainer.innerHTML = `
        <div class="metric-item">Size: <span class="val">${sizeKB} KB</span></div>
        <div class="metric-item">Paths: <span class="val">${met.pathCount}</span></div>
        <div class="metric-item">Groups: <span class="val">${met.groupCount}</span></div>
        <div class="metric-item">Colors: <span class="val">${met.uniqueFillCount}</span></div>
      `;
    }

    // 3. Populate Stage Selector Dropdown
    if (select) {
      const prevVal = selectedMappings[cardId] || "";
      select.innerHTML = `<option value="">-- Không gán --</option>` +
        targetStages.map(stageId => {
          let label = stageId.charAt(0).toUpperCase() + stageId.slice(1);
          if (stageId.startsWith("stage")) {
            label = `Stage ${stageId.replace("stage", "")}`;
          }
          return `<option value="${stageId}" ${stageId === prevVal ? "selected" : ""}>${label}</option>`;
        }).join("");
      
      select.disabled = false;

      // Bind change event
      select.onchange = () => {
        selectedMappings[cardId] = select.value;
        validateStageMappings();
      };
    }

    validateStageMappings();
  } catch (error: any) {
    preview.innerHTML = `
      <div style="text-align: center; color: #d32f2f; padding: 10px;">
        <span style="font-size: 24px; display:block; margin-bottom: 4px;">⚠️</span>
        <span style="font-size: 11px; overflow-wrap: anywhere; max-width: 100%; display: inline-block;">Lỗi: ${error.message}</span>
      </div>
    `;
    if (select) {
      select.innerHTML = `<option value="">-- Lỗi --</option>`;
      select.disabled = true;
    }
  }
}

function validateStageMappings() {
  const cards = Object.keys(tracedSvgs);
  
  // Clear all previous errors
  cards.forEach(cardId => {
    const cardEl = document.getElementById(`card-${cardId}`);
    cardEl?.classList.remove("is-duplicate");
  });

  // Count stage assignments
  const counts: Record<string, string[]> = {}; // stageId -> cardIds[]
  
  for (const [cardId, stageId] of Object.entries(selectedMappings)) {
    if (!stageId) continue;
    if (!counts[stageId]) {
      counts[stageId] = [];
    }
    counts[stageId].push(cardId);
  }

  // Highlight duplicates
  let hasDuplicates = false;
  let duplicateStagesList: string[] = [];

  for (const [stageId, cardIds] of Object.entries(counts)) {
    if (cardIds.length > 1) {
      hasDuplicates = true;
      let label = stageId.charAt(0).toUpperCase() + stageId.slice(1);
      if (stageId.startsWith("stage")) {
        label = `Stage ${stageId.replace("stage", "")}`;
      }
      duplicateStagesList.push(label);

      cardIds.forEach(cardId => {
        const cardEl = document.getElementById(`card-${cardId}`);
        cardEl?.classList.add("is-duplicate");

        const alertText = cardEl?.querySelector(".duplicate-alert .alert-text");
        if (alertText) {
          alertText.textContent = `Stage "${label}" đang bị trùng lặp ở một card khác!`;
        }
      });
    }
  }

  // Update Footer & Enable/Disable Save
  const saveConfigBtn = document.getElementById("save-config-btn") as HTMLButtonElement | null;
  
  if (hasDuplicates) {
    showStatus("error", `Không thể lưu: Giai đoạn [${duplicateStagesList.join(", ")}] đang bị trùng lặp!`);
    if (saveConfigBtn) saveConfigBtn.disabled = true;
  } else {
    // Check if at least one stage is mapped
    const totalMapped = Object.values(selectedMappings).filter(Boolean).length;
    if (totalMapped > 0) {
      showStatus("success", `Sẵn sàng lưu. Đã thiết lập mapping cho ${totalMapped} stages.`);
      if (saveConfigBtn) saveConfigBtn.disabled = false;
    } else {
      showStatus("info", "Vui lòng gán ít nhất một giai đoạn (stage) để lưu cấu hình.");
      if (saveConfigBtn) saveConfigBtn.disabled = true;
    }
  }
}

async function handleSaveConfig() {
  const saveConfigBtn = document.getElementById("save-config-btn") as HTMLButtonElement | null;
  if (!activeCrop || !saveConfigBtn || saveConfigBtn.disabled) return;

  // Build the payload
  const stagesPayload: Record<string, string> = {};

  for (const [cardId, stageId] of Object.entries(selectedMappings)) {
    if (!stageId) continue;
    const svgContent = tracedSvgs[cardId];
    if (svgContent) {
      stagesPayload[stageId] = svgContent;
    }
  }

  showStatus("loading", "Đang lưu cấu hình và ảnh SVG xuống máy...");
  saveConfigBtn.disabled = true;

  try {
    const response = await fetch("/api/editor/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cropName: activeCrop,
        stages: stagesPayload
      })
    });

    if (!response.ok) {
      const errorJson = await response.json();
      throw new Error(errorJson.error || "Save failed.");
    }

    // Update mappedStages cache
    for (const stageId of Object.keys(stagesPayload)) {
      mappedStages[stageId] = `${stageId}.svg`;
    }

    renderStagesSidebar();
    showStatus("success", "Đã lưu và áp dụng cấu hình SVG thành công!");
    
    // Auto re-enable button if still valid
    validateStageMappings();
  } catch (error: any) {
    showStatus("error", `Lỗi lưu tệp: ${error.message}`);
    saveConfigBtn.disabled = false;
  }
}

function handleAddStage() {
  if (!activeCrop) return;
  
  // Find next stage number
  let nextNum = 0;
  targetStages.forEach(s => {
    if (s.startsWith("stage")) {
      const num = parseInt(s.replace("stage", ""), 10);
      if (!isNaN(num) && num >= nextNum) {
        nextNum = num + 1;
      }
    }
  });

  const nextStageId = `stage${String(nextNum).padStart(2, "0")}`;
  targetStages.push(nextStageId);
  
  // Sort stages so stage00, stage01, ... and dead is at the end
  sortStages();
  
  renderStagesSidebar();
  triggerTraceAll(); // rebuild selectors
}

function handleRemoveStage() {
  if (!activeCrop || targetStages.length <= 1) return;

  // Remove the last stage that is NOT "dead" if possible, otherwise remove last one
  const nonDeadStages = targetStages.filter(s => s !== "dead");
  if (nonDeadStages.length > 0) {
    const targetToRemove = nonDeadStages[nonDeadStages.length - 1];
    targetStages = targetStages.filter(s => s !== targetToRemove);
    delete mappedStages[targetToRemove];
    
    // Clear mappings referencing it
    for (const [cardId, stageId] of Object.entries(selectedMappings)) {
      if (stageId === targetToRemove) {
        selectedMappings[cardId] = "";
      }
    }
  } else {
    const targetToRemove = targetStages[targetStages.length - 1];
    targetStages.pop();
    delete mappedStages[targetToRemove];
  }

  renderStagesSidebar();
  triggerTraceAll();
}

function sortStages() {
  const stagePattern = /^stage(\d+)$/;
  
  targetStages.sort((a, b) => {
    if (a === "dead") return 1;
    if (b === "dead") return -1;

    const matchA = a.match(stagePattern);
    const matchB = b.match(stagePattern);

    if (matchA && matchB) {
      return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
    }
    return a.localeCompare(b);
  });
}

function showStatus(type: "loading" | "success" | "error" | "info", message: string) {
  const footerStatus = document.getElementById("footer-status");
  if (!footerStatus) return;

  let icon = "ℹ";
  let iconClass = "info";
  let messageStyle = "";

  if (type === "loading") {
    icon = `<div class="loading-spinner" style="border: 2px solid #f3f3f3; border-top: 2px solid #428b4d; border-radius: 50%; width: 14px; height: 14px; animation: spin 1s linear infinite; display: inline-block;"></div>`;
    iconClass = "loading";
  } else if (type === "success") {
    icon = "✅";
    iconClass = "success";
    messageStyle = "color: #3b793f; font-weight: 700;";
  } else if (type === "error") {
    icon = "❌";
    iconClass = "error";
    messageStyle = "color: #d32f2f; font-weight: 700;";
  }

  footerStatus.innerHTML = `
    <span class="status-icon ${iconClass}">${icon}</span>
    <span class="status-message" style="${messageStyle}">${message}</span>
  `;
}
