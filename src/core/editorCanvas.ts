/**
 * The editor viewport's live canvas, registered by StageCanvas3D while
 * editorMode is mounted. Used by the WebM video export (captureStream).
 * Module-level so it never enters React state / undo snapshots.
 */

let editorCanvas: HTMLCanvasElement | null = null;

export function registerEditorCanvas(canvas: HTMLCanvasElement | null) {
  editorCanvas = canvas;
}

export function getEditorCanvas(): HTMLCanvasElement | null {
  return editorCanvas;
}
