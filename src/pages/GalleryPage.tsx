import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, ExternalLink, Layers as LayersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import CodeBlock from "@/components/CodeBlock";
import ScenePreview from "@/components/ScenePreview";
import { FadeUp, MonoChip, SectionEyebrow } from "@/components/marketing";
import { highlightJson } from "@/components/editor/ExportModal";
import {
  getCachedPlaceholderScene,
  PLACEHOLDER_META,
  type PlaceholderTheme,
} from "@/core/placeholder";
import { saveProject } from "@/core/storage";
import { useT } from "@/i18n";
import type { DictKey } from "@/i18n/dict";
import { GITHUB_URL } from "@/lib/constants";
import { toast } from "@/store/toastStore";
import { cn } from "@/lib/utils";

const THEMES: PlaceholderTheme[] = ["village", "snow", "ruins", "alley"];
const FILTERS: { key: string; label: DictKey }[] = [
  { key: "ALL", label: "gal.all" },
  { key: "TOWN", label: "gal.town" },
  { key: "NATURE", label: "gal.nature" },
  { key: "INTERIOR", label: "gal.interior" },
  { key: "URBAN", label: "gal.urban" },
];
const DESC_KEYS: Record<PlaceholderTheme, DictKey> = {
  village: "gal.villageDesc",
  snow: "gal.snowDesc",
  ruins: "gal.ruinsDesc",
  alley: "gal.alleyDesc",
};

export default function GalleryPage() {
  const t = useT();
  const [filter, setFilter] = useState("ALL");
  const [exploded, setExploded] = useState<PlaceholderTheme | null>(null);

  const visible = THEMES.filter((x) => filter === "ALL" || PLACEHOLDER_META[x].tag === filter);

  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-24 pt-40">
      <FadeUp>
        <SectionEyebrow>{t("gal.eyebrow")}</SectionEyebrow>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-text-1">{t("gal.h1")}</h1>
        <p className="mt-4 max-w-[560px] text-[17px] text-text-2">{t("gal.lead")}</p>
        <div className="mt-6 flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-sm border px-2.5 py-1 font-mono text-[11px] transition-colors",
                filter === f.key
                  ? "border-amber bg-amber-dim text-amber"
                  : "border-border bg-bg-2 text-text-3 hover:text-text-1"
              )}
            >
              {t(f.label)}
            </button>
          ))}
        </div>
      </FadeUp>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {visible.map((theme, i) => (
          <FadeUp key={theme} delay={i * 0.12}>
            <SceneCard theme={theme} onExplode={() => setExploded(theme)} />
          </FadeUp>
        ))}
      </div>

      {/* submit CTA */}
      <FadeUp className="mt-20">
        <div className="mx-auto max-w-[620px] rounded-md border border-dashed border-border-strong bg-bg-1 p-10 text-center">
          <p className="font-pixel text-lg text-text-1">{t("gal.submitTitle")}</p>
          <p className="mt-3 text-[15px] text-text-2">{t("gal.submitBody")}</p>
          <Button variant="secondary" className="mt-6" asChild>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              {t("gal.submitBtn")}
            </a>
          </Button>
        </div>
      </FadeUp>

      <ExplodeModal theme={exploded} onClose={() => setExploded(null)} />
    </main>
  );
}

/* --------------------------------- scene card --------------------------------- */

function SceneCard({ theme, onExplode }: { theme: PlaceholderTheme; onExplode: () => void }) {
  const navigate = useNavigate();
  const t = useT();
  const scene = getCachedPlaceholderScene(theme);
  const meta = PLACEHOLDER_META[theme];

  const openInEditor = async () => {
    await saveProject(scene);
    navigate("/editor");
  };

  const downloadJson = () => {
    const exportScene = {
      ...scene,
      layers: scene.layers.map((l) => ({ ...l, src: `${l.name.replace(/\s+/g, "-")}.png` })),
    };
    const blob = new Blob([JSON.stringify(exportScene, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meta.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast(t("gal.downloaded"), { variant: "success" });
  };

  return (
    <div className="group overflow-hidden rounded-md border border-border bg-bg-1 transition-all duration-200 hover:-translate-y-1 hover:border-border-strong hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      <div className="relative aspect-video">
        <ScenePreview theme={theme} />
        <div className="absolute right-2 top-2 flex gap-1.5">
          <span className="rounded-sm border border-border bg-bg-2/85 px-1.5 py-0.5 font-mono text-[10px] text-text-3">
            960×540
          </span>
          <span className="rounded-sm border border-border bg-bg-2/85 px-1.5 py-0.5 font-mono text-[10px] text-text-3">
            {scene.layers.length} {t("gal.layersChip")}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-1">{meta.name}</h3>
          <MonoChip variant="amber">{t(FILTERS.find((f) => f.key === meta.tag)!.label)}</MonoChip>
        </div>
        <p className="mt-1.5 text-sm text-text-2">{t(DESC_KEYS[theme])}</p>

        <div className="mt-3 space-y-0.5">
          {scene.layers.map((l) => (
            <p key={l.id} className="font-mono text-[11px] text-text-3">
              <span className="text-text-1">{l.name}</span>
              {" "}{"─".repeat(Math.max(1, 12 - l.name.length))}{" "}
              z <span className="text-teal">{l.depth}</span>
            </p>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="primary" size="sm" onClick={() => void openInEditor()}>
            <ExternalLink /> {t("gal.open")}
          </Button>
          <Button variant="secondary" size="sm" onClick={downloadJson}>
            <Download /> JSON
          </Button>
          <Button variant="ghost" size="sm" onClick={onExplode}>
            <LayersIcon /> {t("gal.explode")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- explode modal -------------------------------- */

function ExplodeModal({
  theme,
  onClose,
}: {
  theme: PlaceholderTheme | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const t = useT();
  const [explodedView, setExplodedView] = useState(true);
  if (!theme) return null;
  const scene = getCachedPlaceholderScene(theme);
  const meta = PLACEHOLDER_META[theme];
  const depths = scene.layers.map((l) => l.depth);

  const openInEditor = async () => {
    await saveProject(scene);
    navigate("/editor");
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[880px]">
        <DialogHeader>
          <DialogTitle>{meta.name.toUpperCase()}</DialogTitle>
          <DialogDescription>{t(DESC_KEYS[theme])}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[60%_40%]">
          {/* exploded stack view */}
          <div>
            <div
              className="relative flex aspect-video items-center justify-center overflow-hidden rounded-md border border-border bg-bg-0"
              style={{ perspective: "1200px" }}
            >
              <div
                className="relative h-full w-full transition-transform duration-700"
                style={{
                  transformStyle: "preserve-3d",
                  transform: explodedView ? "rotateX(52deg) rotateZ(-8deg) scale(0.72)" : "none",
                }}
              >
                {scene.layers.map((l, i) => (
                  <div
                    key={l.id}
                    className="absolute inset-0 transition-transform duration-700"
                    style={{
                      transform: explodedView ? `translateZ(${i * 56}px)` : "translateZ(0)",
                      transitionDelay: `${i * 80}ms`,
                    }}
                  >
                    <img
                      src={l.src}
                      alt={l.name}
                      className={cn(
                        "h-full w-full object-fill",
                        explodedView && "border border-border-strong"
                      )}
                      draggable={false}
                    />
                    {explodedView && (
                      <span className="absolute -left-1 top-1 rounded-sm border border-border bg-bg-2 px-1.5 py-0.5 font-mono text-[10px] text-teal">
                        z {l.depth}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="font-mono text-[10px] text-text-3">{t("gal.separation")}</p>
              <div className="flex items-center gap-2">
                <Switch checked={explodedView} onCheckedChange={setExplodedView} className="scale-90" />
                <span className="font-mono text-[11px] text-text-3">{t("gal.explodedView")}</span>
              </div>
            </div>
          </div>

          {/* data column */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                [t("gal.layersStat"), String(scene.layers.length)],
                [t("gal.canvasStat"), "960×540"],
                [t("gal.fxRange"), `${Math.min(...depths)} – ${Math.max(...depths)}`],
                [t("gal.tagStat"), t(FILTERS.find((f) => f.key === meta.tag)!.label)],
              ].map(([k, v]) => (
                <div key={k} className="rounded border border-border bg-bg-2 p-2.5">
                  <p className="font-mono text-[9px] text-text-3">{k}</p>
                  <p className="font-mono text-sm text-text-1">{v}</p>
                </div>
              ))}
            </div>

            <div className="border-l border-teal/40 pl-3">
              {scene.layers.map((l) => (
                <div key={l.id} className="flex items-center gap-2 py-1">
                  <div className="checker h-7 w-7 shrink-0 overflow-hidden rounded-sm border border-border">
                    <img src={l.src} alt="" className="h-full w-full object-contain" />
                  </div>
                  <span className="flex-1 truncate text-xs text-text-1">{l.name}</span>
                  <span className="font-mono text-[10px] text-teal">
                    z {l.depth} · {l.orientation === "ground" ? t("term.ground") : t("term.vertical")}
                  </span>
                </div>
              ))}
            </div>

            <CodeBlock filename="layer[0].json" preClassName="max-h-32 text-[10px]">
              {highlightJson(
                JSON.stringify(
                  { ...scene.layers[0], src: `${scene.layers[0].name.replace(/\s+/g, "-")}.png` },
                  null,
                  2
                )
              )}
            </CodeBlock>

            <Button variant="primary" size="sm" onClick={() => void openInEditor()}>
              <ExternalLink /> {t("gal.open")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
