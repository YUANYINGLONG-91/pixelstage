import { saveBlob, openFile, writeFilePath, isElectron } from "@/core/platform";
import { useSceneStore } from "./sceneStore";

const PROJECT_EXT = ".pixelstage.json";

function projectBlob(): Blob {
  const json = JSON.stringify(useSceneStore.getState().toJSON(), null, 2);
  return new Blob([json], { type: "application/json" });
}

function defaultName(): string {
  const name = useSceneStore.getState().name.trim() || "untitled-scene";
  return `${name.replace(/[^\w\- ]+/g, "").replace(/\s+/g, "-").toLowerCase()}${PROJECT_EXT}`;
}

/** Ctrl+S — save to the current path if we have one, otherwise Save As. */
export async function saveProject(): Promise<string | null> {
  const { filePath, markSaved } = useSceneStore.getState();
  if (filePath && isElectron()) {
    const ok = await writeFilePath(filePath, await projectBlob().arrayBuffer());
    if (ok) {
      markSaved(filePath);
      return filePath;
    }
  }
  return saveProjectAs();
}

/** Ctrl+Shift+S — always ask for a location. */
export async function saveProjectAs(): Promise<string | null> {
  const path = await saveBlob(projectBlob(), { defaultPath: defaultName() });
  if (path) useSceneStore.getState().markSaved(path);
  return path;
}

/** Ctrl+O — native dialog (Electron) or file picker (web). */
export async function openProject(): Promise<string | null> {
  const r = await openFile("json");
  if (!r) return null;
  loadProjectData(r.data, r.path ?? null);
  return r.path ?? r.name;
}

/** Load project bytes into the store (shared by dialog open & OS file-open). */
export function loadProjectData(data: ArrayBuffer, path: string | null) {
  const raw = JSON.parse(new TextDecoder().decode(data)) as unknown;
  useSceneStore.getState().loadJSON(raw);
  useSceneStore.getState().markSaved(path);
}
