import { text } from "./common";
import type { SceneFile } from "../types";
import { RUNTIME_SNIPPET } from "../scene";

const FETCH_LINE = 'const scene = await (await fetch("./scene.json")).json();';

/**
 * Plain-web exporter: a single self-contained index.html — the scene JSON is
 * embedded inline (images as data URLs), so double-clicking the file plays
 * the scene straight from disk. Only the three.js CDN import needs internet.
 */
export function webFiles(rawScene: SceneFile): Record<string, Uint8Array> {
  // "</" inside a JSON string would close the <script> tag — escape it.
  const embedded = JSON.stringify(rawScene).replace(/</g, "\\u003c");
  const html = RUNTIME_SNIPPET.includes(FETCH_LINE)
    ? RUNTIME_SNIPPET.replace(FETCH_LINE, `const scene = ${embedded};`)
    : RUNTIME_SNIPPET;
  return {
    "index.html": text(html),
    "README-web.txt": text(WEB_README),
  };
}

const WEB_README = `PixelStage → Web
================

1. Extract this zip anywhere.
2. Double-click index.html — the scene plays immediately with
   mouse-parallax. Everything is embedded in the file (images included);
   only the three.js library loads from a CDN, so you need internet.

To embed in your own page, copy the <script type="module"> from index.html
and drive the camera from your game code instead of the pointer handler
(see applyCamera()).
`;
