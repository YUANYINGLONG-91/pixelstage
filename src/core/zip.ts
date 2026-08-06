import { zipSync, strToU8 } from "fflate";
import type { SceneFile } from "./types";

/**
 * Honest export: when assets are NOT embedded, produce a real zip containing
 * scene.json (srcs rewritten to assets/<slug>.png) plus every layer image.
 * No more "rewritten filenames with no files" (v1 bug).
 */

function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^\w\- ]+/g, "")
      .trim()
      .replace(/\s+/g, "-") || "scene"
  );
}

/** dataURL → raw bytes. Non-dataURL srcs (external paths) are skipped. */
function dataUrlToBytes(src: string): Uint8Array | null {
  const m = /^data:image\/(png|jpe?g);base64,(.+)$/.exec(src);
  if (!m) return null;
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export interface SceneZipResult {
  blob: Blob;
  /** layer indexes whose src was not an embedded dataURL (not included) */
  skipped: number[];
}

export function buildSceneZip(scene: SceneFile): SceneZipResult {
  const files: Record<string, Uint8Array> = {};
  const skipped: number[] = [];
  const usedNames = new Set<string>();

  const layers = scene.layers.map((l, i) => {
    const bytes = dataUrlToBytes(l.src);
    if (!bytes) {
      skipped.push(i);
      return { ...l };
    }
    let base = slug(l.name) || `layer-${i + 1}`;
    let filename = `${base}.png`;
    let n = 2;
    while (usedNames.has(filename)) filename = `${base}-${n++}.png`;
    usedNames.add(filename);
    files[`assets/${filename}`] = bytes;
    return { ...l, src: `assets/${filename}` };
  });

  const out: SceneFile = { ...scene, layers };
  files["scene.json"] = strToU8(JSON.stringify(out, null, 2));

  const zipped = zipSync(files, { level: 6 });
  // copy into a fresh ArrayBuffer to satisfy BlobPart typing
  const buf = new ArrayBuffer(zipped.byteLength);
  new Uint8Array(buf).set(zipped);
  return { blob: new Blob([buf], { type: "application/zip" }), skipped };
}
