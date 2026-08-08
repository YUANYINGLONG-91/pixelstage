# plan.md — PixelStage：HD-2D 像素视差场景编辑器

> **状态：v1 计划已全部执行完毕，且 v2 已完成引擎重建。**
> v1 的"纯 2D 图层 × factorX/factorY"方案已被淘汰：v2 引擎是 three.js/WebGL 真透视场景（depth/orientation/lit 深度模型），并已交付 Electron 桌面应用。**v2 架构与功能以 README.md 为准**；本文保留为项目演进记录，技术断言已更新到 v2 现实。

## 0. 任务定义
为大二 CS 用户构建简历级开源工具：**HD-2D 多层视差像素场景编辑器**。
- 形态：Web + Electron 桌面应用（Vite + React + TS；核心引擎与 UI 分层，`src/core/` 不依赖 React，套壳零成本——v2 已兑现）
- 稀缺性依据（GitHub 官方接口实测）：`2.5D pixel scene editor` = **0 仓库**；`parallax editor pixel` = 2 个 0-star 废弃品
- 竞品边界（不踩别人地盘）：
  - 不做完整 3D 引擎（那是 UE4 HD-2D 路线，逸剑风云决/八方旅人，一个人玩不起）——但 v2 用 three.js 提供**轻量的真透视**：贴图平面 + 透视镜头，得到真实视差/遮挡/近大远小
  - 不做瓦片地图（Tiled / LDtk 的领地）
  - 不做像素绘制（Aseprite 的领地）
  - **只做**：图层深度编排 + 灯光氛围 + 透视镜头实时预览 + 导出运行时 JSON
- 定位一句话：穷人版 HD-2D 的专用工具

## 1. 范围（v2 核心闭环，全部已交付）
1. **图层管理**：图片导入（拖拽/文件选择）、图层列表（排序/显隐/重命名/删除）
2. **深度模型**：每层 `depth`（焦平面=0）、`orientation`（vertical 广告牌 / ground 地面平面）、`lit`、缩放、偏移
3. **灯光氛围**：景深（DOF）、雾、环境光 + 方向光，每场景可调
4. **透视镜头**：拖动平移、滚轮推拉（40–400%）、右键/Alt 环绕、R 复位；空格播放运镜路径（sweep/orbit/dolly）
5. **撤销/重做**：快照历史（Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y），滑杆拖动合并
6. **数据**：scene.json v2 schema 导出/导入；v1 文件自动迁移（`depth = D·(1 − factorX)`）；localStorage + IndexedDB 自动保存
7. **导出**：scene.json（内嵌 base64）或 zip（scene.json + assets/*.png）+ three.js runtime.html（CDN import map，免构建——闭环证明）
8. **桌面应用**：Electron 沙箱渲染进程、原生保存/打开对话框、Ctrl+S/Shift+S/O、最近文件、.pixelstage.json 文件关联、`npm run dist` 产出 NSIS 安装包 + 便携 exe

**后续候选（本期不做，架构预留）**：测试角色层间遮挡仿真、镜头关键帧路径编辑、无限平铺层

## 2. 技术栈决策（面试可讲原则）
- 构建：Vite + React 19 + TypeScript
- 渲染：**three.js（裸用，不套 R3F）**——真实透视相机/灯光/DOF；渲染循环保持命令式，与导出的 runtime 逐行对应，面试能逐行讲。v1 的自写 Canvas 2D 循环已被取代：Canvas 2D 做不了透视
- 状态：Zustand（编辑器单文档状态模型）+ 快照式撤销/重做（快照让 undo/redo 约 40 行，命令模式要侵入每个 action）
- UI：Tailwind CSS + 自绘面板组件（工具向暗色低饱和主题，参考 Linear/VSCode 质感）
- 存储：localStorage + IndexedDB 自动保存 + 项目文件导出/导入；Electron 走原生对话框（`src/core/platform.ts` 平台缝）
- 质量：场景迁移/序列化、运镜路径为纯函数核心，vitest 单测覆盖

## 3. 阶段规划（历史记录，已全部完成）
| 阶段 | 动作 | 产出 | 状态 |
|---|---|---|---|
| S0 基建 | 项目骨架 | 可跑的空壳项目 | ✅ |
| S1 设计 | 编辑器 UI 设计规范 | design/*.md 设计稿 | ✅ |
| S2 契约+实现 | 场景 JSON schema + 引擎/UI/数据层 | v1 全功能 | ✅ |
| S3 集成验证 | build、checklist 走查 | 可构建主分支 | ✅ |
| S4 交付 | README + demo 素材 | 可预览版本 | ✅ |
| S5 v2 重建 | three.js 引擎、深度模型、灯光/DOF、运镜路径、撤销/重做 | HD-2D 引擎 | ✅ |
| S6 桌面化 | Electron 沙箱应用、项目文件工作流、zip 导出、NSIS/便携包 | v2.0.0 | ✅ |

## 4. 验收标准（v2，全部已通过）
- [x] `npm run build` / `npm run test` 零错误（vitest：场景 v1→v2 迁移、运镜路径）
- [x] 首屏可导入 ≥3 层 PNG，拖镜头实时看到透视视差差异
- [x] 每层 depth/scale/offset/orientation/lit 修改即时生效
- [x] 导出的 scene.json 能被 runtime.html（three.js，CDN import map）复现同样画面（闭环证明）
- [x] 非内嵌导出产出真实 zip（scene.json + assets/*.png）
- [x] localStorage 刷新不丢场景；v1 存档静默迁移
- [x] Electron：`npm run dist` 产出 NSIS 安装包 + 便携 exe；双击 .pixelstage.json 打开
- [x] README 含 demo 说明 + 「技术决策」章节（面试逐行可讲）

## 5. 风险与备注
- 大图多图层性能：限制单图 ≤4096px / 8MB；纹理进缓存（NearestFilter），DOF 合成器半分辨率渲染
- WebGL 上下文丢失：监听 `webglcontextlost` + ErrorBoundary 恢复面板，不白屏
- Electron 二进制在部分网络下载失败：README 给了 npmmirror 镜像修复命令
- 合规：示例场景素材全部程序生成（`src/core/placeholder.ts`，种子确定性）或用户自带，不内置版权素材
