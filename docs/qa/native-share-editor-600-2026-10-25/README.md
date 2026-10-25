# Stable main: native share/editor QA preconditions

2026-10-25. **Native acceptance not executed: this owner session exposes no IAB.** This is a bounded precondition result, not a browser PASS or evidence that no product defects exist.

Frozen source `600fb4dd5d60e7370cb1f6315c9c8628b7df0c99`; branch `codex/native-share-editor-qa-600`; owned worktree `/Users/nighca/.codex/worktrees/character-preset-migration-dawn/lie`. Production files unchanged. [Sanitized actual observations](observations.json).

Actual local `GET http://127.0.0.1:8787/__lie/main-status` succeeded, returning `{"branch":"main","sha":"600fb4dd5d60e7370cb1f6315c9c8628b7df0c99"}`. This proves the status endpoint responds at the intended SHA; there is no ready field, and no application mount/resource readiness was observed. Initial sandbox requests failed through the configured proxy and then direct loopback; an authorized outside-sandbox, no-proxy local request succeeded. Those initial failures are not runner-down evidence. No runner diagnosis/restart or new server was attempted.

One actual CUA inventory this round exposed only Chrome `type=extension`, no `type=iab`. It also reported that the Mac is locked and automatic unlock failed. Neither Chrome nor another session's IAB ID was selected. Per the explicit task boundary, native branches stopped; no unlock request, repeated permission attempt, Chrome fallback or repeated inventory followed. User tab details from inventory are omitted from the archived evidence.

Unexecuted native cases:

| Case | Intended check | Status |
| --- | --- | --- |
| N1 | Same-origin generated share with Chinese, emoji and line breaks opens correctly | Not run |
| N2 | Native reload preserves URL fragment and decoded text | Not run |
| N3 | Native Back/Forward among valid, damaged and corrected links | Not run |
| N4 | Editor → preview → native Back/Forward preserves intended cached in-memory state | Not run |
| N5 | Clear-draft native dialog cancellation preserves bytes and restores focus/top-layer state | Not run |
| N6 | Clear-draft confirmation, followed by cleanup, preserves/restores pre-QA original bytes | Not run |
| N7 | Long-content/narrow-page reachability without altering user global viewport | Not run |

No draft access was necessary after the browser gate failed. `lie-editor-draft` was neither read nor written; no synthetic draft or backup was created, so there was nothing to restore. No other storage key was accessed. No self-created tab/iframe, viewport/media override or service existed to clean up (PID/PTY: none). User 8787/8788, animation5355/PID37202/PTY40865/tab60 and all user tabs were untouched.

No old eight jsdom probes, repaired RSM cases or prior preview-result matrices were rerun. No provider/mic/API/WS, account, public sharing, submission, dependency install, application suite or build. No new confirmed finding; the native matrix remains unverified. Resumption requires an IAB actually exposed to the owner session and a fresh status check, followed by exact original-DRAFT_KEY backup/restoration before any storage-writing case. No main/push/deployment action.
