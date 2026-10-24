# Mint-puffs animation candidate

Candidate only. Owner `/root/mint_animation`, base `73ba1387c24762e48e78c003eef2421e53746a71`, no additional dependencies. Only this directory changes. Canonical manifest/images, engine, UI, providers and other characters remain untouched.

1254² canvas, four shared PNGs, four 4-second looping clips, 7,862,580 declared canvas+asset pixels. A canonical default head-through-neck runtime mask in default/listening/speaking combines with native canonical torso/arms, canonical closed/open mouth crops and stable data-only parents. The original four pose meanings remain arms down, ear listening, chin thinking with supporting forearm, palm-up speech. Preserves mint clothing, dark curls and brown skin; no theme redesign.

Default/speaking have ±3px body translation, ±.9° relative head tilt and ±1.2px head translation. Hands move with the body rather than independent wrist joints. Listening/waiting keep the waist and lower source fixed, with head, upper body and contact hands sharing a ±.006 scaleY breath at y858. The upper body ends at source y866 and lower starts y850; 16px same-source overlap lies inside sweater/forearm material above the sloping hem. Their maximum relative displacement is .048px at the overlap edge. Waiting has no lateral sway or rotation. A +10 logical pixel complete-rig registration preserves full twin-bun clearance; 32 real sampled phases give actual opaque hair minY 14.88–14.912.

One generated mouthless head was rejected after actual review found incompatible neck/collar contours. The final package contains only four unchanged canonical PNGs. Head keeps original face/mouth/neck pixels through the collar; body sources overlap at y415+, avoiding generated/canonical skin boundaries. Waiting uses its original head/neck/hand as one source contact group. The existing mouth crops, positions and synthetic timing are unchanged from the initial candidate.

## Reproduce and inspect

Node 24.22.1 on PATH. Cached dependencies installed with `npm ci --ignore-scripts --offline`, 0 audit vulnerabilities. `build-package.py` emits JSON from unchanged final PNGs. No original generation file needed to run final package; `check.mjs` verifies every copied asset against its canonical original.

```
node --experimental-transform-types design/animation-candidates/mint-puffs/check.mjs
python3 design/animation-candidates/mint-puffs/audit-seams.py
npm run appearances:generate
npx vite --config spikes/animation-preview/vite.config.ts --port 5359
```

Formal Vue component preview: `http://127.0.0.1:5359/?appearance=mint-puffs&src=/@fs/Users/nighca/.codex/worktrees/mint-puffs-animation/lie/design/animation-candidates/mint-puffs/package.json`.

Candidate local `qa.html?phase=extrema` uses actual sampler/Canvas backend for all four states at 1s/3s; add `&detail=shoulders` or `&detail=waist`. `?phase=face&detail=face` shows 0/.25/1/3s mouth states. This sampling page is not formal Vue acceptance. `narrow.html` embeds the actual formal Vue page in a 391×844 content viewport without changing shared browser viewport.

## Actual validation

Strict parser, all four actual PNG signature/dimension/SHA/alpha checks and canonical source hashes; resource budget; 1,280 finite samples; four seamless loop boundaries; exclusive source bodies/contact layers/mouths; real head/contact parent ownership; fixed waiting/listening waist and actual breath; 100 interrupted switches with exact continuity of every numeric channel at advance(0): pass.

Read-only alpha audit invokes the actual TypeScript parser/sampler and resolves every full parent matrix, visibility, crop bounds, polygon and native PNG alpha. Thirty-two phases cover nonempty internal neck, shoulder, waist, listening wrist and waiting chin bands, each with thousands of originally opaque source probes. Shoulder x470–830 is an internal band; it excludes the moving outer silhouette. Hair-bound audit evaluates actual nontransparent head pixels through all parent transforms. These nearest-alpha checks do not prove colour continuity, antialiasing or final art acceptance.

Actual Codex IAB id3/tab1 desktop formal playback inspected all four states and switching. Actual native screenshots viewed eight full-body extremes and enlarged shoulder/neck extremes; the head crop and duplicate neck steps were corrected after these checks. Formal Vue played all four states in the 391px iframe, with full lower stage scrolled into view; no detached hand/sleeve, chin gap or bun crop observed. No browser viewport setting changed. Initiator independent review is separate. Screenshot observations are present in tool history; no native screenshot files are committed by this author.

Limitations: hands follow their body/contact group without independent finger/wrist motion; state-specific arm poses swap under the shared settle and are not natural arm lifts; mouth timing is synthetic, not live lip sync. No blink, mesh deformation, provider/microphone evaluation, or production game activation. Reduced-motion, hidden-page pause, error fallback, source-late-load and unmount lifecycle belong to unchanged formal component behavior and were not re-tested for this asset-only package. No full app regression/build claim. Parent review and game QA remain required before integration/activation.

Final registration supersedes earlier generated-head checks: all actual source/asset hashes are in provenance.json; prompts.md preserves the single rejected call. Earlier 391px observations covered the generated-head candidate; final canonical-head 391px recheck remains an initiator task unless explicitly recorded later.

## Waiting jaw correction after 4c213f8

Initiator actual eight-phase review identified a black step near x590–612/y390–416. Read-only comparison found 38 dark default-jaw pixels outside the old hand mask that differ from canonical waiting. For example source (597,393) is default RGBA (0,1,17,253) but waiting (118,63,43,253), and (600,394) is default (3,3,19,253) but waiting (120,55,36,253). This is real residual default-jaw material, not the original waiting outline.

Only waiting now hides shared default `head`. Existing `chin-contact` uses the original waiting head/neck/hand with the same mask and local transform as shared head, and the same `head-root` parent as waiting upper body and both mouths. Its existing order41 covers the obsolete default closed-mouth order35, so the actual waiting mouth line and upward gaze come from waiting-source. Mouth nodes, masks, crops, transforms, order and timing are unchanged. Waiting logical visibility remains closed=true/open=false, and there is no talking track. The old closed-mouth polygon contains 2,495 source samples; default/waiting differ in 2,490 RGBA samples and 253 dark-ink-membership samples. Using original waiting foreground avoids claiming those two drawings are identical; native alpha253 can still blend very slightly with lower layers.

`waiting-baseline.json` stores hashes derived from immutable original commit 4c213f83f7ebdd498b2031ff005f7936393bf155, and check.mjs asserts all nonwaiting clips, assets, mouth nodes, all other nodes and waiting numeric tracks are unchanged. Four targeted jaw points now prove waiting-source foreground ownership with hidden default head at every sampled waiting phase. Existing four PNG hashes, contact parents, loop/interruption and full-chain seam audits still pass. Actual hair minY is default/speaking14.880, listening14.912, waiting12.900 logical pixels.

The author's previously available IAB disappeared: a failed id3 lookup followed by one inventory refresh showed only Chrome. This correction has no new author browser visual pass, no switch to Chrome and no viewport change. Initiator must inspect final eight phases and narrow formal playback. The original 4c213f8 remains immutable; this correction is a new commit. No new generation or raster edit.
