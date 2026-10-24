# Ochre freckles four-state animation candidate

2026-10-25. Owned by ochre_animation. Candidate-only work; no production manifest, canonical static PNG, shared runtime or game UI changes. The user's current authorization permits author self-check, initiator review and formal game QA followed by coordinator integration; the older per-character user approval wording is superseded. This candidate does not activate itself.

## Assembly and source fidelity

1254×1254 logical canvas, four canonical PNGs copied byte-for-byte into parts. All raster content comes from the original default/listening/waiting/speaking portraits; no generated image is consumed, no raster was cut, rewritten or exported. Runtime polygons select heads, torso, sleeves, arms, lower body and contact groups. Hair, freckles, face, yellow hoodie, cream shirt, navy trousers and each original expression/gaze remain canonical.

Default/listening/speaking have body breathing ±3.5px. Default/speaking head tilts ±1.05° and translates ±1.2px; lowered arms swing ±1°. Listening ear hand and head share contact-root (±.8°/±1.2px) with no relative head motion. Speaking palm/sleeve group pivots at (870,650) ±1.6°; its upper shoulder remains stable with a same-source overlap. A same-source backing panel preserves the bent forearm and sleeve without a transparent hole.

Waiting uses one original upper torso/chin/arms contact assembly, with all involved sprites sharing the same full parent transform. Only scaleY ±.006 animates around lower-abdomen y950, above the actual trouser waist around y990. The lower region is fixed, including the trouser waist and clothing hem. Same-source overlap y942–958 is 16px. No rigid left/right swaying, head tilt, detached support hand or moving lower-body group is used in this state.

Speaking alternates the original closed-mouth default head and open-mouth speaking head on a synthetic sequence. These two original heads differ slightly beyond the mouth; this is full canonical head texture substitution, not an isolated mouth atlas or live lip sync. State-specific limbs change immediately with the generic 240ms numeric transform settle; no natural arm-lift/lowering transition, blink, mesh deformation, real voice/phoneme synchronization or sound integration is claimed.

## Bounded image generation

One built-in image_gen edit, zero repairs. All four canonical states and the native generated head were actually viewed. A proposed mouthless head was assembled then rejected because its neck registration created duplicate original/generated neck outlines. The unadopted output is retained at its native generated_images path and as an unchanged archive/rejected-generated-head.png; its exact prompt, reference, PNG SHA256, dimensions and alpha are in generation-records.json and prompts.md. No Pillow/script/Canvas pixel modification or background removal was used. Python/Pillow reads image metadata, alpha and source colors only.

## Reproduction and automated evidence

Use Node24.22.1 from `/private/tmp/lie-toolchain-node/node-v24.22.1-darwin-arm64/bin` on PATH:

- `python3 design/animation-candidates/ochre-freckles/build.py`
- `node --experimental-transform-types design/animation-candidates/ochre-freckles/verify.mjs`
- `python3 design/animation-candidates/ochre-freckles/audit.py`
- `npm run typecheck --workspace @lie/appearance-animation`
- `npm run test --workspace @lie/appearance-animation`

Final output is recorded in evidence/checks.txt. Strict readAnimationPackage parsing, actual PNG headers/dimensions/hashes and canonical identity pass. 960 samples remain finite with exclusive head and state-specific limbs; four loops close; 100 interrupted changes preserve exact numeric continuity; 33 full-parent waiting phases retain the fixed lower body, waist anchor and chin/arm contact. The 33-phase world poses are generated to ignored evidence/poses.json by verify.mjs and consumed by audit.py.

Read-only source probes preserve all 65,261 default, 65,345 listening and 54,256 waiting high-alpha baseline samples. 1,221 nonempty opacity probes at actual neck/shoulder/wrist/waist points across full parent transforms pass. Following real visual findings, 1,615 source-classified armpit ink probes ensure torso ink is absent from the independently moving arm, and sleeve ink absent from the torso; 8,243 source trouser-edge and warm hand pixels ensure no pants are copied into the arm and no old hand into the torso. These are bounded geometric/color probes, not a substitute for actual Canvas appearance review. Speaking deliberately combines default torso/left arm with speaking shoulder/right arm, so no full-source speaking equivalence is claimed.

## Actual visual self-check and review entrances

Author service on assigned5358, PTY21001:
`node node_modules/vite/bin/vite.js --config design/animation-candidates/ochre-freckles/vite.config.ts`

- `http://127.0.0.1:5358/design/animation-candidates/ochre-freckles/formal.html` mounts the actual unmodified Vue AnimatedPortrait component and canonical fallback. State changes, 100ms interruption sequence, static/animation, bad-path fallback and unmount/remount controls are available.
- `http://127.0.0.1:5358/design/animation-candidates/ochre-freckles/narrow.html` embeds that page in an actual391px same-origin iframe without changing shared browser viewport. The older formal?narrow=1 is only a content-width aid, not the actual iframe check.
- `http://127.0.0.1:5358/design/animation-candidates/ochre-freckles/qa.html` runs the formal parser/timeline/Canvas renderer for live author inspection and pause/resume. `?phase=extrema` shows original four states and 1s/3s opposite extrema; `&detail=shoulders`, `&detail=hands`, `&detail=waist` inspect y280, y540 and y850 regions respectively. `?phase=face&detail=face` supplies 0/.25/1/3s canonical head/mouth inspection.

The author used its own IAB tab, not Chrome or the shared user game tab. Actually viewed four formal desktop states; positive/negative head/neck/shoulder and hand/sleeve detail; waist/trousers; four narrow states in a391px iframe; quick interruptions; static disable/re-enable; deliberate bad-path fallback; actual component unmount/remount. Visible Canvas was1254²; static mode and bad path hid it; remount restored the accessible animated image. Captured tab warning/error logs were empty after these controls. No shared viewport override or user8787 service was changed. No live voice test is claimed.

The initiator independently viewed full formal states/shoulders and identified real duplicate armpit spikes in default/listening1s. Those were corrected by separating torso/sleeve ink along original transparent gaps, moving left-side overlap into unlined cloth, and independently fitting listening geometry. The author then actually re-viewed both extrema: evidence/hands-fixed-positive.png shows the corrected positive phase. Lower silhouette tails were separately diagnosed and removed from both moving-arm and fixed-torso masks; evidence/formal-speaking-final.png and narrow-speaking.png show the final clean outline. Earlier hands-positive.png and shoulders-negative.png document earlier inspection, not the final armpit correction. Initiator final rereview and formal game activation QA remain its responsibility.

Hidden-tab pause/resume, media reduced-motion emulation, late appearance loading/races and full game integration were not separately exercised in this asset-authoring self-check. The shared component/runtime remains unchanged; passing fake/module checks is not real provider evidence.

## Handoff boundary

Worktree `/Users/nighca/.codex/worktrees/ochre-freckles-animation/lie`; branch `codex/ochre-freckles-animation`; original base `73ba1387c24762e48e78c003eef2421e53746a71`; no extra dependency commits. Only `design/animation-candidates/ochre-freckles/**` is intended for integration. Offline locked dependencies installed with ignore-scripts (208 packages, 0 audit vulnerabilities); ignored node_modules and generated pose evidence are not handed-off source changes. Root alone integrates, activates, runs final game QA and publishes. No main mutation, push or deployment by this owner.


## Subsequent initiator review

Final source/visual independent initiator checks, corrected-version391 observations, actual limits and preserved rejected drafts are recorded in [initiator-review.md](initiator-review.md); that record supersedes earlier pending initiator/old-head viewport status for those specific checks. Formal game activation remains separately pending.
