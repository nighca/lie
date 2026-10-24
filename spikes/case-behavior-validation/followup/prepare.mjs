import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { matrix } from './matrix.mjs'
import { hash } from './settings.mjs'

// This file is offline only: no provider, key, agent, device, or socket access.
if (process.argv.length !== 2) throw new Error('Offline preparation accepts no execution arguments')
const require = createRequire(process.env.LIE_DEPENDENCY_ROOT ?? new URL('../../../package.json', import.meta.url))
const ts = require('typescript')
const temporary = new URL('./tmp/', import.meta.url)
await mkdir(temporary, { recursive: true })
for (const name of ['content', 'session', 'context']) {
  const source = await readFile(new URL(`../../../packages/game-core/src/${name}.ts`, import.meta.url), 'utf8')
  const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText.replace(/from '([.][^']+)'/g, "from '$1.mjs'")
  await writeFile(new URL(`${name}.mjs`, temporary), output)
}
const { validateGame } = await import(new URL('content.mjs', temporary))
const { buildCharacterContext } = await import(new URL('context.mjs', temporary))
assert.equal(matrix.length, 12)
assert.equal(new Set(matrix.map(row => row.id)).size, matrix.length)
const games = new Map()
for (const id of new Set(matrix.map(row => row.gameId))) {
  games.set(id, validateGame(JSON.parse(await readFile(new URL(`../../../content/games/${id}.json`, import.meta.url), 'utf8'))))
}
const prepared = matrix.map(row => {
  const game = games.get(row.gameId)
  assert.ok(game)
  const history = [{ id: row.id, role: 'user', text: row.question, at: 0, interrupted: false }]
  const context = buildCharacterContext(game, row.characterId, history)
  const character = game.characters.find(item => item.id === row.characterId)
  assert.equal(context.profile, character.profile)
  assert.equal(context.history.length, 1)
  assert.equal('ending' in context, false)
  for (const other of game.characters.filter(item => item.id !== row.characterId)) assert.ok(!context.systemPrompt.includes(other.profile))
  assert.ok(Buffer.byteLength(JSON.stringify(context)) < 65536)
  // Only context goes to the role tool. Expected answers and verdict criteria stay local.
  return { id: row.id, gameId: row.gameId, characterId: row.characterId, question: row.question, context }
})
await writeFile(new URL('prepared-contexts.json', temporary), JSON.stringify(prepared, null, 2))
const sourceFiles = ['packages/game-core/src/content.ts', 'packages/game-core/src/session.ts', 'packages/game-core/src/context.ts', 'content/games/duck-finale.json', 'content/games/salt-sugar-mixup.json', 'spikes/case-behavior-validation/matrix.mjs', 'spikes/case-behavior-validation/followup/matrix.mjs']
const hashes = Object.fromEntries(await Promise.all(sourceFiles.map(async path => [path, hash(await readFile(new URL(`../../../${path}`, import.meta.url)))])))
await writeFile(new URL('prepared-hashes.json', temporary), JSON.stringify(hashes, null, 2))
console.log(JSON.stringify({ offline: 'passed', targets: prepared.length, games: games.size, otherProfilesAndEnding: 'excluded', providerCalls: 0 }))
