// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { nextOfficialCaseSequence } from '../src/application/bundledCases'
import { prepareSubmission } from '../src/editor/submission'
import { game } from './helpers'

describe('manual official contribution', () => {
  it('exports exact game text while keeping JSON out of the GitHub URL', () => {
    const source = { ...game, title: '中文案件', background: '含有秘密的长文本'.repeat(2000) }
    const submission = prepareSubmission(source)
    expect(JSON.parse(submission.json)).toEqual(source)
    const url = new URL(submission.url)
    expect(url.origin + url.pathname).toBe('https://github.com/nighca/lie/new/main')
    expect([...url.searchParams.entries()]).toEqual([['filename', `content/games/${String(nextOfficialCaseSequence).padStart(2, '0')}-test.json`]])
    expect(submission.url.length).toBeLessThan(200)
  })
  it('requires an authored summary only for submission and suggests prefixes beyond 99', () => {
    expect(() => prepareSubmission({ ...game, summary: '' })).toThrow('案件简介')
    expect(prepareSubmission(game, 100).filename).toBe('content/games/100-test.json')
    expect(JSON.parse(prepareSubmission(game, 100).json).summary).toBe(game.summary)
  })
  it.each(['../outside', 'case/other', '案件', 'a'.repeat(101)])('rejects unsafe file identifiers %s', (id) => {
    expect(() => prepareSubmission({ ...game, id })).toThrow('文件名')
  })
})
