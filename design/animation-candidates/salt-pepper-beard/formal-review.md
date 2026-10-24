# Gray formal-game team QA

This is source-owner team QA, not independent user acceptance. Captured against `http://127.0.0.1:5505/?game=duck-finale&demo=1`, activation worktree originally `/Users/nighca/.codex/worktrees/gray-plum-activation/lie`, on 2026-10-25. Source candidate base: `5c02f2203b8aca411a0bd8155599e864da1a8f9c`, branch `codex/salt-pepper-beard-animation`.

## Observed

- Dedicated Codex in-app browser tab 1 (this agent inventory id 2). No Chrome, shared viewport overrides, microphone permission, real capture, hidden application state mutation, manifest/UI edits, or deployment.
- Actual game entry and 任爷爷 selected through UI. Desktop viewport 1280 × 720, document scrollWidth 1280. Exactly one canvas (1254 × 1254 backing pixels) while animated.
- Default, listening, waiting and speaking captured through the real game demo voice control. Demo timing from `apps/web/src/application/demoVoice.ts`: listening on start, user text at 1200ms, speaking at 1600ms, assistant text at 1900ms. Waiting screenshot captured about 1280ms after start, speaking after another 650ms. These demonstrate simulated state integration only.
- Waiting shows chin-rest/arms folded; speaking shows an open mouth and palm-up arm. Head/neck remain joined, no visible detached parts. Existing short desktop stage clipping retained as instructed.
- UI switch to static 乔姨 shows `/appearances/silver-bun/default.png`; wrapper retains one hidden canvas node rather than removing its DOM element. Switching back initially restored 任爷爷 animation. 周乐 was briefly selected before manifest inspection established it is animated; no acceptance claim for that character.
- Tab-scoped CDP `Emulation.setEmulatedMedia` reduced-motion override yielded `matchMedia(...).matches=true` and canvas `display: none`. Native screenshot saved. Override subsequently cleared with features `[]`.
- Tab-scoped `Network.setBlockedURLs` blocked only `*salt-pepper-beard/animation/package.json*`; static → gray switch displayed `/appearances/salt-pepper-beard/default.png` and canvas `display: none`. Blocking subsequently cleared with urls `[]`.
- Console warn/error reads before and after failure test returned empty arrays.

## Limits and outstanding checks

- The media CDP batch returned after roughly 21109 seconds (parent observed a similar tool stall). This unexpectedly spanned the night. The remaining calls used short batches; the record does not infer that the app ran uninterrupted during the stall.
- By the final recovery check, the activation worktree no longer existed on disk. Creating the authorized temporary iframe shell failed with FileNotFoundError before any write. Parent confirmed ports 5504/5505 had no LISTEN service by the final check; the still-visible tab was cached content, not proof of a healthy service. Final static → gray retry remained static after network blocking was removed; successful restoration after package failure is **not verified** because the source server root had disappeared. Earlier ordinary static → gray restoration was observed before failure injection.
- 391 × 844 same-origin iframe test was not performed because its authorized server root disappeared. No temporary shell was created, no global viewport changed.
- Hidden-tab behavior, intentionally delayed package load / late completion isolation, and static fallback in all voice states were not verified. No `document.hidden` simulation or hidden app-state evaluation was used.
- Screenshots under `evidence/formal-*.jpg` are native browser captures, not modified artwork. No fake-provider result is claimed as live-provider voice behavior.
