import type { PackedLayer } from "./common";
import type { Camera3D, CanvasSize, Vec3 } from "../types";

/**
 * Shared scene layout math, in three.js-style world space (y up, camera at +z
 * looking toward -z, px units). Mirrors RUNTIME_SNIPPET in core/scene.ts so
 * every engine exporter reconstructs the exact editor framing.
 * Engine-specific handedness flips happen in the individual exporters.
 */

export interface LayerPlacement {
  /** node position in px, three-space */
  position: Vec3;
  /** child mesh offset (ground layers pivot at the near edge) */
  meshOffset: Vec3;
  /** euler degrees, three.js XYZ order: vertical = (0,0,rot), ground = (90,0,rot) */
  eulerDeg: Vec3;
  /** plane size in px */
  width: number;
  height: number;
}

export function layerPlacement(p: PackedLayer, canvas: CanvasSize): LayerPlacement {
  const l = p.layer;
  const w = (p.width ?? canvas.width) * l.scale;
  const h = (p.height ?? canvas.height) * l.scale;
  const H = canvas.height;
  if (l.orientation === "ground") {
    return {
      position: { x: l.offsetX + w / 2, y: H - l.offsetY, z: -l.depth },
      meshOffset: { x: 0, y: -h / 2, z: 0 },
      eulerDeg: { x: 90, y: 0, z: l.rotation },
      width: w,
      height: h,
    };
  }
  return {
    position: { x: l.offsetX + w / 2, y: H - l.offsetY - h / 2, z: -l.depth },
    meshOffset: { x: 0, y: 0, z: 0 },
    eulerDeg: { x: 0, y: 0, z: l.rotation },
    width: w,
    height: h,
  };
}

/** Camera position/look-at in three-space (matches runtime applyCamera). */
export function cameraVectors(cam: Camera3D, canvas: CanvasSize): { pos: Vec3; target: Vec3 } {
  const H = canvas.height;
  return {
    pos: { x: cam.position.x, y: H - cam.position.y, z: cam.position.z },
    target: { x: cam.target.x, y: H - cam.target.y, z: -cam.target.z },
  };
}

/**
 * Euler (pitch, yaw) that makes a -z-forward camera look from pos → target.
 * With R = Ry(yaw)·Rx(pitch), forward = (-sin y·cos p, sin p, -cos y·cos p).
 */
export function lookEuler(pos: Vec3, target: Vec3): { pitch: number; yaw: number } {
  const dx = target.x - pos.x;
  const dy = target.y - pos.y;
  const dz = target.z - pos.z;
  const len = Math.hypot(dx, dy, dz) || 1;
  return {
    pitch: Math.asin(dy / len),
    yaw: Math.atan2(-dx / len, -dz / len),
  };
}

/** "#RRGGBB" → "Color(r, g, b, a)" with 0–1 floats. */
export function godotColor(hex: string, alpha = 1): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const v = m ? parseInt(m[1], 16) : 0;
  const r = ((v >> 16) & 255) / 255;
  const g = ((v >> 8) & 255) / 255;
  const b = (v & 255) / 255;
  return `Color(${f(r)}, ${f(g)}, ${f(b)}, ${f(alpha)})`;
}

/** Compact float formatting for generated scene files. */
export function f(n: number): string {
  const s = n.toFixed(4);
  return s.replace(/\.?0+$/, "") || "0";
}

export const deg = (d: number): number => (d * Math.PI) / 180;

/** Godot node-name safe identifier. */
export function safeName(s: string, fallback: string): string {
  const out = s.replace(/[^\w]+/g, "_").replace(/^_+|_+$/g, "");
  return out || fallback;
}
