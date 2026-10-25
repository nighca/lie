import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { expect, it, vi } from 'vitest'
import Application from '../../apps/web/src/Application.vue'
import { caseCatalog } from '../../apps/web/src/application/catalog'
import { officialCases, readBundledCase, nextOfficialCaseSequence } from '../../apps/web/src/application/bundledCases'
import { createGameController } from '../../apps/web/src/application/controller'

it('the unchanged real eager glob discovers the fourth case; homepage, direct route, each accusation and remix work', async () => {
  const game = readBundledCase('hackathon-old-project')
  expect(officialCases.map(entry => entry.sequence)).toEqual([1, 2, 3, 4])
  expect(nextOfficialCaseSequence).toBe(5)
  expect(caseCatalog.at(-1)).toMatchObject({ id: game.id, summary: game.summary })
  const fetcher = vi.fn(() => { throw Error('No network permitted') })
  vi.stubGlobal('fetch', fetcher)
  Object.defineProperties(HTMLDialogElement.prototype, { showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true } }, close: { configurable: true, value(this: HTMLDialogElement) { this.open = false } } })
  localStorage.clear()
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:all(.*)*', component: Application }] })
  let controller: ReturnType<typeof createGameController> | null = null
  const props = { catalog: caseCatalog, characterPresets: [], demo: true,
    createController: (content: typeof game | null) => {
      controller = createGameController({ readGame: async id => content ?? readBundledCase(id), voice: { create() { throw Error('Voice not used') } }, newSessionId: () => 'hackathon-proof', now: () => 0 })
      return controller
    } }
  await router.push('/')
  const wrapper = mount(Application, { props, global: { plugins: [router] } })
  try {
    await flushPromises()
    const cards = wrapper.findAll('.case-card')
    expect(cards).toHaveLength(4)
    expect(cards[3].text()).toContain(game.summary)
    await cards[3].get('button').trigger('click'); await flushPromises()
    expect(router.currentRoute.value.query.game).toBe(game.id)
    expect(wrapper.get('.intro-card h1').text()).toBe(game.title)
    for (const character of game.characters) {
      await wrapper.get('.intro-start').trigger('click')
      expect(wrapper.findAll('.lie-character')).toHaveLength(game.characters.length)
      controller!.selectCharacter(character.id)
      expect(controller!.getView().currentCharacterId).toBe(character.id)
      controller!.openAccusation(); await flushPromises()
      await wrapper.get(`[aria-label="指认 ${character.name}"]`).trigger('click')
      await flushPromises()
      const correct = character.id === game.ending.culpritId
      expect(controller!.getView().phase).toBe(correct ? 'solved' : 'lost')
      expect(wrapper.find('.result-card--wrong').exists()).toBe(!correct)
      expect(wrapper.find('[aria-label="完整经过"]').exists()).toBe(correct)
      expect(wrapper.find('.remix-link').exists()).toBe(true)
      controller!.restart(); await flushPromises()
    }
    await router.push('/'); await flushPromises()
    await router.push({ path: '/', query: { game: game.id } }); await flushPromises()
    expect(wrapper.get('.intro-card h1').text()).toBe(game.title)
    expect(controller!.getView().interrogationRemainingMs).toBe(480000)
    await wrapper.get('.intro-start').trigger('click')
    controller!.openAccusation(); await flushPromises()
    await wrapper.get('[aria-label="指认 陆鸣"]').trigger('click'); await flushPromises()
    await wrapper.get('.remix-link').trigger('click'); await flushPromises(); await flushPromises()
    expect(router.currentRoute.value.path).toBe('/editor')
    expect((wrapper.get('[name="summary"]').element as HTMLInputElement).value).toBe(game.summary)
    expect((wrapper.get('[name="background"]').element as HTMLTextAreaElement).value).toBe(game.background)
    expect(fetcher).not.toHaveBeenCalled()
  } finally { wrapper.unmount(); localStorage.clear(); vi.unstubAllGlobals() }
})
