import { useMemo, useState } from "react";
import { Check, Copy, Download, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RUNTIME_SNIPPET } from "@/core/scene";
import { PATH_PERIOD, type PathPreset } from "@/core/cameraPaths";
import { getEditorCanvas } from "@/core/editorCanvas";
import { saveBlob } from "@/core/platform";
import { buildSceneZip } from "@/core/zip";
import { saveProjectAs } from "@/store/projectFile";
import type { SceneFile } from "@/core/types";
import { useSceneStore } from "@/store/sceneStore";
import { useT } from "@/i18n";
import { toast } from "@/store/toastStore";

export default function ExportModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toJSON, name, layers } = useSceneStore();
  const [embed, setEmbed] = useState(true);
  const [copied, setCopied] = useState(false);
  const t = useT();

  const scene: SceneFile = useMemo(() => {
    if (!open) return toJSON();
    const s = toJSON();
    if (!embed) {
      // preview mirrors what buildSceneZip writes into the zip
      s.layers = s.layers.map((l) => ({
        ...l,
        src: l.src.startsWith("data:") ? `assets/${slug(l.name)}.png` : l.src,
      }));
    }
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, embed, layers, name]);

  const json = useMemo(() => JSON.stringify(scene, null, 2), [scene]);
  const sizeKB = (new Blob([json]).size / 1024).toFixed(1);

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast(`${label} ${t("export.copied")}`, { variant: "success" });
  };

  const download = async () => {
    if (!embed) {
      // honest export: scene.json + every layer image in one zip
      const { blob, skipped } = buildSceneZip(toJSON());
      const filename = `${slug(name)}.zip`;
      const saved = await saveBlob(blob, { defaultPath: filename });
      if (saved) {
        toast(
          `${t("export.downloaded")} ${filename}${skipped.length ? ` (${skipped.length} external src kept)` : ""}`,
          { variant: "success" }
        );
      }
      return;
    }
    const blob = new Blob([json], { type: "application/json" });
    const filename = `${slug(name)}.json`;
    const saved = await saveBlob(blob, { defaultPath: filename });
    if (saved) toast(`${t("export.downloaded")} ${filename}`, { variant: "success" });
  };

  // project file: always fully self-contained (embedded base64) for moving between machines
  const downloadProject = async () => {
    const saved = await saveProjectAs();
    if (saved) toast(`${t("export.downloaded")} ${saved}`, { variant: "success" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{t("export.title")}</DialogTitle>
          <DialogDescription>
            {slug(name)}.json · {scene.layers.length} {t("export.layers")} · {sizeKB} KB
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="json">
          <TabsList>
            <TabsTrigger value="json">SCENE.JSON</TabsTrigger>
            <TabsTrigger value="runtime">RUNTIME.HTML</TabsTrigger>
            <TabsTrigger value="video">VIDEO.WEBM</TabsTrigger>
          </TabsList>

          <TabsContent value="json">
            <div className="max-h-[46vh] overflow-auto rounded-md border border-border bg-code-bg p-4">
              <pre className="font-mono text-xs leading-relaxed">
                <code>{highlightJson(json)}</code>
              </pre>
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 font-mono text-[11px] text-text-2">
              <input
                type="checkbox"
                checked={embed}
                onChange={(e) => setEmbed(e.target.checked)}
                className="h-3.5 w-3.5 accent-amber"
              />
              {t("export.embed")}
              {!embed && (
                <span className="text-amber">{t("export.embedOff")}</span>
              )}
            </label>
          </TabsContent>

          <TabsContent value="runtime">
            <p className="mb-2 text-xs text-text-2">
              {t("export.runtimeBlurb")}{" "}
              <span className="font-mono text-[11px] text-text-3">runtime.html (three.js, CDN)</span>
            </p>
            <div className="max-h-[40vh] overflow-auto rounded-md border border-border bg-code-bg p-4">
              <pre className="font-mono text-xs leading-relaxed">
                <code>{highlightJs(RUNTIME_SNIPPET)}</code>
              </pre>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => void copy(RUNTIME_SNIPPET, "runtime.html")}
            >
              {copied ? <Check /> : <Copy />} {t("export.copyRuntime")}
            </Button>
          </TabsContent>

          <TabsContent value="video">
            <VideoRecorder slugName={slug(name)} />
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" size="sm" onClick={downloadProject}>
            <Download /> {t("export.downloadProject")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void copy(json, "scene.json")}>
            {copied ? <Check /> : <Copy />} {t("export.copyJson")}
          </Button>
          <Button variant="primary" size="sm" onClick={download}>
            <Download /> {t("export.downloadJson")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "scene"
  );
}

/**
 * Records the live editor canvas for exactly one camera-path period → a
 * seamlessly looping WebM. Paths are periodic, so any start offset loops.
 */
function VideoRecorder({ slugName }: { slugName: string }) {
  const t = useT();
  const { pathPreset, setPathPreset, setPlaying } = useSceneStore();
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);

  const record = async () => {
    const canvas = getEditorCanvas();
    if (!canvas || recording) return;
    const mime = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ].find((m) => MediaRecorder.isTypeSupported(m));
    if (!mime) {
      toast(t("export.videoUnsupported"), { variant: "danger" });
      return;
    }
    const periodMs = PATH_PERIOD[pathPreset] * 1000;
    const stream = canvas.captureStream(60);
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    const stopped = new Promise<void>((res) => {
      rec.onstop = () => res();
    });

    setRecording(true);
    setProgress(0);
    setPlaying(true);
    rec.start(250); // gather chunks every 250ms
    const t0 = performance.now();
    const tick = setInterval(() => {
      setProgress(Math.min(1, (performance.now() - t0) / periodMs));
    }, 100);
    await new Promise((r) => setTimeout(r, periodMs));
    clearInterval(tick);
    rec.stop();
    await stopped;
    stream.getTracks().forEach((tr) => tr.stop());
    setPlaying(false);
    setRecording(false);

    const blob = new Blob(chunks, { type: "video/webm" });
    const filename = `${slugName}-${pathPreset}.webm`;
    const saved = await saveBlob(blob, { defaultPath: filename });
    if (saved) toast(`${t("export.downloaded")} ${filename}`, { variant: "success" });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-text-2">{t("export.videoBlurb")}</p>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-text-3">{t("term.preset")}</span>
        <div className="flex items-center rounded-sm border border-border">
          {(Object.keys(PATH_PERIOD) as PathPreset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPathPreset(p)}
              disabled={recording}
              className={
                pathPreset === p
                  ? "bg-bg-3 px-2 py-1 font-mono text-[10px] text-amber"
                  : "px-2 py-1 font-mono text-[10px] text-text-3 hover:text-text-1"
              }
            >
              {p} · {PATH_PERIOD[p]}s
            </button>
          ))}
        </div>
      </div>
      {recording && (
        <div className="h-1 w-full bg-bg-3">
          <div className="h-full bg-amber transition-none" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] leading-relaxed text-text-3">{t("export.videoHint")}</p>
        <Button variant="primary" size="sm" onClick={() => void record()} disabled={recording}>
          <Video /> {recording ? t("export.recording") : t("export.record")}
        </Button>
      </div>
    </div>
  );
}

/** Tiny JSON highlighter using the design.md syntax palette. */
export function highlightJson(json: string): React.ReactNode[] {
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?)|(\btrue\b|\bfalse\b|\bnull\b)/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(json))) {
    if (m.index > last) out.push(<Punct key={i++} text={json.slice(last, m.index)} />);
    if (m[1] !== undefined) {
      out.push(
        m[2] ? (
          <span key={i++} className="text-[#9ED0FF]">
            {m[1]}
          </span>
        ) : (
          <span key={i++} className="text-[#FFC877]">
            {m[1]}
          </span>
        )
      );
      if (m[2]) out.push(<Punct key={i++} text={m[2]} />);
    } else if (m[3] !== undefined) {
      out.push(
        <span key={i++} className="text-[#4FD1B5]">
          {m[3]}
        </span>
      );
    } else if (m[4] !== undefined) {
      out.push(
        <span key={i++} className="text-[#E56CF0]">
          {m[4]}
        </span>
      );
    }
    last = re.lastIndex;
  }
  if (last < json.length) out.push(<Punct key={i++} text={json.slice(last)} />);
  return out;
}

/** Minimal JS highlighter — comments, strings, keywords, numbers. */
export function highlightJs(code: string): React.ReactNode[] {
  const re =
    /(\/\/.*$)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")|(\b(?:const|let|var|function|return|await|async|export|for|of|if|new|continue|this)\b)|(-?\d+(?:\.\d+)?)/gm;
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(code))) {
    if (m.index > last) out.push(<Punct key={i++} text={code.slice(last, m.index)} />);
    const cls = m[1]
      ? "text-[#4A5468] italic"
      : m[2]
        ? "text-[#FFC877]"
        : m[3]
          ? "text-[#9ED0FF]"
          : "text-[#4FD1B5]";
    out.push(
      <span key={i++} className={cls}>
        {m[0]}
      </span>
    );
    last = re.lastIndex;
  }
  if (last < code.length) out.push(<Punct key={i++} text={code.slice(last)} />);
  return out;
}

function Punct({ text }: { text: string }) {
  return <span className="text-[#5E6880]">{text}</span>;
}
