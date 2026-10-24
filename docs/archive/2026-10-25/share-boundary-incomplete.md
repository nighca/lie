# Bounded IAB share-boundary QA: incomplete

Base/current inspected HEAD: 85f77de61ce96645be8318b6ce02719c978fdaad. Main git status was clean. No source edits, branches, commits, servers or Git mutations were made. Dependencies: existing launchd 8787 service only, preserved.

Read AGENTS.md, docs/project-plan.md, docs/game-editor-implementation.md, apps/web/src/editor/share.ts, apps/web/test/editor-sharing.test.ts, packages/game-core/src/content.ts, and Vite/package configuration. Existing Node test obtains an exact boundary by enlarging a synthetic origin; that is not evidence of a real localhost 16000-byte-content IAB navigation.

Created one owned hidden Codex IAB tab, ID 1, browser ID 3, at http://localhost:8787/play. Its actual accessibility state showed heading 分享案件无法打开, message 分享链接缺少案件内容, and buttons 重试 / 返回首页. No editor route or draft content was accessed, no mic/provider/GitHub interaction occurred, and no global viewport was changed.

The subsequent cua call attempted tab-scoped CDP Runtime.evaluate for UA/native compression feature detection, Network.enable and an event cursor. It did not return and was interrupted after approximately 272 seconds. Its individual operations may have partially executed in that owned tab; no success/feature/network claim can be made. No pending-approval or rejection evidence was returned. No exact/near-boundary candidates were constructed, encoded, opened or refreshed. Unicode/emoji/multiple-character roundtrip, answer secrecy, actual URL length and fragment retention, over-limit UI, address-bar paste, captured console/network behavior and all other-browser acceptance remain unverified by this task.

At coordinator request, stopped execution and attempted owned-tab cleanup only. tab.close() immediately returned Browser is not available: 3. An IAB-only tab inventory returned Browser is not available: iab. No other browser was selected; no foreign tab was touched. Therefore tab closure cannot be independently confirmed, though the browser surface was unavailable. There were no owned services to stop or temporary fixtures to remove.

Outcome: no product defect or boundary PASS established. Keep the existing 16000 full-link budget provisional; do not infer acceptance from this attempt or automated tests. Root needs no server cleanup. If the same browser later becomes available, check only the owned test tab before any further UI work.
