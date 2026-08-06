import { describe, expect, it } from "vitest";
import { cameraPath, PATH_PRESETS } from "./cameraPaths";
import { defaultCamera, depthFromFactor, focalDistance } from "./types";

const canvas = { width: 960, height: 540 };

describe("focalDistance", () => {
  it("960×540 @ 40° ≈ 741.8", () => {
    expect(focalDistance(canvas, 40)).toBeCloseTo(741.8, 1);
  });
});

describe("depthFromFactor", () => {
  it("factor 1 sits exactly on the focal plane", () => {
    expect(depthFromFactor(1, 741.6)).toBe(0);
  });

  it("is monotonically decreasing in f", () => {
    const D = 741.6;
    let prev = Infinity;
    for (let f = 0; f <= 1.5; f += 0.1) {
      const d = depthFromFactor(f, D);
      expect(d).toBeLessThan(prev);
      prev = d;
    }
  });
});

describe("defaultCamera", () => {
  it("targets the stage center at the focal distance", () => {
    const c = defaultCamera(canvas);
    expect(c.target).toEqual({ x: canvas.width / 2, y: canvas.height / 2, z: 0 });
    expect(c.position.x).toBe(canvas.width / 2);
    expect(c.position.y).toBe(canvas.height / 2);
    expect(c.position.z).toBeCloseTo(focalDistance(canvas, c.fov), 6);
  });
});

describe("cameraPath presets", () => {
  const base = defaultCamera(canvas);

  it("every preset returns finite numbers", () => {
    for (const preset of PATH_PRESETS) {
      for (const t of [0, 1.3, 5.7, 12, 100]) {
        const c = cameraPath(preset, t, base, canvas);
        const values = [
          c.position.x, c.position.y, c.position.z,
          c.target.x, c.target.y, c.target.z,
          c.fov,
        ];
        for (const v of values) expect(Number.isFinite(v)).toBe(true);
      }
    }
  });

  it("orbit keeps the target unchanged", () => {
    for (const t of [0, 2.2, 7.7, 31]) {
      const c = cameraPath("orbit", t, base, canvas);
      expect(c.target).toEqual(base.target);
    }
  });
});
