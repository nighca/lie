# @lie/ui

Shared Vue components for the approved Chinese B direction: sunny yellow, cobalt blue, navy outlines and simple rounded shapes. Visual values follow `design/ui/tokens.json`; screen composition follows `design/ui/spec.md`. This package contains no game rules, provider calls or microphone access.

```ts
import { CharacterChoice, Transcript, UiButton, UiDialog, UiNotice, VoiceControl } from '@lie/ui'
import '@lie/ui/style.css'
```

- `UiButton`: `variant` (`primary`, `secondary`, `quiet`), `disabled`, `busy`, default label slot. Native button attributes and click listeners pass through. Busy preserves the label and disables activation.
- `CharacterChoice`: `name`, optional `description`, `selected`, `disabled`, optional `avatar` slot. A native toggle button with `aria-pressed`; the caller owns selection and list layout. Without artwork it displays the name's first character.
- `Transcript`: readonly `messages` (`id`, `speaker`, `text`, optional `mine`), optional `emptyText`. Always-visible speaker-labelled log with polite updates. New messages, streaming text growth and replacement histories follow the bottom of the log without scrolling the page. It does not accept input. System feedback belongs in `UiNotice`, not in character speech.
- `VoiceControl`: `status` (`idle`, `recording`, `waiting`, `speaking`, `error`), `label`, optional `actionLabel`, `cancelLabel`, `interruptLabel`, `disabled`. Non-null action labels expose buttons emitting `start`, `cancel`, `interrupt`. The caller owns their actual meaning, including finishing a recording. The `details` slot places the time budget at the left, and `answer` supplies a secondary accusation action. Real linear RMS `inputLevel`/`outputLevel` and local `inputActive` drive one 24-column level history, prioritizing input. The caller provides `--character-accent`; output mixes this with 40% dark ink. Inactive conversations hide feedback; connecting, waiting and errors retain concise status. Reduced motion uses a native level meter. It never generates fake waveform activity.
- `ProductHeader`: shared brand, optional `title` prop or `title` slot, `actions`/`notice` slots and `navigateHome` event. Brand text uses a system font and the approved `/brand/underline.svg`.
- `UiDialog`: controlled `open`, `title`, default body and optional `actions` slots, `close` event. Uses the browser's native modal focus containment and restoration. Escape and the visible close button request closure; the caller updates `open`. Requires a modern browser supporting `dialog.showModal()`.
- `UiNotice`: `tone` (`info`, `error`) and a default body slot. A separate labelled status region for feedback.

## Preview and checks

From the repository root after installing workspace dependencies:

```sh
npm run dev --workspace @lie/ui -- --port 5175
npm run typecheck --workspace @lie/ui
npm run test --workspace @lie/ui
npm run build --workspace @lie/ui
```

The preview is a component gallery with fake Chinese content, long names and two/three-person layouts. It is not the production game. `build` checks the source package; the consuming application's Vite build compiles exported Vue files. Browser verification should use the Codex built-in browser, including keyboard focus, Escape, 200% zoom and long-text wrapping.
