# Thin voice gateway

`@lie/gateway` is a Cloudflare Worker plus the prebuilt `apps/web/dist` static assets. It contains no game rules, role profiles, answer, session history, database, KV or Durable Object. Browser MCP tools supply the active character context.

## Local checks and build

From the repository root, after installing dependencies:

```sh
npm run build --workspace @lie/web
npm run typecheck --workspace @lie/gateway
npm run test --workspace @lie/gateway
npm run build --workspace @lie/gateway
npm exec --workspace @lie/gateway -- cf deploy --dry-run
```

The gateway's pinned `cf` is **1.0.0-beta.18**, which supports the current Node 24.17 runtime. `@cloudflare/vite-plugin` is pinned to **2.0.0-beta.v.4**. This new project uses `cloudflare.config.ts` and `cf`; there is no Wrangler configuration. Vite is explicitly declared here so `cf` selects the Vite framework path correctly with hoisted workspace packages. The package's build script runs `cf build`, which invokes Vite; it does not run the web build itself. Build the web package first and rebuild it after web changes. The root build command explicitly builds web before gateway; do not rely on workspace glob order.

`publicDir` points to `../web/dist`; the Vite plugin copies those files into `.cloudflare/output/v0/workers/default/assets`, alongside the Worker bundle and deployment configuration. Generated output and generated Worker types under `.cloudflare/` are ignored. Asset binding types are inferred from `cloudflare.config.ts` with `InferEnv`. Voice secrets are optional runtime fields, supplied separately when voice is enabled. They are declared with `bindings.secret()` only in development so Vite loads `.dev.vars`; production omits those declarations: cf treats those as required and would reject the initial static-only deployment. Missing voice secrets keep `/api/voice` closed with 503; no placeholder credentials are used. No Node-specific runtime library is used in the Worker, so `nodejs_compat` is not required. Logs/traces are enabled with query-string redaction; custom logs contain operation/status only, never audio, context, keys, cookies or token values.

For local development, copy `.env.example` to the ignored `.dev.vars` **inside this package** and supply dedicated test credentials. Run `npm run dev --workspace @lie/gateway` (port 8787). These values are server bindings, not `VITE_*` variables or assets. Do not put the management API key in any of them. The static web dev server and this Worker are separate origins; use the Worker-served app for same-origin voice checks.

The user completed cf login and root verified valid authentication on 2026-10-23. Local build/runtime tests and dry-run do not need login. Static-only deployment does not enable provider calls; voice access and allocation still require separate validation. Use `cf` for this project.

## Routes and relay contract

- `GET /api/health`: `{ "status": "ok", "storage": "none" }`, not cached.
- `GET /api/voice`: WebSocket only. Requires a matching `Origin`, no query string, all configured secrets, and the restricted-test access cookie described below. Plain HTTP returns 426; missing configuration returns 503; rejected origin/access returns 403.
- Other `/api/*`: explicit JSON 404.
- Static assets: served through `ASSETS`; navigation uses SPA fallback. Missing `/games/*` must be JSON 404 rather than the SPA HTML shell.

The upstream is fixed to `https://xrobo-io.qiniuapi.com/v1/ws/`. The Worker constructs `Authorization`, `Device-Id`, random per-connection `Client-Id`, `Protocol-Version: 1`, and `X-Agent-ID` headers from server bindings. It never accepts an upstream URL, management key, device ID or agent ID from a browser parameter. Upstream rejection/error is sanitized to 502; private response bodies are not returned.

Once upgraded, the Worker forwards text and ArrayBuffer frames both ways, explicitly sets `binaryType = 'arraybuffer'`, and propagates closure/error to both peers. It does not interpret game MCP payloads. The upstream handshake has a 10-second timeout which is cleared after the upgrade; each relay has a 3-minute deadline and a 64KiB per-frame limit. Oversized frames close with 1009; transport failures close with 1011; abnormal close 1006 is normalized before sending. There is no shared mutable connection state, reconnect, claim of global rate limiting or browser resource lease.

### Restricted test access, not a public allocation policy

`VOICE_ACCESS_TOKEN` is a separate random **test access secret**, not a provider credential. The current gateway checks an exact `lie_voice_access` cookie value against it using SHA-256 plus Workers' timing-safe equality. A trusted test harness/operator can supply that cookie; this package deliberately does not expose a public token-issuing endpoint or add an invitation UI. When an issuer is later selected, it must set a same-origin `HttpOnly; SameSite=Strict; Secure` cookie (Secure only on HTTPS) and use an expiring policy. A raw cookie shared by a limited test group is not per-user authorization or a quota system.

Consequently, normal browser voice will stay blocked until an access-cookie issuer or an approved edge access mechanism is connected. The existing browser voice adapter automatically sends same-origin cookies, and needs no provider credentials. Do not remove the guard merely to make a public demo connect.

This first relay accepts one fixed dedicated device configuration. **It does not establish that a shared device can safely serve concurrent public users.** Keep it local or otherwise limited until the allocation decision and real isolation tests below are complete. Static assets may be shared without enabling voice. A per-connection time/frame limit and an Origin check do not prevent a malicious client from consuming account-wide quota.

## Bounded Linx experiment — 2026-10-23

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

### Allocation proposal requiring validation

A possible no-game-DB design uses one generic no-memory agent and independently bound device identities per browser/game/character, with a server-authenticated, encrypted HttpOnly cookie carrying the browser's allocation. Device tokens stay server-side (or encrypted and opaque); each turn opens a new socket and supplies browser-owned character history. This avoids assuming one device's concurrency/short-term memory behavior, but remains a **proposal**, not implemented or approved public behavior.

Open questions include allowed device cardinality, provisioning latency, token expiry/refresh, parallel device/session policy, and cleanup after a browser disappears. Provider-side device resources outlive a browser; reliable cleanup needs an explicit supplier resource lifecycle (potentially periodic reconciliation of owned resources), not a promise that an unload callback always runs. A static pool also needs real coordination to prevent simultaneous assignments; a Worker-local Map would not provide that across isolates/hosts. Do not silently add a database/DO or claim unlimited anonymous visitors.

After credit is available, independently verify: mandatory context reads; A → B → A with each character's explicit history; a new game on reused identities; parallel separate devices; reconnect/manual PCM capture; live ASR/TTS/playback/abort; and prompt-injection/knowledge boundaries. Then choose allocation and public access/quota policy with the user. Edge access, rate-limit bindings/Turnstile and supplier account quotas are candidates, not configured guarantees here.

## Automated verification and tooling audit

Five workerd runtime tests use the source Worker, a real static assets binding over checked-in fixture files, and an isolated fake upstream Worker. They verify health/JS/JSON/404, origin/cookie/query/config rejection, fixed upstream and injected headers, unchanged text/binary, close propagation, oversized-frame shutdown, and sanitized upgrade failure. No fake success is counted as live provider behavior. Source, tests, config, and the opt-in management script are typechecked.

Local `cf build` and `cf deploy --dry-run` validate deployable Build Output with the actual prebuilt web directory. The repository's existing web build at this worktree base was used; root integration must rebuild the combined app before deployment. Runtime fixture checks are distinct from a browser game smoke test.

Installing `cf@0.15.0` initially produced five development-tool advisories through old Miniflare → `sharp <0.35.5` / `undici 7.29.0`. The automatic audit suggestion downgraded to `cf@0.8.0`; it was not applied. `cf@1.0.0-beta.20` removed them but required Node 24.22, so the final pin is **cf@1.0.0-beta.18**, which supports Node >=22. Final install reported **0 vulnerabilities**. No forced upgrades, root overrides, or production Worker runtime dependencies were added. The root lockfile is owned by the integrator and was not changed here.

References: [Cloudflare CLI project/build behavior](https://developers.cloudflare.com/cf/projects/), [programmatic configuration](https://developers.cloudflare.com/cf/projects/cloudflare-config/), [Workers WebSockets](https://developers.cloudflare.com/workers/runtime-apis/websockets/), [Linx WebSocket protocol](https://linx.qiniu.com/docs/xrobot/platform/websocket), [Linx agent API](https://linx.qiniu.com/docs/xrobot/api/agent), [Linx device API](https://linx.qiniu.com/docs/xrobot/api/device). Checked 2026-10-23.


## Prepare a local browser session without inference

```sh
npm run test:linx --workspace @lie/gateway -- --key-file /absolute/path/to/.linx-api-key --setup-only --export-dev-vars
```

`--setup-only` prepares or reuses the dedicated generic agent and at most three devices, refreshes their OTA connection tokens, and exits before opening any inference WebSocket. `--export-dev-vars` requires that flag and writes the first device's connection settings plus a random independent `VOICE_ACCESS_TOKEN` to ignored `apps/gateway/.dev.vars` with mode 0600. The management key is never exported. The state file is also 0600 and retains ownership and the access token for reuse/cleanup; neither file's contents are printed. Omitting `--export-dev-vars` prepares resources without exporting Worker settings. Normal invocation without these flags still runs the original six bounded scenarios.

An existing `.dev.vars` is overwritten only when its agent and test access token match this script's retained state; unrelated local credentials are left intact. A new local export uses exclusive file creation. This setup uses one fixed device for the local Worker, so it is intended for one controlled browser session at a time and does not implement visitor allocation.

Start the local Worker after exporting. Open `http://127.0.0.1:8787/__lie/dev-session` to install the matching HttpOnly, SameSite=Strict test cookie and return to the game. This route exists only in the loopback Vite development server, rejects cross-site requests, and is absent from production Worker output. It does not expose the token in the URL or page. The cookie lasts two hours; revisit the entry to refresh it. On completion stop the local Worker, then run the existing `--cleanup` command: it unbinds the three owned devices, deletes the owned agent, removes the owned `.dev.vars`, and finally removes the state file. If a management operation fails, keep state and retry cleanup; it records each successful step. A changed/unowned `.dev.vars` is preserved. Never delete private state while its remote resources remain.
