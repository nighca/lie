# plum-crop restored formal-game QA

Source-record base: `00881f691140ae14042fc3f3fa90ffc8347549cc`.

Actual game: `/?game=duck-finale&demo=1`, third character 贺宁. Formal Vue game player now reviewed, beyond the source author's sampler-only preview. Default/listening/waiting/speaking visually coherent at desktop and 391×844: collar/head contact, speaking shoulder cap, fingers and waist show no newly visible gap or detached part. The small narrow stage keeps the complete head/hands and lower silhouette with no horizontal document overflow. Existing short desktop stage crop remains unchanged. Speaking has both open/closed mouth phases; the four-state screenshot need not show the open phase in every capture.

Reduced-motion default shows hidden canvas and `/appearances/plum-crop/default.png`; clearing it restores animation. Blocking only `*plum-crop/animation/package.json*`, switching away/back, yields hidden canvas and all four corresponding static images through demo events. Unblocking and switching away/back restores one visible canvas labeled 贺宁 with no fallback.

Per-tab 1500 ms network latency/cache-disabled switch to plum then immediately gray produced plum package request `85032.303` followed by canceled=true, `net::ERR_ABORTED` for the same request. Immediate trace was not truncated. Final current gray canvas was singular and visible after loading; the old plum portrait did not replace it. Sanitized trace includes only event kind, sequence, URL/request ID/timestamp/cancel/error fields, no request headers. This is actual network cancellation under UI switching, not a synthetic application event; broader late-completion races remain outside this bounded run.


## Method and limits

This is animation source-owner team QA, not individual user acceptance or independent integration review. User has waived individual acceptance for characters after silver. Tested on 2026-10-25 morning, Asia/Shanghai, against candidate `bfb2a33954cf78ea9b92e2f1acd7ef66e2faef1c`, worktree `/Users/nighca/.codex/worktrees/three-character-qa-dawn/lie`, server `http://127.0.0.1:5504`. Main was not changed by this QA.

Actual Codex in-app browser UI only; demo conversation does not capture microphone, synthesize voice or call a real provider. Default/listening/waiting/speaking were visually inspected at desktop 1280×720 and in the unchanged real game embedded in a same-origin iframe whose DOM reports innerWidth=scrollWidth=391 and innerHeight=844. Narrow testing is a real CSS viewport, not a claim of top-level mobile-browser or device testing. No shared viewport override was changed. Full-page native screenshots retain the QA-shell context and are copied without pixel edits.

The first full-transcript-text timing attempt captured the following phase because text reveals progressively. Final waiting/speaking captures instead wait for a newly inserted user/assistant article and were classified by the actual visible pose; earlier mislabeled temporary shots are excluded. Iframe locator clicking had scroll/position failures; keyboard Space on the actual focusable game controls completed the same user UI operations. This is not evidence of a game click defect.

Each of the two iframe-host tabs logged one `MutationObserver.observe` TypeError with no reported source URL. Direct game tabs had empty warn/error reads. Source attribution is unknown, so the iframe console is not marked clean and this error is not asserted to be either product-owned or tool-owned. Real hidden-tab pause/resume and a sustained full waiting breathing loop in the game are untested: the demo waiting interval is only about 400 ms. Full-cycle waiting geometry and breathing were reviewed separately in source-author evidence; those checks are not relabeled as game-page evidence. No claim of every transition frame being pixel-perfect.

All dedicated tabs closed. Per-tab media/network/cache overrides cleared before closing. The sole authorized temporary shell `apps/web/public/qa-three-character-iframe.html` was deleted; candidate status rechecked clean. Existing services and user tabs preserved; no main integration, push or deployment.

## Evidence

- [default](evidence/formal-dawn-default.jpg)
- [listening](evidence/formal-dawn-listening.jpg)
- [waiting](evidence/formal-dawn-waiting.jpg)
- [speaking](evidence/formal-dawn-speaking.jpg)
- [narrow-default](evidence/formal-dawn-narrow-default.jpg)
- [narrow-listening](evidence/formal-dawn-narrow-listening.jpg)
- [narrow-waiting](evidence/formal-dawn-narrow-waiting.jpg)
- [narrow-speaking](evidence/formal-dawn-narrow-speaking.jpg)
- [package-fallback](evidence/formal-dawn-package-fallback.jpg)
- [package-recovered](evidence/formal-dawn-package-recovered.jpg)
- [reduced](evidence/formal-dawn-reduced.jpg)
- [static observations](evidence/formal-dawn-static.json)
- [cancellation observations](evidence/formal-dawn-cancellation.json)
