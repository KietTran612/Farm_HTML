import { describe, expect, it } from "vitest";
import { parseLayeredSvg } from "./layerParser";

describe("parseLayeredSvg", () => {
  it("rebuilds editable layers from saved crop-part groups", () => {
    const result = parseLayeredSvg(`
      <svg class="imported-crop imported-crop--carrot imported-crop--stage03" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 1024">
        <g class="crop-part crop-part--leaves" data-group-id="leaves-123" data-layer-index="0">
          <path fill="#4c6522" d="M0 0H10V10Z"/>
        </g>
        <g class="crop-part crop-part--root" data-group-id="root-456" data-layer-index="1">
          <path fill="#d17b2e" d="M20 20H30V30Z"/>
        </g>
      </svg>
    `);

    expect(result.width).toBe(768);
    expect(result.height).toBe(1024);
    expect(result.layers).toHaveLength(2);
    expect(result.layers[0]).toMatchObject({
      groupId: "leaves-123",
      label: "leaves"
    });
    expect(result.layers[0].svgText).toContain('viewBox="0 0 768 1024"');
    expect(result.layers[0].svgText).toContain('fill="#4c6522"');
    expect(result.layers[1]).toMatchObject({
      groupId: "root-456",
      label: "root"
    });
    expect(result.layers[1].svgText).toContain('fill="#d17b2e"');
  });

  it("uses DOM order when saved groups do not have layer indexes", () => {
    const result = parseLayeredSvg(`
      <svg viewBox="0 0 100 200">
        <g class="crop-part crop-part--back" data-group-id="back-group"><path d="M0 0H1"/></g>
        <g class="crop-part crop-part--front" data-group-id="front-group"><path d="M1 1H2"/></g>
      </svg>
    `);

    expect(result.layers.map((layer) => layer.label)).toEqual(["back", "front"]);
  });

  it("preserves root defs used by loaded layer paths", () => {
    const result = parseLayeredSvg(`
      <svg viewBox="0 0 64 64">
        <defs>
          <linearGradient id="leafGradient"><stop stop-color="#4c6522"/></linearGradient>
        </defs>
        <g class="crop-part crop-part--leaves" data-group-id="leaves">
          <path fill="url(#leafGradient)" d="M0 0H10V10Z"/>
        </g>
      </svg>
    `);

    expect(result.layers[0].svgText).toContain("<defs>");
    expect(result.layers[0].svgText).toContain('id="leafGradient"');
    expect(result.layers[0].svgText).toContain('fill="url(#leafGradient)"');
  });

  it("decodes hidden layers from group display none attribute", () => {
    const result = parseLayeredSvg(`
      <svg viewBox="0 0 64 64">
        <g class="crop-part crop-part--leaves" data-group-id="leaves" display="none">
          <path d="M0 0H10V10Z"/>
        </g>
        <g class="crop-part crop-part--root" data-group-id="root">
          <path d="M20 20H30V30Z"/>
        </g>
      </svg>
    `);

    expect(result.layers[0].hidden).toBe(true);
    expect(result.layers[1].hidden).toBe(false);
  });
});
