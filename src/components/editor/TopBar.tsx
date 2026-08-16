import { GITHUB_URL } from "@/lib/constants";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileJson, FolderOpen, Github, GraduationCap, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import NumberField from "@/components/ui/number-field";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LangToggle, Wordmark } from "@/components/Navbar";
import { useT } from "@/i18n";
import { useSceneStore } from "@/store/sceneStore";
import { saveProject } from "@/store/projectFile";
import { toast } from "@/store/toastStore";
import { cn } from "@/lib/utils";

const SIZE_PRESETS = [
  { label: "640×360", width: 640, height: 360 },
  { label: "960×540", width: 960, height: 540 },
  { label: "1280×720", width: 1280, height: 720 },
];

export default function TopBar({
  savedAt,
  onExport,
  onOpenProject,
  onOpenTutorial,
}: {
  savedAt: Date | null;
  onExport: () => void;
  onOpenProject: () => void;
  onOpenTutorial: () => void;
}) {
  const { name, setName, canvasSize, setCanvasSize, resetScene, layers, dirty, filePath } =
    useSceneStore();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const [customOpen, setCustomOpen] = useState(false);
  const [customW, setCustomW] = useState(960);
  const [customH, setCustomH] = useState(540);
  const [confirmReset, setConfirmReset] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const t = useT();

  useEffect(() => {
    if (editingName) nameInputRef.current?.select();
  }, [editingName]);

  const commitName = () => {
    setName(nameDraft);
    setEditingName(false);
  };

  const isCustom = !SIZE_PRESETS.some(
    (p) => p.width === canvasSize.width && p.height === canvasSize.height
  );

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border bg-bg-2 px-3">
      {/* left: brand + project name + save state */}
      <div className="flex min-w-0 items-center gap-3">
        <Link to="/" className="flex items-center gap-2" aria-label="Back to home">
          <img src="./logo.svg" alt="" className="h-5 w-5" />
          <Wordmark className="hidden text-[13px] sm:inline" />
        </Link>
        <div className="h-4 w-px bg-border" />
        {editingName ? (
          <input
            ref={nameInputRef}
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName();
              if (e.key === "Escape") setEditingName(false);
            }}
            className="h-7 w-44 rounded-sm border border-amber bg-bg-1 px-2 text-[13px] font-medium text-text-1 focus-visible:outline-none"
          />
        ) : (
          <button
            className="truncate text-[13px] font-medium text-text-1 hover:text-amber"
            onClick={() => {
              setNameDraft(name);
              setEditingName(true);
            }}
            title={filePath ?? t("ed.renameHint")}
          >
            {name}
            {dirty && <span className="text-amber"> ●</span>}
          </button>
        )}
        <span className="hidden items-center gap-1.5 sm:flex" aria-live="polite">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              savedAt ? "bg-success" : "bg-amber animate-pulse-dot"
            )}
          />
          <span className="font-mono text-[11px] text-text-3">
            {savedAt
              ? `${t("ed.saved")} ${savedAt.toTimeString().slice(0, 8)}`
              : layers.length
                ? t("ed.saving")
                : t("ed.localFirst")}
          </span>
        </span>
      </div>

      {/* center: canvas size */}
      <div className="relative hidden items-center rounded border border-border md:flex">
        {SIZE_PRESETS.map((p) => {
          const active = p.width === canvasSize.width && p.height === canvasSize.height;
          return (
            <button
              key={p.label}
              onClick={() => setCanvasSize({ width: p.width, height: p.height })}
              className={cn(
                "px-2.5 py-1.5 font-mono text-[11px] transition-colors",
                active ? "bg-bg-3 text-amber" : "text-text-3 hover:text-text-1"
              )}
            >
              {p.label}
            </button>
          );
        })}
        <button
          onClick={() => setCustomOpen(!customOpen)}
          className={cn(
            "px-2.5 py-1.5 font-mono text-[11px] transition-colors",
            isCustom || customOpen ? "bg-bg-3 text-amber" : "text-text-3 hover:text-text-1"
          )}
        >
          {t("ed.custom")}
        </button>
        {customOpen && (
          <div className="absolute left-1/2 top-full z-30 mt-2 flex -translate-x-1/2 items-center gap-2 rounded border border-border bg-bg-2 p-3 shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
            <NumberField
              min={160}
              max={4096}
              value={customW}
              onCommit={setCustomW}
              className="w-20"
              ariaLabel="Width"
            />
            <span className="font-mono text-xs text-text-3">×</span>
            <NumberField
              min={160}
              max={4096}
              value={customH}
              onCommit={setCustomH}
              className="w-20"
              ariaLabel="Height"
            />
            <Button
              size="xs"
              variant="primary"
              onClick={() => {
                const w = Math.min(4096, Math.max(160, Math.round(customW)));
                const h = Math.min(4096, Math.max(160, Math.round(customH)));
                setCanvasSize({ width: w, height: h });
                setCustomOpen(false);
              }}
            >
              {t("ed.apply")}
            </Button>
          </div>
        )}
      </div>

      {/* right: actions */}
      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => void saveProject()}
              aria-label="Save project"
            >
              <Save />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("ed.save")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={onOpenProject} aria-label="Open project">
              <FolderOpen />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("ed.openProject")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="primary" size="icon" onClick={onExport} aria-label="Export JSON">
              <FileJson />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("ed.exportJson")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setConfirmReset(true)}
              aria-label="Reset scene"
            >
              <RotateCcw />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("ed.resetScene")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={onOpenTutorial} aria-label="Tutorial">
              <GraduationCap />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("onb.help")}</TooltipContent>
        </Tooltip>
        <LangToggle />
        <div className="mx-1 h-4 w-px bg-border" />
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          className="flex h-8 w-8 items-center justify-center rounded border border-border text-text-2 transition-colors hover:border-border-strong hover:text-text-1"
        >
          <Github size={16} />
        </a>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/"
              aria-label="Back to site"
              className="flex h-8 w-8 items-center justify-center rounded text-text-2 transition-colors hover:text-amber"
            >
              <ArrowLeft size={16} />
            </Link>
          </TooltipTrigger>
          <TooltipContent>{t("ed.backToSite")}</TooltipContent>
        </Tooltip>
      </div>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("ed.resetTitle")}</DialogTitle>
            <DialogDescription>{t("ed.resetConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setConfirmReset(false)}>
              {t("ed.cancel")}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                resetScene();
                setConfirmReset(false);
                toast(t("ed.sceneCleared"), { variant: "danger" });
              }}
            >
              {t("ed.clearAll")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
