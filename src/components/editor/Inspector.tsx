import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { computeScreenPos } from "@/core/parallax";
import type { Layer } from "@/core/types";
import { useSceneStore } from "@/store/sceneStore";
import { toast } from "@/store/toastStore";

const TIPS = [
  "factor 0 = locked to screen, 1 = glued to camera. Most scenes live between 0.05 and 0.8.",
  "Space toggles auto-sweep. R resets the camera.",
  "factor > 1 moves faster than the camera — perfect for foreground occluders.",
  "Keep factorY small (0.02–0.2) so vertical movement feels subtle.",
];

export default function Inspector() {
  const { layers, selectedId } = useSceneStore();
  const layer = layers.find((l) => l.id === selectedId) ?? null;

  return (
    <aside className="flex w-[304px] shrink-0 flex-col overflow-y-auto border-l border-border bg-bg-2">
      {layer ? <LayerInspector layer={layer} /> : <SceneInspector />}
    </aside>
  );
}

/* ------------------------------ layer selected ------------------------------ */

function LayerInspector({ layer }: { layer: Layer }) {
  const { camera, updateLayer, duplicateLayer, removeLayer, insertLayer } = useSceneStore();
  const pos = computeScreenPos(layer, camera);

  const set = (patch: Partial<Layer>) => updateLayer(layer.id, patch);

  const onDelete = () => {
    const removed = removeLayer(layer.id);
    if (!removed) return;
    toast("Layer deleted", {
      variant: "danger",
      actionLabel: "Undo",
      duration: 4000,
      onAction: () => insertLayer(removed.layer, removed.index),
    });
  };

  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-3">
          Inspector
        </span>
        <span className="rounded-sm border border-amber/40 bg-amber-dim px-1.5 py-0.5 font-mono text-[10px] text-amber">
          {layer.name}
        </span>
      </div>

      {/* preview strip */}
      <div className="checker flex h-24 items-center justify-center overflow-hidden rounded border border-border">
        <img src={layer.src} alt="" className="max-h-full max-w-full object-contain" />
      </div>

      {/* name */}
      <Field label="NAME">
        <Input
          value={layer.name}
          onChange={(e) => set({ name: e.target.value })}
          aria-label="Layer name"
        />
      </Field>

      {/* visibility */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-text-3">visible</span>
        <Switch
          checked={layer.visible}
          onCheckedChange={(v) => set({ visible: v })}
          aria-label="Toggle visibility"
        />
      </div>

      {/* parallax factors */}
      <div className="border-l-2 border-l-teal pl-3">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-text-3">
          Parallax factors
        </p>
        <FactorRow
          label="factorX"
          color="amber"
          value={layer.factorX}
          onChange={(v) => set({ factorX: v })}
        />
        <FactorRow
          label="factorY"
          color="teal"
          value={layer.factorY}
          onChange={(v) => set({ factorY: v })}
        />
        {/* the product's thesis made visible: live formula readout */}
        <div className="mt-2 space-y-1 rounded border border-border bg-bg-1 p-2 font-mono text-[11px] leading-relaxed">
          <p className="text-text-2">
            x = {fmt(layer.offsetX)} − {fmt(camera.x)} ×{" "}
            <span className="text-amber">{layer.factorX.toFixed(2)}</span> →{" "}
            <span className="text-teal">{fmt(pos.x)}px</span>
          </p>
          <p className="text-text-2">
            y = {fmt(layer.offsetY)} − {fmt(camera.y)} ×{" "}
            <span className="text-teal">{layer.factorY.toFixed(2)}</span> →{" "}
            <span className="text-teal">{fmt(pos.y)}px</span>
          </p>
        </div>
      </div>

      {/* transform */}
      <div>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-text-3">Transform</p>
        <div className="flex items-center gap-2">
          <span className="w-14 font-mono text-[11px] text-text-2">scale</span>
          <Slider
            min={0.1}
            max={4}
            step={0.05}
            value={[layer.scale]}
            onValueChange={([v]) => set({ scale: v })}
            className="flex-1"
          />
          <Input
            type="number"
            min={0.1}
            max={4}
            step={0.05}
            value={layer.scale}
            onChange={(e) => set({ scale: clampNum(+e.target.value, 0.1, 4) })}
            className="w-16 font-mono text-xs"
            aria-label="Scale"
          />
        </div>
        <div className="mt-2 flex gap-1.5 pl-14">
          {[0.5, 1, 2].map((v) => (
            <button
              key={v}
              onClick={() => set({ scale: v })}
              className="rounded-sm border border-border bg-bg-3 px-2 py-0.5 font-mono text-[10px] text-text-2 hover:border-border-strong hover:text-amber"
            >
              {v}×
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <OffsetInput
            label="offsetX"
            value={layer.offsetX}
            onChange={(v) => set({ offsetX: v })}
          />
          <OffsetInput
            label="offsetY"
            value={layer.offsetY}
            onChange={(v) => set({ offsetY: v })}
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="mt-2 font-mono text-[11px]"
          onClick={() => set({ scale: 1, offsetX: 0, offsetY: 0 })}
        >
          RESET TRANSFORM
        </Button>
      </div>

      {/* danger zone */}
      <div className="flex gap-2 border-t border-border pt-4">
        <Button variant="secondary" size="sm" className="flex-1" onClick={() => duplicateLayer(layer.id)}>
          <Copy /> Duplicate
        </Button>
        <Button variant="danger" size="sm" className="flex-1" onClick={onDelete}>
          <Trash2 /> Delete
        </Button>
      </div>
    </div>
  );
}

function FactorRow({
  label,
  color,
  value,
  onChange,
}: {
  label: string;
  color: "amber" | "teal";
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <span className="w-14 font-mono text-[11px] text-text-2">{label}</span>
        <Slider
          min={0}
          max={1.5}
          step={0.01}
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          trackColor={color}
          className="flex-1"
        />
        <Input
          type="number"
          min={0}
          max={1.5}
          step={0.01}
          value={value}
          onChange={(e) => onChange(clampNum(+e.target.value, 0, 1.5))}
          className="w-16 font-mono text-xs"
          aria-label={label}
        />
      </div>
      <div className="mt-1 flex justify-between pl-14 pr-[4.5rem] font-mono text-[9px] text-text-3">
        <span>0 locked</span>
        <span>0.5</span>
        <span>1 glued</span>
      </div>
    </div>
  );
}

function OffsetInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] text-text-3">{label}</span>
      <Input
        type="number"
        min={-4096}
        max={4096}
        step={1}
        value={value}
        onChange={(e) => onChange(clampNum(Math.round(+e.target.value), -4096, 4096))}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 10 : 1;
          if (e.key === "ArrowUp") onChange(clampNum(value + step, -4096, 4096));
          if (e.key === "ArrowDown") onChange(clampNum(value - step, -4096, 4096));
        }}
        className="font-mono text-xs"
      />
    </label>
  );
}

/* ----------------------------- nothing selected ----------------------------- */

function SceneInspector() {
  const { canvasSize, setCanvasSize, layers } = useSceneStore();
  const tip = TIPS[new Date().getMinutes() % TIPS.length];
  const storageBytes = layers.reduce((n, l) => n + (l.src.startsWith("data:") ? l.src.length : 0), 0);
  const pct = Math.min(100, Math.round((storageBytes / (4 * 1024 * 1024)) * 100));

  return (
    <div className="flex flex-col gap-5 p-4">
      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-3">
        Scene
      </span>

      <Field label="CANVAS SIZE">
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { w: 640, h: 360 },
            { w: 960, h: 540 },
            { w: 1280, h: 720 },
          ].map((p) => {
            const active = p.w === canvasSize.width && p.h === canvasSize.height;
            return (
              <button
                key={p.w}
                onClick={() => setCanvasSize({ width: p.w, height: p.h })}
                className={
                  active
                    ? "rounded border border-amber/50 bg-amber-dim px-1 py-1.5 font-mono text-[10px] text-amber"
                    : "rounded border border-border bg-bg-1 px-1 py-1.5 font-mono text-[10px] text-text-3 hover:text-text-1"
                }
              >
                {p.w}×{p.h}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="flex items-center justify-between font-mono text-[11px]">
        <span className="text-text-3">layers</span>
        <span className="text-text-1">{layers.length}</span>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between font-mono text-[11px]">
          <span className="text-text-3">storage</span>
          <span className={pct > 80 ? "text-amber" : "text-text-1"}>{fmtBytes(storageBytes)}</span>
        </div>
        <div className="h-1 w-full bg-bg-3">
          <div
            className={pct > 80 ? "h-full bg-amber" : "h-full bg-teal"}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <p className="font-mono text-[10px] leading-relaxed text-text-3">
        deepest empty pixels render as checker
      </p>

      <div className="rounded border border-teal/30 border-l-2 border-l-teal bg-teal-dim p-3">
        <p className="text-xs leading-relaxed text-text-2">{tip}</p>
      </div>
    </div>
  );
}

/* --------------------------------- helpers --------------------------------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-text-3">{label}</p>
      {children}
    </div>
  );
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function clampNum(v: number, min: number, max: number) {
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, v));
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
