# Rigid waiting redesign — 2026-10-25

Status: **source checks and parent shoulder/cuff review complete; pending parent unified live review and explicit user acceptance**. This candidate does not block the original eight-character integration. No activation, merge, push or PR before user confirmation.

Base772dfa5281bda039bbe3e248e4bc81ebcbdf2846; previous three submitted scale proposals remain immutable commits5381633/85329b1/c4881b3. The user rejected head stretching as inconsistent with the other states’ slight left/right turns; the exact rejected proposal/design/check records are preserved in [archive/2026-10-25-rejected-scale-breath](archive/2026-10-25-rejected-scale-breath/README.md). The original pre-revision package remains in [the baseline archive](archive/2026-10-25-waiting-visibility/README.md).

Plum keeps its lighter4s rhythm: +1.15/−.95° head turn around the original(630,440), with ±1px head/hand lift. The purple shirt, white cuffs and crossed supporting arm move independently −.8/+1.8px, opposite to the head lift, with no rotation. The later cuff correction follows the actual skin/white-cuff arc; the forearm continues behind a fixed high-order native cuff foreground. Its hand mask follows the original fingertip/knuckle contour, excluding white-collar pixels previously carried at y490–510.

Only waiting uses `waiting-head`, sharing the same unchanged generated PNG/transform but cutting its lower generated neck at local y780 (world~396.2). The normal `head` remains exact and visible in the other three states. A canonical waiting skin/neck backing supplies the area below and retains original outer neck ink through the collar join; it moves with the torso, and the full collar stays in that group. The rejected9px whole-upper offset and all scale tracks are gone.

Parent first/second review identified duplicate neck/collar lines; third review found a small white wedge at the generated-head/native-neck join. The current fourth candidate extends original outer neck ink to close it. Exact earlier packages and native evidence remain in rigid-*-collar / third-neck-edge archive folders. Actual Canvas outline/color and transition judgment remain required.

PNG bytes/provenance remain exact. Waiting has no scaleX/scaleY animation on any node. Only the existing static uniform native-head/mouth fitting scale remains. Head/contact world matrices are checked through33 actual sampled phases: both column lengths remain constant and orthogonal, and head-to-hand relative transforms remain constant. Torso rotation stays zero, lower-body world transforms stay exact, and the torso/head each have distinct motion.

[Reproducible checks](waiting-revision-checks.txt) include strict contract/native/canonical hashes, four-state loops/interruption continuity, generator/package identity, real33-phase full-parent nonzero-alpha bounds, dense waist/forearm/cuff interiors, and neck skin interiors with4px skin margin mapped through contact world matrices. A further720 sampled default/listening/speaking poses preserve every visible original sprite and full-parent matrix exactly; newly added waiting sprites are hidden there. These checks do not establish antialiased Canvas color, correct duplicate contour appearance, all transition frames or user acceptance.

[Actual-runtime Canvas inspection](waiting-inspection.html), via the shared5355 service: original/new positive/negative extrema, `?samples=32`, `?detail=shoulders`, `?detail=cuff`, `?detail=waist`, `?detail=face`. No new service, browser tab or shared viewport override was created by this author; parent owns actual visual review/screenshots and acceptance.


Parent actual shoulder/collar review now accepts the corrected rigid candidate: [native evidence](evidence/rigid-waiting-review/README.md). Gray/plum fourth-pass neck wedges/duplicate lines were no longer visible; silver second-pass long white forearm gaps were gone. Parent continues cuff and unified live review. No user acceptance is claimed.


## Cuff follow-up (current source)

Parent cuff close-up revealed that horizontally clipping the whole arms deleted silver upper-sleeve cloth, and that naked-skin horizontal cuts left square steps/old forearm tails. The exact rejected package/native screenshot is in archive/2026-10-25-rigid-cuff-failure/. Current fixed shoulders/sleeves retain their original contours; only the hand/forearm is separated along the actual curved wrist opening. The moving forearm extends behind `waiting-cuff-front`, which belongs to the independent clothing group and renders above it. Head motion, accepted shoulder/neck masks, lower-body alignment and PNG bytes are unchanged.

Targeted checks add dense upper-sleeve opacity at33 phases and original dark wrist-arc probes in actual ordered nearest-native RGBA layer stacks. The silver button ROI is explicitly absent from the moving hand. Gray/plum non-skin cuff-ink checks cover source pixels excluded from the hand or deep enough inside the fixed cuff for strict opaque occlusion; near-joint pixels without6px margin are explicitly outside this containment claim. For plum,49 retained near-joint ink pixels fall in that boundary category; a broader blanket containment assertion did not hold, so no pixel-perfect no-tail claim is made. Parent actual native cuff review found the corrected normal-stage result acceptable. This bounded mathematical check does not replace antialiased Canvas review.

The accepted native cuff view is saved in evidence/rigid-waiting-review/. Parent still owns unified waiting playback and state-transition acceptance; the user has not accepted this new revision.
