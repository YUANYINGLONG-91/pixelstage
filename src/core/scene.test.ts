import { describe, expect, it } from "vitest";
import { migrateScene, serializeScene } from "./scene";
import { createLayer } from "./types";

const layers = [
  createLayer({ name: "sky", src: "sky.png", factorX: 0.05, factorY: 0.02 }),
  createLayer({ name: "front", src: "front.png", factorX: 0.8, factorY: 0.2, visible: false }),
];

describe("serializeScene", () => {
  it("produces schema v1 with rounded camera", () => {
    const s = serializeScene("Demo", { width: 960, height: 540 }, { x: 320.4, y: 179.6 }, layers);
    expect(s.version).toBe(1);
    expect(s.camera).toEqual({ x: 320, y: 180 });
    expect(s.layers).toHaveLength(2);
    expect(s.layers[0].factorX).toBe(0.05);
  });
});

describe("migrateScene", () => {
  it("round-trips a serialized scene losslessly", () => {
    const s = serializeScene("Demo", { width: 960, height: 540 }, { x: 10, y: 20 }, layers);
    const m = migrateScene(JSON.parse(JSON.stringify(s)));
    expect(m).toEqual(s);
  });

  it("fills defaults for missing fields", () => {
    const m = migrateScene({ layers: [{ src: "a.png" }] });
    expect(m.canvas).toEqual({ width: 960, height: 540 });
    expect(m.layers[0].factorX).toBe(0.5);
    expect(m.layers[0].scale).toBe(1);
    expect(m.layers[0].visible).toBe(true);
  });

  it("rejects junk", () => {
    expect(() => migrateScene(null)).toThrow();
    expect(() => migrateScene({})).toThrow();
    expect(() => migrateScene({ layers: [{ name: "no src" }] })).toThrow();
  });
});
