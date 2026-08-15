/**
 * Neon Alley — rain-slick cyberpunk corridor, repainted with the full kit:
 * mullioned window grids, AC units and pipes, sagging wires, glyph-slotted
 * neon signs with white-hot tubes, wet asphalt mirroring it all, and a
 * runner with a glowing umbrella.
 */

import type { Layer, RenderEffects } from "../../types";
import { defaultEffects } from "../../types";
import { HOT, Painter, hexToRgb, mix } from "../pixel";
import { acUnit, neonSign } from "../props";
import { G, H, W, billboard, characterLayer, groundPlane, groundRow } from "../stage";

const MAGENTA = "#E56CF0";
const CYAN = "#43C8DC";
const AMBER = "#FFB648";

/* --------------------------------- back wall --------------------------------- */

function backWall(): string {
  const p = new Painter(W, H).seed(55);
  p.sky(["#12141F", "#161927", "#0E1420"], 0.3);
  // skyline silhouette: towers, water tank, antenna with a blinking light
  p.rect(0, 30, 480, 240, hexToRgb("#141828"));
  p.rect(150, 8, 90, 262, hexToRgb("#10142A")); // taller tower
  p.rect(330, 22, 60, 248, hexToRgb("#12162C"));
  // water tank
  p.rect(196, 0, 18, 10, hexToRgb("#0A0D18"));
  p.rect(198, 10, 3, 8, hexToRgb("#0A0D18"));
  p.rect(209, 10, 3, 8, hexToRgb("#0A0D18"));
  // antenna
  p.rect(370, 4, 2, 20, hexToRgb("#0A0D18"));
  p.px(370, 2, hexToRgb("#E04848"));
  p.glow(371, 3, 3, "#E04848", 2, 0.4);
  // window grids: each tower gets its own spacing + lit ratio, with dark
  // gaps between towers so the wall reads as buildings, not wallpaper
  const towers = [
    { x0: 8, x1: 140, sx: 12, sy: 12, lit: 0.3 },
    { x0: 156, x1: 234, sx: 10, sy: 9, lit: 0.42 }, // tall center tower
    { x0: 252, x1: 322, sx: 14, sy: 11, lit: 0.18 },
    { x0: 336, x1: 388, sx: 10, sy: 10, lit: 0.4 },
    { x0: 404, x1: 472, sx: 13, sy: 12, lit: 0.26 },
  ];
  for (const t of towers) {
    for (let gy = 40; gy < 252; gy += t.sy) {
      if (p.rng() < 0.12) continue; // whole floor dark
      for (let gx = t.x0; gx < t.x1; gx += t.sx) {
        const roll = p.rng();
        if (roll < t.lit) {
          const warm = p.rng() > 0.45;
          const c = hexToRgb(warm ? AMBER : CYAN);
          p.rect(gx, gy, 7, 8, mix(c, [255, 255, 255], 0.15), 0.9);
          p.rect(gx + 2, gy + 3, 3, 3, mix(c, [255, 255, 255], 0.65));
          p.px(gx + 3, gy + 4, HOT, 0.9);
          p.rect(gx - 1, gy - 1, 9, 10, c, 0.12); // halo
          // mullions
          p.rect(gx + 3, gy, 1, 8, hexToRgb("#0C0E18"));
          p.rect(gx, gy + 4, 7, 1, hexToRgb("#0C0E18"));
        } else if (roll < t.lit + 0.26) {
          p.rect(gx, gy, 7, 8, hexToRgb("#0E1120"));
          p.rect(gx, gy, 7, 1, hexToRgb("#1A2032")); // sky reflection
        }
      }
    }
  }
  // drizzle streaks
  for (let i = 0; i < 120; i++) {
    p.rect(Math.floor(p.rng() * 480), Math.floor(p.rng() * 270), 1, 3 + Math.floor(p.rng() * 3), hexToRgb("#9AB7DC"), 0.12);
  }
  return p.dataURL();
}

/* -------------------------------- mid facades -------------------------------- */

function wire(p: Painter, x0: number, y0: number, x1: number, y1: number, sag: number) {
  // quadratic sag drawn as cells
  for (let t = 0; t <= 1.001; t += 0.02) {
    const mx = (x0 + x1) / 2;
    const my = Math.max(y0, y1) + sag;
    const xa = x0 + (mx - x0) * t;
    const ya = y0 + (my - y0) * t;
    const x = xa + (mx + (x1 - mx) * t - xa) * t;
    const y = ya + (my + (y1 - my) * t - ya) * t;
    p.px(Math.round(x), Math.round(y), hexToRgb("#080A12"));
  }
}

function midFacades(): string {
  const p = new Painter(W, H).seed(66);
  // framing walls — wide enough to read as a corridor
  p.rect(0, 0, 100, 270, hexToRgb("#10121E"));
  p.rect(380, 0, 100, 270, hexToRgb("#0F111D"));
  p.rect(94, 0, 6, 270, hexToRgb("#0A0C16")); // inner edge shade
  p.rect(380, 0, 6, 270, hexToRgb("#0A0C16"));
  // sparse windows on the framing walls
  for (let i = 0; i < 20; i++) {
    const left = p.rng() > 0.5;
    const x = left ? 8 + Math.floor(p.rng() * 76) : 392 + Math.floor(p.rng() * 76);
    const y = 20 + Math.floor(p.rng() * 200);
    const lit = p.rng() > 0.75;
    p.rect(x, y, 6, 7, hexToRgb(lit ? "#3A5A6A" : "#0A0C16"));
    if (lit) {
      p.rect(x + 2, y + 2, 2, 3, hexToRgb(CYAN), 0.8);
      p.px(x + 2, y + 3, HOT, 0.8);
    }
  }
  // AC units + pipes
  acUnit(p, 40, 92);
  acUnit(p, 428, 150);
  p.rect(90, 0, 5, 270, hexToRgb("#181B28")); // drainpipes
  p.rect(386, 0, 5, 270, hexToRgb("#161A26"));
  p.rect(90, 60, 5, 1, hexToRgb("#232840"), 0.8);
  p.rect(386, 110, 5, 1, hexToRgb("#232840"), 0.8);
  // fire-escape zigzag on the left wall
  const esc = hexToRgb("#1C2030");
  for (let i = 0; i < 3; i++) {
    const y = 40 + i * 34;
    p.rect(10, y, 34, 2, esc);
    for (let s = 0; s < 8; s++) p.px(12 + s * 4, y - 4 + (s % 2), esc);
    for (let s = 0; s < 9; s++) p.rect(12 + s * 3, y + 2 + s * 3, 2, 2, esc); // stairs
  }
  // sagging wires with hanging lanterns
  wire(p, 100, 30, 380, 26, 26);
  wire(p, 100, 52, 380, 58, 30);
  wire(p, 100, 76, 380, 70, 24);
  for (const [lx, ly] of [
    [200, 62],
    [280, 66],
  ]) {
    p.rect(lx, ly - 6, 1, 6, hexToRgb("#080A12")); // drop cord
    p.glow(lx, ly + 2, 7, AMBER, 4, 0.5);
    p.rect(lx - 2, ly, 5, 6, hexToRgb("#1A1410"));
    p.rect(lx - 1, ly + 1, 3, 4, hexToRgb(AMBER));
    p.px(lx, ly + 2, HOT);
  }
  // neon signs on the inner edges of the framing walls, facing the street
  neonSign(p, 80, 60, 44, MAGENTA);
  neonSign(p, 80, 150, 36, CYAN);
  neonSign(p, 392, 90, 44, CYAN);
  neonSign(p, 392, 170, 30, AMBER);
  return p.dataURL();
}

/* --------------------------------- near signs --------------------------------- */

function nearSigns(): string {
  const p = new Painter(W, H).seed(67);
  p.rect(0, 0, 34, 270, hexToRgb("#0B0D16"));
  p.rect(451, 0, 29, 270, hexToRgb("#0B0D16"));
  p.rect(32, 0, 1, 270, hexToRgb(CYAN), 0.3); // rim light off the walls
  p.rect(451, 0, 1, 270, hexToRgb(MAGENTA), 0.3);
  neonSign(p, 8, 60, 70, MAGENTA);
  neonSign(p, 454, 86, 66, CYAN);
  neonSign(p, 454, 168, 40, AMBER);
  // steam venting from a grate, bottom-left — a visible grate at the base,
  // wisps spreading and thinning as they rise so the plume reads as steam
  p.rect(38, 244, 34, 4, hexToRgb("#080A10"));
  for (let gx = 40; gx < 70; gx += 4) p.rect(gx, 245, 2, 2, hexToRgb("#18202E"));
  for (let i = 0; i < 8; i++) {
    const spread = 3 + i * 2;
    const sx = 52 + Math.floor(p.rng() * spread * 2) - spread;
    p.blob(sx, 238 - i * 4, 3 + Math.floor(i / 2), mix(hexToRgb("#232C40"), hexToRgb(CYAN), 0.12));
  }
  return p.dataURL();
}

/* --------------------------------- foreground --------------------------------- */

function foreground(): string {
  const p = new Painter(W, H).seed(68);
  // dumpster, left
  p.rect(45, 205, 105, 65, hexToRgb("#0C0E15"));
  p.rect(45, 200, 105, 7, hexToRgb("#10131C")); // lid
  p.rect(60, 194, 10, 7, hexToRgb("#080A10")); // trash poking out
  p.rect(45, 205, 105, 1, hexToRgb(MAGENTA), 0.45); // neon rim
  for (let i = 0; i < 4; i++) p.rect(55 + i * 24, 212, 2, 56, hexToRgb("#080A10"));
  p.rect(160, 236, 30, 24, hexToRgb("#0A0C12")); // trash bag
  p.px(162, 238, hexToRgb(CYAN), 0.3);
  // hanging pipe + elbow from the top
  p.rect(310, 0, 7, 125, hexToRgb("#0C0E15"));
  p.rect(310, 118, 20, 6, hexToRgb("#0C0E15"));
  p.rect(310, 0, 1, 125, hexToRgb(CYAN), 0.25); // rim
  // dripping leak
  p.px(328, 130, hexToRgb("#9AB7DC"), 0.6);
  p.px(328, 138, hexToRgb("#9AB7DC"), 0.4);
  // warm lantern, bottom-right — contrast against the neon
  p.glow(400, 205, 26, AMBER, 6, 0.5);
  p.rect(399, 172, 2, 18, hexToRgb("#0C0E15")); // cord
  p.rect(396, 190, 9, 22, hexToRgb("#0C0E15"));
  p.rect(398, 193, 5, 15, hexToRgb(AMBER));
  p.rect(399, 195, 3, 11, HOT);
  p.rect(400, 193, 1, 15, hexToRgb("#0C0E15"), 0.8);
  return p.dataURL();
}

/* ---------------------------------- ground ---------------------------------- */

function ground(): string {
  const p = new Painter(W, G).seed(102);
  p.sky(["#0A0C14", "#0C1420", "#122229"], 0.25, 480);
  // wet asphalt aggregate: subtle speckle
  for (let i = 0; i < 500; i++) {
    const x = Math.floor(p.rng() * 480);
    const y = Math.floor(p.rng() * 480);
    p.px(x, y, hexToRgb(p.rng() > 0.5 ? "#161C28" : "#060810"), 0.5);
  }
  // expansion seams
  for (let y = 30; y < 480; y += 58) p.rect(0, y, 480, 1, hexToRgb("#04050A"));
  // center lane dashes, fading to the horizon
  for (let y = 0; y < 480; y += 18) {
    p.rect(238, y, 4, 9, hexToRgb("#8A7A3A"), 0.25 * (1 - y / 480) + 0.06);
  }
  // manhole
  const mx = 150;
  const my = 90;
  p.blob(mx, my, 9, hexToRgb("#05070C"));
  p.blob(mx, my, 7, hexToRgb("#10141E"));
  for (let i = -5; i <= 5; i += 2) p.rect(mx + i, my - 5, 1, 10, hexToRgb("#05070C"));
  // neon reflection streaks: vertical smears under each sign, converging
  // toward the horizon (sign x positions from mid + near facades)
  const streaks: [number, string, number][] = [
    [19, MAGENTA, 6], // near-left big sign
    [80, MAGENTA, 4], // mid-left signs
    [80, CYAN, 3],
    [392, CYAN, 4], // mid-right signs
    [392, AMBER, 3],
    [462, CYAN, 6], // near-right big sign
    [462, AMBER, 4],
    [240, AMBER, 3], // wire lanterns
    [400, AMBER, 5], // foreground lantern
  ];
  for (const [sx, c, w] of streaks) {
    const rgb = hexToRgb(c);
    for (let y = groundRow(300); y > 0; y -= 2) {
      const fade = 1 - y / 480;
      if (p.rng() < 0.3 * fade) continue; // broken reflection
      const a = 0.3 * fade + 0.05;
      p.rect(sx + Math.round(Math.sin(y * 0.04 + sx) * 3), y, w, 2, rgb, a * (0.6 + p.rng() * 0.4));
      if (p.rng() < 0.25 * fade) {
        p.rect(sx + Math.round(Math.sin(y * 0.04 + sx) * 3) + Math.floor(w / 2), y, 1, 2, [255, 255, 255], a * 0.8);
      }
    }
  }
  // puddles with sky reflection
  for (let i = 0; i < 26; i++) {
    const y = Math.floor(p.rng() * 380);
    const w = 20 + Math.floor(p.rng() * 50);
    p.rect(Math.floor(p.rng() * 420), y, w, 2, hexToRgb("#8CB4DC"), 0.16);
    if (p.rng() > 0.5) p.rect(Math.floor(p.rng() * 420), y + 2, Math.floor(w / 2), 1, hexToRgb(CYAN), 0.12);
  }
  // warm pool under the foreground lantern
  p.glow(400, groundRow(-300) - 10, 40, AMBER, 5, 0.25);
  // umbrella glow spilling around the runner
  p.glow(240, groundRow(10) + 4, 34, CYAN, 5, 0.3);
  return p.dataURL();
}

/* ---------------------------------- assembly ---------------------------------- */

export function alleyLayers(): Layer[] {
  return [
    billboard("back wall", backWall(), 700, 1.25, { lit: false }),
    billboard("mid facades", midFacades(), 350, 1.1),
    billboard("neon signs", nearSigns(), 120, 1.03),
    characterLayer("runner", "runner", W * 0.5, 10, 1.2),
    groundPlane("wet asphalt", ground()),
    billboard("foreground junk", foreground(), -300, 1.35),
  ];
}

export function alleyEffects(): RenderEffects {
  const fx = defaultEffects();
  fx.sun = { color: "#7A8FC8", intensity: 0.55, azimuth: 210, elevation: 55 };
  fx.ambient = { color: "#7E86D8", intensity: 1.12 };
  fx.fog = { enabled: true, color: "#0E2228", near: 600, far: 2200 };
  fx.dof = { enabled: true, focus: 150, aperture: 0.35 };
  fx.bloom = { enabled: true, strength: 1.0, threshold: 0.32 };
  fx.grade = { vignette: 0.55, saturation: 1.12, grain: 0.07 };
  fx.particles = { enabled: true, color: "#9ADBE8", count: 90, size: 2, speed: 1.4 };
  return fx;
}

export const alleyMeta = {
  name: "Neon Alley",
  tag: "URBAN",
  description:
    "Rain-slick neon corridor: mullioned windows, glyph-slotted signs with white-hot tubes, wet asphalt mirroring it all — and a runner with a glowing umbrella.",
};
