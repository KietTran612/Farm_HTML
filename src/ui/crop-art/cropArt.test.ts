import { describe, expect, it } from "vitest";
import { normalizeCropArtState, sanitizeSvgId, type CropArtInput } from "./cropArtTypes";
import { renderSoilPatch } from "./soilPatch";
import { renderCarrotCrop } from "./carrotCrop";
import { renderCropArt } from "./cropArt";
import { renderCornCrop } from "./cornCrop";
import { renderPotatoCrop } from "./potatoCrop";
import { renderPumpkinCrop } from "./pumpkinCrop";
import { renderStrawberryCrop } from "./strawberryCrop";
import { renderTomatoCrop } from "./tomatoCrop";
import { renderWheatCrop } from "./wheatCrop";

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
});

describe("renderCornCrop", () => {
  it("renders all corn state layers inside one stable art anchor", () => {
    const html = renderCornCrop("ready");

    expect(html).toContain('class="crop-plant crop-plant--corn crop-plant--ready"');
    expect(html).toContain('data-crop-anchor="120 132"');
    expect(html).toContain('class="corn-layer corn-layer--seed"');
    expect(html).toContain('class="corn-layer corn-layer--sprout"');
    expect(html).toContain('class="corn-layer corn-layer--mature"');
    expect(html).toContain('class="corn-layer corn-layer--ready"');
    expect(html).toContain('class="corn-layer corn-layer--dead"');
    expect(html).not.toContain("style=");
  });
});

describe("renderPotatoCrop", () => {
  it("renders all potato state layers inside one stable art anchor", () => {
    const html = renderPotatoCrop("ready");

    expect(html).toContain('class="crop-plant crop-plant--potato crop-plant--ready"');
    expect(html).toContain('data-crop-anchor="120 132"');
    expect(html).toContain('class="potato-layer potato-layer--seed"');
    expect(html).toContain('class="potato-layer potato-layer--sprout"');
    expect(html).toContain('class="potato-layer potato-layer--mature"');
    expect(html).toContain('class="potato-layer potato-layer--ready"');
    expect(html).toContain('class="potato-layer potato-layer--dead"');
    expect(html).not.toContain("style=");
  });
});

describe("renderPumpkinCrop", () => {
  it("renders all pumpkin state layers inside one stable art anchor", () => {
    const html = renderPumpkinCrop("ready");

    expect(html).toContain('class="crop-plant crop-plant--pumpkin crop-plant--ready"');
    expect(html).toContain('data-crop-anchor="120 132"');
    expect(html).toContain('class="pumpkin-layer pumpkin-layer--seed"');
    expect(html).toContain('class="pumpkin-layer pumpkin-layer--sprout"');
    expect(html).toContain('class="pumpkin-layer pumpkin-layer--mature"');
    expect(html).toContain('class="pumpkin-layer pumpkin-layer--ready"');
    expect(html).toContain('class="pumpkin-layer pumpkin-layer--dead"');
    expect(html).not.toContain("style=");
  });
});

describe("renderStrawberryCrop", () => {
  it("renders all strawberry state layers inside one stable art anchor", () => {
    const html = renderStrawberryCrop("ready");

    expect(html).toContain('class="crop-plant crop-plant--strawberry crop-plant--ready"');
    expect(html).toContain('data-crop-anchor="120 132"');
    expect(html).toContain('class="strawberry-layer strawberry-layer--seed"');
    expect(html).toContain('class="strawberry-layer strawberry-layer--sprout"');
    expect(html).toContain('class="strawberry-layer strawberry-layer--mature"');
    expect(html).toContain('class="strawberry-layer strawberry-layer--ready"');
    expect(html).toContain('class="strawberry-layer strawberry-layer--dead"');
    expect(html).not.toContain("style=");
  });
});

describe("renderTomatoCrop", () => {
  it("renders all tomato state layers inside one stable art anchor", () => {
    const html = renderTomatoCrop("ready");

    expect(html).toContain('class="crop-plant crop-plant--tomato crop-plant--ready"');
    expect(html).toContain('data-crop-anchor="120 132"');
    expect(html).toContain('class="tomato-layer tomato-layer--seed"');
    expect(html).toContain('class="tomato-layer tomato-layer--sprout"');
    expect(html).toContain('class="tomato-layer tomato-layer--mature"');
    expect(html).toContain('class="tomato-layer tomato-layer--ready"');
    expect(html).toContain('class="tomato-layer tomato-layer--dead"');
    expect(html).not.toContain("style=");
  });
});

describe("renderWheatCrop", () => {
  it("renders all wheat state layers inside one stable art anchor", () => {
    const html = renderWheatCrop("ready");

    expect(html).toContain('class="crop-plant crop-plant--wheat crop-plant--ready"');
    expect(html).toContain('data-crop-anchor="120 132"');
    expect(html).toContain('class="wheat-layer wheat-layer--seed"');
    expect(html).toContain('class="wheat-layer wheat-layer--sprout"');
    expect(html).toContain('class="wheat-layer wheat-layer--mature"');
    expect(html).toContain('class="wheat-layer wheat-layer--ready"');
    expect(html).toContain('class="wheat-layer wheat-layer--dead"');
    expect(html).not.toContain("style=");
  });
});



