// @vitest-environment node
import { expect, it } from 'vitest'
import { readBundledCase } from '../../apps/web/src/application/bundledCases'
import { createRemixDraft, draftGame, saveDraft, loadDraft } from '../../apps/web/src/editor/draft'
import { encodeGameLink, decodeSharedGame } from '../../apps/web/src/editor/share'
import sourcePresets from '../../design/character-presets/manifest.json'

it('the new canonical JSON survives existing share, remix, local draft and editor-play contracts', async () => {
  const game = readBundledCase('hackathon-old-project')
  const presets = sourcePresets.map(preset => ({ ...preset, animation: null }))
  expect(new Set(game.characters.map(character => character.name)).size).toBe(game.characters.length)
  expect(game.characters.every(character => presets.some(preset => preset.id === character.appearanceId))).toBe(true)
  const link = await encodeGameLink(game, 'https://lie.agency/')
  const shared = await decodeSharedGame(new URL(link).hash, presets)
  expect(shared).toEqual(game)
  const draft = createRemixDraft(shared)
  expect(draft.id).not.toBe(game.id)
  expect({ ...draft, id: game.id }).toEqual(game)
  let raw = ''
  saveDraft({ setItem: (_key, value) => { raw = value } }, draft)
  const restored = loadDraft({ getItem: () => raw })!
  expect(draftGame(restored, presets)).toEqual(draft)
  console.log(JSON.stringify({ gameId: game.id, shareUrlCharacters: link.length, characters: game.characters.length }))
})
