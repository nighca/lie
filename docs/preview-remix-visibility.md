# Editor preview result actions

Date: 2026-10-25. Status: implemented route half, awaiting parent composition and review.

The user requested that both successful and unsuccessful editor previews omit “我要改编”, while official and shared case results retain it. A preview returns to the same editor instead of producing a new case draft.

## Implementation and boundary

- `Application.vue` passes `allowRemix=false` only for `/editor/preview`. The reusable App receives a boolean and does not interpret routes or button labels.
- The preview remix event handler returns before reading the remix source, creating a draft, opening a replacement dialog or touching browser storage. This also prevents a programmatic component event from bypassing the hidden button.
- Existing KeepAlive editor restoration, navigation confirmation, draft read/write failure protections, draft-change reconfirmation and controller lifecycle are unchanged.
- Parent owns the complementary `App.vue` contract: optional `allowRemix` defaults to true and gates the common solved/lost remix button. This child commit intentionally does not change App.

## Validation

Base: `48316544ea9fd22afbf1eee8db6f81e326026821`.

Ran the actual `editor-navigation.test.ts` against an isolated, temporary implementation of exactly the agreed App prop and button gate: **24 tests passed**, and web `vue-tsc --noEmit` passed. The temporary App content SHA-256 was `a366a46fc2632f82d4afba7889d284dd5c37086cbe191ec6c34f928cd53c25c8`. Only the two agreed App substitutions were present; verified their exact content and restored the original bytes before commit. These results establish the agreed combined contract, not a standalone passing child with the old App. Parent must validate its final App composition.

The six source/outcome cases are covered: official and shared × correct/incorrect still open independent remix drafts; preview × correct/incorrect exposes only restart/return-editor actions, ignores a programmatic remix event, preserves stored bytes, and restores the same in-memory title, selected character, profile and editor step. Existing cancellation, external draft changes and storage failure tests remain.

Dependencies were installed offline with Node 24.22.1/npm 11, without install scripts or new packages. No dev service, browser, microphone, provider, keys or user browser draft was used. Browser acceptance and full batch regression belong to parent composition. No screenshots or disposable logs are necessary for this route-only child change.

## Handoff

Owner: `/root/preview_remix_visibility`; parent owns review/integration. Worktree: `/Users/nighca/.codex/worktrees/preview-remix-visibility/lie`; branch: `codex/preview-remix-visibility`. Files: `apps/web/src/Application.vue`, `apps/web/test/editor-navigation.test.ts`, this document. No other production scope, no main updates, push, PR or deploy. Preserve the source commit during review.
