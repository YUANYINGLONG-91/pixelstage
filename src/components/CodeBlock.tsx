import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/** Code block per design.md §8: header strip with 3 squares + filename + copy. */
export default function CodeBlock({
  filename,
  children,
  className,
  preClassName,
}: {
  filename: string;
  children: React.ReactNode;
  className?: string;
  preClassName?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async (e: React.MouseEvent) => {
    const pre = (e.currentTarget as HTMLElement).closest("[data-codeblock]")?.querySelector("code");
    await navigator.clipboard.writeText(pre?.textContent ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      data-codeblock
      className={cn("overflow-hidden rounded-md border border-border bg-code-bg", className)}
    >
      <div className="flex h-8 items-center gap-2 border-b border-border px-3">
        <span className="h-2 w-2 bg-amber" />
        <span className="h-2 w-2 bg-teal" />
        <span className="h-2 w-2 bg-bg-3" />
        <span className="ml-2 font-mono text-xs text-text-3">{filename}</span>
        <button
          onClick={(e) => void copy(e)}
          className="ml-auto flex items-center gap-1 font-mono text-[11px] text-text-3 transition-colors hover:text-amber"
        >
          {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre
        className={cn(
          "overflow-x-auto p-4 font-mono text-xs leading-relaxed text-text-2",
          preClassName
        )}
      >
        <code>{children}</code>
      </pre>
    </div>
  );
}
