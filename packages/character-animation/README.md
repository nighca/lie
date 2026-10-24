# @lie/character-animation

Independent, bounded Canvas 2D animation player. It does not depend on Vue, game content, voice providers or a particular character.

- `readAnimationPackage(unknown)` validates schema version 1 and all internal references.
- `sampleClip(package, clip, seconds)` is deterministic and host independent.
- `AnimationTimeline(package, initialState)` plays named states, explicit one-shot transitions and interrupted default settling.
- `createCanvasRenderer(canvas, package, images)` draws decoded shared parts with hierarchy, independent order, crop and polygon masks.
- `loadAnimationPackage(url, signal)` fetches/decodes local package-relative parts and validates dimensions. The caller owns cancellation and decoded resource lifetime.

The Vue `AnimatedPortrait` wrapper lives in `@lie/ui`. Static fallback belongs to its slot and the character preset manifest. See [contract](../../docs/animation/contract.md) and [production workflow](../../docs/animation/production-workflow.md).

```ts
const { data, images } = await loadAnimationPackage(packageUrl, abort.signal)
const timeline = new AnimationTimeline(data, 'default')
const renderer = createCanvasRenderer(canvas, data, images)
timeline.setState('listening')
renderer.render(timeline.advance(deltaSeconds))
// On disposal: stop the host clock, abort loading, renderer.dispose(), images.clear().
```

`rotation` uses degrees and tracks use seconds. A 240ms numeric settle is only the fallback when no explicit transition clip exists. Visibility/part changes are discrete. Natural arm lifts require authored trajectories and suitable parts; there is no automatic bitmap morph, IK, mesh skinning, arbitrary script evaluation or audio/phoneme engine.

Raster limits: at most 32 assets and 33,554,432 total pixels across canvas + assets, nominally 128 MiB of RGBA storage (excluding encoded bytes, browser/GPU copies and other overhead). PNG IHDR dimensions must match declarations before decode. The loader allows three simultaneous part fetch/decode operations; abort or failure clears image sources, revokes decode URLs promptly, and cancels sibling work without waiting for an unsettled decode. Late decode resolutions/rejections cannot publish results.
