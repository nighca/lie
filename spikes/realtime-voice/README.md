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
