# salt-pepper-beard restored formal-game QA

Source-record base: `da1b0749074010a317a3a93aebd3b1eec12c426a`.

Actual game: `/?game=duck-finale&demo=1`, first character 任爷爷. Re-ran desktop four-state visual checks against this restored combined candidate, supplementing the older 5505 evidence. Head/neck, cuffs, arms and hem remain connected at normal stage size; chin-rest waiting and palm-up speaking display correctly. At 391×844 all four animated poses fit the stage with no horizontal document overflow. Existing short desktop stage crop remains unchanged.

Blocking only `*salt-pepper-beard/animation/package.json*`, switching away/back yields hidden canvas and all four matching static images during actual demo UI events. Removing the block and switching away/back restores one visible canvas labeled 任爷爷. Reduced motion also yields hidden canvas and default static image; clearing it restores animation. The earlier vanished-server recovery limitation is superseded for these specific checks by this restored-server run.

Rapid UI switching under per-tab 1500 ms network latency and cache disabled ended with one visible 任爷爷 canvas and no fallback. The initial bounded visible-canvas wait expired while the five textures were still loading; a later DOM/screenshot read after their completion showed success. That first network trace was truncated and cannot prove cancellation. A separate immediate event read captured the plum package request and its `canceled:true / net::ERR_ABORTED` when switching back to gray; the sanitized evidence is in the plum formal record. This demonstrates this tested old-request cancellation and final-current-character isolation, not every possible stale completion scenario.


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
- [late-current-character](evidence/formal-dawn-late-current-character.jpg)
- [static observations](evidence/formal-dawn-static.json)
