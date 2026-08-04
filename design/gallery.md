# Gallery (`/gallery`) — Example Scene Gallery

**Purpose:** Prove the format with real, inspectable scenes. Every card is a *live* parallax stage (auto-sweeping canvas using the actual layers + factors), openable in the editor, downloadable as scene.json, and decomposable via an exploded layer-stack view.

**Chrome:** Marketing Navbar + Footer. Lenis smooth scroll. Max width 1200px.

---

## Section 1 — Header

**Layout:** Left-aligned block, padding-top 160px (under fixed navbar).
- Eyebrow: `// SCENE GALLERY`
- H1 (Inter 700 36px): "Scenes, ready to dissect."
- Lead (17px, `--text-2`, max 560px): "Every scene below is a real PixelStage export — drag the previews, explode the layer stacks, open them in the editor, or download the JSON and render it with the 20-line snippet."
- **Filter chip row** (margin-top 24, gap 8): `ALL` (default active) · `NATURE` · `URBAN` · `INTERIOR` — MonoChip-sized buttons; active = amber text + `--amber-dim` bg + amber border; inactive = `--bg-2` border `--text-3`. Filtering animates cards out/in (scale 0.92→1 + fade, 200ms, stagger 60ms).

**Animation:** eyebrow → H1 → lead → chips stagger up (24px, 80ms stagger, 600ms expo) on load.

---

## Section 2 — Scene Grid

**Layout:** responsive grid — 2 columns desktop (cards are cinematic, min 480px wide), 1 column mobile; gap 24. Each **SceneCard** (`--bg-1`, 1px `--border`, radius 6px, overflow hidden):

**Card top — live preview (16:9):**
- Canvas rendering the scene's layers back-to-front with its real factors, auto-sweeping (sine X amplitude ~10% of width, period 7s). rAF only while in viewport.
- **Drag interaction:** pointer-drag moves the camera (auto-sweep pauses, resumes after 2.5s idle). Cursor grab/grabbing. A `DRAG` hint chip appears bottom-left on first hover, fades permanently after first drag.
- Top-right overlay chips (mono 10px, `--bg-2`/85%): `960×540` · `4 LAYERS`.
- Hover: preview scale 1.00→1.03 (400ms expo), sweep eases to 1.4× speed.

**Card body (padding 20):**
- Row 1: scene title (Inter 600 18px) + right-aligned tag chip (e.g. `NATURE`).
- Row 2: one-line description (Inter 14px, `--text-2`).
- Row 3: factor stack — one tiny row per layer, back→front: mono 11px `--text-3`: `sky ────── fx 0.05` … `grass ─ fx 0.80` (names `--text-1`, values teal; max 4 rows shown).
- Row 4 (buttons, gap 8, margin-top 16): **Open in Editor** (primary compact, lucide `ExternalLink`) · **JSON ↓** (secondary compact, lucide `Download`) · **Explode** (ghost compact, lucide `Layers`, opens detail modal §3).

**The three scenes:**

1. **Sunset Valley** — tag `NATURE` — "Dusk over a shrine valley: dithered sky, misty ridge, lantern-lit gate, silhouette grass." Layers `valley-sky/far/mid/front` at `fx 0.05/0.15/0.40/0.80`, `fy 0.02/0.05/0.12/0.20`. 4 layers.
2. **Neon Alley** — tag `URBAN` — "Rain-slick cyberpunk alley: glowing windows, kanji neon, hanging wires, foreground junk." Layers `alley-back/mid/front` at `fx 0.10/0.35/0.85`, `fy 0.04/0.10/0.18`. 3 layers.
3. **Ember Dungeon** — tag `INTERIOR` — "Torch-lit cavern: rune pillars, a teal-glowing archway, spikes and chains up front." Layers `dungeon-back/mid/front` at `fx 0.08/0.45/0.90`, `fy 0.03/0.08/0.15`. 3 layers.

**Animation:** cards stagger up 48px, 120ms stagger, trigger `top 82%`; preview canvases fade in 300ms after their card lands. Filter changes: exit cards scale 0.92 + fade 150ms, entering cards reverse.

**Interactions summary:** drag preview = camera · Open in Editor = seed `pixelstage.project.v1` localStorage with the scene then `router.push('/editor')` (editor's restore flow shows "Project restored" toast) · JSON ↓ = downloads `<scene>.json` with filenames as `src` (matching repo asset layout) · Explode = detail modal.

---

## Section 3 — Scene Detail Modal ("Explode")

**Layout:** shadcn Dialog, 880px, `--bg-1`, two-column inside (60% visual / 40% data), mobile stacks.

**Left — Exploded stack view (the signature interaction):**
- The scene's layers rendered as absolutely-stacked `<img>`s in a `perspective: 1200px` container. Default (flat): composite preview, gently auto-sweeping via CSS background-position… no — via the same canvas mini-loop.
- Toggle **`EXPLODED VIEW`** (Switch, mono label) → CSS 3D transition (700ms expo): container `rotateX(52deg) rotateZ(-8deg)`, layers fan apart along Z (`translateZ` = index × 56px, back layer lowest), each gaining a 1px border + a floating mono label chip at its left edge (`fx 0.05`, teal). Slow idle float: layers bob ±4px out of phase (3s, sine). Mouse-move over the container tilts the whole stack ±4° (spring-back on leave).
- Under it: mono caption `layer separation = depth · drag to orbit (subtle)`.

**Right — data column:**
- Scene title (Inter 600 22px) + tag chip.
- Mono stat grid (2×2, `--bg-2` cells): `LAYERS 4` · `CANVAS 960×540` · `FX RANGE 0.05–0.80` · `SIZE 2.4MB`.
- Full layer table (rows: thumbnail 28px · name · `fx`/`fy` mono teal) with the deepest row first, connected by a 1px vertical teal line on the left edge (visual "stack").
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
`layers/valley-*.png` (4) · `layers/alley-*.png` (3) · `layers/dungeon-*.png` (3) — every preview, exploded view, and download uses the same files; `logo.svg`.
