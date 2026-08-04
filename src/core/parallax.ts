import type { Camera, CanvasSize, Layer } from "./types";

/**
 * The whole engine is one multiply (PRD §4.2):
 *   screen = layerOffset − camera × layerFactor
 * factor 0 = locked to screen · 1 = glued to camera plane · >1 = faster than camera.
 */
export function computeScreenPos(layer: Layer, camera: Camera): { x: number; y: number } {
  return {
    x: layer.offsetX - camera.x * layer.factorX,
    y: layer.offsetY - camera.y * layer.factorY,
  };
}

/** Keep the camera inside a sane range around the stage (±50% overhang per side). */
export function clampCamera(camera: Camera, size: CanvasSize): Camera {
  return {
    x: clamp(camera.x, -size.width * 0.5, size.width * 1.5),
    y: clamp(camera.y, -size.height * 0.5, size.height * 1.5),
  };
}

/** Auto-sweep path: a gentle sine around the stage center. */
export function sweepCamera(
  t: number,
  size: CanvasSize,
  opts: { rangeX?: number; rangeY?: number; period?: number } = {}
): Camera {
  const { rangeX = size.width * 0.25, rangeY = size.height * 0.06, period = 8 } = opts;
  const w = (t * 2 * Math.PI) / period;
  return {
    x: size.width / 2 + Math.sin(w) * rangeX,
    y: size.height / 2 + Math.sin(w * 0.6) * rangeY,
  };
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
