import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'

import App from '../src/App.vue'
import { game, setup } from './helpers'

it('moves the active character name to the transcript heading and follows selection', async () => {
  const names = ['这是一位名字比较长的中文人物', 'AlexandertheVeryLongUnbrokenCharacterName']
  const { controller } = setup({ now: () => 0, setTimeout, clearTimeout }, { ...game, characters: game.characters.map((person, index) => ({ ...person, name: names[index] })) })
  const wrapper = mount(App, { props: { controller, characterPresets: [], demo: true } })
  try {
    await controller.load('test'); controller.start(); await wrapper.vm.$nextTick()
    expect(wrapper.get('.conversation-copy h2').text()).toBe(`${names[0]}的询问记录`)
    expect(wrapper.get('.character-stage').find('h2, .stage-caption').exists()).toBe(false)
    expect(wrapper.findAll('.character-list strong').map((name) => name.text())).toEqual(names)
    await wrapper.findAll('.character-list button')[1].trigger('click')
    expect(wrapper.get('.conversation-copy h2').text()).toBe(`${names[1]}的询问记录`)
    expect(wrapper.get('.character-stage').attributes('aria-label')).toBe(`${names[1]}的人物形象`)
    expect(wrapper.get('.conversation-copy').text()).toContain('还没有对话')
  } finally { wrapper.unmount(); controller.dispose() }
})
