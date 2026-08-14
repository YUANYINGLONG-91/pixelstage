import { useEffect, useRef } from "react";
import { Stage3D } from "@/core/stage3d";
import { cameraPath, type PathPreset } from "@/core/cameraPaths";
import { focalDistance } from "@/core/types";
import { registerEditorCanvas } from "@/core/editorCanvas";
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
  /** editor extras: grid + orbit gesture + layer picking/dragging */
  editorMode?: boolean;
  pathPreset?: PathPreset;
  grid?: { visible: boolean; step: number };
  /** editor: selected layer ids (outline + group drag) */
  selectedIds?: string[];
  /** editor: viewport pick → selection change */
  onPickLayer?: (id: string | null, opts: { additive: boolean }) => void;
  /** editor: per-layer transform patch during a viewport drag (history-coalesced) */
  onLayerTransform?: (id: string, patch: Partial<Layer>, coalesceKey: string) => void;
  onFirstDrag?: () => void;
  onDraggingChange?: (dragging: boolean) => void;
  onContextLost?: () => void;
  className?: string;
}

interface DragStart {
  offsetX: number;
  offsetY: number;
  depth: number;
  orientation: Layer["orientation"];
}

const DEPTH_MIN = -400;
const DEPTH_MAX = 800;
const OFFSET_LIM = 4096;
const CLICK_SLOP = 4;

/**
 * The shared WebGL render loop — used by the editor viewport, the landing
 * hero and gallery previews. Every parallax on this site runs the exact same
 * HD-2D engine as the editor ("the demo IS the product").
 *
 * - rAF loop, only while visible (IntersectionObserver) and tab is active
 * - NearestFilter textures, always (non-negotiable)
 * - Stage3D is created once and disposed on unmount (WebGL context budget)
 *
 * Editor gestures (editorMode):
 * - click a sprite to select it (per-pixel alpha picking; Shift-click toggles)
 * - drag a sprite to move it (ground layers slide along the floor → depth)
 * - Shift+drag: push/pull depth (ground: hover height) · Ctrl: snap to 8px
 * - drag empty space to pan, wheel to dolly, right/Alt-drag to orbit
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
  selectedIds = [],
  onPickLayer,
  onLayerTransform,
  onFirstDrag,
  onDraggingChange,
  onContextLost,
  className,
}: StageCanvas3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<Stage3D | null>(null);

  // latest-values ref: the rAF loop reads everything through here
  const stateRef = useRef({
    sceneSize,
    layers,
    camera,
    effects,
    onCameraChange,
    playing,
    pathPreset,
    grid,
    selectedIds,
    onPickLayer,
    onLayerTransform,
  });
  stateRef.current = {
    sceneSize,
    layers,
    camera,
    effects,
    onCameraChange,
    playing,
    pathPreset,
    grid,
    selectedIds,
    onPickLayer,
    onLayerTransform,
  };

  const dragRef = useRef<{
    mode: "pan" | "orbit" | "layer" | null;
    lastX: number;
    lastY: number;
  }>({ mode: null, lastX: 0, lastY: 0 });
  const layerDragRef = useRef<{
    primaryId: string;
    starts: Map<string, DragStart>;
    grab: { x: number; y: number; z: number };
  } | null>(null);
  /** pending click: decided at pointerup (select vs deselect vs drag) */
  const clickRef = useRef<{
    x: number;
    y: number;
    hitId: string | null;
    additive: boolean;
    wasSelected: boolean;
  } | null>(null);
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
    if (editorMode) registerEditorCanvas(canvas);

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
      stage.setSelection(s.selectedIds);
      stage.render();
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      if (editorMode) registerEditorCanvas(null);
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

  const ndc = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      nx: ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1,
      ny: -(((clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1),
    };
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

  /**
   * The plane a dragged layer slides on. Normal mode: billboards slide on
   * their z-plane, ground layers slide on the floor (screen-y → depth).
   * Shift mode always uses the z-plane (screen-y → depth for billboards,
   * hover height for ground layers).
   */
  const planeFor = (
    st: DragStart,
    canvasH: number,
    shift: boolean
  ): { p: [number, number, number]; n: [number, number, number] } => {
    if (st.orientation === "ground" && !shift) {
      return { p: [0, canvasH - st.offsetY, 0], n: [0, 1, 0] };
    }
    return { p: [0, 0, -st.depth], n: [0, 0, 1] };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const orbit = e.button === 2 || e.altKey;
    if (orbit && !editorMode) return;
    if (e.button !== 0 && !orbit) return;
    const s = stateRef.current;
    clickRef.current = null;

    // editor: try to grab a layer first (per-pixel alpha pick, locked excluded)
    if (editorMode && !orbit) {
      const { nx, ny } = ndc(e.clientX, e.clientY);
      const hitId = stageRef.current?.pickLayer(nx, ny) ?? null;
      const hitLayer = hitId ? (s.layers.find((l) => l.id === hitId) ?? null) : null;
      const pickable = hitLayer && !hitLayer.locked ? hitLayer : null;
      const additive = e.shiftKey || e.ctrlKey || e.metaKey;
      clickRef.current = {
        x: e.clientX,
        y: e.clientY,
        hitId: pickable?.id ?? null,
        additive,
        wasSelected: pickable ? s.selectedIds.includes(pickable.id) : false,
      };

      if (pickable) {
        let dragIds = s.selectedIds;
        if (!additive && !s.selectedIds.includes(pickable.id)) {
          // immediate feedback: plain click on an unselected layer selects it now
          s.onPickLayer?.(pickable.id, { additive: false });
          dragIds = [pickable.id];
        } else if (additive && !s.selectedIds.includes(pickable.id)) {
          // shift+drag on a fresh layer adds it up front (Figma-style);
          // a shift+CLICK releases without moving and keeps it added
          s.onPickLayer?.(pickable.id, { additive: true });
          dragIds = [...s.selectedIds, pickable.id];
        }
        const starts = new Map<string, DragStart>();
        for (const id of dragIds) {
          const l = s.layers.find((x) => x.id === id);
          if (l && !l.locked) {
            starts.set(id, {
              offsetX: l.offsetX,
              offsetY: l.offsetY,
              depth: l.depth,
              orientation: l.orientation,
            });
          }
        }
        const plane = planeFor(
          {
            offsetX: pickable.offsetX,
            offsetY: pickable.offsetY,
            depth: pickable.depth,
            orientation: pickable.orientation,
          },
          s.sceneSize.height,
          e.shiftKey
        );
        const grab = stageRef.current?.rayPlane(nx, ny, ...plane.p, ...plane.n);
        if (grab && starts.size) {
          layerDragRef.current = { primaryId: pickable.id, starts, grab };
          dragRef.current = { mode: "layer", lastX: e.clientX, lastY: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
          onDraggingChange?.(true);
          if (!firstDragFiredRef.current) {
            firstDragFiredRef.current = true;
            onFirstDrag?.();
          }
          return;
        }
      }
    }

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
    const s = stateRef.current;

    // hover cursor: move over a pickable sprite, grab elsewhere
    if (!d.mode && editorMode && interactive) {
      const { nx, ny } = ndc(e.clientX, e.clientY);
      const hitId = stageRef.current?.pickLayer(nx, ny) ?? null;
      const hit = hitId ? s.layers.find((l) => l.id === hitId) : null;
      canvasRef.current!.style.cursor = hit && !hit.locked ? "move" : "grab";
      return;
    }
    if (!d.mode) return;
    canvasRef.current!.style.cursor = d.mode === "layer" ? "move" : "grabbing";

    if (d.mode === "layer") {
      const ld = layerDragRef.current;
      if (!ld) return;
      const { nx, ny } = ndc(e.clientX, e.clientY);
      const primary = ld.starts.get(ld.primaryId);
      if (!primary) return;
      const shift = e.shiftKey;
      const plane = planeFor(primary, s.sceneSize.height, shift);
      const w = stageRef.current?.rayPlane(nx, ny, ...plane.p, ...plane.n);
      if (!w) return;
      const dx = w.x - ld.grab.x;
      // main-axis delta in world units: floor drags read z, everything else y
      const dMain = shift || primary.orientation === "vertical" ? w.y - ld.grab.y : w.z - ld.grab.z;
      const snap = e.ctrlKey || e.metaKey;
      const quant = (v: number, lo: number, hi: number) => {
        const c = Math.min(hi, Math.max(lo, v));
        return snap ? Math.round(c / 8) * 8 : Math.round(c);
      };
      for (const [id, st] of ld.starts) {
        let patch: Partial<Layer>;
        if (st.orientation === "vertical") {
          patch = shift
            ? {
                offsetX: quant(st.offsetX + dx, -OFFSET_LIM, OFFSET_LIM),
                depth: quant(st.depth + dMain, DEPTH_MIN, DEPTH_MAX), // up = push farther
              }
            : {
                offsetX: quant(st.offsetX + dx, -OFFSET_LIM, OFFSET_LIM),
                offsetY: quant(st.offsetY - dMain, -OFFSET_LIM, OFFSET_LIM),
              };
        } else {
          patch = shift
            ? {
                offsetX: quant(st.offsetX + dx, -OFFSET_LIM, OFFSET_LIM),
                offsetY: quant(st.offsetY - dMain, -OFFSET_LIM, OFFSET_LIM), // hover
              }
            : {
                offsetX: quant(st.offsetX + dx, -OFFSET_LIM, OFFSET_LIM),
                depth: quant(st.depth - dMain, DEPTH_MIN, DEPTH_MAX), // up-screen = recede
              };
        }
        s.onLayerTransform?.(id, patch, `drag:${id}`);
      }
      return;
    }

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

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.mode) return;
    const wasLayerDrag = dragRef.current.mode === "layer";
    dragRef.current.mode = null;
    layerDragRef.current = null;
    // manual drag pauses the path; it resumes after 3s idle
    pauseUntilRef.current = performance.now() + 3000;
    pathBaseRef.current = null;
    onDraggingChange?.(false);

    // click (no real movement) → selection intent
    const c = clickRef.current;
    clickRef.current = null;
    if (!editorMode || !c) return;
    const moved = Math.hypot(e.clientX - c.x, e.clientY - c.y);
    if (moved > CLICK_SLOP) return;
    const s = stateRef.current;
    if (c.hitId) {
      // additive click on an already-selected layer toggles it off;
      // on a fresh layer the add already happened at pointerdown
      if (c.additive && c.wasSelected) {
        s.onPickLayer?.(c.hitId, { additive: true });
      } else if (!c.additive && wasLayerDrag && c.wasSelected) {
        // plain click on an already-selected layer collapses a multi-selection
        s.onPickLayer?.(c.hitId, { additive: false });
      }
    } else if (!wasLayerDrag) {
      s.onPickLayer?.(null, { additive: false });
    }
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
