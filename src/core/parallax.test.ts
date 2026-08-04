import { describe, expect, it } from "vitest";
import { clampCamera, computeScreenPos, sweepCamera } from "./parallax";
import { createLayer } from "./types";

const layer = (over: Partial<Parameters<typeof createLayer>[0]> = {}) =>
  createLayer({ name: "test", src: "x.png", ...over });

describe("computeScreenPos — the one multiply", () => {
  it("factor 0 locks the layer to the screen", () => {
    const l = layer({ factorX: 0, factorY: 0 });
    expect(computeScreenPos(l, { x: 320, y: 180 })).toEqual({ x: 0, y: 0 });
  });

  it("factor 1 glues the layer to the camera plane", () => {
    const l = layer({ factorX: 1, factorY: 1 });
    expect(computeScreenPos(l, { x: 320, y: 180 })).toEqual({ x: -320, y: -180 });
  });

  it("mid factor shifts proportionally (PRD example: 0 − 320 × 0.40 → −128)", () => {
    const l = layer({ factorX: 0.4, factorY: 0.25, offsetX: 0, offsetY: 0 });
    const p = computeScreenPos(l, { x: 320, y: 180 });
    expect(p.x).toBeCloseTo(-128);
    expect(p.y).toBeCloseTo(-45);
  });

  it("offset shifts the base position", () => {
    const l = layer({ factorX: 0.5, factorY: 0.5, offsetX: 100, offsetY: -20 });
    expect(computeScreenPos(l, { x: 40, y: 10 })).toEqual({ x: 80, y: -25 });
  });

  it("factor > 1 moves faster than the camera (foreground occluders)", () => {
    const l = layer({ factorX: 1.5 });
    expect(computeScreenPos(l, { x: 100, y: 0 }).x).toBe(-150);
  });
});

describe("clampCamera", () => {
  const size = { width: 960, height: 540 };
  it("passes through in-range values", () => {
    expect(clampCamera({ x: 320, y: 180 }, size)).toEqual({ x: 320, y: 180 });
  });
  it("clamps to ±50% overhang", () => {
    expect(clampCamera({ x: 99999, y: -99999 }, size)).toEqual({ x: 1440, y: -270 });
  });
});

describe("sweepCamera", () => {
  const size = { width: 960, height: 540 };
  it("starts at the right edge of its range", () => {
    const c = sweepCamera(0, size);
    expect(c.x).toBeCloseTo(size.width / 2);
    expect(c.y).toBeCloseTo(size.height / 2);
  });
  it("stays inside the stage", () => {
    for (let t = 0; t < 30; t += 0.37) {
      const c = sweepCamera(t, size);
      expect(c.x).toBeGreaterThan(0);
      expect(c.x).toBeLessThan(size.width);
      expect(c.y).toBeGreaterThan(0);
      expect(c.y).toBeLessThan(size.height);
    }
  });
});
