export interface SvgLayerInput {
  groupId: string;
  label: string;
  svgText: string;
}

export interface ComposeSvgOptions {
  width: number;
  height: number;
  cropId: string;
  stageId: string;
  layers: SvgLayerInput[];
}

export function composeLayeredSvg(options: ComposeSvgOptions): string {
  const defs: string[] = [];
  const groups = options.layers.map((layer, index) => {
    const prefix = sanitizeToken(layer.groupId || `layer-${index}`);
    const body = prefixInternalIds(readSvgBody(layer.svgText), prefix);
    defs.push(...extractDefs(body));
    const drawableBody = stripDefs(body).trim();
    const label = sanitizeToken(layer.label);

    return `  <g class="crop-part crop-part--${label}" data-group-id="${escapeAttribute(layer.groupId)}" data-layer-index="${index}">\n${indent(drawableBody, 4)}\n  </g>`;
  });

  const defsBlock = defs.length > 0
    ? `  <defs>\n${indent(defs.join("\n"), 4)}\n  </defs>\n`
    : "";
  const rootClass = `imported-crop imported-crop--${sanitizeToken(options.cropId)} imported-crop--${sanitizeToken(options.stageId)}`;

  return `<svg class="${rootClass}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${options.width} ${options.height}">\n${defsBlock}${groups.join("\n")}\n</svg>`;
}

function readSvgBody(svgText: string): string {
  return svgText.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i)?.[1] || svgText;
}

function extractDefs(svgBody: string): string[] {
  return Array.from(svgBody.matchAll(/<defs\b[^>]*>([\s\S]*?)<\/defs>/gi))
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function stripDefs(svgBody: string): string {
  return svgBody.replace(/<defs\b[^>]*>[\s\S]*?<\/defs>/gi, "");
}

function prefixInternalIds(svgText: string, prefix: string): string {
  let result = svgText;
  const ids = Array.from(svgText.matchAll(/\bid=["']([^"']+)["']/gi)).map((match) => match[1]);

  for (const id of ids) {
    const nextId = `${prefix}-${id}`;
    result = result
      .replace(new RegExp(`\\bid=(["'])${escapeRegExp(id)}\\1`, "g"), `id="${nextId}"`)
      .replace(new RegExp(`url\\(#${escapeRegExp(id)}\\)`, "g"), `url(#${nextId})`)
      .replace(new RegExp(`\\b(href|xlink:href)=(["'])#${escapeRegExp(id)}\\2`, "g"), `$1="#${nextId}"`);
  }

  return result;
}

function indent(value: string, spaces: number): string {
  const padding = " ".repeat(spaces);
  return value.split("\n").map((line) => line.trim() ? `${padding}${line}` : line).join("\n");
}

function sanitizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "layer";
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
