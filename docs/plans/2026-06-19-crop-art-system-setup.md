# Crop Art System Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable SCSS + native SVG crop art system where each planted crop renders its own 2.5D soil patch plus crop visuals without adding runtime animation libraries.

**Architecture:** The app will replace the current pseudo-element crop placeholder with a focused `src/ui/crop-art/` renderer that returns stable HTML/SVG strings for each crop. Crop state alignment will be anchored through one shared SVG `viewBox`, one crop base point, and per-state layers controlled by semantic classes; SCSS owns all visual states, 2.5D placement, and animations.

**Tech Stack:** TypeScript, SCSS/Sass, native SVG, CSS animations, Vite static asset handling, SVGO as a build-time optimization tool only.

---

## Constraints

- Do not add runtime animation packages such as GSAP, MorphSVG, anime.js, Lottie, or Three.js for crop art.
- Do not use inline `style` attributes for normal styling.
- CSS custom properties may be passed inline only for true runtime values; this plan does not require them.
- Each crop must include its own soil patch visual inside the crop renderer.
- Crop states must share stable layout anchors so seed, sprout, mature, ready, and dead states do not jump around.
- All current and future crop SVG renderers must use `viewBox="0 0 240 180"` and the shared plant anchor `data-crop-anchor="120 132"` so strawberry, rice, and later crops can reuse the same 2.5D tile placement and crop-owned soil patch without per-crop offset CSS.
- Crop outlines should keep a consistent cartoon stroke thickness across state scale transitions. Use `vector-effect: non-scaling-stroke` on carrot leaves, stems, dead stems/leaves, and root cap unless a later crop intentionally needs fully scaling linework.
- Verification should stay narrow: renderer unit tests, build/typecheck, and focused browser smoke screenshots for the farm board.

## File Structure

- Create `src/ui/crop-art/cropArtTypes.ts`
  - Owns crop art renderer input types, unique SVG instance ids, state normalization, and supported crop ids.
- Create `src/ui/crop-art/soilPatch.ts`
  - Returns the reusable 2.5D soil patch SVG layer with semantic soil classes.
- Create `src/ui/crop-art/carrotCrop.ts`
  - Returns carrot SVG layers for seed, sprout, mature, ready, and dead art states.
- Create `src/ui/crop-art/cropArt.ts`
  - Public crop art renderer API used by `render.ts`.
- Create `src/ui/crop-art/cropArt.test.ts`
  - Unit tests for renderer markup, classes, state anchors, and no inline styles.
- Modify `src/ui/render.ts`
  - Import and use `renderCropArt()` for planted plots.
- Modify `src/styles/main.scss`
  - Import the crop art SCSS partials.
- Create `src/styles/crop-art/_base.scss`
  - Shared crop art shell, SVG sizing, anchor, soil patch, animation safety.
- Create `src/styles/crop-art/_carrot.scss`
  - Carrot-specific colors, layer states, leaf sway, root/soil variations.
- Modify `src/ui/render.test.ts`
  - Update existing renderer expectations from placeholder crop `<div>` to crop art shell.
- Modify `docs/plans/task.md`, `docs/plans/current-handoff.md`, and `docs/plans/index.md`
  - Track completion and handoff after implementation.

---

### Task 1: Add Crop Art Type Boundary

**Files:**
- Create: `src/ui/crop-art/cropArtTypes.ts`
- Test: `src/ui/crop-art/cropArt.test.ts`

- [ ] **Step 1: Write failing tests for state normalization and renderer input shape**

Create `src/ui/crop-art/cropArt.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeCropArtState, sanitizeSvgId, type CropArtInput } from "./cropArtTypes";

describe("crop art types", () => {
  it("normalizes core growth states into crop art states", () => {
    expect(normalizeCropArtState("seeded", false)).toBe("seed");
    expect(normalizeCropArtState("sprout", false)).toBe("sprout");
    expect(normalizeCropArtState("grown", false)).toBe("mature");
    expect(normalizeCropArtState("preHarvest", false)).toBe("mature");
    expect(normalizeCropArtState("harvestable", false)).toBe("ready");
    expect(normalizeCropArtState("harvestable", true)).toBe("dead");
  });

  it("accepts a complete crop art input object", () => {
    const input: CropArtInput = {
      instanceId: "plot-0-0",
      cropId: "carrot",
      cropName: "Carrot",
      growthState: "harvestable",
      soilLevel: 2,
      isDry: false,
      hasPest: true,
      isDead: false
    };

    expect(input.cropId).toBe("carrot");
  });

  it("sanitizes SVG instance ids so inline defs do not collide across plots", () => {
    expect(sanitizeSvgId("plot-0-0")).toBe("plot-0-0");
    expect(sanitizeSvgId("plot 0/0")).toBe("plot-0-0");
    expect(sanitizeSvgId("")).toBe("crop-art");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- src/ui/crop-art/cropArt.test.ts
```

Expected: FAIL because `src/ui/crop-art/cropArtTypes.ts` does not exist.

- [ ] **Step 3: Implement crop art types**

Create `src/ui/crop-art/cropArtTypes.ts`:

```ts
import type { CropGrowthState } from "../../core/types";

export type CropArtCropId = "carrot" | "strawberry" | "rice";

export type CropArtState = "seed" | "sprout" | "mature" | "ready" | "dead";

export type SoilPatchState = "normal" | "dry" | "upgraded" | "neglected";

export type CropArtInput = {
  instanceId: string;
  cropId: string;
  cropName: string;
  growthState: CropGrowthState;
  soilLevel: number;
  isDry: boolean;
  hasPest: boolean;
  isDead: boolean;
};

export function sanitizeSvgId(value: string): string {
  const sanitized = value.trim().replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return sanitized || "crop-art";
}

export function normalizeCropArtState(growthState: CropGrowthState, isDead: boolean): CropArtState {
  if (isDead || growthState === "dead") return "dead";

  switch (growthState) {
    case "seeded":
      return "seed";
    case "sprout":
      return "sprout";
    case "grown":
    case "preHarvest":
      return "mature";
    case "harvestable":
      return "ready";
  }
}

export function getSoilPatchState(input: Pick<CropArtInput, "isDry" | "isDead" | "soilLevel">): SoilPatchState {
  if (input.isDead) return "neglected";
  if (input.isDry) return "dry";
  if (input.soilLevel > 1) return "upgraded";
  return "normal";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm test -- src/ui/crop-art/cropArt.test.ts
```

Expected: PASS for the two type-boundary tests.

---

### Task 2: Add Reusable 2.5D Soil Patch Renderer

**Files:**
- Create: `src/ui/crop-art/soilPatch.ts`
- Modify: `src/ui/crop-art/cropArt.test.ts`

- [ ] **Step 1: Add failing soil patch markup tests**

Append to `src/ui/crop-art/cropArt.test.ts`:

```ts
import { renderSoilPatch } from "./soilPatch";

describe("renderSoilPatch", () => {
  it("renders a semantic 2.5D soil patch layer", () => {
    const html = renderSoilPatch("dry");

    expect(html).toContain('class="crop-soil crop-soil--dry"');
    expect(html).toContain('class="crop-soil__top"');
    expect(html).toContain('class="crop-soil__front-rim"');
    expect(html).toContain('class="crop-soil__shadow"');
    expect(html).not.toContain("style=");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- src/ui/crop-art/cropArt.test.ts
```

Expected: FAIL because `soilPatch.ts` does not exist.

- [ ] **Step 3: Implement soil patch renderer**

Create `src/ui/crop-art/soilPatch.ts`:

```ts
import type { SoilPatchState } from "./cropArtTypes";

export function renderSoilPatch(state: SoilPatchState): string {
  return `
    <g class="crop-soil crop-soil--${state}" aria-hidden="true">
      <ellipse class="crop-soil__shadow" cx="120" cy="150" rx="84" ry="22" />
      <path class="crop-soil__top" d="M24 112 L120 64 L216 112 L120 160 Z" />
      <path class="crop-soil__inner" d="M44 112 L120 74 L196 112 L120 150 Z" />
      <path class="crop-soil__front-rim" d="M24 112 L120 160 L216 112 L216 126 L120 176 L24 126 Z" />
      <path class="crop-soil__crack crop-soil__crack--left" d="M87 117 L103 126 L94 137" />
      <path class="crop-soil__crack crop-soil__crack--right" d="M139 116 L128 128 L145 139" />
    </g>
  `;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm test -- src/ui/crop-art/cropArt.test.ts
```

Expected: PASS.

---

### Task 3: Add Carrot Crop SVG Renderer With Stable Anchors

**Files:**
- Create: `src/ui/crop-art/carrotCrop.ts`
- Modify: `src/ui/crop-art/cropArt.test.ts`

- [ ] **Step 1: Add failing carrot renderer tests**

Append to `src/ui/crop-art/cropArt.test.ts`:

```ts
import { renderCarrotCrop } from "./carrotCrop";

describe("renderCarrotCrop", () => {
  it("renders all carrot state layers inside one stable art anchor", () => {
    const html = renderCarrotCrop("ready", { rootGradientId: "crop-art-plot-0-0-carrot-root" });

    expect(html).toContain('class="crop-plant crop-plant--carrot crop-plant--ready"');
    expect(html).toContain('data-crop-anchor="120 132"');
    expect(html).toContain('fill="url(#crop-art-plot-0-0-carrot-root)"');
    expect(html).toContain('class="carrot-layer carrot-layer--seed"');
    expect(html).toContain('class="carrot-layer carrot-layer--sprout"');
    expect(html).toContain('class="carrot-layer carrot-layer--mature"');
    expect(html).toContain('class="carrot-layer carrot-layer--ready"');
    expect(html).toContain('class="carrot-layer carrot-layer--dead"');
    expect(html).not.toContain("style=");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- src/ui/crop-art/cropArt.test.ts
```

Expected: FAIL because `carrotCrop.ts` does not exist.

- [ ] **Step 3: Implement initial carrot renderer**

Create `src/ui/crop-art/carrotCrop.ts`:

```ts
import type { CropArtState } from "./cropArtTypes";

export type CarrotCropIds = {
  rootGradientId: string;
};

function leaf(className: string, d: string): string {
  return `<path class="${className}" d="${d}" />`;
}

export function renderCarrotCrop(state: CropArtState, ids: CarrotCropIds): string {
  return `
    <g class="crop-plant crop-plant--carrot crop-plant--${state}" data-crop-anchor="120 132">
      <g class="carrot-layer carrot-layer--seed">
        <ellipse class="carrot-seed carrot-seed--left" cx="108" cy="132" rx="5" ry="8" />
        <ellipse class="carrot-seed carrot-seed--right" cx="128" cy="132" rx="5" ry="8" />
      </g>

      <g class="carrot-layer carrot-layer--sprout">
        <path class="carrot-stem carrot-stem--sprout" d="M120 136 C118 116 122 100 128 88" />
        ${leaf("carrot-leaf carrot-leaf--sprout-left", "M126 103 C100 92 86 84 72 74 C96 72 116 80 130 98Z")}
        ${leaf("carrot-leaf carrot-leaf--sprout-right", "M128 96 C146 76 164 68 188 66 C176 86 154 99 130 107Z")}
      </g>

      <g class="carrot-layer carrot-layer--mature">
        <path class="carrot-stem carrot-stem--center" d="M120 136 C116 108 116 82 119 54" />
        <path class="carrot-stem carrot-stem--left" d="M120 136 C101 112 82 96 48 82" />
        <path class="carrot-stem carrot-stem--right" d="M120 136 C140 110 164 92 198 78" />
        ${leaf("carrot-leaf carrot-leaf--back-left", "M63 87 C36 84 23 76 12 62 C38 55 64 62 82 84 C73 87 69 88 63 87Z")}
        ${leaf("carrot-leaf carrot-leaf--top", "M119 62 C105 40 108 20 122 4 C141 26 140 48 124 70Z")}
        ${leaf("carrot-leaf carrot-leaf--back-right", "M178 84 C198 62 224 56 246 64 C232 80 207 91 177 91Z")}
        ${leaf("carrot-leaf carrot-leaf--front-left", "M86 116 C58 118 42 128 28 144 C55 148 82 138 101 119Z")}
        ${leaf("carrot-leaf carrot-leaf--front-right", "M142 117 C166 126 184 140 198 156 C171 156 148 143 132 120Z")}
      </g>

      <g class="carrot-layer carrot-layer--ready">
        <path class="carrot-root-cap" fill="url(#${ids.rootGradientId})" d="M82 136 C84 107 100 92 120 92 C141 92 157 108 159 136 C151 152 133 158 120 158 C105 158 90 152 82 136Z" />
        <ellipse class="carrot-root-highlight" cx="105" cy="121" rx="16" ry="6" />
        <path class="carrot-root-line carrot-root-line--left" d="M91 142 C101 148 113 151 126 151" />
        <path class="carrot-root-line carrot-root-line--right" d="M144 130 C137 137 130 141 121 143" />
      </g>

      <g class="carrot-layer carrot-layer--dead">
        <path class="carrot-dead-stem carrot-dead-stem--center" d="M120 138 C116 116 114 96 112 74" />
        <path class="carrot-dead-stem carrot-dead-stem--left" d="M118 137 C99 121 78 116 50 118" />
        <path class="carrot-dead-stem carrot-dead-stem--right" d="M122 137 C142 122 164 118 190 122" />
        ${leaf("carrot-dead-leaf carrot-dead-leaf--left", "M62 120 C40 124 29 133 18 148 C42 151 66 140 82 124Z")}
        ${leaf("carrot-dead-leaf carrot-dead-leaf--top", "M112 76 C101 61 102 45 116 30 C130 48 130 64 117 82Z")}
        ${leaf("carrot-dead-leaf carrot-dead-leaf--right", "M174 122 C194 127 208 138 219 154 C195 156 172 144 158 126Z")}
      </g>
    </g>
  `;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm test -- src/ui/crop-art/cropArt.test.ts
```

Expected: PASS.

---

### Task 4: Add Public Crop Art Renderer

**Files:**
- Create: `src/ui/crop-art/cropArt.ts`
- Modify: `src/ui/crop-art/cropArt.test.ts`

- [ ] **Step 1: Add failing public renderer tests**

Append to `src/ui/crop-art/cropArt.test.ts`:

```ts
import { renderCropArt } from "./cropArt";

describe("renderCropArt", () => {
  it("renders crop soil and plant inside one SVG crop art shell", () => {
    const html = renderCropArt({
      instanceId: "plot-0-0",
      cropId: "carrot",
      cropName: "Cà rốt",
      growthState: "harvestable",
      soilLevel: 2,
      isDry: false,
      hasPest: true,
      isDead: false
    });

    expect(html).toContain('class="crop-art crop-art--carrot crop-art--ready soil-upgraded has-pest"');
    expect(html).toContain('viewBox="0 0 240 180"');
    expect(html).toContain('id="crop-art-plot-0-0-carrot-root"');
    expect(html).toContain('fill="url(#crop-art-plot-0-0-carrot-root)"');
    expect(html).toContain('aria-label="Cà rốt"');
    expect(html).toContain('class="crop-soil crop-soil--upgraded"');
    expect(html).toContain('class="crop-plant crop-plant--carrot crop-plant--ready"');
    expect(html).not.toContain("style=");
  });

  it("falls back to carrot art classes for unknown crop ids without crashing", () => {
    const html = renderCropArt({
      instanceId: "plot-0-1",
      cropId: "unknown-crop",
      cropName: "Unknown",
      growthState: "sprout",
      soilLevel: 1,
      isDry: true,
      hasPest: false,
      isDead: false
    });

    expect(html).toContain("crop-art--unknown-crop");
    expect(html).toContain("crop-plant--sprout");
    expect(html).toContain("crop-soil--dry");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- src/ui/crop-art/cropArt.test.ts
```

Expected: FAIL because `cropArt.ts` does not exist.

- [ ] **Step 3: Implement public renderer**

Create `src/ui/crop-art/cropArt.ts`:

```ts
import { renderCarrotCrop } from "./carrotCrop";
import { getSoilPatchState, normalizeCropArtState, sanitizeSvgId, type CropArtInput } from "./cropArtTypes";
import { renderSoilPatch } from "./soilPatch";

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function renderCropArt(input: CropArtInput): string {
  const artState = normalizeCropArtState(input.growthState, input.isDead);
  const soilState = getSoilPatchState(input);
  const instanceId = sanitizeSvgId(input.instanceId);
  const rootGradientId = `crop-art-${instanceId}-carrot-root`;
  const cropClass = `crop-art--${input.cropId}`;
  const stateClasses = [
    "crop-art",
    cropClass,
    `crop-art--${artState}`,
    `soil-${soilState}`,
    input.hasPest ? "has-pest" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <svg class="${stateClasses}" viewBox="0 0 240 180" role="img" aria-label="${escapeAttribute(input.cropName)}" focusable="false">
      <defs>
        <linearGradient id="${rootGradientId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffbd61" />
          <stop offset="100%" stop-color="#e5651e" />
        </linearGradient>
      </defs>
      ${renderSoilPatch(soilState)}
      ${renderCarrotCrop(artState, { rootGradientId })}
    </svg>
  `;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm test -- src/ui/crop-art/cropArt.test.ts
```

Expected: PASS.

---

### Task 5: Replace Placeholder Crop Markup In Board Renderer

**Files:**
- Modify: `src/ui/render.ts`
- Modify: `src/ui/render.test.ts`

- [ ] **Step 1: Add failing renderer integration test**

In `src/ui/render.test.ts`, add or update a planted plot assertion:

```ts
it("renders planted plots with crop art SVG including crop-owned soil patch", () => {
  const root = document.createElement("div");
  const state = plantSeed(createInitialGameState(1_000), "plot-0-0", "carrot", 2_000);

  renderApp(root, createViewModel(state, 62_000, "carrot"));

  const cropArt = root.querySelector(".crop-art.crop-art--carrot");
  expect(cropArt).not.toBeNull();
  expect(cropArt?.querySelector(".crop-soil")).not.toBeNull();
  expect(cropArt?.querySelector(".crop-plant--carrot")).not.toBeNull();
  expect(root.querySelector(".iso-tile__crop > .crop")).toBeNull();
  expect(root.innerHTML).not.toContain("style=");
});
```

The existing `render.test.ts` already imports `plantSeed`, `createInitialGameState`, and `createViewModel`; reuse those helpers instead of adding a separate fixture.

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- src/ui/render.test.ts
```

Expected: FAIL because `render.ts` still emits `<div class="crop ..."></div>`.

- [ ] **Step 3: Use `renderCropArt()` in planted plots**

Modify `src/ui/render.ts`:

```ts
import { renderCropArt } from "./crop-art/cropArt";
```

Delete the old `classes` array because it is only used by the placeholder `<div class="${classes}"></div>` and `tsconfig.json` has `noUnusedLocals: true`. Then replace the planted crop placeholder with:

```ts
${renderCropArt({
  instanceId: plot.id,
  cropId,
  cropName,
  growthState,
  soilLevel: plot.soilLevel,
  isDry: plot.isDry,
  hasPest: plot.hasPest,
  isDead: plot.isDead
})}
```

Because the planted branch already guards `plot.cropId`, assign local constants before the template string in that branch so TypeScript can narrow the nullable view-model fields:

```ts
const cropId = plot.cropId;
const cropName = plot.cropName ?? plot.cropId;
const growthState = plot.growthState;

if (!growthState) {
  return "";
}
```

and pass those values to `renderCropArt()`.

- [ ] **Step 4: Run focused renderer test**

Run:

```powershell
npm test -- src/ui/render.test.ts
```

Expected: PASS.

---

### Task 6: Add SCSS Crop Art Foundation

**Files:**
- Create: `src/styles/crop-art/_base.scss`
- Create: `src/styles/crop-art/_carrot.scss`
- Modify: `src/styles/main.scss`

- [ ] **Step 1: Add base crop art SCSS**

Create `src/styles/crop-art/_base.scss`:

```scss
.crop-art {
  display: block;
  width: 116px;
  height: 88px;
  overflow: visible;
  transform-origin: 50% 76%;
  pointer-events: none;
}

.crop-soil {
  transform-box: fill-box;
  transform-origin: center;
}

.crop-soil__shadow {
  fill: rgba(83, 50, 24, 0.22);
}

.crop-soil__top {
  fill: #a96b3f;
  stroke: #87522f;
  stroke-width: 3;
}

.crop-soil__inner {
  fill: #b97a49;
  opacity: 0.72;
}

.crop-soil__front-rim {
  fill: #7c4a2d;
  opacity: 0.86;
}

.crop-soil__crack {
  fill: none;
  stroke: #5e3823;
  stroke-linecap: round;
  stroke-width: 4;
  opacity: 0;
}

.soil-dry .crop-soil__top {
  fill: #9a6b45;
}

.soil-dry .crop-soil__crack {
  opacity: 0.72;
}

.soil-upgraded .crop-soil__inner {
  fill: #c48952;
}

.soil-neglected .crop-soil {
  filter: saturate(0.65) brightness(0.8);
}

.crop-plant,
.carrot-layer {
  transform-box: fill-box;
  transform-origin: center bottom;
}
```

- [ ] **Step 2: Add carrot SCSS**

Create `src/styles/crop-art/_carrot.scss`:

```scss
.crop-plant--carrot {
  .carrot-layer {
    opacity: 0;
    transition:
      opacity 0.22s ease,
      transform 0.28s ease,
      filter 0.22s ease;
  }

  .carrot-stem,
  .carrot-dead-stem {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }

  .carrot-stem {
    stroke: #357c2c;
    stroke-width: 8;
  }

  .carrot-leaf {
    fill: #67b83d;
    stroke: #225c22;
    stroke-linejoin: round;
    stroke-width: 5;
    paint-order: stroke fill;
    vector-effect: non-scaling-stroke;
  }

  .carrot-root-cap {
    stroke: #a94818;
    stroke-width: 5;
    paint-order: stroke fill;
    vector-effect: non-scaling-stroke;
  }

  .carrot-root-highlight {
    fill: #ffd59a;
    opacity: 0.72;
    transform: rotate(22deg);
    transform-origin: center;
  }

  .carrot-root-line {
    fill: none;
    stroke: #b64e17;
    stroke-linecap: round;
    stroke-width: 3;
    opacity: 0.34;
  }

  .carrot-seed {
    fill: #8a5b35;
    stroke: #5f3b20;
    stroke-width: 2;
  }

  .carrot-dead-stem {
    stroke: #86642d;
    stroke-width: 8;
  }

  .carrot-dead-leaf {
    fill: #c5a247;
    stroke: #7b642e;
    stroke-linejoin: round;
    stroke-width: 5;
    paint-order: stroke fill;
    vector-effect: non-scaling-stroke;
  }
}

.crop-art--seed .carrot-layer--seed,
.crop-art--sprout .carrot-layer--sprout,
.crop-art--mature .carrot-layer--mature,
.crop-art--ready .carrot-layer--mature,
.crop-art--ready .carrot-layer--ready,
.crop-art--dead .carrot-layer--dead {
  opacity: 1;
}

.crop-art--seed .crop-plant--carrot {
  transform: translateY(4px) scale(0.72);
}

.crop-art--sprout .crop-plant--carrot {
  transform: translateY(0) scale(0.78);
}

.crop-art--mature .crop-plant--carrot {
  transform: translateY(-8px) scale(0.86);
}

.crop-art--ready .crop-plant--carrot {
  transform: translateY(-10px) scale(0.92);
}

.crop-art--dead .crop-plant--carrot {
  transform: translateY(0) scale(0.82) rotate(-3deg);
}

.crop-art--ready .carrot-layer--mature {
  animation: carrot-leaf-sway 2.4s ease-in-out infinite;
}

.crop-art.has-pest {
  filter: drop-shadow(0 0 5px rgba(82, 58, 30, 0.38));
}

@keyframes carrot-leaf-sway {
  0%,
  100% {
    transform: rotate(0deg);
  }

  50% {
    transform: rotate(1.4deg);
  }
}
```

- [ ] **Step 3: Import crop art SCSS from main**

Add at the very top of `src/styles/main.scss`, before `:root` or any other style rule. Sass requires `@use` rules to come before normal CSS rules.

```scss
@use "./crop-art/base";
@use "./crop-art/carrot";
```

- [ ] **Step 4: Remove old pseudo-element crop art rules**

Delete or replace these old placeholder rules from `src/styles/main.scss`:

```scss
.crop {
  ...
}

.crop::before,
.crop::after {
  ...
}

.crop--carrot {
  ...
}

.crop--strawberry {
  ...
}

.crop--rice {
  ...
}

.crop::before {
  ...
}

.crop::after {
  ...
}
```

Keep state class rules only if they are still used elsewhere. If no longer used by crop art, delete the old `.state-seeded`, `.state-sprout`, `.state-grown`, `.state-preHarvest`, `.state-harvestable`, `.state-dead`, `.is-dry`, and `.has-pest` crop placeholder rules to avoid conflicting transforms.

- [ ] **Step 5: Run build to verify SCSS compiles**

Run:

```powershell
npm run build
```

Expected: PASS with no Sass or TypeScript errors.

---

### Task 7: Stabilize Crop Positioning Inside 2.5D Tiles

**Files:**
- Modify: `src/styles/main.scss`
- Modify: `src/styles/crop-art/_base.scss`
- Modify: `src/styles/crop-art/_carrot.scss`

- [ ] **Step 1: Update tile crop container sizing**

In `src/styles/main.scss`, update `.iso-tile__crop`:

```scss
.iso-tile__crop {
  position: absolute;
  left: 50%;
  top: -18px;
  width: 116px;
  height: 88px;
  transform: translateX(-50%) rotateZ(-45deg) rotateX(-58deg) translateZ(25px);
  transform-origin: center 76%;
  z-index: 2;
  pointer-events: none;
}
```

- [ ] **Step 2: Ensure every crop art state uses a common baseline**

In `src/styles/crop-art/_base.scss`, add:

```scss
.crop-art {
  contain: layout;
}

.crop-art .crop-plant {
  transform-box: view-box;
  transform-origin: 120px 132px;
}

.crop-art .crop-soil {
  transform-box: view-box;
  transform-origin: 120px 132px;
}
```

- [ ] **Step 3: Verify state changes no longer move tile anchors**

Use the regular browser or Chrome headless to inspect the farm board after planting carrot. State changes should animate inside the same `116px x 88px` crop art box; the crop-owned soil patch should remain visually attached to the crop.

Focused browser smoke route:

```powershell
npm run dev -- -Check
```

Expected: the check script exits successfully without starting an extra server.

Then run the existing local app using the controlled dev server if needed and inspect one planted plot through the browser.

---

### Task 8: Add Focused Renderer Regression Coverage

**Files:**
- Modify: `src/ui/render.test.ts`
- Modify: `src/ui/crop-art/cropArt.test.ts`

- [ ] **Step 1: Add no-inline-style coverage for crop art renderer**

In `src/ui/crop-art/cropArt.test.ts`, add:

```ts
it("does not emit inline style attributes for crop art states", () => {
  for (const growthState of ["seeded", "sprout", "grown", "preHarvest", "harvestable", "dead"] as const) {
    const html = renderCropArt({
      instanceId: `plot-${growthState}`,
      cropId: "carrot",
      cropName: "Cà rốt",
      growthState,
      soilLevel: 1,
      isDry: false,
      hasPest: false,
      isDead: growthState === "dead"
    });

    expect(html).not.toContain("style=");
  }
});
```

- [ ] **Step 2: Add render integration coverage for dry and pest classes**

In `src/ui/render.test.ts`, add or update a planted plot fixture so one plot has `isDry: true` and `hasPest: true`, then assert:

```ts
expect(root.querySelector(".crop-art.soil-dry")).not.toBeNull();
expect(root.querySelector(".crop-art.has-pest")).not.toBeNull();
```

- [ ] **Step 3: Run focused tests**

Run:

```powershell
npm test -- src/ui/crop-art/cropArt.test.ts src/ui/render.test.ts
```

Expected: PASS.

---

### Task 9: Verify Build And Focused Browser Smoke

**Files:**
- No source file changes expected.
- Screenshots may be written under `demo-review/` if visual review artifacts are useful.

- [ ] **Step 1: Run production build**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 2: Run focused UI tests**

Run:

```powershell
npm test -- src/ui/crop-art/cropArt.test.ts src/ui/render.test.ts
```

Expected: PASS.

- [ ] **Step 3: Browser smoke the crop states**

Use the controlled local Vite server and inspect the farm board:

```powershell
npm run dev
```

Expected: app serves on the configured local host/port from `run_dev.ps1`.

Manual browser checks:

- Plant carrot.
- Confirm crop-owned soil patch appears with the crop.
- Confirm crop art stays aligned to the same tile through seed, sprout, mature, ready, and dead.
- Confirm popups still open on plot click.
- Confirm tile action buttons do not reappear on top of the 2.5D tile.

If using Chrome headless screenshots, capture only the farm board states relevant to crop art alignment.

---

### Task 10: Update Handoff And Commit On Approval

**Files:**
- Modify: `docs/plans/task.md`
- Modify: `docs/plans/current-handoff.md`
- Modify: `docs/plans/index.md` only if another plan is added.

- [ ] **Step 1: Update task tracker**

Add one concise completed row to `docs/plans/task.md` after implementation:

```md
| **Task 15: Execute Crop Art System Setup** | [x] | Added reusable SCSS/SVG crop art rendering with crop-owned 2.5D soil patches and focused renderer coverage. |
```

- [ ] **Step 2: Update current handoff**

In `docs/plans/current-handoff.md`, record:

- latest completed crop art renderer work
- verification commands and pass/fail results
- any visual warnings about state alignment
- current uncommitted scope
- recommended next crop or polish task

- [ ] **Step 3: Commit only if the user asks**

If the user explicitly requests a commit, run:

```powershell
git status --short
git add src/ui/crop-art src/ui/render.ts src/ui/render.test.ts src/styles/main.scss src/styles/crop-art docs/plans/task.md docs/plans/current-handoff.md package.json package-lock.json svgo.config.mjs src/assets/crops/source src/assets/crops/optimized
git commit -m "feat: add crop art renderer"
```

Expected: one commit containing the approved crop art implementation. Do not include disposable preview screenshots unless the user explicitly wants demo artifacts committed.

---

---

### Task 11: Implement Corn SVG Renderer And Styles

**Files:**
- Create: `src/ui/crop-art/cornCrop.ts`
- Create: `src/styles/crop-art/_corn.scss`
- Modify: `src/ui/crop-art/cropArtTypes.ts`
- Modify: `src/ui/crop-art/cropArt.ts`
- Modify: `src/styles/main.scss`

- [ ] **Step 1: Register corn in CropArtCropId**
  - Add `"corn"` to `CropArtCropId` in `cropArtTypes.ts`.
- [ ] **Step 2: Create cornCrop.ts**
  - Implement `renderCornCrop(state: CropArtState)` returning SVG layers corresponding to the Corn mockup stages (Stage00, Stage01, Stage02, Stage03, Dead).
  - Structure: tall stem (`carrot-stem` style equivalent), broad leaves draping outward, and corn husks with silk tassels for the ready state.
- [ ] **Step 3: Create _corn.scss**
  - Define custom colors for corn leaves (golden green) and corn ears (bright yellow).
  - Add a gentle sway animation tailored to tall plants.
- [ ] **Step 4: Integrate and import**
  - Import `renderCornCrop` in `cropArt.ts` and dispatch when `cropId === "corn"`.
  - Import `@use "./crop-art/corn";` in `src/styles/main.scss`.
- [ ] **Step 5: Add unit tests**
  - Verify corn SVG elements, classes, and stable anchor `(120, 132)` in `cropArt.test.ts`.

---

### Task 12: Implement Potato SVG Renderer And Styles

**Files:**
- Create: `src/ui/crop-art/potatoCrop.ts`
- Create: `src/styles/crop-art/_potato.scss`
- Modify: `src/ui/crop-art/cropArtTypes.ts`
- Modify: `src/ui/crop-art/cropArt.ts`
- Modify: `src/styles/main.scss`

- [ ] **Step 1: Register potato in CropArtCropId**
  - Add `"potato"` to `CropArtCropId` in `cropArtTypes.ts`.
- [ ] **Step 2: Create potatoCrop.ts**
  - Implement `renderPotatoCrop(state: CropArtState)` returning SVG layers based on Potato mockup stages.
  - Structure: bushy leafy stems spread out near the ground, with semi-buried brown potato tubers showing details and cracks in the pre-harvest/ready states.
- [ ] **Step 3: Create _potato.scss**
  - Define dusty green leaf colors and dark earth potato skins.
- [ ] **Step 4: Integrate and import**
  - Import and dispatch in `cropArt.ts`.
  - Import `@use "./crop-art/potato";` in `src/styles/main.scss`.
- [ ] **Step 5: Add unit tests**
  - Verify potato SVG layout and classes.

---

### Task 13: Implement Pumpkin SVG Renderer And Styles

**Files:**
- Create: `src/ui/crop-art/pumpkinCrop.ts`
- Create: `src/styles/crop-art/_pumpkin.scss`
- Modify: `src/ui/crop-art/cropArtTypes.ts`
- Modify: `src/ui/crop-art/cropArt.ts`
- Modify: `src/styles/main.scss`

- [ ] **Step 1: Register pumpkin in CropArtCropId**
  - Add `"pumpkin"` to `CropArtCropId` in `cropArtTypes.ts`.
- [ ] **Step 2: Create pumpkinCrop.ts**
  - Implement `renderPumpkinCrop(state: CropArtState)` returning SVG layers for Pumpkin mockup stages.
  - Structure: low-lying winding vines, large broad leaves, yellow blossoms (sprout/mature), and a large ribbed orange pumpkin resting on the soil patch (ready).
- [ ] **Step 3: Create _pumpkin.scss**
  - Define bright orange pumpkin colors and ribbed shading styles.
- [ ] **Step 4: Integrate and import**
  - Import and dispatch in `cropArt.ts`.
  - Import `@use "./crop-art/pumpkin";` in `src/styles/main.scss`.
- [ ] **Step 5: Add unit tests**
  - Verify pumpkin SVG layout and classes.

---

### Task 14: Implement Strawberry SVG Renderer And Styles

**Files:**
- Create: `src/ui/crop-art/strawberryCrop.ts`
- Create: `src/styles/crop-art/_strawberry.scss`
- Modify: `src/ui/crop-art/cropArtTypes.ts`
- Modify: `src/ui/crop-art/cropArt.ts`
- Modify: `src/styles/main.scss`

- [ ] **Step 1: Register strawberry in CropArtCropId**
  - Add `"strawberry"` to `CropArtCropId` in `cropArtTypes.ts`.
- [ ] **Step 2: Create strawberryCrop.ts**
  - Implement `renderStrawberryCrop(state: CropArtState)` returning SVG layers based on Strawberry mockup stages.
  - Structure: low cluster of tri-lobed leaves, small white flowers, and hanging red berries dotted with tiny seeds in the ready state.
- [ ] **Step 3: Create _strawberry.scss**
  - Define rich red berry colors, white petal strokes, and strawberry leaf textures.
- [ ] **Step 4: Integrate and import**
  - Import and dispatch in `cropArt.ts`.
  - Import `@use "./crop-art/strawberry";` in `src/styles/main.scss`.
- [ ] **Step 5: Add unit tests**
  - Verify strawberry SVG elements, seeds, and ready state styling.

---

### Task 15: Implement Tomato SVG Renderer And Styles

**Files:**
- Create: `src/ui/crop-art/tomatoCrop.ts`
- Create: `src/styles/crop-art/_tomato.scss`
- Modify: `src/ui/crop-art/cropArtTypes.ts`
- Modify: `src/ui/crop-art/cropArt.ts`
- Modify: `src/styles/main.scss`

- [ ] **Step 1: Register tomato in CropArtCropId**
  - Add `"tomato"` to `CropArtCropId` in `cropArtTypes.ts`.
- [ ] **Step 2: Create tomatoCrop.ts**
  - Implement `renderTomatoCrop(state: CropArtState)` returning SVG layers for Tomato mockup stages.
  - Structure: vertical leafy stem, small yellow flowers (sprout/mature), and hanging clusters of round tomatoes (green in mature, bright red with highlights in ready).
- [ ] **Step 3: Create _tomato.scss**
  - Define vibrant red tomato colors and leaf textures.
- [ ] **Step 4: Integrate and import**
  - Import and dispatch in `cropArt.ts`.
  - Import `@use "./crop-art/tomato";` in `src/styles/main.scss`.
- [ ] **Step 5: Add unit tests**
  - Verify tomato SVG layouts and classes.

---

### Task 16: Implement Wheat SVG Renderer And Styles

**Files:**
- Create: `src/ui/crop-art/wheatCrop.ts`
- Create: `src/styles/crop-art/_wheat.scss`
- Modify: `src/ui/crop-art/cropArtTypes.ts`
- Modify: `src/ui/crop-art/cropArt.ts`
- Modify: `src/styles/main.scss`

- [ ] **Step 1: Register wheat in CropArtCropId**
  - Add `"wheat"` to `CropArtCropId` in `cropArtTypes.ts`.
- [ ] **Step 2: Create wheatCrop.ts**
  - Implement `renderWheatCrop(state: CropArtState)` returning SVG layers for Wheat mockup stages.
  - Structure: multiple slender stalks bunched together, thin leaves, and dense grain heads (light green in mature, golden-yellow in ready).
- [ ] **Step 3: Create _wheat.scss**
  - Define golden wheat gradients and a collective sway animation simulating wheat fields waving in the wind.
- [ ] **Step 4: Integrate and import**
  - Import and dispatch in `cropArt.ts`.
  - Import `@use "./crop-art/wheat";` in `src/styles/main.scss`.
- [ ] **Step 5: Add unit tests**
  - Verify wheat SVG layout and stable fields.

---

## Self-Review

- Spec coverage: The plan covers the selected stack, crop-owned soil patch, stable state anchors, SCSS ownership, no runtime animation packages, renderer integration, and focused verification.
- Placeholder scan: No task contains TBD/TODO placeholders. Each implementation task names concrete files, code, commands, and expected outcomes.
- Type consistency: `CropArtInput`, `CropArtState`, `SoilPatchState`, `renderSoilPatch()`, `renderCarrotCrop()`, and `renderCropArt()` are defined before use in later tasks.
- Scope check: This plan implements carrot first as the reusable pattern, then extends support to corn, potato, pumpkin, strawberry, tomato, and wheat in tasks 11-16 based on the provided mockup assets.

