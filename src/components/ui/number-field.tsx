import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface NumberFieldProps {
  value: number;
  onCommit: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** decimal places to display/round to */
  precision?: number;
  className?: string;
  ariaLabel?: string;
}

/**
 * Precise numeric input for pro editing:
 * - commits on Enter / blur, reverts on Esc
 * - ArrowUp/Down ±step, Shift ×10
 * - clamps + rounds on commit; invalid text reverts to the last value
 * - shows the store value while unfocused (no half-typed state leaking out)
 */
export default function NumberField({
  value,
  onCommit,
  min = -Infinity,
  max = Infinity,
  step = 1,
  precision = 0,
  className,
  ariaLabel,
}: NumberFieldProps) {
  const [text, setText] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const display = text ?? String(round(value, precision));

  // if the external value changes mid-edit (undo/redo), drop the edit
  useEffect(() => {
    if (text !== null && document.activeElement !== inputRef.current) setText(null);
  }, [value, text]);

  const commit = (raw: string) => {
    setText(null);
    const v = Number(raw);
    if (!Number.isFinite(v)) return;
    const clamped = Math.min(max, Math.max(min, round(v, precision)));
    if (clamped !== value) onCommit(clamped);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      className={cn(
        "w-16 rounded border border-border bg-bg-1 px-1.5 py-0.5 text-right font-mono text-xs text-text-1 outline-none focus:border-teal",
        className
      )}
      value={display}
      onChange={(e) => setText(e.target.value)}
      onFocus={() => setText(String(round(value, precision)))}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          commit((e.target as HTMLInputElement).value);
          inputRef.current?.blur();
        } else if (e.key === "Escape") {
          setText(null);
          inputRef.current?.blur();
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          const dir = e.key === "ArrowUp" ? 1 : -1;
          const k = e.shiftKey ? 10 : 1;
          const next = Math.min(max, Math.max(min, round(value + dir * step * k, precision)));
          onCommit(next);
          setText(String(next));
        }
      }}
    />
  );
}

function round(v: number, precision: number): number {
  const k = 10 ** precision;
  return Math.round(v * k) / k;
}
