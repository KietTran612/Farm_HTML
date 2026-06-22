export interface ViewportPoint {
  clientX: number;
  clientY: number;
}

export interface ViewportRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export function toUnscaledCanvasPoint(
  point: ViewportPoint,
  rect: ViewportRect,
  canvasSize: CanvasSize
): { x: number; y: number } {
  return {
    x: ((point.clientX - rect.left) / rect.width) * canvasSize.width,
    y: ((point.clientY - rect.top) / rect.height) * canvasSize.height
  };
}
