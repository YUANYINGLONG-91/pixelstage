import { create } from "zustand";
import { createPlaceholderScene, type PlaceholderTheme } from "@/core/placeholder";
import { migrateScene, serializeScene } from "@/core/scene";
import {
  createLayer,
  defaultCamera,
  defaultEffects,
  type Camera3D,
  type CanvasSize,
  type Layer,
  type RenderEffects,
  type SceneFile,
} from "@/core/types";
import type { PathPreset } from "@/core/cameraPaths";
import { clearBitmaps, evictBitmap, getBitmap } from "@/core/bitmaps";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_DIM = 4096;
const ACCEPTED_TYPES = ["image/png", "image/jpeg"];
const HISTORY_CAP = 100;
/** same coalesce key within this window merges into one history entry */
const COALESCE_MS = 800;

/** each effects group can be patched independently */
export type EffectsPatch = {
  [K in keyof RenderEffects]?: Partial<RenderEffects[K]>;
};

export interface ImportResult {
  added: number;
  rejected: number;
}

interface Snapshot {
  name: string;
  canvasSize: CanvasSize;
  camera: Camera3D;
  effects: RenderEffects;
  layers: Layer[];
  selectedId: string | null;
}

interface HistoryEntry {
  snap: Snapshot;
  label: string;
  coalesceKey?: string;
  at: number;
}

/** Editor = a single-document state tree with snapshot undo/redo. */
interface SceneState {
  name: string;
  canvasSize: CanvasSize;
  camera: Camera3D;
  effects: RenderEffects;
  /** index 0 = farthest (drawn first); the panel displays this reversed */
  layers: Layer[];
  selectedId: string | null;
  playing: boolean;
  pathPreset: PathPreset;
  /** current project file path (Electron); null = never saved to disk */
  filePath: string | null;
  /** unsaved-changes indicator */
  dirty: boolean;

  past: HistoryEntry[];
  future: HistoryEntry[];
  undo: () => void;
  redo: () => void;

  setName: (name: string) => void;
  setCanvasSize: (size: CanvasSize) => void;
  setCamera: (cam: Camera3D, opts?: { transient?: boolean }) => void;
  resetCamera: () => void;
  setEffects: (patch: EffectsPatch, opts?: { coalesceKey?: string }) => void;
  setPathPreset: (p: PathPreset) => void;
  selectLayer: (id: string | null) => void;
  setPlaying: (v: boolean) => void;
  togglePlaying: () => void;
  markSaved: (path: string | null) => void;

  addFiles: (files: File[]) => Promise<ImportResult>;
  addLayer: (layer: Layer) => void;
  insertLayer: (layer: Layer, index: number) => void;
  removeLayer: (id: string) => { layer: Layer; index: number } | null;
  reorderLayer: (id: string, to: number) => void;
  updateLayer: (id: string, patch: Partial<Layer>, opts?: { coalesceKey?: string }) => void;
  duplicateLayer: (id: string) => void;

  loadDemo: (theme?: PlaceholderTheme) => void;
  resetScene: () => void;
  toJSON: () => SceneFile;
  loadJSON: (raw: unknown) => void;
}

function takeSnapshot(s: SceneState): Snapshot {
  return {
    name: s.name,
    canvasSize: s.canvasSize,
    camera: s.camera,
    effects: s.effects,
    layers: s.layers,
    selectedId: s.selectedId,
  };
}

/**
 * Texture eviction is fire-and-forget via dynamic import: textures.ts pulls in
 * three.js, and the store must stay in the main bundle without dragging the
 * engine along (three loads lazily with the first mounted canvas).
 */
function evictTextureLate(id: string) {
  void import("@/core/textures").then((m) => m.evictTexture(id));
}
function clearTexturesLate() {
  void import("@/core/textures").then((m) => m.clearTextures());
}

export const useSceneStore = create<SceneState>((set, get) => {
  /** push the pre-mutation snapshot onto the undo stack (with slider coalescing) */
  const pushHistory = (label: string, coalesceKey?: string) => {
    const s = get();
    const now = Date.now();
    const top = s.past[s.past.length - 1];
    if (coalesceKey && top?.coalesceKey === coalesceKey && now - top.at < COALESCE_MS) {
      // same drag still in progress — keep the original pre-drag snapshot
      set({
        past: [...s.past.slice(0, -1), { ...top, at: now }],
        future: [],
        dirty: true,
      });
      return;
    }
    const entry: HistoryEntry = { snap: takeSnapshot(s), label, coalesceKey, at: now };
    set({ past: [...s.past.slice(-(HISTORY_CAP - 1)), entry], future: [], dirty: true });
  };

  return {
    name: "untitled-scene",
    canvasSize: { width: 960, height: 540 },
    camera: defaultCamera({ width: 960, height: 540 }),
    effects: defaultEffects(),
    layers: [],
    selectedId: null,
    playing: false,
    pathPreset: "sweep",
    filePath: null,
    dirty: false,
    past: [],
    future: [],

    undo: () => {
      const s = get();
      const entry = s.past[s.past.length - 1];
      if (!entry) return;
      const current: HistoryEntry = { snap: takeSnapshot(s), label: entry.label, at: Date.now() };
      set({
        ...entry.snap,
        past: s.past.slice(0, -1),
        future: [...s.future, current],
        dirty: true,
      });
    },

    redo: () => {
      const s = get();
      const entry = s.future[s.future.length - 1];
      if (!entry) return;
      const current: HistoryEntry = { snap: takeSnapshot(s), label: entry.label, at: Date.now() };
      set({
        ...entry.snap,
        past: [...s.past, current],
        future: s.future.slice(0, -1),
        dirty: true,
      });
    },

    setName: (name) => {
      pushHistory("rename");
      set({ name: name.trim() || "untitled-scene" });
    },

    setCanvasSize: (size) => {
      pushHistory("canvas-size");
      set((s) => ({ canvasSize: size, camera: defaultCamera(size, s.camera.fov) }));
    },

    setCamera: (cam, opts) => {
      if (!opts?.transient) pushHistory("camera", "camera:drag");
      set({ camera: cam });
    },

    resetCamera: () => {
      pushHistory("camera");
      set((s) => ({ camera: defaultCamera(s.canvasSize, s.camera.fov) }));
    },

    setEffects: (patch, opts) => {
      pushHistory("effects", opts?.coalesceKey);
      set((s) => ({
        effects: {
          dof: { ...s.effects.dof, ...patch.dof },
          fog: { ...s.effects.fog, ...patch.fog },
          ambient: { ...s.effects.ambient, ...patch.ambient },
          sun: { ...s.effects.sun, ...patch.sun },
          bloom: { ...s.effects.bloom, ...patch.bloom },
          grade: { ...s.effects.grade, ...patch.grade },
          particles: { ...s.effects.particles, ...patch.particles },
        },
      }));
    },

    setPathPreset: (p) => set({ pathPreset: p }),

    selectLayer: (id) => set({ selectedId: id }),

    setPlaying: (v) => set({ playing: v }),
    togglePlaying: () => set((s) => ({ playing: !s.playing })),

    markSaved: (path) => set({ dirty: false, filePath: path }),

    addFiles: async (files) => {
      let added = 0;
      let rejected = 0;
      for (const file of files) {
        if (!ACCEPTED_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES) {
          rejected++;
          continue;
        }
        const src = await readAsDataURL(file);
        // dimension guard: decode once (also warms the bitmap cache)
        const id = crypto.randomUUID();
        const entry = await getBitmap(id, src);
        if (!entry || entry.width > MAX_IMAGE_DIM || entry.height > MAX_IMAGE_DIM) {
          evictBitmap(id);
          rejected++;
          continue;
        }
        const layer = createLayer({
          id,
          name: file.name.replace(/\.(png|jpe?g)$/i, ""),
          src,
        });
        get().addLayer(layer);
        added++;
      }
      return { added, rejected };
    },

    addLayer: (layer) => {
      pushHistory("add-layer");
      set((s) => ({ layers: [...s.layers, layer], selectedId: layer.id }));
    },

    insertLayer: (layer, index) => {
      pushHistory("insert-layer");
      set((s) => {
        const layers = [...s.layers];
        layers.splice(Math.max(0, Math.min(index, layers.length)), 0, layer);
        return { layers };
      });
    },

    removeLayer: (id) => {
      const s = get();
      const index = s.layers.findIndex((l) => l.id === id);
      if (index === -1) return null;
      const removed = s.layers[index];
      pushHistory("remove-layer");
      evictBitmap(id);
      evictTextureLate(id);
      set({
        layers: s.layers.filter((l) => l.id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
      });
      return { layer: removed, index };
    },

    reorderLayer: (id, to) => {
      pushHistory("reorder-layer");
      set((s) => {
        const from = s.layers.findIndex((l) => l.id === id);
        if (from === -1) return s;
        const layers = [...s.layers];
        const [moved] = layers.splice(from, 1);
        layers.splice(Math.max(0, Math.min(to, layers.length)), 0, moved);
        return { layers };
      });
    },

    updateLayer: (id, patch, opts) => {
      pushHistory("update-layer", opts?.coalesceKey);
      set((s) => ({
        layers: s.layers.map((l) => (l.id === id ? { ...l, ...patch, id: l.id } : l)),
      }));
    },

    duplicateLayer: (id) => {
      pushHistory("duplicate-layer");
      set((s) => {
        const index = s.layers.findIndex((l) => l.id === id);
        if (index === -1) return s;
        const src = s.layers[index];
        const copy: Layer = { ...src, id: crypto.randomUUID(), name: `${src.name} copy` };
        const layers = [...s.layers];
        layers.splice(index + 1, 0, copy);
        return { layers, selectedId: copy.id };
      });
    },

    loadDemo: (theme = "village") => {
      pushHistory("load-demo");
      clearBitmaps();
      clearTexturesLate();
      const scene = createPlaceholderScene(theme);
      set({
        name: scene.name,
        canvasSize: scene.canvas,
        camera: scene.camera,
        effects: scene.effects,
        layers: scene.layers,
        selectedId: null,
        filePath: null,
      });
    },

    resetScene: () => {
      pushHistory("reset-scene");
      clearBitmaps();
      clearTexturesLate();
      set({
        name: "untitled-scene",
        canvasSize: { width: 960, height: 540 },
        camera: defaultCamera({ width: 960, height: 540 }),
        effects: defaultEffects(),
        layers: [],
        selectedId: null,
        playing: false,
        filePath: null,
      });
    },

    toJSON: () => {
      const s = get();
      return serializeScene(s.name, s.canvasSize, s.camera, s.effects, s.layers);
    },

    loadJSON: (raw) => {
      pushHistory("load-json");
      clearBitmaps();
      clearTexturesLate();
      const scene = migrateScene(raw);
      set({
        name: scene.name,
        canvasSize: scene.canvas,
        camera: scene.camera,
        effects: scene.effects,
        layers: scene.layers,
        selectedId: null,
      });
    },
  };
});

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
