# Stable-version exploratory QA — 2026-10-25

One bounded systematic exploration, 08:53–09:03 Asia/Shanghai. Source is the published **abb12dbf7a40689be593c2a1e580f23cfcc5611e**, held fixed throughout. Production code, assets, dependencies and rules were not changed. No P1 was found. Two P2 findings and one P3 workflow improvement were reproduced; this is not a claim that all application behavior is defect-free.

## Environment and evidence

- Owner: `root/stable_exploratory_qa`, root coordinator `01a17012-fa00-7170-ac0a-21c1900d71cd`. Worktree `/Users/nighca/.codex/worktrees/stable-exploratory-qa/lie`, branch `codex/stable-exploratory-qa`, original base above.
- Node24.22.1/npm11, own `npm ci --offline --ignore-scripts`; lock SHA256 `2efd70fe940997ce63746a05a6d5574974560a67d6a737f4801e9f9e254e82e0`, identical to owning main at setup. Generated the fixed source's eight presets/89 assets locally. No application suites rerun: this task adds exploration evidence, not application changes.
- Before startup, 5544 had no listener. One Vite8.3.5 service only, loopback5544, PID14248, originating session26270. `LIE_VOICE_GATEWAY_URL=http://127.0.0.1:9`; no gateway was started. `?demo=1` uses the original fake text/voice port, not microphone, synthesis or a provider. The normal share-open/reload check did not start voice.
- Codex in-app browser: own tabs1 and2 only, both closed. An attempted second-tab creation with explicit hidden visibility reported that visibility is unsupported in a subagent; creating it without that option worked. No Chrome fallback or global viewport override was used.
- Direct desktop tab screenshot dimensions1280×741; desktop same-origin iframe1280×900; narrow iframe391×1000. Narrow document clientWidth/scrollWidth both391 in editor and intro. These are CSS viewports, not hardware-device results. Some full-page captures include the test harness and exceed the inner viewport; see [exact file dimensions](evidence.json).
- Raw CDP storage reads were unsupported, and read-only browser evaluation did not expose localStorage. Instead, the owned temporary [harness](harness.html) copied exactly `lie-editor-draft` into a same-tab, uniquely named sessionStorage backup before any edit. It reported the original key absent. Cleanup restored that exact original state, checked equality, and removed its own backup. [Restoration proof](11-storage-restored.jpg). No other application storage was cleared.
- Eleven screenshots are native JPEG bytes, without cropping, compositing or editing. Only filename extensions were corrected after inspecting the returned JPEG format. [Evidence manifest](evidence.json). All test content is synthetic. No cookies, authentication values, provider identifiers or private logs are included.

## Findings

### LIE-QA-001 — P2 functional: preset-load failure has no recovery through the instructed UI

**Impact:** A transient failure of the initial preset manifest leaves the editor unable to preview/share an otherwise complete saved case for the rest of that document's lifetime. The on-screen instruction specifically recommends reopening the editor, but that action does not retry loading. Existing text remains intact; full-page reload is a workaround. This is a recoverability defect, not an auth or proposed result-layout issue.

**URL/viewport:** `http://127.0.0.1:5544/?demo=1` → `/editor?demo=1`, desktop1280×741. Fixed source abb12db above.

**Actual reproduction:** 1/1 controlled initial-load failure, then one failed editor-reopen recovery, then successful full-page reload control.

1. Use tab-scoped `Network.setCacheDisabled(true)` and `Network.setBlockedURLs(['*/appearances/manifest.json'])`, then freshly load the home page.
2. Open 创作案件 → 故事人物 → 选择预设. No presets; the message says “人物预设暂未加载，请稍后重新打开编辑器。草稿仍保留在此浏览器。”
3. Clear the network block, close the modal, return home, and open the editor again; open the selector again.
4. The same empty selector/message remains. 分享案件 produces invalid-preset validation errors for both otherwise configured characters.
5. Reload the whole page after clearing the block. The selector now has eight preset choices (nine buttons including close), and the saved content is retained.

**Expected:** Retrying as instructed should recover after the transient failure, or the UI should offer an accurate working retry/reload action. **Actual:** Reopening never retries. [Native screenshot after unblocking and reopening](09-preset-reopen-no-recovery.jpg).

**Code context:** [main.ts](../../../apps/web/src/main.ts) performs one manifest fetch, catches failure into an empty immutable props array, then mounts the application. [Editor.vue](../../../apps/web/src/editor/Editor.vue) displays the reopening instruction but has no loader. This code reading supports the already reproduced behavior; it was not the sole basis for the finding. No matching known item found in the current plan/QA documents searched.

### LIE-QA-002 — P2 usability: same-name, same-preset characters produce indistinguishable accusation choices

**Impact:** The editor accepts two characters named 小林 with the same default preset and does not flag the ambiguity at preview/share validation. Players see two identical character choices and two identical “指认 小林” buttons; the underlying IDs give opposite terminal outcomes. A mistaken click ends the game with no second chance. This is a user-visible identity ambiguity, not a duplicate-ID engine bug. Authors can avoid it by assigning distinct visible names; the desired validation/design fix remains a product decision.

**URL/viewport:** `/editor?demo=1` → `/editor/preview?demo=1`, desktop1280×741. [Exported original synthetic fixture](duplicate-names.json), produced through the local 投稿给官方 JSON panel only; no GitHub link was followed.

**Actual reproduction:** 2/2 preview sessions show identical options; selected second option loses, selected first option in a new session wins.

1. Complete a case with two different character IDs, both using the default coral preset. Give both the visible name 小林; set only the first as the answer. Fill all required text and reveal fields.
2. From 真相结局 press 试玩, 接案，开始调查, then 我有答案了.
3. Observe the two visually and accessibly identical “指认 小林” options. [Screenshot](07-duplicate-names.jpg).
4. Clicking the second ends in 指认不正确. Reopen the same case and select the first: 谜题解开了. The UI contains no distinguishing identifier on either card.

**Expected:** Authors get a clear ambiguity warning or players get a stable visible distinction before irreversible selection. **Actual:** Validation accepts the case without such a distinction. [draft.ts](../../../apps/web/src/editor/draft.ts) checks nonempty names, profiles and valid presets but no display-identity ambiguity; [App.vue](../../../apps/web/src/App.vue) labels accusation buttons only with character name and avatar. No matching known item found in the current plan/QA documents searched. The fixture retains earlier synthetic profile names; the ambiguity concerns the rendered names/presets and IDs, independent of AI responses (no provider was used).

### LIE-QA-003 — P3 usability improvement: returning from preview resets editing position

**Impact:** Repeatedly testing character or ending changes adds navigation overhead. Draft content is preserved, so this is not data loss or a release blocker; retaining the current step/selected character is an improvement to review rather than an asserted approved requirement.

**URL/viewport:** `/editor?demo=1` → `/editor/preview?demo=1` → `/editor?demo=1`, desktop1280×741 and narrow391×1000.

**Reproduction:** 2/2 returns from previews launched from 真相结局 returned to 故事设定. Start a valid case at step3, press 试玩, then either return from intro or end/play through a result and press 返回编辑器. Expected convenient behavior: resume the previous editing step/character. Actual: first step, first character selected. [Return screenshot](08-preview-return-step.jpg). [Editor.vue](../../../apps/web/src/editor/Editor.vue) initializes `step=0` and selectedId from the first saved character on remount; the serialized draft contains content only. Not listed as an existing bug in the searched current documents.

## Actual coverage matrix

“Observed” means executed in this run with fake voice unless stated otherwise. It does not imply live-provider or hardware acceptance.

| Area | Actual operations and observations | Limits/evidence |
| --- | --- | --- |
| New-user home / official cases | Opened all three intros. Names/counts3/4/4; limits8/10/9 minutes. Entered each game; four-person case selection reached 周乐 and 阿湛/陶老师. | Not an AI solution/blind test. |
| Correct / wrong / end / restart | First official case wrong沈禾 ends without culprit/reveal; correct顾遥 reveals full text; restart returns to fresh intro. Active second/third-case end confirms and stops; canceled end retains session. | [Correct result](01-correct-result-desktop.jpg). Proposed result redesign excluded. |
| Voice and history state | Start/stop fake conversation; switch away/back retains only that person's messages with interrupted marker. Three rapid start/stop cycles followed by rapid character switches left untouched characters empty. | No real microphone/audio/provider. |
| Accusation and browser Back | Accusation ends fake conversation. Browser Back during interrogation shows leave confirmation; Continue restores the game URL and content. Escape closes background dialog; continued play works. | True beforeunload navigation in iframe reported ERR_ABORTED; used normal in-app end rather than bypassing it. |
| Actual timer expiry | Set editor custom duration0.05 minutes through the normal input, producing three real seconds. Started fake voice and let original timer expire. 00:00, voice disabled, notice and accusation dialog shown; no automatic win/loss. | [Expiry](03-budget-expired.jpg). No clock/rule monkeypatch. Does not prove an eight-minute live session. |
| Long transcript | Original fake conversation accumulated11 articles. Log clientHeight335, scrollHeight989 then1016 after stop, scrollTop653.5 then681. No inputs/textarea/contenteditable in the transcript. | [Transcript](10-long-transcript.jpg). Internal auto-scroll observed; hardware scroll/very-long sessions not tested. |
| Editor navigation / validation | All3 steps freely navigable; empty required fields locate input; zero duration rejected; preset selector offers8 options. Added three characters, removed designated answer via confirmation, subsequent validation requires new answer. Two-character variable-count preview works. | Counts below official case counts are engine flexibility, not reported as a defect. |
| Editor preview / local drafts | Fake preview preserves names/background/answers; return restores persisted content; original draft state safely restored at cleanup. | Position reset recorded separately as QA-003. Refresh during active preview not claimed as resumable game state. |
| Share / reload / invalid | Generated792-character compressed URL from UI; opened in new own tab2, full background/Unicode/newlines visible; actual reload retains intro. Malformed `#game=invalid` shows friendly retry/home. | No new16k boundary sweep; prior tests not relabeled as this run. No clipboard overwrite. |
| Overlarge content | Filled45000 Chinese characters (~135k UTF-8 before JSON) in own background; 分享案件 reports “案件内容过大，请缩短文本”. Replaced with short text, sharing recovered normally. | A bounded UI case, not arbitrary fuzz. |
| Desktop / narrow layout | Official four-person narrow game, editor/intro with long repeated background and a40-character unbroken English title. Editor and intro client/scroll widths391/391; no horizontal page overflow observed. | [Narrow game](02-narrow-game.jpg), [editor](04-editor-long-title.jpg), [intro](05-intro-long-title.jpg). Native desktop stage crop is existing known issue, not a new report. Narrow character rail's partial first item was normal scrollTop32/scrollable200 in clientHeight168, not treated as clipping defect. |
| Motion / failed assets | Tab-scoped reduced-motion emulation hid canvas. Blocking coral animation package on fresh load hid canvas with readable static portrait. Clearing block and switching away/back restored canvas. | [Fallback](06-blocked-fallback.jpg). Initial same-preset switch reused existing package and did not cause a fetch; this was not counted as failure injection. All overrides cleared. |
| Contribution | Opened local instructions/JSON panel, exported only synthetic fixture. | Did not follow GitHub link, create fork/PR or change visibility. |

## Unmeasured and diagnostic boundaries

- No real AI correctness, character immersion, microphone permission/recording, device playback, paid connections, long live-session timing, multi-user isolation, quota control, auth or invitation behavior. Auth is explicitly paused and not filed as missing functionality.
- No hardware mobile/touch, external clipboard/share-channel round trip, cross-browser compatibility, real document visibility suspension, exhaustive animation-phase pixel checks or resource-specific delayed-success race. Current animation revision and result-design candidates were not loaded.
- Failed-resource checks use explicit tab-scoped browser network blocks, so they demonstrate the app response to a deterministic failure, not a naturally observed production outage. Browser Back, normal user controls and original timer were tested without source mutation.
- The direct/iframe tab error log contained two source-URL-less `MutationObserver.observe` TypeErrors at00:55:46Z and00:59:38Z, also noted in earlier iframe QA. Origin is unproven; not assigned to production code or silently called clean. No new actionable visual defect was established beyond the known desktop crop and separately owned animation issues.
- No arbitrary security probing, secrets, provider setup or broad fuzzing occurred. Only supplied local synthetic cases were edited.

## Cleanup / handoff

- Restored `lie-editor-draft` to original absent state using the harness's exact equality check, removed its own session backup; no other storage touched.
- Cleared reduced-motion and network block/cache overrides; closed own tabs1/2. No browser viewport override set. No user tabs touched.
- Copied required native evidence and synthetic fixture here; preserved [harness.html](harness.html) as reproducible test tooling and removed the exact temporary `apps/web/public/stable-qa-harness.html` from the running app directory.
- Original service session26270 received Ctrl-C and exited130. Subsequent `lsof` showed no5544 listener; exact PID14248 absent in final approved process check. No replacement service or background gateway retained.8787/8788,5355,5507,5402 untouched.
- Scope only `docs/qa/stable-exploration-2026-10-25/**`; no implementation/integration/push/deployment/PR. Root receives ordered commit and clean worktree after reviewable evidence checks. Fix proposals above are not implemented or approved by this report.
