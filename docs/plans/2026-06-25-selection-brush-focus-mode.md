# Selection Brush Tool & Focus Mode Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement a Selection Brush Tool (with Eraser and adjustable size) and a Focus Mode (expanded workspace) in the Crop Editor, consolidated into a premium floating toolbar.

**Architecture:** Maintain a pixel-perfect offscreen binary selection mask at the native resolution of the original PNG. Use canvas compositing (`globalCompositeOperation = 'source-in'`) to mask the original image for VTracer. Use CSS grid transitions to hide distracting panels in Focus Mode and automatically recalculate viewport zoom.

**Tech Stack:** TypeScript, Vanilla Canvas 2D API, SCSS, HTML5, Vitest.

---

### Task 1: Implement Brush Mask Helper and Unit Tests (TDD)

**Files:**
- Create: `src/layer-trace/brushMask.ts`
- Create: `src/layer-trace/brushMask.test.ts`

**Step 1: Write the failing test**
Create `src/layer-trace/brushMask.test.ts` with test cases to verify drawing a stroke and clearing a mask:
```typescript
import { describe, expect, it } from "vitest";
import { drawStrokeOnMask, clearMask } from "./brushMask";

describe("Brush Mask Utilities", () => {
  it("draws a stroke on a mask context correctly", () => {
    // Mock canvas context
    const drawnPoints: any[] = [];
    const mockCtx = {
      beginPath: () => {},
      moveTo: (x: number, y: number) => { drawnPoints.push({ type: "move", x, y }); },
      lineTo: (x: number, y: number) => { drawnPoints.push({ type: "line", x, y }); },
      stroke: () => { drawnPoints.push({ type: "stroke" }); },
      closePath: () => {},
      save: () => {},
      restore: () => {},
      lineWidth: 0,
      lineCap: "",
      lineJoin: "",
      strokeStyle: "",
      globalCompositeOperation: ""
    } as unknown as CanvasRenderingContext2D;

    drawStrokeOnMask(mockCtx, { x: 10, y: 10 }, { x: 20, y: 20 }, 5, "brush");

    expect(mockCtx.lineWidth).toBe(10); // 2 * radius
    expect(mockCtx.lineCap).toBe("round");
    expect(mockCtx.strokeStyle).toBe("#ffffff");
    expect(mockCtx.globalCompositeOperation).toBe("source-over");
    expect(drawnPoints).toContainEqual({ type: "move", x: 10, y: 10 });
    expect(drawnPoints).toContainEqual({ type: "line", x: 20, y: 20 });
  });

  it("sets composite operation to destination-out when erasing", () => {
    const mockCtx = {
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      save: () => {},
      restore: () => {},
      globalCompositeOperation: "source-over"
    } as unknown as CanvasRenderingContext2D;

    drawStrokeOnMask(mockCtx, { x: 10, y: 10 }, { x: 20, y: 20 }, 5, "eraser");
    expect(mockCtx.globalCompositeOperation).toBe("destination-out");
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/layer-trace/brushMask.test.ts`
Expected: FAIL (modules do not exist)

**Step 3: Write minimal implementation**
Create `src/layer-trace/brushMask.ts`:
```typescript
export interface Point {
  x: number;
  y: number;
}

export type BrushMode = "brush" | "eraser";

export function drawStrokeOnMask(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  radius: number,
  mode: BrushMode
): void {
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = radius * 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (mode === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
  } else {
    ctx.globalCompositeOperation = "source-over";
  }

  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

export function clearMask(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
}
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/layer-trace/brushMask.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/layer-trace/brushMask.ts src/layer-trace/brushMask.test.ts
git commit -m "feat: add brush mask drawing utilities with unit tests"
```

---

### Task 2: Update HTML UI Layout with Floating Toolbar

**Files:**
- Modify: `crop-editor.html:150-163`

**Step 1: Write code change**
Replace the `.layer-zoom-controls` container with the integrated `.layer-editor-toolbar` containing buttons and icons for zoom, tools selection, brush size slider, and focus mode:
```html
            <div class="layer-mask-editor">
              <div class="layer-editor-toolbar" id="layer-editor-toolbar" aria-label="Editor toolbar">
                <!-- Zoom Group -->
                <div class="toolbar-group zoom-group">
                  <button id="layer-zoom-out-btn" class="btn btn-secondary btn-icon" type="button" title="Thu nhỏ ảnh gốc" disabled>-</button>
                  <button id="layer-zoom-reset-btn" class="btn btn-secondary layer-zoom-reset" type="button" title="Về zoom 100%" disabled>
                    <span id="layer-zoom-value">100%</span>
                  </button>
                  <button id="layer-zoom-in-btn" class="btn btn-secondary btn-icon" type="button" title="Phóng to ảnh gốc" disabled>+</button>
                </div>
                
                <div class="toolbar-separator"></div>
                
                <!-- Tools Group -->
                <div class="toolbar-group tools-group">
                  <button id="tool-lasso-btn" class="btn btn-icon active" type="button" title="Lasso Tool (L)">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10V4a2 2 0 0 0-2-2h-8Z"/><path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>
                  </button>
                  <button id="tool-brush-btn" class="btn btn-icon" type="button" title="Selection Brush Tool (B)">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                  </button>
                  <button id="tool-eraser-btn" class="btn btn-icon" type="button" title="Eraser Tool (E)">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-.4-.4-.4-1 0-1.4l9.6-9.6c.4-.4 1-.4 1.4 0l4.3 4.3c.4.4.4 1 0 1.4L8.4 21c-.4.4-1 .4-1.4 0Z"/><path d="M22 21H12"/><path d="m14 11 4 4"/></svg>
                  </button>
                </div>
                
                <!-- Brush Size Slider Group (Hidden by default) -->
                <div class="toolbar-group brush-size-group" id="brush-size-container" style="display: none;">
                  <div class="toolbar-separator"></div>
                  <span class="toolbar-label">Size:</span>
                  <input type="range" id="brush-size-input" min="5" max="50" step="1" value="15" class="toolbar-slider" />
                  <span id="brush-size-value" class="toolbar-value">15px</span>
                </div>
                
                <div class="toolbar-separator"></div>
                
                <!-- Layout Group -->
                <div class="toolbar-group layout-group">
                  <button id="tool-focus-btn" class="btn btn-icon" type="button" title="Mở rộng khung vẽ (F)">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                  </button>
                </div>
              </div>
              <div class="layer-mask-scroll">
                <canvas id="layer-mask-canvas" class="layer-mask-canvas"></canvas>
                <p id="layer-mask-placeholder" class="placeholder-text">Chọn PNG để vẽ lasso layer.</p>
              </div>
            </div>
```

**Step 2: Run build to verify**
Run: `npm run build`
Expected: Success

**Step 3: Commit**
```bash
git add crop-editor.html
git commit -m "style: update crop-editor.html layout with integrated floating toolbar"
```

---

### Task 3: Implement Floating Toolbar Styling (SCSS)

**Files:**
- Modify: `src/styles/editor.scss:576-604`

**Step 1: Write code change**
Replace `.layer-zoom-controls` styles with the new integrated `.layer-editor-toolbar` and sub-component styles:
```scss
.layer-editor-toolbar {
  align-items: center;
  background: rgba(255, 254, 251, 0.94);
  border: 1px solid rgba(66, 139, 77, 0.18);
  border-radius: 8px;
  box-shadow: 0 4px 14px rgba(54, 39, 24, 0.08);
  display: none; // Controlled via has-image class in JS
  gap: 6px;
  padding: 4px 8px;
  position: absolute;
  right: 12px;
  top: 12px;
  z-index: 10;
  backdrop-filter: blur(4px);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .toolbar-separator {
    width: 1px;
    height: 16px;
    background: rgba(66, 139, 77, 0.18);
    margin: 0 4px;
  }

  .btn-icon {
    height: 26px;
    padding: 0;
    width: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    border: 1px solid transparent;
    background: transparent;
    color: $forest-dark;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      background: rgba(66, 139, 77, 0.08);
    }

    &.active {
      background: $forest-light;
      color: white;
    }
  }

  .layer-zoom-reset {
    font-size: 11px;
    font-weight: 700;
    height: 26px;
    min-width: 46px;
    padding: 0 6px;
    border-radius: 4px;
  }

  .toolbar-label {
    font-size: 11px;
    font-weight: 600;
    color: $forest-dark;
    margin-right: 4px;
  }

  .toolbar-value {
    font-size: 11px;
    font-weight: 700;
    color: $forest-dark;
    min-width: 32px;
    text-align: right;
  }

  .toolbar-slider {
    width: 80px;
    height: 4px;
    accent-color: $forest-light;
    cursor: pointer;
  }
}

.layer-mask-editor.has-image {
  .layer-editor-toolbar {
    display: flex;
  }
}
```

**Step 2: Run build to verify**
Run: `npm run build`
Expected: Success

**Step 3: Commit**
```bash
git add src/styles/editor.scss
git commit -m "style: add SCSS styles for the floating editor toolbar"
```

---

### Task 4: Implement Brush and Eraser Drawing Logic & Performance Optimizations (TypeScript)

**Files:**
- Modify: `src/editor.ts`

**Step 1: Write code change**
1. Add state variables at the top of `src/editor.ts` for brush selection, tracking the last coordinate point, and storing persistent offscreen canvas caches to prevent high-frequency Garbage Collection lag:
```typescript
let activeTool: "lasso" | "brush" | "eraser" = "lasso";
let brushSize = 15;
let brushMaskCanvas: HTMLCanvasElement | null = null;
let brushMaskCtx: CanvasRenderingContext2D | null = null;
let tintCanvas: HTMLCanvasElement | null = null;
let tintCtx: CanvasRenderingContext2D | null = null;
let lastBrushPoint: { x: number; y: number } | null = null;
let lastMousePosition: { x: number; y: number } | null = null; // Mapped native coordinates for cursor preview
```
2. Import `drawStrokeOnMask` and `clearMask` from `./layer-trace/brushMask`:
```typescript
import { drawStrokeOnMask, clearMask } from "./layer-trace/brushMask";
```
3. Initialize both the persistent mask canvas and the overlay tint canvas in `loadLayerTraceImage(pngPath: string)` when a PNG asset is loaded:
```typescript
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
```
4. Setup Toolbar listeners in `setupUIEventListeners()`. Add clean tool-switching logic to prevent overlapping lasso and brush selection states:
```typescript
  const toolLassoBtn = document.getElementById("tool-lasso-btn") as HTMLButtonElement | null;
  const toolBrushBtn = document.getElementById("tool-brush-btn") as HTMLButtonElement | null;
  const toolEraserBtn = document.getElementById("tool-eraser-btn") as HTMLButtonElement | null;
  const brushSizeInput = document.getElementById("brush-size-input") as HTMLInputElement | null;
  const brushSizeValue = document.getElementById("brush-size-value");
  const brushSizeContainer = document.getElementById("brush-size-container");

  const setTool = (tool: "lasso" | "brush" | "eraser") => {
    activeTool = tool;
    [toolLassoBtn, toolBrushBtn, toolEraserBtn].forEach((btn) => btn?.classList.remove("active"));
    
    if (tool === "lasso") {
      toolLassoBtn?.classList.add("active");
      if (brushSizeContainer) brushSizeContainer.style.display = "none";
      // Clear brush mask when switching to lasso to avoid conflicts
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
      // Clear lasso points when switching to brush/eraser
      layerLassoPoints = [];
    }
    drawLayerMaskCanvas();
    updateLayerTraceButtons();
  };

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
```
5. Handle brush/eraser strokes in pointer events. Track coordinates and trigger redraws immediately on mouse move:
   - In `handleLayerPointerDown`:
     ```typescript
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
     ```
   - In `handleLayerPointerMove`:
     ```typescript
     if (!layerTraceImage) return;
     const canvas = event.currentTarget as HTMLCanvasElement;
     const nextPoint = readCanvasPoint(canvas, event);
     lastMousePosition = nextPoint;

     if (!isDrawingLayerMask) {
       // Just hovering: Redraw cursor preview circle
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
         drawLayerMaskCanvas(); // Redraw immediately so stroke shows in real-time
       }
     }
     ```
   - In `handleLayerPointerUp`:
     ```typescript
     if (!isDrawingLayerMask) return;
     const canvas = event.currentTarget as HTMLCanvasElement;
     if (canvas.hasPointerCapture(event.pointerId)) {
       canvas.releasePointerCapture(event.pointerId);
     }
     isDrawingLayerMask = false;
     lastBrushPoint = null;
     drawLayerMaskCanvas();
     updateLayerTraceButtons();
     ```
   - Add a `pointerleave` listener to clear the cursor preview:
     ```typescript
     layerCanvas?.addEventListener("pointerleave", (event) => {
       lastMousePosition = null;
       handleLayerPointerUp(event);
     });
     ```
6. Update `drawLayerMaskCanvas()` to render the persistent green mask overlay and the high-contrast circular brush cursor preview:
```typescript
  // 1. Draw original crop image (Existing code)
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(layerTraceImage, 0, 0, canvas.width, canvas.height);

  // 2. Draw the brush selection overlay using the persistent offscreen tintCanvas (NO GC overhead)
  if (brushMaskCanvas && tintCanvas && tintCtx) {
    context.save();
    context.globalAlpha = 0.35;
    
    // Refresh the green tinted mask on our persistent cache canvas
    tintCtx.clearRect(0, 0, tintCanvas.width, tintCanvas.height);
    tintCtx.drawImage(brushMaskCanvas, 0, 0);
    tintCtx.globalCompositeOperation = "source-in";
    tintCtx.fillStyle = "#428b4d"; // Premium Forest Green tint
    tintCtx.fillRect(0, 0, tintCanvas.width, tintCanvas.height);
    
    // Draw onto the main viewport canvas
    context.drawImage(tintCanvas, 0, 0);
    context.restore();
  }

  // 3. Draw the high-contrast circular brush cursor preview (if hovering and brush/eraser is active)
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
```
7. Update `updateLayerTraceButtons()` to check for either a valid lasso polygon or an active brush:
```typescript
  const hasLasso = activeTool === "lasso" && layerLassoPoints.length >= 3;
  const hasBrush = activeTool !== "lasso"; // Using brush/eraser tool allows tracing
  
  if (traceLayerBtn) {
    traceLayerBtn.disabled = !layerTraceImage || (!hasLasso && !hasBrush);
  }
```
8. Update `clearLayerMask()` to also clear the offscreen brush mask:
```typescript
  if (brushMaskCtx && brushMaskCanvas) {
    clearMask(brushMaskCtx, brushMaskCanvas.width, brushMaskCanvas.height);
  }
```
9. Update `createMaskedLayerDataUrl()` to crop using the binary brush mask:
```typescript
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
    // Brush mode: Mask using the offscreen brushMaskCanvas
    if (!brushMaskCanvas) return null;
    context.drawImage(brushMaskCanvas, 0, 0);
    context.globalCompositeOperation = "source-in";
    context.drawImage(layerTraceImage, 0, 0, canvas.width, canvas.height);
  }
  context.restore();

  return canvas.toDataURL("image/png");
}
```

**Step 2: Run build to verify**
Run: `npm run build`
Expected: Success

**Step 3: Run unit tests**
Run: `npx vitest run`
Expected: All tests pass

**Step 4: Commit**
```bash
git add src/editor.ts
git commit -m "feat: implement selection brush and eraser drawing logic with GC optimization"
```

---

### Task 5: Implement Focus Mode (Theater Mode) Toggle and Viewport Recalculation

**Files:**
- Modify: `src/editor.ts`
- Modify: `src/styles/editor.scss`

**Step 1: Implement Focus Mode toggle event listener and safety repaint delay**
1. Add state variable at the top of `src/editor.ts`:
```typescript
let isFocusMode = false;
```
2. In `setupUIEventListeners()`, listen to the Focus Mode button click, apply keyboard shortcuts, and wrap the zoom recalculation in a `requestAnimationFrame` callback to ensure the browser has finished repainting the new expanded layout dimensions:
```typescript
  const toolFocusBtn = document.getElementById("tool-focus-btn") as HTMLButtonElement | null;

  const toggleFocusMode = () => {
    isFocusMode = !isFocusMode;
    const appWrapper = document.querySelector(".editor-app");
    if (appWrapper) {
      appWrapper.classList.toggle("focus-mode", isFocusMode);
    }
    toolFocusBtn?.classList.toggle("active", isFocusMode);
    
    // Update SVG icon to represent minimize or expand
    if (toolFocusBtn) {
      if (isFocusMode) {
        toolFocusBtn.title = "Thu nhỏ khung vẽ (F)";
        toolFocusBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/></svg>`;
      } else {
        toolFocusBtn.title = "Mở rộng khung vẽ (F)";
        toolFocusBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`;
      }
    }

    // Safely wait for layout repaint before recalculating scale, preventing stale width/height readings
    requestAnimationFrame(() => {
      applyLayerTraceZoom();
    });
  };

  toolFocusBtn?.addEventListener("click", toggleFocusMode);

  // Add keyboard shortcuts
  window.addEventListener("keydown", (event) => {
    // Ignore keyboard shortcuts when user is typing in the label input
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
        if (brushSizeInput) brushSizeInput.value = String(brushSize);
        if (brushSizeValue) brushSizeValue.textContent = `${brushSize}px`;
        drawLayerMaskCanvas();
      }
    } else if (key === "]") {
      if (activeTool !== "lasso") {
        brushSize = Math.min(50, brushSize + 2);
        if (brushSizeInput) brushSizeInput.value = String(brushSize);
        if (brushSizeValue) brushSizeValue.textContent = `${brushSize}px`;
        drawLayerMaskCanvas();
      }
    }
  });
```

**Step 2: Write SCSS Focus Mode styles**
Append the `.focus-mode` rules to `src/styles/editor.scss` with CSS transitions:
```scss
.editor-app.focus-mode {
  .stages-sidebar {
    display: none;
  }

  .config-panel {
    display: none;
  }

  .layer-composite-preview {
    display: none;
  }

  .editor-main {
    grid-template-columns: 1fr; // Full width grid
    height: calc(100vh - 60px - 40px); // Fill vertical viewport
  }

  .layer-trace-panel {
    height: 100%;
    margin: 0;
    border-radius: 0;
    box-shadow: none;
    
    .layer-trace-layout {
      grid-template-columns: 1fr 300px; // Maximum canvas size, fixed sidebar controls
      height: calc(100% - 60px);
    }
  }

  .layer-mask-editor {
    height: 100%;
    
    .layer-mask-scroll {
      height: 100%;
      max-height: none;
    }
  }
}
```

**Step 3: Run build to verify**
Run: `npm run build`
Expected: Success

**Step 4: Run unit tests**
Run: `npx vitest run`
Expected: Success

**Step 5: Commit**
```bash
git add src/editor.ts src/styles/editor.scss
git commit -m "feat: implement Focus Mode layout and keyboard shortcuts"
```
