import { readFileSync } from 'node:fs'
import { URL as NodeURL } from 'node:url'

import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductHeader } from '../src'

const motionChanges = new Set<() => void>()
beforeEach(() => {
  motionChanges.clear()
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: false,
    addEventListener(_event: string, listener: () => void) { motionChanges.add(listener) },
    removeEventListener(_event: string, listener: () => void) { motionChanges.delete(listener) },
  })))
})
afterEach(() => vi.unstubAllGlobals())

describe('product header', () => {
  it('renders the shared brand and emits caller-owned home navigation', async () => {
    const wrapper = mount(ProductHeader)
    const link = wrapper.get('a')
    expect(link.attributes('href')).toBe('/')
    expect(link.attributes('aria-label')).toBe('LIE 首页')
    expect(link.get('span').text()).toBe('语音推理')
    const svg = link.get('svg')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('focusable')).toBe('false')
    expect(link.get('span').classes()).toContain('lie-handwritten-underline')
    const original = new DOMParser().parseFromString(readFileSync(new NodeURL('../../../design/brand/logo.svg', import.meta.url), 'utf8'), 'image/svg+xml')
    expect(svg.attributes('viewBox')).toBe(original.documentElement.getAttribute('viewBox'))
    expect(svg.findAll('path, circle').map(node => Object.fromEntries(Object.entries(node.attributes()).filter(([name]) => !name.startsWith('data-v-'))))).toEqual(
      [...original.querySelectorAll('path, circle')].map(node => Object.fromEntries([...node.attributes].map(attribute => [attribute.name, attribute.value]))),
    )
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


it('plays once per entry or focus, never restarts for a mouse click, and resets on leaving', async () => {
  const wrapper = mount(ProductHeader)
  const link = wrapper.get('a'), svg = wrapper.get('svg')
  const active = () => svg.classes().includes('lie-product-header__logo--playing')
  expect(active()).toBe(false)
  await link.trigger('mouseenter')
  expect(active()).toBe(true)
  await link.trigger('focus')
  expect(active()).toBe(true)
  await svg.trigger('animationend')
  expect(active()).toBe(false)
  await link.trigger('pointerdown', { pointerType: 'mouse' })
  expect(active()).toBe(false)
  await link.trigger('focus')
  expect(active()).toBe(true)
  await link.trigger('blur')
  expect(active()).toBe(false)
  await link.trigger('mouseenter')
  await link.trigger('pointerleave')
  expect(active()).toBe(false)
  wrapper.unmount()
})

it('supports touch without delaying navigation and cancels dragged or cancelled touches', async () => {
  const wrapper = mount(ProductHeader)
  const link = wrapper.get('a'), svg = wrapper.get('svg')
  await link.trigger('pointerdown', { pointerType: 'touch' })
  expect(svg.classes()).toContain('lie-product-header__logo--playing')
  await link.trigger('click')
  expect(wrapper.emitted('navigateHome')).toHaveLength(1)
  await link.trigger('pointercancel')
  expect(svg.classes()).not.toContain('lie-product-header__logo--playing')
  await link.trigger('pointerdown', { pointerType: 'touch' })
  await link.trigger('pointerleave')
  expect(svg.classes()).not.toContain('lie-product-header__logo--playing')
  wrapper.unmount()
})

it('resets when motion preference changes and releases its listener on unmount', async () => {
  const wrapper = mount(ProductHeader)
  await wrapper.get('a').trigger('focus')
  expect(wrapper.get('svg').classes()).toContain('lie-product-header__logo--playing')
  expect(motionChanges.size).toBe(1)
  for (const listener of motionChanges) listener()
  await wrapper.vm.$nextTick()
  expect(wrapper.get('svg').classes()).not.toContain('lie-product-header__logo--playing')
  await wrapper.get('a').trigger('mouseenter')
  wrapper.unmount()
  expect(motionChanges.size).toBe(0)
})
