# Coral animation integration handoff

The version 1 contract and production workflow are implemented by the independent `@lie/appearance-animation` package. The agreed `CharacterPreset` / `@lie/character-animation` naming migration follows game integration. `AnimatedPortrait` in `@lie/ui` provides Vue lifecycle handling and its existing static portrait slot remains the fallback.

## Source and integration boundary

- Canonical optional appearance reference: `assets/coral-bob/animation/package.json`.
- The generator validates the package and 11 shared PNG parts before writing public output, then emits `/appearances/coral-bob/animation/package.json` in the runtime manifest.
- Coral shares 21 nodes across the four required states. The reviewed micro motion and common head alignment are carried into the data. Part provenance is in `design/animation-production/coral-bob/provenance.json`.
- The existing static images remain source assets. Other appearances omit the optional animation reference and normalize to `null`.
- The game page now wraps the existing portrait image/span in `<AnimatedPortrait :src="currentAppearance?.animation ?? null" :state="portraitState">`. The same derived state drives animation and static fallback: inactive/busy/error → default, recording → listening, waiting/speaking → their matching state. Switching to a static character cancels and disposes the animation. Application CSS is unchanged by the bridge.

## Verified on 2026-10-24

Using the repository security baseline and official Node 24.22.1: all 319 tests, full workspace typecheck, and production build passed. Checks include 25 animation runtime/loader tests, six wrapper lifecycle/fallback tests, and 21 appearance generator tests. An independent code reviewer checked the core, lifecycle, and generator; review fixes cover malformed property coercion, explicit transition sampling, and inherited object-property visibility.

The in-app browser at `http://127.0.0.1:5348/` rendered the actual production component in default, listening, waiting, and speaking states with no console errors/warnings. Selecting the unanimated blue-glasses appearance displayed its static fallback. At a 391 × 844 viewport the waiting figure remained contained and the head/neck contact was intact; the viewport override was reset after checking. Screenshot evidence: `/private/tmp/coral-production-391.jpg` (temporary, not a source asset).

These are component and deterministic/provider-fake checks; the game-page bridge is separately verified below. Live-provider speech and user acceptance are still pending. Speaking mouth timing is synthetic, with no phoneme alignment. Numeric transitions settle for 240ms where no authored transition exists; changing visible arm parts remains discrete.

## Next gates

The project coordinator reviews and integrates the ordered source, lockfile, and bridge commits. The game-page bridge checks below passed, so one additional-character production agent may start against this contract and workflow. Each character is self-checked, reviewed by its initiator, and shown to the user individually before activation.

## Game bridge candidate

Worktree `/Users/nighca/.codex/worktrees/coral-game-bridge/lie`, branch `codex/coral-game-bridge`, original base `4a67e301446f84f0d2efcad93c2d0b71be1f31c8`. Explicit dependencies (not claimed to be root-reviewed): investigation `a114ebbe4d99dd5fdae92b22ee4b14efa8f943ce` → `70530dd26764a580d9cb3d87803b500b66fd291e` → `6051df6cac258d5c8cc6a0d1eef157957342d2f6`; animation `dd35d483fce31e9319bb748ae75b66c10a28502c` → `f60ff43ff766ce8baf56da1791c6d3e2e1a9937c`. Root must replay each dependency once, followed by the bridge commit, or replay this candidate chain; do not replay both chains.

Actual game candidate: `http://127.0.0.1:5350/?demo=1&game=empty-medal-box`. Select 顾遥 and start the simulated conversation to exercise listening/waiting/speaking. The candidate is separate from the user's 8787 server and requires no microphone. It was reset to a fresh investigation with 顾遥 selected, inactive and 08:00 remaining after checking.

The actual game page rendered the four animation states, restored default on end, and switched between static 沈禾/陈拓 and animated 顾遥. Desktop and 391 × 844 checks showed continuous motion, connected head/neck and contained figures; at 391 the document scrollWidth equals innerWidth (391). Temporarily blocking only the Coral animation package request via tab-scoped CDP and switching static → animated showed the original default PNG with hidden canvas; starting the simulated conversation then showed the listening PNG. Network blocking and viewport overrides were removed afterwards. Reload/navigation while the test conversation was active was prevented by the existing navigation guard; failure testing used character switching instead. Fresh candidate rendering was checked after restoring settings.

The combination passed all **333 tests** (21 generator, 11 gateway, 165 web, 25 animation, 51 core, 35 UI, 25 voice), workspace typecheck and full build. The new web integration tests use the real portrait component and real timeline with only loading/Canvas drawing boundaries mocked; they cover late load in the current state, end/error/default, animated → static cancellation, and failed loading with current-state static fallback. jsdom's missing matchMedia is supplied in the shared web test setup only in DOM environments; reduced-motion tests may override it. Browsers without matchMedia now retain the static portrait.

Temporary screenshot evidence: `/private/tmp/coral-game-ready.jpg`, `/private/tmp/coral-game-waiting.jpg`, `/private/tmp/coral-game-speaking.jpg`, `/private/tmp/coral-game-391.jpg`. No source image pixels were edited.
