import { SCENE_VERSION, type Layer, type SceneFile } from "./types";

/** Serialize editor state → scene.json (PRD §4.3). Pure & testable. */
export function serializeScene(
  name: string,
  canvas: { width: number; height: number },
  camera: { x: number; y: number },
  layers: Layer[]
): SceneFile {
  return {
    version: SCENE_VERSION,
    name,
    canvas: { ...canvas },
    camera: { x: Math.round(camera.x), y: Math.round(camera.y) },
    layers: layers.map((l) => ({ ...l })),
  };
}

/** Parse unknown JSON into a valid SceneFile, filling defaults. Throws on junk. */
export function migrateScene(raw: unknown): SceneFile {
  if (typeof raw !== "object" || raw === null) throw new Error("Not a scene file");
  const s = raw as Partial<SceneFile>;
  if (!Array.isArray(s.layers)) throw new Error("Scene has no layers array");
  const canvas = s.canvas ?? { width: 960, height: 540 };
  const camera = s.camera ?? { x: 0, y: 0 };
  const layers: Layer[] = s.layers.map((l, i) => {
    if (typeof l !== "object" || l === null || typeof (l as Layer).src !== "string") {
      throw new Error(`Layer ${i} is missing a src`);
    }
    const layer = l as Partial<Layer>;
    return {
      id: layer.id ?? crypto.randomUUID(),
      name: layer.name ?? `layer-${i + 1}`,
      src: layer.src!,
      factorX: num(layer.factorX, 0.5),
      factorY: num(layer.factorY, 0.2),
      scale: num(layer.scale, 1),
      offsetX: num(layer.offsetX, 0),
      offsetY: num(layer.offsetY, 0),
      visible: layer.visible !== false,
    };
  });
  return {
    version: SCENE_VERSION,
    name: s.name ?? "untitled-scene",
    canvas: { width: num(canvas.width, 960), height: num(canvas.height, 540) },
    camera: { x: num(camera.x, 0), y: num(camera.y, 0) },
    layers,
  };
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** The ~20-line runtime snippet shown in the export modal & docs (PRD §4.4). */
export const RUNTIME_SNIPPET = `// runtime.js — render a PixelStage scene with plain Canvas 2D
export async function loadScene(url, canvas) {
  const scene = await (await fetch(url)).json();
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;              // crisp pixels, always
  canvas.width = scene.canvas.width;
  canvas.height = scene.canvas.height;

  const layers = await Promise.all(scene.layers.map(async (l) => {
    const img = new Image();
    img.src = l.src;                              // file or embedded dataURL
    await img.decode();
    return { ...l, img };
  }));

  const camera = { x: 0, y: 0 };                  // drive this from your game
  return function render() {
    for (const l of layers) {                     // back → front
      if (!l.visible) continue;
      const x = l.offsetX - camera.x * l.factorX; // the one multiply
      const y = l.offsetY - camera.y * l.factorY;
      ctx.drawImage(l.img, x, y, l.img.width * l.scale, l.img.height * l.scale);
    }
  };
}`;
