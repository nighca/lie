import { describe, expect, it } from 'vitest'

import { splitCharacterNames } from '../src/presentation/characterNames'

describe('character names', () => {
  it('marks every occurrence of multiple names and preserves surrounding text', () => {
    expect(splitCharacterNames('沈禾找顾遥，沈禾等顾遥。', [
      { name: '沈禾', accent: '#ff0' }, { name: '顾遥', accent: '#f00' },
    ])).toEqual([
      { text: '沈禾', highlighted: true, accent: '#ff0' },
      { text: '找', highlighted: false, accent: null },
      { text: '顾遥', highlighted: true, accent: '#f00' },
      { text: '，', highlighted: false, accent: null },
      { text: '沈禾', highlighted: true, accent: '#ff0' },
      { text: '等', highlighted: false, accent: null },
      { text: '顾遥', highlighted: true, accent: '#f00' },
      { text: '。', highlighted: false, accent: null },
    ])
  })

  it('prioritizes longer names even when a short prefix is listed first', () => {
    const segments = splitCharacterNames('小陈和小陈拓找陈拓', [
      { name: '小陈', accent: 'short' }, { name: '陈拓', accent: 'suffix' }, { name: '小陈拓', accent: 'long' },
    ])
    expect(segments.filter((part) => part.highlighted).map((part) => [part.text, part.accent])).toEqual([
      ['小陈', 'short'], ['小陈拓', 'long'], ['陈拓', 'suffix'],
    ])
    expect(segments.map((part) => part.text).join('')).toBe('小陈和小陈拓找陈拓')
  })

  it('reserves a longer match before a shorter match starting earlier', () => {
    const segments = splitCharacterNames('甲乙丙丁', [
      { name: '甲乙', accent: 'short' }, { name: '乙丙丁', accent: 'long' },
    ])
    expect(segments).toEqual([
      { text: '甲', highlighted: false, accent: null },
      { text: '乙丙丁', highlighted: true, accent: 'long' },
    ])
  })

  it('treats regex metacharacters and HTML as literal text', () => {
    const text = '<b>A.*[x]?</b> A.*[x]? <img src=x onerror=alert(1)>'
    const segments = splitCharacterNames(text, [{ name: 'A.*[x]?', accent: null }, { name: '<b>', accent: 'blue' }])
    expect(segments.filter((part) => part.highlighted).map((part) => part.text)).toEqual(['<b>', 'A.*[x]?', 'A.*[x]?'])
    expect(segments.map((part) => part.text).join('')).toBe(text)
  })

  it('handles empty text, empty names and absent names', () => {
    expect(splitCharacterNames('', [{ name: '', accent: null }])).toEqual([])
    expect(splitCharacterNames('空白人物', [{ name: '', accent: 'blue' }, { name: ' \t\n', accent: 'red' }])).toEqual([{ text: '空白人物', highlighted: false, accent: null }])
    expect(splitCharacterNames(' \t\n', [{ name: ' \t\n', accent: 'red' }])).toEqual([{ text: ' \t\n', highlighted: false, accent: null }])
    expect(splitCharacterNames('无人', [])).toEqual([{ text: '无人', highlighted: false, accent: null }])
  })

  it.each([
    [['blue', 'blue'], 'blue'],
    [['blue', 'red'], null],
    [['blue', null], null],
    [[null, 'blue'], null],
    [['blue', 'red', 'red'], null],
    [['blue', 'red', 'blue'], null],
    [['blue', 'red', null, 'blue'], null],
    [[null, null], null],
  ] as const)('resolves duplicate-name accents %s to %s', (accents, expected) => {
    expect(splitCharacterNames('同名', accents.map((accent) => ({ name: '同名', accent })))).toEqual([
      { text: '同名', highlighted: true, accent: expected },
    ])
  })

  it('preserves whitespace and Unicode without normalizing names or author text', () => {
    const text = '  沈禾\r\n\n👩🏽‍🔬与 e\u0301 和 é\t 沈禾  '
    const segments = splitCharacterNames(text, [
      { name: ' 沈禾 ', accent: 'spaced' }, { name: '沈禾', accent: 'yellow' },
      { name: '👩🏽‍🔬', accent: 'blue' }, { name: 'e\u0301', accent: 'red' },
    ])
    expect(segments.map((part) => part.text).join('')).toBe(text)
    expect(segments.filter((part) => part.highlighted).map((part) => part.text)).toEqual(['沈禾', '👩🏽‍🔬', 'e\u0301', ' 沈禾 '])
  })
})
