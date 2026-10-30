# 16kHz playback-context candidate

2026-10-30. Status: isolated local candidate, awaiting native/browser checks and the user's listening confirmation. No main integration, push or deployment is authorized by this preparation.

## Scope and rationale

Base: reviewed local main `f86206611dbc0a10260fb1605d9a616b22493dc3`. The only product change requests `new AudioContext({ sampleRate: 16000 })` in the default playback factory in `apps/web/src/application/liveVoice.ts`. Existing 16k PCM buffers then match the playback graph rate. Streaming chunks, 100ms prebuffer, scheduling/stop/flush, duplex behavior, independent microphone context, gateway CPU budget and all other controls remain unchanged. There is no fallback, Worklet, ring buffer, custom resampler or whole-answer buffering.

[W3C constructor rules](https://www.w3.org/TR/webaudio-1.0/#dom-audiocontext-audiocontext) require final output resampling if the requested graph rate differs from the output device; they warn that this may increase latency. [AudioContextOptions.sampleRate](https://www.w3.org/TR/webaudio-1.0/#dom-audiocontextoptions-samplerate) specifies unsupported-rate failure. Existing bridge startup failure cleanup handles constructor failure; no silent return to the device rate is added. Browser support and user-perceived latency/quality must be checked separately.

The independent three-generation investigation at commit `546f61fe52d02db01e5b7a6736570e76219f7604` found 16k graph output matched its continuous-run reference, while 48k output had source-boundary differences shared by all three generations. In its DC case there were 10 whole-buffer differing samples and 9 internal-seam differences; the remaining difference was not localized. It did not establish a new 100ms regression or the root cause of the user's electrical-sounding artifact. This bounded candidate tests whether graph-rate alignment helps; it is not a proven audio-quality fix.

At 16k the existing 256-frame submission lead equals 16ms; at 48k it equals about 5.33ms. The candidate changes neither that formula nor threshold. Added device resampling and real callback behavior may further affect latency; arithmetic alone is not a real-device latency measurement.

## Checks already complete

- Node 24.22.1, reused read-only; fixed dependency tree copied into this worktree's ignored tmp, with workspace links redirected here. Manifests/lock unchanged.
- Voice `tsc`, web `vue-tsc`: passed.
- Web bridge/prebuffer/capture-readiness: 3 files, 32 checks passed using fakes only.
- Voice PCM/player/microphone: 3 files, 29 checks passed using fakes only.
- Production web build and required appearance generation: passed. Existing Vite native-config-extension and static underline URL warnings remain; no new failure.
- Product diff is the single playback constructor line. No constructor-argument-only test was added.

## Browser/native and listening gate

Pending: current actual player versus continuous-run native reference, 16k/48k, three synthetic signals, all-early and exhaustion (12 cases), plus real AudioContext 16000Hz construction/close without output, capture or provider. The full prior 72-case generation comparison will not be repeated. These checks cannot prove the final device resampler's audible quality.

IAB was attempted and unavailable. Only an agent-created Chrome tab is allocated; user tabs are not touched. Ports 5545 (frontend) and 5546 (local gateway) were allocated by the coordinator and initially checked free; no services have started yet. They will bind only 127.0.0.1, recheck ownership/listeners before starting, use the existing same-origin proxy/environment mechanisms, and read private configuration only through an ignored reference to the existing gateway config. No secret content is read or printed. Private-path HEAD checks must pass before user handoff.

Service receipt (PID/PTY/internal listeners/source SHA/consumer/stop condition), native results and browser checks will be completed before the user is given a listening entry. The user alone starts mic/provider voice. Services remain owned until that consumer ends, then Ctrl-C and listener verification. No shared launchd service, protected port, provider resource or account setting is changed. Initial code review and user listening confirmation precede any request to the main coordinator for integration review.
