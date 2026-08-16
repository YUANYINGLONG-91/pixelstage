# PixelStage

**HD-2D for the rest of us.** 让每个人都用得起 HD-2D。

An open-source editor for layered pixel scenes in real 3D — import your art, place each layer at true depth, light it, orbit a perspective camera, then export one portable `scene.json` plus a single-file three.js runtime. No Unreal pipeline. No engine lock-in. No cost.

开源的 HD-2D 像素场景编辑器：导入分层素材、调节真实纵深、打光、环绕镜头预览，导出一个通用 JSON 和单文件 three.js 运行时。无需虚幻引擎，不被引擎绑定，完全免费。

## Download · 下载

👉 **[Releases](../../releases/latest)** — Windows installer & portable exe（安装版 / 免安装版）

The web version runs anywhere with zero install — see the repo's About section for the live demo link.

## Features · 功能

- **Direct manipulation** — click sprites right in the viewport; drag to move, Shift+drag pushes depth, Ctrl+drag snaps to 8px
  画布直接操作：点击选中、拖动移动、Shift+拖动调纵深、Ctrl+拖动吸附
- **True 3D depth** — depth from −400 to +800 px, vertical or ground orientation, lit/unlit per layer
  真实 3D 纵深：垂直/地面两种朝向，逐层受光控制
- **3D camera + bookmarks** — drag to pan, right-drag to orbit, wheel to dolly; save camera shots
  3D 镜头：平移/环绕/推拉 + 机位书签
- **Effects stack** — DOF, fog, ambient/sun, bloom, color grade, film grain, particles
  完整效果链：景深、雾、环境光/阳光、泛光、调色、胶片颗粒、粒子
- **Export** — `scene.json` + one-file three.js runtime, looping WebM video, or current-frame PNG
  导出：JSON + 单文件运行时、无缝循环 WebM 视频、当前帧 PNG 截图
- **Local-first** — autosaves to your machine; no account, no cloud, no telemetry
  本地优先：自动保存，无账号、无云端、无遥测

## Keyboard-first · 键盘优先

`Space` play path · `F` focus layer · `R` reset camera · `G` depth grid · `[` `]` depth · `-` `=` scale · `,` `.` rotate · `X` `Y` flip · `H` hide · `L` lock · `Ctrl+D` duplicate · `Ctrl+C/V` copy-paste · `?` full list

## Develop · 开发

```bash
npm install
npm run dev        # web dev server
npm run electron:dev   # desktop app
npm run dist       # build Windows installer (dist-electron/)
```

Stack: React 19 · TypeScript · Vite · three.js · zustand · Tailwind · Electron

## Gallery · 画廊

Four hand-crafted demo scenes ship with the app (village / snowfield / ruins / neon alley). Export your scene.json with embedded assets and open a PR against `gallery/` to add yours.

内置四个手工场景（村庄黄昏 / 月夜雪原 / 火把遗迹 / 雨夜霓虹巷）。欢迎导出你的场景提 PR 进画廊。

## License

[MIT](LICENSE) — use the tool, the JSON, and the runtime snippet in any game, commercial or not.
