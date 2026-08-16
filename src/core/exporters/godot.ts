import { baseFiles, text, type AssetPack } from "./common";
import { cameraVectors, deg, f, godotColor, layerPlacement, lookEuler, safeName } from "./layout";

/**
 * Godot 4 exporter: generates a text .tscn that reconstructs the scene with
 * one MeshInstance3D (PlaneMesh) per layer, plus camera, sun, fog and glow —
 * mirroring the three.js runtime's coordinate math (same y-up right-handed
 * space, so no handedness flip needed).
 */
export function godotFiles(pack: AssetPack): Record<string, Uint8Array> {
  const { scene, layers } = pack;
  const extIds: string[] = [];
  const subIds: string[] = [];
  const chunks: string[] = [];

  // --- ext resources: one per packed layer image ---
  layers.forEach((p, i) => {
    if (!p.path) return;
    const id = `${i + 1}`;
    extIds.push(id);
    chunks.push(`[ext_resource type="Texture2D" path="res://${p.path}" id="${id}"]`);
  });

  // --- environment (ambient, tonemap, fog, glow) ---
  const fx = scene.effects;
  subIds.push("Environment_1");
  const env: string[] = [`[sub_resource type="Environment" id="Environment_1"]`];
  env.push(`background_mode = 1`);
  env.push(`background_color = ${godotColor("#0A0C10")}`);
  env.push(`ambient_light_source = 2`);
  env.push(`ambient_light_color = ${godotColor(fx.ambient.color)}`);
  env.push(`ambient_light_energy = ${f(fx.ambient.intensity)}`);
  env.push(`tonemap_mode = 3`); // ACES, like the runtime
  if (fx.fog.enabled) {
    env.push(`fog_enabled = true`);
    env.push(`fog_mode = 1`); // depth fog with begin/end, matches three.js linear fog
    env.push(`fog_light_color = ${godotColor(fx.fog.color)}`);
    env.push(`fog_depth_begin = ${f(fx.fog.near)}`);
    env.push(`fog_depth_end = ${f(fx.fog.far)}`);
  }
  if (fx.bloom.enabled) {
    env.push(`glow_enabled = true`);
    env.push(`glow_intensity = ${f(fx.bloom.strength)}`);
    env.push(`glow_hdr_threshold = ${f(fx.bloom.threshold)}`);
  }
  chunks.push(env.join("\n"));

  // --- per-layer PlaneMesh + material ---
  layers.forEach((p, i) => {
    const meshId = `PlaneMesh_${i + 1}`;
    const matId = `Material_${i + 1}`;
    subIds.push(meshId, matId);
    const place = layerPlacement(p, scene.canvas);
    chunks.push(`[sub_resource type="PlaneMesh" id="${meshId}"]\nsize = Vector2(${f(place.width)}, ${f(place.height)})`);
    const mat: string[] = [`[sub_resource type="StandardMaterial3D" id="${matId}"]`];
    // alpha scissor for crisp pixel cutouts; alpha blend when opacity < 1
    if (p.layer.opacity < 0.999) {
      mat.push(`transparency = 1`);
      mat.push(`albedo_color = ${godotColor("#FFFFFF", p.layer.opacity)}`);
    } else {
      mat.push(`transparency = 2`);
      mat.push(`alpha_scissor_threshold = 0.1`);
    }
    mat.push(`cull_mode = 2`); // double-sided, like the runtime
    mat.push(`texture_filter = 0`); // nearest — crisp pixels
    if (!p.layer.lit) mat.push(`shading_mode = 0`); // unshaded
    if (p.path) mat.push(`albedo_texture = ExtResource("${i + 1}")`);
    chunks.push(mat.join("\n"));
  });

  const loadSteps = extIds.length + subIds.length + 1;
  const out: string[] = [`[gd_scene load_steps=${loadSteps} format=3]`, "", chunks.join("\n\n")];

  // --- root ---
  out.push("", `[node name="${safeName(scene.name, "PixelStage")}" type="Node3D"]`);

  // --- environment node ---
  out.push("", `[node name="WorldEnvironment" type="WorldEnvironment" parent="."]`, `environment = SubResource("Environment_1")`);

  // --- sun ---
  const sunPitch = -deg(fx.sun.elevation);
  const sunYaw = -deg(fx.sun.azimuth);
  out.push(
    "",
    `[node name="Sun" type="DirectionalLight3D" parent="."]`,
    `rotation = Vector3(${f(sunPitch)}, ${f(sunYaw)}, 0)`,
    `light_color = ${godotColor(fx.sun.color)}`,
    `light_energy = ${f(fx.sun.intensity)}`
  );

  // --- camera ---
  const { pos, target } = cameraVectors(scene.camera, scene.canvas);
  const { pitch, yaw } = lookEuler(pos, target);
  out.push(
    "",
    `[node name="Camera3D" type="Camera3D" parent="."]`,
    `position = Vector3(${f(pos.x)}, ${f(pos.y)}, ${f(pos.z)})`,
    `rotation = Vector3(${f(pitch)}, ${f(yaw)}, 0)`,
    `fov = ${f(scene.camera.fov)}`,
    `far = 20000.0`
  );

  // --- layers ---
  layers.forEach((p, i) => {
    const place = layerPlacement(p, scene.canvas);
    const nodeName = safeName(p.layer.name, `layer_${i + 1}`);
    const lines: string[] = [`[node name="${nodeName}" type="Node3D" parent="."]`];
    if (!p.layer.visible) lines.push(`visible = false`);
    lines.push(`position = Vector3(${f(place.position.x)}, ${f(place.position.y)}, ${f(place.position.z)})`);
    lines.push(
      `rotation = Vector3(${f(deg(place.eulerDeg.x))}, ${f(deg(place.eulerDeg.y))}, ${f(deg(place.eulerDeg.z))})`
    );
    lines.push(`scale = Vector3(${p.layer.flipX ? -1 : 1}, ${p.layer.flipY ? -1 : 1}, 1)`);
    const meshLines: string[] = [`[node name="Mesh" type="MeshInstance3D" parent="${nodeName}"]`];
    if (place.meshOffset.y !== 0) {
      meshLines.push(`position = Vector3(0, ${f(place.meshOffset.y)}, 0)`);
    }
    meshLines.push(`mesh = SubResource("PlaneMesh_${i + 1}")`);
    meshLines.push(`surface_material_override/0 = SubResource("Material_${i + 1}")`);
    out.push("", lines.join("\n"), "", meshLines.join("\n"));
  });

  return {
    ...baseFiles(pack),
    "scene.tscn": text(out.join("\n") + "\n"),
    "README-godot.txt": text(GODOT_README),
  };
}

const GODOT_README = `PixelStage → Godot 4
==================

Import steps
------------
1. Extract this zip into your Godot project's root folder
   (scene.tscn, scene.json and the assets/ folder should sit next to project.godot).
2. Open the project in Godot 4.x — the PNGs in assets/ are imported automatically.
3. Open scene.tscn. The scene is ready: layers, camera, sun, fog and glow included.

Notes
-----
- 1 px = 1 world unit. Scale the root node if your project uses meters.
- Materials already use Nearest filtering for crisp pixels. If textures still
  look blurry, check Project Settings > Rendering > Textures > Default Filter.
- Ground layers pivot at their near edge (mesh offset on the child node), so
  they recede toward the horizon exactly like in the PixelStage editor.
- Layers marked "unlit" in PixelStage use unshaded materials (sky, glows).
- Depth of field, film grain and particles are editor effects and are not part
  of the .tscn — recreate them with a Camera3D DOF or post-process if needed.
- scene.json is included as the source of truth for the raw scene data.
`;
