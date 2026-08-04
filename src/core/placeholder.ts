import { createLayer, type Layer, type SceneFile } from "./types";

/**
 * Programmatic placeholder art (PRD §7): ship features before real art exists.
 * Three themed sets on a shared 960×540 stage, generated on an offscreen canvas
 * with a seeded RNG so every visitor sees the same scene.
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
  return canvas.getContext("2d")!;
}

function toDataURL(ctx: CanvasRenderingContext2D): string {
  return ctx.canvas.toDataURL("image/png");
}

/** Banded vertical gradient with 4px bands — cheap ordered-dither look. */
function bandedSky(ctx: CanvasRenderingContext2D, stops: string[]) {
  const bands = 64;
  const bandH = Math.ceil(H / bands);
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    ctx.fillStyle = lerpStops(stops, t);
    ctx.fillRect(0, i * bandH, W, bandH);
  }
}

function lerpStops(stops: string[], t: string | number): string {
  const cols = stops.map(hexToRgb);
  const x = (typeof t === "number" ? t : 0) * (cols.length - 1);
  const i = Math.min(cols.length - 2, Math.floor(x));
  const f = x - i;
  const [a, b] = [cols[i], cols[i + 1]];
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function hexToRgb(hex: string): number[] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Jagged silhouette ridge across the bottom of the canvas. */
function ridge(
  ctx: CanvasRenderingContext2D,
  rng: () => number,
  baseY: number,
  amp: number,
  step: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, H);
  let y = baseY;
  for (let x = 0; x <= W; x += step) {
    y = baseY - rng() * amp;
    ctx.lineTo(x, Math.round(y / 4) * 4);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
}

/** Blocky pine tree at (x, groundY). */
function pine(ctx: CanvasRenderingContext2D, x: number, groundY: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 2, groundY - h * 0.25, 4, h * 0.25);
  const tiers = 3;
  for (let i = 0; i < tiers; i++) {
    const ty = groundY - h * 0.25 - (i * h * 0.75) / tiers;
    const tw = (h * 0.55 * (tiers - i)) / tiers;
    ctx.fillRect(x - tw / 2, ty - h / tiers / 2, tw, h / tiers / 2 + 2);
  }
}

/** Grass clumps along a ground line. */
function grass(ctx: CanvasRenderingContext2D, rng: () => number, groundY: number, color: string, density = 90) {
  ctx.fillStyle = color;
  for (let i = 0; i < density; i++) {
    const x = rng() * W;
    const h = 8 + rng() * 26;
    const w = 3 + Math.floor(rng() * 3) * 2;
    ctx.fillRect(x, groundY - h, w, h);
  }
}

function stars(ctx: CanvasRenderingContext2D, rng: () => number, color: string, count = 60, maxY = H * 0.5) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    ctx.fillRect(Math.floor(rng() * W), Math.floor(rng() * maxY), 2, 2);
  }
}

function blockyCloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 14 * s, 4 * s);
  ctx.fillRect(x + 3 * s, y - 3 * s, 8 * s, 3 * s);
  ctx.fillRect(x + 5 * s, y + 4 * s, 6 * s, 2 * s);
}

function torii(ctx: CanvasRenderingContext2D, x: number, groundY: number, s: number, color: string, glow: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 10 * s, groundY - 22 * s, 4 * s, 22 * s);
  ctx.fillRect(x + 6 * s, groundY - 22 * s, 4 * s, 22 * s);
  ctx.fillRect(x - 14 * s, groundY - 24 * s, 28 * s, 4 * s);
  ctx.fillRect(x - 11 * s, groundY - 17 * s, 22 * s, 3 * s);
  ctx.fillStyle = glow;
  ctx.fillRect(x - 2 * s, groundY - 14 * s, 4 * s, 5 * s); // lantern
}

/* ---------------------------------- themes ---------------------------------- */

function valleyLayers(): Layer[] {
  // sky — opaque dusk gradient
  let ctx = makeCtx();
  const rng1 = mulberry32(11);
  bandedSky(ctx, ["#2B2540", "#6B4A6E", "#C97B4A", "#FFB648"].reverse());
  stars(ctx, rng1, "#EDEFF5", 50, H * 0.35);
  ctx.fillStyle = "#FFB648";
  ctx.fillRect(W * 0.68, H * 0.72, 36, 36); // blocky sun on the horizon
  ctx.fillStyle = "rgba(255,182,72,0.35)";
  ctx.fillRect(W * 0.68 - 12, H * 0.72 - 12, 60, 60);
  blockyCloud(ctx, W * 0.15, H * 0.2, 3, "rgba(237,239,245,0.25)");
  blockyCloud(ctx, W * 0.55, H * 0.32, 2, "rgba(237,239,245,0.18)");
  const sky = toDataURL(ctx);

  // far ridge — misty mountains + tiny pagoda
  ctx = makeCtx();
  const rng2 = mulberry32(22);
  ridge(ctx, rng2, H * 0.75, 90, 48, "#4A4364");
  ridge(ctx, rng2, H * 0.85, 60, 64, "#5E5578");
  const far = toDataURL(ctx);

  // mid — hills, pines, torii gate
  ctx = makeCtx();
  const rng3 = mulberry32(33);
  ridge(ctx, rng3, H * 0.9, 40, 80, "#2E4A44");
  for (let i = 0; i < 14; i++) pine(ctx, rng3() * W, H * 0.88 + rng3() * 30, 40 + rng3() * 50, "#243B36");
  torii(ctx, W * 0.58, H * 0.92, 2, "#1A2E2A", "#FFB648");
  const mid = toDataURL(ctx);

  // front — near-black grass silhouette
  ctx = makeCtx();
  const rng4 = mulberry32(44);
  ctx.fillStyle = "#12141C";
  ctx.fillRect(0, H * 0.86, W, H * 0.14);
  grass(ctx, rng4, H * 0.88, "#1A1E28", 110);
  grass(ctx, rng4, H * 0.86, "#12141C", 60);
  pine(ctx, W * 0.08, H * 0.9, 120, "#12141C");
  const front = toDataURL(ctx);

  return [
    createLayer({ name: "sky", src: sky, factorX: 0.05, factorY: 0.02 }),
    createLayer({ name: "far ridge", src: far, factorX: 0.15, factorY: 0.05 }),
    createLayer({ name: "mid hills", src: mid, factorX: 0.4, factorY: 0.12 }),
    createLayer({ name: "foreground", src: front, factorX: 0.8, factorY: 0.2 }),
  ];
}

function alleyLayers(): Layer[] {
  // back — rainy night wall with glowing windows
  let ctx = makeCtx();
  const rng1 = mulberry32(55);
  bandedSky(ctx, ["#0C0E18", "#12141F", "#1A1D2E"]);
  ctx.fillStyle = "#181B2A";
  ctx.fillRect(0, H * 0.15, W, H * 0.85);
  for (let i = 0; i < 70; i++) {
    const lit = rng1() > 0.5;
    ctx.fillStyle = lit ? (rng1() > 0.5 ? "#43C8DC" : "#E56CF0") : "#101322";
    ctx.globalAlpha = lit ? 0.85 : 1;
    ctx.fillRect(Math.floor(rng1() * W / 18) * 18, H * 0.18 + Math.floor(rng1() * 20) * 18, 8, 10);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(67,200,220,0.12)"; // wet ground reflection
  ctx.fillRect(0, H * 0.86, W, H * 0.14);
  const back = toDataURL(ctx);

  // mid — framing facades with neon signs
  ctx = makeCtx();
  ctx.fillStyle = "#10121E";
  ctx.fillRect(0, 0, W * 0.2, H);
  ctx.fillRect(W * 0.82, 0, W * 0.18, H);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 ? "#E56CF0" : "#43C8DC";
    const x = i % 2 ? W * 0.84 : W * 0.03;
    ctx.fillRect(x, H * 0.15 + i * 62, 14, 44); // vertical neon sign
  }
  ctx.strokeStyle = "#0A0C14";
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(W * 0.2, H * (0.15 + i * 0.12));
    ctx.quadraticCurveTo(W / 2, H * (0.25 + i * 0.12), W * 0.82, H * (0.13 + i * 0.12));
    ctx.stroke();
  }
  const mid = toDataURL(ctx);

  // front — dumpster + pipes silhouette
  ctx = makeCtx();
  ctx.fillStyle = "#0C0E15";
  ctx.fillRect(W * 0.1, H * 0.78, W * 0.2, H * 0.22); // dumpster
  ctx.fillRect(W * 0.1, H * 0.74, W * 0.2, 10);
  ctx.fillRect(W * 0.6, H * 0.88, W * 0.4, H * 0.12); // ground
  ctx.fillRect(W * 0.7, 0, 12, H * 0.5); // hanging pipe
  ctx.fillRect(0, 0, W * 0.25, H * 0.08); // awning corner
  ctx.fillStyle = "rgba(229,108,240,0.5)";
  ctx.fillRect(W * 0.1, H * 0.78, W * 0.2, 3); // neon rim light
  const front = toDataURL(ctx);

  return [
    createLayer({ name: "back wall", src: back, factorX: 0.1, factorY: 0.04 }),
    createLayer({ name: "neon facades", src: mid, factorX: 0.35, factorY: 0.1 }),
    createLayer({ name: "foreground junk", src: front, factorX: 0.85, factorY: 0.18 }),
  ];
}

function dungeonLayers(): Layer[] {
  // back — stone wall with torch glow pools
  let ctx = makeCtx();
  const rng1 = mulberry32(77);
  bandedSky(ctx, ["#0A0B10", "#1C1A22", "#2A2733"]);
  ctx.fillStyle = "#211E29";
  for (let y = 0; y < H; y += 24)
    for (let x = ((y / 24) % 2) * -20; x < W; x += 40) ctx.fillRect(x + 1, y + 1, 38, 22);
  for (const tx of [W * 0.25, W * 0.75]) {
    const g = ctx.createRadialGradient(tx, H * 0.45, 8, tx, H * 0.45, 150);
    g.addColorStop(0, "rgba(255,182,72,0.55)");
    g.addColorStop(1, "rgba(255,182,72,0)");
    ctx.fillStyle = g;
    ctx.fillRect(tx - 150, H * 0.45 - 150, 300, 300);
    ctx.fillStyle = "#FFB648";
    ctx.fillRect(tx - 3, H * 0.45 - 8, 6, 10); // torch flame
  }
  void rng1;
  const back = toDataURL(ctx);

  // mid — pillars + glowing archway + chest
  ctx = makeCtx();
  ctx.fillStyle = "#16141D";
  for (const px of [W * 0.18, W * 0.72]) {
    ctx.fillRect(px, H * 0.1, 54, H * 0.9);
    ctx.fillRect(px - 8, H * 0.1, 70, 16);
    ctx.fillRect(px - 8, H * 0.86, 70, 16);
    ctx.fillStyle = "#4FD1B5";
    for (let i = 0; i < 4; i++) ctx.fillRect(px + 12 + (i % 2) * 22, H * 0.25 + i * 60, 8, 8); // runes
    ctx.fillStyle = "#16141D";
  }
  ctx.fillStyle = "#12101A";
  ctx.fillRect(W * 0.42, H * 0.3, W * 0.16, H * 0.7); // archway
  ctx.fillStyle = "rgba(79,209,181,0.35)";
  ctx.fillRect(W * 0.44, H * 0.34, W * 0.12, H * 0.66); // magic glow
  ctx.fillStyle = "#3A2E1E";
  ctx.fillRect(W * 0.82, H * 0.82, 56, 36); // chest
  ctx.fillStyle = "#FFB648";
  ctx.fillRect(W * 0.82 + 24, H * 0.82 + 12, 8, 8); // glint
  const mid = toDataURL(ctx);

  // front — spikes + chains
  ctx = makeCtx();
  ctx.fillStyle = "#0A0B10";
  for (let x = 0; x < W; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, H);
    ctx.lineTo(x + 14, H - 34 - (x % 3) * 8);
    ctx.lineTo(x + 28, H);
    ctx.closePath();
    ctx.fill();
  }
  for (const cx of [W * 0.1, W * 0.2, W * 0.88]) {
    for (let y = 0; y < H * 0.4; y += 14) ctx.fillRect(cx, y, 6, 9); // chain links
  }
  ctx.fillStyle = "rgba(255,182,72,0.35)";
  for (let x = 0; x < W; x += 28) ctx.fillRect(x + 12, H - 30 - (x % 3) * 8, 3, 8); // amber edge light
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
