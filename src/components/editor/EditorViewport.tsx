import { useEffect, useRef, useState } from "react";
import { Crosshair, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import StageCanvas3D from "@/components/StageCanvas3DLazy";
import { PATH_PRESETS } from "@/core/cameraPaths";
import { focalDistance } from "@/core/types";
import { useSceneStore } from "@/store/sceneStore";
import { useT } from "@/i18n";
import type { DictKey } from "@/i18n/dict";
import { cn } from "@/lib/utils";

const PRESET_KEYS: Record<(typeof PATH_PRESETS)[number], DictKey> = {
  sweep: "term.sweep",
  orbit: "term.orbit",
  dolly: "term.dolly",
};

export default function EditorViewport({
  dragOver,
  onBrowse,
}: {
  dragOver: boolean;
  onBrowse: () => void;
}) {
  const {
    canvasSize,
    layers,
    camera,
    effects,
    setCamera,
    playing,
    setPlaying,
    pathPreset,
    setPathPreset,
    resetCamera,
    loadDemo,
  } = useSceneStore();
  const boxRef = useRef<HTMLDivElement>(null);
  const [stageW, setStageW] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [crosshairIdle, setCrosshairIdle] = useState(false);
  const [gridVisible, setGridVisible] = useState(false);
  const t = useT();

  // fit the stage into the available viewport box, preserving aspect ratio
  useEffect(() => {
    const box = boxRef.current!;
    const ro = new ResizeObserver(() => {
      const pad = 24;
      const availW = box.clientWidth - pad * 2;
      const availH = box.clientHeight - pad * 2;
      const aspect = canvasSize.width / canvasSize.height;
      setStageW(Math.max(0, Math.min(availW, availH * aspect)));
    });
    ro.observe(box);
    return () => ro.disconnect();
  }, [canvasSize]);

  // crosshair dims after 2s idle
  useEffect(() => {
    if (dragging) {
      setCrosshairIdle(false);
      return;
    }
    const timer = setTimeout(() => setCrosshairIdle(true), 2000);
    return () => clearTimeout(timer);
  }, [dragging, camera]);

  const stageH = stageW / (canvasSize.width / canvasSize.height);
  const empty = layers.length === 0;
  const distance = Math.round(camera.position.z - camera.target.z);
  const zoomPct = Math.round((focalDistance(canvasSize, camera.fov) / Math.max(1, distance)) * 100);

  return (
    <div ref={boxRef} className="relative min-w-0 flex-1 overflow-hidden bg-bg-0">
      <div className="flex h-full items-center justify-center">
        <div style={{ width: stageW || "100%" }} className="relative">
          {/* dimension tag */}
          <p className="absolute -top-6 left-0 font-mono text-[11px] text-text-3">
            <span className="text-teal">{canvasSize.width}</span> ×{" "}
            <span className="text-teal">{canvasSize.height}</span>
          </p>

          {/* stage frame with corner ticks */}
          <div
            className="relative border border-border-strong"
            style={{ width: stageW || "100%", height: stageH || "auto" }}
          >
            <CornerTicks />
            <div className="checker absolute inset-0" />
            <div className="absolute inset-0">
              <StageCanvas3D
                sceneSize={canvasSize}
                layers={layers}
                camera={camera}
                effects={effects}
                onCameraChange={(c, opts) => setCamera(c, opts)}
                playing={playing && !empty}
                editorMode
                pathPreset={pathPreset}
                grid={{ visible: gridVisible, step: 40 }}
                onDraggingChange={setDragging}
              />
            </div>
            {/* decorative scanlines, off while dragging */}
            {!dragging && (
              <div className="scanlines pointer-events-none absolute inset-0 opacity-60" />
            )}
            {/* center crosshair */}
            <div
              className={cn(
                "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500",
                crosshairIdle ? "opacity-[0.12]" : "opacity-30"
              )}
            >
              <div className="relative h-4 w-4">
                <div className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-amber" />
                <div className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-amber" />
              </div>
            </div>

            {/* HUD: camera readout */}
            <div className="absolute left-2 top-2 rounded-sm border border-border bg-bg-2/85 px-2 py-1 font-mono text-[11px] text-text-3">
              tgt.x <span className="text-teal">{pad4(camera.target.x)}</span> · tgt.y{" "}
              <span className="text-teal">{pad4(camera.target.y)}</span> · dist{" "}
              <span className="text-teal">{pad4(distance)}</span> · fov{" "}
              <span className="text-teal">{Math.round(camera.fov)}°</span> · {t("term.zoom")}{" "}
              <span className="text-teal">{zoomPct}%</span>
            </div>

            {/* HUD: path preset + play + grid + reset */}
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-sm border border-border bg-bg-2/85 px-2 py-1">
                <Switch
                  checked={playing}
                  onCheckedChange={setPlaying}
                  aria-label="Toggle camera path playback"
                  className="scale-75"
                />
                <div className="flex items-center rounded-sm border border-border">
                  {PATH_PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPathPreset(p);
                        setPlaying(true);
                      }}
                      className={cn(
                        "px-1.5 py-0.5 font-mono text-[10px] transition-colors",
                        pathPreset === p ? "bg-bg-3 text-amber" : "text-text-3 hover:text-text-1"
                      )}
                      aria-label={`${t("term.preset")}: ${t(PRESET_KEYS[p])}`}
                    >
                      {t(PRESET_KEYS[p])}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setGridVisible((v) => !v)}
                className={cn(
                  "flex items-center gap-1 rounded-sm border border-border bg-bg-2/85 px-2 py-1.5 font-mono text-[10px] transition-colors",
                  gridVisible ? "text-amber" : "text-text-3 hover:text-amber"
                )}
                aria-label="Toggle grid"
              >
                <Grid3X3 size={11} /> {t("vp.grid")}
              </button>
              <button
                onClick={resetCamera}
                className="flex items-center gap-1 rounded-sm border border-border bg-bg-2/85 px-2 py-1.5 font-mono text-[10px] text-text-3 transition-colors hover:text-amber"
              >
                <Crosshair size={11} /> {t("vp.resetCam")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* empty state */}
      {empty && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg-0/80">
          <img src="/empty-state.svg" alt="" className="w-32" />
          <h2 className="text-lg font-semibold text-text-1">{t("vp.dropFirst")}</h2>
          <p className="font-mono text-xs text-text-3">{t("vp.dropHint")}</p>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={onBrowse}>
              {t("vp.browse")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-amber"
              onClick={() => loadDemo("village")}
            >
              {t("vp.loadDemo")}
            </Button>
          </div>
        </div>
      )}

      {/* drag-over import state */}
      {dragOver && (
        <div className="pointer-events-none absolute inset-3 flex flex-col items-center justify-center gap-4 rounded border-2 border-dashed border-amber bg-amber-dim">
          <img src="/empty-state.svg" alt="" className="w-28" />
          <p className="font-pixel text-base tracking-wide text-amber">{t("vp.release")}</p>
        </div>
      )}
    </div>
  );
}

function CornerTicks() {
  const tick = "absolute h-2 w-2 border-amber/60";
  return (
    <>
      <div className={cn(tick, "-left-px -top-px border-l-2 border-t-2")} />
      <div className={cn(tick, "-right-px -top-px border-r-2 border-t-2")} />
      <div className={cn(tick, "-bottom-px -left-px border-b-2 border-l-2")} />
      <div className={cn(tick, "-bottom-px -right-px border-b-2 border-r-2")} />
    </>
  );
}

function pad4(n: number): string {
  const v = Math.round(n);
  return (v < 0 ? "-" : "") + String(Math.abs(v)).padStart(4, "0");
}
