# Guide (`/guide`) — Getting Started & JSON Reference

**Purpose:** The docs page. Gets a developer from zero to a rendered HD-2D scene in their own engine: quick start, the depth model explained, full JSON schema reference, the three.js runtime snippet, engine-specific recipes, and FAQ.

**Chrome:** Marketing Navbar + Footer. Lenis smooth scroll. Layout: 2-column docs shell — sticky left TOC (224px, desktop only) + main column (max 760px). Sections separated by `--border` hairlines with 96px padding. On mobile, TOC collapses into a sticky top chip-bar with horizontal scroll.

**Left TOC (sticky, top 96px):** mono 12px links — `01 QUICK START` · `02 THE DEPTH MODEL` · `03 SCENE.JSON FORMAT` · `04 RUNTIME SNIPPET` · `05 ENGINE RECIPES` · `06 FAQ`. Active item: amber text + 2px amber left bar; ScrollTrigger spy updates on scroll; click smooth-scrolls with -80px offset. Hover: `--text-1`.

---

## Section 01 — Quick Start

**Header:** eyebrow `// DOCS`, H1 (Inter 700 36px): "Getting started with PixelStage", lead (17px, `--text-2`): "From layered art to a running HD-2D scene in about five minutes. Everything below is real — the JSON, the math, the snippet."

**Numbered steps** (each: Silkscreen amber number 24px + H3 20px + body 16px + a compact visual):

1. **`01` — Import your layers.** "Open the editor and drag your PNG/JPG layers onto the canvas — sky, midground, ground, foreground. Or press **Load demo scene** to explore with the Goldenhollow Village set." Visual: inline 16:9 mockup of the editor canvas with the dashed drop overlay state; clicking it routes to `/editor`.
2. **`02` — Stage the depth.** "Select a layer and set its **depth** — 0 is the focal plane where pixels render 1:1, positive recedes, negative jumps in front. Flip the floor layer to `ground` orientation so it recedes to the horizon. Then drag the camera (or hit Space for a camera path) and watch perspective do its thing." Visual: a depth slider + a live parallax readout chip (`depth +350 → parallax ×0.68`) that animates when hovered.
3. **`03` — Export and render.** "Export scene.json — embedded, or as a zip with `assets/*.png` — and render it with the three.js snippet in section 04. The pixels will match the editor exactly." Visual: 8-line JSON excerpt CodeBlock + download button (downloads the real demo scene JSON).

**Animation:** H1 block fades up (24px, 600ms) on load; each step slides up 32px, 100ms stagger, trigger 80%; step numbers flicker-in pixel-style (opacity steps 0→0.5→1, 3 frames).

---

## Section 02 — The Depth Model

**H2:** "Perspective is the whole engine."
**Body (16px/1.7):** "Every layer is a textured plane hanging in a real 3D scene. When the perspective camera moves, each layer shifts and scales by its depth — parallax, occlusion and foreshortening are real, not faked per axis:"

**Formula block** (centered, mono 18px in a `--bg-1` bordered card, padding 24):
`screenScale = D / (D + depth)` — with `D = focalDistance(canvas, fov)` ≈ 742px at 960×540 / 40°.

**Depth semantics table** (full-width table, mono values, `--border` row lines):

| Depth | Reads as | Typical use |
|---|---|---|
| `−400 … −100` | In front of the focal plane | Foreground occluders, grass fringe (blurs with DOF) |
| `0` | The focal plane — pixels 1:1 | The ground the player walks on, hero props |
| `+100 … +300` | Midground | Trees, facades, pillars |
| `+400 … +800` | Far | Mountains, skyline, sky (scale up to compensate) |

**Orientation & light:** "`vertical` = billboard facing the camera. `ground` = the plane lies flat and recedes to the horizon — the Octopath floor. `lit: false` renders full-bright, ignoring scene lights (skies, glow overlays)."

**Diagram:** `depth-diagram.svg` full-width in a `--bg-1` card — shows the camera frustum and planes at staggered z depths plus one ground plane receding.

**Note card** (teal left bar, `--teal-dim`): "Opening a v1 file (`factorX`/`factorY`)? It migrates automatically: `depth = D·(1 − factorX)`. factorY has no 3D equivalent and is dropped."

**Animation:** formula card scales 0.98→1 + border-glow on entry; table rows stagger 40ms; diagram slides up 24px; hovering a table row highlights it and the matching plane in the diagram pulses amber (linked via row hover → SVG class toggle).

---

## Section 03 — scene.json Format

**H2:** "The whole scene is one file."
**Body:** "Export writes a single JSON document. Schema version 2 (HD-2D); v1 files migrate on open, so your scenes keep rendering forever."

**Schema reference table** (columns: Field · Type · Default · Description; mono for field/type, Inter 14px for description):

| Field | Type | Default | Description |
|---|---|---|---|
| `version` | `number` | `2` | Schema version. |
| `canvas.width / height` | `number` | — | Stage size in pixels. |
| `camera.position / target` | `vec3` | — | Perspective camera, px, UI coords (y down). |
| `camera.fov` | `number` | `40` | Vertical field of view, degrees (20–90). |
| `effects.dof` | `object` | off | `{ enabled, focus (world depth), aperture 0–1 }`. |
| `effects.fog` | `object` | off | `{ enabled, color, near, far }`. |
| `effects.ambient / sun` | `object` | — | Light color + intensity; sun adds `azimuth`/`elevation` (deg). |
| `layers[]` | `array` | `[]` | Back-to-front order — index 0 is farthest. |
| `layer.name` | `string` | — | Display name from the layer list. |
| `layer.src` | `string` | — | Asset path (`assets/*.png` in zip exports), or base64 dataURL if embedded. |
| `layer.depth` | `number` | `0` | Z position in px. `0` = focal plane, `>0` farther, `<0` nearer. |
| `layer.orientation` | `string` | `"vertical"` | `"vertical"` billboard · `"ground"` floor plane receding to the horizon. |
| `layer.lit` | `boolean` | `true` | `false` = full-bright, ignores scene lights. |
| `layer.scale` | `number` | `1` | Uniform draw scale, `0.10 – 4.00`. |
| `layer.offsetX / offsetY` | `number` | `0` | World position on the stage (UI coords, y down). |
| `layer.visible` | `boolean` | `true` | Skip rendering when false. |

**Full example** — CodeBlock `goldenhollow-village.json` (complete v2 export, as in home.md §6) with Copy button.

**Animation:** table rows stagger in 50ms from opacity 0 + y 8px; code block slides from right 32px; field names in the table highlight amber on hover and scroll-spy the matching key in the example JSON below (smooth-scroll + 1.2s line highlight).

---

## Section 04 — Runtime Snippet

**H2:** "Render it anywhere with three.js — no build step."
**Body:** "One HTML file, one CDN import map. The snippet is the editor's own engine logic, line for line. Read every line — then paste it into your game."

**CodeBlock `runtime.html`** (line numbers on, full snippet from the export modal):
```html
<!-- index.html — play a PixelStage v2 scene with three.js -->
<script type="importmap">
  { "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js" } }
</script>
<script type="module">
import * as THREE from "three";
const scene = await (await fetch("./scene.json")).json();
// per layer: TextureLoader → NearestFilter → PlaneGeometry →
//   lit ? MeshLambertMaterial : MeshBasicMaterial
//   ground ? rotate flat, pivot at near edge : billboard facing camera
//   mesh.position.set(offsetX + w/2, H − offsetY − h/2, −depth)
// lights: AmbientLight + DirectionalLight from scene.effects
// camera: PerspectiveCamera(fov) — UI coords y-down → three y-up flip
renderer.setAnimationLoop(() => renderer.render(world, cam));
</script>
```

**Annotation bullets** (3, Inter 15px, mono inline refs): "`NearestFilter` keeps pixels crisp at any scale — non-negotiable." · "Ground planes rotate flat with the pivot at the near edge, so the texture recedes to the horizon on its own." · "The camera is yours: bind it to a player, a mouse, or a cutscene timeline."

**Try-it card** (amber-bordered): "Want to verify it? Export the demo scene (embed off → zip), unzip, serve the folder with any static server, and open `runtime.html` next to `scene.json`. Compare against the editor — pixel for pixel." + **Download demo scene.json** secondary button.

**Animation:** code block slides up 32px; on entry the final line types character-by-character (25ms/char); bullets stagger 80ms; try-it card gets a one-time amber glow sweep (gradient translate, 900ms).

---

## Section 05 — Engine Recipes (Accordion)

**H2:** "Using your engine?" — shadcn Accordion, 3 items, mono chevrons, 250ms height animation with expo easing:

1. **Any web host / Electron** — "The runtime.html snippet in section 04 is production-ready. three.js comes from a CDN import map — no bundler. Drive the camera from input and ship."
2. **Bundled three.js (Vite/webpack game)** — "`npm i three`, replace the import map with your normal import, and copy the per-layer mesh setup verbatim — it's the same code the editor runs (`src/core/stage3d.ts`)."
3. **2D engines (Phaser / Godot)** — "Approximate the perspective: a billboard at `depth` pans like a classic parallax layer with `factor = 1 − depth/D` (D ≈ 742px at 960×540/40°) — the inverse of the v1 migration. Phaser: `setScrollFactor(f)`. Godot: `ParallaxLayer.motion_scale = Vector2(1 − f, 1 − f)`. Ground planes and DOF have no 2D equivalent — that's the point of the 3D runtime."

Each item body: 15px Inter + a 3–5 line mono code fragment. **Animation:** content fades in 200ms after height opens.

---

## Section 06 — FAQ (Accordion)

**H2:** "Questions, answered."
1. **Is my art uploaded anywhere?** — "No. PixelStage is a static page (or a sandboxed desktop app) with zero backend. Images live in your machine's memory and localStorage/IndexedDB; export travels as a file you download. Check the network tab — it's silent."
2. **Can I use it commercially?** — "Yes. MIT license — use the tool, the JSON, and the runtime snippet in any game, commercial or not. Attribution appreciated, never required."
3. **What engines does the export support?** — "Anything that can run three.js — which is any webview — plus a documented JSON you can translate. The format is deliberately boring: order, src, depth, orientation, lit, scale, offset."
4. **How do I choose good depths?** — "Start with sky +700 (unlit, scale ~2), mids +150/+350, hero props at 0, the floor as a `ground` plane near −100, and a foreground frame at −300. Then orbit the camera and trust your eyes."
5. **Why not Tiled / LDtk / Aseprite?** — "Different jobs: Tiled and LDtk edit tilemaps, Aseprite edits sprites. None of them choreograph layered scenes in real depth with a camera preview. PixelStage does exactly that one job."
6. **Big images? Storage limits?** — "Images up to 4096px / 8MB each. The editor warns at 80% storage; project-file export (with embedded base64) or the zip export is the escape hatch for heavy scenes."

**Animation:** standard accordion; question rows hover to `--bg-3`; first item auto-opens on scroll entry (300ms delay).

---

## Closing CTA band (shared pattern with home)

Centered: Silkscreen 20px `READY WHEN YOU ARE▮` + **Open the Editor** primary + **Browse example scenes** ghost.
**Animation:** fade up 24px; caret blinks.

---

## Assets used
`depth-diagram.svg` · demo JSON downloads are generated by `src/core/placeholder.ts` · all else typographic/code.
