import { useEffect, useRef, useState } from "react";
import { loadProject, saveProject } from "@/core/storage";
import { useSceneStore } from "@/store/sceneStore";
import { toast } from "@/store/toastStore";

/**
 * Autosave (PRD §3-F5): every store mutation is debounce-saved (500ms).
 * On mount, restores the local project if one exists.
 */
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
          useSceneStore.getState().loadJSON(project);
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
            toast("Local save failed — storage may be full. Export a project file soon.", {
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
