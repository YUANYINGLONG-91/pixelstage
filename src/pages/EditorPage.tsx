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
        case "Delete":
        case "Backspace":
          if (s.selectedId) s.removeLayer(s.selectedId);
          break;
        case "h":
        case "H": {
          const l = s.layers.find((x) => x.id === s.selectedId);
          if (l) s.updateLayer(l.id, { visible: !l.visible });
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
          const l = s.layers.find((x) => x.id === s.selectedId);
          if (!l) return;
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
          const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
          s.updateLayer(l.id, { offsetX: l.offsetX + dx, offsetY: l.offsetY + dy });
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
          <EditorViewport dragOver={dragOver} onBrowse={() => fileInputRef.current?.click()} />
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
