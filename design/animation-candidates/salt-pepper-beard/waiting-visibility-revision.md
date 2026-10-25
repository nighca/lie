# Rigid waiting redesign — 2026-10-25

Status: **source checks and parent shoulder/cuff review complete; pending parent unified live review and explicit user acceptance**. This candidate does not block the original eight-character integration. No activation, merge, push or PR before user confirmation.

Base772dfa5281bda039bbe3e248e4bc81ebcbdf2846; previous three submitted scale proposals remain immutable commits5381633/85329b1/c4881b3. The user rejected head stretching as inconsistent with the other states’ slight left/right turns; the exact rejected proposal/design/check records are preserved in [archive/2026-10-25-rejected-scale-breath](archive/2026-10-25-rejected-scale-breath/README.md). The original pre-revision package remains in [the baseline archive](archive/2026-10-25-waiting-visibility/README.md).

Gray keeps its more deliberate4.8s rhythm. A slightly asymmetric +.8/−1° turn around(620,420) and −.6/+.8px lift moves the native waiting head, skin-only neck patch and beard-touch hand/upper forearm together. `contact-waiting` is reparented to an independent `waiting-breath-root`, moving sweater/crossed supporting arm −1.8/+1.5px without rotation; the later cuff correction follows the native wrist arc, with forearm skin ending behind a fixed high-order native sweater cuff. The lower sweater/trousers stay fixed. The native neck patch follows the original skin/ink boundary while excluding white collar/sweater material.

Parent first review found an old moving collar spur; removing the entire neck patch created a diagonal white neck gap. Restoring only skin fixed that interior but initially excluded the outer neck ink, leaving a small white wedge. The current fourth candidate retains the original external neck ink above the collar. First/second/third candidates and native evidence remain in their respective rigid-*-collar / third-neck-edge archive folders. Outer contour/collar color requires parent actual Canvas review; alpha coverage alone cannot approve it.

PNG bytes/provenance remain exact. Waiting has no scaleX/scaleY animation on any node. Only the existing static uniform native-head/mouth fitting scale remains. Head/contact world matrices are checked through33 actual sampled phases: both column lengths remain constant and orthogonal, and head-to-hand relative transforms remain constant. Torso rotation stays zero, lower-body world transforms stay exact, and the torso/head each have distinct motion.

[Reproducible checks](waiting-revision-checks.txt) include strict contract/native/canonical hashes, four-state loops/interruption continuity, generator/package identity, real33-phase full-parent nonzero-alpha bounds, dense waist/forearm/cuff interiors, and neck skin interiors with4px skin margin mapped through contact world matrices. A further720 sampled default/listening/speaking poses preserve every visible original sprite and full-parent matrix exactly; newly added waiting sprites are hidden there. These checks do not establish antialiased Canvas color, correct duplicate contour appearance, all transition frames or user acceptance.

[Actual-runtime Canvas inspection](waiting-inspection.html), via the shared5355 service: original/new positive/negative extrema, `?samples=32`, `?detail=shoulders`, `?detail=cuff`, `?detail=waist`, `?detail=face`. No new service, browser tab or shared viewport override was created by this author; parent owns actual visual review/screenshots and acceptance.


Parent actual shoulder/collar review now accepts the corrected rigid candidate: [native evidence](evidence/rigid-waiting-review/README.md). Gray/plum fourth-pass neck wedges/duplicate lines were no longer visible; silver second-pass long white forearm gaps were gone. Parent continues cuff and unified live review. No user acceptance is claimed.


## Cuff follow-up (current source)

Parent cuff close-up revealed that horizontally clipping the whole arms deleted silver upper-sleeve cloth, and that naked-skin horizontal cuts left square steps/old forearm tails. The exact rejected package/native screenshot is in archive/2026-10-25-rigid-cuff-failure/. Current fixed shoulders/sleeves retain their original contours; only the hand/forearm is separated along the actual curved wrist opening. The moving forearm extends behind `waiting-cuff-front`, which belongs to the independent clothing group and renders above it. Head motion, accepted shoulder/neck masks, lower-body alignment and PNG bytes are unchanged.

Targeted checks add dense upper-sleeve opacity at33 phases and original dark wrist-arc probes in actual ordered nearest-native RGBA layer stacks. The silver button ROI is explicitly absent from the moving hand. Gray/plum non-skin cuff-ink checks cover source pixels excluded from the hand or deep enough inside the fixed cuff for strict opaque occlusion; near-joint pixels without6px margin are explicitly outside this containment claim. Parent actual native cuff review found the corrected normal-stage result acceptable. This bounded mathematical check does not replace antialiased Canvas review.

The accepted native cuff view is saved in evidence/rigid-waiting-review/. Parent still owns unified waiting playback and state-transition acceptance; the user has not accepted this new revision.
