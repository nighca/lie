# Plum-crop animation candidate

2026-10-25. Owner: plum_animation_resume. Candidate-only files; canonical source images, production manifest, runtime and UI are unchanged. The user authorized coordinator visual review and integration of later characters without another individual user acceptance gate; this candidate still requires that actual visual review before activation.

## Assembly

1254² logical canvas, 14 stable nodes, five byte-preserved PNG assets. Four canonical pose textures and one built-in imagegen mouthless head are shared across the four states. Runtime polygons/crops select torso, neutral arms, listening ear contact, waiting chin-rest/supporting-arm contact group, speaking palm-up arm, closed mouth and open mouth. No full-state portrait sprite is drawn. The generated head keeps the purple short curls, freckles and gold earrings, but is a new drawing, not pixel-identical to canonical. Listening/waiting reuse its neutral gaze, rather than the upward gaze in those canonical heads.

Default/listening/speaking body breathe ±4 logical pixels; head translates ±1.5px and tilts ±1.2° (listening ±.85°); lowered arms sway ±1.2°, speaking arm ±1.9°. Waiting uses the silver feedback-corrected approach: lower body fixed, upper torso/head/contact arms breathe in scaleY ±.006 about waist y850, with a 16px source overlap at y842–858. This avoids a head/pants rigid sideways sway. Listening hand and all mouth parts share head-root. Neutral torso and arms are independent; waiting arms/torso/head share the waist breathing transform to preserve chin contact.

The mouth sprites are original canonical mouth regions via crop/mask, not a generated atlas. They switch on a synthetic timing sequence. There is no real voice/phoneme synchronization, blink, mesh deformation or authored natural arm-lift transition. State-specific limbs swap immediately; the existing generic 240ms numeric settle handles shared transforms. These limits must not be represented as completed features.

## Native sources and reproduction

All four canonical PNGs were viewed before authoring. One new built-in imagegen call produced the shared mouthless head, with exact prompt in prompts.md. Native output remains at:
`/Users/nighca/.codex/generated_images/01a16e95-7926-79e0-a8ae-6f56388db3d8/exec-7ec2e3ee-5d07-4ed0-b3b3-9f81361a655f.png`.
Its bytes were copied unchanged to parts/head.png. Canonical textures were also copied byte-for-byte. No Python/PIL/Canvas export, pixel editing, background removal or image rewriting was used. Python/Pillow only reads source pixels/alpha for analysis. Prior owner's unknown output history is not claimed absent; this continuation's bounded budget is 1 generation, 0 repair generations.

`python3 design/animation-candidates/plum-crop/build-package.py` reads committed PNG metadata/hashes and emits package/provenance JSON; it never changes images. Provenance records origin, SHA256, actual PNG dimensions, mode and alpha extrema. Candidate is self-contained for playback; generator native path is needed only by check.mjs to compare native source hashes, not to load the animation.

Node 24.22.1 on PATH:
- `node --experimental-transform-types design/animation-candidates/plum-crop/check.mjs`
- `python3 design/animation-candidates/plum-crop/audit-seams.py`
- `npm run typecheck --workspace @lie/appearance-animation`
- `npm run test --workspace @lie/appearance-animation`

All pass: strict parser/unknown fields/version checks, PNG headers/dimensions/source hashes, 960 finite four-state samples, loop boundaries, exclusive mouths and target limbs, contact parents, anchored waiting breath, 100 interrupted switches (every numeric channel exact continuity), 33 existing module tests and module typecheck. Read-only audit asserts no clipped sampled opaque canonical body/arm pixels in default/listening/waiting, no warm lowered-right-arm skin retained in generic torso, and 71,136 internal opacity probes across 32 full-chain phases per state. Speaking body intentionally reuses default torso/left arm. These bounded geometric/nearest-alpha assertions do not establish full Canvas colour, outline, antialias or outer silhouette quality.

## Review entrance and actual visual status

Author service on port5356:
`http://127.0.0.1:5356/@fs/Users/nighca/.codex/worktrees/plum-crop-animation/lie/design/animation-candidates/plum-crop/inspection.html`

Live four-state reference/animation, pause and 100ms interruption sequence; `?phase=extrema` shows all original references and 1s/3s phases; add `&detail=shoulders` or `&detail=waist`; `?phase=face&detail=face` shows original heads and 0/.25/1/3s phases to inspect both mouth states. The page imports actual parser/sampler/Canvas backend and loads candidate/canonical paths directly; no generated public assets are required. HTTP200 verified. Preview is authoring only and does not connect microphone or providers.

Current agent actually viewed canonical four states and generated native head. CUA inventory exposed IAB, but actual createBrowserTab returned "Browser is not available: iab"; no live Canvas screenshot/desktop/narrow visual pass is claimed. No Chrome, shared viewport or protected service was modified. Coordinator must visually check shoulder/neck, armpit/waist/cuffs, outlines/residual arm, mouth alignment, four-state positive/negative phases and transitions before integration/activation. Hidden/reduced-motion/unmount/static-fallback lifecycle is unchanged; asset-only authoring did not retest it.

Initial auto-review refused an appearances:generate command because it would write public assets outside candidate ownership. It was not executed or bypassed; this independent direct-source page is the explicitly authorized alternative.

## Handoff

WT `/Users/nighca/.codex/worktrees/plum-crop-animation/lie`; branch `codex/plum-crop-animation`; original base `62b3846eecce8e902cd8bfe1764c87a337551e4b`; no additional dependency commits. Owner does not integrate main or push. Only this directory is changed. Ignored node_modules installed with offline npm ci --ignore-scripts (0 audit vulnerabilities); port5356 Vite remains for coordinator review.

## Initiator visual correction, 2026-10-25

Initiator's actual full-body extrema review found overall composition/motion/contact good; mouth 0/.25/1/3s looked naturally aligned and complete, so PNGs, mouths, head scale and tracks remain unchanged. The author actually viewed native screenshots /private/tmp/plum-shoulders-before.jpg and /private/tmp/plum-waist-before.jpg. They showed a duplicate generated lower-neck arc inside the canonical white collar, a cut speaking finger top, a fine speaking upper-right shoulder gap, and repeated dark right-waist/cuff edges. The original automated geometric pass did not diagnose these visual defects and is not a visual acceptance claim.

Only mask geometry changes: generated head stops at source y830 (logical423.2), above the generated bottom-neck outline, retaining canonical collar/neck; speaking hand mask now follows original upper/lower skin and dark outline samples instead of a straight diagonal through the fingers; the speaking upper shoulder envelope expands from (870,460)/(955,500) to (870,440)/(970,485); generic torso/right-neutral internal waist boundaries separate the torso line from the independently moving sleeve. No raster pixel, provenance hash, mouth, parent, crop or animation amplitude changes. Read-only audit additionally requires every classified warm skin pixel in source x710–880/y615–755 and six diagnosed original hand-ink points to remain inside the hand mask. All existing source/hash/960-sample/100-interruption/32-phase seam checks remain passing. Final composited appearance is being rechecked by the initiator; author IAB remains unavailable.
