import { AnimatePresence, motion } from "framer-motion";
import { useToastStore } from "@/store/toastStore";
import { cn } from "@/lib/utils";

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "pointer-events-auto flex items-center gap-3 rounded border border-border bg-bg-3 px-4 py-2.5 font-mono text-xs text-text-1 shadow-[0_16px_48px_rgba(0,0,0,0.5)]",
              t.variant === "success" && "border-l-2 border-l-success",
              t.variant === "danger" && "border-l-2 border-l-danger",
              t.variant === "teal" && "border-l-2 border-l-teal"
            )}
          >
            <span>{t.message}</span>
            {t.actionLabel && (
              <button
                className="font-semibold text-amber hover:underline underline-offset-2"
                onClick={() => {
                  t.onAction?.();
                  dismiss(t.id);
                }}
              >
                {t.actionLabel}
              </button>
            )}
            <button
              className="text-text-3 hover:text-text-1"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
