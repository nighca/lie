# Media and research review

2026-10-25; root01a17012 remains the sole integrator. Sources were frozen and clean; root read each complete incoming diff and surrounding relevant source, and independently reviewed the specialist audit records. Integration candidate starts from main713bbe7427320bcda33d26594c78ac25336e3457. Local-preview shutdown documentation dc771b75f38331e9a2aa1b7a9eee8c3fc259b6a1 was already in the candidate.

| Source base / ordered commits | Candidate commits | Review and scope |
| --- | --- | --- |
| 713bbe7 / 736e459b7157d233dc93e8f9945010ebe3227e09 | b15b1cd | [Mobile audit](mobile-demo.md); only MP4, two README links, provenance and209-lineJSON. Root read the direct user request in the specialist chat, all text and exact README delta. Matching frozen media hash permits reuse of packet/decode checks; no re-encoding or whole-video replay. |
| 57ff7d5 / ecd555c37a4e476538f36615dc077f28c83d8c81 → 008fb4263ad5c7f7d4967ecfd04b0b9a86098aca | a637935 → 368bc2e | [Independent audit](voice-latency.md), [result](voice-latency.json); root read all9files, raw stage/fake evidence, actual liveVoice parallel preparation, controller switch and gateway upgrade path. Research only, no optimization. |
| 57ff7d5 / 60d1d8926b56ec4846fdd377b5b49c73d7c47b30 | eb9dc4d | Root and independent reviewer read all98lines and compare current CI/CD/config/production guard. Fork CI has no secrets; publisher uses trusted harness plus untrusted static bytes, per-head approval, identity/race/cleanup handling, public separate origin and explicit cost limits. Account token scope is not Worker IAM isolation. Main direct pushes remain unchanged. Proposal only, still awaiting user approval. |

PR preview implementation must still verify locked CLI URL/delete semantics, account capability/token scope, fork status/deployment display and cleanup races. Review does not approve new Worker, credentials, permissions, public preview, real voice or deployment. Existing production guards are untouched. User retains the two case-model tests.

No runtime/build/workflow/lock change in this batch; source module/blob identity supports prior checks. Document links/JSON/whitespace and saved-probe syntax are appropriate here; no unrelated app suite/build or actual provider connection is repeated. Latency fake tests write their recorded output, so frozen evidence is not rewritten by review. Sources remain available, and no worktree/branch/raw recording is cleaned up.

Final independent candidate check includes untracked archival files:34text files,15JSON documents and166local Markdown links pass; whitespace passes. Git diff confirms apps/packages/scripts/content/design/.github/package and lock files unchanged from713. Root reviewed the complete combined scope. Main and fetched origin/main were both713 before publication; final owning-main cleanliness and tip are rechecked immediately before fast-forward.
