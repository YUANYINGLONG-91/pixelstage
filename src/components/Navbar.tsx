import { GITHUB_URL } from "@/lib/constants";
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Github, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/editor", label: "Editor" },
  { to: "/gallery", label: "Gallery" },
  { to: "/guide", label: "Guide" },
];

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-pixel text-[15px] tracking-wide", className)}>
      <span className="text-text-1">Pixel</span>
      <span className="text-amber">Stage</span>
    </span>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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
          <img src="/logo.svg" alt="" className="h-6 w-6" />
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
            Launch Editor
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
            <Button
              variant="primary"
              className="mt-3"
              onClick={() => {
                setOpen(false);
                navigate("/editor");
              }}
            >
              Launch Editor
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
