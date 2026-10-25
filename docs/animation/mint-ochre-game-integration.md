# Mint / ochre formal game integration candidate

2026-10-25 (Asia/Shanghai). Owner: final-two-character-game. Reviewed starting main: `c0ddd791fd98182b5888e986a9aa2b31b7680dc5`. Worktree: `/Users/nighca/.codex/worktrees/final-two-character-game/lie`; branch `codex/final-two-character-game`. Candidate only: not merged to main, pushed or deployed.

## Source review and ordered dependencies

Both sources start from `73ba1387c24762e48e78c003eef2421e53746a71` and were clean/frozen at handoff. Mint source chain: `4c213f83f7ebdd498b2031ff005f7936393bf155` → `b5c08960af2c3f2aad0b473f39d0f30cc5a9765e` → `dbecc26cfdf347d3e7bca8a35f76a38392ddf99f`. Ochre source chain: `0e4558eeaf65270ab75d2d36d3b7a6dea28f3583` → `17fefd8a859a5c516f1633afd0e708e7bcd8ffe5`.

The integration owner read both generators, verifiers, alpha audits, package construction, provenance, full ordered source changes and initiator review evidence. Final shoulder/neck and face evidence for mint, and shoulder/neck and hand evidence for ochre were independently viewed. The frozen builders were executed in memory with text writes intercepted: their full package JSON and provenance matched committed values exactly. This reads PNG metadata without writing or modifying pixels. The existing strict parser independently consumed both packages; no new animation runtime behavior was introduced.

Source review boundaries and native screenshots remain in [mint initiator review](../../design/animation-candidates/mint-puffs/initiator-review.md) and [ochre initiator review](../../design/animation-candidates/ochre-freckles/initiator-review.md). Rejected generated heads and intermediate screenshots remain in each candidate's archive in Git; they are not runtime assets or approved new visual material.

## Formal content changes

Only the mint-puffs and ochre-freckles manifest entries gain `animation` references. Each formal animation contains the exact reviewed package JSON and four native canonical source PNGs, copied without transformation. The old static four-state PNGs, IDs, Chinese names, accents, voices, all existing six characters' assets and all rules/UI/provider code are unchanged. Eight manifest entries now have optional animation references.

| Character | Package SHA-256 | Nodes / runtime PNGs | Canvas + declared asset pixels |
| --- | --- | --- | --- |
| mint-puffs | `253b6fde321f82198c0664d35a5b4c94333c513c58fd406a92dc903dd7d9b0df` | 13 / 4 | 7,862,580 |
| ochre-freckles | `599dd7b604d5dff60709837247bc2fc1973d80e8240ca5708ef0fe6fde66526d` | 21 / 4 | 7,862,580 |

Only these two candidates' active consumers were updated to the already reviewed `@lie/character-animation` / `design/character-presets` names. Mint provenance canonical-origin metadata changes path only; all PNG hashes stay identical. Historical evidence/check output and rejected design archives retain their original context. No runtime archive or rejected-generated-head file is copied. Public URLs remain `/appearances/`.

## Automated verification

Node 24.22.1 and npm 11.19.1, isolated candidate:

- All repository tests passed: 388 (runner9, generator21, gateway11, Web191, animation33, core51, UI38, voice34).
- All workspace types and Web → gateway builds passed. The cf build emitted its existing workspace auto-configuration warning; build completed successfully. No deployment was run.
- Generation, source strict check and dist postbuild check: 8 presets / 89 resources. The previous79 resources remain unchanged, with two packages and eight source PNG parts added.
- Mint strict parser, four native PNG/canonical hashes, pixel budget,1,280 samples, loops,100 interrupted switches and frozen waiting-correction invariants passed.
- Mint32-phase full-parent alpha/contact audit passed; threshold-sampled opaque hair minY default/speaking14.880, listening14.912, waiting12.900. This is a sampled bound, not exhaustive alpha coverage.
- Ochre strict parser, four PNG/canonical hashes,960 samples, loops,100 interrupted switches and33 full-parent waiting phases passed. Alpha audit preserved65,261/65,345/54,256 baseline points;1,221 opacity,1,615 armpit ink and8,243 pants/hand exclusion probes passed.
- Full baseline formal assets and manifest non-animation fields were compared against starting main; source/formal package bytes and all copied PNG bytes match. Checks supplement actual visual review, not replace it.

## Formal game acceptance and service boundary

Formal-game acceptance was completed independently by the animation initiator against `a2983073171a3c07632a024a1294ba1a14855fec` on the existing isolated5544 origin. Source QA commit is `c5de95c32ea457cf41b06712e5492dddca6bd000`; its documentation-only cherry-pick in this candidate is `97fc6ff8c93ef3e99e2b8159a076af603b1b919e`. Full [QA report and18 native JPEGs](mint-ochre-formal-game-qa/README.md) remain in Git. The integration executor read the full report and independently viewed desktop speaking, narrow waiting and fallback/reduced evidence. Application/runtime bytes have not changed since the388-test candidate.

Actual demo `/?demo=1&game=salt-sugar-mixup` exercised 小岚=mint-puffs and 阿湛=ochre-freckles in all four states at desktop1280×741 and actual391×1000 same-origin iframe CSS viewport. Switching kept correct identity and one visible canvas. Mint package blocking produced correct static fallback and clearing it restored animation. Both characters reduced-motion emulation produced static fallback and clearing it restored animation. No visible P1/P2 separation, duplicate ink or clipping was found within these observations. Waiting lasts400ms in the demo, so this game observation does not prove a whole breathing period; source phase/loop evidence is separate. Direct-page warn/error logs were empty; iframe host had one source-URL-less MutationObserver TypeError of unknown origin. Do not call the iframe console clean or assign that error to app/tool without evidence.

The independent QA worktree's initial @fs iframe URL was blocked. No allowlist was widened. The executor supplied one temporary `apps/web/public/mint-ochre-formal-qa-391.html` shell on the same5544 service with only the agreed same-origin game iframe, without a global viewport override or a second server. The archived narrow.html is an unused historical fixture, not the successful QA entrance.

After explicit QA release, the executor deleted that exact temporary shell, sent Ctrl-C to the original owned session19829 (normal interrupt exit130), and confirmed `lsof -nP -iTCP:5544 -sTCP:LISTEN` returned no listener. The QA owner cleared its overrides and closed owned tabs.5544 is the fixed reusable formal-game QA port for future tasks, started only while needed. The executor did not operate5358/5359, user5355 or8787/8788. No saved user draft, microphone or provider was touched; developer transport targeted unused local port9. Source/public/dist exact file sets were90=manifest+89resources, with no archive/rejected/prompts/evidence output. Root alone owns main integration; this candidate remains unpushed and undeployed.

## Known limits

Synthetic mouth timing and canonical pose switches are not natural limb lifts, blinking, mesh deformation or live phoneme sync. Source evidence includes bounded actual desktop/391 CSS-iframe views; these do not establish physical-device or cross-browser acceptance. Real hidden-tab recovery and live-provider behavior remain outside this content integration. No new visual direction or gameplay scope is proposed.
