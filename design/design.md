# PixelStage — Global Design Document

**Product:** PixelStage — a professional, open-source, web-based 2.5D pixel parallax scene editor for indie pixel-game developers.
**Tagline:** "HD-2D for the rest of us."
**Story angle:** Octopath Traveler / Wandering Sword achieve their look with expensive UE4 3D pipelines. 99% of indie pixel games fake depth with pure 2D layered parallax — and there is no professional tool for that workflow. PixelStage is that tool: import layered pixel art, tune per-layer parallax factors, preview with a draggable virtual camera, export one portable JSON.

---

## 1. Design Principles

1. **Dev-tool craft, pixel-game soul.** The chrome (panels, typography, spacing, focus states) is Linear/VSCode-grade: sharp, dense, monochrome, keyboard-first. The soul (pixel type for display text, dithered textures, the live parallax scenes) is warm, nostalgic, game-like.
2. **The demo IS the product.** The landing hero contains a real, working parallax stage with generated pixel-art layers and a draggable virtual camera — the same render math as the editor (`screen = base + offset − camera × factor`).
3. **Everything local, nothing hidden.** No backend, no accounts. UI constantly signals this: "saved locally" indicators, visible JSON, copyable everything.
4. **Numbers are first-class.** factorX/factorY, offsets, canvas size are always shown in monospace, with sliders *and* numeric inputs — this is a tool for people who read engine docs.
5. **Sharp corners.** Pixel aesthetic = squared geometry. Radius is 2–6px max; featured CTAs use pixel-notch clip-paths.

---

## 2. Color System

Dark-only, low-saturation slate-navy base with a warm amber accent (candlelight / sunset — the Octopath warmth) and a cool teal secondary (screen glow).

| Token | Hex | Usage |
|---|---|---|
| `--bg-0` | `#0A0C10` | Page background (marketing), editor void |
| `--bg-1` | `#0F1219` | Raised sections, cards, code blocks |
| `--bg-2` | `#151926` | Panels (editor sidebars, inspector), navbar |
| `--bg-3` | `#1C2231` | Hover/active surface, selected rows |
| `--border` | `#232B3B` | 1px hairlines everywhere |
| `--border-strong` | `#323D54` | Emphasized borders, selected outline |
| `--text-1` | `#EDEFF5` | Headings, primary text |
| `--text-2` | `#A4ADBF` | Body text |
| `--text-3` | `#5E6880` | Captions, disabled, placeholders |
| `--amber` | `#FFB648` | Primary accent: CTAs, selection, active states, pixel display text highlights |
| `--amber-hover` | `#FFC877` | Hover on amber elements |
| `--amber-dim` | `rgba(255,182,72,0.12)` | Accent washes, selected row bg, glow |
| `--teal` | `#4FD1B5` | Secondary accent: success-ish highlights, secondary data, links in prose, factorY readouts |
| `--teal-dim` | `rgba(79,209,181,0.10)` | Teal washes |
| `--danger` | `#F27070` | Delete actions, errors |
| `--success` | `#62D189` | Autosave dot, toasts |
| `--code-bg` | `#0D1017` | Code blocks |
| `--magenta` | `#E56CF0` | "Missing asset" placeholder checker in editor |

**Syntax highlighting (code blocks):** keys `#9ED0FF`, strings `#FFC877`, numbers `#4FD1B5`, punctuation `#5E6880`, comments `#4A5468` italic.

**Checker pattern (transparency):** 8px checker of `#151926` / `#1C2231` behind layer thumbnails and on canvas where nothing is drawn.

---

## 3. Typography

Google Fonts, three families:

| Role | Font | Weight | Details |
|---|---|---|---|
| Pixel display | **Silkscreen** | 400, 700 | Logo, hero headline, section eyebrows (`// LABEL`), big numerals, empty states. Uppercase for eyebrows, `letter-spacing: 0.12em`. Never for body. |
| UI / body | **Inter** | 400, 500, 600, 700 | All interface text, headings H2/H3, paragraphs. Headings `letter-spacing: -0.02em`. |
| Mono | **JetBrains Mono** | 400, 500, 700 | All numbers, parameters, code, JSON, status bar, badges. Tabular figures (`font-feature-settings: "tnum"`). |

**Scale (marketing pages):**
- Hero display: Silkscreen 700, clamp(40px → 64px), line-height 1.1
- H2: Inter 600, clamp(28px → 38px), line-height 1.15
- H3: Inter 600, 20px / 1.3
- Eyebrow: Silkscreen 400, 12px, uppercase, `0.12em`, amber
- Body: Inter 400, 16px / 1.65, `--text-2`
- Small/caption: Inter 400, 13px / 1.5, `--text-3`
- Mono data: JetBrains Mono 500, 13px / 1.6

**Scale (editor):** base 13px UI text; 11px mono for badges/readouts; 12px panel titles uppercase `0.1em` Inter 600 `--text-3`.

---

## 4. Spacing, Radius, Borders, Shadows

- **Spacing scale (4px base):** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Marketing sections: 128px vertical padding desktop / 72px mobile. Editor gutters: 8px.
- **Radius:** `2px` inputs & badges · `4px` buttons & list rows · `6px` cards & modals. No pills except status dots.
- **Pixel-notch corners** (primary CTAs, hero demo frame): `clip-path: polygon(0 6px, 6px 6px, 6px 0, calc(100% - 6px) 0, calc(100% - 6px) 6px, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 6px calc(100% - 6px), 0 calc(100% - 6px))` — 6px stepped notches at all four corners.
- **Borders:** 1px `--border` hairlines on every panel/card. Selected items get `border-color: --amber` or a 2px left amber bar.
- **Shadows:** nearly flat. Only: modals/popovers `0 16px 48px rgba(0,0,0,0.5)`; hover card lift `0 8px 24px rgba(0,0,0,0.35)`; amber glow on focus/active `0 0 0 1px --amber, 0 0 24px rgba(255,182,72,0.15)`.
- **Focus rings:** 2px `--amber` outline, offset 2px, always visible (keyboard-first tool).

---

## 5. Texture & Motifs

- **Pixel grid:** repeating 24px cross-hatch (`linear-gradient` 1px lines, white at 2–3% opacity) as background texture on marketing hero and section dividers.
- **Dithered gradient:** hero sky glow behind headline uses layered radial gradients masked with a 2px checkerboard `mask-image` at 8% opacity — evokes ordered dithering.
- **Scanlines:** editor canvas viewport gets an optional decorative 1px scanline overlay at 4% opacity (pure CSS, subtle).
- **`image-rendering: pixelated`** on every pixel-art image and canvas — non-negotiable.
- **Blinking caret:** amber block caret (`▮`) that blinks (1s steps) after key headlines' final character, terminal-style.

---

## 6. Animation System

- **Easings:** standard `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo) for entrances; `cubic-bezier(0.4, 0, 0.2, 1)` for UI micro-interactions.
- **Durations:** micro (hover/press) 120–180ms · UI (panels, modals, toasts) 220–300ms · section entrances 600–900ms · scroll-driven tied to scroll progress.
- **Entrance pattern:** `opacity 0→1`, `translateY 24→0px`, staggered children 80–100ms, trigger at 20% viewport (ScrollTrigger `start: "top 80%"`).
- **Text animation levels:** character-level only for hero headline (short); word-level for H2s on scroll; block-level for body.
- **Hover:** buttons translateY(-1px) + brighten; cards translateY(-4px) + border-strong + shadow; layer thumbnails scale 1.04.
- **Parallax (the point):** every marketing parallax effect uses the *real* product formula on canvas, not decorative CSS parallax — except minor decorative bg grid drifting at 0.1× scroll speed.
- **Performance:** ≤8 animating elements per viewport; canvases run rAF only while visible (IntersectionObserver) and pause when tab hidden; one pinned scroll section max per page.
- **Reduced motion:** `prefers-reduced-motion` → disable auto camera sweep, GSAP pinning, caret blink; keep instant state changes.

---

## 7. Scroll Behavior & Cursor

- **Lenis** smooth scrolling on marketing pages (home, guide, gallery): `lerp: 0.1`, synced with GSAP ScrollTrigger. **Editor page: no Lenis** — it's an app, native scroll inside panels only.
- Navbar shrinks (56→48px) and gains `--bg-2` + bottom border after 24px scroll.
- **Cursors:** default arrow UI-wide; canvas viewport: `grab`, while dragging `grabbing`; over layer drag handles: `grab`; text fields `text`. No custom cursor graphics (performance + professionalism).

---

## 8. Shared Components

### Navbar (marketing pages; editor has its own top bar)
Fixed top, 56px, `backdrop-filter: blur(12px)`, transparent → `--bg-2` on scroll, 1px bottom `--border`.
- Left: `logo.svg` (24px) + **PixelStage** wordmark (Silkscreen 400, 15px; "Pixel" `--text-1`, "Stage" `--amber`).
- Center/right links (Inter 500, 14px, `--text-2` → `--text-1` hover, amber underline grow animation): Editor · Gallery · Guide.
- Right: GitHub icon-link (lucide `Github`, 18px, bordered square 32px) + primary CTA **Launch Editor** (compact).
- Mobile: hamburger → full-screen overlay menu (Framer Motion, items stagger up 60ms, links 24px Inter 600).

### Footer (marketing pages)
`--bg-1`, top border `--border`, 4-column grid (max-width 1200px):
1. Brand: logo + wordmark, tagline "HD-2D for the rest of us.", MIT badge (mono chip `LICENSE: MIT`).
2. Product: Editor · Scene Gallery · JSON Format.
3. Docs: Getting Started · Runtime Snippet · FAQ.
4. Community: GitHub · Issues · Contribute.
Bottom bar: `© 2026 PixelStage — an open-source tool for indie pixel devs` + right side mono `v1.0.0 · canvas-2d`.

### Buttons
- **Primary** (`btn-primary`): `--amber` bg, `#1A1206` text, Inter 600 14px, padding 12px 22px, pixel-notch clip-path. Hover: bg `--amber-hover`, translateY(-1px). Active: translateY(1px). Focus: amber glow ring.
- **Secondary** (`btn-secondary`): `--bg-2` bg, `--border` 1px, `--text-1`. Hover: `--bg-3` + border-strong.
- **Ghost** (`btn-ghost`): transparent, `--text-2`, underline-on-hover amber.
- **Danger**: `--bg-2` bg + `--danger` text/border; hover fills `--danger` at 12%.

### CodeBlock
`--code-bg` bg, 1px `--border`, radius 6px. Header strip (32px): traffic-light dots replaced by 3 amber/teal/grey 8px squares + filename in mono 12px `--text-3` + right-aligned Copy button (copies, morphs to `✓ copied` for 1.5s). Line numbers optional (mono `--text-3`). Uses the syntax palette above. Horizontal scroll, never wraps JSON mid-token.

### MonoChip / PixelTag
Small inline data badges: mono 11px, padding 2px 8px, `--bg-3` bg, `--border`, radius 2px. Variants: default, amber (`--amber-dim` bg + amber text), teal. Used for factor values, keyboard keys, stats.

### Toast
Bottom-center, `--bg-3`, border, mono 12px, slides up 16px + fade, 250ms, auto-dismiss 2.5s. Success variant has `--success` left bar; danger variant `--danger`.

### SectionEyebrow
`// LABEL` — Silkscreen 12px amber + a 24px amber 1px rule after it. Used above every marketing H2.

---

## 9. Page List

| Route | File | Description |
|---|---|---|
| `/` | `home.md` | Landing: live interactive parallax hero, product story ("HD-2D for the rest of us"), how-it-works, features, JSON/runtime preview, gallery teaser, open-source, CTA. |
| `/editor` | `editor.md` | The product: full-screen three-column editor — layer import (drag-drop/picker), layer list (reorder/visibility/rename/delete), per-layer parallax/scale/offset inspector, draggable virtual camera + auto-sweep, JSON export modal, localStorage autosave, project import/export. |
| `/guide` | `guide.md` | Getting started: quick-start steps, parallax model explainer (factor semantics + diagram), JSON schema reference, ~20-line runtime snippet, engine recipes, FAQ. |
| `/gallery` | `gallery.md` | Example scene gallery: filterable grid of scenes with live mini-parallax canvas previews, exploded layer-stack view, "Open in Editor" + "Download JSON". |

---

## 10. Dependencies

React 19 + TypeScript · Vite · Tailwind CSS v3.4.19 · shadcn/ui (Button, Dialog, Slider, Input, Tooltip, Accordion, Tabs, Switch) · **Zustand** (editor scene state) · **GSAP + ScrollTrigger** (marketing scroll storytelling) · **Framer Motion** (micro-interactions, modals, layer-list reorder, page transitions) · **Lenis** (marketing scroll) · **lucide-react** (icons). Custom Canvas 2D render loops (no PixiJS/Three.js) for hero demo, gallery previews, and the editor viewport. `imageSmoothingEnabled = false` everywhere.

---

## 11. Assets Manifest

All pixel-art assets: authentic retro pixel-art style (limited palette, visible pixels, dithered gradients), rendered so they upscale crisply with nearest-neighbor. Parallax layers must align on a shared 960×540 stage so they composite correctly; foreground/midground PNGs are transparent outside their subject.

| # | Filename | Type | Dimensions | Description | Used in |
|---|---|---|---|---|---|
| 1 | `logo.svg` | SVG | 32×32 viewBox | Pixel-art logo mark: three stacked, horizontally-offset squares (suggesting parallax layers receding) on an 8×8 pixel grid; bottom square solid `--amber #FFB648`, middle `#4FD1B5`, top `#323D54`; transparent background; chunky 1px-pixel look, no gradients. | Navbar, footer, editor top bar, favicon |
| 2 | `layers/valley-sky.png` | Image | 960×540 (16:9) | Pixel-art dusk sky, fully opaque background layer: warm amber-to-dusky-purple vertical gradient with ordered dithering, a few blocky drifting clouds, tiny 2px stars beginning to appear, distant sun glow low on horizon. Palette: #2B2540, #6B4A6E, #C97B4A, #FFB648. | Home hero demo, gallery "Sunset Valley" |
| 3 | `layers/valley-far.png` | Image (transparent PNG) | 960×540 | Far parallax layer: silhouetted misty mountain ridge line in desaturated purple-blue (#4A4364, #5E5578) with atmospheric haze, a tiny pixel pagoda on one peak; everything outside the ridge fully transparent. | Home hero demo, gallery |
| 4 | `layers/valley-mid.png` | Image (transparent PNG) | 960×540 | Midground layer: nearer rolling hills in dark teal-green (#2E4A44), a cluster of blocky pine trees, a small warm-lit shrine gate (torii-style, amber lanterns #FFB648) slightly right of center; transparent elsewhere. | Home hero demo, gallery |
| 5 | `layers/valley-front.png` | Image (transparent PNG) | 960×540 | Foreground layer: near-black silhouetted grasses, rocks and a hanging pine branch occupying the bottom 25% and top-left corner, deep shadow palette (#12141C, #1A1E28), slight rim light of amber on grass tips; rest transparent. | Home hero demo, gallery |
| 6 | `layers/alley-back.png` | Image | 960×540 | Opaque background: rainy cyberpunk pixel alley at night, distant building wall with glowing windows (cyan #43C8DC, magenta #E56CF0), hazy depth fog, wet ground reflections at bottom; palette dominated by deep navy #12141F. | Gallery "Neon Alley" |
| 7 | `layers/alley-mid.png` | Image (transparent PNG) | 960×540 | Midground: nearer building facades left and right edges framing the alley, neon signs (vertical kanji-style blocks in magenta/cyan), hanging wires, AC units, a fire-escape staircase; transparent in the middle to reveal back layer. | Gallery |
| 8 | `layers/alley-front.png` | Image (transparent PNG) | 960×540 | Foreground: dark silhouette of a dumpster, pipes and a hanging lantern bottom-right, top-left awning corner; near-black #0C0E15 with faint neon rim light; rest transparent. | Gallery |
| 9 | `layers/dungeon-back.png` | Image | 960×540 | Opaque background: pixel-art dungeon cavern wall, warm torch glow pools (amber #FFB648, orange #C97B4A) on dark stone bricks (#1C1A22, #2A2733), deep black ceiling fading up; mysterious, cozy-dark mood. | Gallery "Ember Dungeon" |
| 10 | `layers/dungeon-mid.png` | Image (transparent PNG) | 960×540 | Midground: two large stone pillars with carved pixel runes, an arched doorway center with faint teal magic glow (#4FD1B5), a treasure chest with amber glint right side; transparent elsewhere. | Gallery |
| 11 | `layers/dungeon-front.png` | Image (transparent PNG) | 960×540 | Foreground: black silhouette of floor spikes along bottom edge, heavy hanging chains from top-left, an iron grate bottom-left corner; palette #0A0B10 with amber edge highlights; rest transparent. | Gallery |
| 12 | `empty-state.svg` | SVG | 240×160 viewBox | Pixel-art illustration: a tiny 16×16-style ghostly cursor arrow dropping a pixel-art picture frame onto a dashed outline stage, amber and teal on transparent; chunky visible pixels, minimal. | Editor empty canvas state |
| 13 | `factor-diagram.svg` | SVG | 640×360 viewBox | Technical diagram on dark bg (`#0F1219`): a camera rectangle with movement arrow labeled `cam.x`, below it three horizontal layer strips labeled `factor 0.0 (locked)`, `0.5`, `1.0 (glued)` with proportional offset arrows in teal/amber, mono labels (JetBrains Mono style), thin `#232B3B` hairlines. | Guide "parallax model" section |
| 14 | `og-cover.png` | Image | 1200×630 | Social card: "Sunset Valley" composite scene as background with dark overlay, centered `logo.svg` + "PixelStage" in Silkscreen, tagline "HD-2D for the rest of us." in white, amber pixel-notch border frame. | Social meta |

*Implementation note: the hero demo and gallery previews load these layers and render them with the same parallax math as the editor. Default factor presets — Valley: 0.05 / 0.15 / 0.40 / 0.80 · Alley: 0.10 / 0.35 / 0.85 · Dungeon: 0.08 / 0.45 / 0.90 (back→front).*
