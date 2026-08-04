/** Core data model — engine-agnostic, mirrors scene.json schema v1 (PRD §4.3). */

export interface Layer {
  id: string;
  name: string;
  /** dataURL or asset path */
  src: string;
  factorX: number;
  factorY: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  visible: boolean;
}

export interface Camera {
  x: number;
  y: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface SceneFile {
  version: 1;
  name: string;
  canvas: CanvasSize;
  camera: Camera;
  /** index 0 = farthest (drawn first, back-to-front) */
  layers: Layer[];
}

export const SCENE_VERSION = 1 as const;

export function createLayer(partial: Partial<Layer> & { name: string; src: string }): Layer {
  return {
    id: partial.id ?? crypto.randomUUID(),
    factorX: 0.5,
    factorY: 0.2,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    visible: true,
    ...partial,
  };
}
