// PixelStage — Electron main process. The renderer stays fully sandboxed;
// every OS interaction goes through the IPC handlers below.
const { app, BrowserWindow, shell, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

const PROJECT_FILTERS = [
  { name: "PixelStage Project", extensions: ["pixelstage.json", "json"] },
];
const IMAGE_FILTERS = [{ name: "Images", extensions: ["png", "jpg", "jpeg"] }];

/** paths the user explicitly approved via a dialog (or OS file-open) this session */
const approvedPaths = new Set();

/* ------------------------------ recent files ------------------------------ */

const recentFile = () => path.join(app.getPath("userData"), "recent-files.json");

function getRecent() {
  try {
    const list = JSON.parse(fs.readFileSync(recentFile(), "utf-8"));
    return Array.isArray(list) ? list.filter((p) => typeof p === "string") : [];
  } catch {
    return [];
  }
}

function addRecent(p) {
  const list = [p, ...getRecent().filter((x) => x !== p)].slice(0, 10);
  try {
    fs.writeFileSync(recentFile(), JSON.stringify(list, null, 2));
  } catch {
    /* userData not writable — non-fatal */
  }
}

/* --------------------------------- window --------------------------------- */

function createWindow(openWith) {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    backgroundColor: "#0A0C10",
    icon: path.join(__dirname, "../assets/pixelstage.ico"),
    autoHideMenuBar: true,
    title: "PixelStage",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => win.show());

  // external links (GitHub etc.) open in the system browser, not in-app
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  win.loadFile(path.join(__dirname, "../dist/index.html"));

  // a file passed via OS association / CLI opens once the renderer is up
  if (openWith) {
    win.webContents.once("did-finish-load", () => sendOpenFile(win, openWith));
  }
}

/** read an approved project file and push it into the renderer */
function sendOpenFile(win, filePath) {
  try {
    const data = fs.readFileSync(filePath);
    approvedPaths.add(filePath);
    addRecent(filePath);
    win.webContents.send("app:open-file", {
      path: filePath,
      data: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
    });
  } catch {
    /* unreadable file — ignore */
  }
}

/** pull a .json path out of process argv (OS file association launch) */
function fileFromArgv(argv) {
  return argv.find(
    (a) => /\.(pixelstage\.json|json)$/i.test(a) && fs.existsSync(a)
  );
}

/* ---------------------------------- IPC ----------------------------------- */

ipcMain.handle("file:save", async (e, { data, defaultPath, filters }) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const r = await dialog.showSaveDialog(win, {
    defaultPath,
    filters: filters ?? PROJECT_FILTERS,
  });
  if (r.canceled || !r.filePath) return null;
  await fs.promises.writeFile(r.filePath, Buffer.from(data));
  approvedPaths.add(r.filePath);
  addRecent(r.filePath);
  return r.filePath;
});

ipcMain.handle("file:open", async (e, { filters }) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const r = await dialog.showOpenDialog(win, {
    properties: ["openFile"],
    filters: filters === "images" ? IMAGE_FILTERS : PROJECT_FILTERS,
  });
  if (r.canceled || r.filePaths.length === 0) return null;
  const p = r.filePaths[0];
  const data = await fs.promises.readFile(p);
  approvedPaths.add(p);
  if (/\.(pixelstage\.json|json)$/i.test(p)) addRecent(p);
  return {
    path: p,
    data: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
  };
});

ipcMain.handle("file:write", async (_e, { path: p, data }) => {
  if (!approvedPaths.has(p)) throw new Error("path not approved");
  await fs.promises.writeFile(p, Buffer.from(data));
  addRecent(p);
  return true;
});

ipcMain.handle("file:read", async (_e, p) => {
  // allowed: approved this session, or on the recent list (which only ever
  // contains paths the user approved through a dialog earlier)
  if (!approvedPaths.has(p) && !getRecent().includes(p)) {
    throw new Error("path not approved");
  }
  const data = await fs.promises.readFile(p);
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
});

ipcMain.handle("recent:get", () => getRecent());

/* --------------------------------- startup -------------------------------- */

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (_e, argv) => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
      const f = fileFromArgv(argv);
      if (f) sendOpenFile(win, f);
    }
  });

  app.whenReady().then(() => {
    createWindow(process.argv.length > 1 ? fileFromArgv(process.argv) : null);
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => app.quit());
}
