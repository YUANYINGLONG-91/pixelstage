import { zipSync, strToU8 } from "fflate";
import type { Layer, SceneFile } from "../types";

/**
 * Shared helpers for every export path (scene.zip + engine zips):
 * extract embedded layer images, rewrite srcs to asset paths, zip it up.
 */

export function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^\w\- ]+/g, "")
      .trim()
      .replace(/\s+/g, "-") || "scene"
  );
}

/** dataURL → raw bytes. Non-dataURL srcs (external paths) are skipped. */
export function dataUrlToBytes(src: string): Uint8Array | null {
  const m = /^data:image\/(png|jpe?g);base64,(.+)$/.exec(src);
  if (!m) return null;
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** PNG IHDR → pixel size without decoding. Returns null for non-PNG. */
export function pngSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24 || bytes[0] !== 0x89 || bytes[1] !== 0x50) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: dv.getUint32(16), height: dv.getUint32(20) };
}

export interface PackedLayer {
  /** layer with src rewritten to its asset path (or original if external) */
  layer: Layer;
  /** "assets/foo.png" when packed, null when the src was external */
  path: string | null;
  /** pixel size of the packed image (null when unknown/external) */
  width: number | null;
  height: number | null;
}

export interface AssetPack {
  /** assets/*.png entries, ready to merge into a zip file map */
  files: Record<string, Uint8Array>;
  /** scene with layer srcs rewritten to asset paths */
  scene: SceneFile;
  layers: PackedLayer[];
  /** layer indexes whose src was not an embedded dataURL */
  skipped: number[];
}

/** Pull every embedded layer image out of the scene into assets/*.png. */
export function collectAssets(scene: SceneFile): AssetPack {
  const files: Record<string, Uint8Array> = {};
  const skipped: number[] = [];
  const usedNames = new Set<string>();

  const layers: PackedLayer[] = scene.layers.map((l, i) => {
    const bytes = dataUrlToBytes(l.src);
    if (!bytes) {
      skipped.push(i);
      return { layer: { ...l }, path: null, width: null, height: null };
    }
    const base = slug(l.name) || `layer-${i + 1}`;
    let filename = `${base}.png`;
    let n = 2;
    while (usedNames.has(filename)) filename = `${base}-${n++}.png`;
    usedNames.add(filename);
    files[`assets/${filename}`] = bytes;
    const size = pngSize(bytes);
    return {
      layer: { ...l, src: `assets/${filename}` },
      path: `assets/${filename}`,
      width: size?.width ?? null,
      height: size?.height ?? null,
    };
  });

  return { files, scene: { ...scene, layers: layers.map((p) => p.layer) }, layers, skipped };
}

/** scene.json + assets as a base file map that engine exporters extend. */
export function baseFiles(pack: AssetPack): Record<string, Uint8Array> {
  return {
    ...pack.files,
    "scene.json": strToU8(JSON.stringify(pack.scene, null, 2)),
  };
}

export function text(s: string): Uint8Array {
  return strToU8(s);
}

export function zipFiles(files: Record<string, Uint8Array>): Blob {
  const zipped = zipSync(files, { level: 6 });
  // copy into a fresh ArrayBuffer to satisfy BlobPart typing
  const buf = new ArrayBuffer(zipped.byteLength);
  new Uint8Array(buf).set(zipped);
  return new Blob([buf], { type: "application/zip" });
}
