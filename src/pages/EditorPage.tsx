import { useEffect, useRef, useState } from "react";
import EditorViewport from "@/components/editor/EditorViewport";
import ExportModal from "@/components/editor/ExportModal";
import Inspector from "@/components/editor/Inspector";
import LayerPanel from "@/components/editor/LayerPanel";
import Onboarding, { useOnboarding } from "@/components/editor/Onboarding";
import OpenProjectModal from "@/components/editor/OpenProjectModal";
import ShortcutsModal from "@/components/editor/ShortcutsModal";
import StatusBar from "@/components/editor/StatusBar";
import TopBar from "@/components/editor/TopBar";
import ErrorBoundary from "@/components/ErrorBoundary";
import { onOpenFile } from "@/core/platform";
import { loadProjectData, saveProject, saveProjectAs } from "@/store/projectFile";
import { useAutosave } from "@/hooks/useAutosave";
import { useSceneStore } from "@/store/sceneStore";
import { toast } from "@/store/toastStore";
import { useT } from "@/i18n";

export default function EditorPage() {
  const [dragOver, setDragOver] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [openProjectOpen, setOpenProjectOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const { savedAt, restored } = useAutosave();
  const t = useT();
  const onboarding = useOnboarding();

  // one-time restore toast
  useEffect(() => {
    if (restored) toast(t("toast.restored"), { variant: "teal" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restored]);

  // window-level drag & drop import
  useEffect(() => {
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
    const onDragEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current++;
      setDragOver(true);
    };
    const onDragLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragOver(false);
    };
    const onDragOver = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current = 0;
      setDragOver(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      void importFiles(files);
    };
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  const importFiles = async (files: File[]) => {
    if (!files.length) return;
    const { added, rejected } = await useSceneStore.getState().addFiles(files);
    if (added) toast(`${added} ${t("layers.added")}`, { variant: "success" });
    if (rejected) toast(`${rejected} ${t("layers.skipped")}`, { variant: "danger" });
  };

  // OS file-open (double-clicked .pixelstage.json / second instance)
  useEffect(() => {
    return onOpenFile(({ path, data }) => {
      try {
        loadProjectData(data, path);
        toast(t("open.loaded"), { variant: "success" });
      } catch {
        toast(t("open.invalid"), { variant: "danger" });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keyboard shortcuts (editor.md §8)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      const s = useSceneStore.getState();

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        const save = e.shiftKey ? saveProjectAs : saveProject;
        void save().then((p) => {
          if (p) toast(`${t("ed.saved")} · ${p}`, { variant: "success" });
        });
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setExportOpen(true);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "o") {
        e.preventDefault();
        setOpenProjectOpen(true);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (s.selectedId) s.duplicateLayer(s.selectedId);
        return;
      }
      if (typing) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "c") {
        const n = s.copySelection();
        if (n) {
          e.preventDefault();
          toast(`${n} ${t("layers.copied")}`, { variant: "teal" });
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "v") {
        e.preventDefault();
        s.paste();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        // select all (last layer = front-most becomes the primary)
        const ids = s.layers.map((l) => l.id);
        s.selectLayer(null);
        for (const id of ids) s.selectLayer(id, { additive: true });
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        s.redo();
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          s.togglePlaying();
          break;
        case "r":
        case "R":
          s.resetCamera();
          break;
        case "f":
        case "F":
          if (s.selectedId) s.focusSelected();
          break;
        case "g":
        case "G":
          s.toggleGrid();
          break;
        case "Delete":
        case "Backspace":
          if (s.selectedIds.length > 1) {
            s.removeLayers(s.selectedIds);
            toast(t("layers.deleted"), {
              variant: "danger",
              actionLabel: t("layers.undo"),
              duration: 4000,
              onAction: () => useSceneStore.getState().undo(),
            });
          } else if (s.selectedId) {
            s.removeLayer(s.selectedId);
          }
          break;
        case "h":
        case "H":
          if (s.selectedIds.length) {
            s.updateLayers(s.selectedIds, (l) => ({ visible: !l.visible }));
          }
          break;
        case "l":
        case "L":
          // lock toggle: updateLayers skips locked layers, so toggle directly
          for (const id of s.selectedIds) {
            const l = s.layers.find((x) => x.id === id);
            if (l) s.updateLayer(id, { locked: !l.locked });
          }
          break;
        case "x":
        case "X":
          if (s.selectedIds.length) s.updateLayers(s.selectedIds, (l) => ({ flipX: !l.flipX }));
          break;
        case "y":
        case "Y":
          if (s.selectedIds.length) s.updateLayers(s.selectedIds, (l) => ({ flipY: !l.flipY }));
          break;
        case "[":
        case "{":
        case "]":
        case "}": {
          if (!s.selectedIds.length) return;
          e.preventDefault();
          const d = (e.key === "]" || e.key === "}" ? 1 : -1) * (e.shiftKey ? 50 : 10);
          s.updateLayers(
            s.selectedIds,
            (l) => ({ depth: Math.min(800, Math.max(-400, l.depth + d)) }),
            { coalesceKey: "nudge:depth" }
          );
          break;
        }
        case "-":
        case "_":
        case "=":
        case "+": {
          if (!s.selectedIds.length) return;
          e.preventDefault();
          const up = e.key === "=" || e.key === "+";
          const d = (up ? 1 : -1) * (e.shiftKey ? 0.25 : 0.05);
          s.updateLayers(
            s.selectedIds,
            (l) => ({ scale: Math.min(4, Math.max(0.1, Math.round((l.scale + d) * 100) / 100)) }),
            { coalesceKey: "nudge:scale" }
          );
          break;
        }
        case ",":
        case "<":
        case ".":
        case ">": {
          if (!s.selectedIds.length) return;
          e.preventDefault();
          const d = (e.key === "." || e.key === ">" ? 1 : -1) * (e.shiftKey ? 15 : 1);
          s.updateLayers(
            s.selectedIds,
            (l) => ({ rotation: wrapDeg(l.rotation + d) }),
            { coalesceKey: "nudge:rot" }
          );
          break;
        }
        case "Escape":
          s.selectLayer(null);
          break;
        case "?":
          setShortcutsOpen(true);
          break;
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight": {
          if (!s.selectedIds.length) return;
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
          const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
          s.updateLayers(s.selectedIds, (l) => ({ offsetX: l.offsetX + dx, offsetY: l.offsetY + dy }), {
            coalesceKey: "nudge:xy",
          });
          break;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* small-viewport notice (editor is desktop-first) */}
      <div className="border-b border-amber/40 bg-amber-dim px-3 py-1.5 text-center font-mono text-[11px] text-amber lg:hidden">
        {t("ed.desktopNotice")}
      </div>

      <TopBar
        savedAt={savedAt}
        onExport={() => setExportOpen(true)}
        onOpenProject={() => setOpenProjectOpen(true)}
        onOpenTutorial={onboarding.reopen}
      />

      <div className="flex min-h-0 flex-1">
        <div className="hidden md:flex">
          <LayerPanel />
        </div>
        <ErrorBoundary compact onReset={() => window.location.reload()}>
          <EditorViewport
            dragOver={dragOver}
            onBrowse={() => fileInputRef.current?.click()}
            onOpenShortcuts={() => setShortcutsOpen(true)}
          />
        </ErrorBoundary>
        <Onboarding open={onboarding.open} onClose={onboarding.close} />
        <div className="hidden md:flex">
          <Inspector />
        </div>
      </div>

      <StatusBar savedAt={savedAt} onOpenShortcuts={() => setShortcutsOpen(true)} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        multiple
        hidden
        onChange={(e) => {
          void importFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />

      <ExportModal open={exportOpen} onOpenChange={setExportOpen} />
      <OpenProjectModal open={openProjectOpen} onOpenChange={setOpenProjectOpen} />
      <ShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}

/** wrap degrees into (−180, 180] */
function wrapDeg(r: number): number {
  return ((((r + 180) % 360) + 360) % 360) - 180;
}
