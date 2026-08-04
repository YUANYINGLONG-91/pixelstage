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
import { useT } from "@/i18n";
import type { DictKey } from "@/i18n/dict";
import { toast } from "@/store/toastStore";
import { cn } from "@/lib/utils";

const FACTOR_ROWS: [string, DictKey, DictKey][] = [
  ["0.00", "guide.model.r1b", "guide.model.r1u"],
  ["0.05 – 0.20", "guide.model.r2b", "guide.model.r2u"],
  ["0.30 – 0.55", "guide.model.r3b", "guide.model.r3u"],
  ["0.70 – 0.90", "guide.model.r4b", "guide.model.r4u"],
  ["1.00", "guide.model.r5b", "guide.model.r5u"],
];

const SCHEMA_ROWS: [string, string, string, DictKey][] = [
  ["version", "number", "1", "guide.schema.d1"],
  ["canvas.width / height", "number", "—", "guide.schema.d2"],
  ["camera.x / y", "number", "—", "guide.schema.d3"],
  ["layers[]", "array", "[]", "guide.schema.d4"],
  ["layer.name", "string", "—", "guide.schema.d5"],
  ["layer.src", "string", "—", "guide.schema.d6"],
  ["layer.factorX / factorY", "number", "0.5 / 0.2", "guide.schema.d7"],
  ["layer.scale", "number", "1", "guide.schema.d8"],
  ["layer.offsetX / offsetY", "number", "0", "guide.schema.d9"],
  ["layer.visible", "boolean", "true", "guide.schema.d10"],
];

const FAQ: [DictKey, DictKey][] = [
  ["guide.faq1q", "guide.faq1a"],
  ["guide.faq2q", "guide.faq2a"],
  ["guide.faq3q", "guide.faq3a"],
  ["guide.faq4q", "guide.faq4a"],
  ["guide.faq5q", "guide.faq5a"],
  ["guide.faq6q", "guide.faq6a"],
];

export default function GuidePage() {
  const t = useT();
  const [active, setActive] = useState("quick-start");

  const TOC = [
    { id: "quick-start", label: t("guide.toc1") },
    { id: "parallax-model", label: t("guide.toc2") },
    { id: "json-format", label: t("guide.toc3") },
    { id: "runtime", label: t("guide.toc4") },
    { id: "engines", label: t("guide.toc5") },
    { id: "faq", label: t("guide.toc6") },
  ];

  // scroll-spy
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    TOC.forEach((x) => {
      const el = document.getElementById(x.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    toast(`${t("export.downloaded")} sunset-valley.json`, { variant: "success" });
  };

  const steps: { n: string; h: DictKey; b: DictKey }[] = [
    { n: "01", h: "guide.step1h", b: "guide.step1b" },
    { n: "02", h: "guide.step2h", b: "guide.step2b" },
    { n: "03", h: "guide.step3h", b: "guide.step3b" },
  ];

  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-24 pt-28">
      <div className="grid gap-12 lg:grid-cols-[224px_1fr]">
        {/* sticky TOC */}
        <nav className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-1">
            {TOC.map((x) => (
              <a
                key={x.id}
                href={`#${x.id}`}
                className={cn(
                  "border-l-2 px-3 py-1.5 font-mono text-xs transition-colors",
                  active === x.id
                    ? "border-amber text-amber"
                    : "border-transparent text-text-3 hover:text-text-1"
                )}
              >
                {x.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="max-w-[760px] space-y-24">
          {/* 01 quick start */}
          <section id="quick-start" className="scroll-mt-24">
            <FadeUp>
              <SectionEyebrow>{t("guide.eyebrow")}</SectionEyebrow>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-text-1">
                {t("guide.h1")}
              </h1>
              <p className="mt-4 text-[17px] text-text-2">{t("guide.lead")}</p>
            </FadeUp>
            <div className="mt-10 space-y-8">
              {steps.map((s, i) => (
                <FadeUp key={s.n} delay={i * 0.1}>
                  <div className="flex gap-4">
                    <span className="font-pixel text-2xl text-amber">{s.n}</span>
                    <div>
                      <h3 className="text-xl font-semibold text-text-1">{t(s.h)}</h3>
                      <p className="mt-2 leading-relaxed text-text-2">{t(s.b)}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
              <FadeUp delay={0.2}>
                <Button variant="primary" size="sm" asChild>
                  <Link to="/editor">
                    {t("guide.openEditor")} <ArrowRight />
                  </Link>
                </Button>
              </FadeUp>
            </div>
          </section>

          {/* 02 parallax model */}
          <section id="parallax-model" className="scroll-mt-24 border-t border-border pt-16">
            <FadeUp>
              <h2 className="text-3xl font-semibold tracking-tight text-text-1">
                {t("guide.model.h2")}
              </h2>
              <p className="mt-4 leading-relaxed text-text-2">{t("guide.model.body")}</p>
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
                      <th className="px-4 py-3">{t("guide.model.factor")}</th>
                      <th className="px-4 py-3">{t("guide.model.behavior")}</th>
                      <th className="px-4 py-3">{t("guide.model.use")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FACTOR_ROWS.map(([f, b, u]) => (
                      <tr
                        key={f}
                        className="border-b border-border/50 transition-colors last:border-0 hover:bg-bg-3/50"
                      >
                        <td className="px-4 py-3 font-mono text-teal">{f}</td>
                        <td className="px-4 py-3 text-text-2">{t(b)}</td>
                        <td className="px-4 py-3 text-text-3">{t(u)}</td>
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
                {t("guide.model.note")}
              </div>
            </FadeUp>
          </section>

          {/* 03 json format */}
          <section id="json-format" className="scroll-mt-24 border-t border-border pt-16">
            <FadeUp>
              <h2 className="text-3xl font-semibold tracking-tight text-text-1">
                {t("guide.schema.h2")}
              </h2>
              <p className="mt-4 leading-relaxed text-text-2">{t("guide.schema.body")}</p>
            </FadeUp>
            <FadeUp delay={0.1}>
              <div className="mt-6 overflow-x-auto rounded-md border border-border">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg-2 font-mono text-[11px] uppercase tracking-wider text-text-3">
                      <th className="px-4 py-3">{t("guide.schema.field")}</th>
                      <th className="px-4 py-3">{t("guide.schema.type")}</th>
                      <th className="px-4 py-3">{t("guide.schema.default")}</th>
                      <th className="px-4 py-3">{t("guide.schema.desc")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCHEMA_ROWS.map(([f, ty, d, desc]) => (
                      <tr
                        key={f}
                        className="border-b border-border/50 transition-colors last:border-0 hover:bg-bg-3/50"
                      >
                        <td className="px-4 py-2.5 font-mono text-xs text-amber">{f}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-teal">{ty}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-text-3">{d}</td>
                        <td className="px-4 py-2.5 text-text-2">{t(desc)}</td>
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
                {t("guide.runtime.h2")}
              </h2>
              <p className="mt-4 leading-relaxed text-text-2">{t("guide.runtime.body")}</p>
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
                  {t("guide.runtime.b1")}
                </li>
                <li>· {t("guide.runtime.b2")}</li>
                <li>
                  · <code className="font-mono text-[13px] text-teal">camera</code>{" "}
                  {t("guide.runtime.b3")}
                </li>
              </ul>
            </FadeUp>
            <FadeUp delay={0.2}>
              <div className="mt-6 rounded-md border border-amber/50 bg-bg-1 p-5">
                <p className="text-sm leading-relaxed text-text-2">
                  <strong className="text-amber">{t("guide.runtime.verify")}</strong>{" "}
                  {t("guide.runtime.verifyBody")}
                </p>
                <Button variant="secondary" size="sm" className="mt-4" onClick={downloadDemo}>
                  {t("guide.runtime.download")}
                </Button>
              </div>
            </FadeUp>
          </section>

          {/* 05 engine recipes */}
          <section id="engines" className="scroll-mt-24 border-t border-border pt-16">
            <FadeUp>
              <h2 className="text-3xl font-semibold tracking-tight text-text-1">
                {t("guide.engines.h2")}
              </h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <Accordion type="single" collapsible className="mt-6">
                <AccordionItem value="phaser">
                  <AccordionTrigger>Phaser 3</AccordionTrigger>
                  <AccordionContent>
                    {t("guide.engines.phaser")}
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
                    {t("guide.engines.godot")}
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
                    {t("guide.engines.web")}
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
                {t("guide.faq.h2")}
              </h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <Accordion type="single" collapsible className="mt-6">
                {FAQ.map(([q, a], i) => (
                  <AccordionItem key={q} value={`faq-${i}`}>
                    <AccordionTrigger>{t(q)}</AccordionTrigger>
                    <AccordionContent>{t(a)}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </FadeUp>
          </section>

          {/* closing CTA */}
          <FadeUp className="border-t border-border pt-16 text-center">
            <p className="font-pixel text-xl text-text-1">
              {t("guide.cta")}
              <span className="animate-caret-blink text-amber">▮</span>
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="primary" asChild>
                <Link to="/editor">{t("guide.ctaOpen")}</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/gallery">{t("guide.ctaGallery")}</Link>
              </Button>
            </div>
          </FadeUp>
        </div>
      </div>
    </main>
  );
}
