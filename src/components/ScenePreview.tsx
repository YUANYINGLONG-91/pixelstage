import { useState } from "react";
import StageCanvas from "@/components/StageCanvas";
import { getCachedPlaceholderScene, type PlaceholderTheme } from "@/core/placeholder";
import type { Camera } from "@/core/types";

/**
 * A live mini parallax stage for marketing pages — the SAME render loop and
 * math as the editor. Auto-sweeps; dragging takes over (resumes after idle).
 */
export default function ScenePreview({
  theme,
  onFirstDrag,
  playing = true,
  className,
}: {
  theme: PlaceholderTheme;
  onFirstDrag?: () => void;
  playing?: boolean;
  className?: string;
}) {
  const scene = getCachedPlaceholderScene(theme);
  const [camera, setCamera] = useState<Camera>(scene.camera);

  return (
    <StageCanvas
      sceneSize={scene.canvas}
      layers={scene.layers}
      camera={camera}
      onCameraChange={setCamera}
      playing={playing}
      sweepOptions={{ rangeX: scene.canvas.width * 0.12, rangeY: scene.canvas.height * 0.04, period: 7 }}
      onFirstDrag={onFirstDrag}
      className={className}
    />
  );
}
