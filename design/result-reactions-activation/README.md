# Formal result-reaction activation

Status: implemented in isolated `codex/result-reactions-activate`; pending initiator review and serialized local integration. No main mutation, publication, browser session or service startup is part of this batch.

Base: `870cbd524ab21e243e072866ce70288932192834` (reviewed q90 build support).
Artwork dependency: `73e55f527729417ae5296526cc602aed2ca926ef` in `codex/result-reactions-coral`, under `design/result-reactions/<id>/`.

The user approved the strengthened Coral pair and authorized specialist self-review and ordinary local integration of the other seven pairs, with one collective inspection page afterwards. Individual user acceptance is no longer a merge gate. Artwork and browser self-review evidence remain in that source dependency; this activation changes neither expressions nor movement.

This batch copies exactly 8 v2 animation packages, 16 native result part PNGs and 16 renderer-exported static endpoints into canonical assets, and adds the two optional portrait references for every preset. All 81 existing canonical PNG paths remain byte-identical to base. Every pre-existing asset, clip, state, node and transition record remains equal. Manifest names, voices, ordering and prior fields remain equal. All 16 result clips are non-looping.

Authored sources remain PNG. The existing build automatically produces q90 WebP derivatives and rewrites production portrait/package references. No generator, image tool, runtime, dependency, application UI or central planning source is modified.

`source-identity.json` records exact SHA-256 values for all copied files. `verify.py` rechecks Git-pinned source identity, old asset/package preservation, manifest-only additions and the built WebP resource closure. Run from the repository root after the Web build:

```sh
python3 design/result-reactions-activation/verify.py
```

Offline verification results and generated resource counts are recorded in `checks.json`. Generated public/dist outputs, dependency installs and image tool/cache files are ignored and are not part of the handoff. The initiator owns actual application/UI composition and desktop/narrow browser acceptance; these are not claimed here.

Services: none started, stopped or inspected; existing 5355/5356/5357/8787/8788 services and tabs were untouched.

## Verification run (2026-10-25)

- Node 24.22.1; `npm ci --offline --ignore-scripts`: 217 packages added, zero vulnerabilities, no lock change.
- `npm run character-presets:generate` and `npm run character-presets:check`: 8 presets / 121 assets each.
- Web `typecheck`: pass.
- Web `test`: 36 files / 334 tests pass.
- `npm run test:character-presets`: 24 pass.
- Web `build` and its strict postbuild canonical check: pass, 100 modules; postbuild 8 presets / 121 assets.
- Image build: 82 unique source byte sequences encoded; 0 cache hits; 0 PNG fallbacks. All 16 new static endpoints and all 16 new animation parts have production WebP references; all 62 animation asset references resolve locally.
- `python3 design/result-reactions-activation/verify.py`: pass; 81 original PNG paths unchanged, all 40 copied files match the Git-pinned source.
- `git diff --check`: pass.

The build retains the existing unresolved-at-build-time hashed `brand/underline.svg` warning. That existing asset is emitted in dist and resolved at runtime; no image encoding fallback or missing result resource warning occurred. Vitest printed its existing jsdom environment performance advisory (not a test failure). No failed check was repaired by changing shared source or lowering validation. Browser/UI acceptance is intentionally deferred to the parent composition batch.
