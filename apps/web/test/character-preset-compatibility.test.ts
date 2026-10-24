// @vitest-environment node
import { describe, expect, it } from 'vitest'

import source from '../../../design/character-presets/manifest.json'
import { draftGame, draftIssues, DRAFT_KEY, loadDraft, saveDraft } from '../src/editor/draft'
import { decodeSharedGame, encodeGameLink } from '../src/editor/share'
import { readCharacterPresets } from '../src/presentation/characterPresets'
import manifest from '../public/appearances/manifest.json'
import legacyDrafts from './fixtures/legacy-preset-drafts.json'
import legacyShare from './fixtures/legacy-preset-share.json'

const presets = readCharacterPresets(manifest)

describe('persisted preset references from before the naming migration', () => {
  it.each(Object.entries(legacyDrafts))('restores and saves the original %s draft without losing serialized fields', (_name, text) => {
    let stored = text
    const storage = { getItem: (key: string) => key === DRAFT_KEY ? stored : null, setItem: (key: string, value: string) => { expect(key).toBe('lie-editor-draft'); stored = value } }
    const draft = loadDraft(storage)!
    expect(draft).toEqual(JSON.parse(text))
    saveDraft(storage, draft)
    expect(JSON.parse(stored)).toEqual(JSON.parse(text))
  })
  it('keeps missing and retired preset references editable and locates their selector', () => {
    for (const text of [legacyDrafts.incomplete, legacyDrafts.invalidPreset]) {
      const draft = loadDraft({ getItem: () => text })!
      expect(draftIssues(draft, presets)).toContainEqual(expect.objectContaining({ field: 'preset', characterId: draft.characters[0].id }))
    }
  })
  it('opens the baseline gzip link and re-shares the same story and voice references', async () => {
    const game = await decodeSharedGame(new URL(legacyShare.link).hash, presets)
    expect(game).toEqual(legacyShare.game)
    expect(draftGame(loadDraft({ getItem: () => legacyDrafts.complete })!, presets)).toEqual(game)
    const shared = await encodeGameLink(game, 'https://lie.example')
    expect(await decodeSharedGame(new URL(shared).hash, presets)).toEqual(game)
    const gzip = Buffer.from(new URL(shared).hash.slice('#game='.length), 'base64url')
    const text = await new Response(new Blob([gzip]).stream().pipeThrough(new DecompressionStream('gzip'))).text()
    expect(JSON.parse(text)).toEqual(legacyShare.game)
    expect(game.characters.map((person) => presets.find((preset) => preset.id === person.appearanceId)?.voiceId)).toEqual(game.characters.map((person) => source.find((preset) => preset.id === person.appearanceId)?.voiceId))
  })
})
