# plan.md — PixelStage：2.5D 像素视差场景编辑器

## 0. 任务定义
为大二 CS 用户构建简历级开源工具：**纯 2D 多层视差像素场景编辑器**。
- 形态：Web 优先（Vite + React + TS），架构预留 Electron 套壳（核心逻辑与 UI 分层）
- 稀缺性依据（GitHub 官方接口实测）：`2.5D pixel scene editor` = **0 仓库**；`parallax editor pixel` = 2 个 0-star 废弃品
- 竞品边界（不踩别人地盘）：
  - 不做 3D（那是 UE4 HD-2D 路线，逸剑风云决/八方旅人，一个人玩不起）
  - 不做瓦片地图（Tiled / LDtk 的领地）
  - 不做像素绘制（Aseprite 的领地）
  - **只做**：图层视差编排 + 虚拟镜头实时预览 + 导出运行时 JSON
- 定位一句话：穷人版 HD-2D 的专用工具

## 1. MVP 范围（v1 核心闭环）
1. **图层管理**：图片导入（拖拽/文件选择）、图层列表（排序/显隐/重命名/删除）
2. **视差参数**：每层 factorX / factorY、缩放、初始偏移
3. **虚拟镜头**：拖动模拟镜头移动，实时预览各层视差；自动往返播放开关
4. **数据**：场景 JSON schema 导出/导入；localStorage 自动保存
5. **导出**：场景 JSON + 最小运行时消费说明（附 ~20 行 runtime 伪码，证明闭环）

**v1.1 候选（本期不做，架构预留）**：测试角色层间遮挡仿真、镜头路径编辑、无限平铺层

## 2. 技术栈决策（面试可讲原则）
- 构建：Vite + React 18 + TypeScript
- 渲染：**自写 Canvas 2D 渲染循环**（不用 PixiJS——每层就是 drawImage + offset，自写能逐行讲清，简历加分）
- 状态：Zustand（编辑器单文档状态模型，轻量）
- UI：Tailwind CSS + 自绘面板组件（工具向暗色低饱和主题，参考 Linear/VSCode 质感）
- 存储：localStorage 自动保存 + 文件导出/导入
- 质量：视差计算/序列化为纯函数核心，vitest 单测覆盖

## 3. 阶段规划与技能加载（渐进加载，到阶段才读技能）
| 阶段 | 动作 | 加载技能/工具 | 产出 |
|---|---|---|---|
| S0 基建 | 读 vibecoding-webapp-swarm 指南；建工作区 + 项目骨架 | vibecoding-webapp-swarm、swarm-workspace | 可跑的空壳项目 |
| S1 设计 | 编辑器 UI 设计规范（布局/主题/交互细节） | musepool（反 AI 审美灵感） | 设计 brief |
| S2a 契约 | 场景 JSON schema + 模块接口冻结（并行前置） | — | schema.ts 定稿 |
| S2b 实现 | 3 个并行 sub-agent：渲染引擎 / 编辑器 UI / 数据层 | vibecoding-webapp-swarm 派发 | 各分支代码 |
| S3 集成验证 | 合并分支、build、功能 checklist 走查、修 bug | verifier sub-agent | 可构建主分支 |
| S4 交付 | README + demo 素材、保存网站版本、输出简历写法 | website_version_manager | 可预览版本 + 简历文案 |

## 4. S2b Sub-agent 任务卡（各自拿 guidance+context+mission）
- **Agent-Render**：场景模型 → Canvas 2D 渲染循环；视差公式 `screenPos = layerPos - cameraPos × factor`；镜头拖动/缩放；自动往返播放
- **Agent-UI**：左侧图层面板 / 中间画布容器 / 右侧属性面板 / 顶部工具栏；图片拖拽导入；基础快捷键
- **Agent-Data**：场景 schema 落地、序列化/反序列化、localStorage 持久化、项目导入导出、内置示例场景

## 5. 验收标准（二进制，不过就返工）
- [ ] `npm run build` 零错误
- [ ] 首屏可导入 ≥3 层 PNG，拖镜头实时看到差异视差
- [ ] 每层 factor/缩放/偏移修改即时生效
- [ ] 导出 JSON 能被 ~20 行独立 runtime 复现同样画面（闭环证明）
- [ ] localStorage 刷新不丢场景
- [ ] README 含 demo 图/GIF + 「技术决策」章节（面试逐行可讲）

## 6. 风险与备注
- 大图多图层性能：v1 限制单图 ≤4096px，离屏 canvas 缓存每层位图
- Electron 套壳预留：核心（渲染/数据）不依赖 DOM 之外 API，UI 层薄壳
- 合规：示例场景素材全部程序生成或用户自带，不内置版权素材
