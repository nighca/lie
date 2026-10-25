# Browser game application

This Vue application consumes `@lie/game-core`, `@lie/ui` and `@lie/voice`. Its application controller is plain TypeScript; Vue sees only a public `GameView`, not character profiles or the unrevealed ending.

```sh
npm run dev --workspace @lie/web
npm run typecheck --workspace @lie/web
npm test --workspace @lie/web
npm run build --workspace @lie/web
```

The local server uses port 5176. `/` uses the real voice adapter and requires a compatible same-origin `/api/voice` gateway. No credentials are embedded here. A missing gateway produces a visible recoverable voice error; it never switches to fake responses.

`http://127.0.0.1:5176/?demo=1` explicitly enables fake voice in Vite development mode. It captures no microphone and plays no audio. Click “模拟说话”, then “结束模拟发言” to exercise a fake turn. There is no preset-question selector or text composer. Production builds ignore this demo flag.

The selected first game is 空盒里的纪念章. The canonical source is `content/games/01-empty-medal-box.json`; actual model behavior and player blind tests are still pending. The default is selected in `src/game-config.json`, and `?game=<id>` selects another bundled official content package without changing engine/UI code. CharacterPreset IDs resolve through the independent presentation manifest. Eight reusable character presets come from `design/character-presets`; generated avatars, state portraits and optional animation use the stable `/appearances/` public paths. Missing images retain readable names/initials.

## Controller and connection ownership

`createGameController` takes game loading, a voice port, a clock and a session-ID factory. It exposes commands and `subscribe/getView`. Scope is explicit for session, character and connection epoch. Before switching character, accusing, interrupting, ending, restarting or disposing, it commits visible pending reply text to that character's history and invalidates the old scope. Old events and context-tool invocations cannot update the new turn.

A reply has one pending text string for live display. Normal audio completion commits it with `interrupted: false`; interruption commits it with `interrupted: true`. The interface describes it as displayed transcription, not proof that every word was heard. Player statements remain dialogue entries and never modify case facts.

One connection belongs to one user turn and answer. The real bridge closes it after TTS has stopped and the local PCM queue has drained, then the next turn reconnects. This favors simple cancellation boundaries; handshake latency and real-provider context continuity still need live evaluation. A context tool provides only this character's background, profile and committed history. The provider must be configured to read it before answering.

The real bridge owns its microphone, playback context and PCM player; scope changes stop all of them. Tests inject device and channel fakes to verify stale audio, expired tools, late microphone grants, playback completion and failures. These tests do not certify real microphone ASR, audible playback or deployed-provider behavior.

## Verification boundary

Controller and critical Vue tests cover independent character histories, two sessions, late callbacks, cancelled opens, connection/load failure, wrong accusation and continued questioning, correct reveal and restart. Browser visual verification should use the Codex built-in browser. During this handoff that browser was unavailable while the Mac was locked, so visual/focus/zoom inspection of these screens remains outstanding.

Official cases are discovered from `content/games/NN-<id>.json`, validated and numerically sorted during build. The homepage catalog is derived from those same JSON files, including their authored summaries; no public/games copy or separate registry is maintained. See [authoring](../../content/games/README.md).
