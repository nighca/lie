import type { App } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import { caseCatalog } from '../src/application/catalog'

const { apps } = vi.hoisted(() => ({ apps: [] as App[] }))
vi.mock('vue', async (load) => {
  const vue = await load<typeof import('vue')>()
  return { ...vue, createApp: (...args: Parameters<typeof vue.createApp>) => {
    const app = vue.createApp(...args)
    apps.push(app)
    return app
  } }
})
afterEach(async () => {
  apps.splice(0).forEach((app) => app.unmount())
  await flushPromises()
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})
it('the production entry mounts a usable homepage before the optional manifest settles', async () => {
  history.replaceState(null, '', '/')
  document.body.innerHTML = '<div id="app"></div>'
  const fetcher = vi.fn<typeof fetch>((input) => String(input) === '/appearances/manifest.json' ? new Promise(() => {}) : Promise.resolve(new Response('[]')))
  vi.stubGlobal('fetch', fetcher)
  await import('../src/main')
  await flushPromises()
  expect(document.body.textContent).toContain('有人在说谎')
  expect(document.body.textContent).toContain('创作案件')
  expect(document.querySelectorAll('.case-card')).toHaveLength(caseCatalog.length)
  expect(fetcher.mock.calls.every(([url]) => String(url) === '/appearances/manifest.json')).toBe(true)
  expect(fetcher.mock.calls.filter(([url]) => url === '/appearances/manifest.json')).toHaveLength(1)
})
