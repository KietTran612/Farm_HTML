import { describe, expect, it } from "vitest";
// @ts-expect-error - svg-metrics is a raw ES module script
import { collectSvgMetricsFromText } from "../../../scripts/vtracer/svg-metrics.mjs";

describe("collectSvgMetricsFromText", () => {
  it("counts paths, groups, inline styles, unique fills, and viewBox", () => {
    const svg = `
      <svg viewBox="0 0 240 180" style="display: block;">
        <g class="corn-leaves">
          <path d="M0 0 L1 1" style="fill: #50A441;"/>
          <path d="M1 1 L2 2" style="fill: #50a441;"/>
          <path d="M2 2 L3 3" fill="#E8C84A"/>
        </g>
      </svg>
    `;

    expect(collectSvgMetricsFromText(svg)).toEqual({
      bytes: expect.any(Number),
      pathCount: 3,
      groupCount: 1,
      inlineStyleCount: 3,
      uniqueFillCount: 2,
      viewBox: "0 0 240 180"
    });
  });
});
