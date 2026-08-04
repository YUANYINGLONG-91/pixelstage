import { useEffect, useRef } from "react";
import { getBitmap, peekBitmap } from "@/core/bitmaps";
import { clampCamera, computeScreenPos, sweepCamera } from "@/core/parallax";
import type { Camera, CanvasSize, Layer } from "@/core/types";
import { cn } from "@/lib/utils";

export interface StageCanvasProps {
  sceneSize: CanvasSize;
  layers: Layer[];
  camera: Camera;
  onCameraChange: (c: Camera) => void;
  /** auto-sweep playback */
  playing?: boolean;
  /** drag anywhere to grab the world */
  interactive?: boolean;
  sweepOptions?: { rangeX?: number; rangeY?: number; period?: number };
  onFirstDrag?: () => void;
  onDraggingChange?: (dragging: boolean) => void;
  className?: string;
}

/**
 * The shared Canvas 2D render loop — used by the editor viewport, the landing
 * hero and gallery previews. Every marketing parallax on this site runs the
 * exact same math as the editor (design.md §6: "the demo IS the product").
 *
 * - rAF loop, only while visible (IntersectionObserver) and tab is active
 * - imageSmoothingEnabled = false, always (non-negotiable)
 * - backing store follows devicePixelRatio; layers are drawn with zero decoding
 */
export default function StageCanvas({
  sceneSize,
  layers,
  camera,
  onCameraChange,
  playing = false,
  interactive = true,
  sweepOptions,
  onFirstDrag,
  onDraggingChange,
  className,
}: StageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // latest-values ref: the rAF loop reads everything through here
  const stateRef = useRef({ sceneSize, layers, camera, playing, onCameraChange, sweepOptions });
  stateRef.current = { sceneSize, layers, camera, playing, onCameraChange, sweepOptions };

  const dragRef = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false,
    lastX: 0,
    lastY: 0,
  });
  const sweepTRef = useRef(0);
  const sweepPauseUntilRef = useRef(0);
  const firstDragFiredRef = useRef(false);
  const visibleRef = useRef(false);

  // kick off bitmap decoding whenever the layer set changes
  useEffect(() => {
    for (const l of layers) {
      if (!peekBitmap(l.id, l.src)) void getBitmap(l.id, l.src);
    }
  }, [layers]);

  // sizing: backing store = css size × dpr, redrawn every frame
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // render loop
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let lastT = performance.now();

    const io = new IntersectionObserver(([e]) => {
      visibleRef.current = e.isIntersecting;
    });
    io.observe(canvas);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - lastT) / 1000);
      lastT = now;
      if (!visibleRef.current || document.hidden) return;

      const s = stateRef.current;

      // auto-sweep drives the camera when playing (and not recently dragged)
      if (s.playing && !dragRef.current.active) {
        if (now < sweepPauseUntilRef.current) {
          // paused after manual drag — resuming soon
        } else {
          sweepTRef.current += dt;
          s.onCameraChange(sweepCamera(sweepTRef.current, s.sceneSize, s.sweepOptions));
        }
      }

      draw(ctx, canvas, s.layers, s.camera, s.sceneSize);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  const cssScale = () => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return rect.width / stateRef.current.sceneSize.width;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    onDraggingChange?.(true);
    if (!firstDragFiredRef.current) {
      firstDragFiredRef.current = true;
      onFirstDrag?.();
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current;
    if (!d.active) return;
    const s = stateRef.current;
    const scale = cssScale();
    const dx = (e.clientX - d.lastX) / scale;
    const dy = (e.clientY - d.lastY) / scale;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    // grabbing the world: camera moves opposite the drag
    s.onCameraChange(clampCamera({ x: s.camera.x - dx, y: s.camera.y - dy }, s.sceneSize));
  };

  const endDrag = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    // manual drag pauses the sweep; it resumes after 3s idle (editor.md §3)
    sweepPauseUntilRef.current = performance.now() + 3000;
    onDraggingChange?.(false);
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
    />
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  layers: Layer[],
  camera: Camera,
  sceneSize: CanvasSize
) {
  const scale = canvas.width / sceneSize.width;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, sceneSize.width, sceneSize.height);

  for (const layer of layers) {
    if (!layer.visible) continue;
    const pos = computeScreenPos(layer, camera);
    const entry = peekBitmap(layer.id, layer.src);
    if (entry) {
      ctx.drawImage(
        entry.bitmap,
        pos.x,
        pos.y,
        entry.width * layer.scale,
        entry.height * layer.scale
      );
    } else {
      // missing asset: magenta/black placeholder (design.md §2)
      const w = sceneSize.width * layer.scale;
      const h = sceneSize.height * layer.scale;
      ctx.fillStyle = "#0D1017";
      ctx.fillRect(pos.x, pos.y, w, h);
      ctx.strokeStyle = "#E56CF0";
      ctx.lineWidth = 2 / scale;
      ctx.strokeRect(pos.x, pos.y, w, h);
    }
  }
}
