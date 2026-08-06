import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/i18n";
import type { DictKey } from "@/i18n/dict";

const SHORTCUTS: [string, DictKey][] = [
  ["Space", "sc.toggleSweep"],
  ["R", "sc.resetCam"],
  ["Del", "sc.deleteLayer"],
  ["H", "sc.hideLayer"],
  ["Ctrl/⌘ Z", "sc.undo"],
  ["Ctrl/⌘⇧ Z · Ctrl/⌘ Y", "sc.redo"],
  ["Ctrl/⌘ D", "sc.duplicate"],
  ["Ctrl/⌘ E", "sc.export"],
  ["Ctrl/⌘ O", "sc.open"],
  ["Wheel", "sc.wheelZoom"],
  ["Right/Alt drag", "sc.orbit"],
  ["Arrows", "sc.nudge1"],
  ["Shift+Arrows", "sc.nudge10"],
  ["?", "sc.thisPanel"],
  ["Esc", "sc.esc"],
];

export default function ShortcutsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("sc.title")}</DialogTitle>
          <DialogDescription>{t("sc.desc")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
          {SHORTCUTS.map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between gap-2">
              <span className="rounded-sm border border-border bg-bg-3 px-2 py-0.5 font-mono text-[11px] text-text-1">
                {key}
              </span>
              <span className="text-right font-mono text-[11px] text-text-3">{t(desc)}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
