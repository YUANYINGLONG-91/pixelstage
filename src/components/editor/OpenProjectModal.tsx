import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [pasted, setPasted] = useState("");
  const [error, setError] = useState<string | null>(null);
  const t = useT();

  const load = (raw: unknown) => {
    try {
      loadJSON(raw);
      onOpenChange(false);
      setPasted("");
      setError(null);
      toast(t("open.loaded"), { variant: "success" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("open.invalid"));
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
            <TabsTrigger value="paste">{t("open.paste")}</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <button
              onClick={() => fileRef.current?.click()}
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

          <TabsContent value="paste">
            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder='{"version":1,"layers":[…]}'
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
