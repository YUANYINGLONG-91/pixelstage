import { AlignCenterHorizontal, AlignCenterVertical, Copy, FlipHorizontal2, FlipVertical2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NumberField from "@/components/ui/number-field";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { focalDistance } from "@/core/types";
import { peekBitmap } from "@/core/bitmaps";
import type { Layer } from "@/core/types";
import { useSceneStore } from "@/store/sceneStore";
import { useT } from "@/i18n";
import { toast } from "@/store/toastStore";
import { cn } from "@/lib/utils";


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
  const t = useT();
  const { canvasSize, camera, updateLayer, duplicateLayer, removeLayer, selectedIds } =
    useSceneStore();
  const D = focalDistance(canvasSize, camera.fov);
  const parallax = D / (D + layer.depth);
  const bmp = peekBitmap(layer.id, layer.src);

  const set = (patch: Partial<Layer>, coalesceKey?: string) =>
    updateLayer(layer.id, patch, coalesceKey ? { coalesceKey } : undefined);

  const centerH = () => {
    if (!bmp) return;
    set({ offsetX: Math.round((canvasSize.width - bmp.width * layer.scale) / 2) });
  };
  const centerV = () => {
    if (!bmp || layer.orientation === "ground") return;
    set({ offsetY: Math.round((canvasSize.height - bmp.height * layer.scale) / 2) });
  };

  const onDelete = () => {
    if (!removeLayer(layer.id)) return;
    toast(t("layers.deleted"), {
      variant: "danger",
      actionLabel: t("layers.undo"),
      duration: 4000,
      onAction: () => useSceneStore.getState().undo(),
    });
  };

  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-3">
          {t("insp.title")}
        </span>
        <div className="flex items-center gap-1.5">
          {selectedIds.length > 1 && (
            <span className="rounded-sm border border-teal/40 bg-teal-dim px-1.5 py-0.5 font-mono text-[10px] text-teal">
              ×{selectedIds.length}
            </span>
          )}
          <span className="rounded-sm border border-amber/40 bg-amber-dim px-1.5 py-0.5 font-mono text-[10px] text-amber">
            {layer.name}
          </span>
        </div>
      </div>

      {/* preview strip */}
      <div className="checker flex h-24 items-center justify-center overflow-hidden rounded border border-border">
        <img src={layer.src} alt="" className="max-h-full max-w-full object-contain" />
      </div>
      <p className="-mt-3 font-mono text-[10px] leading-relaxed text-text-3">
        {t("insp.dragHint")}
      </p>

      {/* name */}
      <Field label={t("insp.name")}>
        <Input
          value={layer.name}
          onChange={(e) => set({ name: e.target.value })}
          aria-label="Layer name"
        />
      </Field>

      {/* visibility & lock */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-text-3">{t("insp.visible")}</span>
        <Switch
          checked={layer.visible}
          onCheckedChange={(v) => set({ visible: v })}
          aria-label="Toggle visibility"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-text-3">{t("insp.locked")}</span>
        <Switch
          checked={layer.locked}
          onCheckedChange={(v) => set({ locked: v })}
          aria-label="Toggle locked"
        />
      </div>

      {/* depth & light */}
      <div className="border-l-2 border-l-teal pl-3">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-text-3">
          {t("insp.factors")}
        </p>

        {/* depth */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <span className="w-14 font-mono text-[11px] text-text-2">{t("term.depth")}</span>
            <Slider
              min={-400}
              max={800}
              step={10}
              value={[layer.depth]}
              onValueChange={([v]) => set({ depth: v }, `${layer.id}:depth`)}
              trackColor="amber"
              className="flex-1"
            />
            <NumberField
              min={-400}
              max={800}
              step={10}
              value={layer.depth}
              onCommit={(v) => set({ depth: v }, `${layer.id}:depth`)}
              ariaLabel="Depth"
            />
          </div>
          <div className="mt-1 flex justify-between pl-14 pr-[4.5rem] font-mono text-[9px] text-text-3">
            <span>−400</span>
            <span>0</span>
            <span>+800</span>
          </div>
        </div>

        {/* orientation */}
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[11px] text-text-3">{t("term.orientation")}</span>
          <div className="flex items-center rounded-sm border border-border">
            {(["vertical", "ground"] as const).map((o) => (
              <button
                key={o}
                onClick={() => set({ orientation: o })}
                className={cn(
                  "px-2 py-1 font-mono text-[10px] transition-colors",
                  layer.orientation === o ? "bg-bg-3 text-amber" : "text-text-3 hover:text-text-1"
                )}
                aria-label={`${t("term.orientation")}: ${t(o === "vertical" ? "term.vertical" : "term.ground")}`}
              >
                {t(o === "vertical" ? "term.vertical" : "term.ground")}
              </button>
            ))}
          </div>
        </div>

        {/* lit */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-text-3">
            {layer.lit ? t("term.lit") : t("term.unlit")}
          </span>
          <Switch
            checked={layer.lit}
            onCheckedChange={(v) => set({ lit: v })}
            aria-label="Toggle lit"
          />
        </div>

        {/* opacity */}
        <div className="mt-3 flex items-center gap-2">
          <span className="w-14 font-mono text-[11px] text-text-2">{t("insp.opacity")}</span>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={[layer.opacity]}
            onValueChange={([v]) => set({ opacity: v }, `${layer.id}:opacity`)}
            className="flex-1"
          />
          <NumberField
            min={0}
            max={1}
            step={0.05}
            precision={2}
            value={layer.opacity}
            onCommit={(v) => set({ opacity: v }, `${layer.id}:opacity`)}
            ariaLabel="Opacity"
          />
        </div>

        {/* the product's thesis made visible: live formula readout */}
        <div className="mt-2 space-y-1 rounded border border-border bg-bg-1 p-2 font-mono text-[11px] leading-relaxed">
          <p className="text-text-2">
            depth <span className="text-amber">{fmt(layer.depth)}</span> → parallax ×
            <span className="text-teal">{parallax.toFixed(2)}</span>
          </p>
        </div>
      </div>

      {/* transform */}
      <div>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-text-3">{t("insp.transform")}</p>
        <div className="flex items-center gap-2">
          <span className="w-14 font-mono text-[11px] text-text-2">{t("insp.scale")}</span>
          <Slider
            min={0.1}
            max={4}
            step={0.05}
            value={[layer.scale]}
            onValueChange={([v]) => set({ scale: v }, `${layer.id}:scale`)}
            className="flex-1"
          />
          <NumberField
            min={0.1}
            max={4}
            step={0.05}
            precision={2}
            value={layer.scale}
            onCommit={(v) => set({ scale: v }, `${layer.id}:scale`)}
            ariaLabel="Scale"
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
            onChange={(v) => set({ offsetX: v }, `${layer.id}:offsetX`)}
          />
          <OffsetInput
            label="offsetY"
            value={layer.offsetY}
            onChange={(v) => set({ offsetY: v }, `${layer.id}:offsetY`)}
          />
        </div>

        {/* rotation */}
        <div className="mt-3 flex items-center gap-2">
          <span className="w-14 font-mono text-[11px] text-text-2">{t("insp.rotation")}</span>
          <Slider
            min={-180}
            max={180}
            step={1}
            value={[layer.rotation]}
            onValueChange={([v]) => set({ rotation: v }, `${layer.id}:rotation`)}
            className="flex-1"
          />
          <NumberField
            min={-180}
            max={180}
            step={1}
            value={layer.rotation}
            onCommit={(v) => set({ rotation: v }, `${layer.id}:rotation`)}
            ariaLabel="Rotation"
          />
        </div>

        {/* flip + align */}
        <div className="mt-2 flex flex-wrap gap-1.5 pl-14">
          <button
            onClick={() => set({ flipX: !layer.flipX })}
            className={cn(
              "flex items-center gap-1 rounded-sm border px-2 py-0.5 font-mono text-[10px]",
              layer.flipX
                ? "border-amber/50 bg-amber-dim text-amber"
                : "border-border bg-bg-3 text-text-2 hover:border-border-strong hover:text-amber"
            )}
            aria-label={t("insp.flipX")}
            aria-pressed={layer.flipX}
          >
            <FlipHorizontal2 size={11} /> {t("insp.flipX")}
          </button>
          <button
            onClick={() => set({ flipY: !layer.flipY })}
            className={cn(
              "flex items-center gap-1 rounded-sm border px-2 py-0.5 font-mono text-[10px]",
              layer.flipY
                ? "border-amber/50 bg-amber-dim text-amber"
                : "border-border bg-bg-3 text-text-2 hover:border-border-strong hover:text-amber"
            )}
            aria-label={t("insp.flipY")}
            aria-pressed={layer.flipY}
          >
            <FlipVertical2 size={11} /> {t("insp.flipY")}
          </button>
          <button
            onClick={centerH}
            disabled={!bmp}
            className="flex items-center gap-1 rounded-sm border border-border bg-bg-3 px-2 py-0.5 font-mono text-[10px] text-text-2 hover:border-border-strong hover:text-amber disabled:opacity-40"
            aria-label={t("insp.centerH")}
            title={t("insp.centerH")}
          >
            <AlignCenterHorizontal size={11} /> H
          </button>
          <button
            onClick={centerV}
            disabled={!bmp || layer.orientation === "ground"}
            className="flex items-center gap-1 rounded-sm border border-border bg-bg-3 px-2 py-0.5 font-mono text-[10px] text-text-2 hover:border-border-strong hover:text-amber disabled:opacity-40"
            aria-label={t("insp.centerV")}
            title={t("insp.centerV")}
          >
            <AlignCenterVertical size={11} /> V
          </button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="mt-2 font-mono text-[11px]"
          onClick={() =>
            set({ scale: 1, offsetX: 0, offsetY: 0, rotation: 0, flipX: false, flipY: false })
          }
        >
          {t("insp.resetTransform")}
        </Button>
      </div>

      {/* danger zone */}
      <div className="flex gap-2 border-t border-border pt-4">
        <Button variant="secondary" size="sm" className="flex-1" onClick={() => duplicateLayer(layer.id)}>
          <Copy /> {t("insp.duplicate")}
        </Button>
        <Button variant="danger" size="sm" className="flex-1" onClick={onDelete}>
          <Trash2 /> {t("insp.delete")}
        </Button>
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
      <NumberField
        min={-4096}
        max={4096}
        step={1}
        value={value}
        onCommit={onChange}
        className="w-full"
        ariaLabel={label}
      />
    </label>
  );
}

/* ----------------------------- nothing selected ----------------------------- */

function SceneInspector() {
  const t = useT();
  const { canvasSize, setCanvasSize, layers, effects, setEffects } = useSceneStore();
  // store's setEffects is a shallow merge — always send complete groups
  const fx = {
    dof: (p: Partial<typeof effects.dof>, k?: string) =>
      setEffects({ dof: { ...effects.dof, ...p } }, k ? { coalesceKey: k } : undefined),
    fog: (p: Partial<typeof effects.fog>, k?: string) =>
      setEffects({ fog: { ...effects.fog, ...p } }, k ? { coalesceKey: k } : undefined),
    ambient: (p: Partial<typeof effects.ambient>, k?: string) =>
      setEffects({ ambient: { ...effects.ambient, ...p } }, k ? { coalesceKey: k } : undefined),
    sun: (p: Partial<typeof effects.sun>, k?: string) =>
      setEffects({ sun: { ...effects.sun, ...p } }, k ? { coalesceKey: k } : undefined),
    bloom: (p: Partial<typeof effects.bloom>, k?: string) =>
      setEffects({ bloom: { ...effects.bloom, ...p } }, k ? { coalesceKey: k } : undefined),
    grade: (p: Partial<typeof effects.grade>, k?: string) =>
      setEffects({ grade: { ...effects.grade, ...p } }, k ? { coalesceKey: k } : undefined),
    particles: (p: Partial<typeof effects.particles>, k?: string) =>
      setEffects({ particles: { ...effects.particles, ...p } }, k ? { coalesceKey: k } : undefined),
  };
  const TIPS = [t("insp.tip1"), t("insp.tip2"), t("insp.tip5"), t("insp.tip3"), t("insp.tip4")];
  const tip = TIPS[new Date().getMinutes() % TIPS.length];
  const storageBytes = layers.reduce((n, l) => n + (l.src.startsWith("data:") ? l.src.length : 0), 0);
  const pct = Math.min(100, Math.round((storageBytes / (4 * 1024 * 1024)) * 100));

  return (
    <div className="flex flex-col gap-5 p-4">
      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-3">
        {t("insp.scene")}
      </span>

      <Field label={t("insp.canvasSize")}>
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

      {/* render effects */}
      <div className="border-l-2 border-l-amber pl-3">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-text-3">
          {t("term.effects")}
        </p>

        {/* depth of field */}
        <EffectToggle
          label={t("term.dof")}
          checked={effects.dof.enabled}
          onChange={(v) => fx.dof({ enabled: v })}
        />
        {effects.dof.enabled && (
          <>
            <EffectSlider
              label={t("term.focus")}
              min={-400}
              max={800}
              step={10}
              value={effects.dof.focus}
              onChange={(v) => fx.dof({ focus: v }, "fx:dof.focus")}
            />
            <EffectSlider
              label={t("term.aperture")}
              min={0}
              max={1}
              step={0.05}
              value={effects.dof.aperture}
              onChange={(v) => fx.dof({ aperture: v }, "fx:dof.aperture")}
            />
          </>
        )}

        {/* fog */}
        <EffectToggle
          label={t("term.fog")}
          checked={effects.fog.enabled}
          onChange={(v) => fx.fog({ enabled: v })}
        />
        {effects.fog.enabled && (
          <>
            <EffectSlider
              label={t("term.near")}
              min={0}
              max={4000}
              step={20}
              value={effects.fog.near}
              onChange={(v) => fx.fog({ near: v }, "fx:fog.near")}
            />
            <EffectSlider
              label={t("term.far")}
              min={0}
              max={4000}
              step={20}
              value={effects.fog.far}
              onChange={(v) => fx.fog({ far: v }, "fx:fog.far")}
            />
            <ColorRow
              label={t("term.fog")}
              value={effects.fog.color}
              onChange={(v) => fx.fog({ color: v }, "fx:fog.color")}
            />
          </>
        )}

        {/* ambient */}
        <p className="mb-1 mt-3 font-mono text-[10px] uppercase tracking-wider text-text-3">
          {t("term.ambient")}
        </p>
        <ColorRow
          label={t("term.ambient")}
          value={effects.ambient.color}
          onChange={(v) => fx.ambient({ color: v }, "fx:ambient.color")}
        />
        <EffectSlider
          label={t("term.intensity")}
          min={0}
          max={2}
          step={0.05}
          value={effects.ambient.intensity}
          onChange={(v) => fx.ambient({ intensity: v }, "fx:ambient.intensity")}
        />

        {/* sun */}
        <p className="mb-1 mt-3 font-mono text-[10px] uppercase tracking-wider text-text-3">
          {t("term.sun")}
        </p>
        <ColorRow
          label={t("term.sun")}
          value={effects.sun.color}
          onChange={(v) => fx.sun({ color: v }, "fx:sun.color")}
        />
        <EffectSlider
          label={t("term.intensity")}
          min={0}
          max={3}
          step={0.05}
          value={effects.sun.intensity}
          onChange={(v) => fx.sun({ intensity: v }, "fx:sun.intensity")}
        />
        <EffectSlider
          label={t("term.azimuth")}
          min={0}
          max={360}
          step={1}
          value={effects.sun.azimuth}
          onChange={(v) => fx.sun({ azimuth: v }, "fx:sun.azimuth")}
        />
        <EffectSlider
          label={t("term.elevation")}
          min={0}
          max={90}
          step={1}
          value={effects.sun.elevation}
          onChange={(v) => fx.sun({ elevation: v }, "fx:sun.elevation")}
        />

        {/* bloom */}
        <EffectToggle
          label={t("term.bloom")}
          checked={effects.bloom.enabled}
          onChange={(v) => fx.bloom({ enabled: v })}
        />
        {effects.bloom.enabled && (
          <>
            <EffectSlider
              label={t("term.strength")}
              min={0}
              max={2}
              step={0.05}
              value={effects.bloom.strength}
              onChange={(v) => fx.bloom({ strength: v }, "fx:bloom.strength")}
            />
            <EffectSlider
              label={t("term.threshold")}
              min={0}
              max={1}
              step={0.02}
              value={effects.bloom.threshold}
              onChange={(v) => fx.bloom({ threshold: v }, "fx:bloom.threshold")}
            />
          </>
        )}

        {/* color grade */}
        <p className="mb-1 mt-3 font-mono text-[10px] uppercase tracking-wider text-text-3">
          {t("term.grade")}
        </p>
        <EffectSlider
          label={t("term.vignette")}
          min={0}
          max={1}
          step={0.05}
          value={effects.grade.vignette}
          onChange={(v) => fx.grade({ vignette: v }, "fx:grade.vignette")}
        />
        <EffectSlider
          label={t("term.saturation")}
          min={0}
          max={2}
          step={0.05}
          value={effects.grade.saturation}
          onChange={(v) => fx.grade({ saturation: v }, "fx:grade.saturation")}
        />
        <EffectSlider
          label={t("term.grain")}
          min={0}
          max={0.3}
          step={0.01}
          value={effects.grade.grain}
          onChange={(v) => fx.grade({ grain: v }, "fx:grade.grain")}
        />

        {/* particles */}
        <EffectToggle
          label={t("term.particles")}
          checked={effects.particles.enabled}
          onChange={(v) => fx.particles({ enabled: v })}
        />
        {effects.particles.enabled && (
          <>
            <ColorRow
              label={t("term.particles")}
              value={effects.particles.color}
              onChange={(v) => fx.particles({ color: v }, "fx:particles.color")}
            />
            <EffectSlider
              label={t("term.count")}
              min={0}
              max={400}
              step={10}
              value={effects.particles.count}
              onChange={(v) => fx.particles({ count: v }, "fx:particles.count")}
            />
            <EffectSlider
              label={t("term.size")}
              min={1}
              max={8}
              step={0.5}
              value={effects.particles.size}
              onChange={(v) => fx.particles({ size: v }, "fx:particles.size")}
            />
            <EffectSlider
              label={t("term.speed")}
              min={0}
              max={3}
              step={0.1}
              value={effects.particles.speed}
              onChange={(v) => fx.particles({ speed: v }, "fx:particles.speed")}
            />
          </>
        )}
      </div>

      <div className="flex items-center justify-between font-mono text-[11px]">
        <span className="text-text-3">{t("insp.layers")}</span>
        <span className="text-text-1">{layers.length}</span>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between font-mono text-[11px]">
          <span className="text-text-3">{t("insp.storage")}</span>
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
        {t("insp.checkerNote")}
      </p>

      <div className="rounded border border-teal/30 border-l-2 border-l-teal bg-teal-dim p-3">
        <p className="text-xs leading-relaxed text-text-2">{tip}</p>
      </div>
    </div>
  );
}

function EffectToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="mb-2 mt-3 flex items-center justify-between first:mt-0">
      <span className="font-mono text-[11px] text-text-2">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={`Toggle ${label}`} />
    </div>
  );
}

function EffectSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="w-14 font-mono text-[11px] text-text-2">{label}</span>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="flex-1"
      />
      <NumberField
        min={min}
        max={max}
        step={step}
        precision={step < 1 ? 2 : 0}
        value={value}
        onCommit={onChange}
        ariaLabel={label}
      />
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="w-14 font-mono text-[11px] text-text-2">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-10 cursor-pointer rounded-sm border border-border bg-bg-1 p-0.5"
        aria-label={`${label} color`}
      />
      <span className="font-mono text-[11px] text-text-3">{value.toUpperCase()}</span>
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

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
