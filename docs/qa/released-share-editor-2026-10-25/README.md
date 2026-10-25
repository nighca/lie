# Released share/editor exploratory QA — 2026-10-25

Status: **partial — deterministic checks complete; native IAB acceptance not run**. No new confirmed defect in the eight executed scenarios. This is not a claim that released browser QA passed.

## Identity and scope

- Frozen released source: `48316544ea9fd22afbf1eee8db6f81e326026821`.
- Owner: `character_preset_migration`; branch `codex/released-share-editor-qa`; worktree `/Users/nighca/.codex/worktrees/character-preset-migration-dawn/lie`.
- Production files unchanged. Reused existing actual node_modules; no dependency install, network, provider, microphone, account, external share or deployment.
- Actual runtime: Node `v24.22.1`; Vitest `5.0.5`, jsdom and Vue Test Utils. Application, Editor, real share gzip codec and fake game controller execute in an isolated jsdom document with memory history. Dialog methods are fixtures setting `open`; these cannot establish native modal/top-layer behavior.
- Excludes repaired RSM01/02, QA001/002/003 and pending preview/remix, connection-loading or result-visual requests. Checks below are supplemental recovery combinations, not a repeat full browser matrix.

## Executed observations

| Scenario | Observation | Result |
| --- | --- | --- |
| S1 | Chinese, emoji, URL punctuation and mixed newlines survive generated link decoding in independent application mounts. Exact unrelated draft bytes remain unchanged. | PASS; fresh mount, not native reload |
| S2 | Deliberately corrupt gzip CRC: no controller is constructed; replacing hash with valid link opens exactly one session. | PASS |
| S3 | Unknown preset ID fails closed; valid replacement link opens without reloading. | PASS |
| S4 | Injected missing DecompressionStream yields useful error; restoring capability then actual Retry button opens the case. | PASS; fixture fault |
| S5 | Valid share → damaged share → memory Back → Forward selects the correct view and disposes the departed controller. | PASS; not native popstate |
| S6 | DRAFT_KEY-only quota fault → edit → preview → memory Back retains in-memory text. Restoring writes and making another edit saves it; generated share decodes the latest title. | PASS; fixture fault |
| S7 | Missing CompressionStream releases editor busy state; restore capability, continue editing and share succeeds. | PASS; fixture fault |
| S8 | Memory Forward to expired preview snapshot redirects to Editor; new preview uses the newest edits. | PASS; intended ephemeral-preview fallback |

Command (from worktree root):

```sh
PATH='/Users/nighca/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64/bin':$PATH node_modules/.bin/vitest run --config docs/qa/released-share-editor-2026-10-25/vitest.config.mjs
```

Final run: **8/8 PASS**, one suite, exit 0, 793 ms. [Machine observations](probe-results.json), [replay tests](probes.test.ts), [isolated config](vitest.config.mjs).

The first probe run was 7/8: S5 incorrectly expected `dispose()` to mutate the last view phase to a nonexistent `disposed` phase. Its actual result was `intro`; inspection showed disposal does not rewrite that view. The probe was corrected to spy on the real disposal call, then rerun once. This was a probe error, not a product defect or suppressed failure.

## Native-browser limitation and remaining acceptance

The task requires IAB, explicitly forbids Chrome fallback. CUA is available, but two actual `cua.getState()` inventories in this owner session exposed only browser 1 named Chrome, `type=extension`, empty tabs; neither exposed `type=iab`. Both returned `Unable to load browser request-header policy`. Root separately observed its own IAB browser; that does not give this session that browser identity. No root browser ID was guessed. A Chrome DevTools inventory returning `about:blank` likewise does not prove IAB and was not used for interaction.

Consequently no native browser interaction, screenshot, viewport, tab, iframe, browser storage, service or fault injection occurred. No native image exists to archive. Still unverified:

- Actual same-origin share anchor opening and native reload with Unicode/newlines, including fragment retention.
- Native Back/Forward between valid, damaged and corrected links, and navigation confirmation cancellation/acceptance.
- KeepAlive editor/preview native popstate and BFCache interaction, including browser Back while an editor modal or share generation is pending.
- Real browser storage denial/recovery and native dialog focus/top-layer behavior after cached reactivation.

These need one available owner-session IAB channel and the reserved 5544 service turn. They must not be inferred from the memory-history results above. The deterministic pass found no new confirmed bug; unavailable native coverage remains an explicit boundary.

## Lifecycle and cleanup

Port 5544 was checked before preparation and after probes: no listener. No server was started, so no server PID/PTY or retained consumer exists. Vitest sessions `80472` (exit 1, probe assertion) and `53747` (exit 0) ended. No browser tab was created/closed, no user 8787/8788 or other service was touched, and no real-origin draft required backup/restoration. All probe storage belonged to disposable jsdom documents and was cleared after each scenario. Source refs and other owners' files preserved.

No application suites/build were rerun for this evidence-only batch. No production changes, main update, push or deployment.
