# Thin voice gateway

`@lie/gateway` is a Cloudflare Worker serving the prebuilt `apps/web/dist` assets and provider transport. Game rules, character profiles and histories stay in the browser; browser MCP tools supply the active context. Voice identity uses a server-signed browser Cookie and provider binding state, without a voice database, KV or Durable Object. The separate shared-games route can use its configured R2 binding.

## Local checks and build

Use the root engines: Node `>=24.22.1 <25`, npm `>=11 <12`. From the repository root after installing dependencies:

```sh
npm run typecheck
npm test
npm run build
```

The root build generates Web assets before the gateway. If building packages separately, build `@lie/web` first; `@lie/gateway` runs `cf build` through Vite and does not build Web itself. `publicDir` points to `../web/dist`; output under `.cloudflare/` is ignored. The project uses `cloudflare.config.ts`, pinned `cf@1.0.0-beta.18` and `@cloudflare/vite-plugin@2.0.0-beta.v.4`, with no Wrangler configuration. Use `cf`; do not infer account access from successful local builds. Build a clean intended HEAD because the Web version embeds SHA/dirty state.

Current Workers compatibility is `2026-10-23` with explicit `enable_request_signal`, enabling incoming cancellation propagation where supported by the host. Time budgets remain protection even when disconnect notification is delayed. No `nodejs_compat` or Node runtime dependency is required by the Worker. Logs/traces redact query strings; custom logs contain operation/status only, never audio, context, keys, Cookie or token values.

Local configuration and service startup require a current service turn; the user’s 8787/8788 environment and its 5544 consumer must not be duplicated or restarted from this README. Vite proxies voice requests to the configured Worker, preserving the browser’s same-origin paths. Use same-origin HTTP/WS for verification, not a cross-origin direct Worker fetch. The old `.env.example`/experiment exporter describes fixed-device credentials and is not a current Cookie Device setup template.

## Current server configuration

| Binding | Meaning |
| --- | --- |
| `LINX_API_KEY` | Private provider management credential for the approved account/Agent’s device binding and ownership checks. Server secret only. |
| `LINX_WS_TOKEN` | Required existing shared WS credential, used for the first handshake. Server secret; a 401 can trigger one request-local Device OTA refresh. |
| `LINX_AGENT_ID` | Approved existing generic Agent target. Server secret binding; runtime does not create Agents. |
| `VOICE_DEVICE_COOKIE_SECRET` | Independent, cryptographically random signing secret of at least **32 UTF-8 bytes**. Server secret only; use different secrets across environments. |
| `VOICE_DEVICE_ENVIRONMENT` | Nonempty server-owned text namespace; configuration reads `LIE_VOICE_ENVIRONMENT`, default `production`. Changing it invalidates existing identity Cookies. |
| `VOICE_MAX_SESSION_SECONDS` | Server-owned relay limit, default `600`; validation below. |

The four secret declarations are present in `cloudflare.config.ts`; source and Build Output contain declarations, not real values. Supply values only through approved private local/remote configuration. They must never enter `VITE_*`, client assets, Cookie payloads, URLs or committed files. Missing management key/shared WS token/Agent/signing secret, a signing secret shorter than 32 UTF-8 bytes, or an empty environment causes status `unavailable` and rejects prepare/WS with 503. Status `ready` checks configuration presence/shape; it does not authenticate the key or contact the provider.

`LINX_DEVICE_ID` and `VOICE_ACCESS_TOKEN` are not used by the current source; the existing `LINX_WS_TOKEN` is retained as required first-handshake configuration. The former application access check is temporarily disabled by user decision; the identity Cookie is not account authorization, a device lease, a quota or an abuse limit. Enabling online management operations requires the configuration and rollout review in the [release-readiness plan](../../docs/reviews/device-concurrency-2026-11-01/release-readiness.md), before a push that can trigger deployment. Existing legacy secrets must be retained until their consumers and rollback needs are reviewed.

## HTTP and identity contract

All voice endpoints reject query parameters and mismatched Origin; status permits an absent Origin, while POST/WS require exact same origin. Status/prepare also reject `Sec-Fetch-Site: cross-site`. Status/prepare responses are `Cache-Control: no-store`.

| Endpoint | Behavior |
| --- | --- |
| `GET /api/health` | Health JSON; `storage` is `r2` when the shared-games binding exists, otherwise `none`. No provider call. |
| `GET /api/voice/status` | Existing `{"status":"ready"}` or `{"status":"unavailable"}` JSON. When configured, signs/renews the identity Cookie; no OTA/bind/WS. Never returns Device/token. |
| `POST /api/voice/prepare` | Empty content only, with valid signed Cookie. Missing/invalid identity is 409 `identity-required`; bad body400, origin403, configuration503, provider failure502/503 or timeout504. Performs bounded OTA, bind only if needed, and confirmation/ownership checks; success204 with no body or Set-Cookie. |
| `GET /api/voice` | WebSocket upgrade; plain HTTP426, origin403, missing configuration503, invalid identity409. Reads current Cookie and upgrades the fixed upstream using the shared WS token first; only HTTP401 gets one same-Device OTA refresh and one retry. The WS route does not call bind or the explicit prepare flow; a recovery OTA may still register an unbound provider candidate. Normal workflow prepares first; upstream acceptance of a Device without successful preparation is not proven by Cookie signature alone. |
| `/api/shared-games/v1…` | Separate shared-games API; unrelated to voice identity. Other `/api/*` is explicit JSON404. |

On first valid preparation, the browser awaits status Cookie installation before POST side effects. Production Cookie is `__Host-lie-device; Secure; HttpOnly; SameSite=Lax; Path=/`, no Domain, 180-day sliding expiry renewed by status. Exact HTTP loopback uses `lie-device-dev` without Secure; the signed environment claim also separates loopback development from HTTPS. Cookies are not port-scoped: tests must use isolated browser contexts, not overwrite user Cookies on another localhost port.

The signed payload holds version, environment, random locally administered pseudo-MAC Device ID, stable Client UUID and issue/expiry timestamps. It holds no provider credentials or token and is signed, not encrypted. It identifies a browser storage profile, not a physical MAC or user account. Device/Client persist across games and voice sessions; clearing/expiring Cookie or changing signing secret/environment can create a new identity. The gateway constructs `Authorization`, Cookie `Device-Id`/`Client-Id`, `Protocol-Version: 1` and server `X-Agent-ID`. Browser parameters cannot select credentials, Agent or upstream URL.

The upstream is fixed to `https://xrobo-io.qiniuapi.com/v1/ws/`; redirects are not followed. **Current source uses required `LINX_WS_TOKEN` for the first WS handshake**. Only an initial HTTP401 cancels that response body, obtains an OTA token for the same Cookie Device, and retries once inside the original9s budget. A second401, 403, network error or post-upgrade close does not cause more OTA/retry. Refreshed tokens remain request-local: no cache, secret writeback, Device reassignment or automatic reconnect. Narrow real cross-Device token evidence is recorded in the [token study](../../docs/reviews/device-concurrency-2026-11-01/token-study/study.md); production identity/TTL are not inferred from it. A page’s prepared flag is only a hint: WS always uses its actual current Cookie. Two first-time tabs can receive competing candidate Cookies; a late prepare does not overwrite the current Cookie or transfer another identity’s token. Cancelled preparation does not roll back a completed bind.

Same identity’s later WS is expected to displace its earlier connection through the provider; no cross-tab lock, takeover UI or auto-reconnect is added. Different identities have different Device/Client IDs. Fake replacement checks do not prove the supplier’s real concurrency policy. Provider resources outlive Cookie/page closure; there is no automatic TTL unbind. See the [design](../../docs/reviews/device-concurrency-2026-11-01/browser-device-implementation.md) for candidate races, bounded bind reconciliation and ownership limitations.

## Preparation, handshake and relay budgets

Successful/current game load publishes its intro and starts background prepare; restart reuses the app-owned state. Failed/stale/disposed loads do not prepare. No mic, AudioContext, WS or game-budget timer starts during preparation. Conversation opening awaits the same page-owned pending operation, then starts the existing mic/player/channel path; all must be ready before interrogation time is charged. Cancellation invalidates only that conversation’s awaiter; an old generation cannot clear newer prepared state. Failed preparation/WS retries require another explicit user action.

| Phase | Current budget |
| --- | --- |
| Browser prepare | One **20s** deadline shared by status + POST + at most one `identity-required` bootstrap recovery; not 20s per request. |
| Server prepare | **18s** provider-work budget after identity/body checks. Empty-body validation is separately bounded to1s. Each provider HTTP operation, including response-body reading, is at most8s within the remaining outer budget. |
| Gateway WS | **9s** total shared by first handshake, optional401 Device OTA and one retry; no new bind and no reset for refresh. Late successful upgrade after abort is closed without creating a browser relay. |
| Client channel | **10s**, starts at channel.open after prepare, covers gateway upgrade plus hello/MCP tools registration. Not a 10s cap on the full preparation/mic flow. |
| Relay | Default600s wall clock from creating the relay after upstream upgrade; 64KiB per text/binary frame. |

Provider JSON bodies are bounded (64KiB for OTA/bind, 1MiB for ownership listing), with sanitized errors. The relay forwards text and ArrayBuffer frames with `binaryType='arraybuffer'`, without interpreting game MCP. Oversized frames close1009, transport failures1011, abnormal1006 is normalized; closure propagates to both peers. No global connection/rate state or spending cap is claimed.

`VOICE_MAX_SESSION_SECONDS` accepts decimal integers1…2147483; invalid values yield500 on WS before provider work. Default is600 when absent. Expiry closes both peers1000 `Conversation time limit`; silence/traffic does not pause/reset it. The limit includes post-upgrade hello/audio preparation and differs from the browser’s cumulative game budget. A new connection gets a new bounded relay, not a new account quota. `VOICE_MAX_SESSION_SECONDS=900 npm run build` is a configuration example only; changing a shell value alone does not update deployed/existing connections. Do not rely on `.dev.vars` overriding the declared text binding. See [session-limit details](../../docs/voice-session-limit/implementation.md).

## Validation and release boundary

Gateway/workerd fakes cover zero-OTA first-handshake success, bounded401 refresh/body cancellation, no refresh on403/network/post-upgrade close, shared9s budget and cancellation/late-upgrade cleanup, plus identity verification, empty/erroring bodies, bounds/timeouts, concurrent binding recovery, current-Cookie authority, relay closure/limits and late upgrade cancellation. Web tests cover app-owned preparation/generations, cancellation and load timing. The [2026-11-01 acceptance record](../../docs/reviews/device-concurrency-2026-11-01/acceptance/README.md) records clean build, isolated-context fake-provider browser checks and native audio after delayed preparation, including expired transient activation. Those results do not establish live provider behavior, token sharing or production configuration readiness.

Actual secret configuration, real-device acceptance, consumer maintenance, resource ownership and rollback remain explicit steps in [release readiness](../../docs/reviews/device-concurrency-2026-11-01/release-readiness.md). No deployment or provider command below is automatic authorization.

## Historical bounded Linx experiment — 2026-10-23

This section records the earlier experiment, not the current deployment contract. Its quota/configuration observations are dated and must not be treated as current account state.

The opt-in script `scripts/linx-check.ts` creates at most one `LIE-game-test-*` generic agent and three dedicated pseudo-MAC devices, with ignored 0600 state in `tmp/linx-game-state.json`. It uses the official create/update, OTA activation/bind, WSS and unbind/delete APIs. It never modifies the older probe resources. All setup/cleanup is explicit; it does not run during `npm test`.

```sh
npm run test:linx --workspace @lie/gateway -- --key-file /absolute/path/to/.linx-api-key
npm run test:linx --workspace @lie/gateway -- --key-file /absolute/path/to/.linx-api-key --cleanup
```

Inference is opt-in and requires confirmed provider credit. The script now stops further inference immediately when a quota response is recognized. If a run fails, use its recorded state for cleanup; do not discard that state while resources remain. `--cleanup` only unbinds its own recorded devices and deletes its own recorded agent. Successful cleanup removes that state file. Existing probes, other agents and the user's original resources are not cleanup targets.

The generic agent prompt instructs it to call **`self.lie_character_context` before every answer**, use the supplied `background/profile/systemPrompt/history`, and avoid borrowing other characters' or connections' information. This is different from the earlier `self.lie_probe_status` prompt. Configuration was read back as `Memory_nomem` and `chatHistoryConf: 0`. The tool schema/result match the browser bridge's context tool. No game content is uploaded into a permanent role-specific agent.

Six synthetic text-detect conversations were attempted:

| Scenario | Transport facts | AI/context result |
| --- | --- | --- |
| A first connection | Hello + TTS stop + PCM | Quota response, context tool never called |
| Switch to B on another device | Hello + TTS stop + PCM | Same quota response |
| Reconnect A on its device with explicit history | Hello + TTS stop + PCM | Same quota response |
| New game/profile with empty history on A's device | Hello + TTS stop + PCM | Same quota response |
| Two simultaneous visitors on separate devices | Both hello + TTS stop + PCM | Both quota responses |

All six spoke **“额度不足，请联系灵矽商务”**. Each returned 108800–128640 PCM bytes, six distinct provider session IDs, and zero context-tool calls. **0/6 AI checks passed.** This is an account/provider credit blocker, not evidence that role isolation works or fails. It also does not demonstrate actual microphone ASR, since requests used documented `listen.detect` text triggers. No additional inference was requested after the user instructed us to wait for credit.

Cleanup was completed: all three dedicated devices unbound and the dedicated agent deleted, each management operation returned code 0, and the private state file was removed. A sanitized local results file is ignored. No new Cloudflare remote resource was created.

Both the old successful probe and this test omitted explicit LLM/TTS IDs at creation, using the supplier's defaults. A read-only check of the retained old probe showed LLM `f3626c105383d71654a57f2bb8a973f3`, ASR `ASR_DoubaoStreamASR` and voice `1965294143278125057`. The new test agent had already been cleaned up before the model-ID comparison, so **its exact model/voice were not recovered**; do not claim they matched. Only the no-memory/history configuration was verified before cleanup.

### Historical allocation proposal — superseded by browser Cookie identity

The following proposal is retained as design history. The current implementation above uses a signed identity Cookie without tokens or encryption, one Device/Client per browser identity, and no automatic per-game/character allocation.

A possible no-game-DB design uses one generic no-memory agent and independently bound device identities per browser/game/character, with a server-authenticated, encrypted HttpOnly cookie carrying the browser's allocation. Device tokens stay server-side (or encrypted and opaque); each turn opens a new socket and supplies browser-owned character history. This avoids assuming one device's concurrency/short-term memory behavior, but remains a **proposal**, not implemented or approved public behavior.

Open questions include allowed device cardinality, provisioning latency, token expiry/refresh, parallel device/session policy, and cleanup after a browser disappears. Provider-side device resources outlive a browser; reliable cleanup needs an explicit supplier resource lifecycle (potentially periodic reconciliation of owned resources), not a promise that an unload callback always runs. A static pool also needs real coordination to prevent simultaneous assignments; a Worker-local Map would not provide that across isolates/hosts. Do not silently add a database/DO or claim unlimited anonymous visitors.

After credit is available, independently verify: mandatory context reads; A → B → A with each character's explicit history; a new game on reused identities; parallel separate devices; reconnect/manual PCM capture; live ASR/TTS/playback/abort; and prompt-injection/knowledge boundaries. Then choose allocation and public access/quota policy with the user. Edge access, rate-limit bindings/Turnstile and supplier account quotas are candidates, not configured guarantees here.


## Historical fixed-device setup helper — not current Worker configuration

The following commands describe the legacy experiment helper. Its fixed `LINX_WS_TOKEN`/`LINX_DEVICE_ID`/`VOICE_ACCESS_TOKEN` export does **not** satisfy the current Cookie Device Worker configuration. Do not run it to provision or overwrite an active environment for this release; do not follow the old 8787 startup instruction without the service owner’s current turn. The old development access-cookie route is not a current voice authorization requirement. This history does not authorize provider calls, secret reads, resource creation or cleanup.

```sh
npm run test:linx --workspace @lie/gateway -- --key-file /absolute/path/to/.linx-api-key --setup-only --export-dev-vars
```

`--setup-only` prepares or reuses the dedicated generic agent and at most three devices, refreshes their OTA connection tokens, and exits before opening any inference WebSocket. `--export-dev-vars` requires that flag and writes the first device's connection settings plus a random independent `VOICE_ACCESS_TOKEN` to ignored `apps/gateway/.dev.vars` with mode 0600. The management key is never exported. The state file is also 0600 and retains ownership and the access token for reuse/cleanup; neither file's contents are printed. Omitting `--export-dev-vars` prepares resources without exporting Worker settings. Normal invocation without these flags still runs the original six bounded scenarios.

An existing `.dev.vars` is overwritten only when its agent and test access token match this script's retained state; unrelated local credentials are left intact. A new local export uses exclusive file creation. This setup uses one fixed device for the local Worker, so it is intended for one controlled browser session at a time and does not implement visitor allocation.

Start the local Worker after exporting. Open `http://127.0.0.1:8787/__lie/dev-session` to install the matching HttpOnly, SameSite=Strict test cookie and return to the game. This route exists only in the loopback Vite development server, rejects cross-site requests, and is absent from production Worker output. It does not expose the token in the URL or page. The cookie lasts two hours; revisit the entry to refresh it. On completion stop the local Worker, then run the existing `--cleanup` command: it unbinds the three owned devices, deletes the owned agent, removes the owned `.dev.vars`, and finally removes the state file. If a management operation fails, keep state and retry cleanup; it records each successful step. A changed/unowned `.dev.vars` is preserved. Never delete private state while its remote resources remain.
