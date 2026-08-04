# PixelStage — PRD & 实施工作流

> **2.5D 像素视差场景编辑器** · 给 Kimi Code 的执行蓝图
> 版本 v1.1 · 2026-07-31 · 本文档自包含，可直接作为开发唯一依据（使用方法已适配零基础：无需懂仓库/命令行）

---

## 0. 30 秒看懂这个项目

**是什么**：一个开源 Web 工具。独立像素游戏开发者把分层素材（天空/远山/中景/前景）导进来，给每层调视差系数，拖动虚拟镜头**实时预览**纵深效果，最后一键导出一个 JSON——游戏运行时用 ~20 行代码就能原样复现这个场景。

**核心闭环**：
```
导入图层 → 调每层视差系数 → 拖虚拟镜头实时预览 → 导出 scene.json → 游戏 runtime 复现
```

**为什么值得做（简历角度，已实测）**：
- GitHub 官方接口实测：`2.5D pixel scene editor` = **0 个仓库**；`parallax editor pixel` = 仅 2 个 0-star 废弃品。对比：图书管理系统 6,239 个仓库、学生管理系统 10,733 个。
- 定位一句话：**"HD-2D for the rest of us"**。逸剑风云决/八方旅人用 UE4 真 3D 管线做 HD-2D（制作人自学 UE4 五年、三次资金断裂）；99% 的独立像素游戏用纯 2D 图层视差伪造纵深——**这条路上没有专业工具**，大家都在引擎里手调系数、跑起来、不对、再调。

**首个用户就是作者本人**（正在开发 2.5D 像素游戏）——"解决自己的真实痛点"是面试时最有说服力的项目叙事。

---

## 1. 定位与边界

| 做 ✅ | 不做 ❌ | 理由 |
|---|---|---|
| 多层图片视差编排 | 瓦片地图编辑 | Tiled / LDtk 的领地 |
| 每层视差系数/缩放/偏移 | 像素画绘制 | Aseprite 的领地 |
| 虚拟镜头实时预览 | 真 3D / HD-2D | UE4 管线，一个人玩不起 |
| 导出引擎无关 JSON + 最小 runtime | 游戏引擎本体 | 我们是工具，不是引擎 |
| 纯前端本地运行（无账号无后端） | 云同步/协作 | v1 不需要，且合规省心 |

---

## 2. 用户与核心场景

**目标用户**：用 Electron / Phaser / Godot / Unity-2D 做 2.5D 视差像素游戏的独立开发者。

**核心用户故事**：
> 我在做一款逸剑风云决风格的 2.5D 像素游戏。我画了 4 层场景图（天空、远山、中景树林、前景草叶）。我想知道镜头移动时每层该动多快。现在我只能在游戏里改代码里的数字 → 运行 → 拖动 → 不对 → 改 → 再运行，调一层要 5 分钟。
> **用 PixelStage**：拖 4 张图进来 → 滑杆调系数，拖镜头立刻看到效果 → 导出 JSON → 游戏读 JSON，一次到位。

**次级场景**：把做好的场景发画廊页给别人"Open in Editor"直接打开（分享即传播）。

---

## 3. MVP 功能规格（v1，必须全部实现）

### F1 图层管理
- 导入：拖拽 PNG/JPG 到画布 或 点击"导入图层"文件选择（多选）
- 图层列表：显示缩略图+名称；支持拖动排序（层级=绘制顺序，列表顶=最前）；眼睛图标切换显隐；双击重命名；删除（带 3 秒撤销 toast）
- **验收**：导入 4 张 PNG，排序/显隐/重命名/删除全部生效，画布即时反映

### F2 视差参数（每层）
- factorX / factorY：滑杆 0.00–1.50（步进 0.01）+ 数字输入框，双绑定
- scale：0.1–4.0；offsetX / offsetY：整数像素
- 检查器里实时显示**公式读数**：`x = 0 − 320 × 0.40 → −128px`（当前镜头下该层的实际屏幕位移，教学相长）
- **验收**：改 factor，画布该层速度立即可感变化；公式读数与画面一致

### F3 虚拟镜头
- 画布内按住拖动 = 移动镜头（cursor grab/grabbing），镜头位置 HUD 实时显示
- 镜头可设置边界（默认限制在场景合理范围）或自由模式
- 自动往返播放开关（镜头从左到右匀速扫，循环），用于录 demo 视频
- 缩放：Ctrl+滚轮 0.5×–4×（v1 可砍，砍了不影响闭环）
- **验收**：拖动镜头，4 层按各自系数产生明显不同的位移；自动播放平滑 60fps

### F4 场景导出
- 导出 `scene.json`（schema 见 §4.3）下载到本地
- 导出模态框：JSON 预览（带语法高亮）+ 复制按钮 + 下载按钮 + "runtime 怎么用" 20 行代码片段（§4.4）
- **验收**：导出的 JSON 用 §4.4 的 runtime 代码能复现**像素级一致**的画面（闭环证明，这是项目的灵魂）

### F5 持久化
- 参数（图层顺序/系数/偏移/镜头）→ localStorage，500ms 防抖自动保存，顶栏显示"已保存 HH:mm"
- 图片 blob → IndexedDB（用 `idb-keyval`，约 600 字节依赖），规避 localStorage 5MB 上限
- 项目文件：可导出 `.pixelstage.json`（含 base64 图片）分享；可导入还原
- **验收**：刷新页面场景完整恢复；导入导出往返无损

### v1.1 候选（本期不做，架构预留接口）
- 测试角色精灵：一个小人在图层之间走动，验证前景遮挡（数据模型已天然支持，角色=插入某两层之间的特殊层）
- 镜头关键帧路径编辑；无限平铺（tile）层；Electron 套壳（核心逻辑与 UI 已分层，套壳只需一个 main 进程）

---

## 4. 核心技术方案

### 4.1 技术栈与决策理由（面试按这个讲）

| 选择 | 理由 | 为什么不选替代 |
|---|---|---|
| React 19 + TS + Vite | 简历主流栈，组件化适合面板型工具 | Vue 也可以，但岗位 React 更多 |
| Tailwind v3.4 + shadcn/ui | 快速搭出专业质感，深色主题成熟 | 手写 CSS 慢且丑 |
| **自写 Canvas 2D 渲染循环** | 每层就是 `drawImage + offset`，逻辑简单透明，**面试能逐行讲** | PixiJS/Three.js 帮你干的活正是面试要考的活 |
| Zustand | 编辑器=单文档状态树，Zustand 最贴合，10 行起一个 store | Redux 太重，Context 性能差 |
| localStorage + IndexedDB | 纯前端零后端，合规省心 | 后端/账号对工具型 v1 是负资产 |
| Web 优先，预留 Electron 套壳 | 简历放可点的链接；核心层不碰 DOM 外 API，套壳零成本 | 先 Electron 则面试演示要下载安装 |

### 4.2 视差渲染引擎（项目的技术核心，就这么多）

**公式**（每一帧对每一层执行）：
```
screenX = layer.offsetX − camera.x × layer.factorX
screenY = layer.offsetY − camera.y × layer.factorY
ctx.drawImage(layer.bitmap, screenX, screenY, w × scale, h × scale)
```

**factor 语义表**（写进文档页，也是面试答案）：

| factor | 语义 | 典型用途 |
|---|---|---|
| 0.00 | 锁死在屏幕，完全不随镜头动 | 极远天空/星空、HUD 感 |
| 0.05–0.20 | 远景 | 远山、天际线 |
| 0.30–0.50 | 中景 | 树林、建筑 |
| 0.70–0.90 | 近景 | 灌木、栏杆 |
| 1.00 | 焦点平面，与镜头 1:1 | 角色/地面所在层 |
| >1.00 | 比镜头还快 | 前景遮挡物（草叶、柱子扫过） |

**渲染循环要点**：
- `requestAnimationFrame` 驱动；仅在画布可见时运行（IntersectionObserver），切后台暂停
- `ctx.imageSmoothingEnabled = false` + CSS `image-rendering: pixelated`（像素风不模糊，**不可协商**）
- DPR 适配：`canvas.width = cssW × devicePixelRatio`，`ctx.scale(dpr, dpr)`
- 每层位图导入时解码一次缓存（`createImageBitmap`），渲染循环里零解码
- 性能预算：10 层 960×540 @60fps 远未触顶，无需 WebGL

### 4.3 场景 JSON Schema（导出格式，引擎无关）

```json
{
  "version": 1,
  "name": "Sunset Valley",
  "canvas": { "width": 960, "height": 540 },
  "camera": { "x": 320, "y": 180 },
  "layers": [
    { "id": "sky",   "name": "Sky",        "src": "layers/valley-sky.png",
      "factorX": 0.05, "factorY": 0.05, "scale": 1, "offsetX": 0, "offsetY": 0,
      "visible": true },
    { "id": "far",   "name": "Far Ridge",  "src": "layers/valley-far.png",
      "factorX": 0.15, "factorY": 0.10, "scale": 1, "offsetX": 0, "offsetY": 0,
      "visible": true },
    { "id": "mid",   "name": "Mid Hills",  "src": "layers/valley-mid.png",
      "factorX": 0.40, "factorY": 0.25, "scale": 1, "offsetX": 0, "offsetY": 0,
      "visible": true },
    { "id": "front", "name": "Foreground", "src": "layers/valley-front.png",
      "factorX": 0.80, "factorY": 0.50, "scale": 1, "offsetX": 0, "offsetY": 0,
      "visible": true }
  ]
}
```
数组顺序 = 绘制顺序（先画的在底）。`src` 为相对路径；项目文件内嵌时可以是 dataURL。

### 4.4 最小 runtime（~20 行，闭环证明，放进文档页和导出模态框）

```js
// runtime.js — 在任何 <canvas> 里复现 PixelStage 场景
export async function playScene(canvas, sceneUrl) {
  const ctx = canvas.getContext('2d');
  const scene = await (await fetch(sceneUrl)).json();
  const imgs = await Promise.all(scene.layers.map(l => new Promise(ok => {
    const i = new Image(); i.onload = () => ok(i); i.src = l.src;
  })));
  function render(camX, camY) {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    scene.layers.forEach((l, i) => {
      if (!l.visible) return;
      ctx.drawImage(imgs[i],
        l.offsetX - camX * l.factorX,
        l.offsetY - camY * l.factorY,
        imgs[i].width * l.scale, imgs[i].height * l.scale);
    });
  }
  let cam = { ...scene.camera };
  canvas.onpointermove = e => { if (e.buttons) { cam.x -= e.movementX; render(cam.x, cam.y); } };
  render(cam.x, cam.y);
}
```

### 4.5 状态模型（Zustand store 形状）

```ts
type Layer = {
  id: string; name: string; src: string;        // src = dataURL 或路径
  factorX: number; factorY: number;
  scale: number; offsetX: number; offsetY: number;
  visible: boolean;
};
type SceneStore = {
  name: string;
  canvas: { width: number; height: number };
  camera: { x: number; y: number };
  layers: Layer[];                 // index 0 = 最底层
  selectedId: string | null;
  playing: boolean;                // 自动往返
  addLayers(files: File[]): Promise<void>;
  removeLayer(id: string): void;
  moveLayer(id: string, dir: 1 | -1): void;
  reorderLayer(id: string, to: number): void;
  updateLayer(id: string, patch: Partial<Layer>): void;
  setCamera(x: number, y: number): void;
  togglePlaying(): void;
  toJSON(): SceneFile;             // §4.3 结构
  loadJSON(f: SceneFile): void;
};
```
纯函数核心（`computeScreenPos`、`serializeScene`、`migrateScene`）放 `src/core/`，不依赖 React，配 vitest 单测——**这是"代码可讲解性"的兑现**。

---

## 5. UI/UX 设计规范（浓缩自完整设计稿，741 行，见附件 design/）

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
| `--teal` | `#4FD1B5` | 次强调：数据、factorY、链接 |
| `--danger` | `#F27070` | 删除/错误 |
| `--success` | `#62D189` | 自动保存点 |

### 5.2 字体（Google Fonts）
- **Silkscreen**（像素体 400/700）：logo、大标题、`// LABEL` 眉题、大数字——**绝不用于正文**
- **Inter**（400–700）：全部界面文本
- **JetBrains Mono**（400/500/700 + `tnum`）：**所有数字**、参数、JSON、状态栏。这个数字产品里数字是一等公民

### 5.3 编辑器布局（产品本体，三栏）

```
┌────────────────────────────────────────────────────────────────┐
│ TopBar 48px: logo · 项目名 · 画布尺寸预设 · ●已保存12:03 · 导出JSON │
├────────────┬────────────────────────────────────┬──────────────┤
│ 图层列表    │                                    │ 属性检查器    │
│ 272px      │         Canvas 视口                 │ 304px        │
│ ┌────────┐ │   （拖=移镜头，grab/grabbing）       │ factorX 0.40 │
│ │▓front ▓│ │   ┌──────────────────────┐        │ factorY 0.25 │
│ │ mid    │ │   │   960 × 540 舞台      │        │ scale   1.00 │
│ │ far    │ │   │   （像素棋盘格垫底）    │        │ offset  0, 0 │
│ │ sky    │ │   └──────────────────────┘        │ ──────────  │
│ └────────┘ │   HUD: cam(320, 180) · zoom 100%  │ x = 0−320×  │
│ [+ 导入图层]│                                    │   0.40 =    │
│            │                                    │   −128px    │
├────────────┴────────────────────────────────────┴──────────────┤
│ StatusBar 24px: cam(320,180) · 4 层 · 960×540 · canvas-2d · v1.0 │
└────────────────────────────────────────────────────────────────┘
```

### 5.4 关键视觉规则
- 圆角 ≤6px（像素=直角美学）；主 CTA 用 6px 阶梯缺角 clip-path（pixel-notch）
- 透明区域一律 8px 棋盘格（`#151926`/`#1C2231`）
- 选中态 = 琥珀 1px 描边或左侧 2px 琥珀条
- 空状态：棋盘格舞台 + 像素插画 + 「拖图片进来，或打开示例场景」

### 5.5 动效（克制）
- 进场：`opacity 0→1, translateY 24→0`，子元素 stagger 80ms
- 微交互 120–180ms；面板/弹窗 220–300ms
- `prefers-reduced-motion`：关自动镜头、关闪烁光标
- 营销页平滑滚动（Lenis）和 GSAP 滚动叙事 = **P2 花活，v1 可全部砍掉**，砍了不影响产品价值

---

## 6. 页面结构（4 页，按优先级排序）

| 优先级 | 路由 | 页面 | 内容 |
|---|---|---|---|
| **P0** | `/editor` | 编辑器 | §5.3 三栏布局，F1–F5 全部功能。**产品本体，先做** |
| **P1** | `/` | 落地页 | ① Hero=**真实可拖的视差 demo**（复用编辑器同一套渲染代码+内置示例图层，"demo 即产品"）② 产品故事：1% 的路（UE4 HD-2D）vs 99% 的路（图层视差）③ 三步工作流 ④ 六宫格特性 ⑤ JSON+runtime 代码左右分栏 ⑥ CTA 进编辑器 |
| **P2** | `/guide` | 文档 | 快速上手、factor 语义表（§4.2）、JSON schema 参考表、runtime 代码、FAQ |
| **P2** | `/gallery` | 场景画廊 | 3 个内置示例场景卡片（各自可拖动的迷你视差预览）、「在编辑器中打开」（写 localStorage 跳转）、「下载 JSON」 |

导航：固定顶栏 56px（logo + Editor / Gallery / Guide + GitHub 图标 + "Launch Editor" CTA）；营销页有页脚（4 栏：品牌/产品/文档/社区），编辑器页无页脚。

---

## 7. 素材方案（3 套示例视差图层）

**策略：先用程序生成的占位图层跑通全部功能，最后才换美术。** 别让素材阻塞开发。

占位层生成（10 行代码）：离屏 canvas 画 4 个 960×540——纯色渐变底 + 不同间距的矩形剪影（山/树/草），颜色区分层级。

正式素材用 AI 生图（Kimi/即梦/Midjourney 均可），提示词要点：

- **天空层**（不透明底）：`pixel-art dusk sky, warm amber to dusky-purple vertical gradient with ordered dithering, blocky drifting clouds, tiny 2px stars, sun glow low on horizon, retro 16-bit game background, 960×540`
- **远/中/前景层**（透明 PNG）：主体描述 + `transparent background, everything outside the subject fully transparent, pixel-art silhouette style, limited palette`
- 三套主题建议：**Sunset Valley**（黄昏山谷：天空/远山/松林鸟居/前景草叶）、**Neon Alley**（赛博雨巷：楼墙霓虹/近楼招牌/前景垃圾箱）、**Ember Dungeon**（地牢火光：石墙/石柱宝箱/前景铁链尖刺）
- ⚠️ 生图工具透明背景一般只支持 1:1 / 3:2 / 2:3，用 **3:2** 生成后画布按 960×540 居中裁切即可
- 默认系数预设：Valley `0.05 / 0.15 / 0.40 / 0.80`；Alley `0.10 / 0.35 / 0.85`；Dungeon `0.08 / 0.45 / 0.90`（底→前）

---

## 8. Kimi Code 实施工作流（本文档的食用方法）

### 总原则（零基础版，无需懂仓库/命令行）
1. **先闭环，后花活**：P0 编辑器全功能 > P1 落地页 > P2 文档/画廊 > P3 动效抛光
2. **每个 Phase 开一个新的 Kimi Code 对话**：把本 PRD 文件上传（或整份粘贴）到对话里，再粘贴对应阶段的提示词。项目由 Kimi Code 自动创建和管理，你不用碰仓库
3. 每 Phase 做完**你亲自验收**（标准已给出），过了再开下一个对话
4. 让 AI 写的每个函数你都要能讲——讲不出就让它解释到你懂（对它说"用大白话讲讲这段代码"），这是简历的一部分

### Phase 0 — 项目初始化（半小时）
**目标**：Vite+React+TS+Tailwind+shadcn 骨架，字体和色彩 token 就位，4 个路由占位页。
**粘贴给 Kimi Code**：
```
用 Vite 创建 React 19 + TypeScript 项目 PixelStage（2.5D 像素视差场景编辑器，纯前端无后端）。
技术栈：Tailwind CSS v3.4、shadcn/ui（装 button/dialog/slider/input/tooltip/tabs/switch）、
zustand、idb-keyval、lucide-react。BrowserRouter 配 4 个路由占位页：/ /editor /guide /gallery。
按 这份 PRD §5.1 把色彩 token 写进 Tailwind theme 和 CSS 变量；Google Fonts 引入
Silkscreen(400,700)、Inter(400-700)、JetBrains Mono(400,500,700)。
全局 CSS：深色底 #0A0C10，所有 img/canvas 加 image-rendering: pixelated。
顶栏组件：左 logo+PixelStage 字标，右导航 Editor/Gallery/Guide + "Launch Editor" 按钮。
```
**验收**：`npm run dev` 打开是深色页面，4 个路由都能访问占位页，字体生效。

### Phase 1 — 视差渲染引擎（核心中的核心，1–2 天）
**目标**：纯函数核心 + Canvas 渲染循环 + 镜头拖动 + 程序化占位图层，**跑通视差**。
```
实现 PixelStage 的渲染核心（这份 PRD §4.2/§4.5）：
1. src/core/parallax.ts：纯函数 computeScreenPos(layer, camera) → {x, y}，附 vitest 单测
2. src/core/scene.ts：Layer/SceneFile 类型 + createPlaceholderScene()——用离屏 canvas
   程序生成 4 层占位图（960×540，渐变天空+不同密度的剪影矩形模拟山/树/草，系数 0.05/0.2/0.5/0.9）
3. src/components/StageCanvas.tsx：canvas 渲染组件。rAF 循环；imageSmoothingEnabled=false；
   DPR 适配；按住拖动=移动镜头（grab/grabbing 光标）；HUD 显示 cam 坐标；自动往返播放开关。
4. Zustand store 先建最小版（layers/camera/setCamera）。
验收标准：拖镜头时 4 层以明显不同速度移动（近快远慢），60fps 流畅，公式单测通过。
```
**验收**：手拖镜头，近景草叶唰唰动、远山几乎不动、天空纹丝不动——**看到这一幕，项目的魂就有了**。

### Phase 2 — 编辑器三栏 UI（2–3 天，最大工程）
```
按 这份 PRD §5.3 线框和 §3 F1/F2 实现编辑器三栏：
1. LayerPanel（左 272px）：导入按钮+拖拽导入（FileReader→dataURL→createImageBitmap 缓存）；
   图层列表（缩略图+名称+眼睛+删除带撤销 toast）；HTML5 drag 或 framer-motion 拖动排序；双击重命名
2. Inspector（右 304px）：选中层的 factorX/factorY 滑杆(0-1.5 步进0.01)+数字输入双绑定、
   scale、offset；实时公式读数 x = offset − cam × factor → 结果 px（PRD §3-F2）
3. TopBar：项目名（可改）、画布尺寸预设(960×540/1280×720/自定义)、自动保存指示点、导出按钮
4. StatusBar：cam 坐标、层数、画布尺寸
5. 空状态：棋盘格舞台+「拖图片进来，或加载占位场景」按钮
所有状态走 Zustand（PRD §4.5 完整 store）。
```
**验收**：F1/F2 全部验收标准通过；导入自己画的 3 张图能调出一个像样的场景。

### Phase 3 — 导出与持久化（1 天，闭环合拢）
```
按 这份 PRD §4.3/§4.4/§3-F4/F5 实现：
1. 导出模态框：JSON 预览（语法高亮：key 浅蓝/字符串琥珀/数字 teal）+ 复制 + 下载 scene.json
   + 内嵌 §4.4 runtime.js 代码块（可复制）
2. localStorage 参数持久化（500ms 防抖）+ 顶栏「已保存 HH:mm」
3. IndexedDB（idb-keyval）存图片 blob，刷新完整恢复；配额 try/catch + 警告 toast
4. 项目文件 .pixelstage.json（内嵌 base64 图）导出/导入往返
5. 写一个独立验证页（或 codepen 式小 demo）：读取导出的 scene.json 用 runtime.js 渲染，
   和编辑器画面并排对比一致
```
**验收**：F4/F5 标准通过；**闭环正式合拢**——此刻起这已经是个完整产品。

### Phase 4 — 落地页（1 天）
```
按 这份 PRD §6 实现落地页 /：
1. Hero：复用 StageCanvas + 内置示例图层（先用占位层，美术好后替换），页面加载自动扫镜头，
   用户一拖就变手动；大标题 Silkscreen 字体「HD-2D for the rest of us.」
2. 产品故事区：1% 的路（UE4 真3D管线，逸剑风云决/八方旅人）vs 99% 的路（纯2D图层视差），
   引出「但这条路上没有专业工具」
3. 三步工作流（导入→调参→导出）+ 六宫格特性 + JSON/runtime 代码左右分栏 + CTA
视觉遵循 PRD §5 设计规范。
```
**验收**：首屏拖得动、看得懂、点得进编辑器；手机端不崩（编辑器本体不强求移动端）。

### Phase 5 — 文档页 + 画廊（1 天，可并行或后补）
```
1. /guide：快速上手 4 步、factor 语义表（PRD §4.2 表格原样）、JSON schema 字段参考表、
   runtime.js 完整代码块、FAQ 6 条（图片存哪/会不会上传/支持什么格式/能商用吗/和手机端/导出的JSON怎么在Phaser里用）
2. /gallery：3 张场景卡片（Sunset Valley/Neon Alley/Ember Dungeon），每张内嵌迷你
   StageCanvas 可拖动；「在编辑器中打开」（把场景写进 localStorage 后跳 /editor）；「下载 JSON」
```
**验收**：从画廊打开示例场景→编辑器里是完整可编辑状态。

### Phase 6 — 美术替换 + 收尾（半天–1 天）
- 按 §7 生成 3 套像素图层，替换占位层（文件名对齐 JSON 里的 src）
- README.md：logo、30 秒 demo GIF（录自动扫镜头）、特性列表、快速开始、**技术决策章节**（抄 PRD §4.1 表格）、JSON 格式文档、License MIT
- 部署：Vercel/Netlify/GitHub Pages 任选，免费
- GitHub 仓库名建议：`pixelstage`，简介写 `2.5D pixel parallax scene editor — HD-2D for the rest of us`

---

## 9. 总验收清单（全部打勾 = 项目完成）

- [ ] 导入 ≥4 层 PNG，排序/显隐/重命名/删除正常
- [ ] 每层 factor/scale/offset 修改实时生效，公式读数正确
- [ ] 拖镜头各层视差差异明显，自动播放流畅
- [ ] 导出 JSON 能被 §4.4 runtime 复现同样画面（并排对比）
- [ ] 刷新页面场景完整恢复；项目文件导入导出往返无损
- [ ] 落地页 hero 是可拖的真实视差 demo
- [ ] 文档页 factor 语义表 + JSON 参考 + runtime 代码齐全
- [ ] 画廊 3 个示例场景可预览、可打开、可下载
- [ ] README 有 demo GIF + 技术决策章节；已部署有公开链接
- [ ] `npm run build` 零错误

---

## 10. 简历怎么写（直接可用）

> **PixelStage — 开源 2.5D 像素视差场景编辑器**（独立开发 · React/TypeScript/Canvas）
> - 面向独立像素游戏开发者的场景工具：导入分层素材 → 调节每层视差系数 → 虚拟镜头实时预览 → 导出引擎无关 JSON，游戏端 20 行 runtime 即可复现场景，形成完整闭环
> - GitHub 检索验证同关键词下无可用竞品（`2.5D pixel scene editor` 0 结果），解决了本人开发 2.5D 像素游戏时视差参数"改代码-运行-再改"的真实痛点
> - 自研 Canvas 2D 渲染循环与视差计算核心（纯函数 + 单元测试），DPR 适配与离屏位图缓存，10 层场景稳定 60fps
> - 纯前端架构：Zustand 单文档状态树、localStorage + IndexedDB 双层持久化、防抖自动保存
> - 附在线 demo 链接 + 30 秒演示视频 + 完整 JSON 格式文档

**面试预警**：vibecoding 做的项目，面试官会逐行问。做到三点就稳：① 每个 Phase 的验收都是你亲手做的；② §4 的公式、schema、store 形状你能背出来；③ 被问"为什么不用 PixiJS"能答 §4.1 的理由。

---

## 11. 风险与取舍（提前想清楚的）

| 风险 | 对策 |
|---|---|
| 图片 dataURL 撑爆 localStorage | 参数进 localStorage、图片进 IndexedDB，已分离 |
| 大图卡顿 | v1 限制单图 ≤4096px；`createImageBitmap` 一次性解码；渲染循环零解码 |
| 像素图被平滑模糊 | `imageSmoothingEnabled=false` + CSS `image-rendering: pixelated` 双保险 |
| AI 生图透明背景尺寸受限 | 3:2 生成居中裁切；或先用占位层 |
| 移动端编辑器体验 | v1 编辑器只做桌面端，营销页做响应式 |
| 功能蔓延 | v1.1 清单（角色遮挡/镜头路径/平铺层）严格不进 v1 |

---

## 附录 · 交付物索引

| 文件 | 内容 |
|---|---|
| `PixelStage-这份 PRD`（本文档） | 唯一开发依据 |
| `design/design.md` | 完整全局设计系统（色彩/字体/组件/动效/14 素材清单） |
| `design/home.md` / `editor.md` / `guide.md` / `gallery.md` | 4 页逐区详细设计（含精确动画参数） |
| `plan.md` | 原始执行蓝图（多智能体版，可忽略，PRD 已超越它） |

> 设计稿由 AI 设计师智能体产出（741 行），PRD 为其浓缩执行版。若 Kimi Code 对某页细节有疑问，把对应 `design/*.md` 一并喂给它。
