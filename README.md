# PixelStage

**HD-2D for the rest of us.**

An open-source editor for layered pixel scenes in real 3D — import your art, place each layer at true depth, light it, orbit a perspective camera, then export one portable `scene.json` plus a single-file three.js runtime. No Unreal pipeline. No engine lock-in. No cost.

## Download

👉 **[Releases](../../releases/latest)** — Windows installer & portable exe

The web version runs anywhere with zero install — see the repo's About section for the live demo link.

## Features

- **Direct manipulation** — click sprites right in the viewport; drag to move, Shift+drag pushes depth, Ctrl+drag snaps to 8px
- **True 3D depth** — depth from −400 to +800 px, vertical or ground orientation, lit/unlit per layer
- **3D camera + bookmarks** — drag to pan, right-drag to orbit, wheel to dolly; save camera shots
- **Effects stack** — DOF, fog, ambient/sun, bloom, color grade, film grain, particles
- **Export** — `scene.json` + one-file three.js runtime, looping WebM video, or current-frame PNG
- **Local-first** — autosaves to your machine; no account, no cloud, no telemetry

## Keyboard-first

`Space` play path · `F` focus layer · `R` reset camera · `G` depth grid · `[` `]` depth · `-` `=` scale · `,` `.` rotate · `X` `Y` flip · `H` hide · `L` lock · `Ctrl+D` duplicate · `Ctrl+C/V` copy-paste · `?` full list

## Develop

```bash
npm install
npm run dev            # web dev server
npm run electron:dev   # desktop app
npm run dist           # build Windows installer (dist-electron/)
```

Stack: React 19 · TypeScript · Vite · three.js · zustand · Tailwind · Electron

## Gallery

Four hand-crafted demo scenes ship with the app (village / snowfield / ruins / neon alley). Export your scene.json with embedded assets and open a PR against `gallery/` to add yours.

## License

[MIT](LICENSE) — use the tool, the JSON, and the runtime snippet in any game, commercial or not.
