# Rigid waiting redesign — 2026-10-25

Status: **source checks complete; pending parent cuff/live review and explicit user acceptance**. This candidate does not block the original eight-character integration. No activation, merge, push or PR before user confirmation.

Base772dfa5281bda039bbe3e248e4bc81ebcbdf2846; previous three submitted scale proposals remain immutable commits5381633/85329b1/c4881b3. The user rejected head stretching as inconsistent with the other states’ slight left/right turns; the exact rejected proposal/design/check records are preserved in [archive/2026-10-25-rejected-scale-breath](archive/2026-10-25-rejected-scale-breath/README.md). The original pre-revision package remains in [the baseline archive](archive/2026-10-25-waiting-visibility/README.md).

Silver follows its existing ±1.2° default / ±.85° listening head-turn rhythm. Waiting head/mouth and the extracted chin hand/upper forearm share `head-root`, pivot(625,430), with +.95/−1.05° and −.4/+.4px. `waiting-torso` and the lower sleeves/crossed supporting arm instead share `waiting-breath-root`, rising/falling ±1.2px with zero rotation. A hand-shaped notch is narrower than the foreground hand by7px per side, preserving backing. The hand stops at632 and the lower sleeve starts620 (12px overlap). Neither clothing nor lower body rotates with the head.

Parent actual initial shoulders review found long white forearm gaps and a neck step; its second review confirmed the large gaps gone and the neck step substantially reduced after the backing/pivot correction. Both packages/feedback/native screenshots are in archive/2026-10-25-rigid-first-seams/. Full phase/cuff/final acceptance is still the parent’s responsibility.

PNG bytes/provenance remain exact. Waiting has no scaleX/scaleY animation on any node. Only the existing static uniform native-head/mouth fitting scale remains. Head/contact world matrices are checked through33 actual sampled phases: both column lengths remain constant and orthogonal, and head-to-hand relative transforms remain constant. Torso rotation stays zero, lower-body world transforms stay exact, and the torso/head each have distinct motion.

[Reproducible checks](waiting-revision-checks.txt) include strict contract/native/canonical hashes, four-state loops/interruption continuity, generator/package identity, real33-phase full-parent nonzero-alpha bounds, dense waist/forearm/cuff interiors, and neck skin interiors with4px skin margin mapped through contact world matrices. A further720 sampled default/listening/speaking poses preserve every visible original sprite and full-parent matrix exactly; newly added waiting sprites are hidden there. These checks do not establish antialiased Canvas color, correct duplicate contour appearance, all transition frames or user acceptance.

[Actual-runtime Canvas inspection](waiting-inspection.html), via the shared5355 service: original/new positive/negative extrema, `?samples=32`, `?detail=shoulders`, `?detail=cuff`, `?detail=waist`, `?detail=face`. No new service, browser tab or shared viewport override was created by this author; parent owns actual visual review/screenshots and acceptance.


Parent actual shoulder/collar review now accepts the corrected rigid candidate: [native evidence](evidence/rigid-waiting-review/README.md). Gray/plum fourth-pass neck wedges/duplicate lines were no longer visible; silver second-pass long white forearm gaps were gone. Parent continues cuff and unified live review. No user acceptance is claimed.
