import { readPsd } from "ag-psd";
import { sanitizeToken } from "./layerComposer";

export interface FlatPsdLayer {
  name: string;
  canvas: HTMLCanvasElement;
  left: number;
  top: number;
  width: number;
  height: number;
  hidden: boolean;
}

export interface ParsedPsdResult {
  width: number;
  height: number;
  layers: FlatPsdLayer[];
}

/**
 * Parses a PSD file from an ArrayBuffer and returns a flattened list of drawable layers.
 */
export function parsePsdFile(buffer: ArrayBuffer): ParsedPsdResult {
  const psd = readPsd(buffer);
  const layers: FlatPsdLayer[] = [];

  if (psd.children) {
    traverseLayers(psd.children, layers);
  }

  return {
    width: psd.width,
    height: psd.height,
    layers
  };
}

/**
 * Recursively traverses PSD layers to find leaf layers containing drawable canvas data.
 */
function traverseLayers(psdLayers: any[], result: FlatPsdLayer[]) {
  for (const layer of psdLayers) {
    if (layer.children && layer.children.length > 0) {
      // It's a group folder, traverse its children
      traverseLayers(layer.children, result);
    } else if (layer.canvas) {
      // It's a drawable leaf layer
      const left = typeof layer.left === "number" ? layer.left : 0;
      const top = typeof layer.top === "number" ? layer.top : 0;
      const width = typeof layer.width === "number" ? layer.width : layer.canvas.width;
      const height = typeof layer.height === "number" ? layer.height : layer.canvas.height;
      const name = layer.name ? sanitizeToken(layer.name) : "layer";

      result.push({
        name,
        canvas: layer.canvas,
        left,
        top,
        width,
        height,
        hidden: !!layer.hidden
      });
    }
  }
}

/**
 * Renders a cropped layer canvas onto a full PSD-sized transparent canvas at its correct relative coordinates,
 * and exports it as a base64 encoded PNG data URL.
 */
export function createFullSizeLayerPng(
  layerCanvas: HTMLCanvasElement,
  left: number,
  top: number,
  psdWidth: number,
  psdHeight: number
): string {
  const canvas = document.createElement("canvas");
  canvas.width = psdWidth;
  canvas.height = psdHeight;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(layerCanvas, left, top);
  }
  return canvas.toDataURL("image/png");
}
