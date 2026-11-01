import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const reviewedCommit = '51264aebaf590badf0d0e3039ebbb6679994fe29'
const reviewedRoot = 'docs/reviews/device-concurrency-2026-11-01/'

function replace(source, from, to, count = 1) {
  if (source.split(from).length - 1 !== count) throw Error('Reviewed provider source no longer matches the thin adapter')
  return source.split(from).join(to)
}

/** Keeps the reviewed transport, ledger, normal-close and only-owned cleanup implementation. */
export function adaptVoiceRunner(source) {
  let value = replace(source, '(cleanup ? 24 : 20)', '(cleanup ? 30 : 26)')
  value = replace(value, 'this.c.logical >= 6', 'this.c.logical >= 4')
  value = replace(value, 'this.c.upgrades + 2 > 12', 'this.c.upgrades + 2 > 8')
  value = replace(value, '90000', '60000', 4)
  value = replace(value, '88000', '58000', 4)
  value = replace(value, 'productionCandidate = false', 'approvedPreviewOrigin = null, deviceEnvironment = null')
  value = replace(value, 'paths = { ledger: `${stateRoot}/api-ledger.json`, key: keyPath, signing: `${stateRoot}/production-cookie-secret` }', 'paths = null')
  value = replace(value, "d.environment !== 'production:https'", 'd.environment !== deviceEnvironment')
  value = replace(value, "if (mode === 'candidate' && !/^https:\\/\\/[a-f0-9]{8}-lie-game\\.nighca\\.workers\\.dev$/.test(origin) &&\n        !(productionCandidate && origin === 'https://lie.agency')) throw Error('Unexpected candidate origin')", "if (mode === 'candidate' && origin !== approvedPreviewOrigin) throw Error('Unexpected preview origin')")
  value = replace(value, "if (mode === 'smoke' && origin !== 'https://lie.agency') throw Error('Unexpected production origin')", "if (mode === 'smoke') throw Error('Production smoke is outside preview acceptance')")
  return value
}

export async function prepareVoiceAdapter(directory, readReviewed = name => execFileSync('git', ['show', `${reviewedCommit}:${reviewedRoot}${name}`], { encoding: 'utf8' })) {
  await mkdir(directory, { recursive: true, mode: 0o700 })
  for (const name of ['release-api-v2.mjs', 'release-api-simple.mjs', 'release-window-v2.mjs', 'release-ops.mjs']) {
    const source = readReviewed(name)
    await writeFile(resolve(directory, name), name === 'release-api-v2.mjs' ? adaptVoiceRunner(source) : source, { mode: 0o600, flag: 'wx' })
  }
  return { sourceCommit: reviewedCommit, activeBudget: { devices: 2, logicalWS: 4, upstreamHandshakes: 8, managementHTTP: 30, aggregateSocketMs: 60000 }, files: 4 }
}

if (process.argv[1] != null && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  prepareVoiceAdapter(resolve(process.argv[2])).then(value => console.log(JSON.stringify(value))).catch(() => {
    console.error('Provider adapter preparation failed; no provider request was made')
    process.exitCode = 1
  })
}
