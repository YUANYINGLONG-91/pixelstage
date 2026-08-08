# PixelStage

**HD-2D pixel parallax scene editor — a real desktop app, a real 3D camera.**

An open-source tool for indie pixel-game developers: import layered art, place each layer at a true depth in 3D space (billboards **and** Octopath-style ground planes), light the scene, add depth-of-field and fog, preview with a real perspective camera — then export one portable `scene.json` + a three.js runtime that reproduces it exactly.

v2 is a ground-up rebuild of the engine: the v1 "one multiply" 2D parallax is gone. Layers now live in a perspective 3D scene (three.js/WebGL), so parallax, occlusion and foreshortening are *real*, not faked per-axis.

## Quick start

```bash
npm install
npm run dev          # web version → http://localhost:5173/editor
npm run test         # vitest unit tests (scene migration, camera paths)
npm run build        # type-check + production build
```

### Desktop app (Windows)

```bash
npm run electron:dev   # build + launch the Electron app
npm run dist           # → dist-electron/PixelStage-Setup-2.0.0.exe (NSIS installer)
                       # → dist-electron/PixelStage-portable.exe    (no-install exe)
```

> First `npm install` may fail to download the Electron binary on some networks.
> Fix: `ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" node node_modules/electron/install.js`
> If `npm run dist` stalls downloading build tools, set both mirrors first:
> `ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/" npm run dist`

The desktop app is fully sandboxed (no Node in the renderer) with native Save/Open dialogs, a real project-file workflow (`.pixelstage.json`, Ctrl+S / Ctrl+Shift+S / Ctrl+O), recent files, and file association — double-clicking a scene file opens it in PixelStage. The web version keeps working with browser download/upload fallbacks via `src/core/platform.ts`.

## The core loop

```
import layers → place them in depth (billboard or ground plane) → light + DOF + fog
→ orbit the perspective camera → export scene.json + runtime.html (three.js)
```

## The depth model (scene.json v2)

Each layer is a textured plane in a 3D scene:

| field | meaning |
|---|---|
| `depth` | z position in px. `0` = focal plane (1:1 pixels) · `>0` farther · `<0` nearer than the focal plane |
| `orientation` | `vertical` = billboard facing the camera · `ground` = floor plane receding to the horizon |
| `lit` | `true` = shaded by scene lights · `false` = full-bright (sky, glow overlays) |
| `scale`, `offsetX/Y` | size and world position (px) |

Parallax is perspective: a layer at `depth` shifts/scales by `D / (D + depth)`, where `D` = camera distance (`focalDistance(canvas, fov)` ≈ 742px at 960×540/40°).

| depth | reads as | typical use |
|---|---|---|
| −400…−100 | in front of the focal plane | foreground occluders, grass fringe (blurs with DOF) |
| 0 | focal plane | the ground the player walks on, hero props |
| +100…+300 | midground | trees, facades, pillars |
| +400…+800 | far | mountains, skyline, sky (scale up to compensate) |

v1 files (`factorX/factorY`) migrate automatically on open: `depth = D·(1 − factorX)`.

## Editor

- **Camera**: drag = pan · wheel = dolly zoom (40%–400%) · right-drag / Alt-drag = orbit · `R` = reframe · space = play camera path (sweep / orbit / dolly)
- **Effects**: depth-of-field (focus + aperture), fog, ambient + directional sun — per scene, in the inspector when nothing is selected
- **Undo/redo**: full history (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y), slider drags coalesce into one step
- **Export**: `scene.json` (embedded base64) **or** a zip with `scene.json` + `assets/*.png` — the files are really in there
- **Autosave**: localStorage + IndexedDB, v1 saves migrate silently

## Tech decisions

| Choice | Why | Why not the alternative |
|---|---|---|
| React 19 + TS + Vite | Mainstream stack, component model fits panel tools | — |
| **three.js (plain, no R3F)** | Real perspective camera/lights/DOF; the render loop stays imperative and matches the exported runtime | Canvas 2D can't do perspective; r3f adds weight for zero gain here |
| Electron (sandboxed + preload IPC) | Real desktop app: native dialogs, project files, installer | The old bat+Chrome `--app` wrapper was a browser in a trench coat |
| Zustand + snapshot history | Editor = single-document state tree; snapshots make undo/redo ~40 lines | Command pattern would touch every action |
| localStorage + IndexedDB | Local-first, zero backend | A backend is a liability |

Engine core (`src/core/`): `stage3d.ts` (three.js scene), `textures.ts` (NearestFilter texture cache), `cameraPaths.ts` (pure, tested), `scene.ts` (v1↔v2 migration + runtime snippet), `types.ts` (schema v2). No React dependencies, vitest-covered.

## Project layout

```
src/
  core/          engine + pure functions — stage3d, camera paths, scene (de)serialization, zip export, platform seam
  store/         zustand stores (scene document + undo history, project file, toasts)
  components/    StageCanvas3D (shared render loop), editor panels, ui/ primitives
  pages/         / /editor /guide /gallery
electron/        main process (IPC, dialogs, recent files) + preload bridge
```

## Assets

Demo scenes use **programmatically generated placeholder layers** (seeded, deterministic — see `src/core/placeholder.ts`): each theme is a true 2.5D set with a ground plane, staggered billboards and per-theme lighting. Drop real pixel art in and tune depths — the schema doesn't change.

## License

MIT — use the tool, the JSON, and the runtime snippet in any game, commercial or not.
