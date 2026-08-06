import { useState } from "react";
import StageCanvas3D from "@/components/StageCanvas3DLazy";
import { getCachedPlaceholderScene, type PlaceholderTheme } from "@/core/placeholder";
import type { Camera3D } from "@/core/types";

/**
 * A live mini HD-2D stage for marketing pages — the SAME WebGL engine as the
 * editor ("the demo IS the product"). Previews auto-orbit; not interactive.
 */
export default function ScenePreview({
  theme,
  playing = true,
  className,
}: {
  theme: PlaceholderTheme;
  playing?: boolean;
  className?: string;
}) {
  const scene = getCachedPlaceholderScene(theme);
  const [camera, setCamera] = useState<Camera3D>(scene.camera);

  return (
    <StageCanvas3D
      sceneSize={scene.canvas}
      layers={scene.layers}
      camera={camera}
      effects={scene.effects}
      onCameraChange={setCamera}
      playing={playing}
      interactive={false}
      pathPreset="orbit"
      className={className}
    />
  );
}
