import type { SvgLayerInput } from "./layerComposer";

export interface ParsedLayeredSvg {
  width: number;
  height: number;
  layers: SvgLayerInput[];
}

export function parseLayeredSvg(svgText: string): ParsedLayeredSvg {
  const parser = new DOMParser();
  const document = parser.parseFromString(svgText, "image/svg+xml");
  const svg = document.querySelector("svg");
  if (!svg) {
    throw new Error("Saved stage SVG must include a root svg element.");
  }

  const { width, height } = readSvgSize(svg);
  const rootDefs = readRootDefs(svg);
  const groups = Array.from(svg.querySelectorAll("g.crop-part"));
  const orderedGroups = groups
    .map((group, domIndex) => ({
      group,
      domIndex,
      layerIndex: readLayerIndex(group)
    }))
    .sort((a, b) => {
      if (a.layerIndex === b.layerIndex) {
        return a.domIndex - b.domIndex;
      }
      return a.layerIndex - b.layerIndex;
    });

  return {
    width,
    height,
    layers: orderedGroups.map(({ group, domIndex }) => {
      const isHidden = group.getAttribute("display") === "none";
      return {
        groupId: group.getAttribute("data-group-id") || `loaded-layer-${domIndex}`,
        label: readLayerLabel(group),
        svgText: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">\n${rootDefs}${group.innerHTML.trim()}\n</svg>`,
        hidden: isHidden
      };
    })
  };
}

function readRootDefs(svg: Element): string {
  return Array.from(svg.children)
    .filter((child) => child.tagName.toLowerCase() === "defs")
    .map((defs) => `${defs.outerHTML}\n`)
    .join("");
}

function readSvgSize(svg: Element): { width: number; height: number } {
  const viewBox = svg.getAttribute("viewBox") || "";
  const [, , width, height] = viewBox.trim().split(/\s+/).map(Number);
  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return { width, height };
  }

  const attrWidth = Number(svg.getAttribute("width"));
  const attrHeight = Number(svg.getAttribute("height"));
  if (Number.isFinite(attrWidth) && Number.isFinite(attrHeight) && attrWidth > 0 && attrHeight > 0) {
    return { width: attrWidth, height: attrHeight };
  }

  throw new Error("Saved stage SVG must include a valid viewBox or width/height.");
}

function readLayerIndex(group: Element): number {
  const value = Number(group.getAttribute("data-layer-index"));
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function readLayerLabel(group: Element): string {
  const className = group.getAttribute("class") || "";
  const partClass = className.split(/\s+/).find((name) => name.startsWith("crop-part--"));
  return partClass?.replace("crop-part--", "") || "layer";
}
