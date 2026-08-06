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
import StageCanvas3D from "@/components/StageCanvas3DLazy";
import { FadeUp, MonoChip, SectionEyebrow } from "@/components/marketing";
import { highlightJs, highlightJson } from "@/components/editor/ExportModal";
import { getCachedPlaceholderScene, PLACEHOLDER_META } from "@/core/placeholder";
import { RUNTIME_SNIPPET } from "@/core/scene";
import type { Camera3D } from "@/core/types";
import { useT } from "@/i18n";
import type { DictKey } from "@/i18n/dict";
import { GITHUB_URL } from "@/lib/constants";
import { toast } from "@/store/toastStore";

const DEMO_JSON = `{
  "version": 2,
  "canvas": { "width": 960, "height": 540 },
  "camera": {
    "position": { "x": 480, "y": 270, "z": 741.6 },
    "target":   { "x": 480, "y": 270, "z": 0 },
    "fov": 40
  },
  "effects": {
    "dof": { "enabled": true, "focus": 0, "aperture": 0.3 },
    "fog": { "enabled": false, "color": "#0A0C10", "near": 400, "far": 2400 },
    "ambient": { "color": "#B8C4E0", "intensity": 0.9 },
    "sun": { "color": "#FFF2D8", "intensity": 1.1, "azimuth": 35, "elevation": 50 }
  },
  "layers": [
    { "name": "sky",    "src": "village-sky.png",   "depth": 700, "scale": 1, "offsetX": 0, "offsetY": 0, "orientation": "vertical", "lit": false, "visible": true },
    { "name": "hills",  "src": "village-far.png",   "depth": 420, "scale": 1, "offsetX": 0, "offsetY": 0, "orientation": "vertical", "lit": true,  "visible": true },
    { "name": "shrine", "src": "village-mid.png",   "depth": 180, "scale": 1, "offsetX": 0, "offsetY": 0, "orientation": "vertical", "lit": true,  "visible": true },
    { "name": "grass",  "src": "village-front.png", "depth": -60, "scale": 1, "offsetX": 0, "offsetY": 0, "orientation": "ground",   "lit": true,  "visible": true }
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
  const t = useT();
  const scene = getCachedPlaceholderScene("village");
  const [camera, setCamera] = useState<Camera3D>(scene.camera);
  const [playing, setPlaying] = useState(true);
  const [dragged, setDragged] = useState(false);
  const headline = t("hero.h1a");

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
            <SectionEyebrow>{t("hero.eyebrow")}</SectionEyebrow>
            <MonoChip>MIT</MonoChip>
          </motion.div>

          <h1 className="mt-6 font-pixel text-[clamp(36px,5.5vw,60px)] font-bold leading-[1.1] text-text-1">
            {headline.split("").map((c, i) => (
              <motion.span
                key={`${headline}-${i}`}
                className="inline-block"
                initial={{ opacity: 0, y: "60%" }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.03, ease: [0.16, 1, 0.3, 1] }}
              >
                {c === " " ? " " : c}
              </motion.span>
            ))}
            <br />
            <motion.span
              className="text-amber"
              initial={{ opacity: 0, y: "40%" }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 + headline.length * 0.03, ease: [0.16, 1, 0.3, 1] }}
            >
              {t("hero.h1b")}
            </motion.span>
            <span className="animate-caret-blink text-amber">▮</span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-text-2"
          >
            {t("hero.sub")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button variant="primary" onClick={() => navigate("/editor")}>
              {t("hero.launch")} <ArrowRight />
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              {t("hero.howItWorks")}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-8 flex flex-wrap gap-2"
          >
            <MonoChip>{t("hero.chip1")}</MonoChip>
            <MonoChip>{t("hero.chip2")}</MonoChip>
            <MonoChip>{t("hero.chip3")}</MonoChip>
            <MonoChip>{t("hero.chip4")}</MonoChip>
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
              <StageCanvas3D
                sceneSize={scene.canvas}
                layers={scene.layers}
                camera={camera}
                effects={scene.effects}
                onCameraChange={setCamera}
                playing={playing}
                pathPreset="orbit"
                onFirstDrag={() => {
                  setDragged(true);
                  setPlaying(false);
                }}
              />
              {/* HUD chips */}
              <div className="absolute left-2 top-2 rounded-sm border border-border bg-bg-2/85 px-2 py-1 font-mono text-[11px] text-text-3">
                tgt.x <span className="text-teal">{String(Math.round(camera.target.x)).padStart(3, "0")}</span>{" "}
                · tgt.y <span className="text-teal">{String(Math.round(camera.target.y)).padStart(3, "0")}</span>
              </div>
              <div className="absolute bottom-2 right-2 rounded-sm border border-border bg-bg-2/85 px-2 py-1 font-mono text-[10px] text-text-3">
                webgl · hd-2d
              </div>
              {!dragged && (
                <div className="absolute bottom-2 left-2 rounded-sm border border-border bg-bg-2/85 px-2 py-1 font-mono text-[10px] text-amber transition-opacity duration-500">
                  {t("hero.drag")}
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={playing} onCheckedChange={setPlaying} className="scale-90" />
              <span className="font-mono text-[11px] text-text-3">{t("hero.autoSweep")}</span>
            </div>
            <button
              onClick={() =>
                setCamera({
                  position: { ...scene.camera.position },
                  target: { ...scene.camera.target },
                  fov: scene.camera.fov,
                })
              }
              className="font-mono text-[11px] text-text-3 transition-colors hover:text-amber"
            >
              {t("hero.resetCamera")}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* --------------------------------- Section 2 --------------------------------- */

const TICKER_KEYS: DictKey[] = [
  "tick.1", "tick.2", "tick.3", "tick.4", "tick.5", "tick.6", "tick.7", "tick.8",
];

function SpecTicker() {
  const t = useT();
  const items = [...TICKER_KEYS, ...TICKER_KEYS];
  return (
    <section className="overflow-hidden border-y border-border bg-bg-1 py-3.5">
      <div className="flex w-max animate-marquee gap-8 hover:[animation-play-state:paused]">
        {items.map((k, i) => (
          <span key={i} className="flex items-center gap-8 font-mono text-xs text-text-3">
            {t(k)}
            <span className="inline-block h-2 w-2 bg-amber" />
          </span>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------- Section 3 --------------------------------- */

function Problem() {
  const t = useT();
  const cardA: DictKey[] = ["prob.cardA.1", "prob.cardA.2", "prob.cardA.3"];
  const cardB: DictKey[] = ["prob.cardB.1", "prob.cardB.2", "prob.cardB.3"];

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-24 md:py-32">
      <FadeUp className="mx-auto max-w-[680px] text-center">
        <SectionEyebrow className="justify-center">{t("prob.eyebrow")}</SectionEyebrow>
        <h2 className="mt-4 text-[clamp(28px,3.5vw,38px)] font-semibold leading-tight tracking-tight text-text-1">
          {t("prob.h2")}
        </h2>
        <p className="mt-4 text-[17px] leading-relaxed text-text-2">{t("prob.lead")}</p>
      </FadeUp>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <FadeUp delay={0.1}>
          <div className="h-full rounded-md border border-border bg-bg-1 p-7 opacity-90">
            <MonoChip>{t("prob.cardA.tag")}</MonoChip>
            <h3 className="mt-4 font-pixel text-sm tracking-wide text-text-2">{t("prob.cardA.title")}</h3>
            <ul className="mt-5 space-y-3">
              {cardA.map((k) => (
                <li key={k} className="flex gap-3 text-[15px] text-text-2">
                  <X size={16} className="mt-0.5 shrink-0 text-text-3" />
                  {t(k)}
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-border pt-4 font-mono text-[11px] text-text-3">
              {t("prob.cardA.stat")}
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="h-full rounded-md border border-amber/40 bg-bg-1 p-7 amber-glow">
            <MonoChip variant="amber">{t("prob.cardB.tag")}</MonoChip>
            <h3 className="mt-4 font-pixel text-sm tracking-wide text-amber">{t("prob.cardB.title")}</h3>
            <ul className="mt-5 space-y-3">
              {cardB.map((k) => (
                <li key={k} className="flex gap-3 text-[15px] text-text-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-teal" />
                  {t(k)}
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-border pt-4 font-mono text-[11px] text-amber">
              {t("prob.cardB.stat")}
            </p>
          </div>
        </FadeUp>
      </div>

      <FadeUp delay={0.3} className="mt-10 text-center">
        <p className="text-lg font-semibold text-text-1">{t("prob.closing")}</p>
      </FadeUp>
    </section>
  );
}

/* --------------------------------- Section 4 --------------------------------- */

function HowItWorks() {
  const t = useT();
  const steps: { num: string; title: DictKey; h: DictKey; b: DictKey; visual: React.ReactNode }[] = [
    {
      num: "01",
      title: "how.s1.title",
      h: "how.s1.h",
      b: "how.s1.b",
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
      title: "how.s2.title",
      h: "how.s2.h",
      b: "how.s2.b",
      visual: (
        <div className="flex h-28 flex-col justify-center gap-3 rounded border border-border bg-bg-0 px-4 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-16 text-text-3">depth</span>
            <div className="relative h-1 flex-1 bg-bg-3">
              <div className="absolute left-1/3 top-0 h-full w-px bg-text-3/50" />
              <motion.div
                className="absolute left-1/3 top-1/2 h-3 w-3 -translate-y-1/2 border border-amber bg-bg-0"
                initial={{ left: "60%" }}
                whileInView={{ left: "33%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <span className="text-amber">0</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16 text-text-3">parallax</span>
            <span className="text-teal">×1.00 → the focal plane, pixels 1:1</span>
          </div>
        </div>
      ),
    },
    {
      num: "03",
      title: "how.s3.title",
      h: "how.s3.h",
      b: "how.s3.b",
      visual: (
        <CodeBlock filename="scene.json" preClassName="!p-3 text-[10px] max-h-28 overflow-hidden">
          {highlightJson(`{
  "version": 2,
  "layers": [
    { "name": "sky", "depth": 700, "lit": false },
    { "name": "grass", "depth": -60, "orientation": "ground" }
  ]
}`)}
        </CodeBlock>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="mx-auto max-w-[1200px] px-4 py-24 md:py-32">
      <FadeUp>
        <SectionEyebrow>{t("how.eyebrow")}</SectionEyebrow>
        <h2 className="mt-4 text-[clamp(28px,3.5vw,38px)] font-semibold tracking-tight text-text-1">
          {t("how.h2")}
        </h2>
      </FadeUp>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <FadeUp key={s.num} delay={i * 0.12}>
            <div className="flex h-full min-h-[320px] flex-col rounded-md border border-border bg-bg-1 p-7">
              <span className="font-pixel text-[28px] text-amber">{s.num}</span>
              <span className="mt-1 font-mono text-[10px] tracking-widest text-text-3">
                / {t(s.title)}
              </span>
              <h3 className="mt-3 text-xl font-semibold text-text-1">{t(s.h)}</h3>
              <p className="mt-2 flex-1 text-[15px] leading-relaxed text-text-2">{t(s.b)}</p>
              <div className="mt-5">{s.visual}</div>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------- Section 5 --------------------------------- */

const FEATURES: { icon: typeof Layers; h: DictKey; b: DictKey }[] = [
  { icon: Layers, h: "feat.1.h", b: "feat.1.b" },
  { icon: SlidersHorizontal, h: "feat.2.h", b: "feat.2.b" },
  { icon: Move, h: "feat.3.h", b: "feat.3.b" },
  { icon: FileJson, h: "feat.4.h", b: "feat.4.b" },
  { icon: HardDriveDownload, h: "feat.5.h", b: "feat.5.b" },
  { icon: Terminal, h: "feat.6.h", b: "feat.6.b" },
];

function FeatureGrid() {
  const t = useT();
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-24 md:py-32">
      <FadeUp>
        <SectionEyebrow>{t("feat.eyebrow")}</SectionEyebrow>
        <h2 className="mt-4 text-[clamp(28px,3.5vw,38px)] font-semibold tracking-tight text-text-1">
          {t("feat.h2")}
        </h2>
      </FadeUp>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <FadeUp key={f.h} delay={i * 0.08}>
            <div className="group h-full rounded-md border border-border bg-bg-1 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-border-strong hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
              <div className="flex h-10 w-10 items-center justify-center rounded border border-border bg-bg-3 transition-colors group-hover:bg-amber-dim">
                <f.icon size={18} className="text-amber transition-transform duration-150 group-hover:rotate-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-text-1">{t(f.h)}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-text-2">{t(f.b)}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------- Section 6 --------------------------------- */

function PortableJson() {
  const t = useT();
  const bullets: [DictKey, DictKey][] = [
    ["json.b1h", "json.b1"],
    ["json.b2h", "json.b2"],
    ["json.b3h", "json.b3"],
  ];
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-24 md:py-32">
      <FadeUp>
        <SectionEyebrow>{t("json.eyebrow")}</SectionEyebrow>
        <h2 className="mt-4 text-[clamp(28px,3.5vw,38px)] font-semibold tracking-tight text-text-1">
          {t("json.h2")}
        </h2>
        <p className="mt-4 max-w-[640px] text-[17px] text-text-2">{t("json.lead")}</p>
      </FadeUp>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <FadeUp delay={0.1}>
          <CodeBlock filename="goldenhollow-village.json" preClassName="max-h-[380px]">
            {highlightJson(DEMO_JSON)}
          </CodeBlock>
        </FadeUp>
        <FadeUp delay={0.2}>
          <CodeBlock filename="runtime.html" preClassName="max-h-[240px]">
            {highlightJs(RUNTIME_SNIPPET.split("\n").slice(0, 14).join("\n"))}
          </CodeBlock>
          <ul className="mt-5 space-y-2.5">
            {bullets.map(([h, b]) => (
              <li key={h} className="text-[15px] text-text-2">
                <strong className="text-text-1">{t(h)}</strong>{" "}
                <span className="font-mono text-[13px]">{t(b)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex gap-3">
            <Button variant="secondary" size="sm" asChild>
              <Link to="/guide">{t("json.readGuide")}</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(RUNTIME_SNIPPET);
                toast(t("json.copied"), { variant: "success" });
              }}
            >
              {t("json.copyRuntime")}
            </Button>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* --------------------------------- Section 7 --------------------------------- */

function GalleryTeaser() {
  const t = useT();
  const scenes = [
    { theme: "village" as const, name: "Goldenhollow Village" },
    { theme: "snow" as const, name: "Stillsnow Pass" },
    { theme: "ruins" as const, name: "Emberhold Ruins" },
    { theme: "alley" as const, name: "Neon Alley" },
  ];
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-24 md:py-32">
      <FadeUp className="flex items-end justify-between">
        <div>
          <SectionEyebrow>{t("teaser.eyebrow")}</SectionEyebrow>
          <h2 className="mt-4 text-[clamp(28px,3.5vw,38px)] font-semibold tracking-tight text-text-1">
            {t("teaser.h2")}
          </h2>
        </div>
        <Link
          to="/gallery"
          className="hidden font-mono text-[13px] text-text-2 transition-colors hover:text-amber sm:block"
        >
          {t("teaser.browse")}
        </Link>
      </FadeUp>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                  <MonoChip>{PLACEHOLDER_META[s.theme].tag}</MonoChip>
                  <MonoChip variant="teal">HD-2D</MonoChip>
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
  const t = useT();
  return (
    <section className="mx-auto max-w-[680px] px-4 py-24 text-center md:py-32">
      <FadeUp>
        <SectionEyebrow className="justify-center">{t("oss.eyebrow")}</SectionEyebrow>
        <h2 className="mt-4 text-[clamp(28px,3.5vw,38px)] font-semibold tracking-tight text-text-1">
          {t("oss.h2")}
        </h2>
        <p className="mt-4 text-[17px] leading-relaxed text-text-2">{t("oss.body")}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button variant="primary" asChild>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              <Github /> {t("oss.star")}
            </a>
          </Button>
          <Button variant="secondary" asChild>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              {t("oss.contribute")}
            </a>
          </Button>
        </div>
        <div className="mt-8 flex justify-center gap-2">
          <MonoChip>{t("oss.chip1")}</MonoChip>
          <MonoChip>{t("oss.chip2")}</MonoChip>
          <MonoChip>{t("oss.chip3")}</MonoChip>
        </div>
      </FadeUp>
    </section>
  );
}

/* --------------------------------- Section 9 --------------------------------- */

function FinalCta() {
  const navigate = useNavigate();
  const t = useT();
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
          {t("cta.h2")}
          <span className="animate-caret-blink text-amber">▮</span>
        </h2>
        <p className="mt-4 text-text-2">{t("cta.sub")}</p>
        <Button variant="primary" className="mt-8" onClick={() => navigate("/editor")}>
          {t("cta.launch")} <ArrowRight />
        </Button>
      </FadeUp>
    </section>
  );
}
