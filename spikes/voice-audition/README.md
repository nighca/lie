# Voice audition protocol probe

Opt-in supplier experiment, not a final appearance contract or voice mapping. Requires Node 24, the repository's installed `ws`, and the existing `say`/FFmpeg tools for the optional local synthetic input. No dependencies or locks are changed. An ignored local node_modules symlink can reuse the installed ws.

```sh
mkdir -p spikes/voice-audition/tmp
say -v 'Eddy (Chinese (China mainland))' -o spikes/voice-audition/tmp/input.aiff '请朗读这句话，今天阳光很好，我们准备开始调查。'
ffmpeg -v error -i spikes/voice-audition/tmp/input.aiff -ar 16000 -ac 1 -f s16le spikes/voice-audition/tmp/input.pcm
node --use-system-ca spikes/voice-audition/resources.ts --key-file /path/to/private/.linx-api-key
node --use-system-ca spikes/voice-audition/audition.mjs
node --use-system-ca spikes/voice-audition/resources.ts --key-file /path/to/private/.linx-api-key --cleanup
```

This creates at most one `LIE-voice-audition-*` generic agent and one device, recording 0600 state in ignored tmp. It never targets browser/harness resources. Always run cleanup after success or failure; it records successful management steps and removes state only after remote cleanup. On transient TLS cleanup failure inspect retained state and retry cleanup, not inference.

The three listed candidate voices each get one new connection to the same generic agent/device. The voice ID is supplied only on `listen.start` with realtime. Input is one locally synthesized harmless PCM question, uploaded in 20 ms frames with silence after it; there is no microphone or listen.detect. MCP supplies fixed fictional audition context. Each sample requires hello, STT, a context call, one TTS start, stop and audio. Any failure/quota halts the sequence without retries. Per-connection deadline 45 seconds, at most three requested answers per run; do not automatically rerun the paid experiment.

Generated WAVs, credentials, catalog snapshots and results stay ignored; do not commit audio without separately checking distribution rights. No remote public demo is downloaded. Logs contain identifiers of public candidate voices, counts/timings, an audio hash and fixed-line match flag, never keys/device IDs or private transcripts. Different audio hashes do not prove different voice identities. Listen to the two generated samples and compare all three official demo links before approving any mapping. Successful outputs show the voice parameter is compatible with this protocol path, not that the supplier has audibly honored each ID.

The first run obtained two samples, then stopped on a third-attempt failure and cleaned up resources. That run lacked per-failure stage diagnostics; do not infer its cause. The current script additionally records a sanitized `failure.json` for a future explicitly authorized run, without rerunning the paid experiment to improve logs. Agent-default before/after verification was interrupted too and is not reported as passed.
