import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { AnimationTimeline, createCanvasRenderer, readAnimationPackage, sampleClip } from '../src/index'

const source = JSON.parse(readFileSync(new URL('../../../design/character-presets/assets/coral-bob/animation/package.json', import.meta.url), 'utf8'))
function fixture() { return structuredClone(source) }

describe('versioned animation contract', () => {
  it('loads the shared Coral rig with all four application states', () => {
    const data = readAnimationPackage(fixture())
    expect(Object.keys(data.assets)).toHaveLength(11)
    expect(Object.keys(data.states)).toEqual(['default', 'listening', 'waiting', 'speaking'])
    expect(data.nodes.filter(node => node.sprite?.asset === 'listening-arm')).toHaveLength(2)
  })
  it('caps resource count even when each image is tiny', () => {
    const raw = fixture()
    raw.assets = Object.fromEntries(Array.from({ length: 33 }, (_, i) => [`part-${i}`, { src: `parts/part-${i}.png`, width: 1, height: 1 }]))
    expect(() => readAnimationPackage(raw)).toThrow('asset count')
  })
  it('caps total canvas and shared-image pixels before playback', () => {
    const raw = fixture()
    const used = raw.canvas.width * raw.canvas.height + Object.values(raw.assets).reduce((sum: number, asset: any) => sum + asset.width * asset.height, 0)
    const remaining = 32 * 1024 * 1024 - used
    raw.assets['budget-wide'] = { src: 'parts/budget-wide.png', width: 8192, height: Math.floor(remaining / 8192) }
    if (remaining % 8192 !== 0) raw.assets['budget-remainder'] = { src: 'parts/budget-remainder.png', width: remaining % 8192, height: 1 }
    expect(() => readAnimationPackage(raw)).not.toThrow()
    raw.assets['over-budget'] = { src: 'parts/over-budget.png', width: 1, height: 1 }
    expect(() => readAnimationPackage(raw)).toThrow('pixel budget')
    const hugeCanvas = fixture(); hugeCanvas.canvas = { width: 8192, height: 8192 }
    expect(() => readAnimationPackage(hugeCanvas)).toThrow('pixel budget')
  })
  it.each([
    ['version', (d: any) => { d.schemaVersion = 2 }],
    ['script', (d: any) => { d.evaluate = '() => alert(1)' }],
    ['path', (d: any) => { d.assets.head.src = '../other.png' }],
    ['cycle', (d: any) => { d.nodes[0].parent = d.nodes[1].id }],
    ['duplicate node', (d: any) => { d.nodes[1].id = d.nodes[0].id }],
    ['nonfinite', (d: any) => { d.nodes[0].transform.rotation = Infinity }],
    ['crop', (d: any) => { d.nodes.find((n: any) => n.id === 'mouth-open').sprite.crop = [0, 0, 99999, 1] }],
    ['unknown asset', (d: any) => { d.nodes.find((n: any) => n.sprite).sprite.asset = 'constructor' }],
    ['unknown clip', (d: any) => { d.states.default = 'constructor' }],
    ['array property', (d: any) => { d.clips.idle.tracks[0].property = ['scaleX']; d.clips.idle.tracks[0].keys = [{ time: 0, value: 0 }] }],
    ['bad track', (d: any) => { d.clips.idle.tracks[0].node = 'absent' }],
    ['unordered keys', (d: any) => { d.clips.idle.tracks[0].keys[1].time = 0 }],
    ['visibility interpolation', (d: any) => { d.clips.speaking.tracks.find((t: any) => t.property === 'visible').interpolation = 'linear' }],
  ])('rejects %s before playback', (_, mutate) => { const data = fixture(); mutate(data); expect(() => readAnimationPackage(data)).toThrow() })
})

describe('deterministic animation playback', () => {
  it('keeps clip sampling isolated and loops at the declared duration', () => {
    const data = readAnimationPackage(fixture()), before = JSON.stringify(data), clip = data.clips.waiting
    expect(sampleClip(data, clip, 0)).toEqual(sampleClip(data, clip, clip.duration))
    const pose = sampleClip(data, clip, .92)
    expect(pose['wait-arms'].visible).toBe(true)
    expect(sampleClip(data, data.clips.listening, .92)['wait-arms'].visible).toBe(false)
    pose['head-root'].transform.x = 999
    expect(JSON.stringify(data)).toBe(before)
  })
  it('does not inherit object-prototype visibility for valid node IDs', () => {
    const raw = fixture(); raw.nodes.push({ id: 'constructor', parent: null, transform: { ...raw.nodes[0].transform }, visible: false })
    const data = readAnimationPackage(raw); expect(Object.entries(sampleClip(data, data.clips.idle, 0)).find(([id]) => id === 'constructor')?.[1].visible).toBe(false)
  })
  it('switches mouth attachments exclusively with data tracks', () => {
    const data = readAnimationPackage(fixture())
    for (const time of [0, .26, .5, 1, 3.2]) {
      const pose = sampleClip(data, data.clips.speaking, time)
      expect(pose['mouth-open'].visible).not.toBe(pose['mouth-closed'].visible)
    }
  })
  it('starts in the requested state and interrupts settling from the current pose', () => {
    const data = readAnimationPackage(fixture()), clock = new AnimationTimeline(data, 'listening')
    expect(clock.advance(0)['listen-back'].visible).toBe(true)
    clock.setState('waiting'); const halfway = clock.advance(.12)
    clock.setState('speaking'); const next = clock.advance(0)
    expect(next['head-root'].transform).toEqual(halfway['head-root'].transform)
    expect(next['wait-arms'].visible).toBe(false)
    expect(() => clock.advance(Infinity)).toThrow()
  })
  it('plays a declared nonloop transition then enters the target loop', () => {
    const raw = fixture()
    raw.clips['turn-to-wait'] = { duration: .4, loop: false, visibility: {}, tracks: [{ node: 'head-root', property: 'rotation', interpolation: 'linear', keys: [{ time: 0, value: 10 }, { time: .4, value: 20 }] }] }
    raw.transitions = [{ from: 'default', to: 'waiting', clip: 'turn-to-wait' }]
    const data = readAnimationPackage(raw), clock = new AnimationTimeline(data)
    clock.setState('waiting'); expect(clock.advance(.1)['head-root'].transform.rotation).toBeCloseTo(12.5); expect(clock.advance(.2)['head-root'].transform.rotation).toBeCloseTo(17.5)
    expect(Math.abs(clock.advance(.2)['head-root'].transform.rotation)).toBeLessThan(2)
  })
})

describe('Canvas rig rendering', () => {
  it('preserves parent visibility, order and head-hand transforms', () => {
    const data = readAnimationPackage(fixture()), matrices: number[][] = [], draws: unknown[] = []
    const context = { clearRect() {}, save() {}, restore() {}, setTransform(...v: number[]) { matrices.push(v) }, drawImage(image: unknown) { draws.push(image) }, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, clip() {} }
    const canvas = { getContext: () => context, width: 0, height: 0 } as unknown as HTMLCanvasElement
    const images = new Map(Object.keys(data.assets).map(id => [id, { id } as unknown as CanvasImageSource]))
    const renderer = createCanvasRenderer(canvas, data, images), pose = sampleClip(data, data.clips.waiting, .92)
    renderer.render(pose)
    expect(draws.length).toBeGreaterThan(0)
    expect(matrices.every(m => m.every(Number.isFinite))).toBe(true)
    draws.length = 0; pose.contact.visible = false; renderer.render(pose)
    expect(draws).toHaveLength(0)
  })
  it('fails cleanly when Canvas is unavailable', () => {
    const data = readAnimationPackage(fixture())
    expect(() => createCanvasRenderer({ getContext: () => null } as unknown as HTMLCanvasElement, data, new Map())).toThrow('Canvas 2D')
  })
})
