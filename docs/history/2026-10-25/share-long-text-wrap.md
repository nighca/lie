# Shared-case long plain text wrapping

## Change

A valid 16,000-character share URL decoded successfully, but its 15,473-character unbroken public background escaped the intro card: in the original real IAB run a 1280px viewport had document scrollWidth 143408px. This was a text-layout defect, independent of the codec and provisional URL budget.

The patch adds one local rule in `apps/web/src/style.css`: `.background, .public-background { overflow-wrap: anywhere; }`. Existing `white-space: pre-wrap` remains. This permits soft line breaking without changing text, explicit newlines, JSON or the share codec. It does not truncate or hide horizontal overflow. `.background` is shared by the intro and reveal text; `.public-background` is the investigation background dialog, which had the same missing soft-wrap rule. No other styles, content, editor or shared components change.

## Ownership and verification

Implementation worktree: `/Users/nighca/.codex/worktrees/share-intro-wrap/lie`, branch `codex/share-intro-wrap`, reviewed base `73ba1387c24762e48e78c003eef2421e53746a71`.

Node 24.22.1: all 186 Web tests passed, as did Web typecheck and production build with 60 appearance assets. No CSS-mirroring test was added. The production codec and URL matrix were not changed or unnecessarily rerun in full.

Real IAB acceptance used isolated same-origin iframe **CSS viewports**, not new top-level mobile-device emulation. Candidate service was 127.0.0.1:5531. The previous production-encoded boundary fixture was reused with a same-length origin substitution (8787 to 5531), preserving a full URL of exactly 16000 characters.

- Boundary case at actual 1280×720: document scrollWidth 1280; at actual 391×676: scrollWidth 391. Both intros kept all 15473 background characters exactly equal to the decoded fixture, with `pre-wrap` and `overflow-wrap: anywhere`.
- Ordinary Chinese/emoji/ZWJ/combining/astral case at both sizes: scrollWidth equaled 1280/391, DOM text matched the original exactly, and its explicit newline count stayed one. This tests text preservation, not universal glyph availability.
- The desktop long-case investigation start button was clicked successfully. Opening its public-background dialog kept the complete 15473 characters; dialog scrollWidth and clientWidth were both 656 and document scrollWidth stayed 1280. No conversation was started.
- The short-screen long-case return button reached the home page. In the ordinary case, mobile start reached the idle investigation UI and desktop return reached home. Own test sessions were ended through the existing confirmation before teardown; the conversation-start control was never clicked.
- An initial attempt to reload the fixture while its own desktop test was still investigating did not advance to the updated fixture. The current frame sources/state were inspected, the disposable test session was ended through normal UI, and reloading then showed the expected normal fixture. No blind repeat or application source workaround was used.

Screenshots inspected: `/private/tmp/lie-share-wrap-boundary-frames.jpg` and `/private/tmp/lie-share-wrap-unicode-frames.jpg`. These show the two explicitly labelled CSS viewports. Temporary `public/share-wrap-qa.html` was removed and the owned tab22 closed. The independent 5531 server was stopped. No global viewport changed, no old tab or user draft was touched, and the fixed 8787/8788 and animation 5504 services were left alone. No microphone/provider call, browser network capture, real touch or cross-browser matrix is claimed. Long reveal text shares the fixed class but was not independently exercised as a separate result-screen case.
