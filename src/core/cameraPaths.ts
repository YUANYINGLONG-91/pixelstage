import type { Camera3D, CanvasSize } from "./types";

/**
 * Cinematic camera path presets (pure & testable). Each takes a base camera
 * (usually defaultCamera(canvas)) and a time t in seconds, and returns a new
 * camera. UI coords throughout (y down); stage3d flips internally.
 */

export type PathPreset = "sweep" | "orbit" | "dolly";

export const PATH_PRESETS: PathPreset[] = ["sweep", "orbit", "dolly"];

/** seconds per full loop — the WebM export records exactly one period */
export const PATH_PERIOD: Record<PathPreset, number> = { sweep: 9, orbit: 12, dolly: 10 };

export function cameraPath(
  preset: PathPreset,
  t: number,
  base: Camera3D,
  canvas: CanvasSize
): Camera3D {
  switch (preset) {
    case "sweep":
      return sweepPath(t, base, canvas);
    case "orbit":
      return orbitPath(t, base);
    case "dolly":
      return dollyPath(t, base);
  }
}

/** Gentle Lissajous pan — the modernized version of the v1 auto-sweep. */
function sweepPath(t: number, base: Camera3D, canvas: CanvasSize): Camera3D {
  const period = PATH_PERIOD.sweep;
  const w = (t * 2 * Math.PI) / period;
  const dx = Math.sin(w) * canvas.width * 0.08;
  const dy = Math.sin(w * 0.6) * canvas.height * 0.05;
  return {
    ...base,
    position: { ...base.position, x: base.position.x + dx, y: base.position.y + dy },
    target: { ...base.target, x: base.target.x + dx, y: base.target.y + dy },
  };
}

/** Yaw around the target ±10° with a slight rise — the shot that sells HD-2D. */
function orbitPath(t: number, base: Camera3D): Camera3D {
  const period = PATH_PERIOD.orbit;
  const w = (t * 2 * Math.PI) / period;
  const yaw = Math.sin(w) * (Math.PI / 18); // ±10°
  const lift = (Math.sin(w * 0.5 + 1) * 0.5 + 0.5) * base.position.z * 0.06;
  const tx = base.target.x;
  const tz = base.target.z;
  const rx = base.position.x - tx;
  const rz = base.position.z - tz;
  return {
    ...base,
    position: {
      x: tx + rx * Math.cos(yaw) - rz * Math.sin(yaw),
      y: base.position.y - lift,
      z: tz + rx * Math.sin(yaw) + rz * Math.cos(yaw),
    },
    target: { ...base.target },
  };
}

/** Slow push in/out ±15% of the base distance. */
function dollyPath(t: number, base: Camera3D): Camera3D {
  const period = PATH_PERIOD.dolly;
  const w = (t * 2 * Math.PI) / period;
  const k = 1 + Math.sin(w) * 0.15;
  return {
    ...base,
    position: {
      x: base.target.x + (base.position.x - base.target.x) * k,
      y: base.target.y + (base.position.y - base.target.y) * k,
      z: base.target.z + (base.position.z - base.target.z) * k,
    },
  };
}
