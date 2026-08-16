import { useState } from "react";
import { Box, Download, Gamepad2, Globe, Map, Puzzle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildEngineZip, ENGINE_ORDER, type EngineId } from "@/core/exporters";
import { getEditorCanvas } from "@/core/editorCanvas";
import { saveBlob } from "@/core/platform";
import { useSceneStore } from "@/store/sceneStore";
import { toast } from "@/store/toastStore";
import { useT } from "@/i18n";
import type { DictKey } from "@/i18n/dict";

const ENGINE_META: Record<EngineId, { label: string; icon: typeof Globe; descKey: DictKey }> = {
  godot: { label: "Godot 4", icon: Gamepad2, descKey: "engine.godot.desc" },
  unity: { label: "Unity", icon: Box, descKey: "engine.unity.desc" },
  cocos: { label: "Cocos Creator", icon: Puzzle, descKey: "engine.cocos.desc" },
  rpgmaker: { label: "RPG Maker", icon: Map, descKey: "engine.rpgmaker.desc" },
  web: { label: "Web", icon: Globe, descKey: "engine.web.desc" },
};

/** Engine export: pick a target, get a ready-to-import zip for it. */
export default function EngineExportTab() {
  const t = useT();
  const { toJSON } = useSceneStore();
  const [engine, setEngine] = useState<EngineId>("godot");
  const [busy, setBusy] = useState(false);

  const doExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      let snapshot: Uint8Array | null = null;
      if (engine === "rpgmaker") {
        const canvas = getEditorCanvas();
        if (canvas) {
          const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
          if (blob) snapshot = new Uint8Array(await blob.arrayBuffer());
        }
      }
      const result = buildEngineZip(engine, toJSON(), { snapshot });
      const saved = await saveBlob(result.blob, { defaultPath: result.filename });
      if (saved) {
        const warn = !result.snapshotIncluded ? ` (${t("engine.noSnapshot")})` : "";
        toast(`${t("export.downloaded")} ${result.filename}${warn}`, { variant: "success" });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-text-2">{t("export.engineBlurb")}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ENGINE_ORDER.map((id) => {
          const meta = ENGINE_META[id];
          const Icon = meta.icon;
          const active = engine === id;
          return (
            <button
              key={id}
              onClick={() => setEngine(id)}
              className={`flex items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                active
                  ? "border-amber bg-bg-3"
                  : "border-border bg-bg-2 hover:border-text-3"
              }`}
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-amber" : "text-text-3"}`} />
              <span>
                <span className={`block font-mono text-xs ${active ? "text-amber" : "text-text-1"}`}>
                  {meta.label}
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-text-3">{t(meta.descKey)}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-end">
        <Button variant="primary" size="sm" onClick={() => void doExport()} disabled={busy}>
          <Download /> {busy ? t("engine.exporting") : t("engine.export")} — {ENGINE_META[engine].label}
        </Button>
      </div>
    </div>
  );
}
