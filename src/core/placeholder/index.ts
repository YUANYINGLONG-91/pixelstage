/**
 * Programmatic placeholder art (PRD §7): four Octopath-flavoured HD-2D demo
 * scenes, generated on offscreen canvases with a seeded RNG so every visitor
 * sees the same scene.
 *
 * Each scene is staged for the three.js engine: an unlit backdrop far behind
 * the focal plane, mid billboards at staggered depths, a ground-plane texture
 * receding to the horizon, chibi character sprites planted on the ground at
 * the focal plane, and a foreground frame that blurs when DOF is on.
 */

import { defaultCamera, type SceneFile } from "../types";
import { H, W } from "./stage";
import { villageCamera, villageEffects, villageLayers, villageMeta } from "./themes/village";
import { snowCamera, snowEffects, snowLayers, snowMeta } from "./themes/snow";
import { ruinsCamera, ruinsEffects, ruinsLayers, ruinsMeta } from "./themes/ruins";
import { alleyEffects, alleyLayers, alleyMeta } from "./themes/alley";

export type PlaceholderTheme = "village" | "snow" | "ruins" | "alley";

export const PLACEHOLDER_META: Record<
  PlaceholderTheme,
  { name: string; tag: string; description: string }
> = {
  village: villageMeta,
  snow: snowMeta,
  ruins: ruinsMeta,
  alley: alleyMeta,
};

const BUILDERS: Record<
  PlaceholderTheme,
  {
    layers: () => SceneFile["layers"];
    effects: () => SceneFile["effects"];
    camera: (() => { posY: number; targetY: number }) | null;
  }
> = {
  village: { layers: villageLayers, effects: villageEffects, camera: villageCamera },
  snow: { layers: snowLayers, effects: snowEffects, camera: snowCamera },
  ruins: { layers: ruinsLayers, effects: ruinsEffects, camera: ruinsCamera },
  alley: { layers: alleyLayers, effects: alleyEffects, camera: null }, // straight-on corridor
};

export function createPlaceholderScene(theme: PlaceholderTheme = "village"): SceneFile {
  const canvas = { width: W, height: H };
  const b = BUILDERS[theme];
  const camera = defaultCamera(canvas);
  const tilt = b.camera?.();
  if (tilt) {
    camera.position.y = tilt.posY;
    camera.target.y = tilt.targetY;
  }
  return {
    version: 2,
    name: PLACEHOLDER_META[theme].name,
    canvas,
    camera,
    effects: b.effects(),
    layers: b.layers(),
    bookmarks: [],
  };
}

/** Module-level cache so every preview on the site shares layer ids (and decoded bitmaps). */
const sceneCache = new Map<PlaceholderTheme, SceneFile>();

export function getCachedPlaceholderScene(theme: PlaceholderTheme): SceneFile {
  let s = sceneCache.get(theme);
  if (!s) {
    s = createPlaceholderScene(theme);
    sceneCache.set(theme, s);
  }
  return s;
}
