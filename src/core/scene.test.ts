import { describe, expect, it } from "vitest";
import { migrateScene, serializeScene } from "./scene";
import {
  createLayer,
  defaultCamera,
  defaultEffects,
  depthFromFactor,
  focalDistance,
} from "./types";

const canvas = { width: 960, height: 540 };
const D = focalDistance(canvas, 40);

describe("migrateScene — v1 → v2", () => {
  const v1 = {
    version: 1,
    name: "Legacy Valley",
    canvas,
    camera: { x: 500, y: 300 },
    layers: [
      { name: "sky", src: "sky.png", factorX: 0.05, factorY: 0.02 },
      { name: "front", src: "front.png", factorX: 0.8, factorY: 0.2, visible: false },
    ],
  };

  it("maps factorX to depth via depthFromFactor, drops factorY", () => {
    const m = migrateScene(v1);
    expect(m.version).toBe(2);
    expect(m.layers[0].depth).toBeCloseTo(depthFromFactor(0.05, D), 6);
    expect(m.layers[1].depth).toBeCloseTo(depthFromFactor(0.8, D), 6);
    expect("factorX" in m.layers[0]).toBe(false);
  });

  it("defaults orientation/lit and preserves visibility", () => {
    const m = migrateScene(v1);
    expect(m.layers[0].orientation).toBe("vertical");
    expect(m.layers[0].lit).toBe(true);
    expect(m.layers[1].visible).toBe(false);
  });

  it("translates the default 3D camera by the v1 pan", () => {
    const m = migrateScene(v1);
    const base = defaultCamera(canvas);
    const dx = 500 - canvas.width / 2;
    const dy = 300 - canvas.height / 2;
    expect(m.camera.position).toEqual({
      x: base.position.x + dx,
      y: base.position.y + dy,
      z: base.position.z,
    });
    expect(m.camera.target).toEqual({
      x: base.target.x + dx,
      y: base.target.y + dy,
      z: base.target.z,
    });
    expect(m.camera.fov).toBe(base.fov);
  });

  it("fills in default effects", () => {
    const m = migrateScene(v1);
    expect(m.effects).toEqual(defaultEffects());
  });
});

describe("v2 round-trip", () => {
  it("serialize → migrate is the identity", () => {
    const layers = [
      createLayer({ name: "sky", src: "sky.png", depth: 700, lit: false }),
      createLayer({
        name: "floor",
        src: "floor.png",
        depth: -60,
        orientation: "ground",
        visible: false,
      }),
    ];
    const s = serializeScene("Demo", canvas, defaultCamera(canvas, 55), defaultEffects(), layers);
    const m = migrateScene(JSON.parse(JSON.stringify(s)));
    expect(m).toEqual(s);
  });

  it("fills defaults for missing v2 fields", () => {
    const m = migrateScene({ version: 2, layers: [{ src: "a.png" }] });
    expect(m.canvas).toEqual({ width: 960, height: 540 });
    expect(m.camera).toEqual(defaultCamera(m.canvas));
    expect(m.layers[0].depth).toBe(0);
    expect(m.layers[0].scale).toBe(1);
    expect(m.layers[0].orientation).toBe("vertical");
    expect(m.layers[0].lit).toBe(true);
    expect(m.layers[0].visible).toBe(true);
  });
});

describe("junk rejection", () => {
  it("throws on non-scenes", () => {
    expect(() => migrateScene(null)).toThrow();
    expect(() => migrateScene({})).toThrow();
    expect(() => migrateScene({ layers: [{ name: "no src" }] })).toThrow();
    expect(() => migrateScene({ layers: "nope" })).toThrow();
  });
});
