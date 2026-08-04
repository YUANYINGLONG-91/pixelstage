import { del, get, keys, set } from "idb-keyval";
import type { Layer, SceneFile } from "./types";

/**
 * Two-tier persistence (PRD §3-F5):
 *   params (layer order / factors / offsets / camera) → localStorage
 *   image payloads (dataURLs)                        → IndexedDB (5MB localStorage cap dodge)
 */

export const PROJECT_KEY = "pixelstage.project.v1";
const IMG_PREFIX = "pixelstage.img:";

interface StoredLayer extends Omit<Layer, "src"> {
  /** `idb:<layerId>` for dataURL images, or an asset path for bundled art */
  src: string;
}

interface StoredProject {
  name: string;
  canvasSize: { width: number; height: number };
  camera: { x: number; y: number };
  layers: StoredLayer[];
  savedAt: string;
}

export async function saveProject(scene: SceneFile): Promise<void> {
  const imageIds: string[] = [];
  const layers: StoredLayer[] = scene.layers.map((l) => {
    if (l.src.startsWith("data:")) {
      imageIds.push(l.id);
      return { ...l, src: `idb:${l.id}` };
    }
    return { ...l };
  });

  // images → IndexedDB
  for (const l of scene.layers) {
    if (l.src.startsWith("data:")) await set(IMG_PREFIX + l.id, l.src);
  }
  // garbage-collect images of deleted layers
  for (const k of await keys()) {
    if (typeof k === "string" && k.startsWith(IMG_PREFIX)) {
      const id = k.slice(IMG_PREFIX.length);
      if (!imageIds.includes(id)) await del(k);
    }
  }

  // params → localStorage
  const project: StoredProject = {
    name: scene.name,
    canvasSize: scene.canvas,
    camera: scene.camera,
    layers,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(PROJECT_KEY, JSON.stringify(project));
}

/** Returns null when no local save exists. Layers with missing images keep src="" (magenta placeholder). */
export async function loadProject(): Promise<SceneFile | null> {
  const raw = localStorage.getItem(PROJECT_KEY);
  if (!raw) return null;
  const project = JSON.parse(raw) as StoredProject;
  const layers: Layer[] = await Promise.all(
    project.layers.map(async (l) => {
      if (l.src.startsWith("idb:")) {
        const id = l.src.slice(4);
        const dataUrl = await get<string>(IMG_PREFIX + id);
        return { ...l, src: dataUrl ?? "" };
      }
      return { ...l };
    })
  );
  return {
    version: 1,
    name: project.name,
    canvas: project.canvasSize,
    camera: project.camera,
    layers,
  };
}

export function hasLocalProject(): boolean {
  return localStorage.getItem(PROJECT_KEY) !== null;
}
