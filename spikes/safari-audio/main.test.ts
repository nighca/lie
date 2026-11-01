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
  return { mode: 'direct-16k', phase: 'stopped', settings: null, settingsByPhase: {}, contexts: { capture: null, playback: null }, energy: { 'quiet-before': { frames: 0, rms: 0, peak: 0 }, playing: { frames: 0, rms: 0, peak: 0 }, 'quiet-after': { frames: 0, rms: 0, peak: 0 } }, cleanup: { tracksEnded: cleaned, contextsClosed: cleaned }, error: null }
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
})
