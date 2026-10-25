# 视觉与首帧/缓存候选组合验证

2026-10-25，owner `/root/character_preset_migration`，借用root候选 `/Users/nighca/.codex/worktrees/integrate-character-preset-dawn/lie`，分支 `codex/integrate-cache-and-animation-loading`。固定HEAD `d9d3e9354833f8585c7126bf8ed6e3e00e8d7314`，开始时clean，检查后HEAD不变、tracked源码/配置无diff。只新增本报告，不commit，不修改已有报告、应用实现、Git引用或main。

## 本轮执行

使用原候选真实本地node_modules、Node **24.22.1**；不安装依赖、不启动浏览器或server、不操作凭据/CI。顺序执行，首失败即停止；本轮无失败，无无因重跑。

| 检查 | 结果 |
| --- | --- |
| Web全套 `npm run test --workspace @lie/web` | **28套245项通过** |
| Web typecheck | 通过 |
| UI typecheck | 通过 |
| Web生产构建 | 通过 |
| postbuild strict | **8预设89资源通过** |

本轮入口产物为 `dist/assets/index-CuJUcgoN.js` 与 `dist/assets/index-DlVZ1tEr.css`；新增视觉改动已实际编译进候选自身Web产物，不依赖源工作树的产物。

## 身份核对与复用边界

使用 `git rev-parse HEAD:<path>` 与专项source相同路径逐项比较Git blob/tree对象ID，全部一致：

- 视觉source **09b10a4973d76da325f0cbb1a3204f11a11f68ba**：App、style、背景姓名helper、4个相关test及两组design原生QA目录、两份实施doc，共11路径/目录一致。
- 首帧source **574cf3ac38b8fd40a0fdec2f1efa8d0a203ab54a**：整个 `packages/ui` tree一致，包含AnimatedPortrait与43项UI测试。
- 性能source **bd724954e4ff8e518730fe8e0a0f15c712286424**：build插件、Vite配置、main、loader/parser、static-assets测试、整个Gateway、根package/lock，共9路径/目录一致。
- 与前一实测候选 **be83810d1dafcf1cc1270520e669885661b24088** 相比，UI、Gateway、build插件、loader、package/lock、Web package、Miniflare verifier及正式素材tree也逐项一致。

因此按root指定范围复用[上一轮组合验证](combined-first-render-verification.md)的UI43、Gateway16、Gateway type、cfbuild及40次实际Miniflare请求契约。此次有变化的App/style/helper和相关测试已由Web245、types及新Web构建验证。复用的是未变化代码/配置/依赖/素材的检查结果；没有声称上一轮cf输出包含本次新Web入口，亦没有重打包或运行本轮CF资产bundle。

原生QA复用[视觉姓名](../../background-character-names.md)、[调查标题](../../investigation-transcript-title.md)、[首帧专项](../../animation-first-render.md)及[be83810组合](combined-first-render-verification.md)所记录的真实证据，依据上述source身份。未新增本候选浏览器验收，也不声称旧截图是新增视觉与首帧同屏的新截图。既有原生证据的IAB/Chrome、391px、人物范围、缺hash浏览器导航被拦截等限制继续适用；本轮不覆盖真人语音、麦克风、Editor草稿或线上部署。

## 生命周期与交回

本轮没有启动、复用或停止任何服务，没有PID/PTY、浏览器标签页或覆盖需要清理；没有触及8787/8788/5355/5507及其他owner资源。仅产生忽略的生成/build产物与本报告。最终 `git diff --exit-code`、`git diff --check` 通过；HEAD不变，预期唯一untracked文件为本报告。候选交回root，后续串行集成由root负责。

## 实际对象身份

以下为本轮逐项相等断言所用Git blob/tree ID，source值为实际完整提交SHA：

```json
{
  "visual09b10a4": {
    "source": "09b10a4973d76da325f0cbb1a3204f11a11f68ba",
    "paths": {
      "apps/web/src/App.vue": "a1a5989ec5716e820d33b1369dc7c5601764ef62",
      "apps/web/src/style.css": "57ff352d7b418ad8d05fdceff59c27d9d4997edc",
      "apps/web/src/presentation/backgroundCharacterNames.ts": "25696fcf34b621aa45da1bc9b38d23047a7a84a9",
      "apps/web/test/App.test.ts": "6594b9f0fdde2224a311f7558ed01139f26c0066",
      "apps/web/test/background-character-names.test.ts": "d689dd6fed001a8b008eb97940a9ca669e9b8a92",
      "apps/web/test/backgroundCharacterNames.test.ts": "8ac6b629a4e1fd85748d8f2fdcaba6d736bb711c",
      "apps/web/test/investigation-transcript-title.test.ts": "cf3a006d343ca13986098d0fe661c4b63ee59fa6",
      "design/background-character-names": "770701ca683acd0dffe69e0c53fef4a5b90db524",
      "design/investigation-transcript-title": "6705688885f738a29e7fe081f9cf85c930196713",
      "docs/background-character-names.md": "511b5a4f9b0ab0ce0f00c003b1465f5029043ffd",
      "docs/investigation-transcript-title.md": "ab170428cc2d1b24d4074270ee58d5ffd4265641"
    }
  },
  "animation574cf3a": {
    "source": "574cf3ac38b8fd40a0fdec2f1efa8d0a203ab54a",
    "paths": {
      "packages/ui": "3d36db2888d208078dfeed6404dcaa78dbc900ce"
    }
  },
  "performancebd72495": {
    "source": "bd724954e4ff8e518730fe8e0a0f15c712286424",
    "paths": {
      "apps/web/build": "6345146100ca3cbfe1265ed9fdc3bc226d1bb663",
      "apps/web/vite.config.ts": "90b775589271457c4dc142e3e259780ccbc0a636",
      "apps/web/src/main.ts": "f9b57fd3a7b92dce7c9ee64bb6b82a0ab7fada29",
      "apps/web/src/presentation/characterPresetLoader.ts": "218207672b7c491452659484cbbaaaf3d7552dc9",
      "apps/web/src/presentation/characterPresets.ts": "7f2ea622365fe338e4acd2ae1781c96d78ea2ab6",
      "apps/web/test/static-assets.test.ts": "c78d14c1af5a825c67870c04effd2eed670cc911",
      "apps/gateway": "962b7d6fdc38a7d50d97c1ee2ef5377631e60e32",
      "package.json": "04d77f7a86ddb335232ed2b96448cfe79f3ac8a1",
      "package-lock.json": "ace0d60809d80f6240e71ebda6c5bc1851338732"
    }
  },
  "reusebe83810": {
    "source": "be83810d1dafcf1cc1270520e669885661b24088",
    "paths": {
      "packages/ui": "3d36db2888d208078dfeed6404dcaa78dbc900ce",
      "apps/gateway": "962b7d6fdc38a7d50d97c1ee2ef5377631e60e32",
      "apps/web/build": "6345146100ca3cbfe1265ed9fdc3bc226d1bb663",
      "apps/web/src/presentation/characterPresetLoader.ts": "218207672b7c491452659484cbbaaaf3d7552dc9",
      "package-lock.json": "ace0d60809d80f6240e71ebda6c5bc1851338732",
      "package.json": "04d77f7a86ddb335232ed2b96448cfe79f3ac8a1",
      "apps/web/package.json": "17509b66a8d38f834ddedf07c4dd43a5ee24c659",
      "docs/performance/2026-10-25/verify-build.mjs": "c811f557d5c593c01951e2b53930c843846585b9",
      "design/character-presets": "13f95a7f022716d08fbffc8ae41c5f1aca7c2797"
    }
  }
}
```
