import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'

import { readPageBuild } from '../build/page-version'
import PageVersion from '../src/PageVersion.vue'

const directories: string[] = []
afterEach(() => { vi.unstubAllEnvs(); directories.splice(0).forEach(directory => rmSync(directory, { recursive: true, force: true })) })
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

it('keeps the full page commit selectable behind a native disclosure', () => {
  const commit = '1234567abcdef1234567abcdef1234567abcdef123'
  const wrapper = mount(PageVersion, { props: { build: { commit, dirty: false } } })
  expect(wrapper.get('summary').text()).toBe('页面版本 1234567')
  expect(wrapper.get('details').attributes('open')).toBeUndefined()
  expect(wrapper.get('code').text()).toBe(commit)
  expect(wrapper.text()).toContain('仅表示当前页面的构建版本')
})

it('distinguishes development, unknown and modified local builds', async () => {
  const wrapper = mount(PageVersion, { props: { build: null } })
  expect(wrapper.get('summary').text()).toBe('页面版本 开发版')
  await wrapper.setProps({ build: { commit: null, dirty: false } })
  expect(wrapper.get('summary').text()).toBe('页面版本 未知')
  await wrapper.setProps({ build: { commit: 'abcdef1234567890', dirty: true } })
  expect(wrapper.get('summary').text()).toBe('页面版本 abcdef1 · 本地改动')
})
