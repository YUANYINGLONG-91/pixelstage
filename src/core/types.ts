/** Core data model — engine-agnostic, mirrors scene.json schema v2 (HD-2D). */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Layer {
  id: string;
  name: string;
  /** dataURL or asset path */
  src: string;
  /** world position in px, UI coords (origin top-left, y down) */
  offsetX: number;
  offsetY: number;
  /** z position in px. 0 = focal plane, >0 = farther away, <0 = nearer than focal plane */
  depth: number;
  scale: number;
  /** vertical = billboard facing camera · ground = floor plane receding to the horizon */
  orientation: "vertical" | "ground";
  /** lit = shaded by scene lights · unlit = full-bright (sky, glow overlays) */
  lit: boolean;
  visible: boolean;
  /** 0–1 opacity multiplier over the texture */
  opacity: number;
  /** mirror the texture horizontally / vertically */
  flipX: boolean;
  flipY: boolean;
  /** in-plane spin, degrees (ground layers yaw around their near-edge pivot) */
  rotation: number;
  /** editor-only: locked layers can't be picked, dragged or nudged in the viewport */
  locked: boolean;
}

export interface Camera3D {
  /** world position, px, UI coords (y down; stage3d flips internally) */
  position: Vec3;
  /** look-at point, same space */
  target: Vec3;
  /** vertical field of view, degrees (20–90) */
  fov: number;
}

export interface RenderEffects {
  dof: { enabled: boolean; /** world depth (z) in sharpest focus */ focus: number; /** blur amount 0–1 */ aperture: number };
  fog: { enabled: boolean; color: string; near: number; far: number };
  ambient: { color: string; intensity: number };
  sun: { color: string; intensity: number; /** degrees around Y */ azimuth: number; /** degrees above horizon */ elevation: number };
  /** HDR glow around bright pixels — the HD-2D signature (lanterns, sun, neon) */
  bloom: { enabled: boolean; strength: number; /** luminance cutoff 0–1 */ threshold: number };
  /** film finishing: corner darkening, saturation punch, animated grain */
  grade: { vignette: number; saturation: number; grain: number };
  /** drifting motes/embers in the air volume around the focal plane */
  particles: { enabled: boolean; color: string; count: number; /** world px */ size: number; speed: number };
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface SceneFile {
  version: 2;
  name: string;
  canvas: CanvasSize;
  camera: Camera3D;
  effects: RenderEffects;
  /** index 0 = farthest (drawn first, back-to-front) */
  layers: Layer[];
  /** saved camera framings (editor convenience; absent in pre-bookmark files) */
  bookmarks: Camera3D[];
}

export const SCENE_VERSION = 2 as const;

/** Distance at which a plane at depth 0 is rendered 1:1 (canvas height fills the view). */
export function focalDistance(canvas: CanvasSize, fovDeg: number): number {
  return canvas.height / 2 / Math.tan((fovDeg * Math.PI) / 360);
}

/** Default framing: camera straight-on, stage centered, pixels 1:1 at the focal plane. */
export function defaultCamera(canvas: CanvasSize, fov = 40): Camera3D {
  const d = focalDistance(canvas, fov);
  return {
    position: { x: canvas.width / 2, y: canvas.height / 2, z: d },
    target: { x: canvas.width / 2, y: canvas.height / 2, z: 0 },
    fov,
  };
}

/**
 * v1 → v2 mapping: with the camera at distance D, a billboard at depth z shifts
 * on screen by (D−z)/D per unit of camera motion; v1 shifted by factorX.
 * Solving (D−z)/D = f gives z = D·(1−f). factorY has no 3D equivalent and is dropped.
 */
export function depthFromFactor(f: number, D: number): number {
  return D * (1 - Math.min(f, 2));
}

export function defaultEffects(): RenderEffects {
  return {
    dof: { enabled: false, focus: 0, aperture: 0.3 },
    fog: { enabled: false, color: "#0A0C10", near: 400, far: 2400 },
    ambient: { color: "#B8C4E0", intensity: 0.9 },
    sun: { color: "#FFF2D8", intensity: 1.1, azimuth: 35, elevation: 50 },
    bloom: { enabled: true, strength: 0.55, threshold: 0.55 },
    grade: { vignette: 0.4, saturation: 1.1, grain: 0.05 },
    particles: { enabled: false, color: "#FFD98A", count: 100, size: 3, speed: 1 },
  };
}

export function createLayer(partial: Partial<Layer> & { name: string; src: string }): Layer {
  return {
    id: partial.id ?? crypto.randomUUID(),
    offsetX: 0,
    offsetY: 0,
    depth: 0,
    scale: 1,
    orientation: "vertical",
    lit: true,
    visible: true,
    opacity: 1,
    flipX: false,
    flipY: false,
    rotation: 0,
    locked: false,
    ...partial,
  };
}
