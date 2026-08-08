# Home (`/`) — Landing Page

**Purpose:** Tell the product story and prove it instantly. The hero is a *working* HD-2D stage running the exact same three.js engine as the editor (`StageCanvas3D`) — a real perspective camera, real depth, real light. Every scroll section deepens the pitch: problem → workflow → features → portable JSON → gallery → open source.

**Chrome:** Marketing Navbar + Footer (see design.md). Lenis smooth scroll. Max content width 1200px, sections padded 128px vertical (desktop) / 72px (mobile).

---

## Section 1 — Hero (100vh, min 720px)

**Layout:** Full viewport. Two layers of background texture: (1) `--bg-0` base with the 24px pixel-grid cross-hatch at 2.5% opacity; (2) dithered radial amber glow top-center (8% opacity, 2px checker mask). Content is a 2-column grid (55% copy / 45% demo) on desktop, stacking copy-first on mobile.

**Left column:**
- Eyebrow: `// OPEN-SOURCE HD-2D PIXEL SCENE EDITOR` (Silkscreen 12px, amber) with a mono chip `MIT` after it.
- H1 (Silkscreen 700, clamp 40→60px, `--text-1`): `HD-2D FOR THE` / `REST OF US▮` — "REST OF US" in `--amber`, blinking block caret after the final char.
- Sub (Inter 17px/1.6, `--text-2`, max 520px): "PixelStage is a professional editor for layered pixel scenes in real 2.5D. Import your art, place each layer at a true depth — billboards and Octopath-style ground planes — light the scene, orbit a perspective camera, and export one portable JSON plus a three.js runtime that reproduces it exactly. No Unreal pipeline. No engine lock-in. No cost."
- CTA row (gap 12): **Launch the Editor** (primary, pixel-notch, arrow icon) · **How it works** (secondary, scrolls to Section 3).
- Stat strip (row of MonoChips, gap 8, margin-top 32): `THREE.JS / WEBGL` · `REAL 3D CAMERA` · `DESKTOP APP` · `LOCAL-FIRST`

**Right column — Live HD-2D Demo (`hero-stage`):**
- A pixel-notch-framed canvas, 16:9 (min 480px wide), rendering the **Goldenhollow Village** v2 scene from `src/core/placeholder/` (programmatic, seeded): an unlit dithered dusk sky at depth +700, town silhouette +400, half-timbered houses +180, market square at the focal plane (0) with two chibi travelers, a **ground-plane** cobblestone square receding to the horizon, and a grass fringe at −300 in front of the focal plane. Per-theme effects are live: dusk fog + DOF (square sharp, fringe soft). Textures use NearestFilter — pixels stay crisp.
- **Interaction:** the stage runs `StageCanvas3D` — the same component as the editor viewport. Drag = pan the perspective camera (cursor `grab` → `grabbing`), wheel = dolly zoom (40%–400% of focal distance). Before first interaction, the camera plays the **sweep** path preset (gentle Lissajous pan, `cameraPaths.ts`). First drag kills auto-play permanently for the session.
- HUD overlay chips (mono 11px, `--bg-2` at 85% + border): top-left live camera readout (teal numbers); bottom-right depth legend `−300 → +700`; bottom-left hint chip `✥ DRAG TO MOVE CAMERA` (fades to 0 after first drag, 400ms).
- Below the stage: a thin control row — toggle switch `AUTO SWEEP` (mono 11px) + `RESET CAMERA` ghost button. (Same controls exist in the editor; this is a deliberate preview of the product's UI language.)

**Animation:**
- On load: eyebrow slides in (translateY 16px, 500ms expo) → H1 characters animate individually (translateY 110% → 0, rotate 2°→0, 40ms stagger, 700ms expo, overflow-hidden per char) → sub fades up (24px, 600ms, delay 200ms) → CTAs stagger up (80ms apart) → chips stagger (60ms).
- Hero stage: scales 0.96→1 + opacity 0→1 (800ms expo, delay 400ms) as the sweep path starts.
- Background grid drifts at 0.1× scroll speed (decorative parallax).

---

## Section 2 — Spec Ticker (48px strip)

**Layout:** Full-width strip, `--bg-1`, top+bottom `--border` hairlines. Horizontally scrolling mono marquee (infinite loop, 30s duration, pause on hover).

**Content (mono 12px `--text-3`, separators are 8px amber squares):** `IMPORT PNG / JPG` ▪ `REORDER · RENAME · SHOW / HIDE` ▪ `DEPTH −400 … +800` ▪ `BILLBOARD + GROUND-PLANE LAYERS` ▪ `DOF · FOG · SUN LIGHT` ▪ `PERSPECTIVE CAMERA — PAN / DOLLY / ORBIT` ▪ `CAMERA PATHS — SWEEP / ORBIT / DOLLY` ▪ `EXPORT SCENE.JSON + ZIP` ▪ `DESKTOP APP — NATIVE SAVE / OPEN` ▪ *(loops)*

**Animation:** continuous CSS marquee; items are duplicated for seamless loop.

---

## Section 3 — The Problem (pinned scroll story, 160vh pin)

**Layout:** Pinned section (GSAP ScrollTrigger, pin for 160vh). Header block top-center: eyebrow `// THE PROBLEM`, H2 "Octopath's look without Octopath's budget.", lead paragraph (Inter 17px, `--text-2`, max 640px, centered): "Octopath Traveler and Wandering Sword built their 'HD-2D' look on Unreal Engine 4 — real 3D scenes, camera rigs, volumetric light. Gorgeous. Also a team-of-fifty, multi-year, engine-royalty affair. 99% of indie pixel games want that exact look — the tilt-shift blur, the receding floor, the foreground framing — without the pipeline. Until now, the tooling for that was a TODO comment."

Below the header, two cards side by side (grid 2×1, gap 24, mobile stacks):

- **Card A — "THE 1% PATH"** (`--bg-1`, border): header mono chip `UE4 HD-2D PIPELINE`. Bullet list (Inter 15px, `--text-2`, lucide `X` icons in `--text-3`): "Full 3D scene + PBR lighting for a 2D-looking game" · "Camera rigs, DOF, volumetrics to maintain" · "Engine expertise + royalties" · mono stat footer: `TEAM: 20–50 · YEARS: 3+ · COST: $$$$$`.
- **Card B — "THE 99% PATH"** (border-strong, amber-tinted): header mono chip amber `PIXELSTAGE HD-2D`. Bullets (lucide `Check` in teal): "Draw your art once, in any pixel tool" · "Place each layer at a true depth — billboard or ground plane" · "A real perspective camera supplies parallax, occlusion and foreshortening — perspective does the multiply for you: `D / (D + depth)`" · stat footer (amber): `TEAM: 1 · TIME: AN AFTERNOON · COST: $0`.
- Under Card B, a closing line appears: "PixelStage is the professional editor for the 99% path." (Inter 600 18px, `--text-1`).

**Animation (scroll-driven, progress 0→1 over the pin):**
- 0.0–0.3: header words slide up word-by-word (word-level split, 30ms stagger per word).
- 0.2–0.6: Card A slides in from left (x -60→0) and **dims** (opacity 1→0.45, saturate 1→0.4) as Card B slides in from right (x 60→0) and brightens with an amber border glow (`box-shadow` amber fade-in).
- 0.6–0.85: Card A's bullets strike through one by one (line-through draw, 120ms stagger); Card B's check items pop in (scale 0.8→1, back-out ease, 100ms stagger).
- 0.85–1.0: closing line fades up (16px); pin releases.

---

## Section 4 — How It Works (3 steps)

**Layout:** Header left-aligned: eyebrow `// WORKFLOW`, H2 "Three steps. One JSON.". Below: 3-column grid (gap 24, mobile stacks). Each step card: `--bg-1` border card, padding 32, min-height 320px.

1. **`01 / IMPORT`** (Silkscreen number in amber, 28px) — H3 "Drop in your layers". Body: "PNG or JPG, drag-and-drop or file picker. Sky, facades, floor, foreground — PixelStage hangs each one in a real 3D scene the moment it lands." Visual: mini CSS mockup of the editor's empty canvas with a dashed drop zone and the `empty-state.svg` ghost, plus 2 file chips (`sky.png`, `floor.png`) that animate dropping into the zone on scroll.
2. **`02 / STAGE`** — H3 "Dial in the depth". Body: "Depth per layer — 0 is the focal plane (1:1 pixels), positive recedes, negative jumps in front. Flip a layer to `ground` and it becomes a floor receding to the horizon. Add DOF, fog and sun, then orbit the camera and watch the scene breathe." Visual: mini mockup of a depth slider (`depth +350 ▓▓▓▓▓▓░░`) and a live parallax readout (`parallax ×0.68`) that animate as you scroll into view.
3. **`03 / EXPORT`** — H3 "Ship one file". Body: "Layer depths, orientations, lighting, camera — one portable scene.json (v2), embedded or zipped with its assets. Consume it from any engine with the three.js runtime snippet in the guide." Visual: mini CodeBlock showing a 6-line JSON excerpt with the copy button.

**Animation:** cards stagger in (translateY 40px, opacity 0→1, 120ms stagger, trigger `top 78%`). Step 2's slider handle sweeps once when in view (GSAP, 1.2s expo). Numbers count-up style flicker (pixel-font roll) on entry.

**Interaction:** each card's mini-mockup is hoverable — hovering the drop zone highlights the dashed border amber; hovering the slider shows a tooltip with the exact value.

---

## Section 5 — Feature Grid

**Layout:** eyebrow `// THE TOOL`, H2 "An editor, not a toy.". 3×2 grid of cards (gap 16, mobile 1-col). Each card: `--bg-1`, border, padding 28, lucide icon in a 40px `--bg-3` bordered square (icon amber), H3 18px, body 15px `--text-2`.

1. **Layers in true depth** (`Layers` icon) — "Import, reorder, rename, show/hide, delete. Every layer sits at a real z-depth — billboard facing the camera, or a ground plane receding to the horizon."
2. **Light & atmosphere** (`Sun` icon) — "Per-scene depth-of-field (focus + aperture), distance fog, ambient and directional sun. Mark a layer unlit for full-bright skies and glow overlays."
3. **Perspective camera** (`Move` icon) — "Drag to pan, wheel to dolly (40–400%), right-drag to orbit. `R` reframes, space plays a cinematic path — sweep, orbit or dolly."
4. **Portable JSON** (`FileJson`) — "One scene file: order, assets, depths, lighting, camera. Engine-agnostic by design, versioned schema — v1 files migrate automatically."
5. **A real desktop app** (`AppWindow`) — "Sandboxed Electron build with native Save/Open dialogs, recent files and `.pixelstage.json` file association. NSIS installer or no-install portable exe. The web version keeps working too."
6. **Honest export** (`Package`) — "Embed images as base64, or export a zip that really contains `scene.json` + `assets/*.png`. Undo/redo everything — slider drags coalesce into one step."

**Animation:** cards stagger up 40px, 90ms stagger, trigger 80%. Hover: translateY(-4px), border-strong, icon square flashes `--amber-dim`; icon rotates 6° on hover (150ms).

---

## Section 6 — "Your scene is a file" (JSON + runtime split)

**Layout:** eyebrow `// PORTABLE BY DESIGN`, H2 "Your scene is a file.", lead: "Export drops a single scene.json. This is a real export — and the runtime that renders it." Split grid (2 cols, gap 24, mobile stacks):

- **Left — CodeBlock `goldenhollow-village.json`** (realistic excerpt):
```json
{
  "version": 2,
  "canvas": { "width": 960, "height": 540 },
  "camera": { "position": { "x": 480, "y": 108, "z": 742 }, "target": { "x": 480, "y": 340, "z": 0 }, "fov": 40 },
  "layers": [
    { "name": "sky",            "src": "assets/sky.png",            "depth": 700,  "orientation": "vertical", "lit": false, "scale": 1.94, "offsetX": -437, "offsetY": -246, "visible": true },
    { "name": "market square",  "src": "assets/market-square.png",  "depth": 0,    "orientation": "vertical", "lit": true,  "scale": 1,    "offsetX": 0,    "offsetY": 0,    "visible": true },
    { "name": "warrior",        "src": "assets/warrior.png",        "depth": 10,   "orientation": "vertical", "lit": true,  "scale": 1.19, "offsetX": 380,  "offsetY": 469,  "visible": true },
    { "name": "cobblestone square", "src": "assets/cobblestone-square.png", "depth": -100, "orientation": "ground", "lit": true, "scale": 1.9, "offsetX": -72, "offsetY": 540, "visible": true }
  ]
}
```
- **Right — CodeBlock `runtime.html`** (first ~14 lines of the guide's three.js snippet — CDN import map, no build step) + below it, 3 bullet points (Inter 15px): "**Real perspective.** A layer at `depth` shifts and scales by `D / (D + depth)` — parallax, occlusion and foreshortening come free." / "**three.js, one CDN import map.** `NearestFilter` textures, no build step — read every line, it's yours." / "**Any host.** Drop it into your game page, an Electron shell, or a bare HTML file."
- CTA row: **Read the full guide** (secondary) · **Copy runtime** (ghost, copies snippet).

**Animation:** both code blocks slide in from opposite sides (x ±40, 700ms expo, trigger 80%); a teal caret types the last JSON line character-by-character on entry (30ms/char); bullets stagger up 80ms.

---

## Section 7 — Gallery Teaser

**Layout:** eyebrow `// SCENES`, H2 "Made with PixelStage.", right-aligned ghost link "Browse the gallery →". Grid of 4 scene cards (`sm:grid-cols-2 lg:grid-cols-4`, gap 20; mobile: horizontal scroll-snap).

Each card: 16:9 **live mini HD-2D canvas** (`StageCanvas3D`, auto-playing the sweep path; rAF only while visible), below it: scene name (Inter 600 16px) + tag MonoChip (`TOWN` / `NATURE` / `INTERIOR` / `URBAN`). Cards: **Goldenhollow Village**, **Stillsnow Pass**, **Emberhold Ruins**, **Neon Alley** — each with a ground plane, staggered billboards, an in-scene chibi character and per-theme fog/DOF.

**Animation:** cards stagger up 60px / 100ms stagger; canvases fade in after card lands (300ms). Hover: card lifts -4px, border-strong, path playback speeds up 1.5× (eases over 400ms) and shows a `DRAG ME` chip — the mini canvases are draggable too.

---

## Section 8 — Open Source

**Layout:** Centered narrow block (max 680px). eyebrow `// OPEN SOURCE`, H2 "Free as in freedom.", body (17px, centered): "PixelStage is MIT-licensed and built in the open by an indie dev who needed it for their own Wandering-Sword-style pixel game. Every line of the engine is meant to be read, forked, and shipped inside your game. Issues, PRs, and gallery submissions welcome."
- Button row centered: **Star on GitHub** (primary, Github icon) · **Contribute** (secondary).
- Mono stat chips row: `LICENSE MIT` · `TYPESCRIPT` · `NO TELEMETRY`.

**Animation:** block-level fade up (24px, 700ms), chips pop with 60ms stagger; GitHub button star icon does a one-time spin (360°, 600ms) when scrolled into view.

---

## Section 9 — Final CTA (160px tall band)

**Layout:** Full-width band, dithered amber glow + pixel grid bg (as hero), centered. Silkscreen headline 32px: `YOUR NEXT SCENE IS ONE DRAG AWAY▮` + sub (Inter 16px, `--text-2`): "Open the editor. Drop a layer. Feel the depth." + **Launch the Editor** (primary, large).

**Animation:** headline characters animate on scroll entry (char-level, 25ms stagger, from translateY 100%); button pulses with a slow amber glow (2.4s, subtle, `box-shadow` breathe) until hovered.

---

## Footer
Global footer (design.md §8). Entrance: simple opacity 0→1 at 90% viewport.

---

## Assets used
`logo.svg` · `empty-state.svg` (step-1 mockup) · demo scenes are **programmatically generated at runtime** by `src/core/placeholder/` (seeded, deterministic — Goldenhollow Village / Stillsnow Pass / Emberhold Ruins / Neon Alley), no PNG files to ship. All other chrome is CSS/SVG/lucide.
