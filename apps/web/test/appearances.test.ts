import { describe, expect, it } from 'vitest'

import { readAppearances } from '../src/presentation/appearances'
import { game, setup } from './helpers'

function preset(id: string) {
  return { id, name: `形象${id}`, avatar: '/avatar.png', portrait: '/portrait.png', accent: '#123456' }
}

describe('appearance voice configuration', () => {
  it('normalizes legacy, explicit default and opaque provider voices', () => {
    const appearances = readAppearances([
      preset('legacy'),
      { ...preset('default'), voiceId: null },
      { ...preset('configured'), voiceId: '  vendor:voice/warm  ' },
    ])
    expect(appearances.map(({ voiceId }) => voiceId)).toEqual([null, null, 'vendor:voice/warm'])
  })

  it.each(['', '  \t ', 10, true, {}, []])('rejects an invalid configured voice %j', (voiceId) => {
    expect(() => readAppearances([{ ...preset('invalid'), voiceId }])).toThrow('Invalid appearance voiceId')
  })

  it('fixes the selected appearance voice for one scope and uses the new appearance after switching', async () => {
    const appearances = readAppearances([
      { ...preset('warm'), voiceId: 'warm-voice' },
      { ...preset('bright'), voiceId: 'bright-voice' },
    ])
    const content = { ...game, characters: game.characters.map((character, index) => ({ ...character, appearanceId: appearances[index].id })) }
    const { controller, turns } = setup(undefined, content, (id) => appearances.find((appearance) => appearance.id === id)?.voiceId ?? null)
    await controller.load('test'); controller.start(); await controller.startConversation()
    const previous = turns[0]
    expect(previous.scope.voiceId).toBe('warm-voice')
    appearances[0].voiceId = 'replacement-voice'
    expect(previous.scope.voiceId).toBe('warm-voice')
    controller.selectCharacter('two'); await controller.startConversation()
    expect(turns[1].scope.voiceId).toBe('bright-voice')
    expect(previous.closed).toBe(true)
    expect(previous.scope.isCurrent()).toBe(false)
    previous.scope.onEvent({ type: 'assistantText', text: '旧人物的迟到回答。' })
    expect(controller.getView().history).toEqual([])
    controller.dispose()
  })

  it('reuses the same preset voice across different characters', async () => {
    const appearances = readAppearances([{ ...preset('shared'), voiceId: 'shared-voice' }])
    const content = { ...game, characters: game.characters.map((character) => ({ ...character, appearanceId: 'shared' })) }
    const { controller, turns } = setup(undefined, content, (id) => appearances.find((appearance) => appearance.id === id)?.voiceId ?? null)
    await controller.load('test'); controller.start(); await controller.startConversation()
    controller.selectCharacter('two'); await controller.startConversation()
    expect(turns.map(({ scope }) => scope.voiceId)).toEqual(['shared-voice', 'shared-voice'])
    controller.dispose()
  })

  it('keeps provider defaults for null and unknown appearances', async () => {
    const appearances = readAppearances([{ ...preset('known'), voiceId: 'known-voice' }])
    const { controller, turns } = setup(undefined, game, (id) => appearances.find((appearance) => appearance.id === id)?.voiceId ?? null)
    await controller.load('test'); controller.start(); await controller.startConversation()
    controller.selectCharacter('two'); await controller.startConversation()
    expect(turns.map(({ scope }) => scope.voiceId)).toEqual([null, null])
    controller.dispose()
  })
})

describe('appearance state portraits', () => {
  it('normalizes absent, null and partial state sets while retaining the default portrait', () => {
    const appearances = readAppearances([
      preset('legacy'),
      { ...preset('default'), portraits: null },
      { ...preset('partial'), portraits: { listening: '/listen.png', speaking: null } },
    ])
    expect(appearances.map(({ portraits }) => portraits)).toEqual([
      { listening: null, waiting: null, speaking: null },
      { listening: null, waiting: null, speaking: null },
      { listening: '/listen.png', waiting: null, speaking: null },
    ])
    expect(appearances[2].portrait).toBe('/portrait.png')
  })

  it.each([false, 'image.png', 1, []])('rejects a non-object state set %j', (portraits) => {
    expect(() => readAppearances([{ ...preset('invalid'), portraits }])).toThrow('Invalid appearance portraits')
  })

  it.each(['listening', 'waiting', 'speaking'])('rejects invalid %s URLs', (state) => {
    for (const value of ['', '  ', 1, false, {}, []]) {
      expect(() => readAppearances([{ ...preset('invalid'), portraits: { [state]: value } }])).toThrow('Invalid appearance portrait')
    }
  })
})

describe('appearance display names', () => {
  it('reads authored Chinese names without deriving labels from IDs', () => {
    expect(readAppearances([{ ...preset('unseen-id'), name: '新来的向导' }])[0].name).toBe('新来的向导')
  })

  it.each([null, '', '  ', 1, false, {}, []])('rejects an invalid display name %j', (name) => {
    expect(() => readAppearances([{ ...preset('invalid'), name }])).toThrow('Invalid appearance name')
  })

  it('requires a display name in the catalog contract', () => {
    expect(() => readAppearances([{ id: 'missing', avatar: '/avatar.png', portrait: '/portrait.png', accent: '#123456' }])).toThrow('Invalid appearance name')
  })
})
