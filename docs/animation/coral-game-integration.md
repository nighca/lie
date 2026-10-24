# Coral animation integration handoff

The version 1 contract and production workflow are implemented by the independent `@lie/appearance-animation` package. The agreed `CharacterPreset` / `@lie/character-animation` naming migration follows game integration. `AnimatedPortrait` in `@lie/ui` provides Vue lifecycle handling and its existing static portrait slot remains the fallback.

## Source and integration boundary

- Canonical optional appearance reference: `assets/coral-bob/animation/package.json`.
- The generator validates the package and 11 shared PNG parts before writing public output, then emits `/appearances/coral-bob/animation/package.json` in the runtime manifest.
- Coral shares 21 nodes across the four required states. The reviewed micro motion and common head alignment are carried into the data. Part provenance is in `design/animation-production/coral-bob/provenance.json`.
- The existing static images remain source assets. Other appearances omit the optional animation reference and normalize to `null`.
- Game owner wraps the existing portrait image/span in `<AnimatedPortrait :src="appearance?.animation ?? null" :state="portraitState">`. The slot retains current static state selection. This task does not modify `App.vue` or application CSS owned by that integration task.

## Verified on 2026-10-24

Using the repository security baseline and official Node 24.22.1: all 319 tests, full workspace typecheck, and production build passed. Checks include 25 animation runtime/loader tests, six wrapper lifecycle/fallback tests, and 21 appearance generator tests. An independent code reviewer checked the core, lifecycle, and generator; review fixes cover malformed property coercion, explicit transition sampling, and inherited object-property visibility.

The in-app browser at `http://127.0.0.1:5348/` rendered the actual production component in default, listening, waiting, and speaking states with no console errors/warnings. Selecting the unanimated blue-glasses appearance displayed its static fallback. At a 391 × 844 viewport the waiting figure remained contained and the head/neck contact was intact; the viewport override was reset after checking. Screenshot evidence: `/private/tmp/coral-production-391.jpg` (temporary, not a source asset).

These are component and deterministic/provider-fake checks. Actual game-page state wiring, live-provider speech, and user acceptance are still pending; the authoring preview does not substitute for them. Speaking mouth timing is synthetic, with no phoneme alignment. Numeric transitions settle for 240ms where no authored transition exists; changing visible arm parts remains discrete.

## Next gates

The project coordinator reviews and integrates the ordered source and lockfile commits, then the game-page bridge is tested. After that test passes, one additional-character production agent may start against this contract and workflow. Each character is self-checked, reviewed by its initiator, and shown to the user individually before activation.
