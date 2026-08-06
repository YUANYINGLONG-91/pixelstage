import { lazy, Suspense } from "react";
import type { StageCanvas3DProps } from "./StageCanvas3D";

const Inner = lazy(() => import("./StageCanvas3D"));

/**
 * Lazy wrapper: three.js (~1MB) lives in its own chunk and only downloads/
 * parses when a stage actually mounts. The fallback matches the app bg so
 * the swap is invisible.
 */
export default function StageCanvas3DLazy(props: StageCanvas3DProps) {
  return (
    <Suspense fallback={<div className="h-full w-full bg-bg-1" aria-hidden />}>
      <Inner {...props} />
    </Suspense>
  );
}
