import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Github, Languages, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLangStore, useT } from "@/i18n";
import { GITHUB_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-pixel text-[15px] tracking-wide", className)}>
      <span className="text-text-1">Pixel</span>
      <span className="text-amber">Stage</span>
    </span>
  );
}

export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLangStore();
  const t = useT();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "zh" : "en")}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded border border-border px-2.5 font-mono text-[11px] text-text-2 transition-colors hover:border-border-strong hover:text-amber",
        className
      )}
      aria-label="Switch language / 切换语言"
    >
      <Languages size={13} />
      {t("lang.switch")}
    </button>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const t = useT();

  const LINKS = [
    { to: "/editor", label: t("nav.editor") },
    { to: "/gallery", label: t("nav.gallery") },
    { to: "/guide", label: t("nav.guide") },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled ? "h-12 bg-bg-2/95 border-b border-border backdrop-blur-md" : "h-14 backdrop-blur-md"
      )}
    >
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5" aria-label="PixelStage home">
          <img src="./logo.svg" alt="" className="h-6 w-6" />
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium text-text-2 transition-colors hover:text-text-1",
                  "relative after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-amber after:transition-all hover:after:w-full",
                  isActive && "text-text-1 after:w-full"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LangToggle />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="flex h-8 w-8 items-center justify-center rounded border border-border text-text-2 transition-colors hover:border-border-strong hover:text-text-1"
          >
            <Github size={16} />
          </a>
          <Button variant="primary" size="sm" onClick={() => navigate("/editor")}>
            {t("nav.launch")}
          </Button>
        </div>

        <button
          className="flex h-8 w-8 items-center justify-center rounded border border-border text-text-2 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-border bg-bg-2 p-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded px-3 py-2.5 text-lg font-semibold text-text-2 hover:bg-bg-3 hover:text-text-1"
              >
                {l.label}
              </NavLink>
            ))}
            <div className="mt-2 flex items-center gap-2">
              <LangToggle />
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  setOpen(false);
                  navigate("/editor");
                }}
              >
                {t("nav.launch")}
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
