# Home (`/`) — Landing Page

**Purpose:** Tell the product story and prove it instantly. The hero is a *working* parallax stage with a draggable virtual camera — the same math the editor uses. Every scroll section deepens the pitch: problem → workflow → features → portable JSON → gallery → open source.

**Chrome:** Marketing Navbar + Footer (see design.md). Lenis smooth scroll. Max content width 1200px, sections padded 128px vertical (desktop) / 72px (mobile).

---

## Section 1 — Hero (100vh, min 720px)

**Layout:** Full viewport. Two layers of background texture: (1) `--bg-0` base with the 24px pixel-grid cross-hatch at 2.5% opacity; (2) dithered radial amber glow top-center (8% opacity, 2px checker mask). Content is a 2-column grid (55% copy / 45% demo) on desktop, stacking copy-first on mobile.

**Left column:**
- Eyebrow: `// OPEN-SOURCE 2.5D PARALLAX SCENE EDITOR` (Silkscreen 12px, amber) with a mono chip `MIT` after it.
- H1 (Silkscreen 700, clamp 40→60px, `--text-1`): `HD-2D FOR THE` / `REST OF US▮` — "REST OF US" in `--amber`, blinking block caret after the final char.
- Sub (Inter 17px/1.6, `--text-2`, max 520px): "PixelStage is a professional web editor for layered pixel parallax scenes. Import your art, tune per-layer depth factors, drag a virtual camera, and export one portable JSON your engine renders in ~20 lines. No Unreal pipeline. No engine lock-in. No cost."
- CTA row (gap 12): **Launch the Editor** (primary, pixel-notch, arrow icon) · **How it works** (secondary, scrolls to Section 3).
- Stat strip (row of MonoChips, gap 8, margin-top 32): `CANVAS 2D` · `0 RUNTIME DEPS` · `LOCAL-FIRST` · `~20 LINE RUNTIME`

**Right column — Live Parallax Demo (`hero-stage`):**
- A pixel-notch-framed canvas, 16:9 (min 480px wide), rendering the **Sunset Valley** layer set (`layers/valley-sky/far/mid/front.png`) at factors `0.05 / 0.15 / 0.40 / 0.80`. Canvas is upscaled ×2 with `image-rendering: pixelated`.
- **Interaction:** dragging anywhere on the stage moves a virtual camera (cursor `grab` → `grabbing`); layers shift by `pos = base − cam × factor` in real time at 60fps. Before first interaction, the camera auto-sweeps in a gentle sine (amplitude 120px X, 24px Y, period 8s). First drag kills auto-sweep permanently for the session.
- HUD overlay chips (mono 11px, `--bg-2` at 85% + border): top-left `cam.x 000 · cam.y 000` live readout (teal numbers); bottom-right factor legend `0.05 → 0.80`; bottom-left hint chip `✥ DRAG TO MOVE CAMERA` (fades to 0 after first drag, 400ms).
- Below the stage: a thin control row — toggle switch `AUTO SWEEP` (mono 11px) + `RESET CAMERA` ghost button. (Same controls exist in the editor; this is a deliberate preview of the product's UI language.)

**Animation:**
- On load: eyebrow slides in (translateY 16px, 500ms expo) → H1 characters animate individually (translateY 110% → 0, rotate 2°→0, 40ms stagger, 700ms expo, overflow-hidden per char) → sub fades up (24px, 600ms, delay 200ms) → CTAs stagger up (80ms apart) → chips stagger (60ms).
- Hero stage: scales 0.96→1 + opacity 0→1 (800ms expo, delay 400ms); layers themselves slide in from their parallax offsets (back layer first, 120ms stagger, 900ms) as the auto-sweep starts.
- Background grid drifts at 0.1× scroll speed (decorative parallax).

---

## Section 2 — Spec Ticker (48px strip)

**Layout:** Full-width strip, `--bg-1`, top+bottom `--border` hairlines. Horizontally scrolling mono marquee (infinite loop, 30s duration, pause on hover).

**Content (mono 12px `--text-3`, separators are 8px amber squares):** `IMPORT PNG / JPG` ▪ `REORDER · RENAME · SHOW / HIDE` ▪ `FACTORX / FACTORY 0.00 — 1.00` ▪ `PER-LAYER SCALE + OFFSET` ▪ `DRAGGABLE VIRTUAL CAMERA` ▪ `AUTO-SWEEP PLAYBACK` ▪ `EXPORT SCENE.JSON` ▪ `AUTOSAVE → LOCALSTORAGE` ▪ *(loops)*

**Animation:** continuous CSS marquee; items are duplicated for seamless loop.

---

## Section 3 — The Problem (pinned scroll story, 160vh pin)

**Layout:** Pinned section (GSAP ScrollTrigger, pin for 160vh). Header block top-center: eyebrow `// THE PROBLEM`, H2 "Octopath's look without Octopath's budget.", lead paragraph (Inter 17px, `--text-2`, max 640px, centered): "Octopath Traveler and Wandering Sword built their 'HD-2D' look on Unreal Engine 4 — real 3D scenes, camera rigs, volumetric light. Gorgeous. Also a team-of-fifty, multi-year, engine-royalty affair. 99% of indie pixel games fake the same depth with plain 2D layers — and until now, the tooling for that was a TODO comment."

Below the header, two cards side by side (grid 2×1, gap 24, mobile stacks):

- **Card A — "THE 1% PATH"** (`--bg-1`, border): header mono chip `UE4 HD-2D PIPELINE`. Bullet list (Inter 15px, `--text-2`, lucide `X` icons in `--text-3`): "Full 3D scene + PBR lighting for a 2D-looking game" · "Camera rigs, DOF, volumetrics to maintain" · "Engine expertise + royalties" · mono stat footer: `TEAM: 20–50 · YEARS: 3+ · COST: $$$$$`.
- **Card B — "THE 99% PATH"** (border-strong, amber-tinted): header mono chip amber `LAYERED 2D PARALLAX`. Bullets (lucide `Check` in teal): "Draw your art once, in any pixel tool" · "Stack background → midground → foreground" · "Fake depth with one multiply: `pos − cam × factor`" · stat footer (amber): `TEAM: 1 · TIME: AN AFTERNOON · COST: $0`.
- Under Card B, a closing line appears: "PixelStage is the professional editor for the 99% path." (Inter 600 18px, `--text-1`).

**Animation (scroll-driven, progress 0→1 over the pin):**
- 0.0–0.3: header words slide up word-by-word (word-level split, 30ms stagger per word).
- 0.2–0.6: Card A slides in from left (x -60→0) and **dims** (opacity 1→0.45, saturate 1→0.4) as Card B slides in from right (x 60→0) and brightens with an amber border glow (`box-shadow` amber fade-in).
- 0.6–0.85: Card A's bullets strike through one by one (line-through draw, 120ms stagger); Card B's check items pop in (scale 0.8→1, back-out ease, 100ms stagger).
- 0.85–1.0: closing line fades up (16px); pin releases.

---

## Section 4 — How It Works (3 steps)

**Layout:** Header left-aligned: eyebrow `// WORKFLOW`, H2 "Three steps. One JSON.". Below: 3-column grid (gap 24, mobile stacks). Each step card: `--bg-1` border card, padding 32, min-height 320px.

1. **`01 / IMPORT`** (Silkscreen number in amber, 28px) — H3 "Drop in your layers". Body: "PNG or JPG, drag-and-drop or file picker. Background, midground, foreground — PixelStage stacks them onto a shared stage the moment they land." Visual: mini CSS mockup of the editor's empty canvas with a dashed drop zone and the `empty-state.svg` ghost, plus 2 file chips (`sky.png`, `hills.png`) that animate dropping into the zone on scroll.
2. **`02 / TUNE`** — H3 "Dial in the depth". Body: "factorX / factorY per layer — 0 locks it in place, 1 glues it to the camera. Add scale and offset, drag the virtual camera, and watch the scene breathe." Visual: mini mockup of two sliders (`factorX 0.40 ▓▓▓▓░░░░`, `factorY 0.12 ▓░░░░░░░`) that animate their handles as you scroll into view, with a live mono readout.
3. **`03 / EXPORT`** — H3 "Ship one file". Body: "Layer order, assets, factors, canvas size — one portable scene.json. Consume it from Phaser, Godot, Electron, or raw Canvas with the snippet in the guide." Visual: mini CodeBlock showing a 6-line JSON excerpt with the copy button.

**Animation:** cards stagger in (translateY 40px, opacity 0→1, 120ms stagger, trigger `top 78%`). Step 2's slider handles sweep once when in view (GSAP, 1.2s expo). Numbers count-up style flicker (pixel-font roll) on entry.

**Interaction:** each card's mini-mockup is hoverable — hovering the drop zone highlights the dashed border amber; hovering the sliders shows a tooltip with the exact value.

---

## Section 5 — Feature Grid

**Layout:** eyebrow `// THE TOOL`, H2 "An editor, not a toy.". 3×2 grid of cards (gap 16, mobile 1-col). Each card: `--bg-1`, border, padding 28, lucide icon in a 40px `--bg-3` bordered square (icon amber), H3 18px, body 15px `--text-2`.

1. **Layers** (`Layers` icon) — "Import, reorder, rename, show/hide, delete. Your stack stays organized, drag-and-drop simple."
2. **Per-layer parallax** (`SlidersHorizontal`) — "factorX and factorY from 0.00 to 1.00, scale, and offset — every layer gets its own depth signature."
3. **Virtual camera** (`Move` icon) — "Drag across the viewport to preview depth in real time, or hit auto-sweep and let the camera pan for you."
4. **Portable JSON** (`FileJson`) — "One scene file: order, assets, factors, canvas size. Engine-agnostic by design, versioned schema."
5. **Local-first autosave** (`HardDriveDownload`) — "Every keystroke persists to localStorage. Export/import project files to move between machines. No account, no cloud, no telemetry."
6. **Zero-dep runtime** (`Terminal`) — "Reproduce your scene with ~20 lines of plain Canvas 2D. Read every line — it's yours."

**Animation:** cards stagger up 40px, 90ms stagger, trigger 80%. Hover: translateY(-4px), border-strong, icon square flashes `--amber-dim`; icon rotates 6° on hover (150ms).

---

## Section 6 — "Your scene is a file" (JSON + runtime split)

**Layout:** eyebrow `// PORTABLE BY DESIGN`, H2 "Your scene is a file.", lead: "Export drops a single scene.json. This is a real export — and the runtime that renders it." Split grid (2 cols, gap 24, mobile stacks):

- **Left — CodeBlock `sunset-valley.json`** (realistic excerpt):
```json
{
  "version": 1,
  "canvas": { "width": 960, "height": 540 },
  "layers": [
    { "name": "sky",    "src": "valley-sky.png",   "factorX": 0.05, "factorY": 0.02, "scale": 1, "offsetX": 0, "offsetY": 0, "visible": true },
    { "name": "hills",  "src": "valley-far.png",   "factorX": 0.15, "factorY": 0.05, "scale": 1, "offsetX": 0, "offsetY": 0, "visible": true },
    { "name": "shrine", "src": "valley-mid.png",   "factorX": 0.40, "factorY": 0.12, "scale": 1, "offsetX": 0, "offsetY": 0, "visible": true },
    { "name": "grass",  "src": "valley-front.png", "factorX": 0.80, "factorY": 0.20, "scale": 1, "offsetX": 0, "offsetY": 0, "visible": true }
  ]
}
```
- **Right — CodeBlock `runtime.js`** (first ~14 lines of the guide's snippet) + below it, 3 bullet points (Inter 15px): "**One multiply.** `screen = base + offset − cam × factor` — that's the whole engine." / "**No dependencies.** Plain Canvas 2D, `imageSmoothingEnabled = false`." / "**Any host.** Phaser, Godot, Electron, or a bare `<canvas>`."
- CTA row: **Read the full guide** (secondary) · **Copy runtime** (ghost, copies snippet).

**Animation:** both code blocks slide in from opposite sides (x ±40, 700ms expo, trigger 80%); a teal caret types the last JSON line character-by-character on entry (30ms/char); bullets stagger up 80ms.

---

## Section 7 — Gallery Teaser

**Layout:** eyebrow `// SCENES`, H2 "Made with PixelStage.", right-aligned ghost link "Browse the gallery →". Horizontal row of 3 scene cards (equal width, gap 20; mobile: horizontal scroll-snap).

Each card: 16:9 **live mini parallax canvas** (auto-sweeping, factors per design.md presets; rAF only while visible), below it: scene name (Inter 600 16px), layer count + factor range MonoChips (`4 LAYERS`, `0.05–0.80`). Cards: **Sunset Valley**, **Neon Alley**, **Ember Dungeon**.

**Animation:** cards stagger up 60px / 100ms stagger; canvases fade in after card lands (300ms). Hover: card lifts -4px, border-strong, canvas sweep speeds up 1.5× (eases over 400ms) and shows a `DRAG ME` chip — the mini canvases are draggable too.

---

## Section 8 — Open Source

**Layout:** Centered narrow block (max 680px). eyebrow `// OPEN SOURCE`, H2 "Free as in freedom.", body (17px, centered): "PixelStage is MIT-licensed and built in the open by an indie dev who needed it for their own Wandering-Sword-style pixel game. Every line of the render loop is meant to be read, forked, and shipped inside your game. Issues, PRs, and gallery submissions welcome."
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

## Assets used (from design.md manifest)
`logo.svg` · `layers/valley-sky.png` · `layers/valley-far.png` · `layers/valley-mid.png` · `layers/valley-front.png` · `layers/alley-back.png` · `layers/alley-mid.png` · `layers/alley-front.png` · `layers/dungeon-back.png` · `layers/dungeon-mid.png` · `layers/dungeon-front.png` · `empty-state.svg` (step-1 mockup)
