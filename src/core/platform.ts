/**
 * Platform seam: every file/OS interaction in the app goes through here.
 * Electron → native dialogs + fs via the preload bridge (window.pixelstage).
 * Browser  → Blob downloads + hidden file inputs (the web version keeps working).
 */

interface FileFilter {
  name: string;
  extensions: string[];
}

interface PixelStageBridge {
  platform: string;
  saveFile: (opts: {
    data: ArrayBuffer;
    defaultPath: string;
    filters?: FileFilter[];
  }) => Promise<string | null>;
  openFile: (opts?: {
    filters?: string;
  }) => Promise<{ path: string; data: ArrayBuffer } | null>;
  writeFile: (path: string, data: ArrayBuffer) => Promise<boolean>;
  readFile: (path: string) => Promise<ArrayBuffer>;
  getRecentFiles: () => Promise<string[]>;
  onOpenFile: (cb: (payload: { path: string; data: ArrayBuffer }) => void) => () => void;
}

function bridge(): PixelStageBridge | null {
  return (window as unknown as { pixelstage?: PixelStageBridge }).pixelstage ?? null;
}

export const isElectron = () => bridge() !== null;

export interface SaveOptions {
  defaultPath: string;
  filters?: FileFilter[];
}

/**
 * Save a blob. Electron: native save dialog → returns the chosen path (or null
 * if cancelled). Browser: anchor download → returns the suggested filename.
 */
export async function saveBlob(blob: Blob, opts: SaveOptions): Promise<string | null> {
  const api = bridge();
  if (api) {
    return api.saveFile({ data: await blob.arrayBuffer(), ...opts });
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = opts.defaultPath;
  a.click();
  URL.revokeObjectURL(url);
  return opts.defaultPath;
}

/**
 * Open a file. Electron: native open dialog. Browser: hidden <input type=file>.
 * kind "images" → png/jpg · otherwise project JSON.
 */
export async function openFile(
  kind: "images" | "json" = "json"
): Promise<{ name: string; path?: string; data: ArrayBuffer } | null> {
  const api = bridge();
  if (api) {
    const r = await api.openFile({ filters: kind });
    return r && { name: r.path.split(/[\\/]/).pop() ?? r.path, path: r.path, data: r.data };
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = kind === "images" ? "image/png,image/jpeg" : "application/json,.json";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return resolve(null);
      resolve({ name: f.name, data: await f.arrayBuffer() });
    };
    // user closed the picker without choosing
    input.oncancel = () => resolve(null);
    input.click();
  });
}

/** Write to a previously-approved path (Electron only). False if unavailable. */
export async function writeFilePath(path: string, data: ArrayBuffer): Promise<boolean> {
  const api = bridge();
  if (!api) return false;
  await api.writeFile(path, data);
  return true;
}

/** Read a previously-approved / recent-files path (Electron only). */
export async function readFilePath(path: string): Promise<ArrayBuffer | null> {
  const api = bridge();
  if (!api) return null;
  return api.readFile(path);
}

/** Recent project paths (Electron only; empty list on web). */
export async function getRecentFiles(): Promise<string[]> {
  const api = bridge();
  return api ? api.getRecentFiles() : [];
}

/** Subscribe to OS file-open events (double-clicked .pixelstage.json). */
export function onOpenFile(
  cb: (payload: { path: string; data: ArrayBuffer }) => void
): () => void {
  const api = bridge();
  if (!api) return () => {};
  return api.onOpenFile(cb);
}
