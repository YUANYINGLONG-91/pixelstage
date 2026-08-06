import { del, get, keys, set } from "idb-keyval";
import { migrateScene } from "./scene";
import type { SceneFile } from "./types";

/**
 * Two-tier persistence (PRD §3-F5):
 *   params (layer order / depths / offsets / camera / effects) → localStorage
 *   image payloads (dataURLs)                                 → IndexedDB (5MB localStorage cap dodge)
 *
 * Schema v2 (HD-2D). A legacy v1 save (`pixelstage.project.v1`) is migrated
 * transparently on first load and re-saved under the v2 key.
 */

export const PROJECT_KEY = "pixelstage.project.v2";
const LEGACY_PROJECT_KEY = "pixelstage.project.v1";
const IMG_PREFIX = "pixelstage.img:";

interface StoredLayer {
  id: string;
  /** `idb:<layerId>` for dataURL images, or an asset path for bundled art */
  src: string;
  [k: string]: unknown;
}

interface StoredProject {
  version?: number;
  name?: string;
  /** v2 shape */
  canvas?: { width: number; height: number };
  /** legacy v1 shape */
  canvasSize?: { width: number; height: number };
  camera?: unknown;
  effects?: unknown;
  layers: StoredLayer[];
  savedAt?: string;
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
    version: scene.version,
    name: scene.name,
    canvas: scene.canvas,
    camera: scene.camera,
    effects: scene.effects,
    layers,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(PROJECT_KEY, JSON.stringify(project));
}

/** Returns null when no local save exists. Layers with missing images keep src="" (magenta placeholder). */
export async function loadProject(): Promise<SceneFile | null> {
  let raw = localStorage.getItem(PROJECT_KEY);
  let legacy = false;
  if (!raw) {
    raw = localStorage.getItem(LEGACY_PROJECT_KEY);
    legacy = raw !== null;
  }
  if (!raw) return null;

  const project = JSON.parse(raw) as StoredProject;
  const layers = await Promise.all(
    project.layers.map(async (l) => {
      if (typeof l.src === "string" && l.src.startsWith("idb:")) {
        const id = l.src.slice(4);
        const dataUrl = await get<string>(IMG_PREFIX + id);
        return { ...l, src: dataUrl ?? "" };
      }
      return { ...l };
    })
  );

  // migrateScene handles both v1 ({x,y} camera, factorX/Y layers) and v2 input
  const migrated = migrateScene({
    ...project,
    version: project.version ?? 1,
    canvas: project.canvas ?? project.canvasSize,
    layers,
  });

  if (legacy) {
    // one-time upgrade: re-save as v2, drop the v1 key
    localStorage.removeItem(LEGACY_PROJECT_KEY);
    await saveProject(migrated);
  }
  return migrated;
}

export function hasLocalProject(): boolean {
  return (
    localStorage.getItem(PROJECT_KEY) !== null ||
    localStorage.getItem(LEGACY_PROJECT_KEY) !== null
  );
}
