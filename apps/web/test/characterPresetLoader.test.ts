// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createCharacterPresetLoader } from '../src/presentation/characterPresetLoader'

const preset = { id: 'guide', name: '向导', avatar: '/a.png', portrait: '/p.png', accent: '#123456' }
const response = (id = 'guide') => new Response(JSON.stringify([{ ...preset, id }]))
afterEach(() => { vi.useRealTimers() })

describe('optional character preset loading', () => {
  it('shares a pending request and reuses its successful catalog', async () => {
    let finish: (value: Response) => void = () => {}
    const fetcher = vi.fn<typeof fetch>(() => new Promise((resolve) => { finish = resolve }))
    const loader = createCharacterPresetLoader(fetcher)
    const first = loader.load()
    expect(loader.load()).toBe(first)
    expect(loader.state.status).toBe('loading')
    finish(response())
    expect((await first)?.[0].id).toBe('guide')
    expect(await loader.load()).toBe(loader.state.presets)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('bounds a fetch which ignores abort and ignores its late result after recovery', async () => {
    vi.useFakeTimers()
    let finish: (value: Response) => void = () => {}
    const fetcher = vi.fn<typeof fetch>().mockImplementationOnce(() => new Promise((resolve) => { finish = resolve })).mockResolvedValueOnce(response('new'))
    const loader = createCharacterPresetLoader(fetcher)
    const first = loader.load()
    await vi.advanceTimersByTimeAsync(8_000)
    expect(await first).toBeNull()
    expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true)
    expect(loader.state.status).toBe('failed')
    await loader.load()
    finish(response('late'))
    await Promise.resolve(); await Promise.resolve()
    expect(loader.state.presets[0].id).toBe('new')
    expect(loader.state.status).toBe('ready')
    expect(vi.getTimerCount()).toBe(0)
  })
  it('uses the same deadline for a stalled response body', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(new ReadableStream({ start() {} })))
    const loader = createCharacterPresetLoader(fetcher)
    const pending = loader.load()
    await vi.advanceTimersByTimeAsync(8_000)
    expect(await pending).toBeNull()
    expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true)
    expect(loader.state.status).toBe('failed')
  })
  it.each([new Response('', { status: 404 }), new Response('{'), new Response('{}')])('recovers after HTTP, JSON or catalog validation failure', async (failed) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(failed).mockResolvedValueOnce(response())
    const loader = createCharacterPresetLoader(fetcher)
    expect(await loader.load()).toBeNull()
    expect(loader.state.status).toBe('failed')
    expect((await loader.load())?.[0].id).toBe('guide')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
  it('cancels an active request and permits a later retry without a timer or late publication', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn<typeof fetch>().mockImplementationOnce(() => new Promise(() => {})).mockResolvedValueOnce(response())
    const loader = createCharacterPresetLoader(fetcher)
    const pending = loader.load()
    loader.cancel()
    expect(await pending).toBeNull()
    expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
    expect((await loader.load())?.[0].id).toBe('guide')
  })
})
