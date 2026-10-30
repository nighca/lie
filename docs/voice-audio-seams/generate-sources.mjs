import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const directory = new URL('./sources/', import.meta.url)
const versions = {
  baseline: '60c11f72b71ead4b8e744f2281d5dbecb796d11a',
  gap: '5e97cda1bfe4e5621467bb4560cdfea2848b4591',
  current: '12c4e4d29135c7e30083c8ecf08c2fc95bcaf150',
}
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const snapshots = process.argv.includes('--snapshots')
const archived = snapshots ? JSON.parse(await readFile(new URL('./source-manifest.json', import.meta.url), 'utf8')) : null
const manifest = { toolchain: process.version, transform: 'Node stripTypeScriptTypes; PCM import redirected; trailing whitespace trimmed', versions: {} }
await mkdir(directory, { recursive: true })
let sharedPcm = null
for (const [name, commit] of Object.entries(versions)) {
  const player = snapshots ? await readFile(new URL(`${name}.ts`, directory), 'utf8') : execFileSync('git', ['show', `${commit}:packages/voice/src/player.ts`], { cwd: root, encoding: 'utf8' })
  const pcm = snapshots ? await readFile(new URL('pcm.ts', directory), 'utf8') : execFileSync('git', ['show', `${commit}:packages/voice/src/pcm.ts`], { cwd: root, encoding: 'utf8' })
  if (snapshots && (hash(player) !== archived.versions[name].playerSha256 || hash(pcm) !== archived.versions[name].pcmSha256)) throw new Error('Archived source identity mismatch')
  if (sharedPcm != null && sharedPcm !== pcm) throw new Error('PCM source differs; compare decoders explicitly before continuing')
  sharedPcm = pcm
  const rawModule = stripTypeScriptTypes(player).replace("from './pcm'", "from './pcm.mjs'")
  const module = rawModule.replace(/[ \t]+$/gm, '')
  await writeFile(new URL(`${name}.ts`, directory), player)
  await writeFile(new URL(`${name}.mjs`, directory), module)
  manifest.versions[name] = { commit, playerSha256: hash(player), pcmSha256: hash(pcm), moduleSha256: hash(module), rawModuleSha256: hash(rawModule) }
}
await writeFile(new URL('pcm.ts', directory), sharedPcm)
await writeFile(new URL('pcm.mjs', directory), stripTypeScriptTypes(sharedPcm))
await writeFile(new URL('./source-manifest.json', import.meta.url), JSON.stringify(manifest, null, 2) + '\n')
console.log(JSON.stringify(manifest, null, 2))
