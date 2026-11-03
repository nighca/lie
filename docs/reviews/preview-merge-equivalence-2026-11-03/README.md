# Preview merge identity renewal — 2026-11-03

Status: the narrow publisher fix passed independent local review and is awaiting coordinator review and integration. No new deployment, PR mutation, or provider check is authorized by this document. PR #5's source head remains `d93dbb9374bb4b1e3302732df557fdb84cec2bfc`; the direct preview is unchanged.

## Observed recovery attempts

After main `0671d8647b1dc207f1cc8ec4a27a07cb274cf3b1` published the custom-domain changes, two explicitly authorized close/reopen attempts tried to refresh PR #5's CI. Both trusted cleanup runs succeeded. The second attempt was authorized separately after reviewing the first attempt's stale event snapshot; no third attempt was made.

| Attempt | Close CI / cleanup publisher | Reopen CI | Tested merge | Publisher outcome |
| --- | --- | --- | --- | --- |
| 1 | 41557851959 / 41557884772 | 41558109724, attempt 1 | `ceeb683c03c486d24fd43011f4ee1b973abd4d79` | 41558339539: selection succeeded, preview skipped |
| 2 | 41558707302 / 41558727580 | 41558923319, attempt 1 | `9811d6b6f03a81c5d9fd8165133a34de1f9ea925` | 41559164685: selection succeeded, preview skipped |

The first reopen CI actually checked out the old merge into base `c8f85d5a47b884268e8cb90e7eb89ef2de28a86f`. It cannot be accepted against main `0671…`.

The second reopen CI actually checked out `9811…`. Its checkout log, coverage source, and packaging environment all identify that tested SHA, with base `0671…` and unchanged head `d93…`. GitHub subsequently exposed current merge `71f8b383dd45da6c97ec080e72cbac00b00e7510`. Independent `git/commits/{sha}` API responses showed:

| Fact | Tested merge `9811…` | Current merge `71f8…` |
| --- | --- | --- |
| Ordered parents | `0671d8647b1dc207f1cc8ec4a27a07cb274cf3b1`, `d93dbb9374bb4b1e3302732df557fdb84cec2bfc` | Same exact two parents |
| Tree | `a468866958f18e2221a08dec26185c31cf733598` | Same exact tree |
| Author and committer timestamps | `2026-11-03T01:11:45Z` | `2026-11-03T01:18:53Z` |

[Second producer CI](https://github.com/nighca/lie/actions/runs/41558923319) succeeded. Artifact `13196106440` is named `pr-preview-5-9811d6b6f03a81c5d9fd8165133a34de1f9ea925-41558923319-1`, with API digest `sha256:40b8da44f5ce9deb7222cc518b627e99db6be53657675fd70ea73aca1f1ebc91`. The operational investigation read the logs and artifact metadata; it did not download or execute this artifact.

[Second publisher](https://github.com/nighca/lie/actions/runs/41559164685) completed with a skipped preview job, not a successful deployment. Final readback found PR #5 open, non-draft and mergeable, with unchanged head/base, and the native `pr-5` child absent (404). Page acceptance was therefore not claimed. Closed PRs #2, #3 and #4 were not reopened. No provider, microphone, listening, audio, or direct WebSocket call was made during this recovery.

## Approved narrow fix

Retain the real tested merge SHA in the artifact name, receipt, restored build identity, deployment payload, and user-visible tested-build attribution. A different current merge may pass only after independent, fixed-repository GitHub commit reads confirm exact response SHAs, exactly two ordered parents matching the current base/head, and identical valid tree SHAs. Missing or malformed evidence and API failures reject publication.

Repeat the proof and existing run, attempt, artifact uniqueness, provenance and digest checks at each authorization boundary; do not cache an equivalence flag. Current merge SHA is separate audit information, never a replacement for the tested SHA. Fork/Dependabot approval remains bound to the complete current head. Manual discovery keeps the existing three-page bound and only adds runs explicitly associated with the current PR number, full head and base; it does not search artifacts for plausible historical builds.

The fix does not change producer workflows, application code, PR source, Cloudflare resources, or published main. A reviewed integration will advance main, making the above old-base artifacts unsuitable for that new base. Any later fresh CI trigger and live acceptance require the coordinator's separate operational authorization.

## Local implementation and verification

Source commit `850501b43f5cc49c9506fc7066a2556f90e400f8` is based on reviewed main `0671d8647b1dc207f1cc8ec4a27a07cb274cf3b1`. It changes the two publisher helpers, their tests, one directly dependent artifact-test fixture, and the implementation contract. The operational evidence in this document is a separate follow-up commit.

The owner independently read the full final diff and surrounding artifact restore and workflow code, then ran Node.js 24.22.1 with `--test scripts/pr-preview*.test.mjs scripts/ci-release.test.mjs`: **201 passed, 0 failed**. Both changed helpers passed `node --check`; the complete source diff passed `git diff --check`. The test environment used local dependency installation with `npm ci --offline --ignore-scripts`; no application service or real cloud/provider test was started.

Coverage includes equivalent regeneration with the real tested identity preserved, exact API commit facts and same-SHA validation, failed or malformed proof, repeated authorization and artifact/digest replacement, constrained manual discovery, fork approval, changed state during upload and approval-notice queries, and saved restore identity and success-summary attribution. These are offline checks; live Actions and Cloudflare acceptance remain outstanding until the reviewed fix is published and a separately authorized fresh CI run produces evidence against that new main.
