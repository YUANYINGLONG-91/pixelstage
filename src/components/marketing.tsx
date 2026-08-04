import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** `// LABEL` — Silkscreen eyebrow + amber rule (design.md §8). */
export function SectionEyebrow({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="font-pixel text-xs uppercase tracking-[0.12em] text-amber">
        // {children}
      </span>
      <span className="h-px w-6 bg-amber" />
    </div>
  );
}

/** Small inline data badge (design.md §8 MonoChip). */
export function MonoChip({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "amber" | "teal";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-sm border px-2 py-0.5 font-mono text-[11px]",
        variant === "default" && "border-border bg-bg-3 text-text-2",
        variant === "amber" && "border-amber/40 bg-amber-dim text-amber",
        variant === "teal" && "border-teal/40 bg-teal-dim text-teal",
        className
      )}
    >
      {children}
    </span>
  );
}

/** Shared entrance animation — fade up, staggered by `delay`. */
export function FadeUp({
  children,
  delay = 0,
  className,
  y = 24,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-15% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
