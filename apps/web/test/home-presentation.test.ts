import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import Application from '../src/Application.vue'
import type { CaseSummary } from '../src/application/catalog'
import { setup } from './helpers'

const cleanup: (() => void)[] = []
afterEach(() => cleanup.splice(0).forEach((action) => action()))

async function home(catalog: CaseSummary[]) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: Application }] })
  await router.push('/?demo=1')
  const createController = vi.fn(() => setup().controller)
  const wrapper = mount(Application, {
    props: { appearances: [], demo: true, loadCatalog: async () => catalog, createController },
    global: { plugins: [router] },
  })
  cleanup.push(() => wrapper.unmount())
  await flushPromises()
  return { wrapper, router, createController }
}

const catalog = Array.from({ length: 5 }, (_, index) => ({
  id: `case-${index + 1}`, title: `第${index + 1}个故事`, summary: `公开简介${index + 1}`,
  interrogationLimitSeconds: 480 + index * 60,
}))

describe('homepage presentation', () => {
  it.each([1, 5])('presents %i catalog entries with their public metadata and individual entry buttons', async (count) => {
    const { wrapper, createController } = await home(catalog.slice(0, count))
    const cards = wrapper.findAll('.case-card')
    expect(cards).toHaveLength(count)
    cards.forEach((card, index) => {
      expect(card.get('h3').text()).toBe(catalog[index].title)
      expect(card.get('p').text()).toBe(catalog[index].summary)
      expect(card.get('.case-duration').text()).toBe(`${String(8 + index).padStart(2, '0')}:00 询问时间`)
      expect(card.get('button').text()).toBe('查看案件')
    })
    expect(wrapper.get('.home-intro h1').text()).toBe('有人在说谎')
    expect(wrapper.get('.home-intro').text()).toContain('和角色语音对话')
    expect(wrapper.get('.home-header button').text()).toBe('创作案件')
    expect(createController).toHaveBeenCalledTimes(0)
  })

  it('opens the selected catalog identity independently of its position', async () => {
    const { wrapper, router, createController } = await home(catalog)
    await wrapper.findAll('.case-card')[4].get('button').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({ game: 'case-5', demo: '1' })
    expect(createController).toHaveBeenCalledTimes(1)
  })
})
