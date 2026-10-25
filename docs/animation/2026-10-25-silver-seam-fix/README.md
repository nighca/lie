# Approved silver cloth-overlap correction

## Authorization and exact production delta

Coordinator reviewed the native Canvas finding6ed94a0 and approved this local correction within the existing approved visual direction. Frozen22b2ee8/d1063a9/6ed94a0 and all rejected drafts/failed proofs remain intact. Only silver waiting-button: crop[592,626,25,42]→[592,624,25,44], transform.y626→624. Candidate JSON, formal design/character-presets JSON and build-package.py agree. Existing original crop pixels retain their exact world positions and bottom668; the new50 original cloth pixels provide a two-row overlap behind the higher-order moving hand. Parent/order39, x/pivots/scale, all masks/tracks/states/other nodes remain unchanged. No PNG changes, other character changes, runtime/application/controller/generator infrastructure changes, new dependency or relaxed checker predicates/points/thresholds.

verify-fix.py independently checks exact allowed two-field package delta, actual added native pixels, executes the actual generator while capturing write_text and verifying all copyfile bytes instead of rewriting provenance/source images, then checks all eight formal/generated copies. Native strip x592–616/y624–625 RGBA min[108,209,205,253],max[132,233,224,254]: opaque turquoise cloth, no skin, dark line, button or extra feature. Frozen before-fix package and eight formal SHA256 values are saved beside the verifier; it does not depend on the original frozen commit being present on a remote checkout.

## Checks run after this exact fix

- Corrected crop-bounds checker unchanged: all33 phases PASS:460911 waist/contact probes,78078 neck,94710 cloth,198 ordered cuff, single body-owned button;720 nonwaiting real-sampler poses/3600 full-parent rendered-node identity comparisons. No lowered128 predicate, omitted coordinates or margin change. corrected-checker.txt preserves exact stdout/stderr.
- Original silver check.mjs PASS: strict package/native PNG and canonical hashes, four-state finite/loop/mouth/contact checks and100 interrupted numeric-continuity switches.
- verify-fix.py PASS: exact delta,50 actual cloth pixels, read-only real generator output byte equality, native copies unchanged, all eight formal/public package copies. Other seven frozen SHA256 values unchanged. Silver new SHA2565b44d5066e1d1f624a28eed5c4f8338f9289870133bedd1b7def3f9feb20a330. identity-checks.txt contains results.
- Node24.22.1: preset generator21tests +animation runtime33tests +Web animated-game/character-preset-compatibility7tests =61 related tests PASS. Web typecheck/build PASS; generated source/public and dist check8characters/89assets. Previous full candidate212Web suite remains the earlier pre-local-fix run; do not call it rerun. No unrelated runtime or interface changes warrant it.

## Actual native Canvas validation

inspect.html calls the same real renderer/parser/sampler, comparing the frozen before-fix rigid package to the authorized exact fix. Same original native images, unchanged masks/tracks. Normal comparison reproduces the actual measured1280×720 game stage527.171875×398.40625 and Canvas element527.171875×517.921875/object-fit square517.921875. Native detail uses CSS4× only; screenshots are unedited IAB captures. This is a deterministic renderer harness at game scale, not a new live voice/microphone or controller-duration claim.

All six exact times2.375/2.5/2.625/3.375/3.5/3.625 were visually inspected, saved as raw native pixel JSON and4× screenshots;2.5/3.5 also normal-size captures. No former pale line, added skin/outline, shifted or duplicated button observed. Fixed row626 alpha at x594/596/598 is respectively[254,254,254]/[254,254,254]/[254,254,254]/[255,254,254]/[254,254,254]/[254,254,254]. Prior failed current127 values remain in the left comparison and old evidence, not erased.

An additional real Canvas raster sweep samples961 times from0..4s at1/240s intervals. Each renderer keeps the normal full1254×1254 coordinate system; an integer context clip x588/y620/20×16 restricts work to the joint, without affecting the interior x594/y624/6×5 sampled patch. The renderer still performs actual mask/crop/drawImage/compositing and native getImageData.30 native interior pixels×961times =28830 fixed observations, plus the same before-fix comparison. Fixed minimum alpha253, before-fix minimum100; fixed first-failure(<240) null,961frames completed. native-sweep.json preserves every sampled frame/minimum and exact setup. The six full-Canvas captures separately corroborate the clipped-sweep pixel values. This is bounded joint evidence, not an all-pixel or all-time theorem and not a mobile/GPU/platform sweep.

## Historical proof status

The verifier correction remains required; it was not undone to achieve success. d106’s silver failure and6ed’s native seam are valid historical results for the before-fix package. This new minimal overlap resolves the same unchanged checker and the native failure. Corrected gray/plum results remain unchanged. Earlier user-approved character-specific rigid motions and non-target states are preserved; no request for another overall visual approval is introduced. Complete final batch still needs coordinator’s actual review and explicit animation-only PR publication turn. No main/push/PR/merge/deploy performed.

## Service lifecycle

Same owner5355 was checked free and reused: source6ed94a0 plus only authorized2fields/generator/formal data and this fixture, PID99890/PTY38260, apps/web Vite config; consumer sole temporary IAB tab58. Bound stop condition fixed-phase/sweep completion. Audit warning/error logs0, no global viewport/CDP override/mic/provider/new port. Tab58 closed; original PTY stopped service(exit130), lsof confirmed no listener. User tabs/8787/8788 untouched, all source refs/worktrees retained. Current figure/game baseline source no longer depends on a running audit service.
