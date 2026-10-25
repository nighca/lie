// @vitest-environment node
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'

import { readOfficialCases } from '../src/application/officialCases'
import { validateOfficialDirectory } from '../build/official-cases'
import { game } from './helpers'

function entry(id: string) { return { ...game, id, summary: `简介 ${id}` } }
describe('official single-file discovery and numeric ordering', () => {
  it('sorts by numeric prefix including gaps and >99, without altering internal IDs', () => {
    const sources = { '100-last.json': entry('last'), '10-ten.json': entry('ten'), '02-two.json': entry('two') }
    expect(readOfficialCases(sources).map(({ sequence, game }) => [sequence, game.id])).toEqual([[2, 'two'], [10, 'ten'], [100, 'last']])
  })
  it.each(['one-case.json', '1-case.json', '00-case.json', '9007199254740992-case.json'])('rejects invalid filename %s', filename => {
    expect(() => readOfficialCases({ [filename]: entry('case') })).toThrow()
  })
  it('rejects duplicate numeric prefixes, duplicate IDs, mismatches and missing summaries', () => {
    expect(() => readOfficialCases({ '01-a.json': entry('a'), '001-b.json': entry('b') })).toThrow('duplicate numeric prefix')
    expect(() => readOfficialCases({ '01-a.json': entry('a'), '02-a.json': entry('a') })).toThrow('duplicate case ID')
    expect(() => readOfficialCases({ '01-a.json': entry('b') })).toThrow('filename ID')
    expect(() => readOfficialCases({ '01-a.json': { ...entry('a'), summary: '' } })).toThrow('summary is required')
  })
  it('the actual filesystem build validator discovers an additional numbered JSON alone', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'lie-official-'))
    try {
      await writeFile(join(directory, '02-two.json'), JSON.stringify(entry('two')))
      expect((await validateOfficialDirectory(directory)).map(({ game }) => game.id)).toEqual(['two'])
      await writeFile(join(directory, '100-added.json'), JSON.stringify(entry('added')))
      const cases = await validateOfficialDirectory(directory)
      expect(cases.map(({ game }) => game.id)).toEqual(['two', 'added'])
      expect(cases[1].game).toEqual(entry('added'))
    } finally { await rm(directory, { recursive: true, force: true }) }
  })
})
