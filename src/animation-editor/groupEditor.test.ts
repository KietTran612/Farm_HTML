import { describe, expect, it } from "vitest";
import type { CropGroup } from "./groupClassifier";
import {
  mergeGroups,
  relabelGroup,
  serializeGroupedSvg,
  splitGroup
} from "./groupEditor";

function makeGroup(id: string, pathIndexes: number[], label = id): CropGroup {
  return {
    id,
    label,
    suggestedPart: label,
    colorFamily: "green",
    regionX: "center",
    regionY: "middle",
    hidden: false,
    paths: pathIndexes.map((pathIndex) => ({
      id: `path-${pathIndex}`,
      markup: `<path fill="#3f8f3f" d="M${pathIndex} ${pathIndex}" />`,
      fill: "#3f8f3f",
      colorFamily: "green",
      pathIndex,
      bounds: {
        minX: pathIndex,
        minY: pathIndex,
        maxX: pathIndex + 1,
        maxY: pathIndex + 1
      },
      center: {
        x: pathIndex,
        y: pathIndex
      }
    }))
  };
}

describe("groupEditor operations", () => {
  it("relabels a group without changing paths", () => {
    const groups = [makeGroup("cluster-green-center-middle", [2, 1])];

    const result = relabelGroup(groups, "cluster-green-center-middle", "stem");

    expect(result[0].label).toBe("stem");
    expect(result[0].paths.map((path) => path.pathIndex)).toEqual([2, 1]);
  });

  it("merges groups and preserves original path order", () => {
    const groups = [
      makeGroup("left", [3, 1], "leaves-left"),
      makeGroup("right", [2], "leaves-right"),
      makeGroup("base", [4], "base")
    ];

    const result = mergeGroups(groups, ["left", "right"], "leaves");

    expect(result.map((group) => group.id)).toEqual(["base", "merged-leaves"]);
    expect(result[1].label).toBe("leaves");
    expect(result[1].paths.map((path) => path.pathIndex)).toEqual([1, 2, 3]);
  });

  it("splits a group by left and right regions", () => {
    const group = makeGroup("mixed", [20, 80], "leaves");
    group.paths[0].center.x = 20;
    group.paths[1].center.x = 80;

    const result = splitGroup([group], "mixed", "left-right");

    expect(result.map((entry) => entry.id)).toEqual(["mixed-left", "mixed-right"]);
    expect(result[0].paths[0].pathIndex).toBe(20);
    expect(result[1].paths[0].pathIndex).toBe(80);
  });

  it("serializes semantic groups into sanitized inline SVG", () => {
    const groups = [relabelGroup([makeGroup("stem", [1])], "stem", "stem")[0]];

    const result = serializeGroupedSvg(
      `<svg viewBox="0 0 100 100" onclick="bad()"><script>alert(1)</script><path d="M0 0" /></svg>`,
      groups,
      "corn",
      "stage01"
    );

    expect(result).toContain('class="imported-crop imported-crop--corn imported-crop--stage01"');
    expect(result).toContain('class="crop-part crop-part--stem"');
    expect(result).not.toContain("<script");
    expect(result).not.toContain("onclick");
  });

  it("keeps hidden groups in grouped SVG output with display none", () => {
    const hiddenGroup = makeGroup("hidden-leaves", [0], "leaves");
    hiddenGroup.hidden = true;

    const result = serializeGroupedSvg(
      `<svg viewBox="0 0 100 100"><path d="M0 0" /></svg>`,
      [hiddenGroup],
      "carrot",
      "stage01"
    );

    expect(result).toContain('data-group-id="hidden-leaves"');
    expect(result).toContain('display="none"');
    expect(result).toContain('crop-part--leaves');
  });

  it("preserves unassigned paths, defs, stable data-original-index, and sorts groups by minimum pathIndex", () => {
    const originalSvg = `<svg viewBox="0 0 100 100">
      <defs>
        <linearGradient id="g1" />
      </defs>
      <path d="M0 0" />
      <path d="M1 1" />
      <path d="M2 2" />
    </svg>`;

    const groups = [
      makeGroup("group1", [1], "leaves"),
      makeGroup("group2", [0], "stem")
    ];

    const result = serializeGroupedSvg(originalSvg, groups, "corn", "stage01");

    expect(result).toContain("<defs>");
    expect(result).toContain('id="g1"');

    expect(result).toContain('class="crop-part crop-part--other"');
    expect(result).toContain('data-original-index="2"');
    expect(result).toContain('data-original-index="1"');
    expect(result).toContain('data-original-index="0"');

    const stemPos = result.indexOf('class="crop-part crop-part--stem"');
    const leavesPos = result.indexOf('class="crop-part crop-part--leaves"');
    const otherPos = result.indexOf('class="crop-part crop-part--other"');

    expect(stemPos).toBeLessThan(leavesPos);
    expect(leavesPos).toBeLessThan(otherPos);
  });
});
