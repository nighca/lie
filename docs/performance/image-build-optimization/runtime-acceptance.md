# WebP animation runtime acceptance

Date: 2026-10-25. Implementation base: `365269b6185be586b69c0fac2b7ba15defeb7a6f`.
Owner: image experiment runtime subagent. Review/integration: image experiment parent, then root sole main integrator.

The runtime accepts package-local `parts/<lowercase-hyphenated-name>.png` and `.webp` paths. It keeps schema v1/v2, optional result states, the 32-asset/32 Mi-pixel budgets, three-worker pool, abort propagation, object URL revocation, decoded natural-dimension check and caller fallback behavior. No renderer, source artwork, manifest generation format, static fallback or deployment changes are included.

The source generator explicitly retains its PNG-only canonical path policy. A regression case creates PNG bytes named `body.webp` and verifies rejection before existing generated output changes. Derived WebP package parts remain the build pipeline's responsibility.

## Encoded boundary checks

PNG retains its existing signature/IHDR and encoded-dimension check. WebP requires exact RIFF length against the received buffer (actual Blob bytes), WEBP magic, bounded chunks including padding, and VP8/VP8L/VP8X first chunk. It reads VP8 key-frame dimensions/signature, VP8L dimensions/version, and VP8X canvas dimensions/reserved flags, rejects animation, missing/duplicate image payloads and canvas/bitstream disagreement, then compares dimensions against the package contract before constructing Image or calling decode. Browser decoding remains responsible for complete compressed-bitstream validity; this parser is not an image decoder or PNG CRC validator. MIME and extension do not substitute for sniffing.

The header walker uses one temporary ArrayBuffer per currently loading Blob, with the existing maximum of three workers. Unlike the former PNG-only 24-byte slice, this scans the complete encoded buffer to check every WebP chunk bound. The buffer is not retained after header validation.

Primary format references consulted: [Google WebP container specification](https://developers.google.com/speed/webp/docs/riff_container), [Google WebP lossless bitstream specification](https://developers.google.com/speed/webp/docs/webp_lossless_bitstream_specification).

## Verification

Bundled native Node `v24.22.1`, locked workspace dependencies installed with `npm ci --ignore-scripts --no-audit --no-fund` (no lock change).

- `npm run test --workspace @lie/character-animation`: 80 passed, 3 files.
- `npm run typecheck --workspace @lie/character-animation`: passed.
- `npm run test:character-presets`: 24 passed.
- `git diff --check`: passed.
- Three committed 2x2 native libwebp fixtures: transparent q90 VP8X, transparent exact lossless VP8L, opaque q90 VP8. Encoded locally with cwebp 1.6.0/libsharpyuv 0.4.2 from a deterministic generated RGBA PNG; no third-party assets or services.
- The actual 50 `.webp` q90 candidates in `/tmp/lie-image-q90` all passed the new parser; this is supplementary local evidence and is not required for tests.
- Tests cover mixed PNG/WebP loading, MIME independence, encoded/decoded dimension disagreement, unsafe paths, all three header forms, RIFF/chunk length and truncation, padding, animation, unsupported lossless versions, malformed signatures, duplicate payloads, decode errors, cancellation and existing concurrency/cleanup regressions.

`npm run character-presets:check` reports missing/stale generated public resources in this fresh worktree: ignored derived output has not been generated here. No attempt was made to regenerate another owner's output. The generator unit suite uses isolated complete fixtures and passed. Parent owns full build/generation and actual browser/canvas acceptance. Mock Image tests and header checks do not prove real browser decoding, canvas rendering or LCP improvements.

No service, listener, browser tab, environment or provider configuration was created or changed. Temporary PNG fixture sources remain under `/tmp/lie-webp-runtime-fixtures`; all needed encoded fixtures and reproducible header-test constructors are committed in the repository. No source PNG artwork was changed. No push, deployment or main integration performed.
