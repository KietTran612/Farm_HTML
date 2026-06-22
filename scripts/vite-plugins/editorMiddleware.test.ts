import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { existsSync, readFileSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import {
  handleCleanupRequest,
  handleCropStageAssetsRequest,
  handleCropsRequest,
  handleSaveRequest,
  handleSaveStageAnimationRequest,
  handleTraceRequest
} from "./editorMiddleware";

describe("Editor Middleware API", () => {
  const testAssetsDir = resolve("src/assets/crops/test-crop");

  beforeEach(() => {
    if (existsSync(testAssetsDir)) {
      rmSync(testAssetsDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (existsSync(testAssetsDir)) {
      rmSync(testAssetsDir, { recursive: true, force: true });
    }
  });

  it("lists crops correctly from docs/Crops directory", () => {
    const crops = handleCropsRequest();
    expect(Array.isArray(crops)).toBe(true);
    
    const corn = crops.find(c => c.name.toLowerCase() === "corn");
    expect(corn).toBeDefined();
    expect(corn!.pngs.length).toBeGreaterThan(0);
    expect(corn!.pngs[0]).toContain("World_Crop_Corn_Body_");
  });

  it("saves stage mappings and creates meta.json file", () => {
    const mockSavePayload = {
      cropName: "test-crop",
      stages: {
        stage00: "<svg>stage 0</svg>",
        stage01: "<svg>stage 1</svg>",
        dead: "<svg>dead</svg>"
      }
    };

    handleSaveRequest(mockSavePayload);

    const stage00Path = join(testAssetsDir, "stage00.svg");
    const stage01Path = join(testAssetsDir, "stage01.svg");
    const deadPath = join(testAssetsDir, "dead.svg");
    const metaPath = join(testAssetsDir, "meta.json");

    expect(existsSync(stage00Path)).toBe(true);
    expect(existsSync(stage01Path)).toBe(true);
    expect(existsSync(deadPath)).toBe(true);
    expect(existsSync(metaPath)).toBe(true);

    expect(readFileSync(stage00Path, "utf8")).toBe("<svg>stage 0</svg>");
    expect(readFileSync(deadPath, "utf8")).toBe("<svg>dead</svg>");

    const meta = JSON.parse(readFileSync(metaPath, "utf8"));
    expect(meta.cropName).toBe("test-crop");
    expect(meta.stages.stage00).toBe("stage00.svg");
    expect(meta.stages.stage01).toBe("stage01.svg");
    expect(meta.stages.dead).toBe("dead.svg");
  });

  it("runs VTracer CLI and returns raw/optimized SVGs and metrics", () => {
    const result = handleTraceRequest({
      inputPath: "docs/Crops/Corn/World_Crop_Corn_Body_Stage00.png",
      params: {
        color_precision: 6,
        filter_speckle: 8,
        gradient_step: 20
      }
    });

    expect(result).toBeDefined();
    expect(result.rawSvg).toContain("<svg");
    expect(result.optimizedSvg).toContain("<svg");
    expect(result.metrics).toBeDefined();
    expect(result.metrics.raw.pathCount).toBeGreaterThan(0);
    expect(result.metrics.optimized.pathCount).toBeGreaterThan(0);
  });

  it("cleans up generated directory for a specific crop", () => {
    const testCropDir = resolve("docs/Crops/test-cleanup-crop");
    const generatedDir = join(testCropDir, "SVG", "Generated");
    
    if (!existsSync(generatedDir)) {
      mkdirSync(generatedDir, { recursive: true });
    }
    const dummyFile = join(generatedDir, "dummy.svg");
    writeFileSync(dummyFile, "<svg></svg>", "utf8");

    expect(existsSync(dummyFile)).toBe(true);

    const cleanupResult = handleCleanupRequest({ cropName: "test-cleanup-crop" });
    expect(cleanupResult.success).toBe(true);
    expect(existsSync(generatedDir)).toBe(false);

    // Cleanup the parent test directory too
    if (existsSync(testCropDir)) {
      rmSync(testCropDir, { recursive: true, force: true });
    }
  });

  it("loads stage assets and prefers grouped SVGs when present", () => {
    mkdirSync(testAssetsDir, { recursive: true });
    writeFileSync(join(testAssetsDir, "stage01.svg"), "<svg><path d=\"M0 0\" /></svg>", "utf8");
    writeFileSync(join(testAssetsDir, "stage01.grouped.svg"), "<svg><g class=\"crop-part crop-part--stem\"><path d=\"M0 0\" /></g></svg>", "utf8");
    writeFileSync(join(testAssetsDir, "animations.json"), JSON.stringify({
      crop: "test-crop",
      stages: {
        stage01: {
          sourceFile: "stage01.svg",
          groupedFile: "stage01.grouped.svg",
          parts: {
            stem: { animation: "soft-sway" }
          }
        }
      }
    }), "utf8");
    writeFileSync(join(testAssetsDir, "meta.json"), JSON.stringify({
      cropName: "test-crop",
      stages: { stage01: "stage01.svg" },
      groupedStages: { stage01: "stage01.grouped.svg" },
      animations: "animations.json"
    }), "utf8");

    const result = handleCropStageAssetsRequest({ cropName: "test-crop" });

    expect(result.cropName).toBe("test-crop");
    expect(result.stages[0]).toMatchObject({
      stageId: "stage01",
      sourceFile: "stage01.svg",
      groupedFile: "stage01.grouped.svg",
      activeFile: "stage01.grouped.svg",
      hasGroupedSvg: true
    });
    expect(result.stages[0].sourceSvg).toContain("<path");
    expect(result.stages[0].groupedSvg).toContain("crop-part--stem");
    expect(result.stages[0].activeSvg).toContain("crop-part--stem");
    expect(result.animations.stages.stage01.parts.stem.animation).toBe("soft-sway");
  });

  it("rejects unsafe crop names when loading stage assets", () => {
    expect(() => handleCropStageAssetsRequest({ cropName: "../corn" })).toThrow("Invalid crop name");
  });

  it("saves grouped SVGs, sanitizes unsafe markup, and merges animation metadata", () => {
    mkdirSync(testAssetsDir, { recursive: true });
    writeFileSync(join(testAssetsDir, "stage01.svg"), "<svg><path d=\"M0 0\" /></svg>", "utf8");
    writeFileSync(join(testAssetsDir, "stage02.svg"), "<svg><path d=\"M1 1\" /></svg>", "utf8");
    writeFileSync(join(testAssetsDir, "meta.json"), JSON.stringify({
      cropName: "test-crop",
      stages: {
        stage01: "stage01.svg",
        stage02: "stage02.svg"
      }
    }), "utf8");
    writeFileSync(join(testAssetsDir, "animations.json"), JSON.stringify({
      crop: "test-crop",
      stages: {
        stage02: {
          sourceFile: "stage02.svg",
          groupedFile: "stage02.grouped.svg",
          parts: {
            leaves: { animation: "leaf-breathe" }
          }
        }
      }
    }), "utf8");

    const result = handleSaveStageAnimationRequest({
      cropName: "test-crop",
      stageId: "stage01",
      groupedSvg: "<svg onclick=\"bad()\"><script>alert(1)</script><foreignObject></foreignObject><a href=\"https://example.com\"><path d=\"M0 0\" /></a><g class=\"crop-part crop-part--stem\"><path d=\"M0 0\" /></g></svg>",
      animationConfig: {
        parts: {
          stem: { animation: "soft-sway" }
        }
      }
    });

    expect(result.success).toBe(true);
    const groupedSvg = readFileSync(join(testAssetsDir, "stage01.grouped.svg"), "utf8");
    expect(groupedSvg).toContain("crop-part--stem");
    expect(groupedSvg).not.toContain("<script");
    expect(groupedSvg).not.toContain("foreignObject");
    expect(groupedSvg).not.toContain("onclick");
    expect(groupedSvg).not.toContain("https://example.com");

    const meta = JSON.parse(readFileSync(join(testAssetsDir, "meta.json"), "utf8"));
    expect(meta.groupedStages.stage01).toBe("stage01.grouped.svg");
    expect(meta.animations).toBe("animations.json");

    const animations = JSON.parse(readFileSync(join(testAssetsDir, "animations.json"), "utf8"));
    expect(animations.stages.stage01.parts.stem.animation).toBe("soft-sway");
    expect(animations.stages.stage02.parts.leaves.animation).toBe("leaf-breathe");
  });
});
