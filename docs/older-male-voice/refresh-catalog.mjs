// Opt-in, one read-only request. Never imports the resource-creation runners.
import { readFile, writeFile, open } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'

if (!process.argv.includes('--execute-once')) throw new Error('explicit-read-required')
const out = new URL('./catalog-current.json', import.meta.url)
const attempt = new URL('./catalog-refresh-attempt.json', import.meta.url)
const capturedAt = new Date().toISOString()
try {
  const common = execFileSync('git', ['rev-parse', '--git-common-dir'], { encoding: 'utf8' }).trim()
  const key = (await readFile(resolve(dirname(resolve(common)), '.linx-api-key'), 'utf8')).trim()
  if (key.length === 0) throw new Error('credential-unavailable')
  const lock = await open(attempt, 'wx', 0o600)
  await lock.writeFile(JSON.stringify({ capturedAt, method: 'GET', endpoint: 'https://xrobo.qiniu.com/v1/voices', maximumRequests: 1, retries: 0 }, null, 2) + '\n')
  await lock.close()
  const response = await fetch('https://xrobo.qiniu.com/v1/voices', {
    method: 'GET', redirect: 'error',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(20000),
  })
  const result = await response.json()
  if (!response.ok || result.code !== 0 || !Array.isArray(result.data?.voices)) throw new Error('catalog-rejected')
  const all = result.data.voices
  // Keep public fields only; no account metadata, headers or private clone records.
  const selected = all.filter(v => v.tags?.profile === 'public' && v.tags?.gender === 'male' && v.tags?.languages?.includes('zh'))
    .map(v => ({ id: v.id, name: v.name, demo: v.demo ?? '', tags: { languages: v.tags.languages, age: v.tags.age ?? '', gender: v.tags.gender, styles: v.tags.styles ?? [], scenes: v.tags.scenes ?? [], profile: v.tags.profile }, tier: v.tier ?? null, expired_time: v.expired_time ?? null }))
  const record = { capturedAt, endpoint: 'https://xrobo.qiniu.com/v1/voices', httpStatus: response.status, code: result.code, totalVoiceCount: all.length, selectedScope: 'public male voices with zh language', selectedVoiceCount: selected.length, voices: selected }
  await writeFile(out, JSON.stringify(record, null, 2) + '\n')
  console.log(JSON.stringify({ operation: 'read-voice-catalog', status: response.status, code: result.code, total: all.length, selected: selected.length, requests: 1, inference: false, managementWrites: false }))
} catch {
  console.error(JSON.stringify({ operation: 'read-voice-catalog', stopped: true, retry: false, reason: 'read-or-validation-failed-no-sensitive-error-output' }))
  process.exitCode = 1
}
