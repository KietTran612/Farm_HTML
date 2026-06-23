# Hybrid Trace Preset Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Create a new hybrid preset option "Hybrid (Detailed + Animation)" that combines the outputs of `animationCandidate` and `gameDetailed` traces in z-order (Candidate below, Detailed on top) and optimizes the result with SVGO.

**Architecture:** Integrate the hybrid option on the UI, transmit the selected preset ID to the backend, run VTracer CLI twice on the backend, extract and concatenate the path tags (Candidate first, Detailed on top), run SVGO, and return the single optimized composite SVG.

**Tech Stack:** TypeScript, HTML, Node.js (Vite Middleware, SVGO, VTracer CLI).

---

### Task 76: Add hybrid preset UI option and client logic

**Files:**
- Modify: `crop-editor.html`
- Modify: `src/editor.ts`

**Step 1: Add option to UI dropdown**
Modify [crop-editor.html](file:///d:/soflware/Unity/Source/Farm_HTML/crop-editor.html) to append `hybridDetailedCandidate` option under `preset-select`:
```html
<option value="hybridDetailedCandidate">Hybrid (Detailed + Animation)</option>
```

**Step 2: Add hybrid option to `vtracerPresets` in client logic**
Modify [src/editor.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/editor.ts) to register the preset:
```typescript
const vtracerPresets: Record<string, Record<string, number>> = {
  // ... existing presets
  hybridDetailedCandidate: {
    isHybrid: 1
  }
};
```

**Step 3: Update `applyPreset()` to disable/enable sliders and update payload**
Modify `applyPreset` in [src/editor.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/editor.ts) to disable all VTracer parameter sliders when the hybrid preset is selected:
```typescript
function applyPreset(presetName: string) {
  const presetSelect = document.getElementById("preset-select") as HTMLSelectElement | null;
  if (presetSelect) {
    presetSelect.value = presetName;
  }

  const isHybrid = presetName === "hybridDetailedCandidate";
  const params = vtracerPresets[presetName];

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
    if (slider) {
      slider.disabled = isHybrid;
      if (!isHybrid && params && paramId in params) {
        slider.value = String(params[paramId]);
        if (valueDisplay) {
          valueDisplay.textContent = slider.value;
        }
      }
    }
  });
}
```

**Step 4: Send the selected preset ID in `handleTraceLayer()` payload**
Modify `handleTraceLayer()` in [src/editor.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/editor.ts) to include the `preset` parameter in the request payload:
```typescript
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
```

**Step 5: Verify build compile**
Run: `npm run build`
Expected: Compile succeeds with no errors.

---

### Task 77: Implement hybrid trace backend logic in Vite middleware

**Files:**
- Modify: `scripts/vite-plugins/editorMiddleware.ts`

**Step 1: Update payload interface and server presets**
Modify [scripts/vite-plugins/editorMiddleware.ts](file:///d:/soflware/Unity/Source/Farm_HTML/scripts/vite-plugins/editorMiddleware.ts):
- Add `preset?: string` to `TraceLayerPayload`.
- Add a server-side definition of presets for `animationCandidate` and `gameDetailed` to use during dual-run:
```typescript
const SERVER_PRESETS: Record<string, any> = {
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
  }
};
```

**Step 2: Update `handleTraceLayerRequest` to support hybrid runs**
Modify `handleTraceLayerRequest` in [scripts/vite-plugins/editorMiddleware.ts](file:///d:/soflware/Unity/Source/Farm_HTML/scripts/vite-plugins/editorMiddleware.ts) to detect `hybridDetailedCandidate` and run VTracer twice, merging the outputs:
```typescript
export function handleTraceLayerRequest(payload: TraceLayerPayload): any {
  const match = payload.imageDataUrl.match(/^data:image\/png;base64,([a-zA-Z0-9+/=]+)$/);
  if (!match) {
    throw new Error("Masked layer image must be a PNG data URL.");
  }

  const tmpDir = resolve("docs/Crops/Generated/tmp");
  if (!existsSync(tmpDir)) {
    mkdirSync(tmpDir, { recursive: true });
  }

  const inputPath = join(tmpDir, `masked_layer_${Date.now()}_${Math.random().toString(36).slice(2)}.png`);
  writeFileSync(inputPath, Buffer.from(match[1], "base64"));

  try {
    if (payload.preset === "hybridDetailedCandidate") {
      // 1. Run animationCandidate (smooth base)
      const resCandidate = runVTracerOnFile(inputPath, SERVER_PRESETS.animationCandidate);
      // 2. Run gameDetailed (sharp detail)
      const resDetailed = runVTracerOnFile(inputPath, SERVER_PRESETS.gameDetailed);

      // Extract paths content
      const extractPaths = (svg: string) => {
        const m = svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
        return m ? m[1].trim() : "";
      };

      const pathsCandidate = extractPaths(resCandidate.rawSvg);
      const pathsDetailed = extractPaths(resDetailed.rawSvg);

      // Get svg root tag from Candidate to maintain viewBox
      const rootMatch = resCandidate.rawSvg.match(/<svg[^>]*>/i);
      const rootTag = rootMatch ? rootMatch[0] : '<svg xmlns="http://www.w3.org/2000/svg">';

      // Merge (Candidate first, Detailed on top)
      const mergedRawSvg = `${rootTag}\n${pathsCandidate}\n${pathsDetailed}\n</svg>`;

      // Optimize merged SVG
      const optimized = optimize(mergedRawSvg, {
        multipass: true,
        plugins: [
          {
            name: "preset-default",
            params: {
              overrides: {
                convertColors: {
                  names2hex: true,
                  rgb2hex: true,
                  shorthex: false,
                  shortname: false
                }
              }
            }
          },
          "removeDimensions",
          {
            name: "removeAttrs",
            params: {
              attrs: ["svg:style", "svg:id"]
            }
          }
        ]
      });

      let optimizedText = "";
      if ("data" in optimized) {
        optimizedText = optimized.data;
      } else {
        throw new Error("SVGO optimization failed on hybrid merge.");
      }

      const rawMetrics = collectSvgMetricsFromText(mergedRawSvg);
      const optimizedMetrics = collectSvgMetricsFromText(optimizedText);

      return {
        rawSvg: mergedRawSvg,
        optimizedSvg: optimizedText,
        metrics: {
          raw: rawMetrics,
          optimized: optimizedMetrics
        }
      };
    }

    // Default single preset trace path
    return runVTracerOnFile(inputPath, payload.params);
  } finally {
    if (existsSync(inputPath)) {
      rmSync(inputPath, { force: true });
    }
  }
}
```

**Step 3: Verify build compile**
Run: `npm run build`
Expected: Compile succeeds with no errors.

---

### Task 78: Verify build and user manual review

**Files:**
- Modify: `docs/plans/task.md`
- Modify: `docs/plans/current-handoff.md`

**Step 1: Compile the production bundle**
Run: `npm run build`
Expected: Succeeds without warnings or errors.

**Step 2: Update task tracker and current handoff**
Update [task.md](file:///d:/soflware/Unity/Source/Farm_HTML/docs/plans/task.md) and [current-handoff.md](file:///d:/soflware/Unity/Source/Farm_HTML/docs/plans/current-handoff.md).
Tell the user that implementation is complete and ready for their manual verification.
