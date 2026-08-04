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
      const bitmap = await createImageBitmap(blob);
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

export function evictBitmap(layerId: string) {
  const hit = cache.get(layerId);
  if (hit) {
    hit.bitmap.close();
    cache.delete(layerId);
  }
}

export function clearBitmaps() {
  for (const e of cache.values()) e.bitmap.close();
  cache.clear();
}
