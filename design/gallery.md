# Gallery (`/gallery`) — Example Scene Gallery

**Purpose:** Prove the format with real, inspectable scenes. Every card is a *live* HD-2D stage (the same `StageCanvas3D` engine as the editor, playing a camera path over the real depths + effects), openable in the editor, downloadable as scene.json, and decomposable via an exploded layer-stack view.

**Chrome:** Marketing Navbar + Footer. Lenis smooth scroll. Max width 1200px.

---

## Section 1 — Header

**Layout:** Left-aligned block, padding-top 160px (under fixed navbar).
- Eyebrow: `// SCENE GALLERY`
- H1 (Inter 700 36px): "Scenes, ready to dissect."
- Lead (17px, `--text-2`, max 560px): "Every scene below is a real PixelStage export — drag the previews, explode the layer stacks, open them in the editor, or download the JSON and render it with the three.js runtime."
- **Filter chip row** (margin-top 24, gap 8): `ALL` (default active) · `TOWN` · `NATURE` · `INTERIOR` · `URBAN` — MonoChip-sized buttons; active = amber text + `--amber-dim` bg + amber border; inactive = `--bg-2` border `--text-3`. Filtering animates cards out/in (scale 0.92→1 + fade, 200ms, stagger 60ms).

**Animation:** eyebrow → H1 → lead → chips stagger up (24px, 80ms stagger, 600ms expo) on load.

---

## Section 2 — Scene Grid

**Layout:** responsive grid — 2 columns desktop (cards are cinematic, min 480px wide), 1 column mobile; gap 24. Each **SceneCard** (`--bg-1`, 1px `--border`, radius 6px, overflow hidden):

**Card top — live preview (16:9):**
- `StageCanvas3D` rendering the scene's real depths, orientation, lighting and fog/DOF, auto-playing the sweep camera path. rAF only while in viewport.
- **Drag interaction:** pointer-drag pans the camera (path playback pauses, resumes after 3s idle). Cursor grab/grabbing. A `DRAG` hint chip appears bottom-left on first hover, fades permanently after first drag.
- Top-right overlay chips (mono 10px, `--bg-2`/85%): `960×540` · `6 LAYERS`.
- Hover: preview scale 1.00→1.03 (400ms expo), path playback eases to 1.4× speed.

**Card body (padding 20):**
- Row 1: scene title (Inter 600 18px) + right-aligned tag chip (e.g. `NATURE`).
- Row 2: one-line description (Inter 14px, `--text-2`).
- Row 3: depth stack — one tiny row per layer, back→front: mono 11px `--text-3`: `sky ────── depth +700` … `grass fringe ─ depth −300` (names `--text-1`, values teal; max 4 rows shown, ground planes tagged `ground`).
- Row 4 (buttons, gap 8, margin-top 16): **Open in Editor** (primary compact, lucide `ExternalLink`) · **JSON ↓** (secondary compact, lucide `Download`) · **Explode** (ghost compact, lucide `Layers`, opens detail modal §3).

**The four scenes:**

1. **Goldenhollow Village** — tag `TOWN` — "Golden hour over a half-timbered market town: dithered dusk sky, cobblestone square, a market stall and two travelers, all in real HD-2D depth." Layers `sky +700 (unlit) · town silhouette +400 · houses +180 · market square 0 · warrior +10 · merchant +34 · cobblestone square (ground) · grass fringe −300`. 8 layers, dusk fog + DOF.
2. **Stillsnow Pass** — tag `NATURE` — "Moonlit snowfield: snow-laden pines, distant cabins with the only warm windows in a blue world, and a pilgrim following footprints to a snow-capped gate." Layers `night sky +700 (unlit) · mountains & cabins +420 · snow pines +160 · shrine gate 0 · pilgrim +10 · snowfield (ground) · snowdrift fringe −300`. 7 layers, cold fog + DOF + falling snow.
3. **Emberhold Ruins** — tag `INTERIOR` — "Torch-lit ruins: rune pillars and a teal archway, god rays through ceiling cracks, a glinting chest — and a mage who found it first." Layers `cavern wall +650 (unlit) · pillars & arch +300 · near pillars +120 · god rays +60 (unlit) · treasure 0 · mage +15 · flagstone floor (ground) · spikes & chains −300`. 8 layers, dark fog + DOF + drifting embers.
4. **Neon Alley** — tag `URBAN` — "Rain-slick neon corridor: mullioned windows, glyph-slotted signs with white-hot tubes, wet asphalt mirroring it all — and a runner with a glowing umbrella." Layers `back wall +700 (unlit) · mid facades +350 · neon signs +120 · runner +10 · wet asphalt (ground) · foreground junk −300`. 6 layers, teal-dark fog + DOF + drizzle.

**Animation:** cards stagger up 48px, 120ms stagger, trigger `top 82%`; preview canvases fade in 300ms after their card lands. Filter changes: exit cards scale 0.92 + fade 150ms, entering cards reverse.

**Interactions summary:** drag preview = camera pan · Open in Editor = seed the local save with the scene then `router.push('/editor')` (editor's restore flow shows "Project restored" toast) · JSON ↓ = downloads `<scene>.json` (embedded dataURLs — the generated layers are always self-contained) · Explode = detail modal.

---

## Section 3 — Scene Detail Modal ("Explode")

**Layout:** shadcn Dialog, 880px, `--bg-1`, two-column inside (60% visual / 40% data), mobile stacks.

**Left — Exploded stack view (the signature interaction):**
- The scene's layers rendered as absolutely-stacked `<img>`s in a `perspective: 1200px` container. Default (flat): composite preview, gently auto-playing via the same `StageCanvas3D` mini-loop.
- Toggle **`EXPLODED VIEW`** (Switch, mono label) → CSS 3D transition (700ms expo): container `rotateX(52deg) rotateZ(-8deg)`, layers fan apart along Z (`translateZ` proportional to real scene depth, farthest lowest), each gaining a 1px border + a floating mono label chip at its left edge (`depth +700`, teal). Slow idle float: layers bob ±4px out of phase (3s, sine). Mouse-move over the container tilts the whole stack ±4° (spring-back on leave).
- Under it: mono caption `layer separation = depth · drag to orbit (subtle)`.

**Right — data column:**
- Scene title (Inter 600 22px) + tag chip.
- Mono stat grid (2×2, `--bg-2` cells): `LAYERS 6` · `CANVAS 960×540` · `DEPTH RANGE −300…+700` · `SIZE 2.4MB`.
- Full layer table (rows: thumbnail 28px · name · `depth` mono teal, ground planes tagged) with the deepest row first, connected by a 1px vertical teal line on the left edge (visual "stack").
- JSON excerpt CodeBlock (first layer object only, 8 lines) + **Copy full JSON** ghost + **Download JSON** secondary + **Open in Editor** primary (stacked, full width).

**Animation:** dialog scale 0.95→1 + fade (220ms expo); layers fan out with 80ms per-layer stagger after the toggle flips; table rows stagger 50ms.

---

## Section 4 — Submit CTA band

**Layout:** centered narrow block (max 620px), `--bg-1` card with dashed `--border-strong` border (submission-energy), padding 48.
- Silkscreen 18px: `BUILT A SCENE?`
- Body (15px, `--text-2`): "The gallery grows by pull request. Export your scene.json with embedded assets, open a PR against `gallery/`, and your pixels join this page."
- **Contribute on GitHub** secondary button (Github icon).

**Animation:** dashed border draws in (SVG dashoffset, 1s) on scroll entry; content fades up 20px.

---

## Section 5 — Cross-links strip

Three ghost-link cards in a row (mono 13px, arrow icons): `READ THE GUIDE →` · `JSON FORMAT REFERENCE →` · `LAUNCH THE EDITOR →`. Hover: arrow slides 4px right, text goes amber. Fade-up stagger on entry.

---

## Footer
Global footer.

---

## Assets used
All scene art is **programmatically generated at runtime** by `src/core/placeholder/` (seeded, deterministic — ground planes + staggered billboards + chibi characters per theme) — every preview, exploded view and download uses the same generated layers; `logo.svg`.
