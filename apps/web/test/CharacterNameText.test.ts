import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CharacterNameText from '../src/presentation/CharacterNameText.vue'

describe('CharacterNameText', () => {
  it('preserves exact author text and renders HTML and special-character names as text', () => {
    const text = '  <b>A.*[x]?</b> & 沈禾\r\n\n👩🏽‍🔬\t沈禾  '
    const wrapper = mount(CharacterNameText, { props: { text, characters: [
      { name: 'A.*[x]?', accent: '#ff0' }, { name: '沈禾', accent: null },
    ] } })
    try {
      expect(wrapper.element.textContent).toBe(text)
      expect(wrapper.findAll('mark').map((mark) => mark.element.textContent)).toEqual(['A.*[x]?', '沈禾', '沈禾'])
      expect(wrapper.find('b').exists()).toBe(false)
      expect(wrapper.find('button, a, input, [tabindex], [role]').exists()).toBe(false)
      expect(wrapper.get('mark').attributes('style')).toContain('--character-name-accent: #ff0')
      expect(wrapper.findAll('mark')[1].element.style.getPropertyValue('--character-name-accent')).toBe('')
    } finally { wrapper.unmount() }
  })

  it('reacts to text, names and accents, including conflict and fallback updates', async () => {
    const wrapper = mount(CharacterNameText, { props: {
      text: '沈禾等顾遥', characters: [{ name: '沈禾', accent: '#ff0' }],
    } })
    try {
      await wrapper.setProps({ text: '顾遥找沈禾', characters: [{ name: '顾遥', accent: '#f00' }] })
      expect(wrapper.element.textContent).toBe('顾遥找沈禾')
      expect(wrapper.findAll('mark').map((mark) => mark.text())).toEqual(['顾遥'])
      expect(wrapper.get('mark').element.style.getPropertyValue('--character-name-accent')).toBe('#f00')
      await wrapper.setProps({ characters: [{ name: '顾遥', accent: null }] })
      expect(wrapper.get('mark').element.style.getPropertyValue('--character-name-accent')).toBe('')
      await wrapper.setProps({ characters: [
        { name: '顾遥', accent: '#f00' }, { name: '顾遥', accent: '#00f' }, { name: '顾遥', accent: '#00f' },
      ] })
      expect(wrapper.get('mark').element.style.getPropertyValue('--character-name-accent')).toBe('')
      await wrapper.setProps({ characters: [{ name: '顾遥', accent: '#00f' }] })
      expect(wrapper.get('mark').element.style.getPropertyValue('--character-name-accent')).toBe('#00f')
    } finally { wrapper.unmount() }
  })

  it('ignores empty and whitespace-only names while keeping literal spacing in other names', () => {
    const text = '  沈禾  沈禾 '
    const wrapper = mount(CharacterNameText, { props: { text, characters: [
      { name: '', accent: '#f00' }, { name: '  ', accent: '#f00' },
      { name: '\t\n', accent: '#f00' }, { name: ' 沈禾 ', accent: null },
    ] } })
    try {
      expect(wrapper.element.textContent).toBe(text)
      expect(wrapper.findAll('mark').map((mark) => mark.element.textContent)).toEqual([' 沈禾 ', ' 沈禾 '])
    } finally { wrapper.unmount() }
  })
})
