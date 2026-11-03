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

## Server configuration and rollout

This source defaults to browser direct transport. The formal candidate must first be deployed to the approved Cloudflare preview and explicitly accepted by the user at that same candidate SHA before main integration and production publication. See the [per-case preparation plan](../../docs/reviews/voice-case-prepare-2026-11-03/README.md); source/build checks do not claim that rollout has happened.

| Binding | Meaning |
| --- | --- |
| `VOICE_TRANSPORT` | Trusted server choice: `direct` or `relay`. Configuration reads `LIE_VOICE_TRANSPORT`, default `direct`. Missing, empty or unknown runtime values fail closed. No browser/query override or automatic fallback. |
| `LINX_API_KEY` | Private management credential for the approved Agent's binding and ownership checks. Never sent to the browser. |
| `LINX_AGENT_ID` | Approved existing generic Agent. Runtime does not create Agents. |
| `VOICE_DEVICE_COOKIE_SECRET` | Independent random signing secret, at least 32 UTF-8 bytes; separate between environments. |
| `VOICE_DEVICE_ENVIRONMENT` | Nonempty server namespace; `LIE_VOICE_ENVIRONMENT` defaults to `production`. Changing it invalidates existing Cookies. |
| `LINX_WS_TOKEN` | Required only in relay mode for its first handshake. Retained as a real server-only rollback dependency. Direct mode does not use or require it. |
| `VOICE_MAX_SESSION_SECONDS` | Positive integer seconds, default `600`, at most `floor(0x7fffffff / 1000)`. Direct uses a client close timer; relay enforces it in the Worker. |

The four secret declarations remain in the normal config; declarations are not secret values. Supply values only through approved private configuration, never `VITE_*`, assets, Cookie payloads, URLs or committed files. Both modes require management key, Agent, signing secret, namespace and a valid deadline. Relay additionally requires the shared WS token. Health voice readiness validates configuration, not provider credentials or account health. New main/PR builds explicitly set direct; only the PR publisher's old-resource preflight accepts the exact reviewed legacy eight-binding shape. New deployment verification requires nine bindings with direct mode.

The identity Cookie is not account authorization, a lease, quota or abuse limit. The application access check remains disabled by user decision. The user relayed Linx's confirmation on 2026-11-03 that DeviceId-based OTA and browser-held Device token are intended; exact token TTL/revocation details remain unknown. This is supplier information relayed by the user, not a claim that our no-input checks establish business authorization.

## HTTP and browser identity

Prepare and relay WS reject query parameters and require exact same Origin. Prepare also rejects `Sec-Fetch-Site: cross-site` and uses `Cache-Control: no-store` for every response.

| Endpoint | Behavior |
| --- | --- |
| `GET /api/health` | Health/storage plus `voice:{status:"ready",transport:"direct"\|"relay"}` or `voice:{status:"unavailable"}`. Configuration only: no Cookie, OTA, bind or WS. |
| `POST /api/voice/prepare` | Empty body. Reuses a valid signed Cookie or creates an identity in this request. Direct returns `{transport:"direct",url,deviceId,clientId,token,maxSessionSeconds}` after preparation/ownership checks; relay returns `{transport:"relay"}`. Signs/renews the same identity on success and provider failure. Bad body400, origin403, unavailable503, provider failure502/503, timeout504. |
| `GET /api/voice` | Direct mode404. Explicit relay mode retains WebSocket upgrade, shared-token first attempt and only401-triggered same-Device OTA + one retry. Plain relay HTTP426. |
| `/api/shared-games/v1…` | Separate R2-backed API. Other `/api/*` returns404. There is no `/api/voice/status` or `/api/voice/connection` endpoint. |

Production Cookie is `__Host-lie-device; Secure; HttpOnly; SameSite=Lax; Path=/`, no Domain, with 180-day sliding expiry renewed by prepare. Exact HTTP loopback uses `lie-device-dev` without Secure and a separate signed environment claim. Cookies are not port-scoped; use isolated browser contexts for tests. The payload contains version, namespace, random pseudo-MAC Device ID, stable Client UUID and issue/expiry timestamps, with no provider credentials. It identifies browser storage, not a physical MAC or user account. Clearing/expiring Cookie or changing secret/namespace yields a new identity.

`deviceProvider.prepare()` returns its already obtained token: an existing token still needs `belongsToAgent()`; new activation binds to the configured Agent then confirms OTA; uncertain bind responses require confirmed token plus ownership. Normally an existing device costs one OTA plus one ownership GET, and a new device costs two OTA plus one bind. There is no extra token OTA after successful prepare. Only the current case page keeps the prepared result in memory; there is no server token cache. A cancelled preparation cannot undo a completed bind. Provider resources outlive Cookies/pages; no automatic TTL cleanup is promised.

After Origin/body/config validation, prepare chooses and signs one identity before provider work. Provider failures return that Cookie too, so explicit retry can recover a completed bind or uncertain OTA under the same identity. A network-discarded response can still lose the Cookie; cancellation cannot roll back provider work or a response Cookie already applied by the browser.

Two first requests from tabs sharing an empty Cookie jar may create two identities. Each direct response's Cookie and descriptor agree; each case keeps its own descriptor even if the other response later wins the shared Cookie jar. The next case uses whichever Cookie is present then. Explicit relay upgrades use the current Cookie. No cross-tab coordination, server session store or global lock is added.

The direct descriptor pins `wss://xrobo-io.qiniuapi.com/v1/ws/`, including the final slash. Native WebSocket query carries only Device/Client; the prepared Device token is sent in hello, never in the URL or persistent browser storage. Browser code cannot select an Agent, management credential or upstream. Different browser identities have different Device/Client IDs; supplier concurrency and actual isolation still require real acceptance. Same-identity replacement behavior is provider-controlled; no cross-tab lock or automatic reconnect is introduced.

In explicit relay mode, the Worker uses fixed `https://xrobo-io.qiniuapi.com/v1/ws/`, shared `LINX_WS_TOKEN`, Cookie Device/Client and server Agent headers. Only initial401 obtains a same-Device token and retries once inside the original9s budget. Other failures do not refresh/retry. Switching modes requires server configuration and page refresh; a connection never implicitly retries through the other transport.

## Preparation and connection budgets

Successful/current game load publishes the intro and starts one app-owned prepare request. Open waits for that same pending result; character switches and stopping/reopening within the case reuse it. Each controller owns its VoicePort; new case, restart and disposal clear/abort its preparation. A failed preparation stays failed until the player explicitly retries. If a background failure has never been shown, the next open first presents that cached error; it does not silently reissue the request. There is no TTL refresh, automatic retry, status preflight or transport fallback. Cancelled/stale case results cannot open capture or a socket. The user approved the engineering assumption that a token covers one case; this is not a measured supplier TTL guarantee.

| Phase | Budget |
| --- | --- |
| Browser preparation | One20s deadline for the case preparation. Open waits for the existing result; an explicit retry starts one new request. |
| Server prepare |18s total provider work after identity/body checks; empty-body validation separately bounded to1s. Each provider operation including body read is at most8s within that outer budget. |
| Relay handshake |9s total, including optional401 OTA refresh and one retry. Late aborted upgrades are closed. |
| Client channel |10s from channel.open for native connection, PCM hello and nonempty MCP tool-list response. |
| Conversation transport | Default600s: direct client timer starts at socket open; relay Worker timer starts when relay is created. Neither is the game's active interrogation budget; the client timer is not a provider hard limit. |

Both transports retain64KiB frame limits, cancellation, one socket per connection and explicit manual restart after failure. OTA/bind JSON is bounded to64KiB, ownership listing to1MiB, with sanitized errors. Direct provider close reasons are not forwarded verbatim. No provider token, management value, Cookie or audio is logged. iOS/iPadOS Safari retains the existing playback-drain plus300ms input pause; this change does not alter microphone/player mechanics. If case preparation is still pending, opening waits before AudioContext/capture, so real iPad autoplay/voice behavior must be checked by the user; fake tests and no-input WS checks do not establish it.

The temporary formal preview uses the same handler behind `src/direct-preview.ts`, which returns410 for dynamic APIs after its original absolute expiry; static assets remain available. A case descriptor acquired before expiry can still be reused without an API request afterwards; this gate does not revoke provider tokens or guarantee that later native connections are impossible. `direct-preview.vite.config.ts` replaces the environment map with exactly eight preview bindings, no fixed identity, shared WS token or R2. A fresh namespace and signing secret invalidate the historical fixed Cookie. Resource staging, inherited fixed-secret removal, scoped Agent cleanup and the user acceptance gate are detailed in the per-case preparation plan; none of the commands or code here independently authorizes cloud/provider changes.

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
