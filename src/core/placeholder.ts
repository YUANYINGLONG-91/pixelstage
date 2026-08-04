import { createLayer, type Layer, type SceneFile } from "./types";

/**
 * Programmatic placeholder art (PRD §7): ship features before real art exists.
 * Three themed sets on a shared 960×540 stage, generated on an offscreen canvas
 * with a seeded RNG so every visitor sees the same scene.
 *
 * The style goal: limited palette, visible pixels, dithered gradients — an
 * honest retro stand-in until real painted layers replace it.
 */

export type PlaceholderTheme = "valley" | "alley" | "dungeon";

const W = 960;
const H = 540;

/** Deterministic RNG so placeholder scenes are stable across reloads. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCtx(): CanvasRenderingContext2D {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

function toDataURL(ctx: CanvasRenderingContext2D): string {
  return ctx.canvas.toDataURL("image/png");
}

function hexToRgb(hex: string): number[] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: number[], b: number[], f: number): string {
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/**
 * Banded vertical gradient with ordered-dither transitions: between color
 * stops, pixels of the next color are stippled in with rising density —
 * the classic 16-bit sky look.
 */
function ditheredSky(
  ctx: CanvasRenderingContext2D,
  rng: () => number,
  stops: string[],
  ditherZone = 0.35
) {
  const cols = stops.map(hexToRgb);
  const px = 2; // stipple pixel size
  for (let y = 0; y < H; y += px) {
    const t = y / H;
    const x = t * (cols.length - 1);
    const i = Math.min(cols.length - 2, Math.floor(x));
    const f = x - i;
    ctx.fillStyle = mix(cols[i], cols[i + 1], f);
    ctx.fillRect(0, y, W, px);
    // stipple the next band's color near transitions
    if (f > 1 - ditherZone) {
      const density = (f - (1 - ditherZone)) / ditherZone;
      ctx.fillStyle = mix(cols[i], cols[i + 1], 1);
      for (let sx = ((y / px) % 2) * px; sx < W; sx += px * 2) {
        if (rng() < density * 0.7) ctx.fillRect(sx, y, px, px);
      }
    }
  }
}

/** Soft glow built from dithered concentric squares (pixel-art light). */
function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: number[], steps = 5) {
  for (let i = steps; i >= 1; i--) {
    const rr = (r * i) / steps;
    ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${(0.05 * (steps - i + 1)) / steps + 0.02})`;
    ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
}

/** Jagged silhouette ridge across the canvas. */
function ridge(
  ctx: CanvasRenderingContext2D,
  rng: () => number,
  baseY: number,
  amp: number,
  step: number,
  color: string,
  fromX = 0,
  toX = W
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(fromX, H);
  let px = fromX;
  let py = baseY;
  ctx.lineTo(fromX, baseY);
  while (px < toX) {
    const nx = px + step * (0.5 + rng());
    const ny = baseY - rng() * amp;
    ctx.lineTo(Math.round(nx / 4) * 4, Math.round(ny / 4) * 4);
    px = nx;
    py = ny;
  }
  ctx.lineTo(toX, py);
  ctx.lineTo(toX, H);
  ctx.closePath();
  ctx.fill();
}

/** Blocky pine tree at (x, groundY) with a lit side. */
function pine(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  h: number,
  color: string,
  litColor?: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 2, groundY - h * 0.22, 4, h * 0.22);
  const tiers = 4;
  for (let i = 0; i < tiers; i++) {
    const ty = groundY - h * 0.22 - ((i + 0.5) * h * 0.78) / tiers;
    const tw = (h * 0.6 * (tiers - i)) / tiers;
    const th = h / tiers / 2 + 2;
    ctx.fillRect(Math.round(x - tw / 2), Math.round(ty - th / 2), Math.round(tw), Math.round(th));
    if (litColor) {
      ctx.fillStyle = litColor;
      ctx.fillRect(Math.round(x + tw / 4), Math.round(ty - th / 2), 2, Math.round(th));
      ctx.fillStyle = color;
    }
  }
}

/** Grass clumps along a ground line with optional lit tips. */
function grass(
  ctx: CanvasRenderingContext2D,
  rng: () => number,
  groundY: number,
  color: string,
  density = 90,
  tipColor?: string
) {
  for (let i = 0; i < density; i++) {
    const x = Math.floor(rng() * W);
    const h = 8 + rng() * 26;
    const w = 3 + Math.floor(rng() * 3) * 2;
    ctx.fillStyle = color;
    ctx.fillRect(x, groundY - h, w, h);
    if (tipColor) {
      ctx.fillStyle = tipColor;
      ctx.fillRect(x, groundY - h, w, 2);
    }
  }
}

function stars(
  ctx: CanvasRenderingContext2D,
  rng: () => number,
  count: number,
  maxY: number,
  palette = ["#EDEFF5", "#A4ADBF"]
) {
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rng() * W);
    const y = Math.floor(rng() * maxY);
    const big = rng() > 0.85;
    ctx.fillStyle = palette[big ? 0 : 1];
    ctx.globalAlpha = 0.4 + rng() * 0.6;
    ctx.fillRect(x, y, 2, 2);
    if (big) {
      ctx.globalAlpha *= 0.5;
      ctx.fillRect(x - 2, y, 2, 2);
      ctx.fillRect(x + 2, y, 2, 2);
      ctx.fillRect(x, y - 2, 2, 2);
      ctx.fillRect(x, y + 2, 2, 2);
    }
  }
  ctx.globalAlpha = 1;
}

function blockyCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  color: string,
  alpha = 1
) {
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.fillRect(x, y, 14 * s, 4 * s);
  ctx.fillRect(x + 3 * s, y - 3 * s, 8 * s, 3 * s);
  ctx.fillRect(x + 5 * s, y + 4 * s, 6 * s, 2 * s);
  ctx.fillRect(x - 2 * s, y + 1 * s, 2 * s, 2 * s);
  ctx.fillRect(x + 14 * s, y + 1 * s, 2 * s, 2 * s);
  ctx.globalAlpha = 1;
}

function torii(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  s: number,
  color: string,
  glowColor: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 10 * s, groundY - 22 * s, 4 * s, 22 * s); // pillars
  ctx.fillRect(x + 6 * s, groundY - 22 * s, 4 * s, 22 * s);
  ctx.fillRect(x - 14 * s, groundY - 24 * s, 28 * s, 3 * s); // top beam
  ctx.fillRect(x - 15 * s, groundY - 25 * s, 30 * s, 2 * s); // curved cap
  ctx.fillRect(x - 11 * s, groundY - 17 * s, 22 * s, 3 * s); // second beam
  // hanging lanterns with glow
  glow(ctx, x, groundY - 11 * s, 6 * s, hexToRgb(glowColor), 4);
  ctx.fillStyle = glowColor;
  ctx.fillRect(x - 2 * s, groundY - 13 * s, 4 * s, 5 * s);
  ctx.fillStyle = color;
  ctx.fillRect(x - 1 * s, groundY - 14 * s, 2 * s, 1 * s);
}

/* ---------------------------------- themes ---------------------------------- */

function valleyLayers(): Layer[] {
  // ——— sky: dithered dusk gradient, stars, sun glow, clouds ———
  let ctx = makeCtx();
  let rng = mulberry32(11);
  ditheredSky(ctx, rng, ["#FFB648", "#C97B4A", "#6B4A6E", "#2B2540"]);
  stars(ctx, rng, 70, H * 0.42);
  // sun: layered glow + core
  glow(ctx, W * 0.69, H * 0.76, 70, hexToRgb("#FFB648"), 6);
  ctx.fillStyle = "#FFD98A";
  ctx.fillRect(W * 0.69 - 18, H * 0.76 - 18, 36, 36);
  ctx.fillStyle = "#FFB648";
  ctx.fillRect(W * 0.69 - 24, H * 0.76 - 8, 48, 16);
  blockyCloud(ctx, W * 0.12, H * 0.18, 3, "#EDEFF5", 0.22);
  blockyCloud(ctx, W * 0.45, H * 0.3, 2, "#FFC877", 0.25);
  blockyCloud(ctx, W * 0.78, H * 0.14, 2, "#EDEFF5", 0.15);
  const sky = toDataURL(ctx);

  // ——— far ridge: two hazy ridges + tiny pagoda ———
  ctx = makeCtx();
  rng = mulberry32(22);
  ridge(ctx, rng, H * 0.72, 100, 56, "#4A4364");
  // haze band between ridges
  ctx.fillStyle = "rgba(201,123,74,0.18)";
  ctx.fillRect(0, H * 0.66, W, H * 0.12);
  ridge(ctx, rng, H * 0.85, 56, 72, "#5E5578");
  // tiny pagoda on a peak
  ctx.fillStyle = "#3A3450";
  const pagX = W * 0.3;
  const pagY = H * 0.68;
  ctx.fillRect(pagX - 3, pagY - 14, 6, 14);
  ctx.fillRect(pagX - 6, pagY - 16, 12, 3);
  ctx.fillRect(pagX - 4, pagY - 20, 8, 4);
  ctx.fillStyle = "#FFB648";
  ctx.fillRect(pagX - 1, pagY - 10, 2, 3); // lit window
  const far = toDataURL(ctx);

  // ——— mid: hills, pine forest, torii gate ———
  ctx = makeCtx();
  rng = mulberry32(33);
  ridge(ctx, rng, H * 0.88, 44, 88, "#2E4A44");
  ridge(ctx, rng, H * 0.96, 24, 64, "#26403B");
  for (let i = 0; i < 16; i++) {
    pine(ctx, rng() * W, H * 0.86 + rng() * 40, 44 + rng() * 54, "#243B36", "#3A5A52");
  }
  torii(ctx, W * 0.58, H * 0.94, 2, "#1A2E2A", "#FFB648");
  // stepping stones toward the gate
  ctx.fillStyle = "#22322E";
  for (let i = 0; i < 5; i++) ctx.fillRect(W * 0.52 + i * 18, H * 0.94 + i * 4, 12, 5);
  const mid = toDataURL(ctx);

  // ——— front: amber-tipped grass, rocks, hanging branch ———
  ctx = makeCtx();
  rng = mulberry32(44);
  ctx.fillStyle = "#12141C";
  ctx.fillRect(0, H * 0.88, W, H * 0.12);
  grass(ctx, rng, H * 0.92, "#1A1E28", 90);
  grass(ctx, rng, H * 0.9, "#12141C", 70, "#C97B4A");
  // rocks
  ctx.fillStyle = "#1A1E28";
  ctx.fillRect(W * 0.75, H * 0.86, 34, 14);
  ctx.fillRect(W * 0.79, H * 0.84, 18, 8);
  ctx.fillStyle = "#323D54";
  ctx.fillRect(W * 0.75, H * 0.86, 34, 2);
  // hanging pine branch, top-left
  pine(ctx, W * 0.06, H * 0.32, 130, "#12141C");
  ctx.fillStyle = "#12141C";
  ctx.fillRect(0, 0, 90, 10);
  const front = toDataURL(ctx);

  return [
    createLayer({ name: "sky", src: sky, factorX: 0.05, factorY: 0.02 }),
    createLayer({ name: "far ridge", src: far, factorX: 0.15, factorY: 0.05 }),
    createLayer({ name: "mid hills", src: mid, factorX: 0.4, factorY: 0.12 }),
    createLayer({ name: "foreground", src: front, factorX: 0.8, factorY: 0.2 }),
  ];
}

function alleyLayers(): Layer[] {
  // ——— back: rainy night wall, lit windows, wet ground ———
  let ctx = makeCtx();
  let rng = mulberry32(55);
  ditheredSky(ctx, rng, ["#1A1D2E", "#12141F", "#0C0E18"]);
  // distant building mass
  ctx.fillStyle = "#161927";
  ctx.fillRect(0, H * 0.12, W, H * 0.76);
  ctx.fillStyle = "#12141F";
  ctx.fillRect(W * 0.3, H * 0.02, W * 0.24, H * 0.86); // taller tower
  // window grid
  for (let gy = 0; gy < 22; gy++) {
    for (let gx = 0; gx < 52; gx++) {
      const lit = rng() > 0.62;
      if (!lit && rng() > 0.25) continue;
      const wx = 14 + gx * 18;
      const wy = H * 0.16 + gy * 16;
      if (lit) {
        const cyan = rng() > 0.4;
        ctx.fillStyle = cyan ? "#43C8DC" : "#E56CF0";
        ctx.globalAlpha = 0.55 + rng() * 0.45;
        ctx.fillRect(wx, wy, 8, 10);
        ctx.globalAlpha = 0.15;
        ctx.fillRect(wx - 2, wy - 2, 12, 14); // halo
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = "#0E1120";
        ctx.fillRect(wx, wy, 8, 10);
      }
    }
  }
  // rain streaks
  ctx.fillStyle = "rgba(154,183,220,0.14)";
  for (let i = 0; i < 130; i++) {
    const rx = rng() * W;
    const ry = rng() * H;
    ctx.fillRect(rx, ry, 1, 8 + rng() * 8);
  }
  // wet ground: dark + reflected light streaks
  ctx.fillStyle = "#0B0D16";
  ctx.fillRect(0, H * 0.88, W, H * 0.12);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = rng() > 0.5 ? "rgba(67,200,220,0.22)" : "rgba(229,108,240,0.18)";
    const rx = rng() * W;
    ctx.fillRect(rx, H * 0.89 + rng() * H * 0.09, 3 + rng() * 8, 2);
  }
  const back = toDataURL(ctx);

  // ——— mid: framing facades, neon signs, wires, AC units ———
  ctx = makeCtx();
  rng = mulberry32(66);
  ctx.fillStyle = "#10121E";
  ctx.fillRect(0, 0, W * 0.2, H); // left facade
  ctx.fillRect(W * 0.82, 0, W * 0.18, H); // right facade
  ctx.fillStyle = "#0C0E18";
  ctx.fillRect(W * 0.2 - 6, 0, 6, H); // edge shadow
  ctx.fillRect(W * 0.82, 0, 6, H);
  // facade windows (dim)
  for (let i = 0; i < 24; i++) {
    ctx.fillStyle = rng() > 0.8 ? "rgba(67,200,220,0.5)" : "#0A0C16";
    const left = rng() > 0.5;
    ctx.fillRect(
      left ? 10 + rng() * (W * 0.14) : W * 0.84 + rng() * (W * 0.12),
      rng() * H * 0.8,
      10,
      12
    );
  }
  // neon signs with glow
  const signs: [number, number, string][] = [
    [W * 0.03, H * 0.16, "#E56CF0"],
    [W * 0.03, H * 0.42, "#43C8DC"],
    [W * 0.85, H * 0.22, "#43C8DC"],
    [W * 0.85, H * 0.5, "#E56CF0"],
    [W * 0.85, H * 0.72, "#FFB648"],
  ];
  for (const [sx, sy, c] of signs) {
    const rgb = hexToRgb(c);
    glow(ctx, sx + 7, sy + 22, 34, rgb, 4);
    ctx.fillStyle = c;
    ctx.fillRect(sx, sy, 14, 44);
    ctx.fillStyle = "#0C0E18";
    ctx.fillRect(sx + 3, sy + 4, 8, 6);
    ctx.fillRect(sx + 3, sy + 14, 8, 6);
    ctx.fillRect(sx + 3, sy + 24, 8, 6);
  }
  // hanging wires with catenary sag
  ctx.strokeStyle = "#080A12";
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(W * 0.18, H * (0.1 + i * 0.09));
    ctx.quadraticCurveTo(W / 2, H * (0.24 + i * 0.09), W * 0.84, H * (0.08 + i * 0.09));
    ctx.stroke();
  }
  // AC units
  ctx.fillStyle = "#181B28";
  ctx.fillRect(W * 0.14, H * 0.3, 22, 16);
  ctx.fillRect(W * 0.84, H * 0.62, 22, 16);
  ctx.fillStyle = "#080A12";
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(W * 0.14 + 3, H * 0.3 + 3 + i * 4, 16, 2);
    ctx.fillRect(W * 0.84 + 3, H * 0.62 + 3 + i * 4, 16, 2);
  }
  const mid = toDataURL(ctx);

  // ——— front: dumpster, pipes, awning, lantern ———
  ctx = makeCtx();
  // dumpster
  ctx.fillStyle = "#0C0E15";
  ctx.fillRect(W * 0.08, H * 0.76, W * 0.22, H * 0.24);
  ctx.fillRect(W * 0.08, H * 0.72, W * 0.22, 12); // lid
  ctx.fillRect(W * 0.12, H * 0.68, 16, 10); // trash poking out
  ctx.fillStyle = "rgba(229,108,240,0.45)";
  ctx.fillRect(W * 0.08, H * 0.76, W * 0.22, 3); // neon rim
  ctx.fillStyle = "#080A10";
  for (let i = 0; i < 4; i++) ctx.fillRect(W * 0.1 + i * 40, H * 0.8, 4, H * 0.16); // corrugation
  // ground strip
  ctx.fillStyle = "#0A0C12";
  ctx.fillRect(W * 0.55, H * 0.9, W * 0.45, H * 0.1);
  ctx.fillStyle = "rgba(67,200,220,0.25)";
  ctx.fillRect(W * 0.55, H * 0.9, W * 0.45, 2);
  // hanging pipe + dripping
  ctx.fillStyle = "#0C0E15";
  ctx.fillRect(W * 0.68, 0, 14, H * 0.52);
  ctx.fillRect(W * 0.68, H * 0.5, 40, 12); // elbow
  // awning top-left
  ctx.fillStyle = "#0C0E15";
  for (let i = 0; i < 6; i++) ctx.fillRect(0, i * 8, W * 0.26 - i * 16, 8);
  ctx.fillStyle = "rgba(67,200,220,0.3)";
  ctx.fillRect(0, 47, W * 0.26 - 5 * 16, 2);
  // hanging lantern bottom-right with warm glow
  glow(ctx, W * 0.9, H * 0.72, 46, hexToRgb("#FFB648"), 5);
  ctx.fillStyle = "#0C0E15";
  ctx.fillRect(W * 0.9 - 2, H * 0.6, 4, H * 0.06); // cord
  ctx.fillRect(W * 0.9 - 9, H * 0.66, 18, 26);
  ctx.fillStyle = "#FFB648";
  ctx.fillRect(W * 0.9 - 5, H * 0.68, 10, 18);
  ctx.fillStyle = "#0C0E15";
  ctx.fillRect(W * 0.9 - 1, H * 0.68, 2, 18);
  const front = toDataURL(ctx);

  return [
    createLayer({ name: "back wall", src: back, factorX: 0.1, factorY: 0.04 }),
    createLayer({ name: "neon facades", src: mid, factorX: 0.35, factorY: 0.1 }),
    createLayer({ name: "foreground junk", src: front, factorX: 0.85, factorY: 0.18 }),
  ];
}

function dungeonLayers(): Layer[] {
  // ——— back: brick wall with torch glow pools ———
  let ctx = makeCtx();
  let rng = mulberry32(77);
  ditheredSky(ctx, rng, ["#2A2733", "#1C1A22", "#0A0B10"], 0.25);
  // brick courses with offset
  for (let y = 0; y < H; y += 24) {
    for (let x = ((y / 24) % 2) * -20; x < W; x += 40) {
      ctx.fillStyle = rng() > 0.9 ? "#252230" : "#211E29";
      ctx.fillRect(x + 1, y + 1, 38, 22);
    }
  }
  // cracks
  ctx.fillStyle = "#12101A";
  for (let i = 0; i < 14; i++) {
    let cx = rng() * W;
    let cy = rng() * H * 0.7;
    for (let s = 0; s < 6; s++) {
      ctx.fillRect(cx, cy, 3, 3);
      cx += rng() > 0.5 ? 3 : -3;
      cy += 4;
    }
  }
  // torches with dithered glow pools
  for (const tx of [W * 0.25, W * 0.72]) {
    const ty = H * 0.42;
    glow(ctx, tx, ty, 130, hexToRgb("#FFB648"), 7);
    ctx.fillStyle = "#3A2E1E";
    ctx.fillRect(tx - 2, ty + 6, 4, 18); // bracket
    ctx.fillStyle = "#C97B4A";
    ctx.fillRect(tx - 4, ty - 6, 8, 12); // flame outer
    ctx.fillStyle = "#FFB648";
    ctx.fillRect(tx - 3, ty - 10, 6, 10); // flame core
    ctx.fillStyle = "#FFD98A";
    ctx.fillRect(tx - 1, ty - 6, 2, 5);
    // embers
    ctx.fillStyle = "#FFB648";
    for (let i = 0; i < 5; i++) {
      ctx.globalAlpha = 0.3 + rng() * 0.5;
      ctx.fillRect(tx - 20 + rng() * 40, ty - 30 - rng() * 30, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
  const back = toDataURL(ctx);

  // ——— mid: rune pillars, glowing archway, treasure chest ———
  ctx = makeCtx();
  rng = mulberry32(88);
  for (const px of [W * 0.16, W * 0.7]) {
    ctx.fillStyle = "#16141D";
    ctx.fillRect(px, H * 0.08, 58, H * 0.92);
    ctx.fillRect(px - 10, H * 0.08, 78, 18); // capital
    ctx.fillRect(px - 10, H * 0.86, 78, 18); // base
    // edge highlight from torch side
    ctx.fillStyle = "#2E2A3A";
    ctx.fillRect(px + (px < W / 2 ? 54 : 0), H * 0.08, 4, H * 0.78);
    // carved runes with teal glow
    glow(ctx, px + 29, H * 0.4, 40, hexToRgb("#4FD1B5"), 3);
    ctx.fillStyle = "#4FD1B5";
    for (let i = 0; i < 5; i++) {
      const ry = H * 0.22 + i * 58;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(px + 12 + (i % 3) * 14, ry, 8, 8);
      ctx.fillRect(px + 16 + (i % 3) * 14, ry + 8, 3, 6);
    }
    ctx.globalAlpha = 1;
  }
  // archway with inner teal glow
  ctx.fillStyle = "#12101A";
  ctx.fillRect(W * 0.4, H * 0.26, W * 0.2, H * 0.74);
  for (let i = 0; i < 7; i++) {
    const g = 0.05 + i * 0.04;
    ctx.fillStyle = `rgba(79,209,181,${g})`;
    ctx.fillRect(W * 0.42 + i * 3, H * 0.3 + i * 6, W * 0.16 - i * 6, H * 0.7 - i * 6);
  }
  ctx.fillStyle = "rgba(79,209,181,0.85)";
  ctx.fillRect(W * 0.48, H * 0.52, W * 0.04, H * 0.3); // bright core slit
  // treasure chest with amber glint
  ctx.fillStyle = "#3A2E1E";
  ctx.fillRect(W * 0.82, H * 0.8, 60, 40);
  ctx.fillStyle = "#4A3A26";
  ctx.fillRect(W * 0.82, H * 0.8, 60, 12); // lid
  ctx.fillStyle = "#FFB648";
  ctx.fillRect(W * 0.82 + 26, H * 0.8 + 14, 8, 10); // lock
  glow(ctx, W * 0.82 + 30, H * 0.8 + 10, 24, hexToRgb("#FFB648"), 3);
  ctx.fillStyle = "rgba(255,182,72,0.9)";
  ctx.fillRect(W * 0.82 + 6, H * 0.8 - 6, 3, 3); // sparkle
  ctx.fillRect(W * 0.82 + 48, H * 0.8 - 10, 2, 2);
  const mid = toDataURL(ctx);

  // ——— front: floor spikes, hanging chains, iron grate ———
  ctx = makeCtx();
  rng = mulberry32(99);
  // spikes with amber edge light
  for (let x = 0; x < W; x += 30) {
    const h = 30 + ((x / 30) % 3) * 10;
    ctx.fillStyle = "#0A0B10";
    ctx.beginPath();
    ctx.moveTo(x, H);
    ctx.lineTo(x + 15, H - h);
    ctx.lineTo(x + 30, H);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,182,72,0.4)";
    ctx.fillRect(x + 14, H - h, 2, 6);
  }
  ctx.fillStyle = "#0A0B10";
  ctx.fillRect(0, H - 8, W, 8); // ground line
  // hanging chains with link pattern
  for (const cx of [W * 0.08, W * 0.18, W * 0.86]) {
    const len = H * (0.3 + rng() * 0.25);
    for (let y = 0; y < len; y += 12) {
      ctx.fillStyle = "#0A0B10";
      ctx.fillRect(cx + ((y / 12) % 2) * 2, y, 6, 9);
      ctx.fillStyle = "rgba(255,182,72,0.25)";
      ctx.fillRect(cx + ((y / 12) % 2) * 2 + 4, y, 2, 9);
    }
    // hook weight at chain end
    ctx.fillStyle = "#0A0B10";
    ctx.fillRect(cx - 3, len, 12, 14);
  }
  // iron grate bottom-left
  ctx.fillStyle = "#0A0B10";
  ctx.fillRect(0, H * 0.72, 8, H * 0.28);
  for (let i = 0; i < 6; i++) ctx.fillRect(0, H * 0.72, 90, 6 + i * 0);
  for (let i = 0; i < 5; i++) ctx.fillRect(8 + i * 18, H * 0.72, 6, H * 0.28);
  for (let i = 0; i < 4; i++) ctx.fillRect(0, H * 0.74 + i * 34, 90, 6);
  const front = toDataURL(ctx);

  return [
    createLayer({ name: "cavern wall", src: back, factorX: 0.08, factorY: 0.03 }),
    createLayer({ name: "pillars & arch", src: mid, factorX: 0.45, factorY: 0.08 }),
    createLayer({ name: "spikes & chains", src: front, factorX: 0.9, factorY: 0.15 }),
  ];
}

export const PLACEHOLDER_META: Record<
  PlaceholderTheme,
  { name: string; tag: string; description: string }
> = {
  valley: {
    name: "Sunset Valley",
    tag: "NATURE",
    description:
      "Dusk over a shrine valley: dithered sky, misty ridge, lantern-lit gate, silhouette grass.",
  },
  alley: {
    name: "Neon Alley",
    tag: "URBAN",
    description:
      "Rain-slick cyberpunk alley: glowing windows, neon signs, hanging wires, foreground junk.",
  },
  dungeon: {
    name: "Ember Dungeon",
    tag: "INTERIOR",
    description:
      "Torch-lit cavern: rune pillars, a teal-glowing archway, spikes and chains up front.",
  },
};

export function createPlaceholderScene(theme: PlaceholderTheme = "valley"): SceneFile {
  const layers =
    theme === "valley" ? valleyLayers() : theme === "alley" ? alleyLayers() : dungeonLayers();
  return {
    version: 1,
    name: PLACEHOLDER_META[theme].name,
    canvas: { width: W, height: H },
    camera: { x: W / 2, y: H / 2 },
    layers,
  };
}

/** Module-level cache so every preview on the site shares layer ids (and decoded bitmaps). */
const sceneCache = new Map<PlaceholderTheme, SceneFile>();

export function getCachedPlaceholderScene(theme: PlaceholderTheme): SceneFile {
  let s = sceneCache.get(theme);
  if (!s) {
    s = createPlaceholderScene(theme);
    sceneCache.set(theme, s);
  }
  return s;
}
