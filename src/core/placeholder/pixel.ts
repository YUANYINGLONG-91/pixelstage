/**
 * Pixel-art painting kit — the foundation of all placeholder art.
 *
 * Everything is painted on a 2px grid (a 960×540 stage = 480×270 cells),
 * the way real pixel art is made: one "pixel" is a 2×2 screen block.
 *
 * Three quality rules borrowed from 16-bit craft (and Octopath's textures):
 *  1. Ordered Bayer dithering, never random noise — random stipple reads as
 *     TV static, Bayer reads as intentional 16-bit shading.
 *  2. Hue-shifted ramps — shadows slide toward blue/violet, lights toward
 *     amber. Flat single-hue shading is what makes naive pixel art look cheap.
 *  3. Every shape is outlined, then shaded inside the outline.
 */

export type RGB = [number, number, number];

/** Deterministic RNG so placeholder scenes are stable across reloads. */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function css(c: RGB, a = 1): string {
  if (a >= 1) return `rgb(${c[0]},${c[1]},${c[2]})`;
  return `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;
}

export function mix(a: RGB, b: RGB, f: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ];
}

/* --------------------------------- HSL / ramps -------------------------------- */

function rgbToHsl(c: RGB): [number, number, number] {
  const [r, g, b] = [c[0] / 255, c[1] / 255, c[2] / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): RGB {
  h = ((h % 360) + 360) % 360 / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    t = ((t % 1) + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [Math.round(f(h + 1 / 3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1 / 3) * 255)];
}

/** Rotate hue a fraction of the shortest angular distance toward `target`. */
function hueToward(h: number, target: number, f: number): number {
  let d = target - h;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return h + d * f;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Six-tone hue-shifted ramp from a base color:
 * [deep, shade, base, light, bright, hot]
 * Shadows walk toward blue-violet (250°), lights toward amber (48°) — the
 * single biggest lever for making flat fills read as crafted pixel art.
 */
export function ramp(base: string | RGB): RGB[] {
  const c = typeof base === "string" ? hexToRgb(base) : base;
  const [h, s, l] = rgbToHsl(c);
  return [
    hslToRgb(hueToward(h, 250, 0.55), clamp01(s * 1.05), clamp01(l * 0.3)),
    hslToRgb(hueToward(h, 250, 0.35), clamp01(s * 1.02), clamp01(l * 0.55)),
    c,
    hslToRgb(hueToward(h, 48, 0.3), clamp01(s * 1.03), clamp01(l * 1.3)),
    hslToRgb(hueToward(h, 48, 0.5), clamp01(s * 0.95), clamp01(l * 1.62)),
    hslToRgb(hueToward(h, 48, 0.7), clamp01(s * 0.6), clamp01(l * 1.62 + 0.22)),
  ];
}

/** Warm white-hot core color — clears the engine's bloom threshold. */
export const HOT: RGB = [255, 246, 216];

/* ----------------------------------- Bayer ----------------------------------- */

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** Ordered-dither threshold for a cell, 0..1. */
export function bayer(x: number, y: number): number {
  return (BAYER[y & 3][x & 3] + 0.5) / 16;
}

/* ---------------------------------- Painter ---------------------------------- */

/**
 * Grid-locked painter: all coordinates are in cells (1 cell = `cell` screen
 * px, default 2). Pass screen-px canvas size to the constructor.
 */
export class Painter {
  readonly ctx: CanvasRenderingContext2D;
  readonly cell: number;
  readonly gw: number; // grid width  (cells)
  readonly gh: number; // grid height (cells)
  rng: () => number = mulberry32(1);

  constructor(wPx: number, hPx: number, cell = 2) {
    const canvas = document.createElement("canvas");
    canvas.width = wPx;
    canvas.height = hPx;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.cell = cell;
    this.gw = Math.floor(wPx / cell);
    this.gh = Math.floor(hPx / cell);
  }

  seed(n: number): this {
    this.rng = mulberry32(n);
    return this;
  }

  private col(c: RGB | string, a: number): string {
    const rgb = typeof c === "string" ? hexToRgb(c) : c;
    return css(rgb, a);
  }

  /** One cell. */
  px(x: number, y: number, c: RGB | string, a = 1) {
    this.ctx.fillStyle = this.col(c, a);
    this.ctx.fillRect(x * this.cell, y * this.cell, this.cell, this.cell);
  }

  /** Filled rect in cell units. */
  rect(x: number, y: number, w: number, h: number, c: RGB | string, a = 1) {
    this.ctx.fillStyle = this.col(c, a);
    this.ctx.fillRect(x * this.cell, y * this.cell, w * this.cell, h * this.cell);
  }

  /** Ordered-dither mix: `a` base with `b` stippled in at density f (0..1). */
  dither(x: number, y: number, w: number, h: number, a: RGB | string, b: RGB | string, f: number) {
    this.rect(x, y, w, h, a);
    this.ctx.fillStyle = this.col(b, 1);
    const k = this.cell;
    for (let gy = y; gy < y + h; gy++) {
      for (let gx = x; gx < x + w; gx++) {
        if (bayer(gx, gy) < f) this.ctx.fillRect(gx * k, gy * k, k, k);
      }
    }
  }

  /**
   * Vertical dithered blend from color `a` (top) to `b` (bottom): density of
   * `b` rises f0→f1. The workhorse for skies, ground fades, light falloff.
   */
  ditherV(x: number, y: number, w: number, h: number, a: RGB | string, b: RGB | string, f0: number, f1: number) {
    for (let gy = y; gy < y + h; gy++) {
      const f = f0 + ((f1 - f0) * (gy - y)) / Math.max(1, h - 1);
      this.dither(x, gy, w, 1, a, b, f);
    }
  }

  /** Horizontal variant of ditherV. */
  ditherH(x: number, y: number, w: number, h: number, a: RGB | string, b: RGB | string, f0: number, f1: number) {
    for (let gx = x; gx < x + w; gx++) {
      const f = f0 + ((f1 - f0) * (gx - x)) / Math.max(1, w - 1);
      this.dither(gx, y, 1, h, a, b, f);
    }
  }

  /**
   * Multi-stop vertical gradient with ordered-dither transitions between
   * stops — the classic 16-bit sky. `zone` = fraction of each band used for
   * the dithered blend into the next stop.
   */
  sky(stops: (RGB | string)[], zone = 0.4, height = this.gh) {
    const cols = stops.map((s) => (typeof s === "string" ? hexToRgb(s) : s));
    for (let gy = 0; gy < height; gy++) {
      const t = gy / height;
      const fx = t * (cols.length - 1);
      const i = Math.min(cols.length - 2, Math.floor(fx));
      const f = fx - i;
      if (f < 1 - zone) {
        this.rect(0, gy, this.gw, 1, mix(cols[i], cols[i + 1], f * 0.5));
      } else {
        const d = (f - (1 - zone)) / zone;
        this.dither(0, gy, this.gw, 1, cols[i], cols[i + 1], d);
      }
    }
  }

  /** Pixel-art glow: dithered concentric squares, densest at the core. */
  glow(cx: number, cy: number, r: number, c: RGB | string, steps = 5, maxA = 0.6) {
    const rgb = typeof c === "string" ? hexToRgb(c) : c;
    for (let i = steps; i >= 1; i--) {
      const rr = Math.round((r * i) / steps);
      const a = (maxA * (steps - i + 1)) / steps;
      // dither the halo edges so it doesn't band
      this.ctx.fillStyle = css(rgb, a);
      const k = this.cell;
      for (let gy = cy - rr; gy <= cy + rr; gy++) {
        for (let gx = cx - rr; gx <= cx + rr; gx++) {
          const edge = Math.max(Math.abs(gx - cx), Math.abs(gy - cy)) / Math.max(1, rr);
          if (bayer(gx, gy) > edge * edge * 0.9) this.ctx.fillRect(gx * k, gy * k, k, k);
        }
      }
    }
  }

  /** Filled polygon (screen coords, snapped to grid). */
  poly(pts: [number, number][], c: RGB | string, a = 1) {
    this.ctx.fillStyle = this.col(c, a);
    const k = this.cell;
    this.ctx.beginPath();
    this.ctx.moveTo(pts[0][0] * k, pts[0][1] * k);
    for (let i = 1; i < pts.length; i++) this.ctx.lineTo(pts[i][0] * k, pts[i][1] * k);
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Organic blob quantized to the grid — base unit of foliage. Each row's
   * half-width jitters so the silhouette reads hand-dithered.
   */
  blob(cx: number, cy: number, r: number, c: RGB | string) {
    const rng = this.rng;
    this.ctx.fillStyle = this.col(c, 1);
    const k = this.cell;
    for (let y = -r; y <= r; y++) {
      const half = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)) * (0.75 + rng() * 0.35));
      if (half <= 0) continue;
      this.ctx.fillRect((cx - half) * k, (cy + y) * k, half * 2 * k, k);
    }
  }

  /** Scatter cells inside a disc (flecks, leaves, snow sparkle). */
  flecks(cx: number, cy: number, r: number, c: RGB | string, count: number, squash = 0.7) {
    const rng = this.rng;
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const d = rng() * r;
      this.px(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d * squash), c);
    }
  }

  dataURL(): string {
    return this.ctx.canvas.toDataURL("image/png");
  }
}
