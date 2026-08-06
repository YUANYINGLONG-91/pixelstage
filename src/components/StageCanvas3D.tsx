import { useEffect, useRef } from "react";
import { Stage3D } from "@/core/stage3d";
import { cameraPath, type PathPreset } from "@/core/cameraPaths";
import { focalDistance } from "@/core/types";
import type { Camera3D, CanvasSize, Layer, RenderEffects } from "@/core/types";
import { cn } from "@/lib/utils";

export interface StageCanvas3DProps {
  sceneSize: CanvasSize;
  layers: Layer[];
  camera: Camera3D;
  effects: RenderEffects;
  onCameraChange: (c: Camera3D, opts?: { transient?: boolean }) => void;
  /** cinematic path playback */
  playing?: boolean;
  /** drag to pan, wheel to dolly, right/Alt-drag to orbit */
  interactive?: boolean;
  /** editor extras: grid + orbit gesture */
  editorMode?: boolean;
  pathPreset?: PathPreset;
  grid?: { visible: boolean; step: number };
  onFirstDrag?: () => void;
  onDraggingChange?: (dragging: boolean) => void;
  onContextLost?: () => void;
  className?: string;
}

/**
 * The shared WebGL render loop — used by the editor viewport, the landing
 * hero and gallery previews. Every parallax on this site runs the exact same
 * HD-2D engine as the editor ("the demo IS the product").
 *
 * - rAF loop, only while visible (IntersectionObserver) and tab is active
 * - NearestFilter textures, always (non-negotiable)
 * - Stage3D is created once and disposed on unmount (WebGL context budget)
 */
export default function StageCanvas3D({
  sceneSize,
  layers,
  camera,
  effects,
  onCameraChange,
  playing = false,
  interactive = true,
  editorMode = false,
  pathPreset = "sweep",
  grid,
  onFirstDrag,
  onDraggingChange,
  onContextLost,
  className,
}: StageCanvas3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<Stage3D | null>(null);

  // latest-values ref: the rAF loop reads everything through here
  const stateRef = useRef({
    sceneSize, layers, camera, effects, onCameraChange, playing, pathPreset, grid,
  });
  stateRef.current = {
    sceneSize, layers, camera, effects, onCameraChange, playing, pathPreset, grid,
  };

  const dragRef = useRef<{
    mode: "pan" | "orbit" | null;
    lastX: number;
    lastY: number;
  }>({ mode: null, lastX: 0, lastY: 0 });
  const pathTRef = useRef(0);
  const pathBaseRef = useRef<Camera3D | null>(null);
  const pauseUntilRef = useRef(0);
  const firstDragFiredRef = useRef(false);
  const visibleRef = useRef(false);

  // engine lifecycle: one WebGL context per mounted canvas
  useEffect(() => {
    const canvas = canvasRef.current!;
    const stage = new Stage3D(canvas, stateRef.current.sceneSize);
    stage.onContextLost = () => onContextLost?.();
    stageRef.current = stage;

    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      stage.resize(
        Math.max(1, Math.round(rect.width)),
        Math.max(1, Math.round(rect.height)),
        dpr
      );
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([e]) => {
      visibleRef.current = e.isIntersecting;
    });
    io.observe(canvas);

    let raf = 0;
    let lastT = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - lastT) / 1000);
      lastT = now;
      if (!visibleRef.current || document.hidden) return;

      const s = stateRef.current;

      if (s.playing && !dragRef.current.mode) {
        if (!pathBaseRef.current) pathBaseRef.current = s.camera;
        if (now >= pauseUntilRef.current) {
          pathTRef.current += dt;
          s.onCameraChange(
            cameraPath(s.pathPreset, pathTRef.current, pathBaseRef.current, s.sceneSize),
            { transient: true }
          );
        }
      } else {
        pathBaseRef.current = null;
      }

      stage.setSceneSize(s.sceneSize);
      stage.setLayers(s.layers);
      stage.setCamera(s.camera);
      stage.setEffects(s.effects);
      if (s.grid) stage.setGrid(s.grid.visible, s.grid.step);
      stage.render();
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      stage.dispose();
      stageRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** world units per CSS pixel at the focal plane, for 1:1-feel panning */
  const worldPerPixel = () => {
    const s = stateRef.current;
    const rect = canvasRef.current!.getBoundingClientRect();
    const dist = Math.max(1, Math.abs(s.camera.position.z - s.camera.target.z));
    const visibleHeight = 2 * dist * Math.tan((s.camera.fov * Math.PI) / 360);
    return visibleHeight / Math.max(1, rect.height);
  };

  const clampCam = (c: Camera3D): Camera3D => {
    const { width: W, height: H } = stateRef.current.sceneSize;
    const cx = Math.min(Math.max(c.target.x, -W * 0.5), W * 1.5);
    const cy = Math.min(Math.max(c.target.y, -H * 0.5), H * 1.5);
    return {
      ...c,
      position: {
        ...c.position,
        x: c.position.x + (cx - c.target.x),
        y: c.position.y + (cy - c.target.y),
      },
      target: { ...c.target, x: cx, y: cy },
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const orbit = e.button === 2 || e.altKey;
    if (orbit && !editorMode) return;
    dragRef.current = { mode: orbit ? "orbit" : "pan", lastX: e.clientX, lastY: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    onDraggingChange?.(true);
    if (!firstDragFiredRef.current) {
      firstDragFiredRef.current = true;
      onFirstDrag?.();
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current;
    if (!d.mode) return;
    const s = stateRef.current;
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    const cam = s.camera;

    if (d.mode === "pan") {
      const k = worldPerPixel();
      s.onCameraChange(
        clampCam({
          ...cam,
          position: { ...cam.position, x: cam.position.x - dx * k, y: cam.position.y - dy * k },
          target: { ...cam.target, x: cam.target.x - dx * k, y: cam.target.y - dy * k },
        }),
        { transient: true }
      );
    } else {
      // orbit: yaw/pitch the position around the target
      const yaw = -dx * 0.005;
      const pitch = -dy * 0.005;
      const tx = cam.target.x;
      const ty = cam.target.y;
      const tz = cam.target.z;
      let px = cam.position.x - tx;
      let py = cam.position.y - ty;
      let pz = cam.position.z - tz;
      // yaw around the world Y axis
      const x1 = px * Math.cos(yaw) - pz * Math.sin(yaw);
      const z1 = px * Math.sin(yaw) + pz * Math.cos(yaw);
      px = x1;
      pz = z1;
      // pitch around the camera's local X axis, clamped to ±60°
      const r = Math.hypot(py, pz);
      const cur = Math.atan2(-py, pz);
      const next = Math.min(Math.max(cur + pitch, -Math.PI / 3), Math.PI / 3);
      py = -Math.sin(next) * r;
      pz = Math.cos(next) * r;
      s.onCameraChange(
        { ...cam, position: { x: tx + px, y: ty + py, z: tz + pz } },
        { transient: true }
      );
    }
  };

  const endDrag = () => {
    if (!dragRef.current.mode) return;
    dragRef.current.mode = null;
    // manual drag pauses the path; it resumes after 3s idle
    pauseUntilRef.current = performance.now() + 3000;
    pathBaseRef.current = null;
    onDraggingChange?.(false);
  };

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const s = stateRef.current;
    const cam = s.camera;
    const D = focalDistance(s.sceneSize, cam.fov);
    const k = Math.exp(e.deltaY * 0.0012);
    const dist = Math.hypot(
      cam.position.x - cam.target.x,
      cam.position.y - cam.target.y,
      cam.position.z - cam.target.z
    );
    const next = Math.min(Math.max(dist * k, D * 0.4), D * 4);
    const scale = next / dist;
    s.onCameraChange(
      {
        ...cam,
        position: {
          x: cam.target.x + (cam.position.x - cam.target.x) * scale,
          y: cam.target.y + (cam.position.y - cam.target.y) * scale,
          z: cam.target.z + (cam.position.z - cam.target.z) * scale,
        },
      },
      { transient: true }
    );
  };

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "block h-full w-full touch-none",
        interactive && "cursor-grab active:cursor-grabbing",
        className
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onWheel={onWheel}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
