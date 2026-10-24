import { describe, expect, it } from 'vitest'

import { readCharacterPresets } from '../src/presentation/characterPresets'
import { game, setup } from './helpers'

function preset(id: string) {
  return { id, name: `形象${id}`, avatar: '/avatar.png', portrait: '/portrait.png', accent: '#123456' }
}

describe('characterPreset voice configuration', () => {
  it('normalizes legacy, explicit default and opaque provider voices', () => {
    const characterPresets = readCharacterPresets([
      preset('legacy'),
      { ...preset('default'), voiceId: null },
      { ...preset('configured'), voiceId: '  vendor:voice/warm  ' },
    ])
    expect(characterPresets.map(({ voiceId }) => voiceId)).toEqual([null, null, 'vendor:voice/warm'])
  })

  it.each(['', '  \t ', 10, true, {}, []])('rejects an invalid configured voice %j', (voiceId) => {
    expect(() => readCharacterPresets([{ ...preset('invalid'), voiceId }])).toThrow('Invalid characterPreset voiceId')
  })

  it('fixes the selected characterPreset voice for one scope and uses the new characterPreset after switching', async () => {
    const characterPresets = readCharacterPresets([
      { ...preset('warm'), voiceId: 'warm-voice' },
      { ...preset('bright'), voiceId: 'bright-voice' },
    ])
    const content = { ...game, characters: game.characters.map((character, index) => ({ ...character, appearanceId: characterPresets[index].id })) }
    const { controller, turns } = setup(undefined, content, (id) => characterPresets.find((characterPreset) => characterPreset.id === id)?.voiceId ?? null)
    await controller.load('test'); controller.start(); await controller.startConversation()
    const previous = turns[0]
    expect(previous.scope.voiceId).toBe('warm-voice')
    characterPresets[0].voiceId = 'replacement-voice'
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
    const characterPresets = readCharacterPresets([{ ...preset('shared'), voiceId: 'shared-voice' }])
    const content = { ...game, characters: game.characters.map((character) => ({ ...character, appearanceId: 'shared' })) }
    const { controller, turns } = setup(undefined, content, (id) => characterPresets.find((characterPreset) => characterPreset.id === id)?.voiceId ?? null)
    await controller.load('test'); controller.start(); await controller.startConversation()
    controller.selectCharacter('two'); await controller.startConversation()
    expect(turns.map(({ scope }) => scope.voiceId)).toEqual(['shared-voice', 'shared-voice'])
    controller.dispose()
  })

  it('keeps provider defaults for null and unknown characterPresets', async () => {
    const characterPresets = readCharacterPresets([{ ...preset('known'), voiceId: 'known-voice' }])
    const { controller, turns } = setup(undefined, game, (id) => characterPresets.find((characterPreset) => characterPreset.id === id)?.voiceId ?? null)
    await controller.load('test'); controller.start(); await controller.startConversation()
    controller.selectCharacter('two'); await controller.startConversation()
    expect(turns.map(({ scope }) => scope.voiceId)).toEqual([null, null])
    controller.dispose()
  })
})

describe('characterPreset state portraits', () => {
  it('normalizes absent, null and partial state sets while retaining the default portrait', () => {
    const characterPresets = readCharacterPresets([
      preset('legacy'),
      { ...preset('default'), portraits: null },
      { ...preset('partial'), portraits: { listening: '/listen.png', speaking: null } },
    ])
    expect(characterPresets.map(({ portraits }) => portraits)).toEqual([
      { listening: null, waiting: null, speaking: null },
      { listening: null, waiting: null, speaking: null },
      { listening: '/listen.png', waiting: null, speaking: null },
    ])
    expect(characterPresets[2].portrait).toBe('/portrait.png')
  })

  it.each([false, 'image.png', 1, []])('rejects a non-object state set %j', (portraits) => {
    expect(() => readCharacterPresets([{ ...preset('invalid'), portraits }])).toThrow('Invalid characterPreset portraits')
  })

  it.each(['listening', 'waiting', 'speaking'])('rejects invalid %s URLs', (state) => {
    for (const value of ['', '  ', 1, false, {}, []]) {
      expect(() => readCharacterPresets([{ ...preset('invalid'), portraits: { [state]: value } }])).toThrow('Invalid characterPreset portrait')
    }
  })
})

describe('characterPreset display names', () => {
  it('reads authored Chinese names without deriving labels from IDs', () => {
    expect(readCharacterPresets([{ ...preset('unseen-id'), name: '新来的向导' }])[0].name).toBe('新来的向导')
  })

  it.each([null, '', '  ', 1, false, {}, []])('rejects an invalid display name %j', (name) => {
    expect(() => readCharacterPresets([{ ...preset('invalid'), name }])).toThrow('Invalid characterPreset name')
  })

  it('requires a display name in the catalog contract', () => {
    expect(() => readCharacterPresets([{ id: 'missing', avatar: '/avatar.png', portrait: '/portrait.png', accent: '#123456' }])).toThrow('Invalid characterPreset name')
  })
})


describe('optional characterPreset animation', () => {
  it('keeps static characterPresets and resolves an animated characterPreset in one catalog', () => {
    const values = readCharacterPresets([preset('static'), { ...preset('moving'), animation: '/appearances/moving/animation/package.json' }])
    expect(values.map(value => value.animation)).toEqual([null, '/appearances/moving/animation/package.json'])
  })
  it.each(['', 'https://example.net/animation/package.json', '/appearances/other/animation/package.json', 2, {}])('rejects invalid animation references %j', animation => {
    expect(() => readCharacterPresets([{ ...preset('moving'), animation }])).toThrow('Invalid characterPreset animation')
  })
})
