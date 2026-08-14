/**
 * Bitmap cache (PRD §4.2): decode each layer image ONCE at import time
 * via createImageBitmap; the render loop never decodes.
 */

interface Entry {
  src: string;
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

const cache = new Map<string, Entry>();
const pending = new Map<string, Promise<Entry | null>>();

export async function getBitmap(layerId: string, src: string): Promise<Entry | null> {
  const hit = cache.get(layerId);
  if (hit && hit.src === src) return hit;

  const pendKey = `${layerId}`;
  const p = pending.get(pendKey);
  if (p) {
    const e = await p;
    if (e && e.src === src) return e;
  }

  const job = (async (): Promise<Entry | null> => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      // bake the y-flip into the bitmap: WebGL ignores UNPACK_FLIP_Y for
      // ImageBitmap uploads, so flipY on the texture alone has no effect
      const bitmap = await createImageBitmap(blob, { imageOrientation: "flipY" });
      const entry: Entry = { src, bitmap, width: bitmap.width, height: bitmap.height };
      const prev = cache.get(layerId);
      if (prev && prev.src !== src) prev.bitmap.close();
      cache.set(layerId, entry);
      return entry;
    } catch {
      return null; // broken image — caller renders a missing-asset placeholder
    } finally {
      pending.delete(pendKey);
    }
  })();
  pending.set(pendKey, job);
  return job;
}

export function peekBitmap(layerId: string, src: string): Entry | null {
  const hit = cache.get(layerId);
  return hit && hit.src === src ? hit : null;
}

/* --------------------- alpha masks (viewport picking) --------------------- */

interface MaskEntry {
  src: string;
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

const masks = new Map<string, MaskEntry>();

/**
 * Per-pixel alpha lookup for viewport picking. Lazily rasterizes the cached
 * bitmap once and keeps the RGBA buffer. uv space matches the baked flipY
 * bitmap rows (v=0 → row 0), which is exactly what the shader samples with
 * texture.flipY=false. Returns null when the bitmap isn't decoded yet —
 * callers treat that as opaque (the mesh is a wireframe placeholder anyway).
 */
export function getAlphaAt(layerId: string, src: string, u: number, v: number): number | null {
  let m = masks.get(layerId);
  if (m && m.src !== src) {
    masks.delete(layerId);
    m = undefined;
  }
  if (!m) {
    const bmp = peekBitmap(layerId, src);
    if (!bmp) return null;
    const c = document.createElement("canvas");
    c.width = bmp.width;
    c.height = bmp.height;
    const g = c.getContext("2d", { willReadFrequently: true });
    if (!g) return null;
    g.drawImage(bmp.bitmap, 0, 0);
    m = {
      src,
      data: g.getImageData(0, 0, bmp.width, bmp.height).data,
      width: bmp.width,
      height: bmp.height,
    };
    masks.set(layerId, m);
  }
  const x = Math.min(m.width - 1, Math.max(0, Math.floor(u * m.width)));
  const y = Math.min(m.height - 1, Math.max(0, Math.floor(v * m.height)));
  return m.data[(y * m.width + x) * 4 + 3];
}

export function evictBitmap(layerId: string) {
  const hit = cache.get(layerId);
  if (hit) {
    hit.bitmap.close();
    cache.delete(layerId);
  }
  masks.delete(layerId);
}

export function clearBitmaps() {
  for (const e of cache.values()) e.bitmap.close();
  cache.clear();
  masks.clear();
}
