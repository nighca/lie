import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AnimatedPortrait from '../src/components/AnimatedPortrait.vue'

const mock = vi.hoisted(() => ({ load: vi.fn(), render: vi.fn(), dispose: vi.fn(), setState: vi.fn(), advance: vi.fn(), finished: false }))
vi.mock('@lie/character-animation', () => ({
  loadAnimationPackage: mock.load,
  createCanvasRenderer: () => ({ render: mock.render, dispose: mock.dispose }),
  AnimationTimeline: class { setState = mock.setState; advance = mock.advance; get finished() { return mock.finished } },
  resultAnimationStates: ['accusedCorrectly', 'accusedWrongly'],
}))
let media: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> }
beforeEach(() => {
  vi.clearAllMocks()
  mock.finished = false
  media = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }
  vi.stubGlobal('matchMedia', vi.fn(() => media))
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 42))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  mock.load.mockResolvedValue({ data: {}, images: new Map() })
})
afterEach(() => { vi.unstubAllGlobals() })
function show(src: string | null = '/appearances/example/animation/package.json') { return mount(AnimatedPortrait, { props: { src, state: 'default' }, slots: { default: '<img src="/static.png" alt="静态人物">' } }) }

describe('optional animated portrait', () => {
  it('keeps static characters unchanged without loading animation', async () => {
    const wrapper = show(null); await flushPromises()
    expect(mock.load).not.toHaveBeenCalled(); expect(wrapper.find('img').exists()).toBe(true)
    wrapper.unmount()
  })
  it('keeps the animation stage empty while loading, then passes states and stops on unmount', async () => {
    const wrapper = show(); expect(wrapper.find('img').exists()).toBe(false); await flushPromises()
    expect(wrapper.find('img').exists()).toBe(false); expect(wrapper.get('canvas').element.style.display).toBe('')
    await wrapper.setProps({ state: 'listening' }); expect(mock.setState).toHaveBeenCalledWith('listening')
    wrapper.unmount(); expect(cancelAnimationFrame).toHaveBeenCalledWith(42); expect(mock.dispose).toHaveBeenCalled()
    expect(mock.load.mock.calls[0][1].aborted).toBe(true)
  })
  it('retains static fallback on invalid packages or failed assets', async () => {
    mock.load.mockRejectedValue(new Error('asset missing'))
    const wrapper = show(); await flushPromises(); expect(wrapper.find('img').exists()).toBe(true); expect(wrapper.get('canvas').element.style.display).toBe('none'); wrapper.unmount()
  })
  it('ignores a late previous load after switching to a static character', async () => {
    let resolve: (v: unknown) => void = () => {}
    mock.load.mockReturnValue(new Promise(r => { resolve = r }))
    const wrapper = show(); await flushPromises(); await wrapper.setProps({ src: null }); resolve({ data: {}, images: new Map() }); await flushPromises()
    expect(wrapper.find('img').exists()).toBe(true); expect(mock.render).not.toHaveBeenCalled(); wrapper.unmount()
  })
  it('uses static portraits for reduced motion', async () => {
    media.matches = true
    const wrapper = show(); await flushPromises(); expect(mock.load).not.toHaveBeenCalled(); expect(wrapper.find('img').exists()).toBe(true); wrapper.unmount()
  })
  it('keeps the static portrait when motion preferences are unavailable', async () => {
    vi.stubGlobal('matchMedia', null)
    const wrapper = show(); await flushPromises(); expect(mock.load).not.toHaveBeenCalled(); expect(wrapper.find('img').exists()).toBe(true); wrapper.unmount()
  })
  it('does not load remote animation sources', async () => {
    const wrapper = show('https://example.net/animation/package.json'); await flushPromises(); expect(mock.load).not.toHaveBeenCalled(); expect(wrapper.find('img').exists()).toBe(true); wrapper.unmount()
  })
  it('never mounts the fallback during a deferred first load', async () => {
    let finish!: (value: unknown) => void
    mock.load.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    const wrapper = show()
    expect(wrapper.find('img').exists()).toBe(false)
    await flushPromises()
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('canvas').element.style.display).toBe('none')
    finish({ data: {}, images: new Map() }); await flushPromises()
    expect(mock.render).toHaveBeenCalledOnce()
    expect(wrapper.get('canvas').element.style.display).toBe('')
    expect(wrapper.find('img').exists()).toBe(false)
    wrapper.unmount()
  })
  it('clears an existing portrait while switching sources and ignores a late replaced load', async () => {
    const wrapper = show(); await flushPromises()
    let finishOld!: (value: unknown) => void
    let finishNew!: (value: unknown) => void
    mock.load.mockReturnValueOnce(new Promise(resolve => { finishOld = resolve }))
    await wrapper.setProps({ src: '/appearances/old/animation/package.json' })
    expect(mock.dispose).toHaveBeenCalledOnce()
    expect(wrapper.get('canvas').element.style.display).toBe('none')
    expect(wrapper.find('img').exists()).toBe(false)
    const oldSignal = mock.load.mock.calls.at(-1)![1]
    mock.load.mockReturnValueOnce(new Promise(resolve => { finishNew = resolve }))
    await wrapper.setProps({ src: '/appearances/new/animation/package.json' })
    expect(oldSignal.aborted).toBe(true)
    finishNew({ data: {}, images: new Map() }); await flushPromises()
    expect(mock.render).toHaveBeenCalledTimes(2)
    finishOld({ data: {}, images: new Map() }); await flushPromises()
    expect(mock.render).toHaveBeenCalledTimes(2)
    expect(wrapper.get('canvas').element.style.display).toBe('')
    wrapper.unmount()
  })
  it('switches null and motion preferences without showing a loading fallback or leaving frames alive', async () => {
    const wrapper = show(null); await flushPromises()
    expect(wrapper.find('img').exists()).toBe(true)
    await wrapper.setProps({ src: '/appearances/example/animation/package.json' }); await flushPromises()
    expect(wrapper.get('canvas').element.style.display).toBe('')
    const change = media.addEventListener.mock.calls[0][1]
    media.matches = true; change(); await flushPromises()
    expect(wrapper.find('img').exists()).toBe(true)
    expect(mock.dispose).toHaveBeenCalledOnce()
    expect(cancelAnimationFrame).toHaveBeenCalledWith(42)
    let finish!: (value: unknown) => void
    mock.load.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    media.matches = false; change(); await flushPromises()
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('canvas').element.style.display).toBe('none')
    finish({ data: {}, images: new Map() }); await flushPromises()
    expect(wrapper.get('canvas').element.style.display).toBe('')
    await wrapper.setProps({ src: null })
    expect(wrapper.find('img').exists()).toBe(true)
    wrapper.unmount()
    expect(media.removeEventListener).toHaveBeenCalledWith('change', change)
  })
  it('falls back on a rendering failure and releases the pending frame', async () => {
    const wrapper = show(); await flushPromises()
    mock.render.mockImplementationOnce(() => { throw Error('canvas unavailable') })
    const draw = vi.mocked(requestAnimationFrame).mock.calls[0][0]
    draw(10); await flushPromises()
    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.get('canvas').element.style.display).toBe('none')
    expect(mock.dispose).toHaveBeenCalledOnce()
    wrapper.unmount()
  })
  it('keeps one frame loop across repeated visibility events and cancels an unmounted pending load', async () => {
    const wrapper = show(); await flushPromises()
    document.dispatchEvent(new Event('visibilitychange'))
    document.dispatchEvent(new Event('visibilitychange'))
    expect(cancelAnimationFrame).toHaveBeenCalledTimes(2)
    expect(requestAnimationFrame).toHaveBeenCalledTimes(3)
    wrapper.unmount()
    mock.render.mockClear()
    let finish!: (value: unknown) => void
    mock.load.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    const pending = show(); await flushPromises()
    const signal = mock.load.mock.calls.at(-1)![1]
    pending.unmount()
    expect(signal.aborted).toBe(true)
    finish({ data: {}, images: new Map() }); await flushPromises()
    expect(mock.render).not.toHaveBeenCalled()
  })
})

function resultPortrait() {
  return mount(AnimatedPortrait, { props: { src: '/appearances/example/animation/package.json', state: 'accusedCorrectly', fit: 'contain' }, slots: { default: '<img src="/result.png" alt="结果终态">' } })
}
function resultPackage() { mock.load.mockResolvedValue({ data: { states: { accusedCorrectly: 'reaction' } }, images: new Map() }) }
function changeMotion(matches: boolean) {
  media.matches = matches
  media.addEventListener.mock.calls.at(-1)![1]()
}
describe('one-play result portrait', () => {
  it('shows the result terminal image while loading, and for an old package with no reaction', async () => {
    mock.load.mockResolvedValue({ data: { states: { default: 'idle' } }, images: new Map() })
    const wrapper = resultPortrait()
    expect(wrapper.get('img').attributes('src')).toBe('/result.png')
    await flushPromises()
    expect(wrapper.find('img').exists()).toBe(true)
    expect(mock.render).not.toHaveBeenCalled()
    wrapper.unmount()
  })
  it('holds the last canvas and stops scheduling frames when its nonloop clip ends', async () => {
    resultPackage()
    const wrapper = resultPortrait(); await flushPromises()
    expect(wrapper.classes()).toContain('animated-portrait--contain')
    const count = vi.mocked(requestAnimationFrame).mock.calls.length
    mock.finished = true
    vi.mocked(requestAnimationFrame).mock.calls.at(-1)![0](100)
    expect(requestAnimationFrame).toHaveBeenCalledTimes(count)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('canvas').element.style.display).toBe('')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(requestAnimationFrame).toHaveBeenCalledTimes(count)
    wrapper.unmount()
  })
  it.each([true, false])('does not replay after reduced motion, initially reduced=%s', async initial => {
    resultPackage(); media.matches = initial
    const wrapper = resultPortrait(); await flushPromises()
    if (!initial) { changeMotion(true); await flushPromises() }
    const calls = mock.load.mock.calls.length
    expect(wrapper.find('img').exists()).toBe(true)
    changeMotion(false); await flushPromises()
    expect(mock.load).toHaveBeenCalledTimes(calls)
    expect(wrapper.find('img').exists()).toBe(true)
    wrapper.unmount()
    const fresh = resultPortrait(); await flushPromises()
    expect(mock.load).toHaveBeenCalledTimes(calls + 1)
    expect(fresh.find('img').exists()).toBe(false)
    fresh.unmount()
  })
  it('does not replay on label/state updates or source changes after playback starts', async () => {
    resultPackage(); const wrapper = resultPortrait(); await flushPromises()
    await wrapper.setProps({ label: '新姓名', state: 'accusedCorrectly' })
    expect(mock.load).toHaveBeenCalledOnce()
    await wrapper.setProps({ src: '/appearances/other/animation/package.json' }); await flushPromises()
    expect(mock.load).toHaveBeenCalledOnce()
    expect(wrapper.find('img').exists()).toBe(true)
    wrapper.unmount()
  })
  it('cancels a pending result load when reduced motion is enabled and ignores its late success', async () => {
    let finish!: (value: unknown) => void
    mock.load.mockReturnValue(new Promise(resolve => { finish = resolve }))
    const wrapper = resultPortrait(); await flushPromises()
    const signal = mock.load.mock.calls[0][1]
    changeMotion(true); await flushPromises()
    expect(signal.aborted).toBe(true)
    finish({ data: { states: { accusedCorrectly: 'reaction' } }, images: new Map() }); await flushPromises()
    expect(mock.render).not.toHaveBeenCalled()
    changeMotion(false); await flushPromises()
    expect(mock.load).toHaveBeenCalledOnce()
    expect(wrapper.find('img').exists()).toBe(true)
    wrapper.unmount()
  })
  it('pauses while hidden and resumes without advancing by time spent in the background', async () => {
    resultPackage(); const wrapper = resultPortrait(); await flushPromises()
    let hidden = false
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)
    const frame = () => vi.mocked(requestAnimationFrame).mock.calls.at(-1)![0]
    frame()(1000); frame()(1050)
    expect(mock.advance.mock.calls.at(-1)![0]).toBe(.05)
    hidden = true; document.dispatchEvent(new Event('visibilitychange'))
    const count = vi.mocked(requestAnimationFrame).mock.calls.length
    document.dispatchEvent(new Event('visibilitychange'))
    expect(requestAnimationFrame).toHaveBeenCalledTimes(count)
    hidden = false; document.dispatchEvent(new Event('visibilitychange'))
    frame()(50000)
    expect(mock.advance.mock.calls.at(-1)![0]).toBe(0)
    expect(mock.load).toHaveBeenCalledOnce()
    wrapper.unmount(); vi.restoreAllMocks()
  })
})

it('keeps a failed result on its terminal fallback and aborts an unmounted pending result', async () => {
  mock.load.mockRejectedValueOnce(Error('missing result asset'))
  const failed = resultPortrait(); await flushPromises()
  expect(failed.get('img').attributes('src')).toBe('/result.png')
  failed.unmount()
  mock.render.mockClear()
  let finish!: (value: unknown) => void
  mock.load.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
  const pending = resultPortrait(); await flushPromises()
  const signal = mock.load.mock.calls.at(-1)![1]
  pending.unmount()
  expect(signal.aborted).toBe(true)
  finish({ data: { states: { accusedCorrectly: 'reaction' } }, images: new Map() }); await flushPromises()
  expect(mock.render).not.toHaveBeenCalled()
})

it('resumes frames when switching an ordinary completed nonloop clip to another base state', async () => {
  const wrapper = show(); await flushPromises()
  mock.finished = true
  vi.mocked(requestAnimationFrame).mock.calls.at(-1)![0](100)
  const count = vi.mocked(requestAnimationFrame).mock.calls.length
  mock.setState.mockImplementationOnce(() => { mock.finished = false })
  await wrapper.setProps({ state: 'listening' })
  expect(mock.setState).toHaveBeenCalledWith('listening')
  expect(requestAnimationFrame).toHaveBeenCalledTimes(count + 1)
  expect(mock.load).toHaveBeenCalledOnce()
  wrapper.unmount()
})
