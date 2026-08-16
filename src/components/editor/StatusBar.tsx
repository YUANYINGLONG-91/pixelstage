import { focalDistance } from "@/core/types";
import { useSceneStore } from "@/store/sceneStore";
import { useT } from "@/i18n";

export default function StatusBar({
  savedAt,
  onOpenShortcuts,
}: {
  savedAt: Date | null;
  onOpenShortcuts: () => void;
}) {
  const { camera, layers, canvasSize, selectedId, selectedIds } = useSceneStore();
  const t = useT();
  const selected = layers.find((l) => l.id === selectedId);
  const storageBytes = layers.reduce((n, l) => n + (l.src.startsWith("data:") ? l.src.length : 0), 0);
  const distance = Math.max(1, Math.round(camera.position.z - camera.target.z));
  const zoomPct = Math.round((focalDistance(canvasSize, camera.fov) / distance) * 100);

  return (
    <footer className="flex h-7 shrink-0 items-center justify-between border-t border-border bg-bg-2 px-3 font-mono text-[11px] text-text-3">
      <div className="flex items-center gap-4">
        <span>
          {t("sb.cam")} <span className="text-teal">{Math.round(camera.target.x)}</span>,{" "}
          <span className="text-teal">{Math.round(camera.target.y)}</span>
        </span>
        <span>
          {t("term.zoom")} <span className="text-teal">{zoomPct}%</span>
        </span>
        <span>
          {t("sb.layers")} <span className="text-text-1">{layers.length}</span>
        </span>
        <span>
          {canvasSize.width}×{canvasSize.height}
        </span>
        {selected && (
          <span className="rounded-sm border border-amber/40 bg-amber-dim px-1.5 text-amber">
            {selected.name}
            {selectedIds.length > 1 && <span className="text-teal"> ×{selectedIds.length}</span>}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className={storageBytes > 3.2 * 1024 * 1024 ? "text-amber" : ""}>
          local {(storageBytes / 1024 / 1024).toFixed(1)}MB
        </span>
        {savedAt && <span>{t("ed.saved")} {savedAt.toTimeString().slice(0, 5)}</span>}
        <span>webgl · hd-2d · v2.2</span>
        <button onClick={onOpenShortcuts} className="hover:text-amber">
          {t("sb.shortcuts")}
        </button>
      </div>
    </footer>
  );
}
