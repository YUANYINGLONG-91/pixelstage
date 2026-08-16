/**
 * Prop painters — buildings and set dressing, composed from materials.ts.
 * All props are drawn feet-on-the-ground: yBase = the ground line in cells.
 * Sun is always upper-right: lit faces on the right, shadows on the left,
 * warm window cores (HOT) feed the engine's bloom pass.
 */

import { HOT, type Painter, type RGB, hexToRgb, mix, ramp } from "./pixel";
import {
  banner as bannerCloth,
  planks,
  shingleRoof,
  snowCap,
  stoneWall,
  timberFrame,
} from "./materials";

/* ----------------------------------- house ----------------------------------- */

export interface HouseOpts {
  floors?: 1 | 2;
  roof: string; // roof base color
  plaster?: string;
  beam?: string;
  stone?: string;
  snow?: boolean;
  litWindows?: number; // how many windows glow
}

/**
 * Half-timbered medieval house: stone ground floor, timber-framed upper
 * floor(s), steep shingle roof with gable, warm mullioned windows, door with
 * a step. Drawn between (x, yBase−h) and (x+w, yBase) in cells.
 */
export function house(p: Painter, x: number, yBase: number, w: number, h: number, opts: HouseOpts) {
  const rng = p.rng;
  const stone = ramp(opts.stone ?? "#6A6274");
  const plaster = ramp(opts.plaster ?? "#D8C9A8");
  const beam = ramp(opts.beam ?? "#4A3226");
  const roof = ramp(opts.roof);
  const floors = opts.floors ?? 2;

  const roofH = Math.round(h * 0.34);
  const wallH = h - roofH;
  const groundH = floors === 2 ? Math.round(wallH * 0.45) : wallH;
  const upperH = wallH - groundH;

  // — roof: steep gable, overhanging eaves —
  const eave = 3;
  const rx = x - eave;
  const rw = w + eave * 2;
  const ry = yBase - h;
  // gable triangle
  for (let i = 0; i < roofH; i++) {
    const t = i / roofH;
    const gw = Math.round((rw / 2) * t);
    p.rect(x + w / 2 - gw, ry + roofH - i, gw * 2, 1, roof[1]);
  }
  shingleRoof(p, rx, ry + roofH - Math.round(roofH * 0.86), rw, Math.round(roofH * 0.86), roof);
  // ridge + sun-lit right slope
  p.rect(x + w / 2 - 1, ry, 3, 2, roof[0]);
  p.rect(x + w / 2 + 1, ry + 2, Math.max(2, rw / 2 - 4), 2, roof[3], 0.5);
  if (opts.snow) snowCap(p, rx + 2, ry + Math.round(roofH * 0.2), rw - 4, ramp("#C8D8EC"));
  // chimney with a warm wisp
  p.rect(x + Math.round(w * 0.7), ry + 2, 3, 5, stone[1]);
  p.rect(x + Math.round(w * 0.7), ry + 1, 3, 1, stone[2]);
  if (rng() < 0.8) {
    for (let i = 0; i < 3; i++) p.px(x + Math.round(w * 0.7) + 1 + Math.floor(rng() * 2), ry - 1 - i, [200, 200, 210], 0.25 - i * 0.06);
  }

  // — upper floor: jettied (overhangs the ground floor by 1 cell) —
  const uy = yBase - wallH;
  if (floors === 2) {
    timberFrame(p, x - 1, uy, w + 2, upperH, plaster, beam, Math.max(8, Math.round(w / 3)));
    // jetty beam shadow on the stone below
    p.rect(x - 1, uy + upperH - 1, w + 2, 1, beam[0]);
  }

  // — ground floor: stone —
  const gy = yBase - groundH;
  stoneWall(p, x, gy, w, groundH, stone, 9, 4);

  // — door with step and lintel —
  const dw = Math.max(4, Math.round(w * 0.16));
  const dx = x + Math.round(w * (rng() < 0.5 ? 0.18 : 0.66));
  const dh = Math.min(groundH - 2, 9);
  p.rect(dx - 1, yBase - dh - 1, dw + 2, dh + 1, beam[1]); // frame
  p.rect(dx, yBase - dh, dw, dh, mix(beam[0], [20, 14, 12], 0.4));
  p.rect(dx, yBase - dh, 1, dh, beam[2], 0.5);
  p.px(dx + dw - 2, yBase - Math.floor(dh / 2), HOT); // knob glint
  p.rect(dx - 1, yBase, dw + 2, 1, stone[2]); // step

  // — windows: shutters + warm mullioned glow —
  const winCount = Math.max(1, Math.floor(w / 14));
  const lit = opts.litWindows ?? winCount;
  for (let i = 0; i < winCount; i++) {
    const wx = x + 3 + Math.round(((w - 7) * (i + 0.5)) / winCount) - 2;
    const wy = floors === 2 ? uy + Math.round(upperH * 0.35) : gy + 3;
    const isLit = i < lit;
    window(p, wx, wy, 5, 6, beam, isLit ? "#FFC45E" : "#2A2436", isLit);
    if (floors === 2 && groundH > 10 && i % 2 === 0) {
      window(p, wx, gy + 3, 5, 5, stone, isLit ? "#FFB648" : "#241F30", isLit && rng() < 0.7);
    }
  }
  return { roofY: ry };
}

/** Mullioned window with shutters; lit windows get a white-hot core. */
export function window(
  p: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  frame: RGB[],
  glass: string,
  lit: boolean
) {
  const g = hexToRgb(glass);
  p.rect(x - 1, y - 1, w + 2, h + 2, frame[1]); // frame
  if (lit) p.glow(x + Math.floor(w / 2), y + Math.floor(h / 2), Math.max(w, h), g, 4, 0.35);
  p.rect(x, y, w, h, g);
  if (lit) {
    p.rect(x + 1, y + 1, w - 2, h - 2, mix(g, [255, 255, 255], 0.35));
    p.rect(x + Math.floor(w / 2) - 1, y + 1, 2, 2, HOT);
  } else {
    p.rect(x, y, w, 1, mix(g, [255, 255, 255], 0.12)); // sky reflection
  }
  // mullions
  p.rect(x + Math.floor(w / 2), y, 1, h, frame[0]);
  p.rect(x, y + Math.floor(h / 2), w, 1, frame[0]);
  // shutters
  p.rect(x - 3, y - 1, 2, h + 2, frame[2]);
  p.rect(x + w + 1, y - 1, 2, h + 2, frame[2]);
}

/* --------------------------------- market stall --------------------------------- */

/** Market stall: posts, striped awning, counter with goods. */
export function marketStall(p: Painter, x: number, yBase: number, w: number, awning: string, goods: string[]) {
  const a = ramp(awning);
  const wood = ramp("#6A4A2E");
  const h = 14;
  // posts
  p.rect(x, yBase - h, 2, h, wood[1]);
  p.rect(x + w - 2, yBase - h, 2, h, wood[2]);
  // awning: stripes + scalloped edge
  for (let gx = 0; gx < w + 4; gx += 4) {
    const alt = (gx / 4) % 2 === 0;
    p.rect(x - 2 + gx, yBase - h - 3, 4, 3, alt ? a[2] : a[4]);
    p.rect(x - 2 + gx, yBase - h - 3, 4, 1, alt ? a[3] : a[5]);
  }
  for (let gx = 0; gx < w + 4; gx += 4) {
    p.px(x - 1 + gx, yBase - h, (gx / 4) % 2 === 0 ? a[1] : mix(a[3], a[1], 0.5));
    p.px(x + 1 + gx, yBase - h, (gx / 4) % 2 === 0 ? a[1] : mix(a[3], a[1], 0.5));
  }
  // counter
  p.rect(x + 1, yBase - 5, w - 2, 4, wood[2]);
  p.rect(x + 1, yBase - 5, w - 2, 1, wood[3]);
  p.rect(x + 1, yBase - 1, w - 2, 1, wood[0]);
  // goods: colored piles on the counter
  const rng = p.rng;
  for (let i = 0; i < goods.length; i++) {
    const g = ramp(goods[i]);
    const gx = x + 3 + Math.floor((i * (w - 6)) / goods.length);
    p.blob(gx, yBase - 6, 2, g[1]);
    p.blob(gx, yBase - 7, 1, g[2]);
    p.px(gx, yBase - 8, g[4]);
    void rng;
  }
}

/* ------------------------------------ well ------------------------------------ */

/** Stone well with a little timber roof and bucket. */
export function well(p: Painter, x: number, yBase: number, w: number) {
  const stone = ramp("#6A6274");
  const wood = ramp("#6A4A2E");
  const roof = ramp("#8C4A3A");
  stoneWall(p, x, yBase - 5, w, 5, stone, 6, 2);
  p.rect(x - 1, yBase - 6, w + 2, 1, stone[3]); // rim
  // posts + gable roof
  p.rect(x + 1, yBase - 13, 1, 8, wood[1]);
  p.rect(x + w - 2, yBase - 13, 1, 8, wood[2]);
  p.poly(
    [
      [x - 2, yBase - 12],
      [x + w / 2, yBase - 17],
      [x + w + 2, yBase - 12],
    ],
    roof[1]
  );
  p.poly(
    [
      [x - 1, yBase - 12],
      [x + w / 2, yBase - 16],
      [x + w + 1, yBase - 12],
    ],
    roof[2]
  );
  // rope + bucket
  p.rect(x + Math.floor(w / 2), yBase - 12, 1, 5, wood[0]);
  p.rect(x + Math.floor(w / 2) - 1, yBase - 7, 3, 3, wood[2]);
  p.rect(x + Math.floor(w / 2) - 1, yBase - 7, 3, 1, wood[3]);
}

/* ----------------------------------- fences ----------------------------------- */

export function fence(p: Painter, x0: number, x1: number, yBase: number, tone = "#6A4A2E", snow = false) {
  const wood = ramp(tone);
  for (let x = x0; x < x1; x += 6) {
    p.rect(x, yBase - 5, 2, 5, wood[2]);
    p.rect(x, yBase - 6, 2, 1, wood[3]);
    if (snow) snowCap(p, x, yBase - 7, 2, ramp("#C8D8EC"));
  }
  p.rect(x0, yBase - 4, x1 - x0, 1, wood[1]);
  p.rect(x0, yBase - 2, x1 - x0, 1, wood[1]);
}

/* ----------------------------------- lanterns ----------------------------------- */

/** Stone lantern with a white-hot fire core (bloom turns it into real glow). */
export function stoneLantern(p: Painter, x: number, yBase: number, s: number, flame = "#FFB648") {
  const stone = ramp("#5A5E6A");
  const fire = hexToRgb(flame);
  p.glow(x, yBase - 7 * s, 9 * s, fire, 6, 0.5);
  p.rect(x - 2 * s, yBase - 1 * s, 4 * s, s, stone[1]); // plinth
  p.rect(x - s, yBase - 6 * s, 2 * s, 5 * s, stone[2]); // pillar
  p.rect(x - 2 * s, yBase - 9 * s, 4 * s, 3 * s, stone[2]); // fire box
  p.rect(x - 2 * s, yBase - 9 * s, 4 * s, s, stone[3]);
  p.rect(x - s, yBase - 8 * s, 2 * s, 2 * s, fire); // flame
  p.rect(x - s, yBase - 8 * s, 2 * s, s, HOT);
  p.rect(x - 3 * s, yBase - 10 * s, 6 * s, s, stone[1]); // roof
  p.rect(x - s, yBase - 11 * s, 2 * s, s, stone[2]); // finial
}

/** Cast-iron street lamp on a post, warm cone of light. */
export function streetLamp(p: Painter, x: number, yBase: number, h: number, flame = "#FFC45E") {
  const iron = ramp("#2E2A38");
  const fire = hexToRgb(flame);
  p.rect(x - 1, yBase - h, 2, h, iron[2]);
  p.rect(x - 1, yBase - h, 1, h, iron[3], 0.6);
  p.glow(x, yBase - h - 2, 8, fire, 5, 0.5);
  p.rect(x - 2, yBase - h - 5, 5, 4, iron[1]); // head
  p.rect(x - 1, yBase - h - 4, 3, 3, fire);
  p.px(x, yBase - h - 3, HOT);
  p.rect(x - 2, yBase - h - 6, 5, 1, iron[2]); // cap
}

/* ------------------------------------ torii ------------------------------------ */

/** Shrine gate, weathered vermilion, hanging lantern with a hot core. */
export function torii(p: Painter, x: number, yBase: number, s: number, flame = "#FFB648") {
  const red = ramp("#A03A2E");
  const dark = ramp("#3A2A26");
  p.rect(x - 9 * s, yBase - 20 * s, 3 * s, 20 * s, red[1]); // pillars
  p.rect(x + 6 * s, yBase - 20 * s, 3 * s, 20 * s, red[2]);
  p.rect(x + 8 * s, yBase - 20 * s, s, 20 * s, red[3], 0.5); // sun edge
  p.rect(x - 10 * s, yBase - s, 5 * s, s, dark[2]); // foot stones
  p.rect(x + 5 * s, yBase - s, 5 * s, s, dark[2]);
  p.rect(x - 12 * s, yBase - 22 * s, 24 * s, 2 * s, red[1]); // top beam
  p.rect(x - 13 * s, yBase - 24 * s, 26 * s, 2 * s, dark[1]); // curved cap
  p.rect(x - 13 * s, yBase - 24 * s, 26 * s, s, dark[3], 0.4);
  p.rect(x - 10 * s, yBase - 16 * s, 20 * s, 2 * s, red[2]); // second beam
  p.rect(x - s, yBase - 22 * s, 2 * s, 6 * s, red[1]); // center strut
  // hanging lantern
  p.glow(x, yBase - 11 * s, 6 * s, hexToRgb(flame), 4, 0.5);
  p.rect(x - s, yBase - 13 * s, 2 * s, 4 * s, dark[2]);
  p.rect(x - s, yBase - 12 * s, 2 * s, 2 * s, hexToRgb(flame));
  p.px(x, yBase - 11 * s, HOT);
}

/* ---------------------------------- small props ---------------------------------- */

export function barrel(p: Painter, x: number, yBase: number, s: number) {
  const wood = ramp("#6A4A2E");
  p.rect(x - 2 * s, yBase - 5 * s, 4 * s, 5 * s, wood[2]);
  p.rect(x - 2 * s, yBase - 5 * s, s, 5 * s, wood[1]); // stave shade
  p.rect(x + s, yBase - 5 * s, s, 5 * s, wood[3], 0.6);
  p.rect(x - 2 * s, yBase - 4 * s, 4 * s, s, wood[0]); // hoops
  p.rect(x - 2 * s, yBase - 2 * s, 4 * s, s, wood[0]);
}

export function crate(p: Painter, x: number, yBase: number, s: number) {
  const wood = ramp("#7A5A36");
  planks(p, x - 3 * s, yBase - 5 * s, 6 * s, 5 * s, wood);
  p.rect(x - 3 * s, yBase - 5 * s, 6 * s, s, wood[1], 0.7); // frame
  for (let i = 0; i < 5; i++) p.px(x - 3 * s + i, yBase - 5 * s + i, wood[1]); // diagonal
}

/** Wooden signpost with a hanging sign. */
export function signpost(p: Painter, x: number, yBase: number, tone = "#6A4A2E") {
  const wood = ramp(tone);
  p.rect(x - 1, yBase - 10, 2, 10, wood[2]);
  p.rect(x - 1, yBase - 10, 1, 10, wood[3], 0.5);
  p.rect(x - 5, yBase - 9, 10, 4, wood[1]);
  p.rect(x - 4, yBase - 8, 8, 2, wood[2]);
  p.rect(x - 4, yBase - 8, 8, 1, wood[3], 0.5);
}

/** Banner on a tall pole, flying right. */
export function bannerPole(p: Painter, x: number, yBase: number, h: number, color: string) {
  const wood = ramp("#4A3626");
  const cloth = ramp(color);
  p.rect(x, yBase - h, 1, h, wood[2]);
  bannerCloth(p, x + 1, yBase - h + 1, 7, 10, cloth);
}

/* ----------------------------------- neon (alley) ----------------------------------- */

/** Vertical neon sign: armored frame, bright tube, white-hot core, glyph slots. */
export function neonSign(p: Painter, x: number, y: number, h: number, color: string) {
  const c = hexToRgb(color);
  p.glow(x + 4, y + Math.floor(h / 2), Math.max(8, Math.floor(h * 0.62)), c, 5, 0.65);
  p.rect(x - 1, y - 1, 9, h + 2, [10, 12, 22]); // frame
  p.rect(x, y, 7, h, mix(c, [255, 255, 255], 0.45)); // tube face
  p.rect(x + 2, y + 1, 3, h - 2, [255, 255, 255]); // hot core
  // glyph slots
  for (let gy = y + 2; gy < y + h - 3; gy += 6) {
    p.rect(x + 1, gy, 5, 3, mix(c, [8, 10, 18], 0.4));
  }
  p.rect(x + 1, y - 3, 5, 2, [16, 18, 30]); // mounting bracket
}

/** AC unit with fan grille. */
export function acUnit(p: Painter, x: number, y: number) {
  const metal = ramp("#3A4054");
  p.rect(x, y, 11, 8, metal[1]);
  p.rect(x, y, 11, 1, metal[3], 0.5);
  for (let i = 0; i < 4; i++) p.rect(x + 1 + i * 2, y + 2, 1, 5, metal[0]);
  p.px(x + 9, y + 6, [230, 120, 90]); // status LED
}
