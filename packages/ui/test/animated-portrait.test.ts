import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AnimatedPortrait from '../src/components/AnimatedPortrait.vue'

const mock = vi.hoisted(() => ({ load: vi.fn(), render: vi.fn(), dispose: vi.fn(), setState: vi.fn(), advance: vi.fn() }))
vi.mock('@lie/appearance-animation', () => ({
  loadAnimationPackage: mock.load,
  createCanvasRenderer: () => ({ render: mock.render, dispose: mock.dispose }),
  AnimationTimeline: class { setState = mock.setState; advance = mock.advance },
}))
let media: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> }
beforeEach(() => {
  vi.clearAllMocks()
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
  it('uses the static fallback while loading, then passes states and stops on unmount', async () => {
    const wrapper = show(); expect(wrapper.find('img').exists()).toBe(true); await flushPromises()
    expect(wrapper.find('img').exists()).toBe(false); expect(wrapper.get('canvas').isVisible()).toBe(true)
    await wrapper.setProps({ state: 'listening' }); expect(mock.setState).toHaveBeenCalledWith('listening')
    wrapper.unmount(); expect(cancelAnimationFrame).toHaveBeenCalledWith(42); expect(mock.dispose).toHaveBeenCalled()
    expect(mock.load.mock.calls[0][1].aborted).toBe(true)
  })
  it('retains static fallback on invalid packages or failed assets', async () => {
    mock.load.mockRejectedValue(new Error('asset missing'))
    const wrapper = show(); await flushPromises(); expect(wrapper.find('img').exists()).toBe(true); expect(wrapper.get('canvas').isVisible()).toBe(false); wrapper.unmount()
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
})
