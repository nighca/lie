# Independent accepted rigid-animation batch review — 2026-10-25

后续状态：原22b审计发现保留。owner随后以d106修正crop检查、6ed完成真实Canvas归因，再由root授权最小silver button重叠修复并交a432b72；root已查看两张修复原图与精确delta，但完整23链final review/独立PR turn尚未完成。下文是冻结原报告，不将其历史限制改写为新PASS。

Review owner: architecture_code_review. Frozen source: `/Users/nighca/.codex/worktrees/approved-animation-rigid-batch/lie`, `codex/approved-animation-rigid-batch`, base `8be6d0315a393281484d65fa903353d4ea666739`, head `22b2ee8b635b2e6944d3801721673bc5122dfa3b`. Report worktree starts at reviewed main `9316701433ba21017286c7023af5470275c23a28`. No source/Git/evidence changes in the animation worktree, and no service/browser/provider/microphone operation.

## Disposition

One confirmed **P2 audit correctness issue, AR-01**, reported immediately to root. The accepted visual result is not revoked and a new visible animation defect is not established. The old claim that all A seam probes passed cannot be relied upon until the crop-aware author audit is repaired/requalified. Root has asked the animation owner for a new separate corrective commit while keeping22b frozen. No additional runtime/resource contract blocker was found in this review.

## AR-01 — crop-boundary omission yields false seam coverage

At the frozen head, each of `design/animation-candidates/{silver-bun,salt-pepper-beard,plum-crop}/check-waiting-revision.py` has two affected samplers: `draw_alpha` around lines105–116 and the ordered wrist-color sampler around lines165–174. A cropped sprite is inverse-transformed into local coordinates, but the code merely adds crop x/y and tests the **whole source image** dimensions. It does not first restrict local coordinates to `[0,crop.width) × [0,crop.height)`. The actual renderer (`packages/character-animation/src/canvas.ts:37`) draws only that cropped source rectangle to the same-sized destination. The audit can therefore credit opaque source pixels outside the rendered sprite footprint.

This is concretely relevant to silver's newly introduced25×42 button and6×42 backing crops, as well as its pre-existing mouth atlas crop. It is not a hypothetical malformed package. The gray/plum audit copies contain the same omission; scope of their actually affected measurements requires the owner's corrected rerun rather than an assumed failure or pass.

[Independent read-only reproducer](crop-audit-probe.py) runs the existing silver audit source in memory, adding only the missing local crop extent constraint to both samplers. It never writes the author source, package, PNG or evidence. Node24.22.1/Python bundled Pillow+numpy; [recorded failure](crop-audit-results.txt): all earlier static/rigid/bounds checks pass, then waist/contact opacity fails at phase index20/32 (2.5 seconds of the4-second loop). Six entries refer to three duplicated source sample positions: `(594.5,626.5)`, `(596.5,626.5)`, `(598.5,626.5)`.

The button's local destination is25×42 at(592,626) under the breathing group. At2.5s, the group translates down0.6px, so its destination top is626.6; those sample centers are just above the real crop footprint, while the unbounded source lookup can still credit original PNG material. The6px backing is a separate narrow footprint and cannot be treated as a whole-image fill. This demonstrates why the former PASS was unsound. It does **not** demonstrate a normal-scale visible white slit: the point model is nearest-native alpha, omits Canvas antialiasing and samples a fraction of a pixel from an edge. The existing actual visual approval remains the separate artistic evidence.

Expected: audit matches renderer crop clipping, and PASS claims reflect all executed assertions. Minimal improvement: add local crop bounds in both samplers, regression-test a deliberately opaque image beyond a tiny crop, rerun without moving thresholds/masks to hide failures, and report any newly failing boundary points before deciding whether they are interior-probe mistakes or material visual defects. Do not silently alter user-approved motion/PNG to make an audit pass. Owner follow-up will be reviewed separately; this report freezes the original finding.

## Independent identity and package checks

[check.mjs](check.mjs) and [full results](check-results.json) inspect all20 ordered commits, parse all changed JSON per commit, and strict-parse every changed schemaVersion1 animation package (including archived rejected versions). This verifies commit scopes and package semantics rather than treating archived scale packages as active. Each commit SHA, subject, file count and JSON/package count is recorded in results.

Final183-file diff is restricted to five candidate directories, five formal packages and animation documentation/evidence. Formal changes are **exactly** the five `design/character-presets/assets/<id>/animation/package.json` files. No native PNG or other formal asset/manifest, application, core, player, generator script outside these candidate directories, package/lock or dependency change. Diff from known published `abb12dbf` to source base is empty in animation candidate/formal/player paths; a future PR must still be isolated to this batch rather than pushing unrelated local-main history.

For each five IDs, independently verified exact candidate=formal=ignored generated-public SHA256 matches accepted-package-sha256.json. All referenced native parts equal their base blobs and formal parts; asset maps unchanged. Final hashes:

| ID | SHA256 |
| --- | --- |
| silver-bun | 52ac940f1a01b36909757897281e4c6cd997cbb4e61e25dee172d518ac8efd17 |
| salt-pepper-beard | 92693d4321f48d6a9af578cb4e56d0d028396da5f8bc47b9fa7ff7098d97bde8 |
| plum-crop | bcf6fe83894384997b45f53e8f13abdfd131c2bb666a5bbdfe5720d935624bfc |
| mint-puffs | bb4c9fad042cc871c6fed77e46237bf72bc413f7ef05d50e801b0488e2543adc |
| ochre-freckles | b5dce30a0aac378a5ba3a660b8c730c4dfc82afe5ea799bf29a4b272bce499c7 |

Real strict parser and timeline independently sampled **4,820 poses** (241 per state ×4 ×5). Finite transforms and numeric loop endpoint key equality hold. All requested target clips have no scaling tracks. Three A characters' unaffected default/listening/speaking visible sprite definitions and full-parent world matrices exactly equal base across2,169 poses. Each package additionally passes100 interrupted numeric-continuity sequences (500 total). These checks establish numeric/state continuity, not all-frame alpha/contour quality.

Independently reran the parent's read-only head-ancestry script: [head-shape-results.txt](head-shape-results.txt), silver241/gray241/plum241/mint723/ochre482 checks pass, constant uniform head ancestry scaling and target no-scale tracks. Static original uniform head fitting is retained; no global head pulse or stretch is substituted.

## Actual code/resource review

Read real strict parser, sampler/timeline and Canvas matrix/crop/render behavior; reviewed final candidate node parentage/masks/clips and generator deltas. Silver/salt/plum head/hand share rigid head/contact ancestry while clothing/supporting forearm and cuff layers belong to independent translation roots; trousers remain fixed. Silver button/backing are source crops, not edited textures. Plum introduces a waiting-only head mask/neck backing, with original other-state sprites intact. Mint separates listening/waiting contact from translating chest and preserves lower body; default amplitude and static+2px registration changes are intentional. Ochre preserves one speaking head and toggles only a bounded native mouth patch; waiting has separate head/contact and chest/lower nodes. No shared runtime change is necessary for these data-only behaviors.

Read final verifier/audit changes (including A common audit plus role-specific differences, mint seam/rigidity/torso-ink checks, ochre crop-aware alpha/mouth/neck ownership checks), source revision records and parent/integration reports. The ochre verifier writes evidence/poses.json at the end; it was **not executed** in this review and its documented EPERM limitation is not relabeled PASS. Author generators can write JSON/provenance; silver also copies original generated PNGs from a provenance absolute path. None was executed here. Their code is reviewed, and final JSON identity is checked independently; this review does not newly claim generator reproducibility or machine-independent archival script execution.

## History/provenance and evidence limits

The20-chain preserves initial rejected scaling commits, then character-specific rigid/contact corrections, then parent withdrawn and replacement reviews, then final activation. Archive readmes label scale drafts rejected, intermediate seams/cuffs unapproved, some explicitly reconstructed from recorded parameter changes rather than pretending original capture bytes. Baseline packages and necessary source PNGs remain in Git; original absolute generation paths document provenance and are not runtime asset URLs. Candidate HTML imports were made relative; historical preview URLs remain task-local evidence, not portable production entry points. No credential/header material was observed in reviewed changed text; no secret files were opened.

The final parent report explicitly states user acceptance and points to formal integration. Earlier source revision notes still say pending: read them as historical author checkpoints, not newer authority than the final accepted parent/integration record. Root separately confirmed the user's actual approval text; this review does not infer it from code.

Reported266 tests/types/build are the animation owner's prior actual runs, not rerun by this reviewer. The9 formal screenshots establish game-scale routes/state selection with400ms demo waiting; they do not prove full waiting loops. Parent36 normal/extrema/closeup screenshots include rejected first attempts and later corrections; numeric full-loop/alpha checks are distinct from artistic acceptance. No screenshots were generated or edited in this review. No claims of real provider, microphone, hardware/mobile, true-hidden recovery or delayed-success race acceptance are added.

## Reproduce and handoff

Read-only checks: Node24.22.1 `--experimental-transform-types check.mjs <frozen-source-root>`; head-shape script takes the JSON source argument shown in its code. Crop repro: bundled Python with Pillow/numpy and Node24 on PATH, `crop-audit-probe.py <frozen-source-root> silver-bun` — **expected exit1** documents AR-01, not a passing suite. No evidence-writing verifier, build, PNG generation or full-suite rerun.

Only this review directory is changed in the review worktree. Animation source HEAD rechecked unchanged at22b. Identity/sampler checks ran while source was clean; at final handoff the owner had begun the requested corrections and the three A audit scripts were dirty. Those edits are owned by the animation specialist and were neither modified nor included here. Reproduce the frozen checks from a clean22b checkout, not by overwriting that in-progress work. Root remains sole integrator; no main/PR/push/merge/deploy operation performed. Root can archive/integrate this report independently while the owner corrects AR-01 in new commits.
