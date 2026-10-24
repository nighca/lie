import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createTranscriptReveal } from '../src/presentation/transcriptReveal'
import type { RevealMessage, RevealRow } from '../src/presentation/transcriptReveal'

beforeEach(() => vi.useFakeTimers())
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })
function setup() {
  let rows: RevealRow<RevealMessage>[] = []
  const reveal = createTranscriptReveal<RevealMessage>((value) => { rows = value })
  return { reveal, rows: () => rows }
}
const answer = (id: string, text: string, pending = false): RevealMessage => ({ id, speaker: '人物', text, pending })

describe('transcript presentation reveal', () => {
  it.each([40, 60])('gives a %i-character answer readable pacing without exceeding bounded catchup', (length) => {
    const { reveal, rows } = setup()
    const text = '字'.repeat(length)
    reveal.update([], true)
    reveal.update([answer('reply', text)], true)
    vi.advanceTimersByTime(800)
    expect(rows()[0].text.length).toBeGreaterThan(0)
    expect(rows()[0].text.length).toBeLessThan(length)
    let elapsed = 800
    while (rows()[0].text !== text && elapsed < 2400) {
      vi.advanceTimersByTime(50)
      elapsed += 50
    }
    expect(elapsed).toBeGreaterThanOrEqual(1800)
    expect(rows()[0].text).toBe(text)
    expect(vi.getTimerCount()).toBe(0)
    reveal.dispose()
  })

  it('shows mounted history and user messages immediately, revealing only newly received answers', () => {
    const { reveal, rows } = setup()
    const history = answer('old', '已有历史')
    reveal.update([history], true)
    expect(rows()[0].text).toBe('已有历史')
    const question = { ...answer('user', '玩家问题'), mine: true }
    reveal.update([history, question], true)
    expect(rows()[1].text).toBe('玩家问题')
    const response = answer('reply', '新的角色回复，应当逐步出现。')
    reveal.update([history, question, response], true)
    expect(rows()[2].text).toBe('')
    vi.advanceTimersByTime(64)
    expect(rows()[2].text.length).toBeGreaterThan(0)
    expect(rows()[2].text.length).toBeLessThan(response.text.length)
    vi.advanceTimersByTime(2400)
    expect(rows()[2].text).toBe(response.text)
    expect(vi.getTimerCount()).toBe(0)
    reveal.dispose()
  })

  it('continues a streaming pending answer across final ID replacement without replacing its row or rewinding', () => {
    const { reveal, rows } = setup()
    reveal.update([], true)
    reveal.update([answer('pending', '这段角色回复还在继续', true)], true)
    vi.advanceTimersByTime(64)
    const partial = rows()[0].text
    const key = rows()[0].key
    reveal.update([answer('pending', '这段角色回复还在继续，现在又收到更多文字。', true)], true)
    expect(rows()[0].text).toBe(partial)
    reveal.update([answer('final-id', '这段角色回复还在继续，现在又收到更多文字。')], true)
    expect(rows()[0].key).toBe(key)
    expect(rows()[0].text).toBe(partial)
    vi.advanceTimersByTime(2400)
    expect(rows()[0].text).toBe('这段角色回复还在继续，现在又收到更多文字。')
    reveal.dispose()
  })

  it('caps catchup at the original 2400ms deadline despite continuously arriving chunks and never queues old rounds', () => {
    const { reveal, rows } = setup()
    reveal.update([], true)
    let text = '长'.repeat(400)
    reveal.update([answer('stream', text, true)], true)
    for (let i = 0; i < 23; i++) {
      vi.advanceTimersByTime(100)
      text += '后续文字'.repeat(20)
      reveal.update([answer('stream', text, true)], true)
    }
    vi.advanceTimersByTime(100)
    expect(rows()[0].text).toBe(text)
    reveal.update([answer('stream', text), answer('new', '下一轮新回复')], true)
    expect(rows()[0].text).toBe(text)
    expect(rows()[1].text).toBe('')
    vi.advanceTimersByTime(50)
    expect(rows()[1].text.length).toBeGreaterThan(0)
    reveal.dispose()
  })

  it('finishes an older unfinished answer as soon as a newer round arrives', () => {
    const { reveal, rows } = setup()
    reveal.update([], true)
    const old = answer('old', '旧回复'.repeat(100))
    reveal.update([old], true)
    vi.advanceTimersByTime(50)
    expect(rows()[0].text.length).toBeLessThan(old.text.length)
    reveal.update([old, { ...answer('user', '新问题'), mine: true }, answer('new', '新回复正在展示')], true)
    expect(rows()[0].text).toBe(old.text)
    expect(rows()[2].text).toBe('')
    vi.advanceTimersByTime(50)
    expect(rows()[2].text.length).toBeGreaterThan(0)
    reveal.dispose()
  })

  it('does not split emoji families, flags, or combining-character graphemes', () => {
    const { reveal, rows } = setup()
    const clusters = ['👩‍👩‍👦', '🇨🇳', 'é', '好']
    reveal.update([], true)
    reveal.update([answer('emoji', clusters.join(''))], true)
    for (let i = 1; i <= clusters.length; i++) {
      vi.advanceTimersByTime(50)
      expect(rows()[0].text).toBe(clusters.slice(0, i).join(''))
    }
    reveal.dispose()
  })

  it('flushes received text on interrupt or stop, isolates disposal and does not animate corrections', () => {
    const { reveal, rows } = setup()
    reveal.update([], true)
    reveal.update([answer('pending', '收到的完整转写', true)], true)
    reveal.update([{ ...answer('final', '收到的完整转写'), interrupted: true }], true)
    expect(rows()[0].text).toBe('收到的完整转写')
    expect(rows()[0].message.interrupted).toBe(true)
    reveal.update([answer('final', '收到的完整转写'), answer('second', '停止时也必须保留')], true)
    reveal.update([answer('final', '收到的完整转写'), answer('second', '停止时也必须保留')], false)
    expect(rows()[1].text).toBe('停止时也必须保留')
    expect(vi.getTimerCount()).toBe(0)
    reveal.update([answer('final', '上游修正文字')], true)
    expect(rows()[0].text).toBe('上游修正文字')
    reveal.update([answer('final', '上游修正文字'), answer('third', '旧局待展示')], true)
    reveal.dispose()
    expect(vi.getTimerCount()).toBe(0)
    const snapshot = rows()
    vi.advanceTimersByTime(1000)
    expect(rows()).toBe(snapshot)
    const fresh = setup()
    fresh.reveal.update([answer('third', '新挂载历史')], true)
    expect(fresh.rows()[0].text).toBe('新挂载历史')
    fresh.reveal.dispose()
  })
  it('degrades to complete text when the browser has no grapheme segmenter', async () => {
    vi.stubGlobal('Intl', Object.create(Intl, { Segmenter: { value: undefined } }))
    vi.resetModules()
    const fallback = await import('../src/presentation/transcriptReveal')
    let text = ''
    const reveal = fallback.createTranscriptReveal<RevealMessage>((rows) => { text = rows.at(-1)?.text ?? '' })
    reveal.update([], true)
    reveal.update([answer('emoji', '👩‍👩‍👦é')], true)
    expect(text).toBe('👩‍👩‍👦é')
    expect(vi.getTimerCount()).toBe(0)
    reveal.dispose()
  })

})
