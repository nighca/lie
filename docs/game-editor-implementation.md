# Browser game editor

The user authorized parallel implementation on 2026-10-24. Editing, trial play and link sharing use the current game contract and provider gateway; no account, database, asset upload, publication history or work-version management is introduced.

## Module contract

- `src/editor/Editor.vue`: receives `appearances: readonly Appearance[]`; emits `preview(GameDefinition)` and `leave()`. It does not instantiate controllers or implement game rules.
- `draft.ts`: editable form and one current-browser draft under `lie-editor-draft`. Incomplete drafts are valid storage; playable content is checked with the existing `validateGame`. Deleting the answer character clears the answer selection and requires an explicit replacement.
- `share.ts`: `encodeGameLink(game, baseUrl)` returns an absolute `/play#game=...` link; `decodeSharedGame(fragment, appearances)` restores a normalized `GameDefinition`. The body is UTF-8 JSON → gzip → Base64URL. Game data stays entirely in the fragment. Unknown extra fields are removed by the core validator; only installed appearance IDs or null are accepted at play boundaries. Text is rendered with Vue text bindings, never HTML.
- The application now owns `/editor`, ephemeral `/editor/preview` and `/play`. Preview emits a normalized game snapshot; `createController(snapshot)` supplies that snapshot to the existing controller reader instead of fetching any official case JSON. Shared/preview cases stay out of the official catalog. Returning from a trial restores the local draft. Active-investigation leave confirmation applies to trial/shared sessions as well as official games. Refreshing a preview URL returns to the editor; it does not save session progress. Shared URLs re-decode into a fresh intro on reload. Navigation, pagehide and unmount invalidate outstanding decoders using one revision counter; a late decoder cannot attach a stale session.

## Limits and browser acceptance

The provisional full-link budget is 16,000 ASCII characters, including origin and path. Encoding rejects links above it; the editor offers the generated full URL for automatic or manual copying. This value is an initial product budget, **not** an established cross-browser safety guarantee. The independent resource limit is 128 KiB of decompressed UTF-8 JSON; streaming decompression stops above that bound, even when compressed input is tiny.

This implementation relies on native CompressionStream/DecompressionStream. Feature absence produces a visible error rather than silently changing formats. Chrome/Edge/Firefox/Safari acceptance must cover a common compressed story, the complete 16,000-character boundary link, link opening, address-bar paste, refresh and exact decoding before finalizing the product limit. No main-browser matrix is claimed from Node or jsdom tests. The `/play` route validates the complete absolute URL length before decoding, including the origin, query and fragment; the decoder independently bounds its input fragment.

## Verification

Automated checks cover Chinese/emoji round trips, keeping the URL query empty, stripping unsupported fields, invalid/truncated encoding and gzip, invalid core data, missing preset IDs, gzip expansion bound, exact full-link boundary, incomplete-draft persistence, malformed local drafts, invalid duration, answer removal and validated immutable preview snapshots. Component tests cover autosave/restore, deletion of the selected answer and damaged storage preservation until editing starts.

A temporary, ignored developer fixture mounts the real editor with the actual eight-preset manifest; it does not replace the application's controller. In-app Chromium verification generated a real 602-character Chinese-story link and restored the draft on reload, with no console errors or warnings. Desktop and actual 391 CSS-pixel layouts were inspected; the narrow page had document scroll width 391 and no horizontal overflow. This proves the editor UI and native encoder work in that browser, not all-browser URL limits or real paid voice service acceptance. Route integration adds eight automated tests for real compressed shared content, preview snapshots, fail/restart/success, catalog isolation, confirmed departures and stale voice events, full-URL limits, refreshed preview fallback, pagehide, and controlled delayed decoder completion after navigation or unmount. The subagent could not repeat IAB route acceptance because its current browser inventory exposes only Chrome; root browser verification remains required. No external Chrome fallback or paid voice call was used.

## Explicitly outside this change

- OAuth, automatic fork/branch/commit or GitHub PR submission. The approved manual contribution helper prepares JSON and opens GitHub for the author's explicit confirmation.
- New voice authorization or quota logic. Author and recipient use the agreed existing gateway.
- Importing arbitrary asset URLs, attachment uploads, accounts, cloud drafts, and a public story directory.

## Approved v2 production editor (2026-10-24)

The user approved the three-step prototype through `041c74a`: story setup, focused character editing and the ending. Steps remain freely navigable without required-field gates. Public story and successful ending previews render plain text. Character cards reserve the same image and label dimensions whether selected or not; desktop navigation scrolls vertically and narrow navigation horizontally.

Each character has one profile text; the complete second-person example matches the engine's existing role prompt and never overwrites author text. New characters default to the first catalog preset. Existing null or unavailable IDs are restored unchanged with all text intact; authoring validation requires a valid preset before trial, sharing or contribution. This rule lives in `draftIssues`/`draftGame`, not the core schema or shared-game decoder. Field issues retain their step/person target and focus the relevant editor control. Incomplete drafts remain saveable under the same `lie-editor-draft` key.

Answer checkboxes inside character editing still control a single `ending.culpritId`: choosing another person replaces the answer, unchecking leaves an incomplete draft, deletion clears it. Ending shows a read-only answer summary. Removing the selected person first requires local confirmation and selects the nearest remaining person. A fresh draft has no preselected answer. Free step changes are not game departure events; the existing preview route continues to own investigation departure confirmation and voice cleanup.

The final step offers **share** as primary, **trial** as secondary and **contribute** as a weaker separate action. Earlier steps offer quiet trial/share shortcuts. Sharing uses the unchanged native gzip encoder and limits. Contribution validates the same complete draft, displays the exact normalized JSON, offers copy/download, and opens a short GitHub new-file URL with `filename` only. It does not place JSON in the query, request OAuth, send credentials, fork, commit or create PRs. Current private-repository restrictions are stated in the dialog, along with user-controlled new-branch/PR steps and maintenance review/catalog work before inclusion. A successful copy or opened GitHub page is never represented as a submitted case.

Additional automated coverage includes free navigation and local restore, adding/focusing/removing characters, answer replacement/cancel/deletion, invalid restored preset preservation and repair, cross-step issue focus and updates, full example preservation, immutable preview snapshots, final action hierarchy, share generation, dynamic catalog names and safe short contribution filenames. Existing route tests exercise actual gzip and fake-voice lifecycle separately. The implementation owner's available browser inventory exposes only Chrome; no external Chrome fallback or paid service was used. Independent IAB review of this production version remains required and is not inferred from the earlier prototype acceptance.

### Production v2 independent IAB acceptance

The visual owner independently operated the real editor on port 5365; this is separate from the implementation owner's Node/jsdom checks and the earlier prototype. The first connection failed because the dev process could not write its sandboxed Vite temporary configuration; restarting the authorized isolated dev server fixed the environment. No product fix was inferred from that startup failure.

Confirmed in real IAB:

- Created a complete five-person fictional case through form controls; freely moved 1→3→2, opened the full example, replaced answer A with B, cancelled the answer, and restored A. Ending showed the chosen answer read-only with zero answer checkboxes.
- Five character cards retained 108×136 dimensions and 104×88 images across selection. Their offsetTop values stayed `[243,391,539,687,835]`; initial viewport-relative position differences came from page/rail scroll, not changing card layout.
- Final actions visually matched the intended hierarchy: blue share, cream trial, transparent contribution.
- The actual generated share URL was 1,008 characters. Decoding its actual textarea content with gzip produced five people, 600 seconds and answer A. Opening `/play` in a new tab showed the correct case intro; no voice was started. Its lack of demo query was observed, not treated as a failure or authorization to open a paid connection.
- Contribution JSON matched the decoded shared JSON exactly. The dialog stated the private-repository restriction and manual branch/PR process. The GitHub href contained only `filename`, with no story JSON query. The reviewer did not open GitHub or click copy/download; these are not claimed as browser-tested submission actions.
- Actual desktop CSS viewports were 1280×800 and 1280×720, document scrollWidth 1280, all images loaded, no captured console warning/error in either tab.

The attempted narrow viewport setting did not take effect: actual DOM width remained 1280 after capability refresh and a new tab. **Production 391px browser acceptance remains pending root verification.** Misnamed preliminary images were renamed `*-viewport-unapplied.jpg`; they are not narrow-screen evidence. Reviewer reset viewport and closed the usable owned tabs, leaving only the isolated 5365 fictional draft; production 8787, microphone, provider and external Chrome were untouched.

Local original evidence: `/private/tmp/lie-editor-v2-production-{example-desktop,characters-desktop,ending-desktop,share-desktop,play-desktop,submission-desktop}.jpg`. The implementation owner inspected the actual character and ending screenshots. Root repository typecheck, 267 automated tests and full build passed; after adding accessible invalid-field styling, the affected 37 tests, web typecheck and web build passed again.
