import { fileURLToPath } from 'node:url'

import { createApiRunner } from './release-api-v2.mjs'

// One invocation: at most 240s active work followed by at most 60s owned-resource cleanup.
export function relativeGuard(now = Date.now) {
  const startMs = now(), endMs = startMs + 300000, closeAtMs = startMs + 240000
  return {
    id: 'direct-api-20261101', startMs, endMs, closeAtMs, now,
    remaining(cleanup = false) { return Math.max(0, (cleanup ? endMs : closeAtMs) - now()) },
    assertActive(cleanup = false) { if (now() < startMs || now() >= (cleanup ? endMs : closeAtMs)) throw Error('Relative operation budget exhausted') },
    timeout(requested, { cleanup = false, phaseRemaining = Infinity, cleanupRemaining = Infinity } = {}) {
      this.assertActive(cleanup)
      const value = Math.floor(Math.min(requested, this.remaining(cleanup), phaseRemaining, cleanupRemaining))
      if (!Number.isFinite(value) || value <= 0) throw Error('Relative request budget exhausted')
      return value
    }
  }
}

export async function verify(target, { now = Date.now, ...dependencies } = {}) {
  if (target !== 'https://lie.agency') throw Error('Explicit approved production origin required')
  const runner = createApiRunner({ ...dependencies, window: relativeGuard(now), productionCandidate: true })
  let verification = null, cleanup = null
  try { verification = await runner.run('candidate', target) } catch { /* The same owned ledger is used for cleanup below. */ }
  try { cleanup = await runner.run('cleanup', '-') } catch { /* Unknown preparation/closure remains protected in the private ledger. */ }
  return { phase: 'verify', passed: verification?.passed === true && cleanup?.allOwnedBindingsRemoved === true, verification, cleanup }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  if (args.length !== 3 || args[0] !== 'verify' || args[2] !== '--approved-20261101') throw Error('Explicit production verify and approved flag required')
  verify(args[1]).then(value => { console.log(JSON.stringify(value)); if (!value.passed) process.exitCode = 1 })
    .catch(() => { console.error('API acceptance stopped; private ledger preserved; owner review required'); process.exitCode = 1 })
}
