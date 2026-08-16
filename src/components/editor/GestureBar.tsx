import { useState } from "react";
import { X } from "lucide-react";
import { useT } from "@/i18n";
import type { DictKey } from "@/i18n/dict";

const HIDDEN_KEY = "pixelstage.hintbar.v1";

/** gesture cheat sheet — shared by the canvas hint bar and the onboarding gesture page */
export const GESTURES: { keys: DictKey; label: DictKey }[] = [
  { keys: "hint.k.leftDrag", label: "hint.pan" },
  { keys: "hint.k.rightDrag", label: "hint.orbit" },
  { keys: "hint.k.wheel", label: "hint.wheel" },
  { keys: "hint.k.clickSprite", label: "hint.pick" },
  { keys: "hint.k.shiftDrag", label: "hint.depth" },
  { keys: "hint.k.f", label: "hint.focus" },
];

/**
 * Always-on gesture strip at the top of the stage. Dismissal persists in
 * localStorage — the same sheet lives in the tutorial's last page and the
 * full list is one `?` away.
 */
export default function GestureBar({ onOpenShortcuts }: { onOpenShortcuts: () => void }) {
  const t = useT();
  const [hidden, setHidden] = useState(() => !!localStorage.getItem(HIDDEN_KEY));
  if (hidden) return null;

  const dismiss = () => {
    localStorage.setItem(HIDDEN_KEY, "1");
    setHidden(true);
  };

  return (
    <div className="pointer-events-none absolute inset-x-2 top-10 z-10 flex justify-center">
      <div className="pointer-events-auto flex items-start gap-1.5 rounded-sm border border-border bg-bg-2/85 px-2 py-1">
      <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
        {GESTURES.map((g) => (
          <span key={g.keys} className="flex items-center gap-1 whitespace-nowrap">
            <kbd className="rounded-sm border border-border bg-bg-3 px-1 font-mono text-[10px] text-text-1">
              {t(g.keys)}
            </kbd>
            <span className="font-mono text-[10px] text-text-2">{t(g.label)}</span>
          </span>
        ))}
        <button
          onClick={onOpenShortcuts}
          className="flex items-center gap-1 whitespace-nowrap text-text-3 transition-colors hover:text-amber"
        >
          <kbd className="rounded-sm border border-border bg-bg-3 px-1 font-mono text-[10px] text-text-1">
            ?
          </kbd>
          <span className="font-mono text-[10px]">{t("hint.more")}</span>
        </button>
      </div>
      <button
        onClick={dismiss}
        aria-label={t("hint.dismiss")}
        title={t("hint.dismiss")}
        className="mt-px shrink-0 rounded p-0.5 text-text-3 hover:text-text-1"
      >
        <X size={10} />
      </button>
      </div>
    </div>
  );
}
