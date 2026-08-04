import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import CodeBlock from "@/components/CodeBlock";
import { FadeUp, SectionEyebrow } from "@/components/marketing";
import { highlightJs, highlightJson } from "@/components/editor/ExportModal";
import { RUNTIME_SNIPPET } from "@/core/scene";
import { getCachedPlaceholderScene } from "@/core/placeholder";
import { toast } from "@/store/toastStore";
import { cn } from "@/lib/utils";

const TOC = [
  { id: "quick-start", label: "01 QUICK START" },
  { id: "parallax-model", label: "02 THE PARALLAX MODEL" },
  { id: "json-format", label: "03 SCENE.JSON FORMAT" },
  { id: "runtime", label: "04 RUNTIME SNIPPET" },
  { id: "engines", label: "05 ENGINE RECIPES" },
  { id: "faq", label: "06 FAQ" },
];

const FACTOR_TABLE = [
  ["0.00", "Locked to the screen — never moves", "UI overlays, vignettes"],
  ["0.05 – 0.20", "Barely drifts — feels infinitely far", "Sky, distant mountains"],
  ["0.30 – 0.55", "The classic midground", "Hills, trees, buildings"],
  ["0.70 – 0.90", "Close and fast", "Foreground grass, props"],
  ["1.00", "Glued to the camera plane", "The ground the player walks on"],
];

const SCHEMA_TABLE: [string, string, string, string][] = [
  ["version", "number", "1", "Schema version."],
  ["canvas.width / height", "number", "—", "Stage size in pixels."],
  ["camera.x / y", "number", "—", "Camera position at export time."],
  ["layers[]", "array", "[]", "Back-to-front order — index 0 is farthest."],
  ["layer.name", "string", "—", "Display name from the layer list."],
  ["layer.src", "string", "—", "Asset filename, or base64 dataURL if embedded at export."],
  ["layer.factorX / factorY", "number", "0.5 / 0.2", "Parallax factor per axis, 0.00 – 1.50."],
  ["layer.scale", "number", "1", "Uniform draw scale, 0.10 – 4.00."],
  ["layer.offsetX / offsetY", "number", "0", "Base position shift on the stage."],
  ["layer.visible", "boolean", "true", "Skip rendering when false."],
];

const FAQ = [
  [
    "Is my art uploaded anywhere?",
    "No. PixelStage is a static page with zero backend. Images live in your browser's memory and localStorage/IndexedDB; export travels as a file you download. Check the network tab — it's silent.",
  ],
  [
    "Can I use it commercially?",
    "Yes. MIT license — use the tool, the JSON, and the runtime snippet in any game, commercial or not. Attribution appreciated, never required.",
  ],
  [
    "What engines does the export support?",
    "Anything that can draw images and read JSON. The format is deliberately boring: order, src, factors, scale, offset.",
  ],
  [
    "How do I choose good factors?",
    "Start with sky 0.05, far 0.15, mid 0.4, front 0.8. Then drag the camera and trust your eyes — depth should feel like looking through a window, not a conveyor belt.",
  ],
  [
    "Why not Tiled / LDtk / Aseprite?",
    "Different jobs: Tiled and LDtk edit tilemaps, Aseprite edits sprites. None of them choreograph multi-layer parallax scenes with camera preview. PixelStage does exactly that one job.",
  ],
  [
    "Big images? Storage limits?",
    "Parameters live in localStorage (~5MB); image payloads live in IndexedDB (much larger). The editor warns before limits, and project-file export (with embedded base64) is the escape hatch for heavy scenes.",
  ],
];

export default function GuidePage() {
  const [active, setActive] = useState(TOC[0].id);

  // scroll-spy
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    TOC.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const demoJson = JSON.stringify(
    {
      version: 1,
      name: "Sunset Valley",
      canvas: { width: 960, height: 540 },
      camera: { x: 480, y: 270 },
      layers: getCachedPlaceholderScene("valley").layers.map((l) => ({
        ...l,
        src: `${l.name.replace(/\s+/g, "-")}.png`,
      })),
    },
    null,
    2
  );

  const downloadDemo = () => {
    const blob = new Blob([demoJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sunset-valley.json";
    a.click();
    URL.revokeObjectURL(url);
    toast("Downloaded sunset-valley.json", { variant: "success" });
  };

  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-24 pt-28">
      <div className="grid gap-12 lg:grid-cols-[224px_1fr]">
        {/* sticky TOC */}
        <nav className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-1">
            {TOC.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className={cn(
                  "border-l-2 px-3 py-1.5 font-mono text-xs transition-colors",
                  active === t.id
                    ? "border-amber text-amber"
                    : "border-transparent text-text-3 hover:text-text-1"
                )}
              >
                {t.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="max-w-[760px] space-y-24">
          {/* 01 quick start */}
          <section id="quick-start" className="scroll-mt-24">
            <FadeUp>
              <SectionEyebrow>Docs</SectionEyebrow>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-text-1">
                Getting started with PixelStage
              </h1>
              <p className="mt-4 text-[17px] text-text-2">
                From layered art to a running parallax scene in about five minutes. Everything below
                is real — the JSON, the math, the snippet.
              </p>
            </FadeUp>
            <div className="mt-10 space-y-8">
              {[
                {
                  n: "01",
                  h: "Import your layers",
                  b: "Open the editor and drag your PNG/JPG layers onto the canvas — background first, then midground, foreground. Or press Load demo scene to explore with the Sunset Valley set.",
                },
                {
                  n: "02",
                  h: "Tune the depth",
                  b: "Select a layer and set factorX / factorY. Drag the camera (or hit Space for auto-sweep) and watch screen = base + offset − cam × factor do its thing.",
                },
                {
                  n: "03",
                  h: "Export and render",
                  b: "Export scene.json, drop it next to your assets, and render it with the snippet in section 04. The pixels will match the editor exactly.",
                },
              ].map((s, i) => (
                <FadeUp key={s.n} delay={i * 0.1}>
                  <div className="flex gap-4">
                    <span className="font-pixel text-2xl text-amber">{s.n}</span>
                    <div>
                      <h3 className="text-xl font-semibold text-text-1">{s.h}</h3>
                      <p className="mt-2 leading-relaxed text-text-2">{s.b}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
              <FadeUp delay={0.2}>
                <Button variant="primary" size="sm" asChild>
                  <Link to="/editor">
                    Open the editor <ArrowRight />
                  </Link>
                </Button>
              </FadeUp>
            </div>
          </section>

          {/* 02 parallax model */}
          <section id="parallax-model" className="scroll-mt-24 border-t border-border pt-16">
            <FadeUp>
              <h2 className="text-3xl font-semibold tracking-tight text-text-1">
                One multiply is the whole engine.
              </h2>
              <p className="mt-4 leading-relaxed text-text-2">
                Every layer sits on a shared stage. When the camera moves, each layer shifts in the
                opposite direction, scaled by its factor:
              </p>
            </FadeUp>
            <FadeUp delay={0.1}>
              <div className="mt-6 rounded-md border border-border bg-bg-1 p-6 text-center font-mono text-[15px] text-teal md:text-lg">
                screenPos = layerBase + layerOffset − cameraPos × layerFactor
              </div>
            </FadeUp>
            <FadeUp delay={0.15}>
              <div className="mt-6 overflow-x-auto rounded-md border border-border">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg-2 font-mono text-[11px] uppercase tracking-wider text-text-3">
                      <th className="px-4 py-3">Factor</th>
                      <th className="px-4 py-3">Behavior</th>
                      <th className="px-4 py-3">Typical use</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FACTOR_TABLE.map(([f, b, u]) => (
                      <tr
                        key={f}
                        className="border-b border-border/50 transition-colors last:border-0 hover:bg-bg-3/50"
                      >
                        <td className="px-4 py-3 font-mono text-teal">{f}</td>
                        <td className="px-4 py-3 text-text-2">{b}</td>
                        <td className="px-4 py-3 text-text-3">{u}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </FadeUp>
            <FadeUp delay={0.2}>
              <div className="mt-6 rounded-md border border-border bg-bg-1 p-4">
                <img src="/factor-diagram.svg" alt="Parallax factor diagram" className="w-full" />
              </div>
            </FadeUp>
            <FadeUp delay={0.25}>
              <div className="mt-6 rounded border border-teal/30 border-l-2 border-l-teal bg-teal-dim p-4 text-sm leading-relaxed text-text-2">
                factorX and factorY are independent. Most pixel scenes keep factorY small
                (0.02–0.2) so vertical movement feels subtle — or lock it to 0 entirely.
              </div>
            </FadeUp>
          </section>

          {/* 03 json format */}
          <section id="json-format" className="scroll-mt-24 border-t border-border pt-16">
            <FadeUp>
              <h2 className="text-3xl font-semibold tracking-tight text-text-1">
                The whole scene is one file.
              </h2>
              <p className="mt-4 leading-relaxed text-text-2">
                Export writes a single JSON document. Version 1 of the schema is frozen — your
                scenes will keep rendering forever.
              </p>
            </FadeUp>
            <FadeUp delay={0.1}>
              <div className="mt-6 overflow-x-auto rounded-md border border-border">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg-2 font-mono text-[11px] uppercase tracking-wider text-text-3">
                      <th className="px-4 py-3">Field</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Default</th>
                      <th className="px-4 py-3">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCHEMA_TABLE.map(([f, t, d, desc]) => (
                      <tr
                        key={f}
                        className="border-b border-border/50 transition-colors last:border-0 hover:bg-bg-3/50"
                      >
                        <td className="px-4 py-2.5 font-mono text-xs text-amber">{f}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-teal">{t}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-text-3">{d}</td>
                        <td className="px-4 py-2.5 text-text-2">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </FadeUp>
            <FadeUp delay={0.15}>
              <CodeBlock filename="sunset-valley.json" className="mt-6" preClassName="max-h-[320px]">
                {highlightJson(demoJson)}
              </CodeBlock>
            </FadeUp>
          </section>

          {/* 04 runtime */}
          <section id="runtime" className="scroll-mt-24 border-t border-border pt-16">
            <FadeUp>
              <h2 className="text-3xl font-semibold tracking-tight text-text-1">
                Render it anywhere in ~20 lines.
              </h2>
              <p className="mt-4 leading-relaxed text-text-2">
                No dependency, no build step. Plain Canvas 2D. Read every line — then paste it into
                your game.
              </p>
            </FadeUp>
            <FadeUp delay={0.1}>
              <CodeBlock filename="runtime.js" className="mt-6" preClassName="max-h-[420px]">
                {highlightJs(RUNTIME_SNIPPET)}
              </CodeBlock>
            </FadeUp>
            <FadeUp delay={0.15}>
              <ul className="mt-5 space-y-2 text-[15px] text-text-2">
                <li>
                  · <code className="font-mono text-[13px] text-teal">imageSmoothingEnabled = false</code>{" "}
                  keeps pixels crisp at any scale.
                </li>
                <li>· The loop draws back-to-front — exactly the editor's layer list order.</li>
                <li>
                  · <code className="font-mono text-[13px] text-teal">camera</code> is yours: bind it
                  to a player, a mouse, or a cutscene timeline.
                </li>
              </ul>
            </FadeUp>
            <FadeUp delay={0.2}>
              <div className="mt-6 rounded-md border border-amber/50 bg-bg-1 p-5">
                <p className="text-sm leading-relaxed text-text-2">
                  <strong className="text-amber">Want to verify it?</strong> Export the demo scene,
                  serve the folder with any static server, and call{" "}
                  <code className="font-mono text-xs text-teal">
                    loadScene('./sunset-valley.json', canvas)
                  </code>
                  . Animate camera.x and compare against the editor — pixel for pixel.
                </p>
                <Button variant="secondary" size="sm" className="mt-4" onClick={downloadDemo}>
                  Download demo scene.json
                </Button>
              </div>
            </FadeUp>
          </section>

          {/* 05 engine recipes */}
          <section id="engines" className="scroll-mt-24 border-t border-border pt-16">
            <FadeUp>
              <h2 className="text-3xl font-semibold tracking-tight text-text-1">
                Using your engine?
              </h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <Accordion type="single" collapsible className="mt-6">
                <AccordionItem value="phaser">
                  <AccordionTrigger>Phaser 3</AccordionTrigger>
                  <AccordionContent>
                    Load the JSON in <code className="font-mono text-xs text-teal">preload()</code>,
                    then{" "}
                    <code className="font-mono text-xs text-teal">this.add.image()</code> per layer
                    with{" "}
                    <code className="font-mono text-xs text-teal">
                      setScrollFactor(factorX, factorY)
                    </code>{" "}
                    — Phaser's scrollFactor <em>is</em> the PixelStage factor, zero math required.
                    Keep <code className="font-mono text-xs text-teal">pixelArt: true</code> in your
                    game config.
                    <CodeBlock filename="phaser.js" className="mt-3" preClassName="text-[11px]">
                      {highlightJs(`const scene = this.cache.json.get('scene');
scene.layers.forEach((l, i) => {
  this.add.image(l.offsetX, l.offsetY, l.name)
    .setOrigin(0).setScale(l.scale)
    .setScrollFactor(l.factorX, l.factorY);
});`)}
                    </CodeBlock>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="godot">
                  <AccordionTrigger>Godot 4</AccordionTrigger>
                  <AccordionContent>
                    Use a <code className="font-mono text-xs text-teal">ParallaxBackground</code> +{" "}
                    <code className="font-mono text-xs text-teal">ParallaxLayer</code> per layer;
                    set{" "}
                    <code className="font-mono text-xs text-teal">
                      motion_scale = Vector2(1 − factorX, 1 − factorY)
                    </code>{" "}
                    (Godot's scale is inverse — one subtraction). Or draw manually in{" "}
                    <code className="font-mono text-xs text-teal">_draw()</code> with the same
                    formula.
                    <CodeBlock filename="parallax_layer.gd" className="mt-3" preClassName="text-[11px]">
                      {highlightJs(`for l in scene.layers:
    var pl := ParallaxLayer.new()
    pl.motion_scale = Vector2(1 - l.factorX, 1 - l.factorY)
    pl.motion_offset = Vector2(l.offsetX, l.offsetY)
    pl.add_child(sprite_for(l.src))`)}
                    </CodeBlock>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="web">
                  <AccordionTrigger>Electron / bare web</AccordionTrigger>
                  <AccordionContent>
                    The snippet in section 04 is production-ready. Wrap it in a{" "}
                    <code className="font-mono text-xs text-teal">requestAnimationFrame</code> loop,
                    drive <code className="font-mono text-xs text-teal">camera</code> from input,
                    and ship.
                    <CodeBlock filename="main.js" className="mt-3" preClassName="text-[11px]">
                      {highlightJs(`const render = await loadScene('./scene.json', canvas);
(function loop() {
  camera.x = player.x - canvas.width / 2;  // your call
  render();
  requestAnimationFrame(loop);
})();`)}
                    </CodeBlock>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </FadeUp>
          </section>

          {/* 06 faq */}
          <section id="faq" className="scroll-mt-24 border-t border-border pt-16">
            <FadeUp>
              <h2 className="text-3xl font-semibold tracking-tight text-text-1">
                Questions, answered.
              </h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <Accordion type="single" collapsible className="mt-6">
                {FAQ.map(([q, a], i) => (
                  <AccordionItem key={q} value={`faq-${i}`}>
                    <AccordionTrigger>{q}</AccordionTrigger>
                    <AccordionContent>{a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </FadeUp>
          </section>

          {/* closing CTA */}
          <FadeUp className="border-t border-border pt-16 text-center">
            <p className="font-pixel text-xl text-text-1">
              READY WHEN YOU ARE<span className="animate-caret-blink text-amber">▮</span>
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="primary" asChild>
                <Link to="/editor">Open the Editor</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/gallery">Browse example scenes</Link>
              </Button>
            </div>
          </FadeUp>
        </div>
      </div>
    </main>
  );
}
