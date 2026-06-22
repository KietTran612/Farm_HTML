import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { handleCropsRequest, handleSaveRequest, handleTraceRequest } from "./editorMiddleware";

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
});
