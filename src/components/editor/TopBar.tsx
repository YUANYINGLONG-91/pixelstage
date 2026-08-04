import { GITHUB_URL } from "@/lib/constants";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileJson, FolderOpen, Github, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Wordmark } from "@/components/Navbar";
import { useSceneStore } from "@/store/sceneStore";
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
}: {
  savedAt: Date | null;
  onExport: () => void;
  onOpenProject: () => void;
}) {
  const { name, setName, canvasSize, setCanvasSize, resetScene, layers } = useSceneStore();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const [customOpen, setCustomOpen] = useState(false);
  const [customW, setCustomW] = useState(960);
  const [customH, setCustomH] = useState(540);
  const [confirmReset, setConfirmReset] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

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
          <img src="/logo.svg" alt="" className="h-5 w-5" />
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
            title="Click to rename"
          >
            {name}
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
              ? `saved ${savedAt.toTimeString().slice(0, 8)}`
              : layers.length
                ? "saving…"
                : "local-first"}
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
          custom
        </button>
        {customOpen && (
          <div className="absolute left-1/2 top-full z-30 mt-2 flex -translate-x-1/2 items-center gap-2 rounded border border-border bg-bg-2 p-3 shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
            <Input
              type="number"
              min={160}
              max={4096}
              value={customW}
              onChange={(e) => setCustomW(+e.target.value)}
              className="w-20 font-mono"
              aria-label="Width"
            />
            <span className="font-mono text-xs text-text-3">×</span>
            <Input
              type="number"
              min={160}
              max={4096}
              value={customH}
              onChange={(e) => setCustomH(+e.target.value)}
              className="w-20 font-mono"
              aria-label="Height"
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
              Apply
            </Button>
          </div>
        )}
      </div>

      {/* right: actions */}
      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={onOpenProject} aria-label="Open project">
              <FolderOpen />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open project…</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="primary" size="icon" onClick={onExport} aria-label="Export JSON">
              <FileJson />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export scene.json</TooltipContent>
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
          <TooltipContent>Reset scene</TooltipContent>
        </Tooltip>
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
          <TooltipContent>Back to site</TooltipContent>
        </Tooltip>
      </div>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>RESET SCENE</DialogTitle>
            <DialogDescription>Clear all layers? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                resetScene();
                setConfirmReset(false);
                toast("Scene cleared", { variant: "danger" });
              }}
            >
              Clear all layers
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
