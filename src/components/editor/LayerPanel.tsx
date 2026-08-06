import { useRef, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Layer } from "@/core/types";
import { useSceneStore } from "@/store/sceneStore";
import { useT } from "@/i18n";
import { toast } from "@/store/toastStore";
import { cn } from "@/lib/utils";

export default function LayerPanel() {
  const layers = useSceneStore((s) => s.layers);
  const addFiles = useSceneStore((s) => s.addFiles);
  const reorderLayer = useSceneStore((s) => s.reorderLayer);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useT();

  // store: index 0 = farthest. panel shows front-most on top → reversed.
  const displayLayers = [...layers].reverse();

  const handleReorder = (newDisplay: Layer[]) => {
    // find which id moved where in store coordinates
    const newStoreOrder = [...newDisplay].reverse();
    for (let i = 0; i < newStoreOrder.length; i++) {
      if (layers[i].id !== newStoreOrder[i].id) {
        reorderLayer(newStoreOrder[i].id, i);
        return;
      }
    }
  };

  const onFiles = async (files: File[]) => {
    if (!files.length) return;
    const { added, rejected } = await addFiles(files);
    if (added) toast(`${added} ${t("layers.added")}`, { variant: "success" });
    if (rejected) toast(`${rejected} ${t("layers.skipped")}`, { variant: "danger" });
  };

  return (
    <aside className="flex w-[272px] shrink-0 flex-col border-r border-border bg-bg-2">
      <div className="flex h-11 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-3">
            {t("layers.title")}
          </span>
          <span className="rounded-sm border border-border bg-bg-3 px-1.5 py-0.5 font-mono text-[10px] text-text-3">
            {layers.length}
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Add layer"
            >
              <Plus className="!size-3.5" />
              {t("layers.add")}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("layers.importTip")}</TooltipContent>
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          multiple
          hidden
          onChange={(e) => {
            void onFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      <div className="border-b border-border px-3 py-2 font-mono text-[10px] text-text-3">
        {t("layers.dropHint")}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {displayLayers.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <img src="/empty-state.svg" alt="" className="w-28 opacity-80" />
            <p className="text-sm font-medium text-text-2">{t("layers.empty")}</p>
            <p className="font-mono text-[11px] text-text-3">{t("layers.emptyHint")}</p>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={displayLayers}
            onReorder={handleReorder}
            className="flex flex-col gap-1"
          >
            {displayLayers.map((layer) => (
              <LayerRow key={layer.id} layer={layer} />
            ))}
          </Reorder.Group>
        )}
      </div>
    </aside>
  );
}

function LayerRow({ layer }: { layer: Layer }) {
  const t = useT();
  const { selectedId, selectLayer, updateLayer, removeLayer } = useSceneStore();
  const dragControls = useDragControls();
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(layer.name);
  const [shake, setShake] = useState(false);
  const selected = selectedId === layer.id;

  const commitRename = () => {
    if (!draft.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 300);
      return;
    }
    updateLayer(layer.id, { name: draft.trim() });
    setRenaming(false);
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
    <Reorder.Item
      value={layer}
      dragListener={false}
      dragControls={dragControls}
      className={cn(
        "group flex h-14 items-center gap-2 rounded border bg-bg-1 px-2 transition-colors",
        selected ? "border-l-2 border-l-amber border-border-strong bg-amber-dim" : "border-border",
        !layer.visible && "opacity-55",
        shake && "border-danger"
      )}
      onClick={() => selectLayer(layer.id)}
    >
      <button
        className="cursor-grab touch-none text-text-3 hover:text-text-1 active:cursor-grabbing"
        onPointerDown={(e) => dragControls.start(e)}
        aria-label="Drag to reorder"
      >
        <GripVertical size={14} />
      </button>

      <div className="checker h-10 w-10 shrink-0 overflow-hidden rounded-sm border border-border">
        <img
          src={layer.src}
          alt=""
          className={cn("h-full w-full object-contain", !layer.visible && "opacity-40")}
          draggable={false}
        />
      </div>

      <div className="min-w-0 flex-1">
        {renaming ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setRenaming(false);
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-6 w-full rounded-sm border border-amber bg-bg-0 px-1.5 text-[13px] text-text-1 focus-visible:outline-none"
          />
        ) : (
          <p
            className="truncate text-[13px] font-medium text-text-1"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setDraft(layer.name);
              setRenaming(true);
            }}
            title={t("layers.renameHint")}
          >
            {layer.name}
          </p>
        )}
        <p className="font-mono text-[10px] text-text-3">
          z <span className="text-teal">{layer.depth}</span>
        </p>
      </div>

      <div
        className={cn(
          "flex flex-col gap-0.5 transition-opacity",
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        <button
          className="rounded p-1 text-text-2 hover:text-text-1"
          onClick={(e) => {
            e.stopPropagation();
            updateLayer(layer.id, { visible: !layer.visible });
          }}
          aria-label={layer.visible ? "Hide layer" : "Show layer"}
        >
          {layer.visible ? <Eye size={14} /> : <EyeOff size={14} className="text-text-3" />}
        </button>
        <button
          className="rounded p-1 text-text-2 hover:text-danger"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete layer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </Reorder.Item>
  );
}
