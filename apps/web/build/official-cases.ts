import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

import { readOfficialCases } from '../src/application/officialCases'

export async function validateOfficialDirectory(directory: string) {
  const filenames = (await readdir(directory)).filter(name => name.endsWith('.json'))
  const entries = await Promise.all(filenames.map(async name => {
    try { return [name, JSON.parse(await readFile(resolve(directory, name), 'utf8'))] as const }
    catch (error) { throw new Error(`${name}: ${error instanceof Error ? error.message : 'invalid case JSON'}`) }
  }))
  return readOfficialCases(Object.fromEntries(entries))
}

export function officialCases(): Plugin {
  return {
    name: 'lie-official-cases',
    async configResolved() { await validateOfficialDirectory(fileURLToPath(new URL('../../../content/games/', import.meta.url))) },
  }
}
