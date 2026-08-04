# info.md — PixelStage 产品研究（供 Designer 参考）

## 产品定位
- 名称：**PixelStage**（2.5D Pixel Parallax Scene Editor）
- 一句话：面向独立像素游戏开发者的纯 2D 多层视差场景编辑器——导入分层素材，调每层视差系数，虚拟镜头实时预览，一键导出运行时 JSON。
- 定位类比：**"穷人版 HD-2D 的专用工具"**。逸剑风云决 / 八方旅人用 UE4 真 3D 管线做 HD-2D（单个独立开发者玩不起）；独立开发者用纯 2D 图层视差伪造纵深感，但这条路上没有专业工具。
- GitHub 稀缺性（官方接口实测 2026-07-31）：`2.5D pixel scene editor` = **0 个仓库**；`parallax editor pixel` = 2 个 0-star 废弃品。

## 目标用户
- 独立像素游戏开发者（Electron / Phaser / Godot 等 2D 技术栈做 2.5D 视差场景）
- 项目的首个用户就是作者本人：正在开发逸剑风云决风格的 2.5D 像素游戏

## 竞品边界（不做什么）
- Tiled / LDtk：瓦片地图编辑器，不管多层视差
- Aseprite：像素画绘制工具，不管场景编排
- Unity/UE 自带方案：重型 3D 管线
- **本工具只做**：图层视差编排 + 虚拟镜头预览 + 导出运行时 JSON

## MVP 功能清单（v1 核心闭环）
1. **图层管理**：导入 PNG/JPG（拖拽 + 文件选择），图层列表支持排序 / 显隐 / 重命名 / 删除
2. **视差参数**：每层 factorX / factorY（0 = 锁死不动，1 = 完全跟随镜头）、缩放、初始偏移
3. **虚拟镜头**：画布内拖动模拟镜头移动，各层按系数实时产生视差位移；自动往返播放开关
4. **导出**：场景 JSON（图层顺序、资源、视差系数、画布尺寸）+ 最小 runtime 消费说明
5. **持久化**：localStorage 自动保存 + 项目文件导入 / 导出

## 技术要点（供实现参考，非设计决策）
- 视差核心公式：`screenPos = layerBasePos - cameraPos × layerFactor`
- 技术栈：React 19 + TypeScript + Vite + Tailwind v3.4.19 + shadcn/ui；**自写 Canvas 2D 渲染循环**（不依赖 PixiJS，项目要求每一行可讲解）；Zustand 状态管理
- 纯前端、无后端、无账号；BrowserRouter

## 产品气质关键词
专业开发者工具（dev-tool）、编辑器三栏布局、像素游戏文化、开源工具、深色低饱和
