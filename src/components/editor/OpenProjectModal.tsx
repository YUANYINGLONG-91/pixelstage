import { useEffect, useRef, useState } from "react";
import { FileClock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRecentFiles, isElectron, readFilePath } from "@/core/platform";
import { loadProjectData, openProject } from "@/store/projectFile";
import { useSceneStore } from "@/store/sceneStore";
import { useT } from "@/i18n";
import { toast } from "@/store/toastStore";

export default function OpenProjectModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const loadJSON = useSceneStore((s) => s.loadJSON);
  const markSaved = useSceneStore((s) => s.markSaved);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pasted, setPasted] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const t = useT();

  useEffect(() => {
    if (open && isElectron()) void getRecentFiles().then(setRecent);
  }, [open]);

  const load = (raw: unknown, path: string | null = null) => {
    try {
      loadJSON(raw);
      markSaved(path);
      onOpenChange(false);
      setPasted("");
      setError(null);
      toast(t("open.loaded"), { variant: "success" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("open.invalid"));
    }
  };

  const openRecent = async (path: string) => {
    try {
      const data = await readFilePath(path);
      if (!data) throw new Error("unreadable");
      loadProjectData(data, path);
      onOpenChange(false);
      toast(t("open.loaded"), { variant: "success" });
    } catch {
      setError(t("open.invalid"));
    }
  };

  const onFile = async (file: File) => {
    try {
      load(JSON.parse(await file.text()));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("open.invalid"));
    }
  };

  const onValidate = () => {
    try {
      load(JSON.parse(pasted));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Not valid JSON");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{t("open.title")}</DialogTitle>
          <DialogDescription>{t("open.desc")}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload">
          <TabsList>
            <TabsTrigger value="upload">{t("open.upload")}</TabsTrigger>
            {isElectron() && <TabsTrigger value="recent">{t("open.recent")}</TabsTrigger>}
            <TabsTrigger value="paste">{t("open.paste")}</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <button
              onClick={() => {
                if (isElectron()) {
                  void openProject().then((p) => {
                    if (p) {
                      onOpenChange(false);
                      toast(t("open.loaded"), { variant: "success" });
                    }
                  });
                } else {
                  fileRef.current?.click();
                }
              }}
              className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-bg-1 text-text-3 transition-colors hover:border-amber hover:text-amber"
            >
              <Upload size={20} />
              <span className="font-mono text-xs">{t("open.browse")}</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
                e.target.value = "";
              }}
            />
            <p className="mt-2 font-mono text-[10px] text-text-3">
              {t("open.missingNote")}
            </p>
          </TabsContent>

          {isElectron() && (
            <TabsContent value="recent">
              {recent.length === 0 ? (
                <p className="py-8 text-center font-mono text-xs text-text-3">
                  {t("open.recentEmpty")}
                </p>
              ) : (
                <div className="flex max-h-56 flex-col gap-1 overflow-auto">
                  {recent.map((p) => (
                    <button
                      key={p}
                      onClick={() => void openRecent(p)}
                      className="flex items-center gap-2 rounded border border-border bg-bg-1 px-3 py-2 text-left font-mono text-[11px] text-text-2 transition-colors hover:border-amber hover:text-amber"
                    >
                      <FileClock size={14} className="shrink-0" />
                      <span className="truncate">{p}</span>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="paste">            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder='{"version":2,"layers":[…]}'
              spellCheck={false}
              className="h-40 w-full resize-none rounded-md border border-border bg-code-bg p-3 font-mono text-xs text-text-1 placeholder:text-text-3 focus-visible:outline-none focus-visible:border-amber"
            />
            <Button variant="secondary" size="sm" className="mt-3" onClick={onValidate}>
              {t("open.validate")}
            </Button>
          </TabsContent>
        </Tabs>

        {error && (
          <p className="rounded border border-danger/50 bg-danger/10 px-3 py-2 font-mono text-[11px] text-danger">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
