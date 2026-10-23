# Agent collaboration

## Ownership and decisions

- This project is developed by AI agents. Use isolated Git worktrees for implementation, local review, and direct integration to `main`; do not open pull requests.
- The agent that delegates a task owns its review, integration, verification, and reporting. This applies recursively: delegation never transfers the initiator's responsibility.
- The root agent coordinates the integration queue and designates **one integrator at a time** for the repository. A child initiator may integrate only after receiving that turn; otherwise hand its reviewed commits to the designated integrator.
- Confirm consequential product, gameplay, architecture, provider, and scope decisions with the user. Record proposals and unverified assumptions as such. Routine implementation choices can proceed within agreed scope.
- Obtain user confirmation of the initial module architecture in `docs/architecture.md` before application implementation. Prepare module responsibilities, interfaces, dependencies, parallel ownership, and independent test plans for that review; a draft document is not approval.
- A dedicated visual owner coordinates UI, logo, and presentation materials. Obtain user approval of the overall visual direction before detailed production design; keep direction proposals and exploratory style boards distinct from approved assets.
- Use Vue and TypeScript for the frontend, matching the user's review and debugging experience. Use TypeScript for backend/Worker code, with Node.js as the preferred server runtime. Validate the chosen host's actual Node.js API support before selecting runtime-specific dependencies; a Worker compatibility layer is not a complete Node.js runtime. Keep reusable rules and content contracts independent of Vue and host-specific APIs.
- Treat new user ideas as steering for the active project. Compare them promptly with confirmed decisions and current assumptions; update `docs/project-plan.md` and notify affected agents. When an idea conflicts with the current direction, explain the conflict and tradeoffs to the user before continuing dependent work. Continue independent work, and never treat silence as approval of a consequential proposal.
- The first release contains one game; the engine must support multiple game content packages. Adding another game within the agreed interrogation mechanics must require content and necessary presentation configuration only, without changes to the generic engine or UI. The first game has three suspects; do not hardcode that count into the engine. Keep case content and identifiers out of engine-specific hardcoding. Use `docs/architecture.md` to develop the design, distinguishing confirmed requirements from proposed implementation. Module boundaries do not imply traditional servers or separate deployments. Keep platform management credentials out of client assets; the confirmed architecture runs game content, session state and accusation logic in the browser, with a thin Cloudflare Worker for provider transport. Full game data may be inspectable in the browser; provider management credentials must remain private. Story background and character profiles are plain text; keep appearance resources separate and reference them by ID. The confirmed gameplay has voice-only character communication, read-only transcripts, UI operations and button accusation; no evidence collection, presentation, proof combinations or rule DSL.

- Module architecture, interaction prototype and the playful Chinese B visual direction have been approved; see `docs/project-plan.md` for dated decisions. Do not ask for those approvals again. New consequential changes still require discussion.
- Prefer the Codex in-app browser for development and testing. The user separately authorized their logged-in Chrome Linx console when provider configuration requires it; this does not change the development-browser preference.

## Before parallel work

- Inspect repository instructions, status, branches, and remotes. Protect unrelated and uncommitted changes; never stash, discard, overwrite, or commit them without their owner's agreement.
- Assign each task an owner, concrete outcome, allowed files, dependencies, and starting commit. Avoid overlapping file ownership. Coordinate shared interfaces before coding; request ownership changes through the initiator.
- Worktrees isolate checked-out files, but share Git refs, objects, remotes, and configuration. Never change another agent's branch or repository-wide settings. Never run Git mutations concurrently against the same worktree.
- Give each implementation task a unique `codex/<task>` branch and worktree. Prefer the app's managed worktree tools. Start independent tasks from a reviewed local `main` SHA, including commits not yet pushed. For dependent tasks, specify the dependency SHA explicitly and preferably wait until it is reviewed and integrated into local `main`.
- Do not assume the app's default worktree base is the intended commit: verify its HEAD. A branch cannot be checked out in two worktrees; inspect existing worktrees before creating or switching one.
- Report missing prerequisites for the current operation accurately. Remote access is required for bootstrap verification and publication, not every local integration. Do not silently invent configuration or claim an integration or push succeeded.

## Bootstrap

- An unborn `main` cannot serve as a worktree base. Until the first commit exists, use explicit, disjoint file ownership in the initial checkout; only the root agent performs Git mutations there.
- First fetch `origin` and determine whether remote `main` exists; an unborn checkout or absent local tracking ref alone proves nothing. If fetch fails, report the blocker rather than assuming an empty remote.
- If remote `main` exists, adopt its history as the base before creating project commits, preserving all local drafts and reviewing its instructions. If tracked files would collide with drafts, preserve and reconcile those files before changing the checkout.
- If remote `main` is absent, the root agent reviews and validates the initial files, stages only the agreed files, and creates the initial local commit. Worktree delegation can begin immediately; publication waits for a milestone.
- If first publication discovers independently created, unrelated remote history, preserve local history under a unique `codex/bootstrap-*` reference and pause publication for explicit review of history adoption. Never blindly merge unrelated histories or replace remote history. Any agreed adoption must preserve the bootstrap commits and drafts and be reviewed and validated before updating `main`.
- Keep credentials and generated local state out of commits; decide explicitly whether temporary drafts belong in version control.

## Implementation and handoff

- Keep changes scoped and commits understandable. Stage named files after inspecting their diff; avoid blanket staging in a shared checkout. Never commit credentials, tokens, private configuration, or unrelated work.
- Run checks appropriate to the change and repository requirements. Report unavailable checks and failures accurately; do not add low-value tests merely to satisfy a checklist.
- Modules suited to automated testing must include meaningful automated checks as part of their completion criteria. Prioritize content validation, deterministic rules and outcomes, state isolation, public/character projections, command idempotency, provider event handling, and critical UI flows. Use provider fakes for independent module tests; separately evaluate real AI behavior and real voice integration. Never present fake-provider success as proof of live-provider behavior.
- Hand off the worktree path, branch, original base SHA, dependency SHAs, ordered commit SHAs, summary, checks and results, known limitations, and any dirty/untracked files. A dirty handoff is not ready for integration until its intended contents are resolved.
- The initiator inspects both the actual worktree status and the full diff from the declared base, reads relevant surrounding code, reviews every incoming commit, and verifies the result. A subagent's summary or passing tests do not replace review.
- Do not rebase, amend, or otherwise change handed-off commits while they are being reviewed. Send follow-up changes as new commits coordinated with the initiator.

## Daily local integration

Use a temporary integration branch/worktree and **cherry-pick the reviewed, ordered commits** as the normal path. Keep task commits linear. Dependencies must already be on the candidate base, or be explicitly reviewed and included once; do not replay a dependency's commits accidentally.

1. Obtain the integration turn from the root agent and hold it through updating local `main`. On one host, a repository-scoped lock or the single coordinator serializes cooperating agents; a local lock cannot coordinate other hosts. Do not delete an apparently stale lock without checking its owner or assume `flock` is installed.
2. Record current local `main` SHA and inspect changes since the task's base. Local `main` may be ahead of `origin/main` or never published. Create a fresh unique candidate branch/worktree at this local SHA and cherry-pick the approved commits in order.
3. Resolve conflicts only in the candidate, inspect the complete combined diff, and repeat review and relevant checks. Escalate conflicts that change agreed behavior or another owner's design. Keep the candidate worktree clean.
4. Recheck local `main` immediately before updating it. If its SHA moved, rebuild the candidate from the new local tip and repeat impact review and validation. The check alone is not an atomic lock: the designated integrator must prevent concurrent local writers throughout this operation.
5. In the existing worktree that owns local `main`, confirm it is clean, then run `git merge --ff-only <verified-candidate-sha>`. Do not check out `main` in the candidate worktree. If the owner checkout is dirty or cannot fast-forward, leave it intact and coordinate with its owner; do not stash, reset, or overwrite its changes.
6. Report the local integrated SHA, review and checks, and that it is not yet pushed; release the integration turn. Do not automatically push after a local integration.

## Milestone publication

Push at meaningful versions or milestones, not after every task. Keep the unique integration turn for the entire publication and any retries; leave other task worktrees untouched.

1. Fetch `origin`, record local and remote `main` SHAs, and inspect remote changes since the last synchronization. If remote `main` is absent, or is an ancestor of local `main`, the validated local tip can be published directly. If histories are unrelated, use the explicit bootstrap adoption process above.
2. If remote `main` is ahead or diverged with shared ancestry, create an owned publication candidate at local `main` and perform an ordinary merge of fetched `origin/main` there. Preserve already integrated local history: never reset or rebase `main`. Review the combined changes, resolve conflicts, and run relevant checks, including when the merge can fast-forward.
3. Confirm local `main` still has the recorded SHA and its owning checkout is clean, then fast-forward it to the verified publication candidate with `git merge --ff-only <candidate-sha>`. If local `main` moved, rebuild from its new tip and repeat review and checks. Unverified merge results must never reach local `main`.
4. From the clean owning `main` checkout, publish the verified tip with an ordinary `git push origin HEAD:main`. Never force-push or bypass checks. Fetch/check is not atomic; ordinary push is the final race guard against other hosts publishing in the meantime.
5. On non-fast-forward rejection, fetch the new remote changes, prepare another merge candidate from current local `main`, review and validate again, fast-forward local `main`, then retry the ordinary push. Never blindly retry. For other failures, inspect the error and remote ref to determine whether publication occurred before taking further action.
6. Report separately the local integrated SHA, any changes still not pushed, and the confirmed published SHA. Do not equate local integration with publication. Release the integration turn after the outcome is clear.

## Failure recovery and cleanup

- Failed candidate review, conflicts, or validation leave local and remote `main` untouched. Abort an in-progress cherry-pick or merge only in the owned candidate worktree; preserve useful work on its branch, fix the source task, and prepare a new candidate. Never use a hard reset of `main` or destructive cleanup to recover.
- A rejected push leaves the candidate available for diagnosis. A successful push is already shared history: fix regressions with a reviewed corrective commit or revert through the same integration procedure; never rewrite published history.
- Worktrees may be cleaned up after reviewed local integration and handoff, without waiting for milestone publication, provided all needed changes/files and dependency commit references are preserved. Use the managed archive tool for managed worktrees. Do not force-remove dirty worktrees or delete branches another task depends on. Retain needed commit references until cleanup is agreed.
