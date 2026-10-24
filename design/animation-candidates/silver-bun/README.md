# Silver-bun animation candidate

Candidate only, not activated in canonical manifest. Source four-state PNGs are unchanged. Owner `/root/silver_bun_animation`; 2026-10-24.

## Actual assembly

1254² logical canvas, 13 nodes, six shared PNG texture assets, four looping clips. Generated mouthless head and mouth atlas are shared in every state. Default/speaking torso uses canonical default-source; listening and waiting have dedicated canonical pose-source torsos, with broad runtime polygons retaining original shoulder/collar contours; neutral arms, listening arm, waiting contact group, and speaking arm use additional runtime polygon masks on byte-for-byte canonical texture copies. No whole portrait is rendered. Head/body/neutral arm/speaking arm have relative movement. The canonical torso retains sleeve-shoulder caps above y520 as overlap material; those caps move with body while the outer limbs move independently below/over them.

All states breathe ±4 px. Default/speaking head tilt is ±1.2°; listening/waiting contact groups tilt ±0.85°; all head groups translate ±1.5 px. Neutral arms sway ±1.2°, speaking hand ±1.9°. Listening hand and waiting two-arm contact group share `head-root`, keeping ear/chin contacts stable. Poses remain neutral arms down, hand by ear, chin rest with opposite forearm support, palm-up speaking.

The generated torso was rejected after parent zoom review found incompatible shoulder geometry. It is no longer referenced or present in current parts; earlier mask-only fixes are superseded. Generated waiting arms were also rejected for proportions; canonical runtime masked limbs preserve pose identity. The generated head remains recognizable but not pixel-identical to original (cheek contour differs). No user approval or completed visual pass is claimed for this latest correction.

## Reproduce

Node 24.22.1; cached workspace dependencies installed with `npm ci --ignore-scripts --offline` (0 audit vulnerabilities). `build-package.py` copies unmodified PNGs and emits JSON only, with Pillow used for read-only metadata. It depends on original built-in output paths; final package/parts are committed and work independently of generation output paths.

Validation: `node --experimental-transform-types design/animation-candidates/silver-bun/check.mjs`. Strict package parser, all PNG header dimensions and SHA checks, finite sampling at 25 ms intervals, four seamless loop boundaries, exclusive mouths, continuous body/head motion, contact parent ownership, original canonical four-state hash recomputation, exact numeric-transform continuity at each interrupted setState/advance(0), finite intermediate poses, target limb visibility, and mouth exclusivity pass. Interruptions occur every 100 ms while the 240 ms settle is still active; the continuity check asserts every transform channel of every node. Native Node strip-only cannot parse existing runtime parameter properties, so transform-types is explicitly necessary for this authoring check.

Preview from worktree: `npx vite --config spikes/animation-preview/vite.config.ts --port 5352` after `npm run appearances:generate` (ignored static output only). Open `http://127.0.0.1:5352/?appearance=silver-bun&src=/@fs/Users/nighca/.codex/worktrees/silver-bun-animation/lie/design/animation-candidates/silver-bun/package.json`.

Deterministic extremes: `/@fs/Users/nighca/.codex/worktrees/silver-bun-animation/lie/design/animation-candidates/silver-bun/inspection.html`; this candidate-local authoring page imports actual sampler/Canvas backend and draws all four states at 1 s/3 s.

## Actual visual checks and limits

Actual Codex IAB desktop playback: four states, repeated switching and interruption; head/neck, shoulder/sleeve, wrist/elbow and ear/chin contact viewed. Deterministic positive/negative extremes at 1 s/3 s viewed, source screenshot `evidence/extrema-desktop.jpg`. Actual 391×844 viewport confirmed by innerWidth, all four states viewed and native full-page screenshots captured; viewport reset/released. No obvious detached head/hand at checked phases; no outer torso glow visible after clipping.

Reduced-motion/hidden-page lifecycle, failed loading fallback and unload are existing component behavior; not separately re-tested for this asset-only candidate. No game activation, microphone, live provider, real lip sync, blink, mesh deformation, or authored natural arm-lift transitions. State-specific limbs swap immediately under shared numeric settle. Waiting eyes reuse shared default gaze rather than original upward gaze. No production build/runtime source changed; package-specific asset checks performed, no claim of full application regression rerun.

Clean handoff base `c9c2e765b19ad84b70f54a5cefc8ad45b6f90479` includes reviewed main `666ed1dee3588020c4b47fb7e0b95d887482b372` plus explicit contract dependency cherry-picks `710950f` / `c9c2e76`; original dependencies `dd35d483fce31e9319bb748ae75b66c10a28502c` → `f60ff43ff766ce8baf56da1791c6d3e2e1a9937c`. Candidate commit must be integrated only once, dependencies not replayed when already present.

## Shoulder-mask follow-up

Original candidate commit stays immutable. Only torso mask geometry changed: left upper silhouette local x230/232→300; right upper shoulder x793/y290→740/y320 and x811→770. No PNG bytes, contact parent, limb proportions, state track, engine or production manifest changed. Source SHA checks verify originals and copied parts. Previous screenshot evidence documents the initial candidate and must not be treated as proof of this correction. On this follow-up the subagent IAB browser became unavailable (inventory only exposed Chrome); no alternate browser, viewport override, lifecycle check or new visual pass is claimed. Parent visual review remains required.

## Right shoulder bridge follow-up

Parent screenshot of the previous follow-up showed a small right shoulder contour suspended above the torso. The mask point `[740,320]` is now `[740,280]`, the adjoining `[770,364]` becomes `[780,364]` for the rotated-arm overlap margin, refilling only that upper shoulder bridge; the preceding left-corner correction remains. Read-only source samples at logical `(818,456)` through `(848,468)` map to aqua torso pixels with alpha253–254. Candidate check now asserts these five bridge points remain inside the torso mask at both ±1° arm rotation bounds (including the smaller neutral-arm excursion). This verifies geometric overlap, not final visual appearance. No PNG bytes changed.

For parent visual verification use the deterministic page with `?detail=shoulders`: `http://127.0.0.1:5352/@fs/Users/nighca/.codex/worktrees/silver-bun-animation/lie/design/animation-candidates/silver-bun/inspection.html?detail=shoulders`. All four states at both 1s/3s are enlarged around shoulders; omit the parameter for full-body phases. Subagent IAB remains unavailable; no new screenshot or visual acceptance is claimed.

## Canonical shoulder contour replacement (current correction)

The 2ddc close-up still showed clipped shoulder material on both sides. Current assembly removes the generated torso completely and uses unchanged canonical default-source with a broad mask outside its original shoulder silhouette, including shared upper sleeve caps. This restores source contour material instead of connecting incompatible generated/source edges with a few polygon vertices. No original/candidate PNG byte is modified; unused generated torso texture is removed from current candidate data.

`python3 design/animation-candidates/silver-bun/audit-shoulders.py` read-only inspects all canonical pixels with alpha≥200 in x330–950 / y410–520: all 46,450 shoulder-band pixels are retained by the torso mask across 111 rows. This proves this band is no longer clipped; it does not prove final composited art acceptance. Generic data/hash/interruption checks also pass. Full-body and shoulder close-up deterministic 1s/3s pages reflect the new package automatically; parent must verify final continuous silhouette and absence of duplicate lines at both phase extremes. Previous evidence screenshots all precede this correction and are historical only. Subagent has no available IAB and did not use another browser or change viewport.

## Neck / waiting shoulder follow-up (current)

Parent c19e zoom review confirmed the shoulder-top gaps gone, then identified a generated skin spike at the left collar and duplicate waiting shoulder outlines. The head sprite now excludes its lower central rectangle x540–1030 below y925 (local image coordinates); jaw and outer hair remain, while the canonical torso supplies neck/collarbone/collar. This changes only runtime masking, not PNG bytes.

Waiting now hides the default torso and shows `waiting-torso` from the canonical waiting-source image. Its numeric transform and parent are exactly the same as waiting-arms (`head-root`), so the retained shoulder cap and arm group use identical source geometry and move together, eliminating the mismatch between default and waiting outlines. The whole waiting torso therefore shares the small head-group lean; body-root breathing still runs separately. This deliberate contact constraint means waiting has less independent head-versus-torso rotation than other states. No extra character-specific engine behavior was added.

Checks assert exclusive target torso visibility and matching waiting torso/arm transforms, plus read-only full shoulder bands for both source poses and excluded lower head collarbone rectangle. Existing four-state/interruption/hash checks still pass. No new IAB visual pass is claimed; parent must review full-body and shoulder phase pages again. Old screenshots remain historical evidence only.

## Full-body listening waist / speaking lowered-arm follow-up (current)

Parent actual full-body review found a white diagonal missing-material strip on the listening left waist and a fragment of lowered right forearm/hand behind the speaking coat. The listening clip now hides generic torso and shows a dedicated `listening-torso` from unchanged listening-source. Its left mask retains the actual listening coat contour from underarm through hem. It shares `head-root` and identity local transform with listen-arm to keep the source shoulder/ear contact geometry coherent during both lean extremes, as with the existing waiting contact constraint. Listening therefore also has less independent head-versus-torso rotation; body-root breathing remains active. The approved generated-head lower-neck mask and waiting assembly are unchanged.

The generic default-source torso and listening torso now end inside the right coat/pants silhouette from y880 downward, excluding the neutral lowered forearm. Separate right-neutral sprite remains active in default/listening, while speaking shows only its raised-arm sprite. No PNG bytes, providers, player or canonical manifest were changed.

Read-only audit retains all 21,714 aqua cardigan pixels in the affected listening left waist/hem rectangle (x330–649, y745–990). It also rejects all opaque orange skin pixels in x920–1029/y890–1219 for both generic and listening torso masks, catching the former lowered-arm fragment. The checks still do not replace final composed visual verification. All contract/hash/finite/mouth/visibility/interrupted-continuity tests pass, including matching listening torso/contact transforms and exclusive target torso visibility.

Parent must review ALL four full-body states at 1s/3s again, including coat hems, both forearms/hands, trousers, and previously passed shoulders/neck. The deterministic inspection page now accepts `?detail=waist` for enlarged waist-to-hand crops of all eight phases; omit detail for full body, or use `?detail=shoulders` for shoulder/neck. No fresh subagent IAB pass or screenshot is claimed; browser remains unavailable and old evidence is historical only.

## Neutral-arm / listening elbow contour follow-up

Parent full-body review confirmed the waist gap and speaking lowered-arm residue gone, but found old right-neutral mask clipping the outside forearm ink and listen-arm clipping its lower elbow arc. Right-neutral now includes a wider outer forearm/hand envelope and inner ink margin; it remains hidden in speaking/waiting, so no torso/arm residue is restored. Listen-arm lower contour mask is expanded beyond the source sleeve arc instead of cutting across it. No shoulder/neck, torso, frame track, or PNG changes in this follow-up.

Read-only audit checks the source forearm skin plus opaque nearby ink (within 8px of skin), and every opaque pixel in the listening lower-elbow arc region x260–470/y675–740. These assertions use actual source alpha and include navy outlines; they do not treat the connected trousers silhouette as part of the hand. Parent has reported live four-state full-body and 1s/3s full-body phases without the previous defects on current data, and is separately checking waist zoom; subagent does not claim its own new browser pass.

## Initiator final review

2026-10-24: initiator completed actual four-state desktop/391 and eight full-body extrema review against a965211. Source checks and independent QA pass. See `initiator-review.md` and its native screenshots. User visual acceptance is still pending; not activated. Earlier screenshots and repair notes are historical.


## User mouth / motion feedback correction (2026-10-24)

Follow-up base `d68ad397d6d5af486cc34fce2db127d96f88393c`. User observed a left/lower mouth placement and insufficient micro motion. Only candidate data and local inspection/check helpers change; six PNGs, provenance hashes, crop rectangles, scale, masks and parent chains stay byte-for-byte unchanged.

The generated mouthless head was viewed alongside canonical default and the mouth atlas. Placement is judged relative to this generated head's nose, cheek folds and chin: the old mouth occupied the lower/left side of the available lip region. Both closed/open sprites move exactly +7 x / −6 y logical pixels: closed `(577,316)`→`(584,310)`; open `(577,309)`→`(584,303)`. Keeping the same displacement, crop, scale and zero rotation preserves the existing relative corner registration through opening; no unsupported rotation correction is introduced. Final facial appearance remains a user/initiator visual judgment, since the generated head differs slightly from canonical proportions.

New amplitudes are listed above. Body, ordinary head and ordinary arms retain independent tracks; listening/waiting retain the existing shared head/contact torso/hand constraints. The shoulder bridge check now derives each actual right-arm track's minimum/maximum (neutral ±1.2°, speaking ±1.9°), rotates around that node's actual pivot and asserts the five overlap probes remain within the torso mask. This is geometric overlap evidence, not a claim that all composited contour pixels are visually perfect. The unchanged source audit separately checks shoulder/waist/forearm/elbow retention and unwanted lowered-arm exclusion.

`inspection.html?detail=face` adds CSS-only close-ups of canonical default and all states at 0/.25/1/3 seconds (speaking includes both mouth states); no image is altered. Full-body, shoulder and waist inspection modes remain available. Targeted contract/hash/Timeline/mouth exclusivity/finite/loop/interruption and source-mask checks pass. This subagent has not performed a fresh IAB visual pass or changed a shared viewport; the initiator is doing actual browser acceptance against the new data. All older screenshot evidence and the a965211 review describe earlier amplitudes/placement and are historical for this correction. User approval remains pending; no activation or production manifest changes.


## Mouth-corner angle follow-up

Initiator actual 5354 `detail=face` review of `b54ad7c`, screenshot `/private/tmp/silver-mouth-feedback-first-face.jpg`, confirmed the horizontal placement improved, but the right mouth corner remained too low relative to the generated right cheek fold. The subagent viewed this screenshot: the dynamic corner line was flatter than canonical, so another pure translation would misalign the already-near left corner. This evidence supersedes the previous placement-only/zero-rotation trial.

Both mouth sprites now rotate −9° about their own crop centers, without changing crops or scale. Closed local pivot is `(295,130)`, transformed center `(631.2,326.8)`; open local pivot is `(310,190)`, transformed center `(633.6,329.4)`. These preserve each b54 world x-center and move each world y-center up 4 px before rotation. Rotating about those centers prevents a left-upper-corner orbital displacement; the 2.4 px x / 2.6 px y relative center offset of the two atlas crops remains unchanged. This keeps opening/closing registration consistent without claiming the two originally generated mouth drawings are pixel-identical.

Six PNGs/provenance, all body/head/arm amplitudes, masks, parent chains and visibility tracks remain unchanged from `b54ad7c`. Targeted contract/hash/finite/loop/mouth/Timeline-interruption checks and read-only source shoulder/waist/forearm/elbow audit pass. No new subagent IAB visual pass or screenshot is claimed; initiator browser review and user acceptance remain required. No manifest activation.


## Enlarged-motion sleeve overlap correction

Initiator's actual waist close-up `/private/tmp/silver-feedback-waist-first.jpg` showed a long internal right sleeve/torso gap in default/listening at 1s and a short default left inner cuff gap. The subagent viewed that native screenshot. Full-chain read-only alpha probing located right missing coverage around source x875–914/y666–850 (the first-phase broad probes counted 89 default and 427 listening missing samples); this was a loss of overlap under independent limb/torso rotations, not a PNG defect.

Only generic/listening torso right overlap vertices change: `(875,680)`→`(900,680)` and `(900,800)`→`(925,800)`. Only generic torso left inner overlap changes: `(443,759)`→`(433,759)` and `(385,912)`→`(375,912)`. The lower-right y880+ exclusion boundary stays unchanged, preserving the earlier removal of the lowered right arm. Waiting masks, all mouths, approved motion amplitudes, crops, parent chains and PNG bytes remain unchanged.

New `audit-seams.py` invokes the actual TypeScript `readAnimationPackage`/`sampleClip`, then evaluates source alpha and polygon masks with complete forward/inverse parent transforms, including inherited visibility. It tests 32 full-cycle phases at 125ms intervals for the diagnosed internal right seam x870–910/y640–840 in default/listening, plus default left inner cuff x395–425/y830–880. For originally opaque source interior pixels (alpha≥240), composed nearest-source alpha must remain ≥128. These fixed internal bands intentionally exclude moving outer silhouette edges; the audit neither modifies image pixels nor claims antialiased Canvas or colour/duplicate-line equivalence. Run with Node24 on PATH: `python3 design/animation-candidates/silver-bun/audit-seams.py`.

All 32-phase seam checks, strict package/hash/Timeline tests and prior read-only source-mask audit pass. Initiator reloaded actual 1s waist close-ups and reported both right gaps and left cuff gap gone, with no lowered-right-hand residue seen. The subagent does not claim a separate fresh IAB pass; final outer contour/composited appearance remains initiator/user review. No activation.


The same enlarged-motion review then found a speaking 3s shirt-edge zigzag below the palm, screenshot `/private/tmp/silver-feedback-waist-fixed.jpg`, also viewed by the subagent. It comes from the original speaking-arm polygon including speaking-source white-shirt pixels in x810–880/y620–810; rotating that fragment independently exposes its edge over the default-source shirt. Its inner polygon now follows the original hand/sleeve edge instead of including the unrelated white shirt. This is separate from the torso overlap at x875+; no extra torso node is introduced. The source audit now rejects every opaque light-shirt pixel in that bounded band while retaining all 1,225 warm palm/finger pixels in x810–880/y695–755 (alpha≥200, red>170, 70<green<210, blue<145). This threshold targets actual skin, excluding two dark shirt-boundary antialias pixels around y785/796; navy outline/colour acceptance remains visual. PNGs and all approved transforms/trajectories remain unchanged.

## Latest initiator feedback review

Final source `7509b19` completed independent source review and actual initiator face/open-mouth, eight full-body phases, enlarged seams and live four-state desktop/391 checks. See `feedback-review.md` and native silver-feedback screenshots. Previous initiator review describes older amplitude/placement; user visual approval of this revision remains pending. No activation.
