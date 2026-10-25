# Animation motion revision: parent review, pending user acceptance

User feedback2026-10-25: silver/salt/plum/mint/ochre waiting too subtle; mint default/listening too subtle; ochre speaking head size jumps. Original8-character integration explicitly proceeds separately and is already localmain dd1663853f7e153efb2c977dd74b89b415f0e20c. This revision is NOT approved for main/game. User explicitly requires personal acceptance first, then a separate PR for this batch. No PR/push/deploy or production asset activation has occurred.

## Frozen sources

- animation-breathing-revision/lie, branch codex/animation-breathing-revision, original base772dfa5281bda039bbe3e248e4bc81ebcbdf2846. Ordered53816337348a20708921e4a28d5c31e567809a4e →85329b194c649d87ee30bc62210b647c1b557fc3 →c4881b3e21cb7967295545b259329c594bb9f85c. Silver/salt/plum candidate directories only.
- animation-mint-ochre-revision/lie, branch codex/animation-mint-ochre-revision, base dd1663853f7e153efb2c977dd74b89b415f0e20c. Ordered6a5cf310538f1d3d07beddc1e9f6d2ad6c415912 →73a8420bfdf0a702e507a942d939a6f9cbd06075 →bb5779e705676b78691c0f1baf494082a481926a →78031e87340fdc0a6d2ada6c8330c8fb17ddc038. Mint/ochre candidate directories only.

Both clean at handoff. Parent inspected source/diffs/generators/tests/revision records and actual package geometry. No runtime/player/sharedmanifest modifications. Native PNGs unchanged. Baseline packages archived with author records; abandoned amplitude/registration/mouth experiments documented, not erased.

Waiting scaleY amplitude: silver/salt/plum ±.015 (2.5x); mint/ochre ±.018 (3x). Fixed lower body, shared head/contact hands; no new horizontal sway. Plum upper only+9px; ochre upper only+15px for hair margin, fixed pants retained. Mint all-state registration+6px for hair margin; default body±5/head±1.4deg/±1.8px, listening/waiting shared upper breath3x. This means mint speaking registration also moves6px although its motion tracks otherwise unchanged. Ochre keeps one default head; only original speaking-mouth polygon/crop toggles. No phoneme/livevoice claim.

## Actual parent browser review

Existing5355 service, Codex in-app browser. Source base final-two-character-game72c4a93; explicit fsallow adds only both revision worktrees. Default root / still displays original eight-character packages; revision link in preview-url.txt overrides only5 package URLs. Three unchanged characters remain original. Five revised selections each have1visible canvas/no fallback; direct warning/error logs empty. No new port/globalviewport/voice/mic.

Actual screenshots here are native unedited JPEGs. Parent inspected:
- Silver original/new positive-negative waiting extrema, then shoulder/chin-hand and waist closeups.
- Salt shoulder/chin-hand and waist old/new extrema.
- Plum full old/new extrema, hair margin and waist; actual default→waiting switching/repeat via unified component. Static upper9px adjustment settles without visible new break in inspected state captures.
- Mint all-state1/3s shoulder/neck/contact and waist/sleeve extrema; default/listening/waiting stronger motion visibly differs across sampled endpoints.
- Ochre face0/.25/1/3s: same head contour while local mouth opens/closes, no visible closed-mouth residue or obvious patch edge. Final waiting waist1/3s and full unified preview after last15px upper correction: no visible gap/doubled belt line.

Earlier ochre-waist.jpg and face captures preceded final+3px upper-only correction; ochre-waist-final.jpg and ochre-waiting-final.jpg are final candidate. Mouth never changed in final correction. Representative captures are not exhaustive all-frame visual comparison or a recording.

Parent additionally tightened ochre author alpha>=200 hair audit to alpha>0 in-memory, found minY1.008 instead of5.08: inside canvas but below3px guard. Requested new corrective commit78031e8 (no amend), final author all-nonzero33phase result4.008. Other tests passed in the parent supplemental run. This discovery and initial failed guard are retained here; no silent pass claim.

Author strict parsing/nativehash/dimensions, loops/interruption,33phase full-parent coverage/nonzeroalpha bounds, baseline diff allowlist and generator reproduction reviewed. A waiting hair minima4.683/6.068/6.227px; B mint≥8.7px, ochre4.008px. Mouth211closed-ink probes covered, boundaryRGBmax17/mean4.418. Data audits do not substitute for subjective user acceptance. Parent did not rerun unrelated application suite. Real game revised integration, physical mobile, liveprovider, realhidden, delayed-success race remain untested for this batch.

Parent accepts this as a reviewable candidate, user visual gate remains pending. No source changes after freeze. Close temporary inspector tabs48/49; retain user-facing revision47. Existing user18 and eight-person baseline45 retained. All previews share5355; session8486 owner this animation chat, consumer user, stop when user finishes or handed to stable preview. Keep final-two and both revision worktrees while referenced. No additional background processes started by subagents.
