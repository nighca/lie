import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ProbeReport } from './probe'
import template from './index.html?raw'

const fake = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn(async () => {}), create: vi.fn(), update: (_report: ProbeReport) => {} }))
vi.mock('./probe', () => ({ createAudioProbe: (...args: unknown[]) => { fake.create(...args); fake.update = args[1] as typeof fake.update; return { start: fake.start, stop: fake.stop } } }))

beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks()
  document.documentElement.innerHTML = template
  vi.stubGlobal('isSecureContext', true)
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn() } })
})
afterEach(() => vi.unstubAllGlobals())

function stopped(cleaned: boolean): ProbeReport {
  return { formatVersion: 2, mode: 'direct-16k', phase: 'stopped', settings: null, settingsByPhase: {}, contexts: { capture: null, playback: null }, energy: { 'quiet-before': { frames: 0, rms: 0, peak: 0 }, playing: { frames: 0, rms: 0, peak: 0 }, 'quiet-after': { frames: 0, rms: 0, peak: 0 } }, timeline: { 'quiet-before': [], playing: [], 'quiet-after': [] }, timelineTruncated: false, cleanup: { tracksEnded: cleaned, contextsClosed: cleaned }, error: null }
}

describe('diagnostic page control boundary', () => {
  it('starts only after a click, prevents overlap, and cleans up on stop', async () => {
    await import('./main')
    expect(fake.create).not.toHaveBeenCalled()
    const start = document.querySelector<HTMLButtonElement>('#start')!
    start.click(); start.click()
    expect(fake.create).toHaveBeenCalledOnce()
    expect(fake.start).toHaveBeenCalledOnce()
    document.querySelector<HTMLButtonElement>('#stop')!.click()
    expect(fake.stop).toHaveBeenCalledOnce()
    fake.update(stopped(true))
    expect(start.disabled).toBe(false)
    expect(document.querySelector('#status')!.textContent).toContain('已释放')
  })

  it('does not claim successful cleanup or allow another trial after failure', async () => {
    await import('./main')
    const start = document.querySelector<HTMLButtonElement>('#start')!
    start.click(); fake.update(stopped(false))
    expect(start.disabled).toBe(true)
    expect(document.querySelector('#status')!.textContent).toContain('清理未完成')
  })

  it('rejects insecure contexts before asking for microphone access', async () => {
    vi.stubGlobal('isSecureContext', false)
    await import('./main')
    document.querySelector<HTMLButtonElement>('#start')!.click()
    expect(fake.create).not.toHaveBeenCalled()
    expect(document.querySelector('#status')!.textContent).toContain('HTTPS')
  })

  it('releases an active trial when the page leaves', async () => {
    await import('./main')
    document.querySelector<HTMLButtonElement>('#start')!.click()
    window.dispatchEvent(new Event('pagehide'))
    expect(fake.stop).toHaveBeenCalledOnce()
    fake.update(stopped(true))
  })

  it('copies every completed result and the current result only after a click', async () => {
    const writeText = vi.fn(async () => {})
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn() }, clipboard: { writeText } })
    await import('./main')
    const copy = document.querySelector<HTMLButtonElement>('#copy')!
    expect(copy.disabled).toBe(true)
    document.querySelector<HTMLButtonElement>('#start')!.click(); fake.update(stopped(true))
    document.querySelector<HTMLButtonElement>('#start')!.click(); fake.update({ ...stopped(true), mode: 'direct-default' })
    expect(writeText).not.toHaveBeenCalled()
    copy.click()
    await vi.waitFor(() => expect(document.querySelector('#copy-status')!.textContent).toContain('已复制全部结果'))
    const value = document.querySelector<HTMLTextAreaElement>('#report')!.value
    expect(writeText).toHaveBeenCalledExactlyOnceWith(value)
    expect(JSON.parse(value).completed).toHaveLength(1)
    expect(JSON.parse(value).current.mode).toBe('direct-default')
    expect(copy.disabled).toBe(false)
  })

  it('reports denied clipboard access truthfully and retains the result', async () => {
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn() }, clipboard: { writeText: vi.fn(async () => { throw new DOMException('Denied', 'NotAllowedError') }) } })
    await import('./main')
    document.querySelector<HTMLButtonElement>('#start')!.click(); fake.update(stopped(true))
    const output = document.querySelector<HTMLTextAreaElement>('#report')!
    const value = output.value
    document.querySelector<HTMLButtonElement>('#copy')!.click()
    await vi.waitFor(() => expect(document.querySelector('#copy-status')!.textContent).toContain('未能复制'))
    expect(output.value).toBe(value)
    expect(document.querySelector<HTMLButtonElement>('#copy')!.disabled).toBe(false)
  })

  it('keeps copying disabled during a new trial if a previous clipboard write resolves late', async () => {
    let resolve!: () => void
    const writeText = vi.fn(() => new Promise<void>(done => { resolve = done }))
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn() }, clipboard: { writeText } })
    await import('./main')
    const start = document.querySelector<HTMLButtonElement>('#start')!
    const copy = document.querySelector<HTMLButtonElement>('#copy')!
    start.click(); fake.update(stopped(true)); copy.click()
    start.click(); fake.update({ ...stopped(true), phase: 'playing', cleanup: null })
    resolve()
    await vi.waitFor(() => expect(document.querySelector('#copy-status')!.textContent).toContain('上一份结果'))
    expect(copy.disabled).toBe(true)
    fake.update(stopped(true))
    expect(copy.disabled).toBe(false)
  })
})
