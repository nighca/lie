import { shallowReactive } from 'vue'

import { readCharacterPresets, type CharacterPreset } from './characterPresets'

export type PresetLoadStatus = 'idle' | 'loading' | 'ready' | 'failed'

/** One optional catalog request, shared by consumers and bounded through body parsing. */
export function createCharacterPresetLoader(fetcher: typeof fetch = fetch, timeoutMs = 8_000) {
  const state = shallowReactive<{ presets: readonly CharacterPreset[]; status: PresetLoadStatus }>({ presets: [], status: 'idle' })
  let pending: Promise<readonly CharacterPreset[] | null> | null = null
  let active: AbortController | null = null

  function load(): Promise<readonly CharacterPreset[] | null> {
    if (pending != null) return pending
    if (state.status === 'ready') return Promise.resolve(state.presets)
    const controller = new AbortController()
    active = controller
    state.status = 'loading'
    pending = (async () => {
      let rejectAbort: () => void = () => {}
      const aborted = new Promise<never>((_resolve, reject) => { rejectAbort = () => reject(new Error('Preset request aborted')) })
      controller.signal.addEventListener('abort', rejectAbort, { once: true })
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const request = (async () => {
          const response = await fetcher('/appearances/manifest.json', { signal: controller.signal })
          if (!response.ok) throw new Error('Preset request failed')
          return readCharacterPresets(await response.json())
        })()
        const presets = await Promise.race([request, aborted])
        state.presets = presets
        state.status = 'ready'
        return presets
      } catch {
        state.status = 'failed'
        return null
      } finally {
        clearTimeout(timer)
        controller.signal.removeEventListener('abort', rejectAbort)
        active = null
        pending = null
      }
    })()
    return pending
  }
  function cancel() { active?.abort() }
  return { state, load, cancel }
}
