# Browser game editor

The user authorized parallel implementation on 2026-10-24. Editing, trial play and link sharing use the current game contract and provider gateway; no account, database, asset upload, publication history or work-version management is introduced.

## Module contract

- `src/editor/Editor.vue`: receives `appearances: readonly Appearance[]`; emits `preview(GameDefinition)` and `leave()`. It does not instantiate controllers or implement game rules.
- `draft.ts`: editable form and one current-browser draft under `lie-editor-draft`. Incomplete drafts are valid storage; playable content is checked with the existing `validateGame`. Deleting the answer character clears the answer selection and requires an explicit replacement.
- `share.ts`: `encodeGameLink(game, baseUrl)` returns an absolute `/play#game=...` link; `decodeSharedGame(fragment, appearances)` restores a normalized `GameDefinition`. The body is UTF-8 JSON → gzip → Base64URL. Game data stays entirely in the fragment. Unknown extra fields are removed by the core validator; only installed appearance IDs or null are accepted at play boundaries. Text is rendered with Vue text bindings, never HTML.
- The root application owns `/editor` and `/play`, preview lifecycle and controller loading. It must pass the snapshot through the current controller and keep shared/preview cases out of the official catalog. Returning from a trial restores the editor's local draft. Existing active-investigation leave confirmation applies to trial/shared sessions too.

## Limits and browser acceptance

The provisional full-link budget is 16,000 ASCII characters, including origin and path. Encoding rejects links above it; the editor offers the generated full URL for automatic or manual copying. This value is an initial product budget, **not** an established cross-browser safety guarantee. The independent resource limit is 128 KiB of decompressed UTF-8 JSON; streaming decompression stops above that bound, even when compressed input is tiny.

This implementation relies on native CompressionStream/DecompressionStream. Feature absence produces a visible error rather than silently changing formats. Chrome/Edge/Firefox/Safari acceptance must cover a common compressed story, the complete 16,000-character boundary link, link opening, address-bar paste, refresh and exact decoding before finalizing the product limit. No main-browser matrix is claimed from Node or jsdom tests. Receiving-page integration must validate the complete URL length too, since the decoder only receives its fragment.

## Verification

Automated checks cover Chinese/emoji round trips, keeping the URL query empty, stripping unsupported fields, invalid/truncated encoding and gzip, invalid core data, missing preset IDs, gzip expansion bound, exact full-link boundary, incomplete-draft persistence, malformed local drafts, invalid duration, answer removal and validated immutable preview snapshots. Component tests cover autosave/restore, deletion of the selected answer and damaged storage preservation until editing starts.

A temporary, ignored developer fixture mounts the real editor with the actual eight-preset manifest; it does not replace the application's controller. In-app Chromium verification generated a real 602-character Chinese-story link and restored the draft on reload, with no console errors or warnings. Desktop and actual 391 CSS-pixel layouts were inspected; the narrow page had document scroll width 391 and no horizontal overflow. This proves the editor UI and native encoder work in that browser, not shared-game route integration, all-browser URL limits, or real paid voice service acceptance.

## Explicitly outside this change

- OAuth, automatic fork/branch/commit or GitHub PR submission. The user's official-case contribution idea is being evaluated separately.
- New voice authorization or quota logic. Author and recipient use the agreed existing gateway.
- Importing arbitrary asset URLs, attachment uploads, accounts, cloud drafts, and a public story directory.
