# Context frame guard — 2026-10-25

Status: implemented candidate, pending root review/integration. Base `03fcb06b40ad9dc85ce92af5c1dd6723afc10d4a`; owner architecture_code_review. Scope is the routine defensive part of CR01: no new authoring/play limit, initial preflight gate, clipping, summarization, context projection change, retries or provider call.

## Result

The browser voice channel serializes each outbound JSON message once and checks the complete UTF-8 frame before sending. Exactly65,536 bytes remain allowed; larger frames never reach socket.send. This includes successful tool output, tools/list discovery and error envelopes with escaped/long RPC IDs. The existing gateway keeps its independent64KiB enforcement unchanged.

An oversized frame emits `payload-too-large` and closes through the existing bounded channel lifecycle. LiveVoice maps that to the application's `context-too-large` error reason. Controller stops the current voice and displays a specific notice that the character's setting or conversation exceeds transport capacity; displayed transcripts remain and reconnecting will not shorten the context. Normal error notices retain existing wording. No request ID or story content enters this diagnostic.

If an error reply itself is oversized, the channel emits only the frame-size cause and closes once; it does not recursively send another error or overwrite the specific cause with a generic tool failure. There is no partial successful reply. The controller's existing session/epoch cancellation and resource ownership remain unchanged.

## Ownership and dependencies

`packages/voice/src/protocol.ts` holds the browser boundary constant, imported only by channel. The Worker still independently owns its existing constant in `apps/gateway/src/index.ts`. Two independently responsible boundaries deliberately keep this tiny value; gateway has no declared voice workspace dependency, so this patch does not add an undeclared production cross-package import or change package/lock/config. `apps/gateway/test/frame-budget.test.ts` imports the browser's pure constant in tests and feeds the actual relay at the inclusive boundary and one byte above, detecting drift between them.

Voice remains generic and receives only protocol/tool strings; no game rule, character metadata or core import was added. The approved narrow interface change is an optional error reason in the app's ConversationEvent and one controller notice branch. No Application/main/Editor/draft changes. The unrelated stale game-core README line now correctly describes wrong accusation as terminal lost; no rule implementation changed.

## Verification

Final Node24.22.1 with repository locked dependencies (npm11):

- Voice full existing workspace suite: **40 tests /4 files passed**. New cases cover complete escaped-ID/non-ASCII/quote/backslash/newline successful envelope at65,536 and65,537, oversized discovery before readiness, oversized error-ID envelopes with no recursive send, normal tool-error behavior, and reachable inbound request below64KiB whose error response exceeds it. The latter test initially caught a second generic tool error after the size failure; the implementation now emits a tool-failure event only when its error reply was actually sent.
- Focused Web liveVoice/controller: **43 tests /2 files passed**; specific reason propagation, transcript retained, conversation stopped, no automatic new session, microphone/channel/playback-context cleanup once, and existing normal lifecycle coverage.
- Gateway normal fake-upstream suite plus cross-layer frame contract: **12 tests /2 files passed**. No production gateway code changed.
- Voice types, Web types, gateway runtime/script types passed.
- Final Web production build plus strict generated asset check passed:8 presets/89 assets. Gateway production build passed; existing cf workspace auto-configuration warning only. No provider request or deployment.
- Full diff whitespace check passed. No whole-repository suite claim; browser/live supplier behavior not newly certified.

Initial direct Web types encountered absent generated manifest; rerunning through the existing pretypecheck hook generated it and passed. A first command targeted a nonexistent per-voice config; the corrected command ran from the voice workspace. These setup failures are not recorded as passing tests. No extra dev server/browser/port/microphone was started; Miniflare's normal ephemeral fake test harness was disposed by its existing afterAll. Protected user/specialist services were untouched.

## Remaining limitation

This prevents opaque gateway disconnects and provides a useful cause; it does not make an oversized context playable. Valid authors can still create content that exceeds the live context budget, and history can grow beyond it later. Initial diagnostics, any blocking policy, deduplication of context fields or history policies remain separate reviewed/product decisions. Reconnecting with unchanged content is not presented as a repair. Paused access/auth is unrelated and unchanged.

## Handoff

Named changes: channel/protocol/types and channel tests; app liveVoice/voice/controller and focused tests; gateway frame-budget contract test only; one game-core README sentence; this record. No root plan/AGENTS/package/lock changes. Local dependency links and generated ignored build outputs support verification; no shared installed dependency was modified. Preserve this candidate until review; no main/push/PR/deploy action taken.
