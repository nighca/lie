import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import { ProductHeader } from '../src'

describe('product header', () => {
  it('renders the shared brand and emits caller-owned home navigation', async () => {
    const wrapper = mount(ProductHeader)
    const link = wrapper.get('a')
    expect(link.attributes('href')).toBe('/')
    expect(link.attributes('aria-label')).toBe('LIE 首页')
    expect(link.text()).toBe('语音推理')
    expect(link.get('img').attributes('src')).toBe('/brand/logo.svg')
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    link.element.dispatchEvent(click)
    expect(click.defaultPrevented).toBe(true)
    expect(wrapper.emitted('navigateHome')).toHaveLength(1)
    wrapper.unmount()
  })

  it('renders the supplied page title, notice and actionable controls without owning their behavior', async () => {
    const accuse = vi.fn()
    const wrapper = mount(ProductHeader, {
      props: { title: '测试案件' },
      slots: { notice: '<p>演示模式</p>', actions: () => h('button', { onClick: accuse }, '最终指认') },
    })
    expect(wrapper.get('h1').text()).toBe('测试案件')
    expect(wrapper.text()).toContain('演示模式')
    await wrapper.get('button').trigger('click')
    expect(accuse).toHaveBeenCalledOnce()
    wrapper.unmount()
  })
})
