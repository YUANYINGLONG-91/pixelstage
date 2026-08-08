/**
 * Stillsnow Pass — moonlit snowfield. The Octopath warm/cool signature:
 * a cold blue world with tiny warm windows and a lantern glowing in it.
 * Snow-laden pines, distant cabins, a pilgrim following footprints to a
 * snow-capped shrine gate.
 */

import type { Layer, RenderEffects } from "../../types";
import { defaultEffects } from "../../types";
import { HOT, Painter, hexToRgb, mix, ramp } from "../pixel";
import { pineTree, snowCap } from "../materials";
import { signpost, stoneLantern, torii } from "../props";
import { G, H, W, billboard, characterLayer, groundPlane, groundRow } from "../stage";

const SNOW = () => ramp("#C8D8EC");

/* ----------------------------------- sky ----------------------------------- */

function sky(): string {
  const p = new Painter(W, H).seed(51);
  p.sky(["#0A1228", "#1A2646", "#2E3E62"], 0.35);
  // star field, denser near the zenith
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(p.rng() * 480);
    const y = Math.floor(p.rng() * 140);
    const big = p.rng() > 0.88;
    p.px(x, y, big ? [237, 242, 252] : [150, 165, 200], 0.35 + p.rng() * 0.55);
    if (big) {
      p.px(x - 1, y, [150, 165, 200], 0.4);
      p.px(x + 1, y, [150, 165, 200], 0.4);
      p.px(x, y - 1, [150, 165, 200], 0.4);
      p.px(x, y + 1, [150, 165, 200], 0.4);
    }
  }
  // moon, upper-left: halo + pale disc + craters
  const mx = 84;
  const my = 52;
  p.glow(mx, my, 30, "#B8CCF0", 7, 0.4);
  p.blob(mx, my, 9, "#DCE8FA");
  p.blob(mx + 1, my - 1, 8, "#EDF4FF");
  p.blob(mx - 3, my + 2, 2, "#C0D0EC");
  p.blob(mx + 3, my - 3, 1, "#C0D0EC");
  // faint aurora bands, upper right — slow teal ribbons
  for (let band = 0; band < 2; band++) {
    const yBase = 30 + band * 26;
    for (let x = 240; x < 480; x += 2) {
      const y = yBase + Math.round(Math.sin(x * 0.02 + band * 2) * 10);
      p.rect(x, y, 2, 10 + band * 4, hexToRgb("#4FD1B5"), 0.05);
      p.rect(x, y + 3, 2, 3, hexToRgb("#4FD1B5"), 0.08);
    }
  }
  return p.dataURL();
}

/* ---------------------------- mountains & cabins ---------------------------- */

function mountains(): string {
  const p = new Painter(W, H).seed(62);
  const base = 224; // baseRow(420)
  // three snow ridges, aerial perspective
  const ridge = (baseY: number, amp: number, step: number, color: string, snowTone: string | null) => {
    let px = 0;
    let py = baseY;
    p.ctx.fillStyle = color;
    p.ctx.beginPath();
    p.ctx.moveTo(0, 270 * 2);
    p.ctx.lineTo(0, py * 2);
    const peaks: [number, number][] = [];
    while (px < 480) {
      const nx = px + Math.floor(step * (0.5 + p.rng()));
      const ny = baseY - Math.floor(p.rng() * amp);
      p.ctx.lineTo(nx * 2, ny * 2);
      peaks.push([nx, ny]);
      px = nx;
      py = ny;
    }
    p.ctx.lineTo(480 * 2, py * 2);
    p.ctx.lineTo(480 * 2, 270 * 2);
    p.ctx.closePath();
    p.ctx.fill();
    if (snowTone) {
      for (const [sx, sy] of peaks) {
        p.rect(sx - 3, sy, 6, 2, hexToRgb(snowTone), 0.85);
        p.rect(sx - 1, sy + 2, 3, 1, hexToRgb(snowTone), 0.6);
      }
    }
  };
  ridge(base - 26, 26, 30, "#3E4A72", "#8FA0C8");
  p.dither(0, base - 52, 480, 52, hexToRgb("#3E4A72"), hexToRgb("#B8CCF0"), 0.08); // moonlit haze
  ridge(base - 12, 20, 26, "#2E3A5E", "#7A8FBC");
  ridge(base, 14, 34, "#22304E", null);
  // two cabins with warm windows — the cold world's only warmth
  const cabin = (x: number, w: number) => {
    const wood = ramp("#2A2436");
    p.rect(x, base - 8, w, 8, wood[2]);
    p.poly(
      [
        [x - 2, base - 8],
        [x + w / 2, base - 14],
        [x + w + 2, base - 8],
      ],
      wood[1]
    );
    snowCap(p, x - 1, base - 10, w + 2, SNOW());
    p.rect(x + 2, base - 5, 3, 3, hexToRgb("#FFB648")); // warm window
    p.px(x + 3, base - 4, HOT);
    p.glow(x + 3, base - 4, 6, "#FFB648", 4, 0.3);
    // chimney smoke
    for (let i = 0; i < 4; i++) {
      p.px(x + w - 3 + Math.floor(p.rng() * 2), base - 12 - i * 2, [180, 190, 210], 0.3 - i * 0.06);
    }
  };
  cabin(120, 14);
  cabin(360, 12);
  // warm haze pooling at the horizon
  p.dither(0, base - 4, 480, 4, hexToRgb("#22304E"), hexToRgb("#4A5E8C"), 0.25);
  return p.dataURL();
}

/* -------------------------------- snow pines -------------------------------- */

function pines(): string {
  const p = new Painter(W, H).seed(73);
  const base = 244; // baseRow(160)
  const pine = ramp("#27504C");
  // back row, smaller
  for (const [x, h] of [
    [30, 44],
    [96, 52],
    [180, 40],
    [250, 56],
    [330, 46],
    [420, 54],
    [462, 42],
  ]) {
    pineTree(p, x, base - 4 + Math.floor(p.rng() * 6), h, [pine[0], pine[1], pine[2], pine[3]], SNOW());
  }
  // front anchors
  pineTree(p, 66, base, 72, [pine[0], pine[1], pine[2], pine[3]], SNOW());
  pineTree(p, 388, base, 78, [pine[0], pine[1], pine[2], pine[3]], SNOW());
  // snow-buried shrubs
  for (let i = 0; i < 7; i++) {
    const x = 20 + Math.floor(p.rng() * 440);
    p.blob(x, base - 2, 4 + Math.floor(p.rng() * 3), mix(SNOW()[1], SNOW()[2], 0.5));
    p.blob(x, base - 4, 3, SNOW()[3]);
  }
  return p.dataURL();
}

/* ---------------------------------- shrine ---------------------------------- */

function shrine(): string {
  const p = new Painter(W, H).seed(84);
  const base = 268;
  // snow-capped torii
  torii(p, 240, base, 2);
  snowCap(p, 240 - 27, base - 49, 54, SNOW()); // cap on the curved top beam
  snowCap(p, 240 - 21, base - 33, 42, SNOW()); // second beam
  // flanking stone lanterns, warm flames in the blue night
  stoneLantern(p, 176, base, 1, "#FFB648");
  stoneLantern(p, 306, base, 1, "#FFC45E");
  snowCap(p, 171, base - 21, 10, SNOW());
  snowCap(p, 301, base - 21, 10, SNOW());
  // buried signpost
  signpost(p, 130, base);
  snowCap(p, 125, base - 10, 10, SNOW());
  // snow-covered rocks
  for (const [x, r] of [
    [90, 5],
    [352, 6],
    [396, 4],
  ]) {
    const rock = ramp("#3A4660");
    p.blob(x, base - 2, r, rock[1]);
    p.blob(x, base - 3, r - 1, rock[2]);
    p.blob(x, base - 4, r - 2, SNOW()[2]);
    p.blob(x + 1, base - 5, r - 3, SNOW()[3]);
  }
  // drifting snow motes in the lantern light
  for (let i = 0; i < 20; i++) {
    p.px(150 + Math.floor(p.rng() * 180), 200 + Math.floor(p.rng() * 50), [232, 240, 255], 0.25 + p.rng() * 0.5);
  }
  return p.dataURL();
}

/* --------------------------------- foreground --------------------------------- */

function foreground(): string {
  const p = new Painter(W, H).seed(95);
  // snowdrift silhouette rising along the bottom
  const drift = ramp("#1A2440");
  for (let x = 0; x < 480; x += 4) {
    const h = 30 + Math.round(Math.sin(x * 0.013) * 8 + p.rng() * 6);
    p.rect(x, 270 - h, 4, h, drift[2]);
    p.rect(x, 270 - h, 4, 1, mix(drift[2], SNOW()[1], 0.6)); // moonlit crest
  }
  // big soft out-of-focus snowflakes
  for (let i = 0; i < 14; i++) {
    p.glow(Math.floor(p.rng() * 480), 210 + Math.floor(p.rng() * 55), 2 + Math.floor(p.rng() * 3), "#E8F0FF", 2, 0.35);
  }
  // snow-laden branch, top-right
  const bark = ramp("#141C30");
  p.rect(400, 0, 80, 5, bark[2]);
  p.rect(430, 4, 4, 10, bark[2]);
  for (const [x, y, r] of [
    [420, 8, 8],
    [452, 7, 10],
    [472, 12, 6],
  ]) {
    p.blob(x, y, r, SNOW()[1]);
    p.blob(x, y - 1, r - 2, SNOW()[2]);
    p.blob(x + 1, y - 2, r - 4, SNOW()[3]);
  }
  return p.dataURL();
}

/* ---------------------------------- ground ---------------------------------- */

function ground(): string {
  const p = new Painter(W, G).seed(105);
  // snowfield: bright near → blue distance
  p.sky(["#D8E4F4", "#B4C4E2", "#8FA0C8", "#5E6E9A"], 0.3, 480);
  // wind-carved drift shading: dithered blue bands
  const shade = hexToRgb("#7A8FBC");
  for (let i = 0; i < 26; i++) {
    const y = Math.floor(p.rng() * 440);
    const w = 60 + Math.floor(p.rng() * 200);
    const x = Math.floor(p.rng() * (480 - w));
    p.dither(x, y, w, 2, hexToRgb("#C4D2EA"), shade, 0.22 + p.rng() * 0.2);
  }
  // sastrugi ripple lines
  for (let i = 0; i < 40; i++) {
    const y = Math.floor(p.rng() * 460);
    const x = Math.floor(p.rng() * 380);
    p.rect(x, y, 30 + Math.floor(p.rng() * 60), 1, hexToRgb("#EDF2FC"), 0.35);
  }
  // footprints: pilgrim (focal, x≈240) walked from the shrine — pairs of
  // deep blue prints receding toward the near edge
  const print = hexToRgb("#6A7EA8");
  let fx = 240;
  for (let y = groundRow(10); y < 130; y += 5) {
    fx += Math.floor(p.rng() * 5) - 2;
    p.rect(fx - 2, y, 2, 2, print, 0.75);
    p.rect(fx + 1, y + 2, 2, 2, print, 0.75);
  }
  // snow sparkle: single bright cells, a few 4-point stars
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(p.rng() * 480);
    const y = Math.floor(p.rng() * 420);
    p.px(x, y, [255, 255, 255], 0.5 + p.rng() * 0.5);
    if (p.rng() > 0.9) {
      p.px(x - 1, y, [255, 255, 255], 0.35);
      p.px(x + 1, y, [255, 255, 255], 0.35);
      p.px(x, y - 1, [255, 255, 255], 0.35);
      p.px(x, y + 1, [255, 255, 255], 0.35);
    }
  }
  // warm pools under the lanterns and gate (focal plane)
  const r0 = groundRow(0);
  p.glow(176, r0 + 6, 30, "#FFB648", 6, 0.35);
  p.glow(306, r0 + 6, 28, "#FFC45E", 6, 0.35);
  p.glow(240, r0 + 10, 40, "#FFD98A", 6, 0.22);
  // moonlit pool from the upper-left
  p.glow(120, r0 + 30, 90, "#B8CCF0", 7, 0.12);
  // near-edge shadow falloff
  for (let y = 0; y < 60; y++) {
    p.rect(0, y, 480, 1, [12, 16, 32], 0.4 * (1 - y / 60));
  }
  return p.dataURL();
}

/* ---------------------------------- assembly ---------------------------------- */

export function snowLayers(): Layer[] {
  return [
    billboard("night sky", sky(), 700, 1.25, { lit: false }),
    billboard("mountains & cabins", mountains(), 420, 1.15),
    billboard("snow pines", pines(), 160, 1.08),
    billboard("shrine gate", shrine(), 0),
    characterLayer("pilgrim", "pilgrim", W * 0.5, 10, 1.2),
    groundPlane("snowfield", ground()),
    billboard("snowdrift fringe", foreground(), -300, 1.35),
  ];
}

export function snowEffects(): RenderEffects {
  const fx = defaultEffects();
  fx.sun = { color: "#A8C0E8", intensity: 0.75, azimuth: 240, elevation: 50 }; // moonlight
  fx.ambient = { color: "#7A8FC8", intensity: 1.0 };
  fx.fog = { enabled: true, color: "#2E3E5E", near: 700, far: 2400 };
  fx.dof = { enabled: true, focus: 0, aperture: 0.35 };
  fx.bloom = { enabled: true, strength: 0.8, threshold: 0.45 };
  fx.grade = { vignette: 0.55, saturation: 1.05, grain: 0.06 };
  fx.particles = { enabled: true, color: "#E8F0FF", count: 160, size: 2.5, speed: 0.6 };
  return fx;
}

export function snowCamera() {
  return { posY: H * 0.3, targetY: H * 0.58 };
}

export const snowMeta = {
  name: "Stillsnow Pass",
  tag: "NATURE",
  description:
    "Moonlit snowfield: snow-laden pines, distant cabins with the only warm windows in a blue world, and a pilgrim following footprints to a snow-capped gate.",
};
