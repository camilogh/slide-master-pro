import type { CanvasElement, SlideDimensions } from '@/types/pptx';

/** Puntos de snap: bordes del canvas y de otros elementos */
export function getSnapPoints(
  canvasElements: CanvasElement[],
  dimensions: SlideDimensions,
  excludeId: string
): { x: number[]; y: number[] } {
  const x: number[] = [0, dimensions.width];
  const y: number[] = [0, dimensions.height];

  for (const el of canvasElements) {
    if (el.id === excludeId) continue;
    x.push(el.x, el.x + el.width);
    y.push(el.y, el.y + el.height);
  }

  return { x, y };
}

/** Encuentra el valor más cercano dentro del umbral */
function snapTo(value: number, targets: number[], threshold: number): number | null {
  for (const t of targets) {
    if (Math.abs(value - t) <= threshold) return t;
  }
  return null;
}

/** Aplica snap a posición (x, y) */
export function applySnapPosition(
  x: number,
  y: number,
  snapPoints: { x: number[]; y: number[] },
  threshold: number
): { x: number; y: number; snapX: number | null; snapY: number | null } {
  const snapX = snapTo(x, snapPoints.x, threshold);
  const snapY = snapTo(y, snapPoints.y, threshold);
  return {
    x: snapX ?? x,
    y: snapY ?? y,
    snapX: snapX,
    snapY: snapY,
  };
}
