import type { Plugin } from "vite";
import { existsSync, readdirSync, writeFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { Buffer } from "node:buffer";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { optimize } from "svgo";
import { sanitizeSvgText } from "../../src/animation-editor/groupEditor";
// @ts-ignore
import { collectSvgMetricsFromText } from "../vtracer/svg-metrics.mjs";

export interface CropFolder {
  name: string;
  pngs: string[];
}

export interface CropData {
  name: string;
  folders: CropFolder[];
}

export interface SavePayload {
  cropName: string;
  stages: Record<string, string>; // stageName -> svgContent
}

export interface CleanupPayload {
  cropName?: string;
}

export interface CropStageAssetsPayload {
  cropName: string;
}

export interface CropStageAssetsResponse {
  cropName: string;
  meta: {
    cropName: string;
    stages: Record<string, string>;
    groupedStages?: Record<string, string>;
    animations?: string;
  };
  stages: Array<{
    stageId: string;
    sourceFile?: string;
    groupedFile?: string;
    sourceSvg?: string;
    groupedSvg?: string;
    activeSvg: string;
    activeFile: string;
    hasGroupedSvg: boolean;
  }>;
  animations: any;
}

export interface SaveStageAnimationPayload {
  cropName: string;
  stageId: string;
  groupedSvg: string;
  animationConfig: Record<string, any>;
}


export interface TraceParams {
  colormode?: string;
  mode?: string;
  hierarchical?: string;
  color_precision?: number;
  filter_speckle?: number;
  gradient_step?: number;
  corner_threshold?: number;
  segment_length?: number;
  splice_threshold?: number;
  path_precision?: number;
}

export interface TraceLayerPayload {
  imageDataUrl: string;
  params: TraceParams;
  preset?: string;
}

const SERVER_PRESETS: Record<string, TraceParams> = {
  gameDetailed: {
    colormode: "color",
    mode: "spline",
    hierarchical: "cutout",
    color_precision: 8,
    filter_speckle: 3,
    gradient_step: 6,
    corner_threshold: 60,
    segment_length: 3.5,
    splice_threshold: 45,
    path_precision: 3
  },
  animationCandidate: {
    colormode: "color",
    mode: "spline",
    hierarchical: "cutout",
    color_precision: 7,
    filter_speckle: 6,
    gradient_step: 14,
    corner_threshold: 60,
    segment_length: 4.0,
    splice_threshold: 45,
    path_precision: 3
  }
};

function scanCropDir(dirPath: string, rootCropDir: string, relativePath: string = ""): CropFolder[] {
  const entries = readdirSync(dirPath, { withFileTypes: true });
  const pngs: string[] = [];
  const subDirs: { name: string; path: string; rel: string }[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      subDirs.push({
        name: entry.name,
        path: join(dirPath, entry.name),
        rel: relativePath ? `${relativePath}/${entry.name}` : entry.name
      });
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) {
      const cropName = resolve(rootCropDir).split(/[\\/]/).pop() || "";
      const fileRelPath = relativePath ? `${cropName}/${relativePath}/${entry.name}` : `${cropName}/${entry.name}`;
      pngs.push(`docs/Crops/${fileRelPath}`);
    }
  }

  let foldersResult: CropFolder[] = [];
  
  if (pngs.length > 0) {
    foldersResult.push({
      name: relativePath || "[Gốc]",
      pngs
    });
  }

  for (const sub of subDirs) {
    const subResult = scanCropDir(sub.path, rootCropDir, sub.rel);
    foldersResult = foldersResult.concat(subResult);
  }

  return foldersResult;
}

export function handleCropsRequest(): CropData[] {
  const cropsDir = resolve("docs/Crops");
  if (!existsSync(cropsDir)) {
    return [];
  }

  const entries = readdirSync(cropsDir, { withFileTypes: true });
  const crops: CropData[] = [];

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== "SVG" && entry.name !== "Generated") {
      const cropName = entry.name;
      const cropPath = join(cropsDir, cropName);
      
      const folders = scanCropDir(cropPath, cropPath);

      crops.push({
        name: cropName,
        folders
      });
    }
  }

  return crops;
}

export function handleSaveRequest(payload: SavePayload): { success: boolean } {
  const { cropName, stages } = payload;
  if (!cropName || !stages) {
    throw new Error("Invalid payload: cropName and stages are required.");
  }

  const targetDir = resolve("src/assets/crops", cropName.toLowerCase());
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  const metaPath = join(targetDir, "meta.json");
  const existingMeta = existsSync(metaPath)
    ? JSON.parse(readFileSync(metaPath, "utf8"))
    : {};
  const metaStages: Record<string, string> = {};

  for (const [stageName, svgContent] of Object.entries(stages)) {
    const fileName = `${stageName}.svg`;
    const filePath = join(targetDir, fileName);
    writeFileSync(filePath, svgContent, "utf8");
    metaStages[stageName] = fileName;
  }

  const metaContent = {
    ...existingMeta,
    cropName,
    stages: {
      ...(existingMeta.stages || {}),
      ...metaStages
    }
  };
  writeFileSync(metaPath, JSON.stringify(metaContent, null, 2), "utf8");

  return { success: true };
}

export function handleCleanupRequest(payload: CleanupPayload): { success: boolean } {
  const { cropName } = payload;
  const cropsDir = resolve("docs/Crops");
  if (!existsSync(cropsDir)) {
    return { success: true };
  }

  const entries = readdirSync(cropsDir, { withFileTypes: true });

  if (cropName) {
    const match = entries.find(e => e.isDirectory() && e.name.toLowerCase() === cropName.toLowerCase());
    if (match) {
      const targetGeneratedDir = join(cropsDir, match.name, "SVG", "Generated");
      if (existsSync(targetGeneratedDir)) {
        rmSync(targetGeneratedDir, { recursive: true, force: true });
      }
    }
  } else {
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== "SVG" && entry.name !== "Generated") {
        const targetGeneratedDir = join(cropsDir, entry.name, "SVG", "Generated");
        if (existsSync(targetGeneratedDir)) {
          rmSync(targetGeneratedDir, { recursive: true, force: true });
        }
      }
    }
  }

  return { success: true };
}

export function handleCropStageAssetsRequest(payload: CropStageAssetsPayload): CropStageAssetsResponse {
  const cropName = normalizeCropName(payload.cropName);
  const cropDir = resolve("src/assets/crops", cropName);
  if (!existsSync(cropDir)) {
    throw new Error(`Crop assets not found: ${cropName}`);
  }

  const metaPath = join(cropDir, "meta.json");
  if (!existsSync(metaPath)) {
    throw new Error(`Crop meta not found: ${cropName}`);
  }

  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  const stages = Object.entries(meta.stages || {}).map(([stageId, sourceFileValue]) => {
    const sourceFile = String(sourceFileValue);
    const groupedFile = meta.groupedStages?.[stageId] ? String(meta.groupedStages[stageId]) : undefined;
    const sourceSvg = readCropAssetFile(cropDir, sourceFile);
    const groupedSvg = groupedFile ? readCropAssetFile(cropDir, groupedFile) : undefined;
    const activeFile = groupedFile && groupedSvg ? groupedFile : sourceFile;
    const activeSvg = groupedSvg || sourceSvg;

    return {
      stageId,
      sourceFile,
      groupedFile,
      sourceSvg,
      groupedSvg,
      activeSvg,
      activeFile,
      hasGroupedSvg: Boolean(groupedSvg)
    };
  });

  const animations = meta.animations
    ? JSON.parse(readCropAssetFile(cropDir, String(meta.animations)))
    : { crop: meta.cropName || cropName, stages: {} };

  return {
    cropName,
    meta,
    stages,
    animations
  };
}

export function handleSaveStageAnimationRequest(payload: SaveStageAnimationPayload): { success: boolean } {
  const cropName = normalizeCropName(payload.cropName);
  const { stageId } = payload;
  if (!/^[a-zA-Z0-9_-]+$/.test(stageId)) {
    throw new Error("Invalid stage id.");
  }

  const cropDir = resolve("src/assets/crops", cropName);
  if (!existsSync(cropDir)) {
    throw new Error(`Crop assets not found: ${cropName}`);
  }

  const metaPath = join(cropDir, "meta.json");
  if (!existsSync(metaPath)) {
    throw new Error(`Crop meta not found: ${cropName}`);
  }

  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  if (!meta.stages?.[stageId]) {
    throw new Error(`Stage not found: ${stageId}`);
  }

  const sanitizedSvg = sanitizeSvgText(payload.groupedSvg);
  if (!/<svg\b[^>]*>/i.test(sanitizedSvg)) {
    throw new Error("Grouped SVG must include a root <svg> element.");
  }
  const existingGroupIds = extractGroupedSvgLayerIds(sanitizedSvg);
  const animationConfig = {
    ...payload.animationConfig,
    parts: pruneAnimationParts(payload.animationConfig?.parts || {}, existingGroupIds)
  };

  const groupedFile = `${stageId}.grouped.svg`;
  writeFileSync(join(cropDir, groupedFile), sanitizedSvg, "utf8");

  const animationsFile = "animations.json";
  const animationsPath = join(cropDir, animationsFile);
  const existingAnimations = existsSync(animationsPath)
    ? JSON.parse(readFileSync(animationsPath, "utf8"))
    : { crop: meta.cropName || cropName, stages: {} };

  const nextAnimations = {
    ...existingAnimations,
    crop: existingAnimations.crop || meta.cropName || cropName,
    stages: {
      ...(existingAnimations.stages || {}),
      [stageId]: {
        sourceFile: meta.stages[stageId],
        groupedFile,
        ...animationConfig
      }
    }
  };

  writeFileSync(animationsPath, JSON.stringify(nextAnimations, null, 2), "utf8");

  const nextMeta = {
    ...meta,
    groupedStages: {
      ...(meta.groupedStages || {}),
      [stageId]: groupedFile
    },
    animations: animationsFile
  };
  writeFileSync(metaPath, JSON.stringify(nextMeta, null, 2), "utf8");

  return { success: true };
}

function extractGroupedSvgLayerIds(svgText: string): Set<string> {
  return new Set(
    Array.from(svgText.matchAll(/<g\b[^>]*\bdata-group-id=["']([^"']+)["'][^>]*>/gi))
      .map((match) => match[1])
      .filter(Boolean)
  );
}

function pruneAnimationParts(parts: Record<string, any>, existingGroupIds: Set<string>): Record<string, any> {
  if (existingGroupIds.size === 0) {
    return parts;
  }

  return Object.fromEntries(
    Object.entries(parts).filter(([groupId]) => existingGroupIds.has(groupId))
  );
}


export function detectVTracer(): string | null {
  const possiblePaths = [
    process.env.VTRACER_BIN,
    "vtracer",
    resolve("scripts/vtracer/bin/vtracer.exe"),
    resolve("scripts/vtracer/bin/vtracer"),
    "D:/bin/vtracer.exe",
    "d:/bin/vtracer.exe",
    "D:/bin/vtracer",
    "d:/bin/vtracer"
  ].filter((p): p is string => typeof p === "string" && p !== "");

  for (const p of possiblePaths) {
    if (p !== "vtracer" && !existsSync(p)) {
      continue;
    }
    try {
      const result = spawnSync(p, ["--help"], {
        encoding: "utf8",
        shell: process.platform === "win32"
      });
      if (result.status === 0) {
        const output = `${result.stdout}\n${result.stderr}`.trim();
        if (output.includes("--input") && output.includes("--output")) {
          return p;
        }
      }
    } catch {
      // Ignore spawn errors
    }
  }
  return null;
}

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
  writeFileSync(inputPath, Buffer.from(match[1], "base64" as BufferEncoding));

  try {
    if (payload.preset === "hybridDetailedCandidate") {
      const resCandidate = runVTracerOnFile(inputPath, SERVER_PRESETS.animationCandidate);
      const resDetailed = runVTracerOnFile(inputPath, SERVER_PRESETS.gameDetailed);

      const extractPaths = (svg: string) => {
        const m = svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
        return m ? m[1].trim() : "";
      };

      const pathsCandidate = extractPaths(resCandidate.rawSvg);
      const pathsDetailed = extractPaths(resDetailed.rawSvg);

      const rootMatch = resCandidate.rawSvg.match(/<svg[^>]*>/i);
      const rootTag = rootMatch ? rootMatch[0] : '<svg xmlns="http://www.w3.org/2000/svg">';

      const mergedRawSvg = `${rootTag}\n${pathsCandidate}\n${pathsDetailed}\n</svg>`;

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

    return runVTracerOnFile(inputPath, payload.params);
  } finally {
    if (existsSync(inputPath)) {
      rmSync(inputPath, { force: true });
    }
  }
}

function runVTracerOnFile(fullInputPath: string, params: TraceParams): any {

  const binary = detectVTracer();
  if (!binary) {
    throw new Error("VTracer CLI binary not found.");
  }

  const tmpDir = resolve("docs/Crops/Generated/tmp");
  if (!existsSync(tmpDir)) {
    mkdirSync(tmpDir, { recursive: true });
  }
  const randomName = `trace_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const tmpRawSvg = join(tmpDir, `${randomName}.raw.svg`);

  const colormode = params.colormode || "color";
  const mode = params.mode || "spline";
  const hierarchical = params.hierarchical || "stacked";
  const color_precision = params.color_precision ?? 7;
  const filter_speckle = params.filter_speckle ?? 5;
  const gradient_step = params.gradient_step ?? 14;
  const corner_threshold = params.corner_threshold ?? 60;
  const segment_length = params.segment_length ?? 4.0;
  const splice_threshold = params.splice_threshold ?? 45;
  const path_precision = params.path_precision ?? 2;

  const cliArgs = [
    "--input", fullInputPath,
    "--output", tmpRawSvg,
    "--colormode", colormode,
    "--mode", mode,
    "--hierarchical", hierarchical,
    "--color_precision", String(color_precision),
    "--filter_speckle", String(filter_speckle),
    "--gradient_step", String(gradient_step),
    "--corner_threshold", String(corner_threshold),
    "--segment_length", String(segment_length),
    "--splice_threshold", String(splice_threshold),
    "--path_precision", String(path_precision)
  ];

  const traceResult = spawnSync(binary, cliArgs, {
    encoding: "utf8",
    shell: process.platform === "win32"
  });

  if (traceResult.error || traceResult.status !== 0) {
    if (existsSync(tmpRawSvg)) {
      rmSync(tmpRawSvg, { force: true });
    }
    throw new Error(traceResult.error?.message || traceResult.stderr || "Tracing failed.");
  }

  const rawText = readFileSync(tmpRawSvg, "utf8");

  const optimized = optimize(rawText, {
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
    rmSync(tmpRawSvg, { force: true });
    throw new Error("SVGO optimization failed.");
  }

  rmSync(tmpRawSvg, { force: true });

  const rawMetrics = collectSvgMetricsFromText(rawText);
  const optimizedMetrics = collectSvgMetricsFromText(optimizedText);

  return {
    rawSvg: rawText,
    optimizedSvg: optimizedText,
    metrics: {
      raw: rawMetrics,
      optimized: optimizedMetrics
    }
  };
}

function readRequestBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: any) => {
      body += chunk;
    });
    req.on("end", () => {
      resolve(body);
    });
    req.on("error", (err: any) => {
      reject(err);
    });
  });
}

function normalizeCropName(cropName: string): string {
  if (!cropName || !/^[a-zA-Z0-9_-]+$/.test(cropName)) {
    throw new Error("Invalid crop name.");
  }
  return cropName.toLowerCase();
}

function readCropAssetFile(cropDir: string, fileName: string): string {
  if (!/^[a-zA-Z0-9_.-]+$/.test(fileName)) {
    throw new Error("Invalid crop asset file name.");
  }

  const fullPath = join(cropDir, fileName);
  if (!existsSync(fullPath)) {
    throw new Error(`Crop asset file not found: ${fileName}`);
  }
  return readFileSync(fullPath, "utf8");
}

export function cropEditorPlugin(): Plugin {
  return {
    name: "crop-editor-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) {
          return next();
        }

        const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
        const pathname = url.pathname;

        if (!pathname.startsWith("/api/editor/")) {
          return next();
        }

        res.setHeader("Content-Type", "application/json");

        try {
          if (pathname === "/api/editor/crops" && req.method === "GET") {
            const crops = handleCropsRequest();
            res.statusCode = 200;
            res.end(JSON.stringify(crops));
            return;
          }

          if (pathname === "/api/editor/trace-layer" && req.method === "POST") {
            const bodyText = await readRequestBody(req);
            const payload = JSON.parse(bodyText) as TraceLayerPayload;
            const result = handleTraceLayerRequest(payload);
            res.statusCode = 200;
            res.end(JSON.stringify(result));
            return;
          }

          if (pathname === "/api/editor/save" && req.method === "POST") {
            const bodyText = await readRequestBody(req);
            const payload = JSON.parse(bodyText) as SavePayload;
            const result = handleSaveRequest(payload);
            res.statusCode = 200;
            res.end(JSON.stringify(result));
            return;
          }

          if (pathname === "/api/editor/cleanup" && req.method === "POST") {
            const bodyText = await readRequestBody(req);
            const payload = JSON.parse(bodyText) as CleanupPayload;
            const result = handleCleanupRequest(payload);
            res.statusCode = 200;
            res.end(JSON.stringify(result));
            return;
          }

          if (pathname === "/api/editor/crop-stage-assets" && req.method === "GET") {
            const cropName = url.searchParams.get("crop") || "";
            const result = handleCropStageAssetsRequest({ cropName });
            res.statusCode = 200;
            res.end(JSON.stringify(result));
            return;
          }

          if (pathname === "/api/editor/save-stage-animation" && req.method === "POST") {
            const bodyText = await readRequestBody(req);
            const payload = JSON.parse(bodyText) as SaveStageAnimationPayload;
            const result = handleSaveStageAnimationRequest(payload);
            res.statusCode = 200;
            res.end(JSON.stringify(result));
            return;
          }


          res.statusCode = 404;
          res.end(JSON.stringify({ error: "Endpoint not found" }));
        } catch (error: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: error.message || "Internal Server Error" }));
        }
      });
    }
  };
}
