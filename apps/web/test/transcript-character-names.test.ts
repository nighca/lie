import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'

import App from '../src/App.vue'
import { readCharacterPresets } from '../src/presentation/characterPresets'
import { game, setup } from './helpers'

const presets = readCharacterPresets([
  { id: 'yellow', name: '黄衣', portrait: '/yellow.png', avatar: '/yellow.png', accent: '#ffcf43' },
  { id: 'red', name: '红衣', portrait: '/red.png', avatar: '/red.png', accent: '#ff665b' },
  { id: 'blue', name: '蓝衣', portrait: '/blue.png', avatar: '/blue.png', accent: '#075bfa' },
])
const cleanup: (() => void)[] = []
afterEach(() => { cleanup.splice(0).forEach(action => action()); vi.clearAllTimers(); vi.useRealTimers() })

async function screen(characters = game.characters) {
  const session = setup(undefined, { ...game, characters })
  const wrapper = mount(App, { props: { controller: session.controller, characterPresets: presets, demo: true } })
  cleanup.push(() => { wrapper.unmount(); session.controller.dispose() })
  await session.controller.load('test'); session.controller.start(); await session.controller.startConversation(); await flushPromises()
  return { ...session, wrapper }
}

it('highlights the whole case roster in player and character bodies using existing overlapping/duplicate-name rules', async () => {
  const characters = [
    { ...game.characters[0], name: '林', appearanceId: 'yellow' },
    { ...game.characters[1], name: '林岚', appearanceId: 'red' },
    { ...game.characters[0], id: 'three', name: '同名', appearanceId: 'red' },
    { ...game.characters[0], id: 'four', name: '同名', appearanceId: 'blue' },
  ]
  const { controller, turns, wrapper } = await screen(characters)
  const player = '我想问林岚、林和同名。'
  const answer = '  <b>林岚</b>见过林，同名也在。  '
  turns[0].scope.onEvent({ type: 'userText', text: player })
  turns[0].scope.onEvent({ type: 'assistantText', text: answer })
  turns[0].scope.onEvent({ type: 'listening' })
  controller.endConversation(); await flushPromises()
  const bodies = wrapper.findAll('.lie-transcript__bubble p')
  expect(bodies.map(body => body.element.textContent)).toEqual([player, answer])
  for (const body of bodies) {
    expect(body.findAll('mark').map(mark => mark.text())).toEqual(['林岚', '林', '同名'])
    expect(body.findAll('mark').map(mark => (mark.element as HTMLElement).style.getPropertyValue('--character-name-accent'))).toEqual(['#ff665b', '#ffcf43', ''])
  }
  expect(wrapper.findAll('.lie-transcript__bubble strong').map(label => label.text())).toEqual(['你', '林'])
  expect(bodies[1].find('b').exists()).toBe(false)
})

it('waits for a complete name in the visible streaming prefix and retains highlighted history on reconnect', async () => {
  vi.useFakeTimers()
  const characters = game.characters.map((person, index) => ({ ...person, name: index === 0 ? '沈禾' : '顾遥', appearanceId: index === 0 ? 'yellow' : 'red' }))
  const { controller, turns, wrapper } = await screen(characters)
  turns[0].scope.onEvent({ type: 'assistantText', text: '顾遥' }); await flushPromises()
  await vi.advanceTimersByTimeAsync(100)
  const body = () => wrapper.get('.lie-transcript__bubble p')
  expect(body().element.textContent).toBe('顾')
  expect(body().findAll('mark').map(mark => mark.text())).toEqual([])
  await vi.advanceTimersByTimeAsync(100)
  expect(body().element.textContent).toBe('顾遥')
  expect(body().get('mark').text()).toBe('顾遥')
  turns[0].scope.onEvent({ type: 'assistantText', text: '说沈禾在门口。' }); await flushPromises()
  await vi.advanceTimersByTimeAsync(200)
  expect(body().element.textContent).toBe('顾遥说沈')
  expect(body().findAll('mark').map(mark => mark.text())).toEqual(['顾遥'])
  await vi.advanceTimersByTimeAsync(100)
  expect(body().element.textContent).toBe('顾遥说沈禾')
  expect(body().findAll('mark').map(mark => mark.text())).toEqual(['顾遥', '沈禾'])
  controller.endConversation(); await flushPromises()
  expect(body().element.textContent).toBe('顾遥说沈禾在门口。')
  expect(wrapper.get('.lie-transcript__interrupted').text()).toBe('回答被打断')
  await controller.startConversation(); await flushPromises()
  expect(body().element.textContent).toBe('顾遥说沈禾在门口。')
  expect(body().findAll('mark').map(mark => mark.text())).toEqual(['顾遥', '沈禾'])
})
