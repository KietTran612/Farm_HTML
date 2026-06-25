import { describe, expect, it, vi } from "vitest";
import { parsePsdFile, createFullSizeLayerPng } from "./psdParser";
import { readPsd } from "ag-psd";

// Mock the ag-psd library
vi.mock("ag-psd", () => {
  return {
    readPsd: vi.fn()
  };
});

describe("PSD Parser Utilities", () => {
  it("correctly parses and flattens a PSD structure", () => {
    const mockCanvas = { width: 50, height: 50 };
    const mockPsdStructure = {
      width: 200,
      height: 200,
      children: [
        {
          name: "Group 1",
          children: [
            {
              name: "Leaf Layer 1.1",
              canvas: mockCanvas,
              left: 10,
              top: 20,
              width: 50,
              height: 50,
              hidden: false
            }
          ]
        },
        {
          name: "Empty Group",
          children: []
        },
        {
          name: "Visible Layer 2",
          canvas: mockCanvas,
          left: 0,
          top: 0,
          width: 100,
          height: 100,
          hidden: false
        },
        {
          name: "Hidden Layer 3",
          canvas: mockCanvas,
          left: 5,
          top: 5,
          hidden: true
        }
      ]
    };

    vi.mocked(readPsd).mockReturnValue(mockPsdStructure as any);

    const dummyBuffer = new ArrayBuffer(0);
    const result = parsePsdFile(dummyBuffer);

    expect(readPsd).toHaveBeenCalledWith(dummyBuffer);
    expect(result.width).toBe(200);
    expect(result.height).toBe(200);
    expect(result.layers).toHaveLength(3);

    // Verify sanitized names and mapping
    expect(result.layers[0]).toEqual({
      name: "leaf-layer-1-1",
      canvas: mockCanvas,
      left: 10,
      top: 20,
      width: 50,
      height: 50,
      hidden: false
    });

    expect(result.layers[1]).toEqual({
      name: "visible-layer-2",
      canvas: mockCanvas,
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      hidden: false
    });

    expect(result.layers[2]).toEqual({
      name: "hidden-layer-3",
      canvas: mockCanvas,
      left: 5,
      top: 5,
      width: 50, // falls back to canvas.width
      height: 50, // falls back to canvas.height
      hidden: true
    });
  });

  it("composes a full-size canvas and draws the layer at the correct coordinates", () => {
    // Mock document.createElement to return a mock canvas
    const mockCtx = {
      drawImage: vi.fn()
    };
    const mockCreatedCanvas = {
      getContext: vi.fn().mockReturnValue(mockCtx),
      toDataURL: vi.fn().mockReturnValue("data:image/png;base64,mockedPngData")
    };

    const originalCreateElement = document.createElement;
    document.createElement = vi.fn().mockImplementation((tagName) => {
      if (tagName === "canvas") {
        return mockCreatedCanvas as any;
      }
      return originalCreateElement(tagName);
    });

    const mockLayerCanvas = { width: 30, height: 30 } as HTMLCanvasElement;
    const result = createFullSizeLayerPng(mockLayerCanvas, 15, 25, 100, 100);

    expect(document.createElement).toHaveBeenCalledWith("canvas");
    expect(mockCreatedCanvas.getContext).toHaveBeenCalledWith("2d");
    expect(mockCtx.drawImage).toHaveBeenCalledWith(mockLayerCanvas, 15, 25);
    expect(mockCreatedCanvas.toDataURL).toHaveBeenCalledWith("image/png");
    expect(result).toBe("data:image/png;base64,mockedPngData");

    // Restore original createElement
    document.createElement = originalCreateElement;
  });
});
