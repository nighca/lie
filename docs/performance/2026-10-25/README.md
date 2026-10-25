# Production asset audit

Status: measured baseline preserved; implementation and bounded local acceptance complete in [implementation.md](implementation.md), not deployed. Cross-deployment retention is an explicit [release limitation](deployment-consistency.md). Owner `root/production_performance`; root chat `01a17012-fa00-7170-ac0a-21c1900d71cd` remains integrator.

## Identity and method

Read-only target https://lie-game.nighca.workers.dev/; response dates 2026-10-25 01:37:32–55 UTC. Coordinator's last published SHA is `abb12dbf7a40689be593c2a1e580f23cfcc5611e`; independently observed assets are `/assets/index-B01MnLa4.js` and `/assets/index-r2kXdcrw.css`. Source audit base `d2a4eff8c54bb5e5ded80798a0c0ba204c4f4e78`, managed `production-performance/lie`, branch `codex/production-performance`. This newer source already bundles official cases; do not interpret that as measured production behavior.

Codex IAB browser 3/self-created tab1, CDP Network.responseReceived/loadingFinished. Cold sample disables browser cache; warm reload restores it. Existing connection reused; HTTP/2, Cloudflare LAX. No network/CPU throttle or viewport override. This is a single laboratory sample, not real-user population data. No mic/provider/paid/control-plane/deployment calls or user-tab actions. No local service. Only selected public response headers retained; no cookies/request headers, report endpoints, IPs or private data retained.

## Cold network waterfall

All 15 responses: status200, `Cache-Control: public, max-age=0, must-revalidate`, `CF-Cache-Status: HIT`. JS/CSS/JSON/SVG zstd-encoded; PNG not encoded.

| Path | Start ms | Header wait ms | Finish ms | Encoded transfer bytes |
| --- | ---: | ---: | ---: | ---: |
| / | 0 | 258 | 260 | 648 |
| /assets/index-r2kXdcrw.css | 299 | 429 | 729 | 11519 |
| /assets/index-B01MnLa4.js | 299 | 311 | 729 | 68906 |
| /appearances/manifest.json | 746 | 252 | 998 | 1204 |
| /brand/logo.svg | 746 | 253 | 999 | 842 |
| /games/index.json | 1001 | 600 | 1603 | 1027 |
| /appearances/blue-glasses/avatar.png | 1006 | 226 | 1601 | 865820 |
| /brand/underline.svg | 1006 | 431 | 1437 | 563 |
| /appearances/sunny-moustache/avatar.png | 1005 | 597 | 1917 | 964736 |
| /appearances/coral-bob/avatar.png | 1006 | 915 | 2322 | 874793 |
| /appearances/salt-pepper-beard/default.png | 1608 | 714 | 2669 | 969074 |
| /appearances/silver-bun/default.png | 1609 | 1079 | 3030 | 991499 |
| /appearances/plum-crop/default.png | 1624 | 1407 | 3436 | 939969 |
| /appearances/mint-puffs/default.png | 2670 | 767 | 4115 | 926134 |
| /appearances/ochre-freckles/default.png | 2670 | 1444 | 4316 | 947120 |

Times relative to document CDP requestTime. Header wait means receiveHeadersEnd, not whole request duration. Transfer is loadingFinished.encodedDataLength including overhead, not source file size. Eight PNG Content-Length values total **7,468,258 bytes** (864556,963360,873526,967539,990099,938610,924784,945784); max990099.

Warm reload explicit304s: CSS290 bytes/205ms, JS287/234, sunny avatar309/224, coral276/225, blue278/226. Other five PNGs exposed effective200 plus original Content-Length but only277–407 transfer bytes: cache/revalidation-combined responses, not full downloads. Underline transferred0 with stale timing and is excluded from timing comparison. Document636 bytes, manifest418, logo293, catalog278; last image finish1226ms. Long-lived content URLs can avoid conditional network round trips; no exact LCP saving is established.

## Trace limits

A separate warm reload used CDP Tracing.start categories `devtools.timeline,loading,blink.user_timing`, ReportEvents, then Tracing.end. Complete4 event batches/520 data events, no truncation. Trace ended before content presentation; no usable LCP/CLS/INP. NavigationStart266242234186us, MarkDOMContent266243050195, MarkLoad266243051067. Performance entries later reported responseStart218.2ms, DOMContentLoaded end816ms, load816.9ms, FCP1104ms. Separate sample, not cold waterfall. No CWV rating/Lighthouse score claimed. Earlier trace stopped without a retained start cursor is not evidence.

## Source findings and proposal

- Vite JS/CSS already hash filenames; browser defaults still revalidate. Public brand and appearance assets keep stable URLs.
- Generator copies canonical PNG/package bytes; package requires relative `parts/*.png`. Hash entire package+parts directory, preserve bytes and relative paths.
- Existing reader accepts exact `/appearances/<id>/animation/package.json`. Mutating fixed manifest would break old deployed JS. Preserve fixed manifest/assets; emit separate hashed manifest and use build virtual module for new loader. DEV keeps fixed URL.
- Build-only plugin computes asset content URLs and transforms source URLs **before** Vite calculates bundle hashes. HTML favicon transformed during HTML handling. Do not rewrite already-hashed JS/CSS afterward.
- Long-cache rules cover existing hash outputs only; HTML/fixed manifest/API/WS/errors remain outside. Missing hashed URLs must not become immutable HTML200 through SPA fallback. Historical deployment asset retention remains a limitation to verify, not an assumed guarantee.
- Production catalog async chain is visible above; newer local eager-case work already removes it. Do not reimplement or claim measured deployed improvement.

## Official references

[Cloudflare headers](https://developers.cloudflare.com/workers/static-assets/headers/): default revalidation/ETag and `_headers`; Worker-generated responses need their own policy. [Static binding](https://developers.cloudflare.com/workers/static-assets/binding/), [HTML routing](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/), [Vite assets](https://vite.dev/guide/assets.html), [cf builds](https://developers.cloudflare.com/cf/projects/).

## Lifecycle

No server/port/PID/PTY created. Self-created IAB tab1 temporary; cache override restored false, tracing ended; no viewport/throttle changed. Tab was subsequently closed after the implementation acceptance; see lifecycle in implementation.md. No publication permission.
