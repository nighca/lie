# Correct local crop bounds in the three waiting checkers

Current follow-up: [approved two-row seam fix](../2026-10-25-silver-seam-fix/README.md) resolves the silver crop-edge failure with unchanged checker predicates and native Canvas validation. Prior failures and proposal/pending checkpoints below remain historical evidence.

Supplement to frozen integration candidate22b2ee8b635b2e6944d3801721673bc5122dfa3b. The user’s visual approval remains recorded; no approved package, PNG, renderer, public output, mask, motion, probe region or threshold was changed. No PR publication turn has been granted.

## Defect and correction

Independent architecture review found that draw_alpha and ordered RGBA sampling translated local coordinates by a crop origin but checked only the full source image bounds. Thus opaque atlas pixels outside the declared local drawImage rectangle could count as coverage. Runtime canvas.ts draws the crop to [0,width)×[0,height), so runtime rendering is unaffected by this verifier correction.

Each of the three checkers now uses one sprite_samples helper for alpha, ordered color and cuff foreground sampling: local mask AND 0≤u<cropWidth / 0≤v<cropHeight, then crop-origin offset, then full source bounds. Noncrop sprites use their image width/height. The existing forward native-alpha scan already slices the PNG to crop dimensions before transforming pixel centers.

A minimal8×8 opaque-atlas counterexample with crop[2,3,2,2] checks points outside all four local edges. All of those incorrectly passed the previous whole-image bound. The corrected helper leaves their alpha zero and background color unchanged, while verifying crop-origin indices, polygon mask intersection and noncrop bounds. No tolerance was adjusted.

## Actual rerun

PATH Node24.22.1; Python3.13/numpy2.2.6/Pillow. Ran each corrected script read-only on the aggregate candidate, with stdout/stderr saved unchanged here.

- salt-pepper-beard: exit0.432861 waist/contact,64284 neck,33165 upper-cloth,198 ordered cuff probes pass; exact720 nonwaiting poses/4080 rendered-node comparisons pass. Its0 deep retained cuff pixels is a bounded/vacuous subclaim:229 source ink pixels are excluded from moving hand, not229 deep-overlap checks.
- plum-crop: exit0.454938 waist/contact,40062 neck,47058 upper-cloth,165 ordered cuff probes pass;4488 deep cuff checks pass,49 near-joint pixels remain outside that strict claim;720 nonwaiting poses/3840 rendered-node comparisons pass.
- silver-bun: exit1 at the first waist/contact assertion, phase20/32 (2.5s of4s). Six failing probe entries represent three unique world points(594.5,626.5),(596.5,626.5),(598.5,626.5), repeated in two probe rectangles. Head/contact rigidity, unchanged nonwaiting definitions, hair bounds and new crop counterexample passed before the failure. Neck/cloth/ordered/cuff/nonwaiting sampling assertions after that line were NOT reached in this corrected full run and must not be reported as corrected PASS.

A separate read-only33phase diagnostic using the exact corrected helper finds this waist/contact predicate fails at phases20 and28 (2.5s,3.5s), same three unique positions, six entries each. The old false contributors are waiting-button crop[592,626,25,42] (local u2.5/4.5/6.5,v−0.1; samples source y625) and waiting-wrist-cloth-backing crop[613,626,6,42] (local u8.5/10.5/12.5,v−0.1). Source alpha253 outside both declared crops formerly masked the failure. Current correct local predicate excludes them. The source probe is near a subpixel crop edge; nearest-native alpha failure alone is not a native antialiased Canvas visibility verdict.

## Evidence status and next action

Old archived checker logs remain historical unchanged. Their crop-sensitive alpha/ordered claims are withdrawn as reliable proof. Corrected gray/plum results replace those numerical proofs; silver’s former complete seam PASS is specifically withdrawn, pending coordinator disposition and native Canvas inspection at the exact phase/position. Existing user-approved visual review and unrelated contract/matrix/PNG checks remain valid within their stated limits. Do not silently lower thresholds, remove points or alter approved animation to force a pass. Hand this precise failure to the sole coordinator before any PR publication.
