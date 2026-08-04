# Editor (`/editor`) — The Product

**Purpose:** The heart of PixelStage. A full-viewport, three-column professional editor: import layered pixel art, manage the layer stack, tune per-layer parallax/scale/offset, preview depth with a draggable virtual camera (or auto-sweep), and export a portable scene.json. Local-first: autosaves to localStorage, project import/export.

**Chrome:** No marketing navbar/footer. App shell = Top Bar (48px) + Left Panel (layers, 272px) + Center Canvas (fluid) + Right Panel (inspector, 304px) + Status Bar (28px). No Lenis; native scroll inside panels. Desktop-first: below 1024px viewport width, show a dismissible amber-bordered notice bar ("PixelStage's editor is designed for desktop — layout may be cramped") but keep the app functional (panels become toggleable drawers).

**State model (Zustand):** `scene { version, canvas {width,height}, layers[] }` where each layer = `{ id, name, src (dataURL | asset path), width, height, factorX, factorY, scale, offsetX, offsetY, visible }`; plus `camera { x, y }`, `selectedLayerId`, `ui { zoom, autoPlay, dragOver }`. Every mutation debounce-saves (500ms) to localStorage key `pixelstage.project.v1`.

**Render loop (custom Canvas 2D, rAF):**
```
screenX = layer.offsetX − camera.x × layer.factorX   (+ layer base anchoring)
screenY = layer.offsetY − camera.y × layer.factorY
drawImage(img, screenX, screenY, img.width × scale, img.height × scale)
```
Layers drawn back-to-front (list bottom = farthest). `imageSmoothingEnabled = false` always. 60fps while tab visible.

---

## 1. Top Bar (48px, `--bg-2`, bottom `--border`)

**Left:** `logo.svg` (20px) + **PixelStage** wordmark (Silkscreen 13px, "Stage" amber) — clicking it routes to `/`. Divider, then **project name** (Inter 500 13px, default `untitled-scene`) — click to edit inline (input appears in place, Enter/blur commits, Esc cancels). Next to it, autosave status: 6px dot (`--success` when saved, amber pulse while saving) + mono 11px `--text-3` (`saved 12:04:31` / `saving…`).

**Center — canvas size control:** a bordered group (radius 4px): presets `640×360` · `960×540` · `1280×720` as mono 11px segmented buttons (active = `--bg-3` + amber text), then a `custom` button opening a tiny popover with two number inputs (W/H, 160–4096) + Apply. Changing size keeps layers, clamps camera.

**Right (icon buttons, 32px bordered squares, lucide 16px, tooltips):**
- `FolderOpen` **Open project…** — file picker for a PixelStage project/scene JSON.
- `FileJson` **Export JSON** — opens Export modal (§7). Primary-styled (amber bg, dark text).
- `RotateCcw` **Reset scene** — confirm dialog ("Clear all layers? This cannot be undone." danger confirm).
- Divider, then `Github` link (opens repo), `ArrowLeft` **Back to site** (ghost, routes `/`).

**Animation:** bar slides down 48px→0 on route entry (400ms expo). Save dot pulses (opacity 1→0.4→1, 600ms) on each write; timestamp counts fresh.

---

## 2. Left Panel — Layers (272px, `--bg-2`, right `--border`)

**Header (44px):** `LAYERS` (Inter 600 11px, uppercase, `0.1em`, `--text-3`) + count mono chip (`4`) + right-aligned **Add layer** button (28px, secondary, lucide `Plus`, tooltip "Import PNG/JPG").

**Drop hint strip (32px, collapsible):** mono 10px `--text-3`: `drop images anywhere on the canvas`.

**Layer list** (flex column, 4px gap, padding 8, scrollable). Each row = 56px card (`--bg-1`, 1px `--border`, radius 4px):
- **Drag handle** (lucide `GripVertical`, `--text-3`, cursor grab) — Framer Motion `Reorder` vertical drag, springy (stiffness 500, damping 40); other rows slide aside.
- **Thumbnail** 40×40: checker bg + image `object-fit: contain`, `image-rendering: pixelated`, border `--border`.
- **Name** (Inter 500 13px, truncated) — double-click → inline rename input (commits Enter/blur, Esc cancels, empty name rejected with danger border shake).
- **Factor badge** under name: mono 10px `--text-3`, e.g. `fx 0.40 · fy 0.12`.
- **Right-side controls** (visible on hover, or always when selected): `Eye`/`EyeOff` toggle (hidden layer → eye-off in `--text-3`, row dims to 55% opacity) and `Trash2` (danger ghost). Delete is immediate + toast "Layer deleted — Undo" (Undo button restores, 4s window).
- **Selected state:** 2px left amber bar + `--amber-dim` bg + border-strong. Click selects (drives inspector). Hidden layers still render thumbnails at 40%.

**Empty list state:** centered `empty-state.svg` + "No layers yet" (Inter 500 14px) + mono hint `add a background to begin`.

**Animation:** rows enter staggered (x -12→0, opacity, 60ms) on load; reorder springs; delete collapses height 56→0 (250ms) then removes; new layer row flashes `--amber-dim` once (600ms).

---

## 3. Center — Canvas Viewport (fluid, `--bg-0`)

**Stage chrome:** the viewport canvas sits centered in the void with 12px margin, framed by a 1px `--border-strong` rect with 8px corner ticks (pixel-notch style brackets) and a mono 11px dimension tag top-left above it: `960 × 540 · SCALE 1:2` (`--text-3`, canvas-size and zoom values teal).

**Inside the viewport:**
- Where no layer covers: checker pattern (8px, `--bg-1`/`--bg-2`).
- Layers rendered per the render loop, back-to-front, `pixelated` upscaling.
- **Scanline overlay** (4% opacity horizontal 1px lines) — pure CSS, decorative, toggled off during drag for clarity.
- **Center crosshair:** 16px amber crosshair at 30% opacity marking the camera center; fades to 12% when idle 2s, returns on mousemove.

**HUD chips** (absolute, mono 11px, `--bg-2`/85% + border, radius 2px):
- Top-left: `cam.x 0000 · cam.y 0000` — live, teal numbers, updates every frame.
- Top-right: zoom controls `− 100% +` + `FIT` button (recompute zoom to fit viewport).
- Bottom-right: **Auto-sweep toggle** (Switch + `AUTO SWEEP` label) and `RESET CAM` ghost button (lucide `Crosshair`, animates camera back to 0,0 with 500ms expo).

**Virtual camera interaction:**
- Drag anywhere on the viewport (cursor `grab` → `grabbing`): camera moves opposite the drag (like grabbing the world), clamped to `0 … (stage − view)` per axis with ±12.5% soft overdrag (rubber-band, springs back on release).
- While dragging: scanlines off, crosshair brightens, HUD values flash amber for changed axes.
- **Auto-sweep:** camera follows `x = center + sin(t) × range`, `y = center + sin(t×0.6) × range/3` at ~60px/s; any manual drag pauses it (switch stays on, resumes after 3s idle — chip hint `paused · resuming in 3s` counts down).
- `Ctrl/⌘ + wheel`: zoom 25%→400% (steps ×1.25), centered on cursor; plain wheel pans camera (trackpad-friendly).

**Empty state (no layers):** viewport shows centered `empty-state.svg` (120px) + headline "Drop your first layer" (Inter 600 18px) + sub (mono 12px `--text-3`): `png / jpg · drag anywhere · or` + two buttons: **Browse files…** (secondary) and **Load demo scene** (amber ghost — seeds the Sunset Valley set at default factors; the fastest "wow" path).

**Drag-over state (files dragged over window):** full-canvas overlay (`--amber-dim` + 2px dashed amber border inset 12px + `empty-state.svg` + Silkscreen 16px `RELEASE TO ADD LAYERS`); dropping imports each image as a new layer on top (named from filename, factor defaults `fx 0.5 · fy 0.2 · scale 1`), multi-file drops stagger-import with toast "3 layers added".

**Import rules:** PNG/JPG up to 4096px / 8MB each (oversize → danger toast, skipped). Images stored as dataURL in the project for autosave; if total localStorage payload exceeds ~4MB, a warning chip appears in the status bar (`storage 82% · export a project file soon`).

---

## 4. Right Panel — Inspector (304px, `--bg-2`, left `--border`)

### 4a. Layer selected (default after import/select)

**Header:** `INSPECTOR` label + layer name chip (amber mono).

- **Preview strip** (full panel width, 96px): checker bg, layer image contained, pixelated; mono caption `1024 × 1024 px · PNG`.
- **NAME:** text input (Inter 13px, `--bg-1` border) — live-renames the list row.
- **VISIBILITY:** Switch row, label `visible` mono.
- **PARALLAX FACTORS** group (label mono 10px `--text-3`, teal accent line):
  - **factorX** — Slider (0.00–1.00, step 0.01) + synced number input (48px, mono 12px). Tick labels under slider: `0 locked · 0.5 · 1 glued`. Amber fill track.
  - **factorY** — same, teal fill track.
  - Live formula readout (mono 11px, `--bg-1` inset, padding 8): `x = 0 − 320 × 0.40 → −128px` — recomputed every frame while camera moves; result value teal. **This is the product's thesis made visible.**
- **TRANSFORM** group:
  - **Scale** — slider 0.10–4.00 (step 0.05, log-ish feel) + number input; quick-set chips `0.5× 1× 2×`.
  - **Offset X / Offset Y** — two number steppers (−4096…4096, step 1; Shift+arrows ±10) with mono labels.
  - `RESET TRANSFORM` ghost button (scale 1, offsets 0 — factors kept).
- **Danger zone:** divider + **Duplicate layer** (secondary, `Copy` icon) + **Delete layer** (danger, `Trash2`).

**Keyboard nudge:** with layer selected and no input focused, arrows adjust offset ±1 (Shift ±10) — HUD readout flashes.

### 4b. Nothing selected

Shows **SCENE** inspector: canvas size (same presets as top bar), layer count, total storage used (mono progress bar, amber >80%), background note "deepest empty pixels render as checker", and **tips card** (`--teal-dim`, teal left bar): rotating tips — e.g. "factor 0 = locked to screen, 1 = glued to camera. Most scenes live between 0.05 and 0.8." / "Press ? for shortcuts." / "Space toggles auto-sweep."

**Animation:** group blocks stagger in on selection change (y 8→0, 40ms stagger, 200ms); slider drags emit a subtle numeric flicker in the linked input; readout numbers interpolate (no layout jump, fixed-width mono).

---

## 5. Status Bar (28px, `--bg-2`, top `--border`, mono 11px `--text-3`)

Left: `ZOOM 100%` · `MOUSE x 000 y 000` (scene coords) · `LAYERS 4` · selected layer name chip.
Right: storage meter chip (`local 2.1MB`) · autosave time · `? SHORTCUTS` button (opens §8 modal).
**Animation:** mouse coords update at 12fps throttled; storage chip turns amber past 80%.

---

## 6. Export JSON Modal (shadcn Dialog, 720px, `--bg-1`)

- **Header:** Silkscreen 14px `EXPORT SCENE` + sub mono 12px: `sunset-valley.json · 4 layers`.
- **Tabs:** `SCENE.JSON` (default) | `RUNTIME.JS` (the ~20-line snippet, pre-filled with this scene's canvas size). Both CodeBlocks with working Copy buttons.
- **Options row:** checkbox **Embed images (base64)** — off: `src` = filenames (with amber hint "assets travel alongside the JSON"); on: `src` = dataURLs, file size estimate shown (`≈ 3.8 MB`).
- **Footer:** **Copy JSON** (secondary) · **Download .json** (primary, downloads `projectname.json`).
- **Animation:** dialog scales 0.96→1 + fade (200ms expo); JSON block highlights line-by-line on open (60ms stagger, subtle).

---

## 7. Open Project Modal

Two tabs: **Upload file** (drop zone + browse, accepts PixelStage project JSON) and **Paste JSON** (textarea, mono, with Validate button — invalid JSON shows danger inline error with line number). If a raw scene.json lacks embedded images: imports structure, shows missing layers as `--magenta`/black checker placeholders with `relink` buttons per row (toast: "3 assets missing — relink files to restore pixels").

---

## 8. Shortcuts Modal (`?`)

Two-column mono table in a compact dialog:
`Space` toggle auto-sweep · `R` reset camera · `Del` delete layer · `H` show/hide layer · `⌘/Ctrl D` duplicate · `⌘/Ctrl E` export · `⌘/Ctrl O` open project · `Arrows` nudge offset ±1 · `Shift+Arrows` ±10 · `⌘/Ctrl + wheel` zoom · `?` this panel · `Esc` close / deselect.
Keys styled as MonoChips. Animation: rows stagger 30ms.

---

## 9. Route Entry & Toasts

- Entering `/editor`: panels slide in (left from -24px, right from +24px, top bar down, status bar up — 350ms expo, 60ms stagger), then if a saved project exists it restores with toast "Project restored from local save" (teal); else the empty state + a one-time coachmark pulse on **Load demo scene**.
- Toasts (global): bottom-center mono toasts per design.md — used for import results, deletes (with Undo), export copy confirmations, storage warnings, autosave restore.

---

## 10. Responsive & Accessibility

- ≥1440px: full layout as spec'd. 1024–1440px: panels shrink (240px / 280px). <1024px: notice bar + panels become overlay drawers toggled by top-bar `PanelLeft`/`PanelRight` icon buttons; canvas always visible.
- All controls keyboard-focusable with amber focus rings; sliders arrow-key adjustable; layer list rows focusable (Enter select, Space toggle visibility); modal focus-trapped; `prefers-reduced-motion` disables auto-sweep default and panel slide-ins.

---

## Assets used
`logo.svg` · `empty-state.svg` · demo scene layers `layers/valley-*.png` (Load demo scene) · all chrome else is CSS/SVG/lucide.
