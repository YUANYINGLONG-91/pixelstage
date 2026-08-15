/**
 * Emberhold Ruins — torch-lit flagstone hall. Broken rune pillars, a teal
 * archway breathing cold light, god rays from ceiling cracks, a treasure
 * chest glinting in the dark, and a mage drawn to it.
 */

import type { Layer, RenderEffects } from "../../types";
import { defaultEffects } from "../../types";
import { HOT, Painter, hexToRgb, mix, ramp } from "../pixel";
import { rubble, stoneWall } from "../materials";
import { G, H, W, billboard, characterLayer, groundPlane, groundRow } from "../stage";

const TEAL = "#4FD1B5";
const TEAL_HOT = "#D8FFF2";
const FLAME = "#FFB648";

/* -------------------------------- cavern wall -------------------------------- */

/** 3×5 bitmap rune glyphs — deliberate clusters, never scattered dots. */
const RUNES = [
  ["X.X", ".X.", "XXX", ".X.", "X.X"],
  ["XXX", "X..", "XX.", "X..", "XXX"],
  [".X.", "X.X", "XXX", "..X", "XX."],
  ["X.X", "XXX", ".X.", ".X.", "XXX"],
  ["XX.", ".X.", "XXX", ".X.", ".XX"],
];

function runeGlyph(p: Painter, x: number, y: number, idx: number, c: string, a = 0.9) {
  const g = RUNES[((idx % RUNES.length) + RUNES.length) % RUNES.length];
  const rgb = hexToRgb(c);
  for (let gy = 0; gy < 5; gy++)
    for (let gx = 0; gx < 3; gx++) if (g[gy][gx] === "X") p.px(x + gx, y + gy, rgb, a);
}

function wallTorch(p: Painter, x: number, y: number) {
  p.glow(x, y, 76, FLAME, 8, 0.7);
  // bracket: wall plate + angled arm
  p.rect(x - 3, y + 4, 6, 2, hexToRgb("#2A2016"));
  p.rect(x - 1, y + 3, 2, 9, hexToRgb("#3A2E1E"));
  // flame teardrop: outer → mid → white heart, flicker tip
  p.rect(x - 2, y - 2, 5, 5, hexToRgb("#C97B4A"));
  p.rect(x - 1, y - 4, 3, 6, hexToRgb(FLAME));
  p.rect(x, y - 6, 1, 2, hexToRgb(FLAME));
  p.rect(x - 1, y - 2, 2, 4, HOT);
  p.px(x + 1, y - 7, hexToRgb(FLAME), 0.7);
  // rising sparks
  for (let i = 0; i < 7; i++) {
    p.px(x - 10 + Math.floor(p.rng() * 20), y - 14 - Math.floor(p.rng() * 16), hexToRgb(FLAME), 0.3 + p.rng() * 0.55);
  }
}

function cavernWall(): string {
  const p = new Painter(W, H).seed(77);
  p.sky(["#2A2733", "#1C1A22", "#0A0B10"], 0.25);
  // massive block courses over the whole wall
  stoneWall(p, 0, 0, 480, 270, ramp("#38323F"), 20, 12);
  // deep cracks
  for (let i = 0; i < 10; i++) {
    let cx = Math.floor(p.rng() * 480);
    let cy = Math.floor(p.rng() * 180);
    for (let s = 0; s < 7; s++) {
      p.rect(cx, cy, 2, 2, hexToRgb("#12101A"));
      cx += p.rng() > 0.5 ? 2 : -2;
      cy += 2;
    }
  }
  // seeping damp at the wall base
  p.dither(0, 230, 480, 40, hexToRgb("#12101A"), hexToRgb("#0A0B10"), 0.4);
  // two wall torches
  wallTorch(p, 120, 113);
  wallTorch(p, 346, 110);
  return p.dataURL();
}

/* ------------------------------ pillars & arch ------------------------------ */

function runePillar(p: Painter, x: number, yBase: number, h: number, broken: boolean) {
  const stone = ramp("#2E2A3A");
  const w = 24;
  const top = yBase - h;
  stoneWall(p, x, top, w, h, stone, 8, 5);
  if (broken) {
    // jagged broken crown, dark against the wall
    for (let i = 0; i < w; i += 3) {
      p.rect(x + i, top - Math.floor(p.rng() * 5), 3, 5, hexToRgb("#12101A"));
    }
  } else {
    p.rect(x - 4, top - 4, w + 8, 5, stone[1]); // capital
    p.rect(x - 4, top - 4, w + 8, 1, stone[3]);
  }
  p.rect(x - 4, yBase - 4, w + 8, 4, stone[1]); // base
  // torch-side rim light
  p.rect(x + (x < 240 ? w - 1 : 0), top, 1, h, mix(stone[3], hexToRgb(FLAME), 0.4), 0.8);
  // glowing runes down the shaft — real glyphs, each with a tiny halo
  for (let i = 0; i < Math.floor(h / 30); i++) {
    const ry = top + 12 + i * 30;
    const rx = x + w / 2 - 1 + (i % 2 === 0 ? -5 : 3);
    p.glow(rx + 1, ry + 2, 8, TEAL, 3, 0.35);
    runeGlyph(p, rx, ry, i * 2 + (broken ? 1 : 0), TEAL, 0.9);
    runeGlyph(p, rx, ry, i * 2 + (broken ? 1 : 0), TEAL_HOT, 0.45);
  }
  rubble(p, x - 8, yBase - 3, w + 16, 3, ramp("#3A3644"), 6);
}

function pillarsAndArch(): string {
  const p = new Painter(W, H).seed(88);
  const base = 227; // baseRow(300)
  runePillar(p, 77, base, 180, false);
  runePillar(p, 336, base, 150, true);

  /* archway: a real stepped stone arch breathing teal light.
     Crown rows follow a semicircle; the glow inside is concentric ARCHES,
     not stacked rects — that's what kills the "flat green door" look. */
  const ax = 192;
  const aw = 96;
  const atop = 85;
  const acx = ax + aw / 2;
  const rIn = aw / 2; // opening crown radius
  const rOut = rIn + 9; // frame crown radius
  const frame = ramp("#2E2A3A");

  // frame: outer arch crown + jamb band
  for (let dy = 0; dy <= rOut; dy++) {
    const half = Math.round(Math.sqrt(rOut * rOut - dy * dy));
    p.rect(acx - half, atop - dy, half * 2, 1, frame[1]);
  }
  p.rect(ax - 9, atop, aw + 18, base - atop, frame[1]);
  // voussoir wedge blocks around the crown + keystone
  for (let a = 0; a <= 14; a++) {
    const th = (Math.PI * a) / 14;
    const bx = Math.round(acx - Math.cos(th) * (rOut - 2));
    const by = Math.round(atop - Math.sin(th) * (rOut - 2));
    p.rect(bx - 2, by - 2, 4, 4, a % 2 ? frame[2] : frame[0]);
    p.rect(bx - 2, by - 2, 4, 1, frame[3]);
  }
  p.rect(acx - 2, atop - rOut - 1, 5, 6, frame[2]); // keystone
  p.rect(acx - 2, atop - rOut - 1, 5, 1, frame[3]);
  // jamb block courses
  for (let y = atop + 4; y < base - 2; y += 9) {
    p.rect(ax - 9, y, 9, 1, frame[0]);
    p.rect(ax + aw, y + 4, 9, 1, frame[0]);
  }
  p.rect(ax - 9, atop, 2, base - atop, frame[3], 0.6); // jamb edge light
  p.rect(ax + aw + 7, atop, 2, base - atop, frame[3], 0.6);

  // the opening: near-black arch void
  for (let dy = 0; dy <= rIn; dy++) {
    const half = Math.round(Math.sqrt(rIn * rIn - dy * dy));
    p.rect(acx - half, atop - dy, half * 2, 1, hexToRgb("#081014"));
  }
  p.rect(ax, atop, aw, base - atop, hexToRgb("#081014"));

  // teal breath: concentric arches, alpha climbing toward the core
  // (body inset matches the crown shrink so no seam lip at the junction)
  for (let i = 0; i < 7; i++) {
    const rr = rIn - i * 3;
    const inset = i * 3;
    const a = 0.05 + i * 0.055;
    if (rr > 0) {
      for (let dy = 0; dy <= rr; dy++) {
        const half = Math.round(Math.sqrt(rr * rr - dy * dy));
        p.rect(acx - half, atop - dy, half * 2, 1, hexToRgb(TEAL), a);
      }
    }
    p.rect(ax + inset, atop, aw - inset * 2, base - atop, hexToRgb(TEAL), a);
  }
  // bright core column, widening toward the floor like light spilling out
  for (let y = atop - rIn + 8; y < base; y++) {
    const t = (y - (atop - rIn + 8)) / (base - atop + rIn - 8);
    const half = Math.round(2 + t * 7);
    p.rect(acx - half, y, half * 2, 1, hexToRgb(TEAL_HOT), 0.2 + t * 0.55);
  }
  // threshold steps catching the light
  p.rect(ax - 6, base - 3, aw + 12, 3, frame[2]);
  p.rect(ax - 6, base - 3, aw + 12, 1, mix(frame[3], hexToRgb(TEAL), 0.5));
  p.rect(ax - 2, base - 6, aw + 4, 3, frame[1]);
  p.rect(ax - 2, base - 6, aw + 4, 1, mix(frame[2], hexToRgb(TEAL), 0.4));
  // runes ascending the core
  for (let i = 0; i < 5; i++) {
    const ry = atop + 16 + i * 24;
    const rx = acx + (i % 2 === 0 ? -16 : 12);
    p.glow(rx + 1, ry + 2, 7, TEAL, 3, 0.4);
    runeGlyph(p, rx, ry, i + 2, TEAL_HOT, 0.85);
  }
  p.glow(acx, atop + 30, 36, TEAL, 6, 0.35);
  return p.dataURL();
}

/* -------------------------------- near pillars -------------------------------- */

function nearPillars(): string {
  const p = new Painter(W, H).seed(89);
  const stone = ramp("#26222E");
  for (const px of [-12, 454]) {
    stoneWall(p, px, 0, 38, 270, stone, 12, 8);
    p.rect(px - 4, 0, 46, 10, stone[0]); // capital
    // torch-side rim
    p.rect(px + (px < 240 ? 36 : 0), 10, 2, 260, mix(stone[3], hexToRgb(FLAME), 0.35), 0.8);
    // faint runes
    for (let i = 0; i < 3; i++) {
      runeGlyph(p, px + 12 + (i % 2) * 12, 60 + i * 60, i + (px < 240 ? 0 : 2), TEAL, 0.55);
    }
  }
  return p.dataURL();
}

/* ---------------------------------- treasure ---------------------------------- */

function treasure(): string {
  const p = new Painter(W, H).seed(90);
  const base = 268;
  // chest: outlined planks, gold trim, hot lock
  const wood = ramp("#5E4028");
  const gold = ramp("#D8A84E");
  const cx = 392;
  p.rect(cx - 1, base - 17, 32, 17, hexToRgb("#1A1410")); // outline
  p.rect(cx, base - 16, 30, 15, wood[2]);
  p.rect(cx, base - 16, 30, 6, wood[3]); // lid
  p.rect(cx, base - 11, 30, 1, wood[0]);
  p.rect(cx, base - 16, 2, 15, gold[2]); // bands
  p.rect(cx + 28, base - 16, 2, 15, gold[2]);
  p.glow(cx + 15, base - 9, 24, FLAME, 4, 0.55);
  p.rect(cx + 13, base - 11, 4, 6, gold[3]); // lock
  p.rect(cx + 14, base - 10, 2, 3, HOT);
  // glints + scattered coins
  p.px(cx + 3, base - 20, HOT, 0.95);
  p.px(cx + 26, base - 22, HOT, 0.8);
  for (let i = 0; i < 14; i++) {
    const x = cx - 20 + Math.floor(p.rng() * 70);
    p.rect(x, base - 1 - Math.floor(p.rng() * 2), 2, 1, gold[p.rng() > 0.5 ? 3 : 2], 0.9);
  }
  // bones, left
  const bone = ramp("#8A8678");
  p.rect(120, base - 2, 10, 2, bone[2]);
  p.rect(122, base - 6, 2, 5, bone[2]);
  p.px(121, base - 3, bone[3]);
  p.rect(136, base - 1, 6, 1, bone[1]);
  // rubble heaps
  rubble(p, 40, base - 4, 60, 4, ramp("#3A3644"), 12);
  rubble(p, 280, base - 3, 50, 3, ramp("#3A3644"), 9);
  // drifting embers in the torchlight
  for (let i = 0; i < 18; i++) {
    p.px(60 + Math.floor(p.rng() * 360), 190 + Math.floor(p.rng() * 60), hexToRgb(FLAME), 0.3 + p.rng() * 0.5);
  }
  return p.dataURL();
}

/* ---------------------------------- god rays ---------------------------------- */

function godRays(): string {
  const p = new Painter(W, H).seed(91);
  // pale gold wedges from ceiling cracks, slanting down-left
  for (let i = 0; i < 4; i++) {
    const sx = 200 + i * 70;
    const wTop = 8 + Math.floor(p.rng() * 14);
    p.poly(
      [
        [sx, 0],
        [sx + wTop, 0],
        [sx - 60 + wTop * 2, 270],
        [sx - 60, 270],
      ],
      hexToRgb("#FFD98A"),
      0.07 + p.rng() * 0.05
    );
    // dust motes caught in the shaft
    for (let d = 0; d < 12; d++) {
      p.px(sx - 50 + Math.floor(p.rng() * (wTop + 50)), Math.floor(p.rng() * 270), hexToRgb("#FFE9B0"), 0.25 + p.rng() * 0.35);
    }
  }
  return p.dataURL();
}

/* --------------------------------- foreground --------------------------------- */

function foreground(): string {
  const p = new Painter(W, H).seed(99);
  // spike row along the bottom
  const spike = ramp("#16141D");
  for (let x = 30; x < 450; x += 16) {
    const h = 24 + (x % 3) * 10;
    p.poly(
      [
        [x, 270],
        [x + 7, 270 - h],
        [x + 14, 270],
      ],
      spike[1]
    );
    p.rect(x + 7, 270 - h, 1, 3, hexToRgb(FLAME), 0.4); // torch glint on the tip
  }
  // hanging chains from the ceiling
  for (const cx of [98, 134, 345, 380]) {
    const len = 55 + Math.floor(p.rng() * 40);
    for (let y = 0; y < len; y += 6) {
      p.rect(cx + (y % 12 === 0 ? 0 : 1), y, 3, 5, hexToRgb("#0A0B10"));
      p.rect(cx + (y % 12 === 0 ? 2 : 3), y, 1, 5, hexToRgb(FLAME), 0.25);
    }
    p.rect(cx - 1, len, 6, 7, hexToRgb("#0A0B10")); // hook weight
  }
  return p.dataURL();
}

/* ---------------------------------- ground ---------------------------------- */

function ground(): string {
  const p = new Painter(W, G).seed(103);
  p.sky(["#262231", "#1A1721", "#0B0A11"], 0.2, 480);
  // flagstones: uniform world-space grid, perspective foreshortens it
  const stone = ramp("#332E3E");
  for (let row = 0; row < 480; row += 16) {
    const off = (row / 16) % 2 === 0 ? 0 : 16;
    for (let x = -off; x < 480; x += 32) {
      const tone = p.rng() < 0.3 ? mix(stone[1], stone[2], 0.6) : stone[2];
      p.rect(x, row, 31, 15, tone);
      p.rect(x, row, 31, 1, stone[3], 0.5);
      p.rect(x + 30, row, 1, 15, stone[0]);
      p.rect(x, row + 14, 31, 1, stone[0]);
    }
  }
  // warm pools under the wall torches (wall depth 650)
  p.glow(120, groundRow(650), 70, FLAME, 7, 0.45);
  p.glow(346, groundRow(650), 66, FLAME, 7, 0.45);
  // teal spill from the archway (depth 300) and god-ray pools (depth 60)
  p.glow(240, groundRow(300), 60, TEAL, 6, 0.35);
  p.glow(220, groundRow(60), 40, "#FFD98A", 5, 0.15);
  p.glow(340, groundRow(60), 36, "#FFD98A", 5, 0.12);
  // gold spill around the chest (focal)
  p.glow(400, groundRow(0), 34, FLAME, 5, 0.3);
  // spike-trap slots across the far floor
  for (let x = 40; x < 440; x += 60) {
    p.rect(x, groundRow(300) - 20, 28, 5, hexToRgb("#050508"));
    p.rect(x, groundRow(300) - 20, 28, 1, hexToRgb(FLAME), 0.28);
  }
  // near rubble + bone shards
  rubble(p, 0, 0, 480, 120, ramp("#3A3644"), 26);
  return p.dataURL();
}

/* ---------------------------------- assembly ---------------------------------- */

export function ruinsLayers(): Layer[] {
  return [
    billboard("cavern wall", cavernWall(), 650, 1.25, { lit: false }),
    billboard("pillars & arch", pillarsAndArch(), 300, 1.1),
    billboard("near pillars", nearPillars(), 120, 1.03),
    billboard("god rays", godRays(), 60, 1, { lit: false }),
    billboard("treasure", treasure(), 0),
    characterLayer("mage", "mage", W * 0.35, 15, 1.2),
    groundPlane("flagstone floor", ground()),
    billboard("spikes & chains", foreground(), -300, 1.35),
  ];
}

export function ruinsEffects(): RenderEffects {
  const fx = defaultEffects();
  fx.sun = { color: "#FF9A3C", intensity: 1.45, azimuth: 300, elevation: 25 };
  fx.ambient = { color: "#7A6A88", intensity: 1.15 };
  fx.fog = { enabled: true, color: "#0A0B10", near: 700, far: 2400 };
  fx.dof = { enabled: true, focus: 300, aperture: 0.4 };
  fx.bloom = { enabled: true, strength: 0.8, threshold: 0.42 };
  fx.grade = { vignette: 0.55, saturation: 1.14, grain: 0.07 };
  fx.particles = { enabled: true, color: "#FFB648", count: 90, size: 2.5, speed: 1.3 };
  return fx;
}

export function ruinsCamera() {
  return { posY: H * 0.42, targetY: H * 0.54 };
}

export const ruinsMeta = {
  name: "Emberhold Ruins",
  tag: "INTERIOR",
  description:
    "Torch-lit ruins: rune pillars and a teal archway, god rays through ceiling cracks, a glinting chest — and a mage who found it first.",
};
