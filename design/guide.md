# Guide (`/guide`) — Getting Started & JSON Reference

**Purpose:** The docs page. Gets a developer from zero to a rendered parallax scene in their own engine: quick start, the parallax model explained, full JSON schema reference, the ~20-line runtime snippet, engine-specific recipes, and FAQ.

**Chrome:** Marketing Navbar + Footer. Lenis smooth scroll. Layout: 2-column docs shell — sticky left TOC (224px, desktop only) + main column (max 760px). Sections separated by `--border` hairlines with 96px padding. On mobile, TOC collapses into a sticky top chip-bar with horizontal scroll.

**Left TOC (sticky, top 96px):** mono 12px links — `01 QUICK START` · `02 THE PARALLAX MODEL` · `03 SCENE.JSON FORMAT` · `04 RUNTIME SNIPPET` · `05 ENGINE RECIPES` · `06 FAQ`. Active item: amber text + 2px amber left bar; ScrollTrigger spy updates on scroll; click smooth-scrolls with -80px offset. Hover: `--text-1`.

---

## Section 01 — Quick Start

**Header:** eyebrow `// DOCS`, H1 (Inter 700 36px): "Getting started with PixelStage", lead (17px, `--text-2`): "From layered art to a running parallax scene in about five minutes. Everything below is real — the JSON, the math, the snippet."

**Numbered steps** (each: Silkscreen amber number 24px + H3 20px + body 16px + a compact visual):

1. **`01` — Import your layers.** "Open the editor and drag your PNG/JPG layers onto the canvas — background first, then midground, foreground. Or press **Load demo scene** to explore with the Sunset Valley set." Visual: inline 16:9 mockup of the editor canvas with the dashed drop overlay state; clicking it routes to `/editor`.
2. **`02` — Tune the depth.** "Select a layer and set factorX / factorY. Drag the camera (or hit Space for auto-sweep) and watch `screen = base + offset − cam × factor` do its thing." Visual: two synced mini sliders + a live mono readout chip that animates when hovered.
3. **`03` — Export and render.** "Export scene.json, drop it next to your assets, and render it with the snippet in section 04. The pixels will match the editor exactly." Visual: 8-line JSON excerpt CodeBlock + download button (downloads the real demo scene JSON).

**Animation:** H1 block fades up (24px, 600ms) on load; each step slides up 32px, 100ms stagger, trigger 80%; step numbers flicker-in pixel-style (opacity steps 0→0.5→1, 3 frames).

---

## Section 02 — The Parallax Model

**H2:** "One multiply is the whole engine."
**Body (16px/1.7):** "Every layer sits on a shared stage. When the camera moves, each layer shifts in the opposite direction, scaled by its factor:"

**Formula block** (centered, mono 18px in a `--bg-1` bordered card, padding 24):
`screenPos = layerBase + layerOffset − cameraPos × layerFactor`

**Factor semantics table** (full-width table, mono values, `--border` row lines):

| Factor | Behavior | Typical use |
|---|---|---|
| `0.00` | Locked to the screen — never moves | UI overlays, vignettes |
| `0.05 – 0.20` | Barely drifts — feels infinitely far | Sky, distant mountains |
| `0.30 – 0.55` | The classic midground | Hills, trees, buildings |
| `0.70 – 0.90` | Close and fast | Foreground grass, props |
| `1.00` | Glued to the camera plane | The ground the player walks on |

**Diagram:** `factor-diagram.svg` full-width in a `--bg-1` card — shows the camera arrow and three layers displacing proportionally.

**Note card** (teal left bar, `--teal-dim`): "factorX and factorY are independent. Most pixel scenes keep factorY small (0.02–0.2) so vertical movement feels subtle — or lock it to 0 entirely."

**Animation:** formula card scales 0.98→1 + border-glow on entry; table rows stagger 40ms; diagram slides up 24px; hovering a table row highlights it and the matching strip in the diagram pulses amber (linked via row hover → SVG class toggle).

---

## Section 03 — scene.json Format

**H2:** "The whole scene is one file."
**Body:** "Export writes a single JSON document. Version 1 of the schema is frozen — your scenes will keep rendering forever."

**Schema reference table** (columns: Field · Type · Default · Description; mono for field/type, Inter 14px for description):

| Field | Type | Default | Description |
|---|---|---|---|
| `version` | `number` | `1` | Schema version. |
| `canvas.width / height` | `number` | — | Stage size in pixels. |
| `layers[]` | `array` | `[]` | Back-to-front order — index 0 is farthest. |
| `layer.name` | `string` | — | Display name from the layer list. |
| `layer.src` | `string` | — | Asset filename, or base64 dataURL if embedded at export. |
| `layer.factorX / factorY` | `number` | `0.5 / 0.2` | Parallax factor per axis, `0.00 – 1.00`. |
| `layer.scale` | `number` | `1` | Uniform draw scale, `0.10 – 4.00`. |
| `layer.offsetX / offsetY` | `number` | `0` | Base position shift on the stage. |
| `layer.visible` | `boolean` | `true` | Skip rendering when false. |

**Full example** — CodeBlock `sunset-valley.json` (complete 4-layer export, as in home.md §6) with Copy button.

**Animation:** table rows stagger in 50ms from opacity 0 + y 8px; code block slides from right 32px; field names in the table highlight amber on hover and scroll-spy the matching key in the example JSON below (smooth-scroll + 1.2s line highlight).

---

## Section 04 — Runtime Snippet

**H2:** "Render it anywhere in ~20 lines."
**Body:** "No dependency, no build step. Plain Canvas 2D. Read every line — then paste it into your game."

**CodeBlock `runtime.js`** (line numbers on, full snippet):
```js
// runtime.js — render a PixelStage scene with plain Canvas 2D
export async function loadScene(url, canvas) {
  const scene = await (await fetch(url)).json();
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;              // crisp pixels, always
  canvas.width = scene.canvas.width;
  canvas.height = scene.canvas.height;

  const layers = await Promise.all(scene.layers.map(async (l) => {
    const img = new Image();
    img.src = l.src;                              // file or embedded dataURL
    await img.decode();
    return { ...l, img };
  }));

  const camera = { x: 0, y: 0 };                  // drive this from your game
  return function render() {
    for (const l of layers) {                     // back → front
      if (!l.visible) continue;
      const x = l.offsetX - camera.x * l.factorX; // the one multiply
      const y = l.offsetY - camera.y * l.factorY;
      ctx.drawImage(l.img, x, y, l.img.width * l.scale, l.img.height * l.scale);
    }
  };
}
```

**Annotation bullets** (3, Inter 15px, mono inline refs): "`imageSmoothingEnabled = false` keeps pixels crisp at any scale." · "The loop draws back-to-front — exactly the editor's layer list order." · "`camera` is yours: bind it to a player, a mouse, or a cutscene timeline."

**Try-it card** (amber-bordered): "Want to verify it? Export the demo scene, serve the folder with any static server, and call `loadScene('./sunset-valley.json', canvas)`. Animate `camera.x` and compare against the editor — pixel for pixel." + **Download demo scene.json** secondary button.

**Animation:** code block slides up 32px; on entry the final `}` line types character-by-character (25ms/char); bullets stagger 80ms; try-it card gets a one-time amber glow sweep (gradient translate, 900ms).

---

## Section 05 — Engine Recipes (Accordion)

**H2:** "Using your engine?" — shadcn Accordion, 3 items, mono chevrons, 250ms height animation with expo easing:

1. **Phaser 3** — "Load the JSON in `preload()`, `this.add.image()` per layer with `setScrollFactor(factorX, factorY)` — Phaser's scrollFactor *is* the PixelStage factor, zero math required. Keep `pixelArt: true` in game config."
2. **Godot 4** — "Use a `ParallaxBackground` + `ParallaxLayer` per layer; set `motion_scale = Vector2(1 − factorX, 1 − factorY)` (Godot's scale is inverse — one subtraction). Or draw manually in `_draw()` with the same formula."
3. **Electron / bare web** — "The snippet in section 04 is production-ready. Wrap it in a `requestAnimationFrame` loop, drive `camera` from input, and ship."

Each item body: 15px Inter + a 3–5 line mono code fragment. **Animation:** content fades in 200ms after height opens.

---

## Section 06 — FAQ (Accordion)

**H2:** "Questions, answered."
1. **Is my art uploaded anywhere?** — "No. PixelStage is a static page with zero backend. Images live in your browser's memory and localStorage; export travels as a file you download. Check the network tab — it's silent."
2. **Can I use it commercially?** — "Yes. MIT license — use the tool, the JSON, and the runtime snippet in any game, commercial or not. Attribution appreciated, never required."
3. **What engines does the export support?** — "Anything that can draw images and read JSON. The format is deliberately boring: order, src, factors, scale, offset."
4. **How do I choose good factors?** — "Start with sky 0.05, far 0.15, mid 0.4, front 0.8. Then drag the camera and trust your eyes — depth should feel like looking through a window, not a conveyor belt."
5. **Why not Tiled / LDtk / Aseprite?** — "Different jobs: Tiled and LDtk edit tilemaps, Aseprite edits sprites. None of them choreograph multi-layer parallax scenes with camera preview. PixelStage does exactly that one job."
6. **Big images? Storage limits?** — "localStorage holds ~5MB; the editor warns at 80% and project-file export (with embedded base64) is the escape hatch for heavy scenes."

**Animation:** standard accordion; question rows hover to `--bg-3`; first item auto-opens on scroll entry (300ms delay).

---

## Closing CTA band (shared pattern with home)

Centered: Silkscreen 20px `READY WHEN YOU ARE▮` + **Open the Editor** primary + **Browse example scenes** ghost.
**Animation:** fade up 24px; caret blinks.

---

## Assets used
`factor-diagram.svg` · (demo JSON downloads reference `layers/valley-*.png`) · all else typographic/code.
