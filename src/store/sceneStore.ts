import { create } from "zustand";
import { clampCamera } from "@/core/parallax";
import { createPlaceholderScene, type PlaceholderTheme } from "@/core/placeholder";
import { migrateScene, serializeScene } from "@/core/scene";
import { createLayer, type Camera, type CanvasSize, type Layer, type SceneFile } from "@/core/types";
import { clearBitmaps, evictBitmap, getBitmap } from "@/core/bitmaps";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_DIM = 4096;
const ACCEPTED_TYPES = ["image/png", "image/jpeg"];

export interface ImportResult {
  added: number;
  rejected: number;
}

/** Editor = a single-document state tree (PRD §4.5). */
interface SceneState {
  name: string;
  canvasSize: CanvasSize;
  camera: Camera;
  /** index 0 = farthest (drawn first); the panel displays this reversed */
  layers: Layer[];
  selectedId: string | null;
  playing: boolean;

  setName: (name: string) => void;
  setCanvasSize: (size: CanvasSize) => void;
  setCamera: (x: number, y: number) => void;
  resetCamera: () => void;
  selectLayer: (id: string | null) => void;
  setPlaying: (v: boolean) => void;
  togglePlaying: () => void;

  addFiles: (files: File[]) => Promise<ImportResult>;
  addLayer: (layer: Layer) => void;
  insertLayer: (layer: Layer, index: number) => void;
  removeLayer: (id: string) => { layer: Layer; index: number } | null;
  reorderLayer: (id: string, to: number) => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  duplicateLayer: (id: string) => void;

  loadDemo: (theme?: PlaceholderTheme) => void;
  resetScene: () => void;
  toJSON: () => SceneFile;
  loadJSON: (raw: unknown) => void;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  name: "untitled-scene",
  canvasSize: { width: 960, height: 540 },
  camera: { x: 480, y: 270 },
  layers: [],
  selectedId: null,
  playing: false,

  setName: (name) => set({ name: name.trim() || "untitled-scene" }),

  setCanvasSize: (size) =>
    set((s) => ({
      canvasSize: size,
      camera: clampCamera(s.camera, size),
    })),

  setCamera: (x, y) => set((s) => ({ camera: clampCamera({ x, y }, s.canvasSize) })),

  resetCamera: () => set({ camera: { x: 0, y: 0 } }),

  selectLayer: (id) => set({ selectedId: id }),

  setPlaying: (v) => set({ playing: v }),
  togglePlaying: () => set((s) => ({ playing: !s.playing })),

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

  addLayer: (layer) =>
    set((s) => ({ layers: [...s.layers, layer], selectedId: layer.id })),

  insertLayer: (layer, index) =>
    set((s) => {
      const layers = [...s.layers];
      layers.splice(Math.max(0, Math.min(index, layers.length)), 0, layer);
      return { layers };
    }),

  removeLayer: (id) => {
    const s = get();
    const index = s.layers.findIndex((l) => l.id === id);
    if (index === -1) return null;
    const removed = s.layers[index];
    evictBitmap(id);
    set({
      layers: s.layers.filter((l) => l.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    });
    return { layer: removed, index };
  },

  reorderLayer: (id, to) =>
    set((s) => {
      const from = s.layers.findIndex((l) => l.id === id);
      if (from === -1) return s;
      const layers = [...s.layers];
      const [moved] = layers.splice(from, 1);
      layers.splice(Math.max(0, Math.min(to, layers.length)), 0, moved);
      return { layers };
    }),

  updateLayer: (id, patch) =>
    set((s) => ({
      layers: s.layers.map((l) => (l.id === id ? { ...l, ...patch, id: l.id } : l)),
    })),

  duplicateLayer: (id) =>
    set((s) => {
      const index = s.layers.findIndex((l) => l.id === id);
      if (index === -1) return s;
      const src = s.layers[index];
      const copy: Layer = { ...src, id: crypto.randomUUID(), name: `${src.name} copy` };
      const layers = [...s.layers];
      layers.splice(index + 1, 0, copy);
      return { layers, selectedId: copy.id };
    }),

  loadDemo: (theme = "valley") => {
    clearBitmaps();
    const scene = createPlaceholderScene(theme);
    set({
      name: scene.name,
      canvasSize: scene.canvas,
      camera: scene.camera,
      layers: scene.layers,
      selectedId: null,
    });
  },

  resetScene: () => {
    clearBitmaps();
    set({
      name: "untitled-scene",
      canvasSize: { width: 960, height: 540 },
      camera: { x: 480, y: 270 },
      layers: [],
      selectedId: null,
      playing: false,
    });
  },

  toJSON: () => {
    const s = get();
    return serializeScene(s.name, s.canvasSize, s.camera, s.layers);
  },

  loadJSON: (raw) => {
    clearBitmaps();
    const scene = migrateScene(raw);
    set({
      name: scene.name,
      canvasSize: scene.canvas,
      camera: clampCamera(scene.camera, scene.canvas),
      layers: scene.layers,
      selectedId: null,
    });
  },
}));

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
