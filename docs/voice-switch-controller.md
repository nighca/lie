# Conversation readiness and character switching

Status: implemented controller portion, pending parent review and integration. Date: 2026-10-25.

Owner: voice-switch-controller specialist. Parent owns App/VoiceControl presentation, combined acceptance and integration. Base: `7249a6f94106ce9fa7aaefdf640222f77ff70188`. Branch: `codex/voice-switch-controller`.

## Behavior and boundaries

- Selecting another person while the current conversation is active, including its preparation period, aborts/closes the old scope before creating the selected person's scope. No active conversation means selection alone. Selecting the same person is a no-op.
- `busy && conversationActive` denotes preparation. `Conversation.open()` resolves only after transport, playback and microphone capture are ready: the existing live implementation awaits channel/microphone/playback and invokes `startInput()` before resolving. The controller starts the shared clock only after that resolution. Ordinary text, listening and meter events before readiness do not change the transcript or feedback; terminal error/closed events still terminate preparation immediately.
- Existing per-scope epochs, session identity, selected character and abort guards reject old events, tool reads and late success/failure. Rapid switches retain only the last scope. Partial old answers are flushed to that person's history before selection changes. The same remaining budget is settled, never reset, and preparation is free.
- Cancel/end, background handling through `endConversation()`, accusation, terminal result, restart, load and disposal revoke the pending scope. No continuation schedules another connection after stopping. Errors retain the selected person and permit a later manual retry; they never retry automatically.
- `startConversation()` is shared by manual start and selection, including caught synchronous `VoicePort.create()` failures. No new provider event, GameView field, readiness timer or retry queue is introduced.

## Checks and failure record

- New independent deferred fake-transport tests: 16 passing, covering shared budget/history, inactive/same selection, A→B→C, early events, six stop paths, terminal preparation events, synchronous creation failure, failed opening, unavailable service and expiry before a delayed timer.
- Existing controller checks plus new checks: 37 passing. Three existing expectations changed for active automatic switching: preparing new scope, ready new scope and content-defined variable-person connection count.
- Complete web suite: 29 files / 261 tests passing; web `vue-tsc --noEmit` passing; `git diff --check` passing.
- Initial direct Vitest/typecheck invocation omitted the repository pretest resource-generation hook: required ignored manifest/avatar files were absent and those suites could not load. Re-ran the normal `npm run test --workspace @lie/web` and `npm run typecheck --workspace @lie/web`, which generated 8 preset definitions / 89 assets and passed. No source adjustment was needed for that setup error.

## Limits and handoff

This portion uses deterministic fake transports/clocks. It establishes controller ownership and close/abort ordering, not real microphone hardware shutdown latency or paid provider behavior. No browser, server, microphone, credentials, network provider, port or service was used. Parent performs combined UI/build/browser acceptance. No main, publication, PR, provider, Editor, asset pipeline or liveVoice implementation changes. A temporary dependency symlink was removed before clean handoff; generated presentation files remain ignored and unchanged by authoring.
