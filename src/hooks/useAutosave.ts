import { useEffect, useRef, useState } from "react";
import { loadProject, saveProject } from "@/core/storage";
import type { PlaceholderTheme } from "@/core/placeholder";
import { useSceneStore } from "@/store/sceneStore";
import { toast } from "@/store/toastStore";

/**
 * Autosave (PRD §3-F5): every store mutation is debounce-saved (500ms).
 * On mount, restores the local project if one exists.
 */

/** Retired built-in demo scenes → their current equivalents. A restored save
 *  matching one of these is a stale generated demo (old art/effects), not user
 *  work — swap in the freshly generated scene instead of rendering the old one. */
const RETIRED_DEMOS: Record<string, PlaceholderTheme> = {
  "Sunset Valley": "village",
  "Ember Dungeon": "ruins",
};

function staleDemoTheme(p: { name: string; layers: { name: string }[] }): PlaceholderTheme | null {
  if (RETIRED_DEMOS[p.name]) return RETIRED_DEMOS[p.name];
  // old Neon Alley demo had 5 layers (no "runner" character layer); the current one has 6
  if (p.name === "Neon Alley" && !p.layers.some((l) => l.name === "runner")) return "alley";
  return null;
}
export function useAutosave() {
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [restored, setRestored] = useState(false);
  const readyRef = useRef(false);

  // restore once on mount
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const project = await loadProject();
        if (!cancelled && project && project.layers.length > 0) {
          const stale = staleDemoTheme(project);
          if (stale) {
            // stale generated demo save — regenerate with the current art kit
            useSceneStore.getState().loadDemo(stale);
          } else {
            useSceneStore.getState().loadJSON(project);
          }
          setRestored(true);
        }
      } catch {
        // corrupt save — start fresh rather than crash
      } finally {
        readyRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // debounce-save on every mutation
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = useSceneStore.subscribe(() => {
      if (!readyRef.current) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void (async () => {
          try {
            await saveProject(useSceneStore.getState().toJSON());
            setSavedAt(new Date());
          } catch {
            toast("本地保存失败 —— 存储可能已满，请尽快导出项目文件 / Local save failed — storage full.", {
              variant: "danger",
              duration: 4000,
            });
          }
        })();
      }, 500);
    });
    return () => {
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return { savedAt, restored };
}
