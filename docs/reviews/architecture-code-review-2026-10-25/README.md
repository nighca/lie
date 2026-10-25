# Architecture and latent defect review — 2026-10-25

Status: review findings, not implementation approval or fixes. Owner: architecture_code_review; integrator: root coordinator. Frozen base: `58b416db3d51e112d5f00f61ed52951e25e29609`; production baseline supplied by coordinator: `abb12dbf7a40689be593c2a1e580f23cfcc5611e`. No implementation changes, live provider, microphone, browser, servers, credentials, publication or deployment.

## CR-01 — P2: valid shared content exceeds the context transport frame budget

Locations (repository-relative paths resolve from `/Users/nighca/code/nighca/lie`):

- `apps/gateway/src/index.ts:87`: every relay frame above 65,536 UTF-8 bytes closes both peers with 1009.
- `packages/game-core/src/context.ts:25`: profile is returned directly, and repeated in systemPrompt at line 36; background is repeated similarly.
- `apps/web/src/application/liveVoice.ts:105`: the context tool serializes the complete context.
- `packages/voice/src/channel.ts:162`: the tool string is embedded into a JSON-RPC reply.
- `apps/web/src/editor/share.ts:41`: author/share content accepts up to 128 KiB decompressed JSON, with no context wire-size check.

Trigger: a valid custom case with a 12,000-character Chinese profile. This is below the authoring limit, and compresses to a 334-character full share URL. Open/play succeeds up to provider context discovery; when the provider calls the context tool, its reply is 72,901 bytes and the gateway disconnects before forwarding it. A sufficiently long accumulated history can hit the same transport boundary even with shorter profiles; that latter route was reasoned from the source, not separately run here.

Expected: supported authored content either works with the voice context protocol, or has an actionable validation error before a player begins. Actual: accepted and round-trippable content encounters a generic voice interruption. This breaks the approved content-only extension contract at the C/E boundary; it is not an argument for removing the safety frame limit.

Validation: `probes.cjs` uses actual validateGame, encode/decode, buildCharacterContext and relaySockets with inert sockets. Result: 36,203-byte content; encode/decode preserves the profile; relay closes 1009; zero forwarded messages. No supplier behavior is claimed: the reachable trigger is a normal context-tool call, and the real relay is verified independently of supplier availability. P2 because it blocks a supported subset of custom games, without data destruction or a credential exposure. No matching existing issue found in reviewed implementation/design records; the frame limit itself was already documented, but the incompatible authoring/context limits were not.

Minimal direction: establish a shared context wire-size budget across author validation, tool construction and gateway contract. Account for JSON escaping, duplicated prompt fields and history growth; choose explicit limits/truncation semantics with content owner. Do not silently cut private story facts or automatically increase provider limits without checking them.

## CR-02 — P2: optional presentation fetch blocks application mounting

Location: `apps/web/src/main.ts:19` (await optional manifest before router/app creation, mount at line 41).

Trigger: the manifest request or response body remains pending, e.g. a slow/hung asset request on first load. Expected: the approved names/static fallback can produce a usable application, or a bounded preparation/error screen. Actual: no Vue UI mounts while this supposedly optional asset is pending; even home navigation is unavailable. There is no application timeout or AbortSignal on this request. This is a presentation-to-application-startup dependency inconsistent with the intended optional resource fallback, rather than a pure-core import violation.

Validation: the second probe executes the actual main function after TypeScript erasure, with an inert pending fetch and mount spy. After 25 ms, fetch has started but no app has mounted. This is a deterministic control-flow probe, not a claim that 25 ms is an excessive real delay, nor an actual browser outage reproduction. Because there is no code deadline, the app awaits settlement indefinitely at application level; browser/network may eventually fail independently. P2 because affected visits have no functional entry point. No matching documented limitation found during this review.

Minimal direction: bound optional manifest acquisition (including response-body parse) with a deadline/fallback, or mount a preparation shell before loading. Preserve existing static/name fallback and do not turn preset failure into a game-rule dependency.

## Review coverage and architecture assessment

Read approved architecture, coordinator handoff/current plan, core and voice READMEs, core content/session/context, controller, live voice, channel/microphone/player, gateway relay, Application/App entry and navigation lifecycle, editor draft/share and Editor actions, AnimatedPortrait, animation loader and timeline. Consulted nearby tests and existing limitation records selectively; no whole-suite rerun. This is a focused first pass, not exhaustive certification.

| Boundary | Actual observation |
| --- | --- |
| Pure game core | No Vue/DOM/Node/Cloudflare imports in reviewed source; injected reader, clock identity, immutable-style state transitions; variable character lists; incorrect accusation exposes null reveal. |
| Orchestrator/voice | Controller binds callbacks and context reads to session/character/epoch; abort/close on transition; voice layer has no game import. Read-only review found no new confirmed cross-character leak. |
| Worker | Fixed upstream, secrets only through server environment, origin checks, no story or game-rule imports. Shared configured device isolation remains an existing open issue, not a new finding. |
| UI/resources | UI consumes state/preset references; animation cancellation and static fallback exist. Bootstrap's optional manifest sequencing is CR-02. |
| Editor/share | Content is validated and normalized; fragment limits and streaming decode limit exist; no arbitrary asset URLs accepted. Context/relay budget mismatch is CR-01. |

Not covered exhaustively: every Vue template/CSS, all animation parser branches and generators, contribution flows, every protocol error ordering, supplier memory/real voice, external endpoint security, runtime CSP/autoplay, true background-tab behavior, hardware or browser compatibility. Paused invite/auth and unapproved animation/result candidates excluded. Existing 16k URL acceptance limits, shared provider device issue, development non-101 host behavior and SFC coverage mapping are not re-reported as new defects.

Documentation discrepancy (not counted as a production defect): `packages/game-core/README.md` still says wrong accusation remains interrogating; actual session.ts and approved architecture correctly end in lost. Update this stale interface description with the next relevant documentation change.

## Reproduce and handoff

Run Node 24.22.1: `node docs/reviews/architecture-code-review-2026-10-25/probes.cjs [repository-root]`. Probe transpiles read-only source with the repository's installed TypeScript, then runs inert fake sockets/bootstrap. No new package dependency or persisted app state. Final results in [probe-results.jsonl](probe-results.jsonl). Initial probe ran on host Node24.17; final strengthened run and recorded results use bundled Node24.22.1. No npm test suite claimed.

Only this report, probe and small result file are intended for integration. Local ignored node_modules symlink reuses main's installed dependencies; no server was started, so stopped/retained/unknown services from this task are all zero. Temporary worktree must remain until root reviews this handoff; no other worktree or branch changed.
