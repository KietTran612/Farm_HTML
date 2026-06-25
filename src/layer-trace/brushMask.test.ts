import { describe, expect, it } from "vitest";
import { drawStrokeOnMask, clearMask } from "./brushMask";

describe("Brush Mask Utilities", () => {
  it("draws a stroke on a mask context correctly", () => {
    // Mock canvas context
    const drawnPoints: any[] = [];
    const mockCtx = {
      beginPath: () => {},
      moveTo: (x: number, y: number) => { drawnPoints.push({ type: "move", x, y }); },
      lineTo: (x: number, y: number) => { drawnPoints.push({ type: "line", x, y }); },
      stroke: () => { drawnPoints.push({ type: "stroke" }); },
      closePath: () => {},
      save: () => {},
      restore: () => {},
      lineWidth: 0,
      lineCap: "",
      lineJoin: "",
      strokeStyle: "",
      globalCompositeOperation: ""
    } as unknown as CanvasRenderingContext2D;

    drawStrokeOnMask(mockCtx, { x: 10, y: 10 }, { x: 20, y: 20 }, 5, "brush");

    expect(mockCtx.lineWidth).toBe(10); // 2 * radius
    expect(mockCtx.lineCap).toBe("round");
    expect(mockCtx.strokeStyle).toBe("#ffffff");
    expect(mockCtx.globalCompositeOperation).toBe("source-over");
    expect(drawnPoints).toContainEqual({ type: "move", x: 10, y: 10 });
    expect(drawnPoints).toContainEqual({ type: "line", x: 20, y: 20 });
  });

  it("sets composite operation to destination-out when erasing", () => {
    const mockCtx = {
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      save: () => {},
      restore: () => {},
      globalCompositeOperation: "source-over"
    } as unknown as CanvasRenderingContext2D;

    drawStrokeOnMask(mockCtx, { x: 10, y: 10 }, { x: 20, y: 20 }, 5, "eraser");
    expect(mockCtx.globalCompositeOperation).toBe("destination-out");
  });

  it("clears the mask canvas correctly", () => {
    let clearedRect: any = null;
    const mockCtx = {
      clearRect: (x: number, y: number, w: number, h: number) => {
        clearedRect = { x, y, w, h };
      }
    } as unknown as CanvasRenderingContext2D;

    clearMask(mockCtx, 100, 200);
    expect(clearedRect).toEqual({ x: 0, y: 0, w: 100, h: 200 });
  });
});
