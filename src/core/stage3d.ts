import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { getTexture } from "./textures";
import { getAlphaAt } from "./bitmaps";
import type { Camera3D, CanvasSize, Layer, RenderEffects } from "./types";

/**
 * Stage3D — the HD-2D engine core (no React). Each layer is a textured plane
 * in a real 3D scene; a perspective camera supplies true parallax, occlusion
 * and foreshortening. Ground-oriented layers lie flat and recede to the
 * horizon (Octopath-style).
 *
 * The look is a fixed post stack (the "HD" in HD-2D):
 *   RenderPass → UnrealBloom (emissive glow) → Bokeh DOF → OutputPass (ACES
 *   tone mapping + sRGB) → Grade (vignette / saturation / animated grain).
 * On top of that the sun casts real PCF-soft shadows from lit billboards onto
 * the ground plane, and an optional particle system drifts motes through the
 * air volume around the focal plane.
 *
 * Coordinate contract: the STORE and UI use pixel coords with a top-left
 * origin and y DOWN; this class flips to three.js y-up internally
 * (worldY = canvas.height − uiY, worldZ = −depth).
 */

interface MeshRecord {
  mesh: THREE.Mesh;
  /** signature of fields that require a geometry/material rebuild */
  signature: string;
  layerId: string;
  /** kept for picking (alpha-mask lookup is keyed by id + src) */
  src: string;
  /** amber selection outline, child of mesh (editor only) */
  outline: THREE.LineSegments | null;
}

/** Film finishing, applied in display space after tone mapping. */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    vignette: { value: 0.4 },
    saturation: { value: 1.1 },
    grain: { value: 0.05 },
    time: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float vignette;
    uniform float saturation;
    uniform float grain;
    uniform float time;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      // saturation punch around luma
      float luma = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      c.rgb = mix(vec3(luma), c.rgb, saturation);
      // vignette: 0 = off, 1 = heavy corner falloff
      float d = length(vUv - 0.5) * 1.4142;
      c.rgb *= 1.0 - vignette * smoothstep(0.35, 1.0, d) * 0.85;
      // animated film grain
      float g = hash(vUv * vec2(1543.0, 927.0) + fract(time) * 7.31) - 0.5;
      c.rgb += g * grain;
      gl_FragColor = c;
    }
  `,
};

export class Stage3D {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private ambient = new THREE.AmbientLight();
  private sun = new THREE.DirectionalLight();
  private sunTarget = new THREE.Object3D();
  private meshes = new Map<string, MeshRecord>();
  private composer: EffectComposer | null = null;
  private bokeh: BokehPass | null = null;
  private bloom: UnrealBloomPass | null = null;
  private grade: ShaderPass | null = null;
  private composerW = 0;
  private composerH = 0;
  private grid: THREE.LineSegments | null = null;
  private gridSignature = "";
  private particles: THREE.Points | null = null;
  private particleSignature = "";
  private particleBase: Float32Array = new Float32Array(0);
  private particlePhase: Float32Array = new Float32Array(0);
  private particleSpeed = 1;
  private particleTexture: THREE.Texture | null = null;
  private readonly born = performance.now();
  private size: CanvasSize;
  private canvas: HTMLCanvasElement;
  private raycaster = new THREE.Raycaster();
  private selection = new Set<string>();
  onContextLost?: () => void;

  constructor(canvas: HTMLCanvasElement, size: CanvasSize) {
    this.canvas = canvas;
    this.size = { ...size };
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    // ACES + exposure: the filmic highlight rolloff is half of the Octopath look
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.camera = new THREE.PerspectiveCamera(40, 1, 1, 20000);
    this.scene.add(this.ambient);
    this.scene.add(this.sun);
    this.scene.add(this.sunTarget);
    this.sun.target = this.sunTarget;
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0003;
    this.sun.shadow.normalBias = 2;
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.onContextLost?.();
    });
  }

  setSceneSize(size: CanvasSize) {
    this.size = { ...size };
    // shadow frustum covers the whole stage + layer depth budget
    const s = Math.max(size.width, size.height) * 1.35;
    const cam = this.sun.shadow.camera;
    cam.left = -s;
    cam.right = s;
    cam.top = s;
    cam.bottom = -s;
    cam.near = 100;
    cam.far = 5000;
    cam.updateProjectionMatrix();
    this.sunTarget.position.set(size.width / 2, size.height / 2, 0);
  }

  resize(w: number, h: number, dpr: number) {
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.ensureComposer(w, h, dpr);
  }

  setLayers(layers: Layer[]) {
    const seen = new Set<string>();
    for (const layer of layers) {
      if (!layer.visible) continue;
      seen.add(layer.id);
      const tex = getTexture(layer.id, layer.src);
      const signature = `${layer.src}|${layer.scale}|${layer.orientation}|${layer.lit}|${tex ? "ok" : "miss"}`;
      let rec = this.meshes.get(layer.id);
      if (!rec || rec.signature !== signature) {
        if (rec) this.destroyMesh(rec);
        rec = this.buildMesh(layer, tex, signature);
        this.meshes.set(layer.id, rec);
        this.scene.add(rec.mesh);
      }
      this.positionMesh(rec.mesh, layer, tex);
      this.syncOutline(rec, this.selection.has(layer.id));
    }
    for (const [id, rec] of this.meshes) {
      if (!seen.has(id)) {
        this.scene.remove(rec.mesh);
        this.destroyMesh(rec);
        this.meshes.delete(id);
      }
    }
  }

  setCamera(cam: Camera3D) {
    const H = this.size.height;
    this.camera.position.set(cam.position.x, H - cam.position.y, cam.position.z);
    this.camera.lookAt(cam.target.x, H - cam.target.y, -cam.target.z);
    if (this.camera.fov !== cam.fov) {
      this.camera.fov = cam.fov;
      this.camera.updateProjectionMatrix();
    }
  }

  setEffects(fx: RenderEffects) {
    this.ambient.color.set(fx.ambient.color);
    this.ambient.intensity = fx.ambient.intensity;
    this.sun.color.set(fx.sun.color);
    this.sun.intensity = fx.sun.intensity;
    const az = (fx.sun.azimuth * Math.PI) / 180;
    const el = (fx.sun.elevation * Math.PI) / 180;
    // light sits far along its direction so shadows stay (near-)orthographic
    const dir = new THREE.Vector3(
      Math.cos(el) * Math.sin(az),
      Math.sin(el),
      Math.cos(el) * Math.cos(az)
    );
    this.sun.position.copy(this.sunTarget.position).addScaledVector(dir, 2200);
    this.scene.fog = fx.fog.enabled
      ? new THREE.Fog(new THREE.Color(fx.fog.color), fx.fog.near, fx.fog.far)
      : null;

    const w = this.canvas.width || 2;
    const h = this.canvas.height || 2;
    this.ensureComposer(w, h, window.devicePixelRatio || 1);

    if (this.bloom) {
      this.bloom.enabled = fx.bloom.enabled;
      this.bloom.strength = fx.bloom.strength;
      this.bloom.threshold = fx.bloom.threshold;
    }
    if (this.bokeh) {
      this.bokeh.enabled = fx.dof.enabled;
      // focus: distance from camera to the point at the focused depth on the view axis
      const focusPoint = new THREE.Vector3(
        this.camera.position.x,
        this.camera.position.y,
        -fx.dof.focus
      );
      const dist = this.camera.position.distanceTo(focusPoint);
      (this.bokeh.uniforms as Record<string, { value: number }>).focus.value = dist;
      (this.bokeh.uniforms as Record<string, { value: number }>).aperture.value =
        fx.dof.aperture * 0.000025;
      (this.bokeh.uniforms as Record<string, { value: number }>).maxblur.value = 0.007;
    }
    if (this.grade) {
      this.grade.uniforms.vignette.value = fx.grade.vignette;
      this.grade.uniforms.saturation.value = fx.grade.saturation;
      this.grade.uniforms.grain.value = fx.grade.grain;
    }
    this.syncParticles(fx.particles);
  }

  setGrid(visible: boolean, step: number) {
    const sig = `${visible}|${step}|${this.size.width}x${this.size.height}`;
    if (sig === this.gridSignature) return;
    this.gridSignature = sig;
    if (this.grid) {
      this.scene.remove(this.grid);
      this.grid.geometry.dispose();
      (this.grid.material as THREE.Material).dispose();
      this.grid = null;
    }
    if (!visible || step <= 0) return;
    const { width: W, height: H } = this.size;
    const pts: number[] = [];
    for (let x = 0; x <= W; x += step) pts.push(x, H, 0, x, 0, 0);
    for (let y = 0; y <= H; y += step) pts.push(0, H - y, 0, W, H - y, 0);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    this.grid = new THREE.LineSegments(
      geo,
      new THREE.LineBasicMaterial({ color: 0x3a4258, transparent: true, opacity: 0.5 })
    );
    this.scene.add(this.grid);
  }

  /* --------------------------- editor interaction -------------------------- */

  /** Mark layers as selected; each gets an always-on-top amber outline. */
  setSelection(ids: string[]) {
    const next = new Set(ids);
    if (next.size === this.selection.size && [...next].every((i) => this.selection.has(i))) {
      return;
    }
    this.selection = next;
    for (const [id, rec] of this.meshes) this.syncOutline(rec, next.has(id));
  }

  /**
   * Front-most layer whose texture is non-transparent at the picked pixel.
   * nx/ny are NDC (-1..1). Transparent texels fall through to layers behind.
   */
  pickLayer(nx: number, ny: number): string | null {
    this.raycaster.setFromCamera(new THREE.Vector2(nx, ny), this.camera);
    const recs = [...this.meshes.values()];
    const byMesh = new Map(recs.map((r) => [r.mesh, r] as const));
    const hits = this.raycaster.intersectObjects([...byMesh.keys()], false);
    for (const h of hits) {
      const rec = byMesh.get(h.object as THREE.Mesh);
      if (!rec || !h.uv) continue;
      const a = getAlphaAt(rec.layerId, rec.src, h.uv.x, h.uv.y);
      // null = bitmap not decoded yet (placeholder mesh) → treat as opaque
      if (a === null || a > 10) return rec.layerId;
    }
    return null;
  }

  /**
   * Intersect the pointer ray with a world-space plane (point + normal),
   * for 1:1-feel layer dragging. Returns null when the ray is parallel.
   */
  rayPlane(
    nx: number,
    ny: number,
    px: number,
    py: number,
    pz: number,
    ax: number,
    ay: number,
    az: number
  ): { x: number; y: number; z: number } | null {
    this.raycaster.setFromCamera(new THREE.Vector2(nx, ny), this.camera);
    const n = new THREE.Vector3(ax, ay, az).normalize();
    const plane = new THREE.Plane(n, -n.dot(new THREE.Vector3(px, py, pz)));
    const out = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(plane, out)
      ? { x: out.x, y: out.y, z: out.z }
      : null;
  }

  render() {
    const t = (performance.now() - this.born) / 1000;
    if (this.grade) this.grade.uniforms.time.value = t;
    this.animateParticles(t);
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  dispose() {
    for (const rec of this.meshes.values()) this.destroyMesh(rec);
    this.meshes.clear();
    this.destroyParticles();
    this.particleTexture?.dispose();
    this.particleTexture = null;
    this.composer?.dispose();
    this.composer = null;
    this.bokeh = null;
    this.bloom = null;
    this.grade = null;
    this.renderer.dispose();
  }

  /* ------------------------------- internals ------------------------------ */

  private ensureComposer(w: number, h: number, dpr: number) {
    // full-res keeps the pixel art crisp; bloom downsamples internally
    const cw = Math.max(2, w);
    const ch = Math.max(2, h);
    if (!this.composer) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(cw, ch), 0.55, 0.3, 0.55);
      this.composer.addPass(this.bloom);
      this.bokeh = new BokehPass(this.scene, this.camera, {
        focus: 800,
        aperture: 0.00001,
        maxblur: 0.007,
      });
      this.bokeh.enabled = false;
      this.composer.addPass(this.bokeh);
      this.composer.addPass(new OutputPass());
      this.grade = new ShaderPass(GradeShader);
      this.composer.addPass(this.grade);
      this.composerW = 0;
    }
    if (this.composerW !== cw || this.composerH !== ch) {
      this.composer.setSize(cw, ch);
      this.composer.setPixelRatio(Math.min(dpr, 1.75));
      this.composerW = cw;
      this.composerH = ch;
    }
  }

  private buildMesh(
    layer: Layer,
    tex: { texture: THREE.Texture; width: number; height: number } | null,
    signature: string
  ): MeshRecord {
    const w = (tex?.width ?? this.size.width) * layer.scale;
    const h = (tex?.height ?? this.size.height) * layer.scale;
    const geo = new THREE.PlaneGeometry(w, h);
    let mat: THREE.Material;
    if (!tex) {
      // missing asset: magenta wireframe placeholder (design.md §2)
      mat = new THREE.MeshBasicMaterial({ color: 0xe56cf0, wireframe: true });
    } else {
      const params = {
        map: tex.texture,
        transparent: true,
        alphaTest: 0.01,
        side: THREE.DoubleSide,
      };
      mat = layer.lit
        ? new THREE.MeshLambertMaterial(params)
        : new THREE.MeshBasicMaterial(params);
    }
    if (layer.orientation === "ground") {
      geo.translate(0, -h / 2, 0); // pivot = near edge
    }
    const mesh = new THREE.Mesh(geo, mat);
    if (layer.orientation === "ground") {
      mesh.rotation.x = Math.PI / 2; // lay flat, receding to the horizon
      mesh.receiveShadow = true; // billboard shadows land here
    } else if (layer.lit && tex) {
      mesh.receiveShadow = true;
      // castShadow decided per-frame in positionMesh (depth-dependent)
    }
    return { mesh, signature, layerId: layer.id, src: layer.src, outline: null };
  }

  private positionMesh(
    mesh: THREE.Mesh,
    layer: Layer,
    tex: { width: number; height: number } | null
  ) {
    const w = (tex?.width ?? this.size.width) * layer.scale;
    const h = (tex?.height ?? this.size.height) * layer.scale;
    const H = this.size.height;
    // appearance props that don't need a rebuild — applied every frame
    (mesh.material as THREE.Material).opacity = layer.opacity;
    mesh.scale.set(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1, 1);
    mesh.rotation.z = (layer.rotation * Math.PI) / 180;
    if (layer.orientation === "ground") {
      mesh.position.set(layer.offsetX + w / 2, H - layer.offsetY, -layer.depth);
    } else {
      mesh.position.set(layer.offsetX + w / 2, H - layer.offsetY - h / 2, -layer.depth);
      // Only props near the focal plane throw shadows. Background cards stand
      // between the sun and the ground's far half — if they cast, their shadow
      // blankets the entire floor in black.
      mesh.castShadow = layer.lit && Math.abs(layer.depth) <= 120;
    }
  }

  private syncOutline(rec: MeshRecord, selected: boolean) {
    if (selected === (rec.outline !== null)) return;
    if (selected) {
      // EdgesGeometry of a 1-segment plane = its 4 borders; inherits the
      // ground pivot translate and follows flip/rotation as a child
      const geo = new THREE.EdgesGeometry(rec.mesh.geometry);
      const mat = new THREE.LineBasicMaterial({
        color: 0xffd98a,
        depthTest: false,
        transparent: true,
        opacity: 1,
      });
      const line = new THREE.LineSegments(geo, mat);
      line.renderOrder = 999;
      // slight outset so the stroke doesn't z-fight the sprite's own border pixels
      line.scale.set(1.015, 1.015, 1);
      rec.mesh.add(line);
      rec.outline = line;
    } else if (rec.outline) {
      rec.mesh.remove(rec.outline);
      rec.outline.geometry.dispose();
      (rec.outline.material as THREE.Material).dispose();
      rec.outline = null;
    }
  }

  private destroyMesh(rec: MeshRecord) {
    // NOTE: must remove from the scene, not just dispose — a disposed material
    // still renders (three re-uploads it), leaving a ghost wireframe twin behind
    this.scene.remove(rec.mesh);
    rec.mesh.geometry.dispose();
    (rec.mesh.material as THREE.Material).dispose();
  }

  /* ------------------------------- particles ------------------------------ */

  private getParticleTexture(): THREE.Texture {
    if (this.particleTexture) return this.particleTexture;
    const c = document.createElement("canvas");
    c.width = 16;
    c.height = 16;
    const g = c.getContext("2d")!;
    // pixelated soft dot: faint halo, mid ring, hot core
    g.fillStyle = "rgba(255,255,255,0.18)";
    g.fillRect(2, 2, 12, 12);
    g.fillStyle = "rgba(255,255,255,0.55)";
    g.fillRect(4, 4, 8, 8);
    g.fillStyle = "#ffffff";
    g.fillRect(6, 6, 4, 4);
    const tex = new THREE.Texture(c);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    this.particleTexture = tex;
    return tex;
  }

  private syncParticles(p: RenderEffects["particles"]) {
    this.particleSpeed = p.speed;
    const sig = `${p.enabled}|${p.color}|${p.count}|${p.size}|${this.size.width}x${this.size.height}`;
    if (sig === this.particleSignature) return;
    this.particleSignature = sig;
    this.destroyParticles();
    if (!p.enabled || p.count <= 0) return;

    const { width: W, height: H } = this.size;
    const n = Math.min(600, Math.round(p.count));
    const pos = new Float32Array(n * 3);
    this.particleBase = new Float32Array(n * 3);
    this.particlePhase = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = -W * 0.08 + Math.random() * W * 1.16;
      const y = Math.random() * H * 1.05;
      const z = -450 + Math.random() * 1000; // air volume around the focal plane
      this.particleBase.set([x, y, z], i * 3);
      this.particlePhase[i] = Math.random();
      pos.set([x, y, z], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      map: this.getParticleTexture(),
      color: new THREE.Color(p.color),
      // sprite is 16px with a 4px core: world size 4× → core reads as `size` px
      size: Math.max(1, p.size) * 4,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.particles = new THREE.Points(geo, mat);
    this.particles.frustumCulled = false;
    this.scene.add(this.particles);
  }

  private animateParticles(t: number) {
    if (!this.particles) return;
    const H = this.size.height;
    const range = H * 1.05;
    const attr = this.particles.geometry.getAttribute("position") as THREE.BufferAttribute;
    const n = this.particlePhase.length;
    const rise = 14 * this.particleSpeed;
    for (let i = 0; i < n; i++) {
      const ph = this.particlePhase[i];
      const bx = this.particleBase[i * 3];
      const by = this.particleBase[i * 3 + 1];
      // slow rise with wraparound + gentle horizontal sway, per-mote phase
      const y = (by + t * rise + ph * range) % range;
      const x = bx + Math.sin(t * 0.6 + ph * Math.PI * 2) * 12;
      attr.setXYZ(i, x, y, this.particleBase[i * 3 + 2]);
    }
    attr.needsUpdate = true;
  }

  private destroyParticles() {
    if (!this.particles) return;
    this.scene.remove(this.particles);
    this.particles.geometry.dispose();
    (this.particles.material as THREE.Material).dispose();
    this.particles = null;
  }
}
