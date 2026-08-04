import { GITHUB_URL } from "@/lib/constants";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  FileJson,
  Github,
  HardDriveDownload,
  Layers,
  Move,
  SlidersHorizontal,
  Terminal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import CodeBlock from "@/components/CodeBlock";
import ScenePreview from "@/components/ScenePreview";
import StageCanvas from "@/components/StageCanvas";
import { FadeUp, MonoChip, SectionEyebrow } from "@/components/marketing";
import { highlightJs, highlightJson } from "@/components/editor/ExportModal";
import { getCachedPlaceholderScene } from "@/core/placeholder";
import { RUNTIME_SNIPPET } from "@/core/scene";
import type { Camera } from "@/core/types";
import { toast } from "@/store/toastStore";

const DEMO_JSON = `{
  "version": 1,
  "canvas": { "width": 960, "height": 540 },
  "layers": [
    { "name": "sky",    "src": "valley-sky.png",   "factorX": 0.05, "factorY": 0.02, "scale": 1, "offsetX": 0, "offsetY": 0, "visible": true },
    { "name": "hills",  "src": "valley-far.png",   "factorX": 0.15, "factorY": 0.05, "scale": 1, "offsetX": 0, "offsetY": 0, "visible": true },
    { "name": "shrine", "src": "valley-mid.png",   "factorX": 0.40, "factorY": 0.12, "scale": 1, "offsetX": 0, "offsetY": 0, "visible": true },
    { "name": "grass",  "src": "valley-front.png", "factorX": 0.80, "factorY": 0.20, "scale": 1, "offsetX": 0, "offsetY": 0, "visible": true }
  ]
}`;

export default function HomePage() {
  return (
    <main>
      <Hero />
      <SpecTicker />
      <Problem />
      <HowItWorks />
      <FeatureGrid />
      <PortableJson />
      <GalleryTeaser />
      <OpenSource />
      <FinalCta />
    </main>
  );
}

/* --------------------------------- Section 1 --------------------------------- */

function Hero() {
  const navigate = useNavigate();
  const scene = getCachedPlaceholderScene("valley");
  const [camera, setCamera] = useState<Camera>(scene.camera);
  const [playing, setPlaying] = useState(true);
  const [dragged, setDragged] = useState(false);
  const headline = "HD-2D FOR THE";

  return (
    <section className="pixel-grid relative flex min-h-screen items-center overflow-hidden pt-14">
      {/* dithered amber glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,182,72,0.08), transparent)",
        }}
      />
      <div className="mx-auto grid w-full max-w-[1200px] items-center gap-12 px-4 py-20 lg:grid-cols-[55%_45%]">
        {/* copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3"
          >
            <SectionEyebrow>Open-source 2.5D parallax scene editor</SectionEyebrow>
            <MonoChip>MIT</MonoChip>
          </motion.div>

          <h1 className="mt-6 font-pixel text-[clamp(36px,5.5vw,60px)] font-bold leading-[1.1] text-text-1">
            {headline.split("").map((c, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: "60%" }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.03, ease: [0.16, 1, 0.3, 1] }}
              >
                {c === " " ? " " : c}
              </motion.span>
            ))}
            <br />
            <motion.span
              className="text-amber"
              initial={{ opacity: 0, y: "40%" }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 + headline.length * 0.03, ease: [0.16, 1, 0.3, 1] }}
            >
              REST OF US
            </motion.span>
            <span className="animate-caret-blink text-amber">▮</span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-text-2"
          >
            PixelStage is a professional web editor for layered pixel parallax scenes. Import your
            art, tune per-layer depth factors, drag a virtual camera, and export one portable JSON
            your engine renders in ~20 lines. No Unreal pipeline. No engine lock-in. No cost.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button variant="primary" onClick={() => navigate("/editor")}>
              Launch the Editor <ArrowRight />
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              How it works
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-8 flex flex-wrap gap-2"
          >
            <MonoChip>CANVAS 2D</MonoChip>
            <MonoChip>0 RUNTIME DEPS</MonoChip>
            <MonoChip>LOCAL-FIRST</MonoChip>
            <MonoChip>~20 LINE RUNTIME</MonoChip>
          </motion.div>
        </div>

        {/* live demo — the demo IS the product */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="pixel-notch relative border border-border-strong bg-bg-1">
            <div className="relative aspect-video">
              <StageCanvas
                sceneSize={scene.canvas}
                layers={scene.layers}
                camera={camera}
                onCameraChange={setCamera}
                playing={playing}
                onFirstDrag={() => {
                  setDragged(true);
                  setPlaying(false);
                }}
                sweepOptions={{ rangeX: 120, rangeY: 24, period: 8 }}
              />
              {/* HUD chips */}
              <div className="absolute left-2 top-2 rounded-sm border border-border bg-bg-2/85 px-2 py-1 font-mono text-[11px] text-text-3">
                cam.x <span className="text-teal">{String(Math.round(camera.x)).padStart(3, "0")}</span>{" "}
                · cam.y <span className="text-teal">{String(Math.round(camera.y)).padStart(3, "0")}</span>
              </div>
              <div className="absolute bottom-2 right-2 rounded-sm border border-border bg-bg-2/85 px-2 py-1 font-mono text-[10px] text-text-3">
                0.05 → 0.80
              </div>
              {!dragged && (
                <div className="absolute bottom-2 left-2 rounded-sm border border-border bg-bg-2/85 px-2 py-1 font-mono text-[10px] text-amber transition-opacity duration-500">
                  ✥ DRAG TO MOVE CAMERA
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={playing} onCheckedChange={setPlaying} className="scale-90" />
              <span className="font-mono text-[11px] text-text-3">AUTO SWEEP</span>
            </div>
            <button
              onClick={() => setCamera({ ...scene.camera })}
              className="font-mono text-[11px] text-text-3 transition-colors hover:text-amber"
            >
              RESET CAMERA
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* --------------------------------- Section 2 --------------------------------- */

const TICKER = [
  "IMPORT PNG / JPG",
  "REORDER · RENAME · SHOW / HIDE",
  "FACTORX / FACTORY 0.00 — 1.00",
  "PER-LAYER SCALE + OFFSET",
  "DRAGGABLE VIRTUAL CAMERA",
  "AUTO-SWEEP PLAYBACK",
  "EXPORT SCENE.JSON",
  "AUTOSAVE → LOCALSTORAGE",
];

function SpecTicker() {
  const items = [...TICKER, ...TICKER];
  return (
    <section className="overflow-hidden border-y border-border bg-bg-1 py-3.5">
      <div className="flex w-max animate-marquee gap-8 hover:[animation-play-state:paused]">
        {items.map((t, i) => (
          <span key={i} className="flex items-center gap-8 font-mono text-xs text-text-3">
            {t}
            <span className="inline-block h-2 w-2 bg-amber" />
          </span>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------- Section 3 --------------------------------- */

function Problem() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-24 md:py-32">
      <FadeUp className="mx-auto max-w-[680px] text-center">
        <SectionEyebrow className="justify-center">The problem</SectionEyebrow>
        <h2 className="mt-4 text-[clamp(28px,3.5vw,38px)] font-semibold leading-tight tracking-tight text-text-1">
          Octopath's look without Octopath's budget.
        </h2>
        <p className="mt-4 text-[17px] leading-relaxed text-text-2">
          Octopath Traveler and Wandering Sword built their "HD-2D" look on Unreal Engine 4 — real
          3D scenes, camera rigs, volumetric light. Gorgeous. Also a team-of-fifty, multi-year,
          engine-royalty affair. 99% of indie pixel games fake the same depth with plain 2D layers
          — and until now, the tooling for that was a TODO comment.
        </p>
      </FadeUp>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <FadeUp delay={0.1}>
          <div className="h-full rounded-md border border-border bg-bg-1 p-7 opacity-90">
            <MonoChip>UE4 HD-2D PIPELINE</MonoChip>
            <h3 className="mt-4 font-pixel text-sm tracking-wide text-text-2">THE 1% PATH</h3>
            <ul className="mt-5 space-y-3">
              {[
                "Full 3D scene + PBR lighting for a 2D-looking game",
                "Camera rigs, DOF, volumetrics to maintain",
                "Engine expertise + royalties",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-[15px] text-text-2">
                  <X size={16} className="mt-0.5 shrink-0 text-text-3" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-border pt-4 font-mono text-[11px] text-text-3">
              TEAM: 20–50 · YEARS: 3+ · COST: $$$$$
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="h-full rounded-md border border-amber/40 bg-bg-1 p-7 amber-glow">
            <MonoChip variant="amber">LAYERED 2D PARALLAX</MonoChip>
            <h3 className="mt-4 font-pixel text-sm tracking-wide text-amber">THE 99% PATH</h3>
            <ul className="mt-5 space-y-3">
              {[
                "Draw your art once, in any pixel tool",
                "Stack background → midground → foreground",
                "Fake depth with one multiply: pos − cam × factor",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-[15px] text-text-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-teal" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-border pt-4 font-mono text-[11px] text-amber">
              TEAM: 1 · TIME: AN AFTERNOON · COST: $0
            </p>
          </div>
        </FadeUp>
      </div>

      <FadeUp delay={0.3} className="mt-10 text-center">
        <p className="text-lg font-semibold text-text-1">
          PixelStage is the professional editor for the 99% path.
        </p>
      </FadeUp>
    </section>
  );
}

/* --------------------------------- Section 4 --------------------------------- */

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "IMPORT",
      h: "Drop in your layers",
      body: "PNG or JPG, drag-and-drop or file picker. Background, midground, foreground — PixelStage stacks them onto a shared stage the moment they land.",
      visual: (
        <div className="flex h-28 items-center justify-center rounded border border-dashed border-border-strong bg-bg-0">
          <div className="flex flex-col items-center gap-1.5">
            <img src="/empty-state.svg" alt="" className="w-16 opacity-70" />
            <div className="flex gap-1.5">
              <MonoChip>sky.png</MonoChip>
              <MonoChip>hills.png</MonoChip>
            </div>
          </div>
        </div>
      ),
    },
    {
      num: "02",
      title: "TUNE",
      h: "Dial in the depth",
      body: "factorX / factorY per layer — 0 locks it in place, 1 glues it to the camera. Add scale and offset, drag the virtual camera, and watch the scene breathe.",
      visual: (
        <div className="flex h-28 flex-col justify-center gap-3 rounded border border-border bg-bg-0 px-4 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-16 text-text-3">factorX</span>
            <div className="h-1 flex-1 bg-bg-3">
              <motion.div
                className="h-full bg-amber"
                initial={{ width: "10%" }}
                whileInView={{ width: "40%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <span className="text-amber">0.40</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16 text-text-3">factorY</span>
            <div className="h-1 flex-1 bg-bg-3">
              <motion.div
                className="h-full bg-teal"
                initial={{ width: "5%" }}
                whileInView={{ width: "12%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <span className="text-teal">0.12</span>
          </div>
        </div>
      ),
    },
    {
      num: "03",
      title: "EXPORT",
      h: "Ship one file",
      body: "Layer order, assets, factors, canvas size — one portable scene.json. Consume it from Phaser, Godot, Electron, or raw Canvas with the snippet in the guide.",
      visual: (
        <CodeBlock filename="scene.json" preClassName="!p-3 text-[10px] max-h-28 overflow-hidden">
          {highlightJson(`{
  "version": 1,
  "layers": [
    { "name": "sky", "factorX": 0.05 },
    { "name": "grass", "factorX": 0.80 }
  ]
}`)}
        </CodeBlock>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="mx-auto max-w-[1200px] px-4 py-24 md:py-32">
      <FadeUp>
        <SectionEyebrow>Workflow</SectionEyebrow>
        <h2 className="mt-4 text-[clamp(28px,3.5vw,38px)] font-semibold tracking-tight text-text-1">
          Three steps. One JSON.
        </h2>
      </FadeUp>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <FadeUp key={s.num} delay={i * 0.12}>
            <div className="flex h-full min-h-[320px] flex-col rounded-md border border-border bg-bg-1 p-7">
              <span className="font-pixel text-[28px] text-amber">{s.num}</span>
              <span className="mt-1 font-mono text-[10px] tracking-widest text-text-3">
                / {s.title}
              </span>
              <h3 className="mt-3 text-xl font-semibold text-text-1">{s.h}</h3>
              <p className="mt-2 flex-1 text-[15px] leading-relaxed text-text-2">{s.body}</p>
              <div className="mt-5">{s.visual}</div>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------- Section 5 --------------------------------- */

const FEATURES = [
  {
    icon: Layers,
    h: "Layers",
    b: "Import, reorder, rename, show/hide, delete. Your stack stays organized, drag-and-drop simple.",
  },
  {
    icon: SlidersHorizontal,
    h: "Per-layer parallax",
    b: "factorX and factorY from 0.00 to 1.00, scale, and offset — every layer gets its own depth signature.",
  },
  {
    icon: Move,
    h: "Virtual camera",
    b: "Drag across the viewport to preview depth in real time, or hit auto-sweep and let the camera pan for you.",
  },
  {
    icon: FileJson,
    h: "Portable JSON",
    b: "One scene file: order, assets, factors, canvas size. Engine-agnostic by design, versioned schema.",
  },
  {
    icon: HardDriveDownload,
    h: "Local-first autosave",
    b: "Every keystroke persists to localStorage. Export/import project files to move between machines. No account, no cloud, no telemetry.",
  },
  {
    icon: Terminal,
    h: "Zero-dep runtime",
    b: "Reproduce your scene with ~20 lines of plain Canvas 2D. Read every line — it's yours.",
  },
];

function FeatureGrid() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-24 md:py-32">
      <FadeUp>
        <SectionEyebrow>The tool</SectionEyebrow>
        <h2 className="mt-4 text-[clamp(28px,3.5vw,38px)] font-semibold tracking-tight text-text-1">
          An editor, not a toy.
        </h2>
      </FadeUp>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <FadeUp key={f.h} delay={i * 0.08}>
            <div className="group h-full rounded-md border border-border bg-bg-1 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-border-strong hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
              <div className="flex h-10 w-10 items-center justify-center rounded border border-border bg-bg-3 transition-colors group-hover:bg-amber-dim">
                <f.icon size={18} className="text-amber transition-transform duration-150 group-hover:rotate-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-text-1">{f.h}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-text-2">{f.b}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------- Section 6 --------------------------------- */

function PortableJson() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-24 md:py-32">
      <FadeUp>
        <SectionEyebrow>Portable by design</SectionEyebrow>
        <h2 className="mt-4 text-[clamp(28px,3.5vw,38px)] font-semibold tracking-tight text-text-1">
          Your scene is a file.
        </h2>
        <p className="mt-4 max-w-[640px] text-[17px] text-text-2">
          Export drops a single scene.json. This is a real export — and the runtime that renders it.
        </p>
      </FadeUp>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <FadeUp delay={0.1}>
          <CodeBlock filename="sunset-valley.json" preClassName="max-h-[380px]">
            {highlightJson(DEMO_JSON)}
          </CodeBlock>
        </FadeUp>
        <FadeUp delay={0.2}>
          <CodeBlock filename="runtime.js" preClassName="max-h-[240px]">
            {highlightJs(RUNTIME_SNIPPET.split("\n").slice(0, 14).join("\n"))}
          </CodeBlock>
          <ul className="mt-5 space-y-2.5">
            {[
              ["One multiply.", "screen = base + offset − cam × factor — that's the whole engine."],
              ["No dependencies.", "Plain Canvas 2D, imageSmoothingEnabled = false."],
              ["Any host.", "Phaser, Godot, Electron, or a bare <canvas>."],
            ].map(([h, b]) => (
              <li key={h} className="text-[15px] text-text-2">
                <strong className="text-text-1">{h}</strong>{" "}
                <span className="font-mono text-[13px]">{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex gap-3">
            <Button variant="secondary" size="sm" asChild>
              <Link to="/guide">Read the full guide</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(RUNTIME_SNIPPET);
                toast("runtime.js copied to clipboard", { variant: "success" });
              }}
            >
              Copy runtime
            </Button>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* --------------------------------- Section 7 --------------------------------- */

function GalleryTeaser() {
  const scenes = [
    { theme: "valley" as const, name: "Sunset Valley", layers: 4, range: "0.05–0.80" },
    { theme: "alley" as const, name: "Neon Alley", layers: 3, range: "0.10–0.85" },
    { theme: "dungeon" as const, name: "Ember Dungeon", layers: 3, range: "0.08–0.90" },
  ];
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-24 md:py-32">
      <FadeUp className="flex items-end justify-between">
        <div>
          <SectionEyebrow>Scenes</SectionEyebrow>
          <h2 className="mt-4 text-[clamp(28px,3.5vw,38px)] font-semibold tracking-tight text-text-1">
            Made with PixelStage.
          </h2>
        </div>
        <Link
          to="/gallery"
          className="hidden font-mono text-[13px] text-text-2 transition-colors hover:text-amber sm:block"
        >
          Browse the gallery →
        </Link>
      </FadeUp>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {scenes.map((s, i) => (
          <FadeUp key={s.name} delay={i * 0.1}>
            <Link
              to="/gallery"
              className="group block overflow-hidden rounded-md border border-border bg-bg-1 transition-all duration-200 hover:-translate-y-1 hover:border-border-strong"
            >
              <div className="relative aspect-video">
                <ScenePreview theme={s.theme} />
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="font-semibold text-text-1">{s.name}</span>
                <div className="flex gap-1.5">
                  <MonoChip>{s.layers} LAYERS</MonoChip>
                  <MonoChip variant="teal">{s.range}</MonoChip>
                </div>
              </div>
            </Link>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------- Section 8 --------------------------------- */

function OpenSource() {
  return (
    <section className="mx-auto max-w-[680px] px-4 py-24 text-center md:py-32">
      <FadeUp>
        <SectionEyebrow className="justify-center">Open source</SectionEyebrow>
        <h2 className="mt-4 text-[clamp(28px,3.5vw,38px)] font-semibold tracking-tight text-text-1">
          Free as in freedom.
        </h2>
        <p className="mt-4 text-[17px] leading-relaxed text-text-2">
          PixelStage is MIT-licensed and built in the open by an indie dev who needed it for their
          own Wandering-Sword-style pixel game. Every line of the render loop is meant to be read,
          forked, and shipped inside your game. Issues, PRs, and gallery submissions welcome.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button variant="primary" asChild>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              <Github /> Star on GitHub
            </a>
          </Button>
          <Button variant="secondary" asChild>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              Contribute
            </a>
          </Button>
        </div>
        <div className="mt-8 flex justify-center gap-2">
          <MonoChip>LICENSE MIT</MonoChip>
          <MonoChip>TYPESCRIPT</MonoChip>
          <MonoChip>NO TELEMETRY</MonoChip>
        </div>
      </FadeUp>
    </section>
  );
}

/* --------------------------------- Section 9 --------------------------------- */

function FinalCta() {
  const navigate = useNavigate();
  return (
    <section className="pixel-grid relative border-t border-border py-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 50% 100%, rgba(255,182,72,0.08), transparent)",
        }}
      />
      <FadeUp className="relative mx-auto max-w-[680px] px-4 text-center">
        <h2 className="font-pixel text-[clamp(24px,3vw,32px)] leading-snug text-text-1">
          YOUR NEXT SCENE IS ONE DRAG AWAY<span className="animate-caret-blink text-amber">▮</span>
        </h2>
        <p className="mt-4 text-text-2">Open the editor. Drop a layer. Feel the depth.</p>
        <Button variant="primary" className="mt-8" onClick={() => navigate("/editor")}>
          Launch the Editor <ArrowRight />
        </Button>
      </FadeUp>
    </section>
  );
}
