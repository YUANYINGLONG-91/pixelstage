# PixelStage

**2.5D pixel parallax scene editor — HD-2D for the rest of us.**

An open-source web tool for indie pixel-game developers: import layered art (sky / far / mid / foreground), tune per-layer parallax factors, preview depth with a draggable virtual camera in real time, and export one portable `scene.json` your engine renders in ~20 lines.

Octopath Traveler and Wandering Sword built their look on UE4 pipelines. 99% of indie pixel games fake the same depth with plain 2D layers — PixelStage is the professional editor for that 99% path.

## Quick start

```bash
npm install
npm run dev        # → http://localhost:5173
npm run test       # vitest unit tests for the parallax core
npm run build      # type-check + production build
```

Open `/editor`, press **Load demo scene**, drag the stage — the foreground whips past while the sky barely moves. That's the whole product.

## The core loop

```
import layers → tune per-layer factors → drag the virtual camera → export scene.json → 20-line runtime reproduces it
```

## Tech decisions

| Choice | Why | Why not the alternative |
|---|---|---|
| React 19 + TS + Vite | Mainstream stack, component model fits panel tools | Vue is fine too — React simply has more jobs |
| Tailwind v3.4 + shadcn/ui | Professional dark UI fast | Hand-written CSS is slow and ugly |
| **Hand-rolled Canvas 2D render loop** | Each layer is `drawImage + offset` — every line explainable in an interview | PixiJS/Three.js do exactly the work you want to understand |
| Zustand | An editor is a single-document state tree; Zustand fits in ~10 lines | Redux too heavy, Context too slow |
| localStorage + IndexedDB | Pure frontend, zero backend, zero accounts | A backend is a liability for a v1 tool |

## The whole engine is one multiply

```js
screenX = layer.offsetX - camera.x * layer.factorX
screenY = layer.offsetY - camera.y * layer.factorY
ctx.drawImage(layer.bitmap, screenX, screenY, w * layer.scale, h * layer.scale)
```

| factor | meaning | typical use |
|---|---|---|
| 0.00 | locked to screen | sky, HUD |
| 0.05–0.20 | far away | mountains, skyline |
| 0.30–0.50 | midground | trees, buildings |
| 0.70–0.90 | near | bushes, rails |
| 1.00 | glued to camera plane | the ground the player walks on |
| >1.00 | faster than camera | foreground occluders |

Render-loop notes: `requestAnimationFrame` driven, paused when off-screen (IntersectionObserver); `imageSmoothingEnabled = false` + `image-rendering: pixelated` (non-negotiable); DPR-aware backing store; each layer decoded once via `createImageBitmap` — the render loop never decodes.

Pure-function core (`computeScreenPos`, `serializeScene`, `migrateScene`) lives in `src/core/` with vitest coverage — no React dependencies.

## scene.json format (v1, frozen)

```json
{
  "version": 1,
  "name": "Sunset Valley",
  "canvas": { "width": 960, "height": 540 },
  "camera": { "x": 480, "y": 270 },
  "layers": [
    {
      "id": "sky", "name": "Sky", "src": "layers/valley-sky.png",
      "factorX": 0.05, "factorY": 0.05,
      "scale": 1, "offsetX": 0, "offsetY": 0,
      "visible": true
    }
  ]
}
```

- `layers[]` order = draw order, index 0 is farthest (back-to-front)
- `src` is a relative path, or a base64 dataURL when exported with "Embed images"
- factor ranges: 0.00–1.50 · scale 0.10–4.00 · offsets in integer pixels

## Minimal runtime (~20 lines)

```js
export async function loadScene(url, canvas) {
  const scene = await (await fetch(url)).json();
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  canvas.width = scene.canvas.width;
  canvas.height = scene.canvas.height;
  const layers = await Promise.all(scene.layers.map(async (l) => {
    const img = new Image();
    img.src = l.src;
    await img.decode();
    return { ...l, img };
  }));
  const camera = { x: 0, y: 0 };              // drive this from your game
  return function render() {
    for (const l of layers) {
      if (!l.visible) continue;
      const x = l.offsetX - camera.x * l.factorX;
      const y = l.offsetY - camera.y * l.factorY;
      ctx.drawImage(l.img, x, y, l.img.width * l.scale, l.img.height * l.scale);
    }
  };
}
```

Engine recipes (Phaser `setScrollFactor`, Godot `ParallaxLayer.motion_scale = 1 − factor`) are on the `/guide` page.

## Project layout

```
src/
  core/          pure functions — parallax math, scene (de)serialization, storage, placeholder art
  store/         zustand stores (scene document, toasts)
  components/    StageCanvas (shared render loop), editor panels, ui/ primitives
  pages/         / /editor /guide /gallery
```

## Assets

Demo scenes currently use **programmatically generated placeholder layers** (seeded, deterministic — see `src/core/placeholder.ts`). Drop real pixel art into `public/layers/` and swap the `src` fields — the schema doesn't change.

## License

MIT — use the tool, the JSON, and the runtime snippet in any game, commercial or not.
