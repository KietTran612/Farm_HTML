export interface Point {
  x: number;
  y: number;
}

export type BrushMode = "brush" | "eraser";

export function drawStrokeOnMask(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  radius: number,
  mode: BrushMode
): void {
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = radius * 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (mode === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
  } else {
    ctx.globalCompositeOperation = "source-over";
  }

  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

export function clearMask(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
}
