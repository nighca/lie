# silver-bun restored formal-game QA

Source-record base: `79258ad5f51582aed981a1596e7bedcbfd5e7255`.

Actual game: `/?game=salt-sugar-mixup&demo=1`, first character 陶老师. Four poses displayed correctly, head/neck and hand/chin contacts remain coherent, no visible split waistband or sideways whole-body drift in the short game waiting interval. The small 391-wide stage retains the complete head, hands and lower silhouette; no horizontal overflow. Existing desktop short-stage crop remains unchanged.

Exactly one visible 1254×1254 canvas labeled 陶老师 when animated. Switching to static 小岚 and back restores animation. Blocking only `*silver-bun/animation/package.json*`, switching away/back, yields hidden canvas and `/appearances/silver-bun/default.png`. Removing the block and switching away/back restores visible animation with one canvas and no fallback image.

Reduced-motion UI settled to hidden canvas with the corresponding `listening.png`, `waiting.png`, `speaking.png` during demo events and `default.png` after ending conversation. The immediate media-command read raced Vue and still showed the canvas; it is not counted as a failed fallback or as settled evidence. The subsequent UI-settled observations above establish behavior. Clearing media emulation restores visible animation. Default package failure and all four reduced-motion fallback states were tested; package failure in every voice state and a silver-specific delayed completion race were not separately tested.


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
- [reduced-speaking](evidence/formal-dawn-reduced-speaking.jpg)
