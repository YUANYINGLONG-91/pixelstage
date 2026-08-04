import { Link } from "react-router-dom";
import { Wordmark } from "@/components/Navbar";
import { useT } from "@/i18n";
import { GITHUB_URL } from "@/lib/constants";

export default function Footer() {
  const t = useT();

  const COLS: { title: string; links: { label: string; to: string }[] }[] = [
    {
      title: t("footer.product"),
      links: [
        { label: t("nav.editor"), to: "/editor" },
        { label: t("footer.sceneGallery"), to: "/gallery" },
        { label: t("footer.jsonFormat"), to: "/guide" },
      ],
    },
    {
      title: t("footer.docs"),
      links: [
        { label: t("footer.gettingStarted"), to: "/guide" },
        { label: t("footer.runtimeSnippet"), to: "/guide" },
        { label: t("footer.faq"), to: "/guide" },
      ],
    },
    {
      title: t("footer.community"),
      links: [
        { label: "GitHub", to: GITHUB_URL },
        { label: t("footer.issues"), to: `${GITHUB_URL}/issues` },
        { label: t("footer.contribute"), to: `${GITHUB_URL}/blob/main/CONTRIBUTING.md` },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-bg-1">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="" className="h-6 w-6" />
            <Wordmark />
          </div>
          <p className="mt-3 text-sm text-text-2">{t("footer.tagline")}</p>
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
          <span>{t("footer.copyright")}</span>
          <span className="font-mono">v1.0.0 · canvas-2d</span>
        </div>
      </div>
    </footer>
  );
}
