# Coverage design preparation

Date: 2026-10-25 (Asia/Shanghai)

Reviewed base: `2982e6a77046d9f3c3744e529c08166149e3eddc`.

Status: design preparation only, **not implemented**. No coverage collection was run and **no coverage percentage is available**. This document preserves the investigation handoff for review and repository archival; its recommendations are not a record of approval or completed implementation.

## Investigation boundary

The investigation read the current reviewed main, test/configuration files, installed package implementations and official documentation. Main stayed at the reviewed SHA and clean. No repository files, Git refs, dependencies or lockfiles were changed. No packages were installed, no tests or coverage collection were run, and no services, browsers, microphone or provider were operated. The character-preset migration owner retains ownership of package renaming, root package/lock, generator and runner changes.

## Verified current setup

| Test domain | Discovery and environment |
| --- | --- |
| Web | `test/**/*.test.ts`; jsdom, Vue plugin, `test/setup.ts` |
| UI | `test/**/*.test.ts`; jsdom and Vue plugin |
| Gateway | `test/**/*.test.ts`; node; independent Vitest config that does not load the Cloudflare development plugin |
| appearance-animation | `test/**/*.test.ts`; node |
| game-core and voice | No Vitest config; default `**/*.{test,spec}.?(c\|m)[jt]s?(x)` discovery and default node environment |
| Node scripts | Root `npm test` first runs `scripts/main-preview.test.mjs` and `scripts/appearances.test.mjs` independently with node:test, then runs workspace tests |

Installed Vitest is **5.0.5**. Its default test exclusions are `**/node_modules/**` and `**/.git/**`. Installed coverage defaults include provider `v8`, coverage disabled, empty coverage exclusions, reports under `./coverage`, cleaning enabled, and no thresholds configured by this repository. Default coverage includes only imported files unless an explicit include is supplied.

Neither `@vitest/coverage-v8`, `@vitest/coverage-istanbul`, c8 nor the inspected Istanbul reporting libraries are installed. The lockfile mentions coverage providers only as optional peers of Vitest; that is not an installed provider. Coverage reporter option types are available in Vitest itself, but actual collection requires a provider. Running coverage can prompt for automatic installation, so it was deliberately not invoked during this read-only preparation.

Relevant repository evidence: root `package.json` and `package-lock.json`; Web/UI/Gateway/appearance-animation Vitest configs; game-core/voice package scripts; `scripts/main-preview.test.mjs`; `scripts/appearances.test.mjs`; `.github/workflows/ci.yml`; `.gitignore`; both READMEs; installed `vitest/dist/config.cjs`, Vitest coverage option types, and `@vitejs/plugin-vue/dist/index.mjs`.

## Recommended implementation after migration stabilizes

1. Create an isolated implementation worktree. Install exact matching `@vitest/coverage-v8@5.0.5` as a root devDependency with a normal lockfile update. No external coverage service is required.
2. Add root `vitest.coverage.config.ts` using **one Vitest process and six projects**. Reference the existing four project configs, and explicitly define root/include/node settings for game-core and voice. Keep coverage configuration at the root. This avoids adding separately calculated workspace percentages or double-counting shared production files imported by multiple workspace test suites. Vitest documents coverage as process-wide/root-level configuration: [Test Projects](https://vitest.dev/guide/projects.html).
3. Explicitly include production `apps/{web,gateway}/src/**/*.{ts,vue}` and the four final package directories' `src/**/*.{ts,vue}`. Exclude declaration files and UI `src/demo/**`; do not silently remove untested production entry points. CSS, JSON content, artwork, test fixtures, spikes, design, generated public/dist files and vendor code are outside the executable-source denominator. An explicit include ensures unimported production files are represented rather than limiting statistics to files touched by tests: [Coverage configuration](https://vitest.dev/config/coverage.html).
4. Emit `text-summary`, `json`, `json-summary`, `html` and `lcov` into `coverage/application`. Do not introduce coverage thresholds or change the semantics of ordinary `npm test`. Run the new coverage command and verify that its discovered test set matches the existing ordinary commands before reporting numbers.
5. Preserve native node:test for the two script test groups. Run them together to form a separate scripts report with an explicit production-file allowlist. Node's built-in spec/lcov reporters require no c8 dependency. If a machine-readable summary is needed, consume the `test:coverage` event in a small reporter rather than parsing the human-readable terminal table: [Node 24.22.1 coverage](https://nodejs.org/docs/latest-v24.x/api/test.html#collecting-code-coverage).

Illustrative native command, to be updated for the migration's final generator filenames (the orchestrating script must create output directories first):

```sh
node --test --experimental-test-coverage \
  --test-coverage-include='scripts/main-preview.mjs' \
  --test-coverage-include='scripts/appearances.mjs' \
  --test-reporter=spec --test-reporter-destination=stdout \
  --test-reporter=lcov --test-reporter-destination=coverage/scripts/lcov.info \
  scripts/main-preview.test.mjs scripts/appearances.test.mjs
```

This is a proposed command, not an executed verification result. The runner tests exercise temporary child-process and Vite fixtures; a future coverage run must respect operational ownership and keep those fixtures isolated from user services.

## Aggregation and denominator

Recommend a clearly labelled **application lines** badge for the six workspaces collected by the single Vitest process. Report native scripts' lines/branches/functions separately. Do not average percentages, and do not directly concatenate Node and Vitest totals under a claim of whole-repository coverage: their executable-line and branch definitions can differ.

If a single whole-repository number is required, implementation must first establish a common instrumentation/conversion method and validate its file/line sets. That is additional work, not something already solved by adding LCOV files or adding reported percentages.

All reports should retain covered and total counts, scope and source SHA so that the denominator and snapshot are inspectable. No new gate or minimum percentage is proposed.

## Vue SFC and source-map acceptance

Web and UI already use the Vue plugin. Inspection of the installed plugin showed source maps enabled for non-build transformations and script/template map composition paths. V8 coverage has AST remapping support: [Vitest coverage providers](https://vitest.dev/guide/coverage.html). These facts support the proposed route but **do not prove this repository's SFC coverage remapping has passed acceptance**.

The first real run must inspect reports for App, Editor and AnimatedPortrait:

- Report original `.vue` source paths and valid original-file line numbers.
- Do not duplicate SFC files under `?vue&type=*` virtual-module paths.
- Compare executed and unexecuted branches against actual source to establish meaningful remapping.
- Confirm unimported included production files are represented.

Do not enable production build source maps merely to collect test coverage. Do not describe executable-code coverage as CSS, visual, live-provider or real-device coverage.

## PRIVATE repository badge and CI route

Current `.github/workflows/ci.yml` grants only `contents: read` and checks out with `persist-credentials: false`. It performs clean installation, checks, build and a deployment dry run, and can deploy the latest verified main using existing secrets. It has no current coverage-artifact upload or report publication step. This proposal does not authorize a push, workflow dispatch, deployment, new secret or permission.

Minimum route: generate coverage summary, a local SVG badge and SHA/scope metadata inside the verification job; write the summary to Actions job summary and upload report/badge as existing GitHub Actions artifacts. This needs no new external account or coverage service: [GitHub workflow artifacts](https://docs.github.com/en/actions/tutorials/store-and-share-data).

README can reference a repository-local generated SVG **snapshot**, updated during the ordinary reviewed local integration/milestone workflow, labelled with its sampling SHA and linked to the latest CI/report. CI generation of an artifact does not update a tracked README SVG; do not call that snapshot live.

Updating the tracked badge on every CI run would require a separate write-permission/bot-commit strategy. That is a decision to discuss, not part of the current minimum recommendation. GitHub's native workflow status badge reports pass/fail rather than coverage percentage, and private-repository badges cannot be used as publicly accessible external embeds: [GitHub status badges](https://docs.github.com/en/actions/how-tos/monitor-workflows/add-a-status-badge).

## Migration interface and ownership

Wait for the migration owner's final package directories/names, generator and test filenames, script names, and root package/lock to stabilize. Do not compete for those files while migration remains active.

Proposed subsequent coverage owner scope, after release:

- Root `package.json` and lockfile.
- New root coverage configuration.
- New `scripts/coverage*.mjs` orchestration/report or badge generation as needed.
- CI workflow, both READMEs, optional coverage documentation and badge snapshot.

Work already unblocked by this preparation: recommended source scope, one-process projects aggregation, separate script reporting, Vue acceptance checks and PRIVATE badge-generation options. Implementation should not repeat this investigation solely because it waited for naming stabilization.

## Open decisions and limitations

- Does README accept a generated SHA-labelled snapshot, or require automatic updates after every CI run? The latter needs a distinct write/publication design.
- Is a clearly scoped application badge with a separate script report sufficient, or is a mixed-runner whole-repository single figure explicitly required?
- Exact final file paths must follow the migration outcome.
- Provider installation, actual coverage execution, SFC remapping acceptance, report/badge generation and CI integration remain unperformed.
- There is no measured coverage percentage and no new coverage threshold.
