# Browser voice adapter

`@lie/voice` implements the browser half of the Linx protocol without Vue or game dependencies. The default connection is the current origin's `/api/voice` with `ws:`/`wss:` derived from page protocol. A socket factory can be injected for tests; this package never receives provider management keys or device credentials. Worker provisioning/authorization belongs to a separate integration.

## Channel contract

```ts
import { createPcmPlayer, createVoiceChannel, openMicrophone } from '@lie/voice'

const playbackContext = new AudioContext()
await playbackContext.resume() // Run from a user gesture.
const player = createPcmPlayer(playbackContext, () => { /* playback drained */ })
let format = null
const channel = createVoiceChannel({
  tools: [{
    name: 'self.current_character_context',
    description: 'Read the current character context',
    inputSchema: { type: 'object', properties: {}, required: [] },
    execute: async (_arguments, signal) => {
      signal.throwIfAborted()
      return currentCharacterContext // Caller supplies text, never another character's data.
    }
  }],
  onEvent(event) {
    if (event.type === 'ready') format = event.format
    if (event.type === 'audio' && format != null) player.enqueue(event.data, format)
    if (event.type === 'interrupted' || event.type === 'closed') player.stop()
  }
})
await channel.open({ signal: conversationAbortSignal })
channel.startInput()
const microphone = await openMicrophone({ onFrame: (frame) => channel.input(frame), signal: conversationAbortSignal })
// Stop capture before stopInput/close so no late frame is submitted.
await microphone.stop()
channel.stopInput()
// Closing/aborting does not implicitly close a caller-owned playback context.
channel.close()
player.stop()
await playbackContext.close()
```

This sketch assumes microphone/open failures are handled by the caller by closing the channel and stopping playback. Bind every callback to the application's local session, character and connection epoch. Make a new channel for a new connection; `open()` is single-use and there is no automatic reconnect.

- `open()` resolves only after a PCM hello, rejects on close/error/10-second timeout, and stays bound to the provided abort signal until close. Abort closes the channel and cancels pending tools. Caller cancellation after opening emits `closed` rather than a second rejected promise.
- `startInput()` sends `listen.start` once. Default `realtime` mode lets Linx perform VAD/free conversation. Optional `listenMode: 'manual'` asks Linx to wait for `stopInput()`. These functions do not own microphone capture or infer user speech locally. The live free-speech/VAD behavior remains to be verified.
- `input()` accepts **exactly 640 bytes**: 320 signed PCM16 little-endian mono samples, 16kHz, 20ms. Call `startInput()` first. `stopInput()` sends `listen.stop` once, without closing the channel.
- `ready.format` has required `format: 'pcm'`, `sampleRate: 16000`, `channels: 1`, `bitsPerSample: 16`, `frameDuration: 20`. This first implementation rejects other codecs/sample rates. This matches the successful probe's negotiated format, rather than assuming the documentation's example Opus output.
- `stt.text` is the provider's recognized input text. `tts.state` is `start`, `sentence` (provider `sentence_start` text), or `stop`. A sentence is a text segment, **not a completed turn**. `tts.stop` is the end of provider transmission, not proof that the local playback queue has drained. Use the player's `onIdle` callback separately.
- `audio.data` owns a binary PCM frame; playback is a separate concern. Audio outside a TTS sequence is dropped. MCP initialize/list/call are answered from explicitly supplied tools. Tool output is text. Unknown methods return JSON-RPC errors; thrown/timed-out tools return `isError: true`. Tool execution receives an AbortSignal and must honor it when performing side effects. Duplicate request IDs are ignored, preventing duplicate execution during one channel lifetime.
- `interrupt()` sends the documented abort request and immediately emits `interrupted`. The caller must stop its player. Output stays suppressed until the next `startInput()`. It does not clear provider memory, remove history, or establish how much text the user heard. When capture is already active, stop and start input to begin a new accepted output cycle.
- There are no reliable per-turn identifiers on the verified audio frames. A late old response after a new input cycle cannot be distinguished from new output within the same socket. For character/session isolation, **close the old channel** and discard its epoch. Live abort effectiveness is not yet verified. The application must decide how interrupted text enters history; this adapter does not mark an entire returned sentence as heard.
- `closed` reports the close code/reason once; `error` reports connection, protocol, timeout or tool failures. Tool failure does not close an otherwise healthy channel. No provider error contents are copied into diagnostics.

## Audio utilities

- `createPcmEncoder(actualSampleRate, onFrame)` resamples mono float samples to 16kHz, encodes PCM16LE, and emits complete 20ms frames. It keeps weighted averaging across chunk boundaries (including 44.1kHz). This is a basic voice resampler, not a studio-quality band-limited converter. `flush()` pads one final partial frame with silence; microphone stop deliberately drops a partial frame, avoiding late submissions after teardown.
- `openMicrophone()` requests mono audio with echo cancellation/noise suppression, uses the AudioContext's **actual** sample rate and an AudioWorklet, and feeds complete PCM frames. The graph's output gain is zero so the microphone is never monitored through the speakers. It owns/releases its tracks, graph, worklet port, module URL and AudioContext, including permission/init failure and cancellation while waiting for permission. AudioWorklet/module loading requires a secure context and CSP allowing `blob:` worklet modules. No ScriptProcessor fallback or external audio SDK is included.
- `createPcmPlayer(context, onIdle)` schedules PCM buffers in sequence in a caller-owned/resumed AudioContext. `stop()` immediately stops/disconnects every queued source and clears its timeline. A 30-second queue limit prevents runaway buffering. Provider `tts.stop` should not call `stop()`; otherwise the end of the spoken answer would be cut off.

## Validation

Run `npm run typecheck --workspace @lie/voice` and `npm run test --workspace @lie/voice` after installing the repository's existing development dependencies. No new dependencies are required.

Automated tests use fake WebSockets, AudioContexts, microphone streams and worklet ports. They cover handshake/codec failure/timeout, input framing, TTS ordering, MCP discovery/duplicate/error/timeout, cancellation and late callbacks, interrupt suppression, actual-rate/chunk-independent resampling, byte order/clipping/padding, playback scheduling/queue clearing, permission denial and resource teardown.

These tests do not prove live microphone recognition, audio quality, browser autoplay policy, worklet loading under the deployed CSP, actual upstream abort, provider VAD, role context obedience or cross-connection memory isolation. The earlier disposable probe verified hello/MCP/text-detect/TTS PCM through the public Cloudflare relay; this package has not been exercised against live credentials. Real browser/device acceptance and the application history policy remain separate tasks.

Protocol reference: [Linx WebSocket protocol](https://linx.qiniu.com/docs/xrobot/platform/websocket), checked 2026-10-23. The verified disposable probe is the source for the PCM output format; no additional provider endpoints are invented here.
