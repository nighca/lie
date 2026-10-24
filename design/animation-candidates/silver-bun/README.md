# Silver-bun animation candidate

Candidate only, not activated in canonical manifest. Source four-state PNGs are unchanged. Owner `/root/silver_bun_animation`; 2026-10-24.

## Actual assembly

1254² logical canvas, 11 nodes, seven shared PNG assets, four looping clips. New head without mouth, new mouth atlas, and new armless torso are shared in every state. Neutral arms, listening arm, waiting contact group, and speaking arm use runtime polygon masks over byte-for-byte copies of canonical images. These source-sized files are texture containers: no whole portrait is rendered; masks select only the named limbs. Separate head/body/neutral arm/speaking arm transforms provide actual relative motion, not whole-PNG zooming.

All states breathe ±2 px and head tilt ±0.35°; neutral arms sway ±0.3°, speaking hand ±1°. Listening hand and waiting two-arm contact group share `head-root`, keeping ear/chin contacts stable while shoulders remain overlapped under torso. Source semantic poses remain neutral arms down, hand by ear, chin rest with opposite forearm support, palm-up speaking.

Generated torso has an unwanted translucent halo; runtime polygon clipping excludes it. Generated waiting arms were rejected for bad proportions, retaining original canonical limbs instead. Generated head/torso are recognizable but not pixel-identical to the original: cheek contour and torso proportions differ slightly. Initial review found protruding dark shoulder corners; a follow-up mask change moves the generated torso silhouette beneath canonical sleeve shoulders. This remains an art candidate for review, not declared user-approved.

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
