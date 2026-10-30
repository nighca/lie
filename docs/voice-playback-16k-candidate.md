# 16kHz playback-context candidate

2026-10-30. Status: native/browser checks and the reported local user listening acceptance passed; ready for coordinator review. This specialist has not integrated, pushed or deployed the candidate.

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

## Native/browser verification

At 2026-10-30T13:39:25.160Z in an agent-owned Chrome 155 tab (IAB was attempted and unavailable), the real AudioContext constructor reported:

| Requested rate | Actual graph rate | Initial state | baseLatency | outputLatency | After close |
| --- | ---: | --- | ---: | ---: | --- |
| 16000 | 16000 | running | 0.008s | 0s | closed |
| default | 48000 | running | 0.005333333333333333s | 0s | closed |

These contexts had no connected sources, no explicit resume and no speaker output, microphone or provider. The constructor check used the same options as the reviewed factory; the actual default bridge was not opened because that would start capture/provider. Separately the served `liveVoice.ts` module was checked to contain the candidate factory. API-reported latency values, especially outputLatency=0 without active playback, are not an end-to-end hardware latency measurement or audible-quality acceptance.

The candidate's actual unchanged player/PCM TS was stripped using Node 24.22.1 (experimental warning), with only its PCM import redirected, then exercised through native OfflineAudioContext buffer/source methods. A controlled enqueue clock generated ten 20ms packets from each continuous synthetic 200ms signal; each contiguous scheduled run was compared to one source containing that run's identical PCM and onset. This is not whole-answer buffering in the product. Native result:

| Signal/mode | 16k max error / differing samples | 48k max error / differing samples | Actual scheduled gap at both rates |
| --- | --- | --- | --- |
| DC/all-early | 0 / 0 | 0.25 / 10 | 0ms |
| DC/exhaustion | 0 / 0 | 0.25 / 8 | 50ms |
| Sine/all-early | 0 / 0 | 0.19781494140625 / 28 | 0ms |
| Sine/exhaustion | 0 / 0 | 0.19781494140625 / 24 | 50ms |
| Speech-envelope/all-early | 0 / 0 | 0.2008056640625 / 28 | 0ms |
| Speech-envelope/exhaustion | 0 / 0 | 0.2008056640625 / 24 | 50ms |

Differing-sample threshold is 1e-6. Gap values include floating-point tolerance below 1e-9ms. All 12 cases passed expected count/total-samples/run scheduling and all six 16k outputs matched their continuous-run reference. The 48k all-early DC peak was 0.5 for source amplitude 0.25, matching the prior bounded observation; it did not establish clipping, which needs full-scale exceedance. No three-generation 72-case replay was performed. Offline success cannot establish final-device resampling quality, real arrival jitter, echo behavior or user listening results.

Source identities: player TS SHA256 `4b1bdfa0b506a02c4aa2066a43438d8a7ea6afaae03a8e7927538a243ef30ab7`; PCM TS `f0d75bcd2d4a3e096aff705b58abea5526c3cc97d62d2f2ea99647f190bfb07f`; native served player module `dd441772b49e68b3fd22f3f1159d5da7f48e1676149775c28e801cae9a91d2e7`. The input signals/method reuse the separately preserved 546f61f investigation; the fixture and full temporary native result remain in this candidate's ignored tmp. This report preserves the necessary numerical results and provenance without committing disposable fixtures/caches.

The actual application loaded the empty-medal-box introduction on the owned tab, with expected case title, three characters and the start-investigation button. No investigation or voice button was clicked. Public `5545/api/voice/status` returned 200/ready; independent gateway `5546/api/health` returned 200/ok and `5546/api/voice/status` 200/ready. A deliberately unrelated Origin on status returned 403. `ready` only shows local configuration availability, not a tested provider connection or independent provider device.

## Isolation, private-path checks and service receipt

The pinned `cf dev [implArgs..]` help and installed handler state that framework commands accept only forwarded --mode; other arguments fail with “Arguments cannot currently be forwarded to the detected dev command ... Run that command directly with the required arguments.” A custom temporary --config is necessary here, so the two services use the same pinned Vite 8.3.5 and existing Cloudflare plugin directly, not Wrangler, with cf 1.0.0-beta.18/typed Worker config unchanged. No Cloudflare account API or deploy command was run for these services.

Temporary configs are `tmp/playback-16k/web.config.ts` and `gateway.config.ts`, importing the unchanged formal configs. Frontend environment `LIE_VOICE_GATEWAY_URL=http://127.0.0.1:5546` uses the established same-origin proxy; gateway host/port are loopback and strict. The ignored gateway `.dev.vars` is a symlink to the existing owning-main ignored file, consumed only by the existing local loader. Its contents were never read, printed or copied, and no provider resource was created or changed. The existing Origin guard remains intact.

The first private-path HEAD gate found 5545 returning 200 for some private-looking paths (body deliberately unread, so no leak conclusion); the real candidate/main `.dev.vars` @fs paths were 403. Both owned services were immediately Ctrl-C stopped (old frontend PID34339/PTY48625, gateway PID33066/PTY74048), with 5545/5546 verified free. Only the temporary frontend wrapper was hardened with the same sensitive-path 404 middleware as the temporary gateway wrapper. The final gate HEAD-checked five path classes on each port: direct `.dev.vars`, candidate gateway `.dev.vars` via @fs, original credential-reference target via @fs, `.linx-api-key`, and `.git/config` via @fs. **All ten returned 404; no private response body was read.** Formal configs were not changed.

Current retained services, owner `/root/audio_start_timing` under the voice-session-limit initiator:

| Service | PID / parent | Original PTY/session | Listeners, all 127.0.0.1 | Cwd |
| --- | --- | --- | --- | --- |
| Frontend Vite | 40024 / 51102 | 8226 | 5545 | candidate `apps/web` |
| Gateway Vite | 39546 / 51102 | 17929 | 5546, internal loopback 63642 | candidate `apps/gateway` |
| Gateway workerd child | 39995 / 39546 | inherited 17929 | internal 63649, 63650 | candidate `apps/gateway` |

The absolute worktree is `/Users/nighca/.codex/worktrees/lie-playback-16k-candidate/lie`, branch `codex/lie-playback-16k-candidate`. Both services started at reviewed code commit `ac1d200486a0eae30c106e0c934ef70fe5bcf42b`, parent f862066. This subsequent report-only commit changes no application or config bytes; the retained service source identity remains ac1d200. All descendants and listener addresses above were read-only checked using ps/lsof. No other child listeners were found for these owned roots. Temporary/environment files and Vite/Miniflare caches stay in this worktree's ignored tmp; self-generated `.cloudflare/types` was identified as this task's output and redirected into that tmp.

Launch commands from their respective app cwd, using the read-only Node24.22.1 toolchain on PATH:

```sh
# apps/gateway, with CF_SEND_TELEMETRY=false and TMPDIR=<candidate>/tmp/playback-16k/cache
node ../../node_modules/vite/bin/vite.js --config ../../tmp/playback-16k/gateway.config.ts --host 127.0.0.1 --port 5546 --strictPort
# apps/web, same TMPDIR; LIE_VOICE_GATEWAY_URL=http://127.0.0.1:5546
node ../../node_modules/vite/bin/vite.js --config ../../tmp/playback-16k/web.config.ts --host 127.0.0.1 --port 5545 --strictPort
```

Consumer transitions from agent no-provider acceptance to initiator review/user listening. The owned Chrome tab1910332085 is left at the introduction, with no mic/provider connection; the initiator gives the user the entry only after handoff review. Entry: `http://127.0.0.1:5545/?game=empty-medal-box`. **The user alone starts live voice.** Retain services only while this approved review/listening consumer exists; when the user finishes or the initiator rejects/cancels the candidate, owner sends Ctrl-C in frontend PTY8226 and gateway PTY17929, then verifies all five listed listeners and both process roots/child are gone. Do not use kill-by-port/pkill or touch another owner. Protected 8787/8788/5176/5198 and 5544 remain untouched.

## User listening acceptance and integration handoff

On 2026-10-30 the user explicitly reported in the initiating chat: “我现在测试的本地版本（http://127.0.0.1:5545）没有电流声了，效果很好”. This is the user's positive listening result for the local candidate whose application code remains ac1d200; the intervening commit 6052919 only records verification. The previously agreed user-listening gate is now satisfied, so the initiator can hand the frozen candidate to the main coordinator for review and integration.

The report does not individually establish browser/device/output configuration, test duration, a complete 600-second session, production behavior, or all-device sound quality. It supports this local improvement without proving that every audible artifact has the same cause. No audio or transcript was collected. Initial full-diff review, the independent HTTP checks and native/fake checks above remain applicable: application source and dependencies have not changed.

The user's message confirms the effect but does not explicitly release the ongoing listening consumer. Keep 5545/5546 under their recorded owner until that consumer is released; coordinate any maintenance separately and do not interrupt an active connection. The coordinator alone owns integration/publication, and this specialist has not changed main, pushed, deployed or modified account/provider settings.


## Consumer release and completed service shutdown

On 2026-10-30 the user explicitly released the listening environment: “好了试听环境我已经用完了，你可以干掉了”. This supersedes the preceding instruction to retain services while the consumer remained active. The positive listening result and frozen code identity above remain unchanged.

The specialist shut down only its owned services using Ctrl-C in each original PTY: frontend session8226 returned exit1; gateway session17929 returned exit130. No kill-by-port, pkill, exact-PID kill, launchd action or unrelated process operation was needed. Both original service roots (40024,39546) and recorded workerd child39995 were subsequently absent. Read-only `ps -p 40024,39546,39995 -o pid,ppid,command` returned only its header with exit1; `lsof` restricted to listeners5545,5546,63642,63649,63650 returned no output with exit1. An additional process check matched the exact candidate workerd executable prefix, excluding the checking shell's own command text, and found zero remaining candidate workerd processes. Final absence verification completed by 14:04 UTC; no current candidate listener or uncertain owned child remains.

Before closing browser content, the specialist rebound only its recorded Chrome tab1910332085 and confirmed that exact tab still showed the candidate's unchanged introduction at `127.0.0.1:5545/?game=empty-medal-box`. It closed that tab through its own handle, then verified the ID was absent from Chrome's tab inventory. No user IAB page, other user tab, microphone, provider connection or transcript was read or operated during shutdown.

Services are now stopped; ports are released. The managed worktree, branch/refs, all ordered commits, source files, ignored native fixtures/results/environment caches and ignored credential symlink are deliberately retained. This was service shutdown only, not worktree or credential/resource cleanup. The latest pre-shutdown HEAD was the initiator's doc-only acceptance commit `c6659274f75b975f7363f1e51d1fc19c0cf5fdc8`, parent6052919; application code remains identical to ac1d200. This appended receipt is another doc-only commit, without amend/rebase, main/push/deploy or provider/account mutation. Protected8787/8788/5544/5176/5198 were not stopped or reconfigured. The initiator reviews this shutdown receipt and the complete ordered commits before its handoff to the sole main integrator.
