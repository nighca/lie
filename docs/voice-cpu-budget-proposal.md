# Voice gateway CPU budget proposal

Date: 2026-10-30. Status: **prepared candidate; awaiting user approval to enable**.
Owner: CPU configuration specialist, handed to the voice-session-limit initiator for review. Only the designated main integrator may integrate/publish after the user's decision and a coordinated maintenance window. This document and branch do not enable a runtime setting.

## Proposed change

Declare `limits: { cpuMs: 30000 }` in `apps/gateway/cloudflare.config.ts`. This explicitly requests the documented Workers Paid default of 30 seconds of CPU per invocation, rather than the 300000ms maximum. This is a CPU ceiling, not a 30-second voice-session wall-clock limit or reserved CPU capacity. It can permit more billable CPU consumption than an existing lower ceiling; no account plan or billing settings are changed by preparing it.

The candidate is based on reviewed local main `12c4e4d29135c7e30083c8ecf08c2fc95bcaf150`. It changes only configuration, a configuration serialization test, and this proposal. Application source and dependency manifests/lockfile remain byte-identical to the base. The default 600-second session wall cap, 64KiB per-frame guard, both-peer cleanup, Origin checks and secret isolation are preserved. No audio tuning, encoding optimization or architecture change is included.

## Why this candidate

The initiating investigation reports one production return group in 12:44–12:53 UTC on this date: four related exceptions plus one terminal `exceededCpu`, with CPU 2050ms and wall 157316ms, on Worker version `380959e2` and application commit `12c4e4d`. These are observed execution measurements, **not evidence of a configured 2000ms budget**, and do not establish that the user's reported Paid upgrade failed.

The user then reported a same-device local `http://127.0.0.1:8787/` session lasting approximately 3:40+ without an unexpected disconnect. Local and online application commit were reported as `12c4e4d`. This is an approximate user observation without a request/log identifier. It is not a 600-second acceptance result. Vite development/local workerd differ from production; provider agent/device identity, browser and output identity were not individually compared. The user clarified that the electrical-sounding “吱吱” audio artifact still exists locally. This CPU proposal addresses unexpected disconnects only, and does not claim to repair that artifact.

These observations prioritize production budget/settings differences for investigation; they do not prove the sole cause. The initiating audit owns the detailed runtime evidence, preserved in separate reviewed commit `3b745182633266a0cd22d8cfada0ebffa86f37ad`, file `docs/voice-disconnect-investigation/post-upgrade-disconnect.md` (not replayed into this independent candidate). This candidate did not repeat account queries or live voice tests.

## Verified configuration support

The pinned CLI is `cf@1.0.0-beta.18`. Its `cf/config` export re-exports `@cloudflare/config/public` from its nested `@cloudflare/config@0.27.0`. Vite's root configuration package is `@cloudflare/config@0.28.0`. Both support the same field:

| Installed package | Type declaration | Strict schema and serialization |
| --- | --- | --- |
| CLI nested 0.27.0 | `node_modules/cf/node_modules/@cloudflare/config/dist/public-B1DQ7JeZ.d.mts:959–963` | `dist/index.mjs:474–477` accepts `cpuMs`; `920–925` converts it to `limits.cpu_ms` |
| Vite root 0.28.0 | `node_modules/@cloudflare/config/dist/public-DsUKmT49.d.mts:965–969` | `dist/index.mjs:475–478` accepts `cpuMs`; `921–925` converts it to `limits.cpu_ms` |

These package paths are local dependency evidence, not committed source. The project's [typed configuration API documentation](https://developers.cloudflare.com/cf/projects/cloudflare-config/) also declares `limits.cpuMs` in milliseconds, supported for the Standard usage model. The [Workers limits documentation](https://developers.cloudflare.com/workers/platform/limits/#cpu-time) states that Paid HTTP requests default to 30000ms CPU, with a 300000ms maximum, and distinguishes CPU execution from waiting on network I/O. [Wrangler limits documentation](https://developers.cloudflare.com/workers/wrangler/configuration/#limits) documents the wire-side `cpu_ms` name and says enforcement occurs on Cloudflare's network rather than in local development.

## Activation and unresolved facts

The [cf build/deploy documentation](https://developers.cloudflare.com/cf/projects/) says builds write Build Output, while deploy uploads a new Worker version and deploys it. [Versions and deployments](https://developers.cloudflare.com/workers/versions-and-deployments/) distinguishes a code/configuration version from the deployment selecting serving versions. Therefore this local candidate must pass the normal reviewed integration/CI deployment path before its explicit setting can serve production traffic; building or committing it does not apply the setting. The existing repository CI/CD can deploy published main, so even integration/publication waits for the coordinator's approval and maintenance-window coordination while the user's local preview is active.

Whether upgrading this particular existing Worker to Paid alone requires redeployment, retains an older override, or has a propagation delay remains **unknown** here. No primary source was found establishing that specific account-upgrade transition or a guaranteed propagation interval. The [pricing documentation](https://developers.cloudflare.com/workers/platform/pricing/#how-to-switch-usage-models) says changing the account-wide default usage model does not affect existing Workers and describes legacy per-Worker models; that is a narrower statement than the user's Paid upgrade and is not proof of this Worker's model or override. The docs also mention historical Bundled migrations adding explicit limits; that is not evidence this project has one.

The dashboard CPU Limits control is a documented alternative configuration path, but this task did not use it. Current effective per-Worker budget, entitlement propagation and any old override were not read or changed. No account scanning, subscription retry, CLI/library upgrade, API write, deploy, permission or plan mutation was performed. After user approval, the coordinator should verify the actually serving version/settings and use a user-authorized fresh connection for acceptance; offline build success cannot prove production enforcement or a full 600-second session.

## Offline validation

Validation used Node `24.22.1`, read-only reused from the voice-smoothness worktree, and an isolated copy of its pinned dependency tree under this candidate's ignored `tmp/cpu-budget-validation/`. Workspace package links point to this candidate. No dependencies were installed or upgraded.

- Gateway TypeScript checks: `tsc -p tsconfig.json` and `tsc -p tsconfig.scripts.json` passed.
- `vitest run test/cpu-budget-config.test.ts test/session-limit-config.test.ts`: 2 files / 3 checks passed. The added check parses the production config and verifies `cpuMs: 30000` survives conversion to `cpu_ms: 30000`.
- An ignored standalone check additionally parsed and serialized the actual config through both CLI 0.27.0 and Vite 0.28.0; both passed.
- `cf build`: passed, invoking the existing Vite production build. CLI reported its existing workspace/no-local-lockfile warning; no config or dependency mutation resulted.
- Actual `.cloudflare/output/v0/workers/default/worker.config.json` contained `limits: { cpuMs: 30000 }` and passed both installed `OutputWorkerSchema` validators. The default 600-second text binding and all three secret-reference descriptors were asserted unchanged.
- Gateway/voice source and package manifests/lockfile compared unchanged against the declared base; `git diff --check` passed.

This gateway-only build validates configuration and Worker bundling, not the full website asset package or a deploy-ready release artifact. It does not invoke the Worker, connect any WebSocket/provider, run real/synthetic voice inference, profile CPU, or start services. No service/listener was created or stopped; the user's 8787/8788 services were untouched. The self-generated `.cloudflare` build/type cache was identified as belonging to this task and moved into its ignored tmp directory after verification. No generated cache, authentication data or credentials are committed.
