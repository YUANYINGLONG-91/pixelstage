/**
 * Goldenhollow Village — golden hour over a half-timbered market town.
 * The flagship scene: Atlasdam-style timber houses, cobblestone square,
 * market stall, two heroes walking. Warm amber light, mauve shade.
 */

import type { Layer, RenderEffects } from "../../types";
import { defaultEffects } from "../../types";
import { HOT, Painter, hexToRgb, mix, ramp } from "../pixel";
import { cobble, grassTuft, leafCluster, pineTree, trunk } from "../materials";
import {
  bannerPole,
  barrel,
  crate,
  house,
  marketStall,
  signpost,
  stoneLantern,
  streetLamp,
  well,
} from "../props";
import { G, H, W, billboard, characterLayer, groundPlane, groundRow } from "../stage";

/* ----------------------------------- sky ----------------------------------- */

function sky(): string {
  const p = new Painter(W, H).seed(11);
  p.sky(["#2E3560", "#6A5A8C", "#C9764E", "#FFC877"], 0.38);
  // early stars in the zenith
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(p.rng() * 480);
    const y = Math.floor(p.rng() * 60);
    p.px(x, y, p.rng() > 0.8 ? [237, 239, 245] : [164, 173, 191], 0.35 + p.rng() * 0.5);
  }
  // low sun: halo → gold disc → white-hot core
  const sx = 326;
  const sy = 148;
  p.glow(sx, sy, 46, "#FFB648", 8, 0.5);
  p.glow(sx, sy, 24, "#FFD98A", 5, 0.6);
  p.rect(sx - 8, sy - 8, 16, 16, hexToRgb("#FFE9B0"));
  p.rect(sx - 5, sy - 5, 10, 10, hexToRgb("#FFF8E0"));
  // dusk clouds: mauve bodies, gold under-edges
  const cloud = (cx: number, cy: number, s: number, body: string, edge: string) => {
    p.blob(cx, cy, 8 * s, body);
    p.blob(cx + 9 * s, cy + 2 * s, 6 * s, body);
    p.blob(cx - 8 * s, cy + 2 * s, 5 * s, body);
    for (let i = 0; i < 10 * s; i++) {
      p.rect(cx - 10 * s + Math.floor(p.rng() * 20 * s), cy + 4 * s + Math.floor(p.rng() * 2), 2, 1, edge, 0.8);
    }
  };
  cloud(70, 40, 2, "#5E4E68", "#FFC877");
  cloud(210, 58, 1.5, "#54465E", "#F0A96A");
  cloud(390, 30, 1.3, "#5E4E68", "#FFC877");
  cloud(280, 96, 1.1, "#6A5468", "#FFD98A");
  // distant birds
  for (const [bx, by] of [
    [140, 68],
    [158, 60],
    [172, 70],
  ]) {
    p.rect(bx - 2, by, 2, 1, [30, 26, 40], 0.8);
    p.rect(bx + 1, by, 2, 1, [30, 26, 40], 0.8);
    p.px(bx, by - 1, [30, 26, 40], 0.8);
  }
  return p.dataURL();
}

/* ---------------------------- distant town ---------------------------- */

function townSilhouette(): string {
  const p = new Painter(W, H).seed(22);
  const base = 224; // cells — baseRow(400)
  const haze = hexToRgb("#8A6E88");
  const mid = hexToRgb("#6A5578");
  const near = hexToRgb("#54466A");
  // far ridge of rooftops
  for (let x = 0; x < 480; x += 18) {
    const hh = 8 + Math.floor(p.rng() * 10);
    p.rect(x, base - hh, 16, hh, haze);
    p.poly(
      [
        [x - 1, base - hh],
        [x + 8, base - hh - 6],
        [x + 17, base - hh],
      ],
      haze
    );
  }
  p.dither(0, base - 26, 480, 26, haze, hexToRgb("#FFC877"), 0.12); // gold haze
  // mid rooftops
  for (let x = 8; x < 480; x += 26) {
    const hh = 12 + Math.floor(p.rng() * 12);
    p.rect(x, base - hh, 22, hh, mid);
    p.poly(
      [
        [x - 2, base - hh],
        [x + 11, base - hh - 8],
        [x + 24, base - hh],
      ],
      mid
    );
  }
  // church spire with lit windows
  const cx = 118;
  p.rect(cx - 6, base - 34, 12, 34, near);
  p.poly(
    [
      [cx - 8, base - 34],
      [cx, base - 52],
      [cx + 8, base - 34],
    ],
    near
  );
  p.rect(cx - 1, base - 56, 2, 4, near);
  p.px(cx - 1, base - 57, near);
  p.px(cx + 1, base - 57, near);
  p.rect(cx - 2, base - 28, 4, 6, hexToRgb("#2A2436"));
  p.rect(cx - 1, base - 27, 2, 4, hexToRgb("#FFC45E")); // lit spire window
  p.px(cx, base - 26, HOT);
  // a couple of warm windows in the silhouette
  for (let i = 0; i < 8; i++) {
    const wx = 20 + Math.floor(p.rng() * 440);
    p.rect(wx, base - 6 - Math.floor(p.rng() * 10), 2, 2, hexToRgb("#FFC45E"), 0.85);
  }
  p.dither(0, base - 8, 480, 8, mid, hexToRgb("#E8935C"), 0.2); // ground haze
  return p.dataURL();
}

/* ------------------------------- houses row ------------------------------- */

function housesRow(): string {
  const p = new Painter(W, H).seed(33);
  const base = 244; // baseRow(180)
  // left: big two-storey terracotta
  house(p, 30, base, 88, 96, { roof: "#A05238", floors: 2, litWindows: 3 });
  // mid-left: small slate cottage
  house(p, 138, base, 62, 70, { roof: "#4E5A74", floors: 1, plaster: "#C9B896", litWindows: 2 });
  // right: tall narrow pair, gap in the middle shows the square
  house(p, 330, base, 70, 100, { roof: "#8C4A3A", floors: 2, beam: "#3E2A20", litWindows: 2 });
  house(p, 412, base, 56, 78, { roof: "#5E6880", floors: 1, litWindows: 1 });
  // climbing greenery on the left house wall
  const leaf = ramp("#4A6A3C");
  for (let i = 0; i < 6; i++) {
    leafCluster(p, 34 + Math.floor(p.rng() * 10), base - 8 - i * 8, 4, [leaf[0], leaf[1], leaf[2], leaf[3]]);
  }
  // pine peeking behind the right houses
  pineTree(p, 320, base, 60, ramp("#2E4A3C"));
  return p.dataURL();
}

/* ----------------------------- market square ----------------------------- */

function marketSquare(): string {
  const p = new Painter(W, H).seed(34);
  const base = 268; // focal plane ground line (bottom of frame = 270)
  // big tree shading the square, right side
  trunk(p, 402, base, 5, 40, ramp("#4A3226"));
  const leaf = ramp("#3E6034");
  leafCluster(p, 400, base - 52, 22, [leaf[0], leaf[1], leaf[2], leaf[3]]);
  leafCluster(p, 424, base - 44, 14, [leaf[0], leaf[1], leaf[2], leaf[3]]);
  leafCluster(p, 380, base - 40, 12, [leaf[0], leaf[1], leaf[2], leaf[3]]);
  // market stall with red-striped awning and produce
  marketStall(p, 60, base, 52, "#B04038", ["#D8A84E", "#A03A2E", "#7A9A4A", "#C9764E"]);
  barrel(p, 46, base, 1);
  crate(p, 120, base, 1);
  barrel(p, 128, base, 1);
  // well at center-right
  well(p, 268, base, 22);
  // banners + lantern + lamp + signpost
  bannerPole(p, 172, base, 44, "#B04038");
  bannerPole(p, 352, base, 40, "#3A5A8C");
  stoneLantern(p, 210, base, 1);
  streetLamp(p, 330, base, 30);
  signpost(p, 246, base);
  // petal drift in the light
  for (let i = 0; i < 16; i++) {
    p.px(150 + Math.floor(p.rng() * 220), 180 + Math.floor(p.rng() * 60), hexToRgb("#FFD98A"), 0.3 + p.rng() * 0.5);
  }
  return p.dataURL();
}

/* --------------------------------- foreground --------------------------------- */

function foreground(): string {
  const p = new Painter(W, H).seed(44);
  // dark grass fringe along the bottom
  p.rect(0, 218, 480, 52, hexToRgb("#141720"));
  const grass = ramp("#1E2430");
  for (let x = 0; x < 480; x += 3) {
    grassTuft(p, x, 226 + Math.floor(p.rng() * 6), 5 + Math.floor(p.rng() * 8), [grass[0], grass[1], grass[2], hexToRgb("#8A5A3C")]);
  }
  // soft out-of-focus flowers
  for (let i = 0; i < 10; i++) {
    p.glow(Math.floor(p.rng() * 480), 225 + Math.floor(p.rng() * 40), 4 + Math.floor(p.rng() * 5), p.rng() > 0.5 ? "#FFD98A" : "#E59AC0", 3, 0.4);
  }
  // fence silhouette, right
  const wood = ramp("#10131A");
  for (let x = 380; x < 480; x += 8) {
    p.rect(x, 206, 3, 20, wood[2]);
  }
  p.rect(380, 210, 100, 2, wood[1]);
  p.rect(380, 217, 100, 2, wood[1]);
  // overhanging branch, top-left, backlit leaves
  const leaf = ramp("#171C26");
  p.rect(0, 0, 60, 6, hexToRgb("#0D1017"));
  leafCluster(p, 30, 26, 18, [leaf[0], leaf[1], leaf[2], hexToRgb("#4A3A2E")]);
  leafCluster(p, 62, 16, 12, [leaf[0], leaf[1], leaf[2], hexToRgb("#4A3A2E")]);
  return p.dataURL();
}

/* ---------------------------------- ground ---------------------------------- */

function ground(): string {
  const p = new Painter(W, G).seed(101);
  // earth base: warm loam near → dusk mauve at the horizon
  p.sky(["#3A3226", "#4A3E30", "#5E4A44", "#6E4E50"], 0.3, 480);
  // cobblestone plaza: constant world-size stones, staggered courses
  const stone = ramp("#8A7E6E");
  for (let row = 0; row < 480; row += 6) {
    const off = (row / 6) % 2 === 0 ? 0 : 5;
    for (let x = -off; x < 480; x += 10) {
      const tone = p.rng() < 0.15 ? mix(stone[1], stone[2], 0.5) : stone[2];
      cobble(p, x, row, 9, 5, [stone[0], stone[1], tone, stone[3]]);
    }
  }
  // grass verges creeping in from the edges
  const grassT = ramp("#3E5A34");
  for (let i = 0; i < 220; i++) {
    const side = p.rng() > 0.5;
    const x = side ? Math.floor(p.rng() * 70) : 410 + Math.floor(p.rng() * 70);
    const y = Math.floor(p.rng() * 460);
    grassTuft(p, x, y + 3, 3 + Math.floor(p.rng() * 4), [grassT[0], grassT[1], grassT[2], hexToRgb("#C9925A")]);
  }
  // wildflowers
  for (let i = 0; i < 60; i++) {
    const side = p.rng() > 0.5;
    const x = side ? Math.floor(p.rng() * 80) : 400 + Math.floor(p.rng() * 80);
    const y = Math.floor(p.rng() * 380);
    const c = p.rng() > 0.6 ? "#FFF6E0" : p.rng() > 0.4 ? "#FFD98A" : "#E59AC0";
    p.px(x, y, hexToRgb(c), 0.8);
    if (p.rng() > 0.5) p.px(x + 1, y, hexToRgb(c), 0.6);
  }
  // warm light pools under the focal-plane props (row = groundRow(0) ≈ 26)
  const r0 = groundRow(0);
  p.glow(120, r0 + 8, 40, "#FFB648", 6, 0.4); // stall lantern spill
  p.glow(330, r0 + 6, 34, "#FFC45E", 5, 0.4); // street lamp
  p.glow(210, r0 + 10, 26, "#FFB648", 5, 0.35); // stone lantern
  // pool under the houses' windows (depth 180)
  p.glow(90, groundRow(180), 50, "#E8935C", 6, 0.22);
  p.glow(360, groundRow(180), 46, "#E8935C", 6, 0.22);
  // near-edge corner falloff
  for (let y = 0; y < 60; y++) {
    p.rect(0, y, 480, 1, [8, 10, 14], 0.5 * (1 - y / 60));
  }
  return p.dataURL();
}

/* ---------------------------------- assembly ---------------------------------- */

export function villageLayers(): Layer[] {
  return [
    billboard("sky", sky(), 700, 1.25, { lit: false }),
    billboard("town silhouette", townSilhouette(), 400, 1.15),
    billboard("houses", housesRow(), 180, 1.08),
    billboard("market square", marketSquare(), 0),
    characterLayer("warrior", "warrior", W * 0.44, 10),
    characterLayer("merchant", "merchant", W * 0.56, 34),
    groundPlane("cobblestone square", ground()),
    billboard("grass fringe", foreground(), -300, 1.35),
  ];
}

export function villageEffects(): RenderEffects {
  const fx = defaultEffects();
  fx.sun = { color: "#FFB648", intensity: 1.6, azimuth: 60, elevation: 42 };
  fx.ambient = { color: "#9A8AC0", intensity: 0.95 };
  fx.fog = { enabled: true, color: "#9E6B58", near: 900, far: 2600 };
  fx.dof = { enabled: true, focus: 0, aperture: 0.35 };
  fx.bloom = { enabled: true, strength: 0.7, threshold: 0.5 };
  fx.grade = { vignette: 0.5, saturation: 1.18, grain: 0.05 };
  fx.particles = { enabled: true, color: "#FFE9B0", count: 130, size: 3, speed: 0.8 };
  return fx;
}

export function villageCamera() {
  return { posY: H * 0.2, targetY: H * 0.63 };
}

export const villageMeta = {
  name: "Goldenhollow Village",
  tag: "TOWN",
  description:
    "Golden hour over a half-timbered market town: dithered dusk sky, cobblestone square, a market stall and two travelers, all in real HD-2D depth.",
};
