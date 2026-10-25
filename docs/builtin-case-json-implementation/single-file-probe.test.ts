import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { expect, it, vi } from 'vitest'
import Application from '../../apps/web/src/Application.vue'
import { caseCatalog } from '../../apps/web/src/application/catalog'
import { readBundledCase, nextOfficialCaseSequence } from '../../apps/web/src/application/bundledCases'
import { createGameController } from '../../apps/web/src/application/controller'

it('adding only100-single-json-proof.json makes the real glob homepage and opening work', async () => {
  const fetcher = vi.fn(() => { throw Error('No network in proof') }); vi.stubGlobal('fetch', fetcher)
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:all(.*)*', component: Application }] })
  await router.push('/')
  const wrapper = mount(Application, { props: {
    catalog: caseCatalog, characterPresets: [], demo: true,
    createController: content => createGameController({ readGame: async id => content ?? readBundledCase(id), voice: { create() { throw Error('No voice in proof') } }, newSessionId: () => 'single-file-proof', now: () => 0 }),
  }, global: { plugins: [router] } })
  try {
    await flushPromises()
    expect(caseCatalog.at(-1)?.id).toBe('single-json-proof')
    expect(nextOfficialCaseSequence).toBe(101)
    expect(wrapper.findAll('.case-card')).toHaveLength(caseCatalog.length)
    const card = wrapper.findAll('.case-card').find(card => card.text().includes('单文件临时发现验证'))!
    expect(card.text()).toContain('只增加这一个编号JSON')
    await card.get('button').trigger('click'); await flushPromises(); await flushPromises()
    expect(router.currentRoute.value.query.game).toBe('single-json-proof')
    expect(wrapper.get('.intro-card h1').text()).toBe('单文件临时发现验证')
    await wrapper.get('.intro-start').trigger('click')
    expect(wrapper.find('.game-shell--investigating').exists()).toBe(true)
    expect(fetcher).not.toHaveBeenCalled()
  } finally { wrapper.unmount(); vi.unstubAllGlobals() }
})
