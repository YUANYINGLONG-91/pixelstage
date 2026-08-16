import type { SceneFile } from "./types";
import { collectAssets, baseFiles, zipFiles } from "./exporters/common";

export interface SceneZipResult {
  blob: Blob;
  /** layer indexes whose src was not an embedded dataURL (not included) */
  skipped: number[];
}

/**
 * Honest export: when assets are NOT embedded, produce a real zip containing
 * scene.json (srcs rewritten to assets/<slug>.png) plus every layer image.
 * No more "rewritten filenames with no files" (v1 bug).
 */
export function buildSceneZip(scene: SceneFile): SceneZipResult {
  const pack = collectAssets(scene);
  return { blob: zipFiles(baseFiles(pack)), skipped: pack.skipped };
}
