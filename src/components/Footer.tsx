import { Link } from "react-router-dom";
import { Wordmark } from "@/components/Navbar";

const COLS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Editor", to: "/editor" },
      { label: "Scene Gallery", to: "/gallery" },
      { label: "JSON Format", to: "/guide" },
    ],
  },
  {
    title: "Docs",
    links: [
      { label: "Getting Started", to: "/guide" },
      { label: "Runtime Snippet", to: "/guide" },
      { label: "FAQ", to: "/guide" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "GitHub", to: "https://github.com" },
      { label: "Issues", to: "https://github.com" },
      { label: "Contribute", to: "https://github.com" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg-1">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="" className="h-6 w-6" />
            <Wordmark />
          </div>
          <p className="mt-3 text-sm text-text-2">HD-2D for the rest of us.</p>
          <span className="mt-4 inline-block rounded-sm border border-border bg-bg-3 px-2 py-0.5 font-mono text-[11px] text-text-3">
            LICENSE: MIT
          </span>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-text-3">
              {col.title}
            </h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.to.startsWith("http") ? (
                    <a
                      href={l.to}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-text-2 transition-colors hover:text-amber"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link to={l.to} className="text-sm text-text-2 transition-colors hover:text-amber">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-text-3 sm:flex-row">
          <span>© 2026 PixelStage — an open-source tool for indie pixel devs</span>
          <span className="font-mono">v1.0.0 · canvas-2d</span>
        </div>
      </div>
    </footer>
  );
}
