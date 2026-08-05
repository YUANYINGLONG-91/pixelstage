/**
 * Material painters — stone, timber, foliage, cloth, snow.
 * Each takes a Painter (grid coords) and a 6-tone ramp from pixel.ts.
 * Conventions: shapes are outlined with ramp[0]/ramp[1], filled with
 * ramp[2], shaded with ramp[1], lit with ramp[3..5] on the sun side (+x).
 */

import { type Painter, type RGB, bayer, mix } from "./pixel";

/* ----------------------------------- stone ----------------------------------- */

/**
 * Coursed stone wall: staggered blocks, each with a top-left bevel light and
 * bottom-right shade, occasional cracks and moss dither.
 */
export function stoneWall(
  p: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  tones: RGB[],
  blockW = 10,
  blockH = 5
) {
  const rng = p.rng;
  p.rect(x, y, w, h, tones[1]);
  for (let row = 0; row * blockH < h; row++) {
    const by = y + row * blockH;
    const off = row % 2 === 0 ? 0 : Math.floor(blockW / 2);
    for (let bx = x - off; bx < x + w; bx += blockW) {
      const bw = Math.min(blockW - 1, x + w - bx);
      if (bw <= 1) continue;
      const shade = rng() < 0.2;
      p.rect(bx, by, bw, blockH - 1, shade ? mix(tones[1], tones[2], 0.5) : tones[2]);
      p.rect(bx, by, bw, 1, tones[3]); // top bevel
      p.rect(bx, by, 1, blockH - 1, tones[3]); // left bevel
      p.rect(bx, by + blockH - 2, bw, 1, tones[1]); // bottom shade
      if (rng() < 0.12) {
        // crack
        let cx = bx + 2 + Math.floor(rng() * (bw - 4));
        let cy = by + 1;
        for (let s = 0; s < 3; s++) {
          p.px(cx, cy, tones[0]);
          cx += rng() < 0.5 ? 1 : -1;
          cy += 1;
        }
      }
      if (rng() < 0.1) p.dither(bx + 1, by + blockH - 3, 3, 2, tones[2], tones[0], 0.3);
    }
  }
}

/** Field of scattered rubble stones. */
export function rubble(p: Painter, x: number, y: number, w: number, h: number, tones: RGB[], count: number) {
  const rng = p.rng;
  for (let i = 0; i < count; i++) {
    const sx = x + Math.floor(rng() * w);
    const sy = y + Math.floor(rng() * h);
    const sw = 2 + Math.floor(rng() * 3);
    p.rect(sx, sy, sw, 1, tones[2]);
    p.rect(sx, sy, 1, 1, tones[3]);
    p.px(sx + sw, sy + 1, tones[1]);
  }
}

/* ----------------------------------- roofs ----------------------------------- */

/**
 * Shingle roof face: horizontal tile rows, each tile top-lit, each row
 * shadowed by the row above. `slope` trims the top corners (screen-px slope).
 */
export function shingleRoof(p: Painter, x: number, y: number, w: number, h: number, tones: RGB[]) {
  const rng = p.rng;
  p.rect(x, y, w, h, tones[1]);
  const rowH = 2;
  for (let ry = y; ry < y + h; ry += rowH) {
    const rowTop = ry === y;
    const tileW = 4;
    const off = ((ry - y) / rowH) % 2 === 0 ? 0 : 2;
    for (let tx = x - off; tx < x + w; tx += tileW) {
      const tw = Math.min(tileW - 1, x + w - tx);
      if (tw <= 0) continue;
      const alt = rng() < 0.25;
      p.rect(tx, ry + (rowTop ? 0 : 1), tw, rowTop ? rowH : rowH - 1, alt ? mix(tones[1], tones[2], 0.6) : tones[2]);
      p.rect(tx, ry + (rowTop ? 0 : 1), tw, 1, tones[3]);
    }
    if (!rowTop) p.rect(x, ry, w, 1, tones[0]); // row shadow line
  }
  // snow-dusted ridge highlight on the sun side
  p.rect(x + w - 3, y, 3, h, tones[3], 0.35);
}

/* ----------------------------------- timber ----------------------------------- */

/**
 * Half-timbered wall: plaster infill with a dark timber lattice (sills,
 * posts, diagonal braces). The signature medieval-town material.
 */
export function timberFrame(
  p: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  plaster: RGB[],
  beam: RGB[],
  panelW = 12
) {
  p.rect(x, y, w, h, plaster[2]);
  // plaster shading: dithered shade at the panel bottoms
  for (let py = y + 4; py < y + h; py += 8) {
    p.dither(x + 1, py, w - 2, 2, plaster[2], plaster[1], 0.25);
  }
  // beams
  p.rect(x, y, w, 2, beam[2]); // top plate
  p.rect(x, y + h - 2, w, 2, beam[1]); // sill
  for (let bx = x; bx <= x + w - 2; bx += panelW) {
    p.rect(bx, y, 2, h, beam[2]);
    p.rect(bx, y, 1, h, beam[3]); // beam edge light
  }
  p.rect(x + w - 2, y, 2, h, beam[2]);
  // diagonal braces in every other panel
  for (let bx = x; bx + panelW <= x + w; bx += panelW * 2) {
    for (let i = 0; i < Math.min(6, h - 6); i++) {
      p.rect(bx + 2 + i, y + 2 + i, 2, 1, beam[1]);
    }
  }
}

/** Vertical wood planks with grain lines and knots. */
export function planks(p: Painter, x: number, y: number, w: number, h: number, tones: RGB[]) {
  const rng = p.rng;
  p.rect(x, y, w, h, tones[2]);
  for (let bx = x; bx < x + w; bx += 4) {
    p.rect(bx, y, 1, h, tones[1]);
    // grain
    for (let gy = y + 1; gy < y + h - 1; gy += 3 + Math.floor(rng() * 4)) {
      if (rng() < 0.6) p.px(bx + 2, gy, tones[1], 0.6);
    }
    if (rng() < 0.3) {
      const ky = y + 2 + Math.floor(rng() * (h - 4));
      p.px(bx + 2, ky, tones[0]);
      p.px(bx + 2, ky + 1, tones[0]);
    }
  }
  p.rect(x, y, w, 1, tones[3]);
}

/* ---------------------------------- foliage ---------------------------------- */

/**
 * Broadleaf canopy cluster: three-tone dithered foliage with a rim-lit edge
 * on the sun side. tones = [outline, shade, mid, light].
 */
export function leafCluster(p: Painter, cx: number, cy: number, r: number, tones: RGB[]) {
  const rng = p.rng;
  p.blob(cx, cy, r, tones[0]);
  p.blob(cx, cy + 1, r - 1, tones[1]);
  p.blob(cx + 1, cy - 1, r - 2, tones[2]);
  p.blob(cx + 2, cy - 2, Math.max(1, r - 4), tones[3]);
  // dithered transition ring between mid and light
  for (let gy = cy - r; gy <= cy; gy++) {
    for (let gx = cx; gx <= cx + r; gx++) {
      const d = Math.hypot(gx - cx, gy - cy);
      if (d < r - 1 && d > r * 0.4 && bayer(gx, gy) < 0.3) p.px(gx, gy, tones[3]);
    }
  }
  p.flecks(cx + Math.floor(r * 0.4), cy - Math.floor(r * 0.4), Math.max(2, r - 3), tones[3], Math.round(r * 1.2));
}

/** Tree trunk with bark grain, root flare and a lit edge. */
export function trunk(p: Painter, x: number, yBase: number, w: number, h: number, tones: RGB[]) {
  const rng = p.rng;
  p.rect(x, yBase - h, w, h, tones[1]);
  p.rect(x + w - 1, yBase - h, 1, h, tones[2]); // sun side
  for (let gy = yBase - h + 1; gy < yBase; gy += 2) {
    if (rng() < 0.7) p.px(x + Math.floor(rng() * (w - 1)), gy, tones[0], 0.7);
  }
  // root flare
  p.rect(x - 1, yBase - 1, w + 2, 1, tones[1]);
  p.px(x - 2, yBase - 1, tones[1]);
  p.px(x + w + 1, yBase - 1, tones[1]);
}

/** Pine with blocky tiers; `snow` dusts each tier top. */
export function pineTree(
  p: Painter,
  x: number,
  yBase: number,
  h: number,
  tones: RGB[],
  snow: RGB[] | null = null
) {
  const tiers = 4;
  const trunkH = Math.round(h * 0.18);
  p.rect(x - 1, yBase - trunkH, 2, trunkH, tones[1]);
  for (let i = 0; i < tiers; i++) {
    const ty = yBase - trunkH - Math.round(((i + 0.6) * (h - trunkH)) / tiers);
    const tw = Math.round(((h * 0.62) * (tiers - i)) / tiers);
    const th = Math.max(2, Math.round(h / tiers / 2.2));
    p.rect(x - Math.floor(tw / 2), ty, tw, th, tones[1]);
    p.rect(x - Math.floor(tw / 2) + 1, ty + 1, tw - 2, th - 1, tones[2]);
    // sun-side lit edge
    p.rect(x + Math.floor(tw / 2) - 2, ty + 1, 1, th - 1, tones[3]);
    // hanging shade under each tier
    p.rect(x - Math.floor(tw / 2) + 1, ty + th - 1, tw - 2, 1, tones[0]);
    if (snow) {
      p.rect(x - Math.floor(tw / 2), ty, tw, 1, snow[3]);
      p.rect(x - Math.floor(tw / 2) + 2, ty - 1, Math.max(1, tw - 5), 1, snow[2]);
    }
  }
}

/** Grass tuft: a fan of blades, lit tips on the sun side. */
export function grassTuft(p: Painter, x: number, yBase: number, h: number, tones: RGB[], litTip = true) {
  const rng = p.rng;
  const blades = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < blades; i++) {
    const bx = x + i - Math.floor(blades / 2);
    const bh = Math.max(2, h - Math.abs(i - blades / 2) + Math.floor(rng() * 2));
    p.rect(bx, yBase - bh, 1, bh, tones[1]);
    if (litTip && bx >= x) p.px(bx, yBase - bh, tones[3]);
  }
}

/* ----------------------------------- ground ----------------------------------- */

/**
 * Single cobblestone at cell (x,y) sized w×h: rounded 3-tone stone with a
 * top-left light edge and drop shade. Ground painters tile these.
 */
export function cobble(p: Painter, x: number, y: number, w: number, h: number, tones: RGB[]) {
  p.rect(x, y, w, h, tones[2]);
  p.rect(x, y, w, 1, tones[3]);
  p.rect(x, y, 1, h, tones[3], 0.6);
  p.rect(x, y + h - 1, w, 1, tones[1]);
  p.rect(x + w - 1, y, 1, h, tones[1]);
  // corner rounding
  p.px(x, y, tones[1]);
  p.px(x + w - 1, y + h - 1, tones[0]);
}

/** Bumpy snow cap along a top edge (roofs, fences, lanterns). */
export function snowCap(p: Painter, x: number, y: number, w: number, tones: RGB[]) {
  const rng = p.rng;
  for (let gx = x; gx < x + w; gx++) {
    const bump = rng() < 0.3 ? 2 : 1;
    p.rect(gx, y - bump, 1, bump + 1, tones[2]);
    p.px(gx, y - bump, tones[3]);
  }
}

/* ----------------------------------- cloth ----------------------------------- */

/** Hanging banner with fold shading and a notched fly end. */
export function banner(p: Painter, x: number, y: number, w: number, h: number, tones: RGB[]) {
  p.rect(x, y, w, h, tones[2]);
  // vertical fold shading
  for (let fx = x + 2; fx < x + w; fx += 4) p.rect(fx, y, 1, h - 1, tones[1], 0.55);
  p.rect(x, y, 1, h, tones[3], 0.7); // hoist edge light
  // notched fly
  p.rect(x + w - 1, y + h - 2, 1, 2, tones[1]);
  p.px(x + w - 1, y + h - 3, tones[1]);
  // sigil dot
  p.rect(x + Math.floor(w / 2) - 1, y + Math.floor(h / 3), 3, 3, tones[4]);
}
