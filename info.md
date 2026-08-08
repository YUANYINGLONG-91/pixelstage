# info.md — PixelStage 产品研究（供 Designer 参考）

## 产品定位
- 名称：**PixelStage**（HD-2D Pixel Parallax Scene Editor）
- 一句话：面向独立像素游戏开发者的 HD-2D 像素场景编辑器——导入分层素材，把每层放到真实 3D 深度（面向镜头的广告牌 + 八方旅人式地面平面），打光、加景深和雾，用真实透视镜头预览，一键导出运行时 JSON + three.js runtime。
- 定位类比：**"穷人版 HD-2D 的专用工具"**。逸剑风云决 / 八方旅人用 UE4 真 3D 管线做 HD-2D（单个独立开发者玩不起）；PixelStage 用 three.js/WebGL 给独立开发者同样的透视纵深、遮挡、景深——但只有一个 JSON 和一段无构建的 runtime。
- v2 说明：v1 的"纯 2D 图层 × 视差系数"（`pos = offset − camera × factor`）已被整体重建取代。v2 的每层是 3D 场景里的贴图平面，视差是**透视算出来的**，不是按轴伪造的。
- GitHub 稀缺性（官方接口实测 2026-07-31）：`2.5D pixel scene editor` = **0 个仓库**；`parallax editor pixel` = 2 个 0-star 废弃品。

## 目标用户
- 独立像素游戏开发者（Electron / Phaser / Godot 等技术栈做 2.5D 场景）
- 项目的首个用户就是作者本人：正在开发逸剑风云决风格的 2.5D 像素游戏

## 竞品边界（不做什么）
- Tiled / LDtk：瓦片地图编辑器，不管多层纵深
- Aseprite：像素画绘制工具，不管场景编排
- Unity/UE 自带方案：重型 3D 管线（PixelStage 是"轻量的真透视"，不是完整引擎）
- **本工具只做**：图层深度编排 + 灯光氛围 + 透视镜头预览 + 导出运行时 JSON

## 功能清单（v2 核心闭环）
1. **图层管理**：导入 PNG/JPG（拖拽 + 文件选择），图层列表支持排序 / 显隐 / 重命名 / 删除
2. **深度模型**：每层 `depth`（0 = 焦平面像素 1:1，>0 更远，<0 在焦平面前）、`orientation`（vertical 广告牌 / ground 地面平面）、`lit`（受光 / 全亮）、缩放、偏移
3. **灯光氛围**：每场景景深（焦点 + 光圈）、距离雾、环境光 + 方向光（太阳）
4. **透视镜头**：拖动=平移，滚轮=推拉变焦（40%–400%），右键/Alt 拖动=环绕；`R` 复位取景；空格播放运镜路径（sweep / orbit / dolly）
5. **撤销/重做**：快照式历史（Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y），滑杆拖动合并为一步
6. **导出**：scene.json v2（内嵌 base64）或 zip（scene.json + assets/*.png，文件真的在里面）+ three.js runtime.html（CDN import map，免构建）
7. **持久化与桌面端**：localStorage + IndexedDB 自动保存；Electron 桌面应用（沙箱渲染进程、原生对话框、Ctrl+S/Shift+S/O、最近文件、.pixelstage.json 文件关联、NSIS 安装包 + 便携 exe）

## 技术要点（供实现参考，非设计决策）
- 视差核心：深度为 `depth` 的层在屏幕上按 `D / (D + depth)` 位移缩放，`D` = 焦距（960×540 / 40° FOV 下 ≈ 742px）。透视投影天然给出视差、遮挡和近大远小
- 技术栈：React 19 + TypeScript + Vite + Tailwind v3.4.19 + shadcn/ui；**three.js（裸用，不用 R3F）**——渲染循环保持命令式，与导出的 runtime 完全一致；Zustand 状态管理 + 快照历史
- 引擎核心在 `src/core/`（stage3d / textures / cameraPaths / scene / zip / types），纯 TS 不依赖 React，vitest 覆盖（场景迁移、运镜路径）
- 数据格式：scene.json v2（version: 2，camera/effects/layers）；v1 文件打开时自动迁移（`depth = D·(1 − factorX)`，factorY 无 3D 等价物，丢弃）
- 无后端、无账号；BrowserRouter；Electron 主进程只负责 IPC/对话框/最近文件，渲染进程完全沙箱化

## 产品气质关键词
专业开发者工具（dev-tool）、编辑器三栏布局、像素游戏文化、开源工具、深色低饱和
