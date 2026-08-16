import { baseFiles, slug, text, type AssetPack } from "./common";

export interface RpgMakerOptions {
  /** editor-canvas snapshot of the current framing, used as the parallax image */
  snapshot?: Uint8Array | null;
}

/**
 * RPG Maker MV/MZ exporter: parallax mapping. The flattened background is a
 * snapshot of the current editor framing; layered PNGs + scene.json are
 * included for users of multi-layer parallax plugins (e.g. Galv Layer Graphics).
 */
export function rpgmakerFiles(pack: AssetPack, opts: RpgMakerOptions = {}): Record<string, Uint8Array> {
  const files: Record<string, Uint8Array> = { ...baseFiles(pack) };
  if (opts.snapshot) {
    files[`parallaxes/${slug(pack.scene.name)}.png`] = opts.snapshot;
  }
  files["README-rpgmaker.txt"] = text(opts.snapshot ? RPG_README : RPG_README_NO_SNAPSHOT);
  return files;
}

const RPG_README = `PixelStage → RPG Maker MV / MZ
==============================

Quick path (single parallax background)
---------------------------------------
1. Copy parallaxes/<scene>.png into your game's img/parallaxes/ folder.
2. In the map properties, set Parallax Background to that image.
3. The image scrolls with the map by default. To lock it in place
   (fixed background), prefix the filename with "!" — e.g. !scene.png —
   or use a "lock parallax" plugin for finer control.

Multi-layer path (keeps the HD-2D depth feel)
---------------------------------------------
RPG Maker itself only supports ONE parallax layer. To keep per-layer
parallax, use a layer plugin (MZ/MV), e.g. Galv Layer Graphics or
OcRam_Parallaxes:
1. Copy the PNGs from this package's assets/ folder into the folder your
   plugin reads (often img/layers/ or img/parallaxes/).
2. Order layers back-to-front — scene.json lists them in draw order
   (layers[0] = farthest). Each layer's offsetX/offsetY/depth in
   scene.json tells you where it sat in PixelStage.

Notes
-----
- The parallax snapshot is exactly the framing you had open in the
  PixelStage editor when exporting — frame your shot before exporting.
- RPG Maker maps are tile-based; for pixel-perfect alignment, match your
  map's screen size (e.g. 816x624 for default MV, 816x624/1280x720 for MZ)
  to the PixelStage canvas size.
`;

const RPG_README_NO_SNAPSHOT = `PixelStage → RPG Maker MV / MZ
==============================

This package was exported without a flattened snapshot. The layered PNGs
in assets/ plus scene.json (draw order + offsets) are still here — see the
multi-layer plugin path below. To get a ready-to-use single parallax image,
re-export from PixelStage with the editor viewport visible so a snapshot
can be captured.

Multi-layer path
----------------
RPG Maker itself only supports ONE parallax layer. To keep per-layer
parallax, use a layer plugin (MZ/MV), e.g. Galv Layer Graphics or
OcRam_Parallaxes:
1. Copy the PNGs from assets/ into the folder your plugin reads
   (often img/layers/ or img/parallaxes/).
2. Order layers back-to-front — scene.json lists them in draw order
   (layers[0] = farthest). Each layer's offsetX/offsetY/depth in
   scene.json tells you where it sat in PixelStage.
`;
