# Bounded realtime PCM probe

Opt-in protocol experiment, not application code. Requires Node 24, installed `ws`, macOS `say` with the named Chinese voice, and FFmpeg. Reuse the project's installed ws via an ignored local node_modules symlink if needed; no lockfiles are modified.

Generate exactly two harmless synthetic input clips (no human microphone):

```sh
mkdir -p spikes/realtime-voice/tmp
say -v 'Eddy (Chinese (China mainland))' -o spikes/realtime-voice/tmp/question-one.aiff '请告诉我你的名字和口令。'
say -v 'Eddy (Chinese (China mainland))' -o spikes/realtime-voice/tmp/question-two.aiff '请再说一次你的名字和口令。'
ffmpeg -v error -i spikes/realtime-voice/tmp/question-one.aiff -ar 16000 -ac 1 -f s16le spikes/realtime-voice/tmp/question-one.pcm
ffmpeg -v error -i spikes/realtime-voice/tmp/question-two.aiff -ar 16000 -ac 1 -f s16le spikes/realtime-voice/tmp/question-two.pcm
node --use-system-ca spikes/realtime-voice/resources.ts --key-file /path/to/private/.linx-api-key
node --use-system-ca spikes/realtime-voice/probe.mjs
node --use-system-ca spikes/realtime-voice/resources.ts --key-file /path/to/private/.linx-api-key --cleanup
```

Run cleanup even if the probe fails. Resources creates/reuses only its `LIE-realtime-test-*` agent and three recorded devices; the probe uses the first. It never modifies the separate browser-test device. State is private mode 0600 under this directory's ignored tmp, with per-operation cleanup progress. Keep state until cleanup succeeds. Management key is read only from the explicit path and is never exported. PCM and result files are ignored; do not commit them. Cleanup removes remote device bindings and the agent, then state; local synthetic audio/results remain ignored.

The probe sends hello and answers MCP initialize/tools/list/context requests. One `listen.start` with realtime and a fixed candidate voice ID is followed by 640-byte PCM frames at 20 ms intervals, including silence; there is **no listen.stop, text.detect or client abort**. Two questions must each produce STT, a context read and ordinary TTS completion. A third input triggers an answer; 250 ms after its TTS start the second clip is injected to test provider-driven interruption and a fourth recovered answer. The whole connection has a 150-second deadline; phase waits are bounded and the sixth answer start halts the experiment. Quota errors halt without retries.

Logs contain stage timings, counts and aborted flags, not transcripts, context payloads, IDs or secrets. The synthetic “password” is fixed fictional test material in source. `results.json` records the same sanitized summary. Positive results demonstrate this real supplier protocol trace only: no claim of human ASR accuracy, speaker AEC, perceptual voice selection or general ordering guarantees. See `docs/realtime-voice-validation.md`.

## Isolated human-microphone harness (not yet accepted)

```sh
node --use-system-ca spikes/realtime-voice/harness-server.mjs --state-file /path/to/root-owned/linx-game-state.json
```

Opens only loopback `http://127.0.0.1:5188/` (optional `--port`). It reads device index **1**, never device 0, from the explicit state and leaves those root-owned resources/configuration intact. Before use, the owner must confirm device 1 is not otherwise active. It serves only the harness, shared voice source and dependencies; credentials/state are not browser assets. Fixed upstream only, strict exact Origin/Host, one active connection, 64KiB payload and three-minute lifetime; no public deployment/auth changes.

The page is clearly an experiment. Nothing connects or requests the microphone until its start button is clicked. It reuses `packages/voice` microphone/PCM player code, sends realtime PCM, supplies one fictional character context, shows STT/TTS/aborted counts and transient text, clears playback immediately on aborted stop, and closes capture/transport/player on end, hidden document or page exit. No raw human audio or transcripts are logged/persisted by this harness. Supplier processing remains subject to its service behavior. Ctrl-C stops only the harness; do not run resources cleanup against the root-owned state.

TypeScript/syntax checks, HTTP module compilation and wrong-Origin rejection were checked without starting a real browser microphone session. The in-app browser was unavailable to this agent during the final harness check; root must inspect the page before handing it to the user. Microphone playback/AEC and single-active behavior under a successful real connection remain unverified. `abortToPlayerStopMs` measures local API-call delay after receiving aborted, not when the user began speaking or the physical speaker became silent. Have the participant explicitly judge external-speaker stopping delay; do not infer that from the local number.
