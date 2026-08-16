import { baseFiles, text, type AssetPack } from "./common";
import { RUNTIME_SNIPPET } from "../scene";

/**
 * Plain-web exporter: a ready-to-serve static site — index.html (the bundled
 * three.js runtime), scene.json and assets/. Extract and open via any static
 * server (fetch() needs http, so double-clicking file:// won't work).
 */
export function webFiles(pack: AssetPack): Record<string, Uint8Array> {
  return {
    ...baseFiles(pack),
    "index.html": text(RUNTIME_SNIPPET),
    "README-web.txt": text(WEB_README),
  };
}

const WEB_README = `PixelStage → Web
================

1. Extract this zip anywhere.
2. Serve the folder over HTTP (fetch() can't read scene.json from file://):
     npx serve .
   or
     python -m http.server 8000
3. Open the printed URL — the scene plays with mouse-parallax.

To embed in your own page, copy the <script type="module"> from index.html
and point fetch() at your scene.json. Drive the camera from your game code
instead of the pointer handler (see applyCamera()).
`;
