import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import type { DictKey } from "@/i18n/dict";

const ONBOARDED_KEY = "pixelstage.onboarded";

const STEPS: { title: DictKey; body: DictKey }[] = [
  { title: "onb.s1t", body: "onb.s1b" },
  { title: "onb.s2t", body: "onb.s2b" },
  { title: "onb.s3t", body: "onb.s3b" },
  { title: "onb.s4t", body: "onb.s4b" },
];

export function useOnboarding() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem(ONBOARDED_KEY)) {
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);
  const close = (done: boolean) => {
    if (done) localStorage.setItem(ONBOARDED_KEY, "1");
    setOpen(false);
  };
  return { open, close, reopen: () => setOpen(true) };
}

export default function Onboarding({
  open,
  onClose,
}: {
  open: boolean;
  onClose: (done: boolean) => void;
}) {
  const t = useT();
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-10 left-1/2 z-40 w-[min(440px,calc(100%-32px))] -translate-x-1/2"
        >
          <div className="rounded-md border border-amber/50 bg-bg-2 p-5 shadow-[0_16px_48px_rgba(0,0,0,0.5)] amber-glow">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-pixel text-sm text-amber">{t(STEPS[step].title)}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-text-2">
                  {t(STEPS[step].body)}
                </p>
              </div>
              <button
                onClick={() => onClose(true)}
                className="shrink-0 rounded p-1 text-text-3 hover:text-text-1"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              {/* progress dots */}
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={
                      i === step
                        ? "h-1.5 w-5 rounded-full bg-amber"
                        : "h-1.5 w-1.5 rounded-full bg-bg-3 hover:bg-text-3"
                    }
                    aria-label={`Step ${i + 1}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {step > 0 && (
                  <Button variant="ghost" size="xs" onClick={() => setStep(step - 1)}>
                    {t("onb.prev")}
                  </Button>
                )}
                {step === 0 && (
                  <Button variant="ghost" size="xs" onClick={() => onClose(true)}>
                    {t("onb.skip")}
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => (last ? onClose(true) : setStep(step + 1))}
                >
                  {last ? t("onb.done") : t("onb.next")}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
