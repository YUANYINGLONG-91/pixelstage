/**
 * Layer staging for placeholder scenes — the math that plants billboards and
 * characters on the three.js stage. Preserved from the v2 placeholder pass:
 * billboard bases painted in screen rows, ground plane receding to the
 * horizon, characters planted by exact foot math.
 */

import { createLayer, focalDistance, type Layer } from "../types";
import { renderCharacter, type Archetype } from "./characters";

export const W = 960;
export const H = 540;
/** Ground textures are 960×960: top row = near edge, bottom row = horizon. */
export const G = 960;
/** Camera distance to the focal plane with the default 40° FOV (≈742). */
export const FOCAL = focalDistance({ width: W, height: H }, 40);

/**
 * Billboard at `depth`, scaled/offset so a 960×540 image painted in screen
 * coordinates maps ~`net`:1 onto the screen (net > 1 = enlarge, for
 * foreground frames). Centered on the camera axis.
 */
export function billboard(
  name: string,
  src: string,
  depth: number,
  net = 1,
  extra: Partial<Layer> = {}
): Layer {
  const scale = (net * (FOCAL + depth)) / FOCAL;
  return createLayer({
    name,
    src,
    depth,
    scale,
    offsetX: (W - W * scale) / 2,
    offsetY: (H - H * scale) / 2,
    ...extra,
  });
}

/**
 * Floor plane at world height 0. Near edge sits just in front of the focal
 * plane (depth −100) and the texture recedes to a horizon hidden behind the
 * backdrop. Texture top row = nearest ground. Scale 1.9 keeps the floor
 * wider than the frame under the tilted diorama camera.
 */
export function groundPlane(name: string, src: string, extra: Partial<Layer> = {}): Layer {
  const scale = 1.9;
  return createLayer({
    name,
    src,
    orientation: "ground",
    depth: -100,
    scale,
    offsetX: (W - W * scale) / 2,
    offsetY: H,
    ...extra,
  });
}

/**
 * Screen row (in a full-canvas billboard) where the ground plane projects at
 * a given depth — paint prop bases at this row and they stand on the floor.
 * Piecewise fit measured against the diorama cameras (0→540, 150→495,
 * 350→454, 700→420).
 */
export function baseRow(depth: number): number {
  const pts: [number, number][] = [
    [-100, 560],
    [0, 540],
    [150, 495],
    [350, 454],
    [700, 420],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    const [d0, r0] = pts[i];
    const [d1, r1] = pts[i + 1];
    if (depth <= d1) return Math.round(r0 + ((r1 - r0) * (depth - d0)) / (d1 - d0));
  }
  return pts[pts.length - 1][1];
}

/**
 * Ground-texture row (cells, from the TOP = near edge) under a prop standing
 * at `depth` — where to paint its light pool / footprints / rubble.
 */
export function groundRow(depth: number): number {
  return Math.round((depth + 100) / 1.9 / 2);
}

/**
 * Character sprite as its own billboard, feet planted exactly on the ground
 * plane (world y = 0) at screen column `footX`. `lit` so the sun shades it
 * and it casts a real silhouette shadow (|depth| ≤ 120 keeps it in the
 * caster budget).
 */
export function characterLayer(
  name: string,
  kind: Archetype,
  footX: number,
  depth: number,
  net = 1
): Layer {
  const { src, w, h } = renderCharacter(kind);
  const scale = (net * (FOCAL + depth)) / FOCAL;
  return createLayer({
    name,
    src,
    depth,
    scale,
    lit: true,
    offsetX: footX - (w * scale) / 2,
    offsetY: H - h * scale,
  });
}
