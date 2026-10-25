# Test coverage

The README badge is a repository-local **application lines snapshot**, not a live service. [Sample metadata and counts](summary.json) records the exact implementation commit, collection time (UTC ISO 8601), Node version, denominators and Vue remapping checks; [summary](summary.md) is the readable result. A subsequent commit stores these output files, so the sample SHA intentionally precedes that storage commit.

## Scope

- One Vitest 5.0.5 process, V8 provider 5.0.5, six projects: Web, gateway, UI, game-core, voice and character-animation. Existing project configurations are reused.
- Explicitly includes production `.ts`/`.vue` under those six `src/` directories, including unimported entry points. Excludes declarations and UI `src/demo/`. Artwork, CSS, JSON game content, tests, prototypes, generated assets and vendor files are outside this denominator.
- Native `node:test` collects only `scripts/main-preview.mjs` and `scripts/character-presets.mjs`, running their two original test files. Script lines, branches and functions are a separate report; Node and Vitest count source/branches differently, so no mixed average or whole-repository percentage is advertised.
- No new coverage threshold. `npm test` keeps its original behavior. Coverage is not visual, microphone, live-provider, AI-behavior or device acceptance.

## Collect and update

Use the project's Node 24.22.1 and npm 11 toolchain:

```sh
npm ci
npm run coverage
# Commit implementation/configuration changes first, then collect from that clean HEAD.
npm run coverage:snapshot
```

`coverage:snapshot` requires a clean collection from the current HEAD and unchanged application/test/collector files, including newly created untracked files. The three snapshot outputs may themselves be dirty without invalidating the sampled source. Review and commit the three small files in `docs/coverage/` (`application-lines.svg`, `summary.json`, `summary.md`) through the ordinary integration workflow. It does not commit, push or deploy. Spawned Node commands use `process.execPath` and argument arrays, including when the runtime path contains spaces.

Full local HTML, LCOV, detailed JSON and ordinary-discovery/result files remain ignored under `coverage/`. Open `coverage/application/index.html` for per-file application reporting; script LCOV and native summary are under `coverage/scripts/`. `coverage/report/` contains the generated SVG, portable metadata and readable summary.

CI runs the same collection instead of duplicating `npm test`, verifies ordinary workspace file/template discovery against all expanded runtime tests, writes a job summary, and uploads `coverage/` as `coverage-<SHA>` for 14 days. Reports are available through [CI runs](https://github.com/nighca/lie/actions/workflows/ci.yml), subject to repository access. Uploading a CI artifact **does not update the tracked README badge**. Permissions remain read-only; no bot commit, external account, secret or coverage service is added.

## Vue and denominator acceptance

Every collection verifies that all tracked included production files appear exactly once and no `?vue&type=*` virtual paths create duplicates. It checks statement/branch ranges against original App.vue, Editor.vue and AnimatedPortrait.vue source lines and records one executed and one partially/unexecuted branch example per component in the metadata.

The first real report was manually compared with the original conditions: App's selected-character fallback and phase watcher, Editor's initial preset fallback and restored draft branch, and AnimatedPortrait's media fallback and missing-matchMedia branch. The mappings point to original source and distinguish executed/untaken paths. Implicit else locations can be empty and generated columns can be null in Istanbul/Vue output; these are not extra source files or evidence that every template branch is perfect. App and Editor also have original template-line branch locations. AnimatedPortrait has **no separately mapped template branch** for its slot/v-show in this V8 report; script fallback checks and component tests do not make that a complete template-branch denominator. The metadata exposes this count rather than claiming full SFC instrumentation. These checks validate the inspected mappings, not pixel coverage. The first report includes the unimported gateway production entry point with zero coverage, rather than silently omitting it.
