import {
  SCENE_VERSION,
  defaultCamera,
  defaultEffects,
  depthFromFactor,
  focalDistance,
  type Camera3D,
  type Layer,
  type RenderEffects,
  type SceneFile,
} from "./types";

/** Serialize editor state → scene.json v2. Pure & testable. */
export function serializeScene(
  name: string,
  canvas: { width: number; height: number },
  camera: Camera3D,
  effects: RenderEffects,
  layers: Layer[]
): SceneFile {
  return {
    version: SCENE_VERSION,
    name,
    canvas: { ...canvas },
    camera: {
      position: { ...camera.position },
      target: { ...camera.target },
      fov: camera.fov,
    },
    effects: JSON.parse(JSON.stringify(effects)) as RenderEffects,
    layers: layers.map((l) => ({ ...l })),
  };
}

interface V1Layer {
  id?: string;
  name?: string;
  src?: string;
  factorX?: number;
  factorY?: number;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  visible?: boolean;
}

/** Parse unknown JSON into a valid v2 SceneFile, filling defaults. Throws on junk. */
export function migrateScene(raw: unknown): SceneFile {
  if (typeof raw !== "object" || raw === null) throw new Error("Not a scene file");
  const s = raw as Record<string, unknown>;
  if (!Array.isArray(s.layers)) throw new Error("Scene has no layers array");

  const canvasRaw = (s.canvas ?? {}) as { width?: number; height?: number };
  const canvas = { width: num(canvasRaw.width, 960), height: num(canvasRaw.height, 540) };
  const isV1 = s.version !== 2;
  const D = focalDistance(canvas, 40);

  const layers: Layer[] = (s.layers as unknown[]).map((l, i) => {
    if (typeof l !== "object" || l === null || typeof (l as Layer).src !== "string") {
      throw new Error(`Layer ${i} is missing a src`);
    }
    if (isV1) {
      const v1 = l as V1Layer;
      return {
        id: v1.id ?? crypto.randomUUID(),
        name: v1.name ?? `layer-${i + 1}`,
        src: v1.src!,
        offsetX: num(v1.offsetX, 0),
        offsetY: num(v1.offsetY, 0),
        depth: depthFromFactor(num(v1.factorX, 0.5), D),
        scale: num(v1.scale, 1),
        orientation: "vertical" as const,
        lit: true,
        visible: v1.visible !== false,
      };
    }
    const layer = l as Partial<Layer>;
    return {
      id: layer.id ?? crypto.randomUUID(),
      name: layer.name ?? `layer-${i + 1}`,
      src: layer.src!,
      offsetX: num(layer.offsetX, 0),
      offsetY: num(layer.offsetY, 0),
      depth: num(layer.depth, 0),
      scale: num(layer.scale, 1),
      orientation: layer.orientation === "ground" ? "ground" : "vertical",
      lit: layer.lit !== false,
      visible: layer.visible !== false,
    };
  });

  let camera: Camera3D;
  if (isV1) {
    // v1 camera {x,y} was a 2D pan; map it onto the default 3D framing
    const v1cam = (s.camera ?? {}) as { x?: number; y?: number };
    const base = defaultCamera(canvas);
    const dx = num(v1cam.x, canvas.width / 2) - canvas.width / 2;
    const dy = num(v1cam.y, canvas.height / 2) - canvas.height / 2;
    camera = {
      position: { ...base.position, x: base.position.x + dx, y: base.position.y + dy },
      target: { ...base.target, x: base.target.x + dx, y: base.target.y + dy },
      fov: base.fov,
    };
  } else {
    const c = (s.camera ?? {}) as Partial<Camera3D>;
    const base = defaultCamera(canvas);
    camera = {
      position: {
        x: num(c.position?.x, base.position.x),
        y: num(c.position?.y, base.position.y),
        z: num(c.position?.z, base.position.z),
      },
      target: {
        x: num(c.target?.x, base.target.x),
        y: num(c.target?.y, base.target.y),
        z: num(c.target?.z, base.target.z),
      },
      fov: num(c.fov, base.fov),
    };
  }

  const fx = ((s.effects ?? {}) as Partial<RenderEffects>) ?? {};
  const def = defaultEffects();
  const effects: RenderEffects = {
    dof: {
      enabled: fx.dof?.enabled === true,
      focus: num(fx.dof?.focus, def.dof.focus),
      aperture: num(fx.dof?.aperture, def.dof.aperture),
    },
    fog: {
      enabled: fx.fog?.enabled === true,
      color: typeof fx.fog?.color === "string" ? fx.fog.color : def.fog.color,
      near: num(fx.fog?.near, def.fog.near),
      far: num(fx.fog?.far, def.fog.far),
    },
    ambient: {
      color: typeof fx.ambient?.color === "string" ? fx.ambient.color : def.ambient.color,
      intensity: num(fx.ambient?.intensity, def.ambient.intensity),
    },
    sun: {
      color: typeof fx.sun?.color === "string" ? fx.sun.color : def.sun.color,
      intensity: num(fx.sun?.intensity, def.sun.intensity),
      azimuth: num(fx.sun?.azimuth, def.sun.azimuth),
      elevation: num(fx.sun?.elevation, def.sun.elevation),
    },
    // post-stack groups: absent in pre-bloom scene files → fall back to defaults
    bloom: {
      enabled: fx.bloom ? fx.bloom.enabled === true : def.bloom.enabled,
      strength: num(fx.bloom?.strength, def.bloom.strength),
      threshold: num(fx.bloom?.threshold, def.bloom.threshold),
    },
    grade: {
      vignette: num(fx.grade?.vignette, def.grade.vignette),
      saturation: num(fx.grade?.saturation, def.grade.saturation),
      grain: num(fx.grade?.grain, def.grade.grain),
    },
    particles: {
      enabled: fx.particles?.enabled === true,
      color:
        typeof fx.particles?.color === "string" ? fx.particles.color : def.particles.color,
      count: num(fx.particles?.count, def.particles.count),
      size: num(fx.particles?.size, def.particles.size),
      speed: num(fx.particles?.speed, def.particles.speed),
    },
  };

  return {
    version: SCENE_VERSION,
    name: typeof s.name === "string" ? s.name : "untitled-scene",
    canvas,
    camera,
    effects,
    layers,
  };
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/**
 * The runtime snippet shown in the export modal & docs: a minimal three.js
 * player for scene.json v2 (HD-2D). Uses a CDN import map — no build step.
 */
export const RUNTIME_SNIPPET = `<!-- index.html — play a PixelStage v2 scene with three.js -->
<script type="importmap">
  { "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js" } }
</script>
<script type="module">
import * as THREE from "three";

const scene = await (await fetch("./scene.json")).json();
const { width: W, height: H } = scene.canvas;

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(W, H);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping; // HD-2D filmic response
renderer.shadowMap.enabled = true;                  // sun casts billboard shadows
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

const world = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(scene.camera.fov, W / H, 1, 20000);

const loader = new THREE.TextureLoader();
for (const l of scene.layers) {
  if (!l.visible) continue;
  const tex = await loader.loadAsync(l.src);
  tex.magFilter = THREE.NearestFilter;           // crisp pixels, always
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.PlaneGeometry(tex.image.width * l.scale, tex.image.height * l.scale);
  const mat = l.lit === false
    ? new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.01, side: THREE.DoubleSide })
    : new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.01, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  const w = geo.parameters.width, h = geo.parameters.height;
  if (l.orientation === "ground") {
    geo.translate(0, -h / 2, 0);               // pivot = near edge
    mesh.rotation.x = Math.PI / 2;             // lay flat, receding to the horizon
    mesh.position.set(l.offsetX + w / 2, H - l.offsetY, -l.depth);
  } else {
    mesh.position.set(l.offsetX + w / 2, H - l.offsetY - h / 2, -l.depth);
  }
  world.add(mesh);
}
world.add(new THREE.AmbientLight(scene.effects.ambient.color, scene.effects.ambient.intensity));
const sun = new THREE.DirectionalLight(scene.effects.sun.color, scene.effects.sun.intensity);
sun.position.set(1, 1, 1);
world.add(sun);

// UI coords (y down) → three (y up)
function applyCamera(c) {
  cam.position.set(c.position.x, H - c.position.y, c.position.z);
  cam.lookAt(c.target.x, H - c.target.y, -c.target.z);
}
applyCamera(scene.camera);

// drive the camera from your game / mouse:
addEventListener("pointermove", (e) => {
  const dx = (e.clientX / innerWidth - 0.5) * W * 0.15;
  const dy = (e.clientY / innerHeight - 0.5) * H * 0.15;
  applyCamera({
    position: { ...scene.camera.position, x: scene.camera.position.x + dx, y: scene.camera.position.y + dy },
    target:   { ...scene.camera.target,   x: scene.camera.target.x + dx,   y: scene.camera.target.y + dy },
  });
});

renderer.setAnimationLoop(() => renderer.render(world, cam));
</script>`;
