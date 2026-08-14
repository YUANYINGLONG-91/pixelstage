# Editor (`/editor`) — The Product

**Purpose:** The heart of PixelStage. A full-viewport, three-column professional editor: import layered pixel art, manage the layer stack, place each layer at a true depth (billboard or ground plane), light the scene with DOF/fog/sun, preview with a real perspective camera (pan/dolly/orbit + cinematic paths), and export a portable scene.json v2 (embedded or zipped with assets). Local-first: autosaves to localStorage + IndexedDB; the Electron build adds a real project-file workflow with native dialogs.

**Chrome:** No marketing navbar/footer. App shell = Top Bar (48px) + Left Panel (layers, 272px) + Center Canvas (fluid) + Right Panel (inspector, 304px) + Status Bar (28px). No Lenis; native scroll inside panels. Desktop-first: below 1024px viewport width, show a dismissible amber-bordered notice bar ("PixelStage's editor is designed for desktop — layout may be cramped") but keep the app functional (panels become toggleable drawers).

**State model (Zustand, `src/store/sceneStore.ts`):** a single-document tree `{ name, canvasSize {width,height}, camera: Camera3D {position, target, fov}, effects: RenderEffects {dof, fog, ambient, sun}, layers[], selectedId, playing, pathPreset, filePath, dirty }` where each layer = `{ id, name, src (dataURL | asset path), offsetX, offsetY, depth, scale, orientation: "vertical" | "ground", lit, visible }`; plus snapshot history stacks `past`/`future`. Every mutation debounce-saves to localStorage + IndexedDB; in Electron, `dirty` + `filePath` drive the Ctrl+S / window-title workflow.

**Undo/redo:** snapshot history (`pushHistory` before every mutation, cap 100). Slider drags and effect tweaks carry a `coalesceKey` — repeated mutations with the same key within 800ms merge into one history entry, so a drag is one undo step. `Ctrl/⌘Z` undo · `Ctrl/⌘⇧Z` / `Ctrl/⌘Y` redo.

**Engine (three.js/WebGL, `Stage3D` + `StageCanvas3D`):** each layer is a textured plane in a real 3D scene; a perspective camera supplies true parallax, occlusion and foreshortening. A layer at `depth` shifts/scales on screen by `D / (D + depth)`, where `D = focalDistance(canvas, fov)` ≈ 742px at 960×540 / 40°. `depth 0` = focal plane (1:1 pixels) · `>0` farther · `<0` in front of the focal plane. `orientation: "ground"` lays the plane flat, receding to the horizon (Octopath-style). `lit` layers use Lambert shading under the scene lights; unlit layers render full-bright. UI coords are y-down; the engine flips internally. NearestFilter textures, always. rAF loop runs only while visible; the WebGL context is created once per canvas and disposed on unmount (an ErrorBoundary + context-lost handler recovers gracefully).

---

## 1. Top Bar (48px, `--bg-2`, bottom `--border`)

**Left:** `logo.svg` (20px) + **PixelStage** wordmark (Silkscreen 13px, "Stage" amber) — clicking it routes to `/`. Divider, then **project name** (Inter 500 13px, default `untitled-scene`) — click to edit inline (input appears in place, Enter/blur commits, Esc cancels). Next to it, save status: 6px dot (`--success` when saved, amber pulse while saving, amber solid when `dirty` with unsaved changes) + mono 11px `--text-3` (`saved 12:04:31` / `saving…` / Electron file path).

**Center — canvas size control:** a bordered group (radius 4px): presets `640×360` · `960×540` · `1280×720` as mono 11px segmented buttons (active = `--bg-3` + amber text). Changing size keeps layers and effects, reframes the camera to the default head-on framing.

**Right (icon buttons, 32px bordered squares, lucide 16px, tooltips):**
- `FolderOpen` **Open project…** — native dialog (Electron) or file picker (web) for a PixelStage project/scene JSON. `Ctrl/⌘O`.
- `FileJson` **Export** — opens Export modal (§6). Primary-styled (amber bg, dark text). `Ctrl/⌘E`.
- `Undo2` / `Redo2` — history.
- `RotateCcw` **Reset scene** — confirm dialog (danger confirm; recoverable via undo).
- Language toggle (EN / 中文) · `GraduationCap` **Tutorial** (reopens the 4-step onboarding tour).
- Divider, then `Github` link (opens repo), `ArrowLeft` **Back to site** (ghost, routes `/`).

**Animation:** bar slides down 48px→0 on route entry (400ms expo). Save dot pulses (opacity 1→0.4→1, 600ms) on each write; timestamp counts fresh.

---

## 2. Left Panel — Layers (272px, `--bg-2`, right `--border`)

**Header (44px):** `LAYERS` (Inter 600 11px, uppercase, `0.1em`, `--text-3`) + count mono chip (`6`) + right-aligned **Add layer** button (28px, secondary, lucide `Plus`, tooltip "Import PNG/JPG").

**Drop hint strip (32px, collapsible):** mono 10px `--text-3`: `drop images anywhere on the canvas`.

**Layer list** (flex column, 4px gap, padding 8, scrollable). Index 0 = farthest; the panel displays front-most first. Each row = 56px card (`--bg-1`, 1px `--border`, radius 4px):
- **Drag handle** (lucide `GripVertical`, `--text-3`, cursor grab) — Framer Motion `Reorder` vertical drag, springy (stiffness 500, damping 40); other rows slide aside.
- **Thumbnail** 40×40: checker bg + image `object-fit: contain`, `image-rendering: pixelated`, border `--border`.
- **Name** (Inter 500 13px, truncated) — double-click → inline rename input (commits Enter/blur, Esc cancels, empty name rejected with danger border shake).
- **Depth badge** under name: mono 10px `--text-3`, e.g. `depth +350` · ground-plane layers show `depth −100 · ground`.
- **Right-side controls** (visible on hover, or always when selected): `Eye`/`EyeOff` toggle (hidden layer → eye-off in `--text-3`, row dims to 55% opacity) and `Trash2` (danger ghost). Delete is immediate + toast "Layer deleted — Undo" (Undo button restores, 4s window).
- **Selected state:** 2px left amber bar + `--amber-dim` bg + border-strong. Click selects (drives inspector). Hidden layers still render thumbnails at 40%.

**Empty list state:** centered `empty-state.svg` + "No layers yet" (Inter 500 14px) + mono hint `add a background to begin`.

**Animation:** rows enter staggered (x -12→0, opacity, 60ms) on load; reorder springs; delete collapses height 56→0 (250ms) then removes; new layer row flashes `--amber-dim` once (600ms).

---

## 3. Center — Canvas Viewport (fluid, `--bg-0`)

**Stage chrome:** the viewport canvas sits centered in the void with 12px margin, framed by a 1px `--border-strong` rect with 8px corner ticks (pixel-notch style brackets) and a mono 11px dimension tag top-left above it: `960 × 540 · FOV 40°` (`--text-3`, canvas-size and fov values teal).

**Inside the viewport (`StageCanvas3D` in `editorMode`):**
- Where no layer covers: checker pattern (8px, `--bg-1`/`--bg-2`).
- Layers rendered by the three.js engine with real depth, lighting, fog and DOF.
- **Editor grid** (optional overlay): world-space pixel grid at the focal plane, toggle + step control.
- **Scanline overlay** (4% opacity horizontal 1px lines) — pure CSS, decorative, toggled off during drag for clarity.
- **Center crosshair:** 16px amber crosshair at 30% opacity marking the look-at point; fades to 12% when idle 2s, returns on mousemove.

**HUD chips** (absolute, mono 11px, `--bg-2`/85% + border, radius 2px):
- Top-left: live camera readout (teal numbers), updates every frame.
- Top-right: **camera bookmarks** — numbered chips save/jump saved framings (persisted into scene.json `bookmarks`; hover × deletes) + dolly zoom readout.
- Bottom-right: **path playback** — Switch + preset chips `SWEEP · ORBIT · DOLLY` (space toggles), and `RESET CAM` ghost button (lucide `Crosshair`, restores the default head-on framing).

**Layer interaction (v2.1):**
- **Click a sprite** to select it — per-pixel alpha picking (transparent texels fall through to layers behind; locked layers are skipped). Selected layers get an always-on-top amber outline (`EdgesGeometry` child, `depthTest:false`).
- **Drag a sprite** to move it 1:1: billboards slide on their z-plane (offset X/Y); ground layers slide along the floor (screen-y → depth — drag up-screen = recede). Multi-selection drags together.
- **Shift+drag**: push/pull depth for billboards (up = farther); hover height (offset Y) for ground layers. **Ctrl+drag**: snap to 8px.
- **Shift+click** toggles layers in/out of the multi-selection (panel rows too). Plain click on an already-selected layer collapses the selection to it; click empty space deselects.
- Dragging on empty space pans the camera (below).

**Camera interaction:**
- **Drag** empty space (cursor `grab` → `grabbing`): pan — camera and target move together, 1:1 world-feel at the focal plane; clamped to the stage ±50% with soft edges.
- **Wheel**: dolly zoom toward/away from the target, clamped to 40%–400% of the focal distance.
- **Right-drag / Alt-drag** (editor mode): orbit — yaw around the target plus pitch clamped to ±60°.
- `R`: reframe to the default camera. While dragging: scanlines off, crosshair brightens, HUD values flash amber.
- **Path playback** (space): the camera follows the selected preset from `cameraPaths.ts` — `sweep` (gentle Lissajous pan), `orbit` (±10° yaw with a slight rise — the shot that sells HD-2D), `dolly` (push in/out ±15%). Any manual drag pauses it (switch stays on, resumes after 3s idle).

**Empty state (no layers):** viewport shows centered `empty-state.svg` (120px) + headline "Drop your first layer" (Inter 600 18px) + sub (mono 12px `--text-3`): `png / jpg · drag anywhere · or` + two buttons: **Browse files…** (secondary) and **Load demo scene** (amber ghost — seeds a generated theme with ground plane, staggered billboards and per-theme effects; the fastest "wow" path).

**Drag-over state (files dragged over window):** full-canvas overlay (`--amber-dim` + 2px dashed amber border inset 12px + `empty-state.svg` + Silkscreen 16px `RELEASE TO ADD LAYERS`); dropping imports each image as a new layer on top (named from filename, defaults: depth 0, vertical, lit, scale 1), multi-file drops stagger-import with toast "3 layers added".

**Import rules:** PNG/JPG up to 4096px / 8MB each (oversize → danger toast, skipped). Images stored as dataURL in the document for autosave; if total storage payload exceeds ~4MB, a warning chip appears in the status bar (`storage 82% · export a project file soon`).

**First-run onboarding:** a 4-step bilingual coachmark tour (import → depth → camera → export) appears once; replayable from the top-bar tutorial button.

---

## 4. Right Panel — Inspector (304px, `--bg-2`, left `--border`)

### 4a. Layer selected (default after import/select)

**Header:** `INSPECTOR` label + layer name chip (amber mono).

- **Preview strip** (full panel width, 96px): checker bg, layer image contained, pixelated.
- **NAME:** text input (Inter 13px, `--bg-1` border) — live-renames the list row.
- **VISIBILITY:** Switch row, label `visible` mono.
- **DEPTH & LIGHT** group (label mono 10px `--text-3`, teal accent line):
  - **depth** — Slider (−400…+800, step 10) + synced number input (64px, mono 12px). Tick labels: `−400 · 0 · +800`. Amber fill track.
  - **orientation** — segmented toggle `vertical | ground` (mono 10px; active = `--bg-3` + amber). `vertical` = billboard facing the camera · `ground` = floor plane receding to the horizon.
  - **lit** — Switch: `lit` (shaded by scene lights) / `unlit` (full-bright — sky, glow overlays).
  - Live readout (mono 11px, `--bg-1` inset, padding 8): `depth +350 → parallax ×0.68` — the perspective factor `D / (D + depth)` recomputed from the current canvas/fov; result value teal. **This is the product's thesis made visible.**
- **opacity** — slider 0–1 (step 0.05) + number input, in the Depth & light group.
- **locked** — Switch (next to visibility): locked layers can't be picked, dragged or nudged in the viewport; Inspector stays editable.
- **TRANSFORM** group:
  - **Scale** — slider 0.10–4.00 (step 0.05) + number input; quick-set chips `0.5× 1× 2×`.
  - **Offset X / Offset Y** — two number steppers (−4096…4096, step 1; Shift+arrows ±10) with mono labels.
  - **rotate** — slider −180…+180° in-plane spin (ground layers yaw around their near-edge pivot).
  - **flip X / flip Y** — toggle chips (amber when on); **H / V** buttons center the layer on the canvas (V disabled for ground layers).
  - `RESET TRANSFORM` ghost button (scale 1, offsets 0, rotation 0, flips off — depth/orientation kept).
  - Multi-select shows a `×N` badge next to the layer name.
- **Danger zone:** divider + **Duplicate layer** (secondary, `Copy` icon) + **Delete layer** (danger, `Trash2`).

**Keyboard nudge:** with layer selected and no input focused, arrows adjust offset ±1 (Shift ±10) — HUD readout flashes.

### 4b. Nothing selected

Shows **SCENE** inspector:
- **Canvas size** (same presets as top bar).
- **EFFECTS** group (amber accent line) — per scene, exported with the JSON:
  - **Depth of field** — toggle; when on: `focus` (world depth −400…+800 in sharpest focus) + `aperture` (blur 0–1).
  - **Fog** — toggle; when on: `near` / `far` (0–4000) + color swatch.
  - **Ambient** — color swatch + intensity (0–2).
  - **Sun** — color swatch + intensity (0–3), `azimuth` (0–360°) + `elevation` (0–90°).
  All effect sliders coalesce into single undo steps.
- Layer count, total storage used (mono progress bar, amber >80%), background note "deepest empty pixels render as checker", and **tips card** (`--teal-dim`, teal left bar): rotating tips — e.g. "depth 0 = focal plane: pixels render 1:1. Negative depth puts a layer in front of it." / "Press ? for shortcuts." / "Space plays the camera path."

**Animation:** group blocks stagger in on selection change (y 8→0, 40ms stagger, 200ms); slider drags emit a subtle numeric flicker in the linked input; readout numbers interpolate (no layout jump, fixed-width mono).

---

## 5. Status Bar (28px, `--bg-2`, top `--border`, mono 11px `--text-3`)

Left: `ZOOM 100%` (dolly vs. focal distance) · `MOUSE x 000 y 000` (scene coords) · `LAYERS 6` · selected layer name chip.
Right: storage meter chip (`local 2.1MB`) · autosave time / dirty indicator · `? SHORTCUTS` button (opens §8 modal).
**Animation:** mouse coords update at 12fps throttled; storage chip turns amber past 80%.

---

## 6. Export Modal (shadcn Dialog, 720px, `--bg-1`)

- **Header:** Silkscreen 14px `EXPORT SCENE` + sub mono 12px: `goldenhollow-village.json · 8 layers · 148.2 KB`.
- **Tabs:** `SCENE.JSON` (default) | `RUNTIME.HTML` (the three.js player snippet — CDN import map, no build step — pre-filled with this scene's canvas size) | `VIDEO.WEBM` — records the live editor canvas (`captureStream(60)` + MediaRecorder, vp9→vp8) for exactly one camera-path period (sweep 9s / orbit 12s / dolly 10s) → a seamlessly looping WebM; preset chips pick the path. Grid/selection outlines are captured, so the hint says to press Esc + hide the grid first.
- **Options row:** checkbox **Embed images (base64)** — on (default): `src` = dataURLs, single self-contained JSON, file size shown. Off: exports an **honest zip** — `scene.json` with `src` rewritten to `assets/<name>.png`, plus every layer image really inside the zip (`src/core/zip.ts`); external (non-dataURL) srcs are kept as-is and reported in the toast.
- **Footer:** **Download project** (ghost — self-contained `.pixelstage.json` for moving between machines) · **Copy JSON** (secondary) · **Download** (primary — `.json` when embedding, `.zip` otherwise).
- **Animation:** dialog scales 0.96→1 + fade (200ms expo); JSON block highlights line-by-line on open (60ms stagger, subtle).

---

## 7. Open Project Modal

Two tabs: **Upload file** (drop zone + browse, accepts PixelStage project/scene JSON — v1 files migrate automatically: `depth = D·(1 − factorX)`, factorY dropped) and **Recent files** (Electron: real paths from the OS list; web: falls back to paste/upload). If a scene.json lacks embedded images: imports structure, shows missing layers as magenta wireframe placeholders with `relink` buttons per row (toast: "3 assets missing — relink files to restore pixels").

---

## 8. Shortcuts Modal (`?`)

Two-column mono table in a compact dialog:
`Space` play/pause camera path · `R` reframe camera · click sprite select · drag sprite move · `Shift+drag` depth/hover · `Ctrl+drag` snap 8px · `Shift+click` multi-select · `Del` delete layer(s) · `H` show/hide · `L` lock/unlock · `X`/`Y` flip X/Y · `[` `]` depth ∓10 (Shift 50) · `−` `=` scale ∓0.05 (Shift 0.25) · `Ctrl/⌘ C · V` copy/paste layers · `Ctrl/⌘ A` select all · `Ctrl/⌘ Z` undo · `Ctrl/⌘⇧ Z · Ctrl/⌘ Y` redo · `Ctrl/⌘ D` duplicate · `Ctrl/⌘ S` save project · `Ctrl/⌘⇧ S` save as · `Ctrl/⌘ E` export · `Ctrl/⌘ O` open project · `Wheel` dolly zoom · `Right/Alt drag` orbit · `Arrows` nudge offset ±1 · `Shift+Arrows` ±10 · `?` this panel · `Esc` close / deselect.
Keys styled as MonoChips. Animation: rows stagger 30ms.

---

## 9. Route Entry & Toasts

- Entering `/editor`: panels slide in (left from -24px, right from +24px, top bar down, status bar up — 350ms expo, 60ms stagger), then if a saved project exists it restores with toast "Project restored from local save" (teal, v1 saves migrate silently); else the empty state + the first-run onboarding tour.
- **Desktop workflow (Electron):** `Ctrl/⌘S` saves to the current `.pixelstage.json` path (Save As dialog on first save), `Ctrl/⌘⇧S` always asks, `Ctrl/⌘O` opens a native dialog. Double-clicking a `.pixelstage.json` in the OS opens it in PixelStage (file association + second-instance forwarding). Unsaved changes show a `dirty` dot.
- Toasts (global): bottom-center mono toasts per design.md — used for import results, deletes (with Undo), export copy confirmations, storage warnings, autosave restore.

---

## 10. Responsive & Accessibility

- ≥1440px: full layout as spec'd. 1024–1440px: panels shrink (240px / 280px). <1024px: notice bar + panels become overlay drawers toggled by top-bar `PanelLeft`/`PanelRight` icon buttons; canvas always visible.
- All controls keyboard-focusable with amber focus rings; sliders arrow-key adjustable; layer list rows focusable (Enter select, Space toggle visibility); modal focus-trapped; `prefers-reduced-motion` disables path autoplay default and panel slide-ins.
- The viewport is wrapped in an ErrorBoundary: a WebGL crash (e.g. context loss) shows a recovery panel instead of a white screen.

---

## Assets used
`logo.svg` · `empty-state.svg` · demo scenes generated at runtime by `src/core/placeholder.ts` (Load demo scene) · all chrome else is CSS/SVG/lucide.
