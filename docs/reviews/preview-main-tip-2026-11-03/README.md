# Independent preview main baseline — 2026-11-03

Status: local fix reviewed and checked; coordinator integration and live preview acceptance remain pending. This record supplements the [merge regeneration evidence](../preview-merge-equivalence-2026-11-03/README.md).

## Observation and bounded recovery

Published main `eb40f6fe6c2a282768d1a2c376ec10963c848f28` passed CI `41561022122` and CD `41561236426`. PR #5 nevertheless remained on API base `0671d8647b1dc207f1cc8ec4a27a07cb274cf3b1`, merge/ref `71f8b383dd45da6c97ec080e72cbac00b00e7510`, with ordered parents `[0671…, d93dbb9374bb4b1e3302732df557fdb84cec2bfc]`. Independent CLI reads with both `Cache-Control: no-cache` and `Pragma: no-cache` confirmed the same facts.

The coordinator authorized exactly one draft-to-ready attempt instead of another close/reopen. Converting to draft at `2026-11-03T01:47:52Z` preserved the source head and did not trigger PR CI. Approximately two minutes of bounded checks, including an independent no-cache read, did not obtain a merge against the new main. The authorized rollback marked the PR ready at `01:50:04Z`; it restored the original open, non-draft state and triggered CI `41562291870`.

At this point the owner identified a missing assumption in the previous operational plan: the publisher compared commits with `PR.base.sha`, but did not independently compare that field with the actual main branch tip. A stale PR API snapshot could therefore satisfy the existing checks. The expectation that this rollback's old-base build would automatically be rejected was incorrect. This is the project's requirement to publish against current main, not evidence of a provider security defect; previews of older bases can otherwise be legitimate PR snapshots.

## Containment result

Only rollback-triggered CI `41562291870` was cancelled. Its actual checkout was `71f8…` into base `0671…`. Final status was `completed/cancelled`; application coverage was interrupted, and production build, preview build, packaging and preview artifact upload were all skipped. Its only artifact was coverage `13197835924`, not a preview build.

Publisher `41562463172` used main `eb40…` and failed in read-only selection with `PR CI did not complete successfully`; initialization, preview and approval-notice jobs were skipped. Exact native `pr-5` readback was 404. GitHub `preview/pr-5` deployment listing still contained only the two November 2 records `7497886782` and `7497810680`; no new deployment was created. The final PR state remained open/non-draft with unchanged source head. No resource deletion, provider, microphone, listening, audio or direct WebSocket operation occurred.

## Narrow fix and verification

Source commit `d74fd4612f41370c03cd61c9369ece8075b117a4`, based on reviewed main `eb40…`, adds an independent fixed-repository `git/ref/heads/main` read to every publishable prepare and every existing authorization boundary. It validates the exact ref, commit object type and full lowercase SHA; the PR base and both ordered merge base parents must equal that tip. Main API failure, malformed evidence or a newer main prevents publication. The actual tested merge identity, tree-equivalence checks and all existing artifact and approval checks remain unchanged.

The owner independently reviewed the full final source/test/document diff and ran Node.js 24.22.1 `--test scripts/pr-preview*.test.mjs scripts/ci-release.test.mjs`: **208 passed, 0 failed**. Both changed helpers passed syntax checks and the source diff passed `git diff --check`. Dependency setup was local `npm ci --offline --ignore-scripts`. No application service or cloud experiment was started for the fix.

## Approved next route

The coordinator selected a conventional merge of the latest reviewed main into an isolated candidate starting from PR #5's then-current real head. This preserves the research history and DO NOT MERGE purpose, while allowing one reviewed head update. Relative to the new main, the candidate must contain only the previously reviewed research documents/probes. Its exact merge parents, tree, complete diff and checks must be reviewed before a designated writer performs an ordinary non-force push. That push will use the existing synchronize CI route. Candidate construction waits for this fix's reviewed publication; no PR head was changed during this investigation.

This matches GitHub's documented [traditional branch update](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/keeping-your-pull-request-in-sync-with-the-base-branch). Existing PR Preview dispatch only consumes an existing PR CI artifact; the main CI dispatch does not produce a PR preview artifact. [Rerunning a workflow retains the original event's SHA and ref](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/re-run-workflows-and-jobs), so it is not proof of a newly tested base. No new producer workflow or scheduling system is part of this fix.
