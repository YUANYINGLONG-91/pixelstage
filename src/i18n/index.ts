import { create } from "zustand";

export type Lang = "en" | "zh";

const LANG_KEY = "pixelstage.lang";

function detectLang(): Lang {
  const stored = localStorage.getItem(LANG_KEY);
  if (stored === "en" || stored === "zh") return stored;
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
}

export const useLangStore = create<LangState>((set) => ({
  lang: detectLang(),
  setLang: (lang) => {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    set({ lang });
  },
}));

import { dict, type DictKey } from "./dict";

/** Translate a dictionary key into the active language. Falls back to the key itself. */
export function useT() {
  const lang = useLangStore((s) => s.lang);
  return (key: DictKey): string => dict[key]?.[lang] ?? key;
}
