import { useMemo, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
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
import type { SceneFile } from "@/core/types";
import { useSceneStore } from "@/store/sceneStore";
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

  const scene: SceneFile = useMemo(() => {
    if (!open) return toJSON();
    const s = toJSON();
    if (!embed) {
      // assets travel alongside the JSON — src becomes a filename
      s.layers = s.layers.map((l) => ({
        ...l,
        src: l.src.startsWith("data:") ? `${slug(l.name)}.png` : l.src,
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
    toast(`${label} copied to clipboard`, { variant: "success" });
  };

  const download = () => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug(name)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Downloaded ${slug(name)}.json`, { variant: "success" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[720px]">
        <DialogHeader>
          <DialogTitle>EXPORT SCENE</DialogTitle>
          <DialogDescription>
            {slug(name)}.json · {scene.layers.length} layers · {sizeKB} KB
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="json">
          <TabsList>
            <TabsTrigger value="json">SCENE.JSON</TabsTrigger>
            <TabsTrigger value="runtime">RUNTIME.JS</TabsTrigger>
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
              Embed images (base64)
              {!embed && (
                <span className="text-amber">— assets travel alongside the JSON</span>
              )}
            </label>
          </TabsContent>

          <TabsContent value="runtime">
            <p className="mb-2 text-xs text-text-2">
              Render this scene anywhere in ~20 lines of plain Canvas 2D — no dependencies.
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
              onClick={() => void copy(RUNTIME_SNIPPET, "runtime.js")}
            >
              {copied ? <Check /> : <Copy />} Copy runtime
            </Button>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="secondary" size="sm" onClick={() => void copy(json, "scene.json")}>
            {copied ? <Check /> : <Copy />} Copy JSON
          </Button>
          <Button variant="primary" size="sm" onClick={download}>
            <Download /> Download .json
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
