# Design Specification: Selection Brush Tool & Focus Mode

This document details the design and technical specification for implementing the Selection Brush Tool and Focus Mode in the HTML Crop Art Editor.

## 1. Floating Toolbar (`.layer-editor-toolbar`)

Instead of large standalone buttons or floating panels, all workspace-level interactive tools (Zoom controls, Drawing tools, Brush options, and Layout controls) will be consolidated into a single, cohesive floating toolbar at the top-right of the `.layer-mask-editor` workspace.

```
+-------------------------------------------------------------------------------------------------------------+
|  [ - ]  100%  [ + ]  |  [ Lasso ]  [ Brush ]  [ Eraser ]  |  Size: [ 15px ===o ]  |  [ Icon Focus Mode ]  |
+-------------------------------------------------------------------------------------------------------------+
```

### Components
1. **Zoom Group**: Zoom Out (`-`), Zoom Reset (`100%`), Zoom In (`+`). (Preserves current logic).
2. **Separator**: A vertical divider line.
3. **Drawing Tools Group**:
   * **Lasso Tool**: Active by default.
   * **Selection Brush Tool**: Manual brush selection.
   * **Eraser Tool**: Erase part of the selection.
4. **Brush Size Group**: Only visible when the Brush or Eraser tool is active. Contains a slider (5px to 50px) and a numeric value display.
5. **Layout Group**:
   * **Focus Mode Toggle**: Toggles full-screen expanded workspace.

---

## 2. Selection Brush Tool Technical Implementation

### Core Concepts
* **Binary Mask**: Unlike the Lasso tool which stores a polygon path of coordinate points, the Brush tool operates on pixel-level data. We will maintain a binary selection mask using an offscreen canvas (`OffscreenCanvas` or hidden `HTMLCanvasElement`) of the exact same size as the original PNG image.
* **Canvas Compositing**: When rendering the crop selection or exporting it, we will use canvas 2D compositing (`globalCompositeOperation = 'source-in'`) to mask the original image with the binary brush mask.

### Draw Flow (Pointer Events)
1. **Pointer Down**:
   * Begin drawing on the offscreen mask canvas.
   * Draw a circle of radius `brushSize` at the coordinates mapped to the original image space.
2. **Pointer Move**:
   * Draw a continuous line (`lineCap = 'round'`, `lineJoin = 'round'`) from the previous pointer position to the current pointer position on the offscreen mask canvas.
   * If `activeTool === 'brush'`, paint with solid white (`#ffffff` or opaque color).
   * If `activeTool === 'eraser'`, paint with transparency (`globalCompositeOperation = 'destination-out'` or solid black depending on mask representation).
3. **Pointer Up**:
   * End the current drawing stroke.
4. **Screen Rendering**:
   * Draw the original PNG image.
   * Draw the selection mask on top as a semi-transparent overlay (e.g., `rgba(66, 139, 77, 0.35)` for brush, and transparent/cutout for unselected areas) to give the user real-time visual feedback of what is selected.

---

## 3. Coordinate Mappings (Viewport vs. Image)

As proven by the existing codebase in `src/layer-trace/layerViewport.ts`, all coordinate translations from screen client coordinates to original image coordinates are handled by `toUnscaledCanvasPoint`:

$$\text{Image } X = \frac{\text{Client } X - \text{Canvas } Rect.left}{\text{Canvas } Rect.width} \times \text{Image } Width$$
$$\text{Image } Y = \frac{\text{Client } Y - \text{Canvas } Rect.top}{\text{Canvas } Rect.height} \times \text{Image } Height$$

By performing all drawing strokes on the offscreen mask canvas using these translated coordinates, **the drawing accuracy is 100% pixel-perfect**, regardless of the current zoom level, canvas size, or Focus Mode state.

---

## 4. Focus Mode (Expanded Workspace) Technical Implementation

Focus Mode expands the physical width and height of the workspace to occupy maximum browser window space, giving the user a larger canvas for fine-grained brushing.

### CSS/SCSS Grid & Flexbox Transitions
* We will define a `.focus-mode` class on the `.editor-app` wrapper.
* When `.focus-mode` is active, SCSS rules will apply:
  ```scss
  .editor-app.focus-mode {
    .stages-sidebar { display: none; }
    .config-panel { display: none; }
    .layer-composite-preview { display: none; }
    
    .layer-trace-panel {
      grid-template-columns: 1fr 320px; // Hide preview column, give remaining space to mask editor & controls
      height: calc(100vh - #{$header-height} - #{$footer-height} - 24px);
    }
  }
  ```
* A smooth CSS transition will be applied to the layout elements to ensure a premium, non-jarring experience.

### JS/TS Viewport Recalculation
When Focus Mode is toggled:
1. Add/remove `.focus-mode` class from `.editor-app`.
2. Immediately call `applyLayerTraceZoom()`.
3. Inside `applyLayerTraceZoom()`, the browser will read the new expanded client width/height of `.layer-mask-editor` (which has expanded to occupy the space vacated by the sidebar, config, and preview panels), and automatically scale the canvas to fit the new, much larger available viewport.
