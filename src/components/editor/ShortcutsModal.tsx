import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SHORTCUTS: [string, string][] = [
  ["Space", "toggle auto-sweep"],
  ["R", "reset camera"],
  ["Del", "delete layer"],
  ["H", "show / hide layer"],
  ["Ctrl/⌘ D", "duplicate layer"],
  ["Ctrl/⌘ E", "export scene.json"],
  ["Ctrl/⌘ O", "open project"],
  ["Arrows", "nudge offset ±1"],
  ["Shift+Arrows", "nudge offset ±10"],
  ["?", "this panel"],
  ["Esc", "deselect / close"],
];

export default function ShortcutsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>SHORTCUTS</DialogTitle>
          <DialogDescription>keyboard-first, like a real tool</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
          {SHORTCUTS.map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between gap-2">
              <span className="rounded-sm border border-border bg-bg-3 px-2 py-0.5 font-mono text-[11px] text-text-1">
                {key}
              </span>
              <span className="text-right font-mono text-[11px] text-text-3">{desc}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
