# Silver exact-phase native Canvas attribution

## Conclusion

The corrected checker exposes a real but very small internal cloth seam, not merely movement of the external silhouette. At t2.5s and3.5s, actual renderer native pixels x594/596/598,y626 have alpha127 versus approved pre-revision baseline255. The adjacent native rows625 and627 are253. At CSS4× native detail there is a short pale horizontal line above the cardigan button, inside the green cloth. At the measured normal game scale it is not obvious; that does not make the seam proof pass. The overall user visual approval remains recorded, but a minimal overlap correction is proposed before PR publication.

## Method and reproducible scope

Source d1063a97cf8a185cb067a293fba1add003b27bb1 plus only this audit HTML/evidence. No package, mask, PNG, renderer, probe or threshold changed. inspect.html imports the actual packages/character-animation readAnimationPackage/sampleClip/createCanvasRenderer and loads current silver package plus exact original approved baseline archived under2026-10-25-waiting-visibility. Same native PNGs serve both packages. Real Canvas draw calls, getImageData reads and layer-isolation observations; no Python approximation for this finding.

First measured the actual formal game at viewport1280×720/DPR2: .portrait-backdrop527.171875×398.40625; canvas element527.171875×517.921875, object-fit contain yields517.921875 square image. The normal-size audit reproduces exactly those element dimensions, fit, clipping and game-like background. It is a fixed-time renderer harness, not an assertion that the live voice controller remained in waiting for2.5s.4× detail enlarges the same native Canvas via CSS only (pixelated), ROI x520–660/y580–670; screenshots are unedited native browser captures, no image manipulation. Approximately6native pixels×1 row corresponds to2.48CSS px×.413CSS px at that measured game scale.

Query t selects actual seconds, zoom=1 shows detail; the Time combobox exposes six exact phase options. All six raw JSON pixel records and zoom screenshots are stored; t2.5/t3.5 also have normal-game-size screenshots. First getByLabel(Time,exact) found no match; fresh DOM showed combobox Time, and getByRole(combobox) succeeded. No page or source change was needed.

## Native results

summary.json records x594/596/598 at row626:
- baseline:255 at all six times.
- rigid2.375:254/254/254.
- rigid2.5:127/127/127.
- rigid2.625:127/127/127.
- rigid3.375:190/127/127.
- rigid3.5:127/127/127.
- rigid3.625:254/254/254.

Native antialiasing therefore exposes the seam over more neighboring samples than the corrected nearest-source checker’s first failed pair20/28. Do not treat33 nearest samples as exhaustive antialiased raster proof. Keep that conservative assertion intact; lowering128 or dropping coordinates would conceal the underlying overlap issue.

At both exact target times, actual isolated waiting-hand contributes alpha127 at the failing row. waiting-button, waiting-wrist-cloth-backing, waiting-torso and waiting-cuff-front contribute0 there. The button contributes253 on row627. This locates the line between the clipped moving hand’s cloth edge and the stable button crop’s top edge. The baseline has opaque cloth throughout the diagnostic20×16 ROI. The rigid alpha grid has a6pixel-long row of127 (with neighboring edge partial coverage); it is surrounded by cloth, so this is an internal seam, not a reasonable external contour change. It is an antialiased representation of insufficient overlap, not a claim of completely transparent alpha0 at those three native pixels.

## Minimal proposed correction — not implemented or approved here

Only silver waiting-button node, parent waiting-breath-root, order39: change crop[592,626,25,42] to[592,624,25,44] and local transform.y626→624. Retain x592, pivots0, scale1, parent, order and all motion/visibility. Extending2native source rows upward while moving the crop destination up2 keeps every existing source pixel (including the button) at exactly its prior world position and preserves the bottom edge at668; it adds a tiny original cloth overlap behind the higher-order41 moving hand. No duplicated button, redraw, stretching, head/hand trajectory, mouth or other state change is intended. Native assets remain unchanged. Formal package and source generator will need identical updates if approved, plus generated output from the established script.

Potential risk: the newly exposed top strip must be verified as the expected original cloth, not an added outline/skin or a second feature. Approval does not imply the proposed2rows are empirically sufficient. After coordinator review, validate corrected crop-bounds checker unchanged (33 phases), all nonwaiting identities, independent native hashes, exact native six-time and denser subpixel sweep around this joint, normal-size/4× comparison, and source/formal/generated equality. Do not claim a fix or publish before that work. If it remains insufficient, report rather than loosen predicates.

## Lifecycle

Prior5355 listener was absent. Same5355 only, apps/web Vite config, source d1063a9 plus this HTML; PID52630/PTY23642, consumers temporary IAB tabs56(actual game measurement) and57(audit). No mic/provider and no overrides/new ports. Tabs56/57 closed after bounded review; direct audit warning/error logs0. Original PTY stopped service(exit130), listener check follows. Existing user tabs/8787/8788 untouched. Worktrees/refs and every failed/rejected draft remain. No main, push, PR, merge or deployment action.
