# Rigid waiting redesign — 2026-10-25

Status: **source checks and parent shoulder/cuff review complete; pending parent unified live review and explicit user acceptance**. This candidate does not block the original eight-character integration. No activation, merge, push or PR before user confirmation.

Base772dfa5281bda039bbe3e248e4bc81ebcbdf2846; previous three submitted scale proposals remain immutable commits5381633/85329b1/c4881b3. The user rejected head stretching as inconsistent with the other states’ slight left/right turns; the exact rejected proposal/design/check records are preserved in [archive/2026-10-25-rejected-scale-breath](archive/2026-10-25-rejected-scale-breath/README.md). The original pre-revision package remains in [the baseline archive](archive/2026-10-25-waiting-visibility/README.md).

Silver follows its existing ±1.2° default / ±.85° listening head-turn rhythm. Waiting head/mouth and the extracted chin hand/upper forearm share `head-root`, pivot(625,430), with +.95/−1.05° and −.4/+.4px. `waiting-torso` and the lower sleeves/crossed supporting arm instead share `waiting-breath-root`, rising/falling ±1.2px with zero rotation. A hand-shaped notch is narrower than the foreground hand by7px per side, preserving backing. The later cuff correction retains full original shoulder/upper sleeves and follows the native wrist/cuff arc; the full forearm continues behind a fixed native cuff foreground. Neither clothing nor lower body rotates with the head.

Parent actual initial shoulders review found long white forearm gaps and a neck step; its second review confirmed the large gaps gone and the neck step substantially reduced after the backing/pivot correction. Both packages/feedback/native screenshots are in archive/2026-10-25-rigid-first-seams/. Full phase/cuff/final acceptance is still the parent’s responsibility.

PNG bytes/provenance remain exact. Waiting has no scaleX/scaleY animation on any node. Only the existing static uniform native-head/mouth fitting scale remains. Head/contact world matrices are checked through33 actual sampled phases: both column lengths remain constant and orthogonal, and head-to-hand relative transforms remain constant. Torso rotation stays zero, lower-body world transforms stay exact, and the torso/head each have distinct motion.

[Reproducible checks](waiting-revision-checks.txt) include strict contract/native/canonical hashes, four-state loops/interruption continuity, generator/package identity, real33-phase full-parent nonzero-alpha bounds, dense waist/forearm/cuff interiors, and neck skin interiors with4px skin margin mapped through contact world matrices. A further720 sampled default/listening/speaking poses preserve every visible original sprite and full-parent matrix exactly; newly added waiting sprites are hidden there. These checks do not establish antialiased Canvas color, correct duplicate contour appearance, all transition frames or user acceptance.

[Actual-runtime Canvas inspection](waiting-inspection.html), via the shared5355 service: original/new positive/negative extrema, `?samples=32`, `?detail=shoulders`, `?detail=cuff`, `?detail=waist`, `?detail=face`. No new service, browser tab or shared viewport override was created by this author; parent owns actual visual review/screenshots and acceptance.


Parent actual shoulder/collar review now accepts the corrected rigid candidate: [native evidence](evidence/rigid-waiting-review/README.md). Gray/plum fourth-pass neck wedges/duplicate lines were no longer visible; silver second-pass long white forearm gaps were gone. Parent continues cuff and unified live review. No user acceptance is claimed.


## Cuff follow-up (current source)

Parent cuff close-up revealed that horizontally clipping the whole arms deleted silver upper-sleeve cloth, and that naked-skin horizontal cuts left square steps/old forearm tails. The exact rejected package/native screenshot is in archive/2026-10-25-rigid-cuff-failure/. Current fixed shoulders/sleeves retain their original contours; only the hand/forearm is separated along the actual curved wrist opening. The moving forearm extends behind `waiting-cuff-front`, which belongs to the independent clothing group and renders above it. Head motion, accepted shoulder/neck masks, lower-body alignment and PNG bytes are unchanged.

The parent then found a doubled cardigan button carried by the hand; the second cuff failure is preserved in archive/2026-10-25-rigid-cuff-second-button/. The moving hand now excludes the full native button ROI. The body supplies its original25×42 crop at(592,626); a6×42 native plain-green crop from(613,626) is translated to(586,626) behind the seam. Both use static identity scale and unchanged original PNG pixels. Parent third cuff review saw one button, no prior triangle/square/white gap or obvious fill-color block.

Targeted checks add dense upper-sleeve opacity at33 phases and original dark wrist-arc probes in actual ordered nearest-native RGBA layer stacks. The silver button ROI is explicitly absent from the moving hand. Gray/plum non-skin cuff-ink checks cover source pixels excluded from the hand or deep enough inside the fixed cuff for strict opaque occlusion; near-joint pixels without6px margin are explicitly outside this containment claim. Parent actual native cuff review found the corrected normal-stage result acceptable. This bounded mathematical check does not replace antialiased Canvas review.

The accepted native cuff view is saved in evidence/rigid-waiting-review/. Parent still owns unified waiting playback and state-transition acceptance; the user has not accepted this new revision.
