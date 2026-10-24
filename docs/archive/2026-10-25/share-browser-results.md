# Bounded sharing IAB acceptance — 2026-10-25

Source checkout main: `0f73006f54052610ea3e89a4c9432c766c560360`; share.ts blob `7539ab638591ef416eafbfda102a90ed72aa4292`. No application files changed. Fixture generation transpiles the actual content validator and production codec, using Node 24.22.1, with the real `http://127.0.0.1:8787` origin and no query/demo parameter. Files: `/private/tmp/lie-share-browser-fixtures.mjs` and `.json`.

## Observed in real IAB

- New owned tab19 opened the 539-character normal share URL. Intro title and public background matched expected strings exactly, including Chinese, emoji/ZWJ/skin-tone sequence, combining accent, astral character, newline and reserved text. This proves DOM text preservation, not universal font glyph coverage. Screenshot `lie-share-browser-normal.jpg`.
- `tab.reload()` on tab19 retained the normal intro. The initial open was a fresh tab navigation; reload was a separate actual reload, not an in-app transition or simulated state injection.
- New blank owned tab20 navigated to an actual production-encoded URL of exactly 16,000 ASCII characters on the real origin, with empty query. The expected boundary intro and investigation-start button appeared. Actual reload returned the same intro. Screenshot `lie-share-browser-16000.jpg`.
- New blank owned tab21 navigated to the 16,001-character URL and displayed “分享案件无法打开 / 分享链接过长，请向作者索取可用链接”. Screenshot `lie-share-browser-16001.jpg`.
- Tab21 then navigated to a damaged gzip payload and displayed “分享链接不完整或已损坏，请向作者索取完整链接”. An actual reload preserved that error. Initial damaged navigation reused a tab on the same /play path; its reload is recorded separately. Screenshot `lie-share-browser-damaged.jpg`.

## Independent finding

The 16k boundary case used a long unbroken ASCII public-background string (15,473 characters). Although decoding/navigation succeeded, the intro did not wrap it: actual viewport width 1,280px and document scrollWidth 143,408px. The boundary screenshot shows text escaping the card/right edge. Record as a separate user-content layout bug, not a codec failure. This QA task made no fix.

## Limits and cleanup

Initial browser network request capture is NOT tested. CUA's read-only page evaluation did not expose Performance APIs; one attempt failed immediately. No raw CDP retry or fallback was made because a prior CDP diagnostic had stalled, and the task explicitly required bounded probing. Source architecture keeps content in the fragment, but this run does not claim captured HTTP evidence of its omission. There is no cross-browser, address-bar paste, external messenger transport, offline, paid-provider or live-voice acceptance claim. The 16,000 budget stays provisional. Existing Node audit evidence remains distinct from browser checks.

All three owned tabs (19/20/21) were closed. No editor was opened, no user draft or old tab was touched, no voice/start button was pressed, no mic/provider was used, no global viewport was changed, and no 8787/8788 service was started/stopped. Only local temp fixture/report/screenshot files remain. No Git mutation was performed.
