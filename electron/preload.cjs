// PixelStage — preload: the ONLY bridge between the sandboxed renderer and
// the OS. Exposes a minimal, explicit API on window.pixelstage.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pixelstage", {
  platform: process.platform,

  /** { data: ArrayBuffer, defaultPath, filters } → saved file path | null (cancelled) */
  saveFile: (opts) => ipcRenderer.invoke("file:save", opts),

  /** { filters } → { path, data: ArrayBuffer } | null (cancelled) */
  openFile: (opts) => ipcRenderer.invoke("file:open", opts),

  /** write to a path the user already approved via a dialog this session */
  writeFile: (path, data) => ipcRenderer.invoke("file:write", { path, data }),

  /** read a path the user already approved via a dialog this session */
  readFile: (path) => ipcRenderer.invoke("file:read", path),

  /** recent project files, newest first: string[] */
  getRecentFiles: () => ipcRenderer.invoke("recent:get"),

  /** main → renderer: user opened a file via OS association / second instance */
  onOpenFile: (cb) => {
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on("app:open-file", handler);
    return () => ipcRenderer.removeListener("app:open-file", handler);
  },
});
