import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { readPageBuild } from '../build/page-version'
import PageVersion from '../src/PageVersion.vue'

beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false } },
  })
})
const directories: string[] = []
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); directories.splice(0).forEach(directory => rmSync(directory, { recursive: true, force: true })) })
function directory() { const value = mkdtempSync(join(tmpdir(), 'lie-page-version-')); directories.push(value); return value }
function git(directory: string, args: string[]) { return execFileSync('git', args, { cwd: directory, encoding: 'utf8' }).trim() }

it('identifies the actual commit and flags subsequent tracked local edits', () => {
  const cwd = directory()
  git(cwd, ['init', '--quiet'])
  writeFileSync(join(cwd, 'app.txt'), 'original')
  git(cwd, ['add', 'app.txt'])
  git(cwd, ['-c', 'user.name=Version test', '-c', 'user.email=version@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'fixture'])
  const commit = git(cwd, ['rev-parse', 'HEAD'])
  expect(readPageBuild(cwd)).toEqual({ commit, dirty: false })
  writeFileSync(join(cwd, 'app.txt'), 'changed')
  expect(readPageBuild(cwd)).toEqual({ commit, dirty: true })
})

it('honestly labels a package outside Git without inventing a commit', () => {
  const cwd = directory()
  vi.stubEnv('GIT_CEILING_DIRECTORIES', dirname(cwd))
  expect(readPageBuild(cwd)).toEqual({ commit: null, dirty: false })
})

it('keeps version information in a closed dialog until requested and exposes selectable full identity', async () => {
  const commit = '1234567abcdef1234567abcdef1234567abcdef123'
  const wrapper = mount(PageVersion, { props: { build: { commit, dirty: false }, open: false } })
  try {
    const dialog = wrapper.get('dialog').element
    expect(dialog.open).toBe(false)
    await wrapper.setProps({ open: true })
    expect(dialog.open).toBe(true)
    expect(wrapper.get('strong').text()).toBe('1234567')
    expect(wrapper.get('code').text()).toBe(commit)
    expect(wrapper.text()).toContain('仅表示当前页面的构建版本')
    await wrapper.get('[aria-label="关闭弹窗"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    await wrapper.setProps({ open: false })
    expect(dialog.open).toBe(false)
  } finally { wrapper.unmount() }
})

it('distinguishes development, unknown and modified local builds', async () => {
  const wrapper = mount(PageVersion, { props: { build: null, open: false } })
  try {
    expect(wrapper.get('strong').text()).toBe('开发版')
    await wrapper.setProps({ build: { commit: null, dirty: false } })
    expect(wrapper.get('strong').text()).toBe('未知')
    await wrapper.setProps({ build: { commit: 'abcdef1234567890', dirty: true } })
    expect(wrapper.get('strong').text()).toBe('abcdef1')
    expect(wrapper.text()).toContain('本地改动')
    expect(wrapper.text()).toContain('构建包含未提交的本地改动')
  } finally { wrapper.unmount() }
})

it('copies the full real SHA and resets feedback when reopened', async () => {
  const commit = '1234567abcdef1234567abcdef1234567abcdef123'
  const writeText = vi.fn().mockResolvedValue(null)
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  const wrapper = mount(PageVersion, { props: { build: { commit, dirty: true }, open: true } })
  try {
    await wrapper.get('.version-copy button').trigger('click')
    expect(writeText).toHaveBeenCalledWith(commit)
    expect(wrapper.get('[role="status"]').text()).toBe('已复制，口供带走。')
    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true })
    expect(wrapper.get('[role="status"]').text()).toBe('')
  } finally { wrapper.unmount() }
})

it('offers manual selection if clipboard access fails', async () => {
  vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
  const wrapper = mount(PageVersion, { props: { build: { commit: 'abcdef1234567890', dirty: false }, open: true } })
  try {
    await wrapper.get('.version-copy button').trigger('click')
    expect(wrapper.get('[role="status"]').text()).toContain('选中上方编号手动复制')
    expect(wrapper.get('code').attributes('tabindex')).toBe('0')
    await wrapper.get('dialog').trigger('cancel')
    expect(wrapper.emitted('close')).toHaveLength(1)
  } finally { wrapper.unmount() }
})
