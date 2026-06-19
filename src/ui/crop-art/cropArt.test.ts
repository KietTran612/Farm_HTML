import { describe, expect, it } from "vitest";
import { normalizeCropArtState, sanitizeSvgId, type CropArtInput } from "./cropArtTypes";
import { renderSoilPatch } from "./soilPatch";
import { renderCarrotCrop } from "./carrotCrop";
import { renderCropArt } from "./cropArt";

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



