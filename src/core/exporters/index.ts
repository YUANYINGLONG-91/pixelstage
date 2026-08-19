import type { SceneFile } from "../types";
import { collectAssets, slug, zipFiles } from "./common";
import { godotFiles } from "./godot";
import { unityFiles } from "./unity";
import { cocosFiles } from "./cocos";
import { rpgmakerFiles, type RpgMakerOptions } from "./rpgmaker";
import { webFiles } from "./web";

export type EngineId = "godot" | "unity" | "cocos" | "rpgmaker" | "web";

export const ENGINE_ORDER: EngineId[] = ["godot", "unity", "cocos", "rpgmaker", "web"];

export interface EngineZipResult {
  blob: Blob;
  filename: string;
  /** layer indexes whose src was external (not packed into the zip) */
  skipped: number[];
  /** rpgmaker: false when no canvas snapshot was available */
  snapshotIncluded: boolean;
}

/** Build a ready-to-import zip for the chosen engine. */
export function buildEngineZip(
  engine: EngineId,
  scene: SceneFile,
  opts: RpgMakerOptions = {}
): EngineZipResult {
  const pack = collectAssets(scene);
  let files: Record<string, Uint8Array>;
  switch (engine) {
    case "godot":
      files = godotFiles(pack);
      break;
    case "unity":
      files = unityFiles(pack);
      break;
    case "cocos":
      files = cocosFiles(pack);
      break;
    case "rpgmaker":
      files = rpgmakerFiles(pack, opts);
      break;
    case "web":
      files = webFiles(scene);
      break;
  }
  return {
    blob: zipFiles(files),
    filename: `${slug(scene.name)}-${engine}.zip`,
    skipped: pack.skipped,
    snapshotIncluded: engine !== "rpgmaker" || !!opts.snapshot,
  };
}
