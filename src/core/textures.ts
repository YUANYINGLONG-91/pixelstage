import * as THREE from "three";
import { getBitmap, peekBitmap } from "./bitmaps";

/**
 * Texture cache (PRD §4.2, HD-2D edition): one THREE.Texture per layer id,
 * built on top of the shared bitmap cache so each image is still decoded once.
 * Pixel-art filtering is non-negotiable: NearestFilter, no mipmaps.
 *
 * Textures are renderer-agnostic (three uploads per-context lazily), so one
 * cache serves every Stage3D on the page.
 */

interface Entry {
  src: string;
  texture: THREE.Texture;
  width: number;
  height: number;
}

const cache = new Map<string, Entry>();

export function getTexture(layerId: string, src: string): Entry | null {
  const hit = cache.get(layerId);
  if (hit && hit.src === src) return hit;

  const bmp = peekBitmap(layerId, src);
  if (!bmp) {
    // kick the bitmap decode; the next render frame will pick the texture up
    void getBitmap(layerId, src);
    return null;
  }

  const texture = new THREE.Texture(bmp.bitmap);
  // ImageBitmap rows are already top-down; flipY=true would hang trees from the sky
  texture.flipY = false;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const prev = cache.get(layerId);
  if (prev && prev.src !== src) prev.texture.dispose();

  const entry: Entry = { src, texture, width: bmp.width, height: bmp.height };
  cache.set(layerId, entry);
  return entry;
}

export function evictTexture(layerId: string) {
  const hit = cache.get(layerId);
  if (hit) {
    hit.texture.dispose();
    cache.delete(layerId);
  }
}

export function clearTextures() {
  for (const e of cache.values()) e.texture.dispose();
  cache.clear();
}
