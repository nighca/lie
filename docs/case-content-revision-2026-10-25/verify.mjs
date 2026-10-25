import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const base = '3aaa329540dc53bfbc3a95adf66191e9c1576904'
const root = new URL('../../', import.meta.url)
const result = []
for (const id of ['empty-medal-box', 'duck-finale', 'salt-sugar-mixup']) {
  const path = `content/games/${id}.json`
  const previous = JSON.parse(execFileSync('git', ['show', `${base}:${path}`], { cwd: root, encoding: 'utf8' }))
  const source = readFileSync(new URL(path, root))
  const current = JSON.parse(source)
  assert.deepEqual(source, readFileSync(new URL(`apps/web/public/games/${id}.json`, root)))
  assert.ok(current.background.length < previous.background.length)
  const changedProfiles = []
  const normalized = structuredClone(current)
  normalized.background = previous.background
  for (let index = 0; index < current.characters.length; index++) {
    const character = current.characters[index]
    const before = previous.characters[index]
    if (character.profile !== before.profile) {
      changedProfiles.push(character.id)
      normalized.characters[index].profile = before.profile
    }
  }
  assert.deepEqual(changedProfiles, id === 'duck-finale' ? ['he'] : id === 'salt-sugar-mixup' ? ['tao'] : [])
  assert.deepEqual(normalized, previous)
  result.push({ id, beforeCharacters: previous.background.length, afterCharacters: current.background.length, changedProfiles, compatibilityCopyByteEqual: true, allOtherFieldsUnchanged: true })
}
console.log(JSON.stringify({ base, cases: result }, null, 2))
