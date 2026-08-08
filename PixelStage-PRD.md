# PixelStage — PRD & 实施工作流

> **HD-2D 像素视差场景编辑器** · 给 Kimi Code 的执行蓝图
> 版本 v2.0 · 2026-08-05 · v1（纯 2D factorX/factorY）已按本文档 v1.1 版执行完毕；v2 完成 three.js 引擎重建 + Electron 桌面化。本文档已更新为 v2 现实（实施工作流 §8 保留为历史记录）。

---

## 0. 30 秒看懂这个项目

**是什么**：一个开源工具（Web + Windows 桌面应用）。独立像素游戏开发者把分层素材（天空/远山/中景/前景/地面）导进来，把每层放到**真实 3D 深度**——面向镜头的广告牌或八方旅人式地面平面——打好灯光、景深和雾，拖动**真实透视镜头**实时预览，最后一键导出一个 JSON——游戏端用一段 three.js runtime（CDN import map，免构建）就能原样复现这个场景。

**核心闭环**：
```
导入图层 → 摆深度（广告牌 / 地面平面）→ 灯光 + 景深 + 雾
→ 透视镜头环绕预览 → 导出 scene.json v2 → 游戏 runtime 复现
```

**为什么值得做（简历角度，已实测）**：
- GitHub 官方接口实测：`2.5D pixel scene editor` = **0 个仓库**；`parallax editor pixel` = 仅 2 个 0-star 废弃品。对比：图书管理系统 6,239 个仓库、学生管理系统 10,733 个。
- 定位一句话：**"HD-2D for the rest of us"**。逸剑风云决/八方旅人用 UE4 真 3D 管线做 HD-2D（制作人自学 UE4 五年、三次资金断裂）；PixelStage 用 three.js 给独立开发者同样的透视纵深、地面平面、景深——但交付物只是一个 JSON 和一段免构建的 runtime。
- v1→v2 演进本身就是面试故事：先用"一次乘法"的 2D 视差跑通闭环，再把引擎整体重建为真透视——**先闭环，后升级**。

**首个用户就是作者本人**（正在开发 2.5D 像素游戏）——"解决自己的真实痛点"是面试时最有说服力的项目叙事。

---

## 1. 定位与边界

| 做 ✅ | 不做 ❌ | 理由 |
|---|---|---|
| 多层图片在真实 3D 深度上编排 | 瓦片地图编辑 | Tiled / LDtk 的领地 |
| 每层 depth/orientation/lit/缩放/偏移 | 像素画绘制 | Aseprite 的领地 |
| 透视镜头实时预览 + 运镜路径 | 完整 3D 游戏引擎 | 我们是工具，不是引擎 |
| 灯光（环境光+方向光）、DOF、雾 | PBR / 体素 / 全 3D 建模 | 轻量 HD-2D，不是 UE4 管线 |
| 导出引擎无关 JSON + three.js runtime | 游戏引擎本体 | 工具边界 |
| 本地运行 + Electron 桌面应用（无账号无后端） | 云同步/协作 | 本地优先，合规省心 |

---

## 2. 用户与核心场景

**目标用户**：用 Electron / Phaser / Godot / Unity-2D 做 2.5D 像素游戏的独立开发者。

**核心用户故事**：
> 我在做一款逸剑风云决风格的 2.5D 像素游戏。我画了 5 层场景图（天空、远山、中景树林、前景草叶、地面）。我想要八方旅人那种"地面退到地平线、前景模糊框住画面"的镜头感。现在我只能在游戏里手写 3D 场景、摆平面、调相机——摆一次要半天。
> **用 PixelStage**：拖 5 张图进来 → 每层设 depth，地面层切到 `ground` → 开雾和 DOF，环绕镜头立刻看到效果 → 导出 JSON + runtime，一次到位。

**次级场景**：把做好的场景发画廊页给别人"Open in Editor"直接打开（分享即传播）；桌面端双击 `.pixelstage.json` 直接打开工程。

---

## 3. 功能规格（v2，全部已实现）

### F1 图层管理
- 导入：拖拽 PNG/JPG 到画布 或 点击"导入图层"文件选择（多选；≤4096px / 8MB）
- 图层列表：显示缩略图+名称+深度徽标；支持拖动排序（index 0 = 最远，面板前向优先显示）；眼睛图标切换显隐；双击重命名；删除（带 4 秒撤销 toast）
- **验收**：导入 4 张 PNG，排序/显隐/重命名/删除全部生效，画布即时反映

### F2 深度模型（每层）
- **depth**：滑杆 −400…+800（步进 10）+ 数字输入框双绑定。`0` = 焦平面（像素 1:1）；`>0` 更远；`<0` 在焦平面之前（前景遮挡，开 DOF 会糊）
- **orientation**：`vertical`（面向镜头的广告牌）/ `ground`（放平退向地平线的地面平面）
- **lit**：受场景灯光着色 / 全亮（天空、发光叠加层）
- scale：0.1–4.0；offsetX / offsetY：整数像素（−4096…4096）
- 检查器里实时显示**视差读数**：`depth +350 → parallax ×0.68`（即透视系数 `D / (D + depth)`，教学相长）
- **验收**：改 depth，画布该层的视差速度与透视缩放立即可感变化；读数与画面一致

### F3 透视镜头
- 画布内按住拖动 = 平移镜头（cursor grab/grabbing，焦平面 1:1 手感），HUD 实时显示
- 滚轮 = 推拉变焦，限制在焦距的 40%–400%
- 右键 / Alt 拖动 = 环绕（偏航 + 俯仰 ±60°，编辑器模式）
- `R` = 复位默认取景；空格 = 播放运镜路径（sweep 平移扫 / orbit ±10° 环绕 / dolly ±15% 推拉），手动拖动暂停 3 秒后恢复
- **验收**：拖动镜头，各层按深度产生明显不同的透视位移；路径播放平滑 60fps

### F4 灯光氛围（每场景）
- DOF：开关 + 焦点深度（−400…+800）+ 光圈（0–1），BokehPass 半分辨率合成
- 雾：开关 + 颜色 + near/far（0–4000）
- 环境光：颜色 + 强度（0–2）；方向光（太阳）：颜色 + 强度（0–3）+ 方位角/仰角
- 未选中任何图层时出现在检查器里；随 scene.json 导出
- **验收**：开 DOF 后焦平面清晰、前景层模糊；lit/unlit 层受光差异明显

### F5 撤销/重做
- 快照式历史（容量 100）：Ctrl/⌘Z 撤销，Ctrl/⌘⇧Z / Ctrl/⌘Y 重做
- 滑杆拖动按 `coalesceKey` 合并（800ms 窗口）——一次拖动 = 一步撤销
- **验收**：连续拖 20 次滑杆，一次 Ctrl+Z 回到拖动前

### F6 场景导出
- 导出 `scene.json`（schema v2，见 §4.3）下载到本地
- 导出模态框：JSON 预览（带语法高亮）+ 复制按钮 + 下载按钮 + **runtime.html** three.js 代码片段（§4.4）
- 内嵌开关：开 = `src` 为 base64 dataURL 单文件；关 = 导出**真实 zip**（scene.json + assets/*.png，文件真的在压缩包里，`src/core/zip.ts`）
- **验收**：导出的 JSON 用 §4.4 的 runtime 能复现**像素级一致**的画面（闭环证明，这是项目的灵魂）；zip 解压后 assets 齐全

### F7 持久化与桌面应用
- 参数（图层/深度/灯光/镜头）→ localStorage，防抖自动保存，顶栏显示保存状态；图片 → IndexedDB，规避 localStorage 5MB 上限
- 项目文件：`.pixelstage.json`（含 base64 图片）导出/导入往返；v1 存档静默迁移
- **Electron 桌面应用**（Windows）：渲染进程完全沙箱化（无 Node），preload 桥接 IPC；原生保存/打开对话框；Ctrl+S / Ctrl+Shift+S / Ctrl+O；最近文件列表；`.pixelstage.json` 文件关联（双击打开 + 第二实例转发）；`npm run dist` 产出 NSIS 安装包 + 免安装便携 exe；Web 版通过 `src/core/platform.ts` 平台缝继续工作
- **验收**：刷新页面场景完整恢复；导入导出往返无损；桌面端双击工程文件打开

### 后续候选（本期不做，架构预留接口）
- 测试角色精灵：一个小人在图层之间走动，验证前景遮挡（数据模型已天然支持，角色=插入某两层之间的特殊层）
- 镜头关键帧路径编辑；无限平铺（tile）层

---

## 4. 核心技术方案

### 4.1 技术栈与决策理由（面试按这个讲）

| 选择 | 理由 | 为什么不选替代 |
|---|---|---|
| React 19 + TS + Vite | 简历主流栈，组件化适合面板型工具 | Vue 也可以，但岗位 React 更多 |
| Tailwind v3.4 + shadcn/ui | 快速搭出专业质感，深色主题成熟 | 手写 CSS 慢且丑 |
| **three.js（裸用，不套 R3F）** | 真实透视相机/灯光/DOF；渲染循环保持命令式，与导出的 runtime 逐行对应，**面试能逐行讲** | Canvas 2D 做不了透视（v1 的命门）；R3F 在这里只增重量不增值 |
| Zustand + 快照历史 | 编辑器=单文档状态树；快照让撤销/重做约 40 行 | 命令模式要侵入每个 action；Redux 太重 |
| localStorage + IndexedDB | 本地优先零后端，合规省心 | 后端/账号对工具型产品是负资产 |
| Electron（沙箱 + preload IPC） | 真桌面应用：原生对话框、工程文件、安装包 | v1 的 bat + Chrome `--app` 套壳只是"穿风衣的浏览器" |
| Web + 桌面双形态，`platform.ts` 平台缝 | 所有文件/系统交互走一个接口，浏览器自动降级为下载/文件选择 | 两套代码路径会腐烂 |

### 4.2 深度模型与透视视差（项目的技术核心）

**模型**：每层是 3D 场景里的贴图平面，透视相机提供真实视差、遮挡和近大远小。

**透视系数**：深度为 `depth` 的层，在屏幕上按 `D / (D + depth)` 位移/缩放，`D = focalDistance(canvas, fov)`（960×540 / 40° FOV 下 ≈ 742px）。

**depth 语义表**（写进文档页，也是面试答案）：

| depth | 读作 | 典型用途 |
|---|---|---|
| −400…−100 | 焦平面之前 | 前景遮挡物、草叶框边（开 DOF 会糊） |
| 0 | 焦平面（像素 1:1） | 角色行走的地面、主角道具 |
| +100…+300 | 中景 | 树、立面、柱子 |
| +400…+800 | 远景 | 山脉、天际线、天空（放大补偿透视缩小） |

**v1→v2 迁移**：v1 按 factorX 平移 `pos = offset − camera × factor`；透视相机在距离 D 处，深度 z 的广告牌屏幕位移为 `(D−z)/D`。解 `(D−z)/D = f` 得 `z = D·(1−f)`。factorY 无 3D 等价物，丢弃。旧文件打开时自动迁移。

**引擎要点（`src/core/stage3d.ts`）**：
- 每层一个 `THREE.Mesh`：`orientation: "ground"` 时绕 X 放平 90°（枢轴=近边缘），退向地平线；`lit` 用 Lambert 材质，unlit 用 Basic 全亮
- UI 坐标 y 向下，引擎内部翻转为 three.js y 向上（`worldY = canvas.height − uiY`，`worldZ = −depth`）
- 纹理缓存 + `NearestFilter`（像素风不模糊，**不可协商**）
- DOF 用 EffectComposer + BokehPass，半分辨率合成（模糊掩盖放大，这是性能关键路径）
- rAF 循环仅在画布可见时运行（IntersectionObserver），切后台暂停；监听 `webglcontextlost` + ErrorBoundary 恢复
- 性能预算：10 层 960×540 @60fps 轻松

### 4.3 场景 JSON Schema v2（导出格式，引擎无关）

```json
{
  "version": 2,
  "name": "Goldenhollow Village",
  "canvas": { "width": 960, "height": 540 },
  "camera": {
    "position": { "x": 480, "y": 270, "z": 742 },
    "target":   { "x": 480, "y": 270, "z": 0 },
    "fov": 40
  },
  "effects": {
    "dof":     { "enabled": true, "focus": 0, "aperture": 0.35 },
    "fog":     { "enabled": true, "color": "#9E6B58", "near": 900, "far": 2600 },
    "ambient": { "color": "#9A8AC0", "intensity": 0.85 },
    "sun":     { "color": "#FFB648", "intensity": 1.15, "azimuth": 60, "elevation": 35 }
  },
  "layers": [
    { "id": "sky",   "name": "sky",         "src": "assets/sky.png",
      "depth": 700,  "orientation": "vertical", "lit": false,
      "scale": 1.94, "offsetX": -437, "offsetY": -246, "visible": true },
    { "id": "gate",  "name": "shrine gate", "src": "assets/shrine-gate.png",
      "depth": 0,    "orientation": "vertical", "lit": true,
      "scale": 1,    "offsetX": 0,    "offsetY": 0,    "visible": true },
    { "id": "path",  "name": "dirt path",   "src": "assets/dirt-path.png",
      "depth": -100, "orientation": "ground",   "lit": true,
      "scale": 1.15, "offsetX": -72,  "offsetY": 540,  "visible": true }
  ]
}
```
`layers` index 0 = 最远（先画）。`src` 为相对路径（zip 导出时）或 dataURL（内嵌时）。

### 4.4 最小 runtime（闭环证明，放进文档页和导出模态框）

runtime 是一个 **runtime.html**：three.js 通过 CDN import map 引入，**免构建**。核心逻辑（`src/core/scene.ts` 的 `RUNTIME_SNIPPET`，与编辑器引擎逐行对应）：

```html
<script type="importmap">
  { "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js" } }
</script>
<script type="module">
import * as THREE from "three";
const scene = await (await fetch("./scene.json")).json();
// 每层：TextureLoader → NearestFilter → PlaneGeometry →
//   lit ? MeshLambertMaterial : MeshBasicMaterial →
//   ground ? rotation.x = π/2（放平退向地平线）: 广告牌 →
//   mesh.position.set(offsetX + w/2, H − offsetY − h/2, −depth)
// 灯光：AmbientLight + DirectionalLight（读 scene.effects）
// 相机：PerspectiveCamera(fov) + lookAt；UI 坐标 y 向下 → three y 向上翻转
renderer.setAnimationLoop(() => renderer.render(world, cam));
</script>
```

### 4.5 状态模型（Zustand store 形状）

```ts
type Layer = {
  id: string; name: string; src: string;        // src = dataURL 或路径
  offsetX: number; offsetY: number;
  depth: number;                                 // 0 = 焦平面，>0 更远，<0 更近
  scale: number;
  orientation: "vertical" | "ground";            // 广告牌 / 地面平面
  lit: boolean;                                  // 受光 / 全亮
  visible: boolean;
};
type SceneStore = {
  name: string;
  canvasSize: { width: number; height: number };
  camera: Camera3D;                // { position, target, fov }
  effects: RenderEffects;          // { dof, fog, ambient, sun }
  layers: Layer[];                 // index 0 = 最远
  selectedId: string | null;
  playing: boolean; pathPreset: "sweep" | "orbit" | "dolly";
  filePath: string | null; dirty: boolean;   // Electron 工程文件工作流
  past: HistoryEntry[]; future: HistoryEntry[];  // 快照撤销/重做
  undo(): void; redo(): void;
  addFiles(files: File[]): Promise<ImportResult>;
  removeLayer(id: string): void;
  reorderLayer(id: string, to: number): void;
  updateLayer(id: string, patch: Partial<Layer>, opts?: { coalesceKey: string }): void;
  setCamera(cam: Camera3D, opts?: { transient: boolean }): void;
  setEffects(patch: EffectsPatch, opts?: { coalesceKey: string }): void;
  toJSON(): SceneFile;             // §4.3 结构
  loadJSON(raw: unknown): void;    // v1 自动迁移
};
```
纯函数核心（`migrateScene`、`serializeScene`、`cameraPath`、`focalDistance`、`depthFromFactor`）放 `src/core/`，不依赖 React，配 vitest 单测——**这是"代码可讲解性"的兑现**。

---

## 5. UI/UX 设计规范（浓缩自完整设计稿，见附件 design/）

**设计原则**：dev-tool 的壳，像素游戏的魂。界面是 Linear/VSCode 级的锐利专业感；点缀（像素字体、抖动纹理、琥珀色）是游戏温度。深色低饱和，**拒绝蓝紫渐变**。

### 5.1 色彩 tokens（写进 Tailwind config / CSS 变量）

| Token | Hex | 用途 |
|---|---|---|
| `--bg-0` | `#0A0C10` | 页面底、编辑器空区 |
| `--bg-1` | `#0F1219` | 卡片、代码块 |
| `--bg-2` | `#151926` | 面板（侧栏、检查器、顶栏） |
| `--bg-3` | `#1C2231` | hover/选中行 |
| `--border` | `#232B3B` | 1px 分隔线 |
| `--text-1` | `#EDEFF5` | 主文本 |
| `--text-2` | `#A4ADBF` | 次文本 |
| `--text-3` | `#5E6880` | 弱文本/占位 |
| `--amber` | `#FFB648` | **主强调**：CTA、选中、激活（八方旅人的烛光暖） |
| `--teal` | `#4FD1B5` | 次强调：数据、读数、链接 |
| `--danger` | `#F27070` | 删除/错误 |
| `--success` | `#62D189` | 自动保存点 |

### 5.2 字体（Google Fonts）
- **Silkscreen**（像素体 400/700）：logo、大标题、`// LABEL` 眉题、大数字——**绝不用于正文**
- **Inter**（400–700）：全部界面文本
- **JetBrains Mono**（400/500/700 + `tnum`）：**所有数字**、参数、JSON、状态栏。这个数字产品里数字是一等公民

### 5.3 编辑器布局（产品本体，三栏）

```
┌────────────────────────────────────────────────────────────────┐
│ TopBar 48px: logo · 项目名 · 画布尺寸预设 · ●已保存12:03 · 导出      │
├────────────┬────────────────────────────────────┬──────────────┤
│ 图层列表    │                                    │ 属性检查器    │
│ 272px      │         WebGL 视口                  │ 304px        │
│ ┌────────┐ │  （拖=平移 · 滚轮=推拉 · 右键=环绕） │ depth  +350  │
│ │▓front ▓│ │   ┌──────────────────────┐        │ orient  vert │
│ │ path   │ │   │   960 × 540 3D 舞台   │        │ lit     on   │
│ │ gate   │ │   │   （真透视 · 灯光·雾）  │        │ scale   1.00 │
│ │ mid    │ │   └──────────────────────┘        │ offset  0, 0 │
│ │ sky    │ │   HUD: camera · zoom 100%         │ ──────────  │
│ └────────┘ │   [SWEEP·ORBIT·DOLLY] 空格播放     │ depth +350 → │
│ [+ 导入图层]│                                    │ parallax×0.68│
├────────────┴────────────────────────────────────┴──────────────┤
│ StatusBar 28px: zoom · 鼠标坐标 · 6 层 · 存储 · ?快捷键           │
└────────────────────────────────────────────────────────────────┘
```

### 5.4 关键视觉规则
- 圆角 ≤6px（像素=直角美学）；主 CTA 用 6px 阶梯缺角 clip-path（pixel-notch）
- 透明区域一律 8px 棋盘格（`#151926`/`#1C2231`）
- 选中态 = 琥珀 1px 描边或左侧 2px 琥珀条
- 空状态：棋盘格舞台 + 像素插画 + 「拖图片进来，或打开示例场景」
- 首次进入有 4 步双语新手引导（可重放）

### 5.5 动效（克制）
- 进场：`opacity 0→1, translateY 24→0`，子元素 stagger 80ms
- 微交互 120–180ms；面板/弹窗 220–300ms
- `prefers-reduced-motion`：关运镜自动播放、关闪烁光标
- 营销页平滑滚动（Lenis）和 GSAP 滚动叙事 = **P2 花活**，砍了不影响产品价值

---

## 6. 页面结构（4 页 + 桌面应用，按优先级排序）

| 优先级 | 路由 | 页面 | 内容 |
|---|---|---|---|
| **P0** | `/editor` | 编辑器 | §5.3 三栏布局，F1–F7 全部功能。**产品本体，先做** |
| **P1** | `/` | 落地页 | ① Hero=**真实可拖的 HD-2D demo**（复用编辑器同一个 `StageCanvas3D` + 程序生成示例场景，"demo 即产品"）② 产品故事：1% 的路（UE4 HD-2D）vs 99% 的路 ③ 三步工作流 ④ 六宫格特性 ⑤ JSON+runtime 代码左右分栏 ⑥ CTA 进编辑器 |
| **P2** | `/guide` | 文档 | 快速上手、depth 语义表（§4.2）、JSON schema 参考表、runtime 代码、FAQ |
| **P2** | `/gallery` | 场景画廊 | 3 个内置示例场景卡片（各自可拖动的迷你 HD-2D 预览）、「在编辑器中打开」、「下载 JSON」 |
| **P1** | — | 桌面应用 | Electron 打包同一套 Web 代码：原生对话框、工程文件、安装包 |

导航：固定顶栏 56px（logo + Editor / Gallery / Guide + GitHub 图标 + "Launch Editor" CTA）；营销页有页脚（4 栏：品牌/产品/文档/社区），编辑器页无页脚。

---

## 7. 素材方案（4 套示例场景，全部程序生成）

**策略：示例场景素材 100% 程序生成（`src/core/placeholder/` 像素画套件：Painter + Bayer 4×4 有序抖动 + 色相偏移 6 阶色带，种子确定性 RNG），永不被美术阻塞。** 每套主题是真正的 2.5D 布景：远景 unlit 背景板 + 中景错落深度的广告牌 + 一张 960×960 的**地面平面纹理**（顶行=近边缘，底行=地平线，透视自动收束）+ 焦平面之前的前景框边（开 DOF 即糊）+ **Q 版角色精灵**（每场景至少一名，脚踩地面、带接触阴影与轮廓光）+ 每主题专属灯光/雾/DOF 预设。

- **Goldenhollow Village**（黄昏木筋房村镇）：抖动黄昏天空/小镇剪影/木筋房/市集广场（棚摊、水井、旗帜）/鹅卵石地面/战士 + 商人两名旅人；琥珀雾 + DOF
- **Stillsnow Pass**（月夜雪原）：星空月亮极光/雪山小屋（唯一暖窗）/积雪雪松/雪顶鸟居石灯笼/雪原脚印/提灯旅人；冷蓝雾 + 飘雪粒子
- **Emberhold Ruins**（火把遗迹）：石墙火把/符文石柱与青光拱门/天窗光柱/宝箱金币/石板地面/前景铁链尖刺/法师；暖光 + 暗雾 + 余烬粒子
- **Neon Alley**（雨夜霓虹巷）：分塔楼窗格/竖排霓虹灯管招牌/垂线灯笼/湿沥青地面（霓虹倒影自动汇聚）/撑发光雨伞的夜行者；青品红氛围光 + 雨丝粒子
- 用户换成自己的像素画时 schema 不变——调 depth 即可

---

## 8. 实施工作流（历史记录：v1 已按此执行，v2 已完成重建）

> v1 的 Phase 0–6（初始化 → Canvas 2D 视差引擎 → 三栏 UI → 导出持久化 → 落地页 → 文档/画廊 → 收尾）已全部执行完毕；v2 随后完成 three.js 引擎重建与 Electron 桌面化。**当前代码即最终事实**，本节保留以展示"先闭环、后升级"的项目叙事，技术细节以 README §架构 与 §4 为准。

总原则（回顾）：
1. **先闭环，后花活**：P0 编辑器全功能 > P1 落地页 > P2 文档/画廊 > P3 动效抛光——v1 验证了这条路线，v2 在同一闭环上换引擎
2. 每 Phase 做完**亲自验收**（二进制标准，不过就返工）
3. 让 AI 写的每个函数都要能讲——讲不出就让它解释到你懂，这是简历的一部分
4. 引擎核心保持纯函数 + 命令式渲染循环，从 v1 的 Canvas 2D 到 v2 的 three.js，"逐行可讲"的原则没变

---

## 9. 总验收清单（v2，全部打勾 = 已完成 ✅）

- [x] 导入 ≥4 层 PNG，排序/显隐/重命名/删除正常
- [x] 每层 depth/scale/offset/orientation/lit 修改实时生效，视差读数正确
- [x] 拖镜头各层透视视差差异明显，运镜路径播放流畅
- [x] DOF/雾/灯光按场景生效，lit/unlit 差异可见
- [x] 撤销/重做全量历史，滑杆拖动合并为一步
- [x] 导出 JSON 能被 §4.4 runtime 复现同样画面（并排对比）；zip 导出 assets 齐全
- [x] 刷新页面场景完整恢复；v1 存档静默迁移；项目文件导入导出往返无损
- [x] 落地页 hero 是可拖的真实 HD-2D demo（与编辑器同一引擎）
- [x] 文档页 depth 语义表 + JSON 参考 + runtime 代码齐全
- [x] 画廊 3 个示例场景可预览、可打开、可下载
- [x] Electron：`npm run dist` 产出 NSIS 安装包 + 便携 exe；双击 .pixelstage.json 打开
- [x] README 有 demo 说明 + 技术决策章节
- [x] `npm run build` / `npm run test` 零错误

---

## 10. 简历怎么写（直接可用）

> **PixelStage — 开源 HD-2D 像素视差场景编辑器**（独立开发 · React/TypeScript/three.js/Electron）
> - 面向独立像素游戏开发者的场景工具：导入分层素材 → 在真实 3D 深度上编排（广告牌 + 八方旅人式地面平面）→ 灯光/景深/雾 → 透视镜头实时预览 → 导出引擎无关 JSON，游戏端 three.js runtime（CDN 免构建）即可复现场景，形成完整闭环
> - GitHub 检索验证同关键词下无可用竞品（`2.5D pixel scene editor` 0 结果），解决了本人开发 2.5D 像素游戏时场景纵深"改代码-运行-再改"的真实痛点
> - 自研 HD-2D 引擎核心（three.js 裸用，无 R3F）：透视相机 + 深度模型（`D/(D+depth)` 透视视差）、DOF 半分辨率合成、NearestFilter 纹理缓存；纯函数核心 + 单元测试
> - v1→v2 演进：先用 Canvas 2D "一次乘法"视差跑通产品闭环，再整体重建为真透视引擎——验证"先闭环后升级"的工程判断
> - 桌面化：Electron 沙箱渲染进程 + preload IPC、原生对话框、`.pixelstage.json` 文件关联、electron-builder 产出 NSIS 安装包与便携 exe；Web/桌面双形态共用 `platform.ts` 平台缝
> - Zustand 单文档状态树 + 快照式撤销/重做（滑杆拖动合并）；localStorage + IndexedDB 双层持久化；v1→v2 存档自动迁移
> - 附在线 demo 链接 + 30 秒演示视频 + 完整 JSON 格式文档

**面试预警**：vibecoding 做的项目，面试官会逐行问。做到三点就稳：① 每个阶段的验收都是你亲手做的；② §4 的深度模型、schema、store 形状你能背出来；③ 被问"为什么从 Canvas 2D 换到 three.js"能答：透视、遮挡、近大远小是 2D 伪造不出来的，而裸用 three.js 保住了"逐行可讲"。

---

## 11. 风险与取舍（提前想清楚的）

| 风险 | 对策 |
|---|---|
| 图片 dataURL 撑爆 localStorage | 参数进 localStorage、图片进 IndexedDB，已分离 |
| 大图卡顿 | 限制单图 ≤4096px；纹理缓存；DOF 合成器半分辨率 |
| 像素图被平滑模糊 | NearestFilter + CSS `image-rendering: pixelated` 双保险 |
| WebGL 上下文丢失/崩溃 | `webglcontextlost` 监听 + ErrorBoundary 恢复面板 |
| Electron 二进制下载失败（部分网络） | README 提供 npmmirror 镜像命令 |
| 移动端编辑器体验 | 编辑器只做桌面端（小窗提示条），营销页做响应式 |
| 功能蔓延 | 候选清单（角色遮挡/镜头关键帧/平铺层）严格不进本期 |

---

## 附录 · 交付物索引

| 文件 | 内容 |
|---|---|
| `PixelStage-PRD.md`（本文档） | 产品需求 + 技术方案（v2 现实） |
| `README.md` | v2 架构与使用说明（**最终事实来源**） |
| `design/design.md` | 完整全局设计系统（色彩/字体/组件/动效） |
| `design/home.md` / `editor.md` / `guide.md` / `gallery.md` | 4 页逐区详细设计（home/editor 已更新至 v2） |
| `plan.md` | 执行蓝图（已全部完成，含 v2 重建记录） |
