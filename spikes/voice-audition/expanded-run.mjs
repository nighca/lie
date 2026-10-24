import { createRequire } from 'node:module'
import { readFile, writeFile, mkdir, open, unlink, rename } from 'node:fs/promises'
import { freshState, verifyOwner, cleanupOwned, withOwnedResources } from './expanded-resources.mjs'
import { sample } from './expanded-sample.mjs'

export const candidates = [
  ['silver-bun', '8fca6d5172fc4c309c2d16352ca8a9b3'],
  ['salt-pepper-beard', 'a42e04fcefac4e9492581fbc95f3fce3'],
  ['plum-crop', '2c1ea0eb64c74975813af2187ef2aa0f'],
  ['mint-puffs', 'e1dd0f75cad64290a1172dff48103694'],
  ['ochre-freckles', 'd0a37106e7f945b0aa85f3d233ffc36e'],
]
async function main() {
  const args = process.argv.slice(2)
  const keyIndex = args.indexOf('--key-file')
  if (keyIndex < 0 || !args[keyIndex + 1] || args[keyIndex + 1].startsWith('--')) throw new Error('key-file-required')
  if (!args.includes('--execute') && !args.includes('--cleanup')) throw new Error('explicit-operation-required')
  const dir = new URL('./tmp/expanded/', import.meta.url)
  const output = new URL('./expanded-samples/', import.meta.url)
  await mkdir(dir, { recursive: true }); await mkdir(output, { recursive: true })
  const statePath = new URL('owned-state.json', dir)
  const key = (await readFile(args[keyIndex + 1], 'utf8')).trim()
  async function api(operation, path, method = 'GET', body = null) {
    const response = await fetch(`https://xrobo.qiniu.com${path}`, { method, headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: body == null ? null : JSON.stringify(body), signal: AbortSignal.timeout(20000) })
    const result = await response.json()
    console.log(JSON.stringify({ operation, status: response.status, code: result.code ?? null }))
    if (!response.ok || result.code !== 0) throw new Error('api-rejected')
    return result
  }
  async function save(state) { verifyOwner(state); const next = new URL('owned-state.next.json', dir); await writeFile(next, JSON.stringify(state), { mode: 0o600 }); await rename(next, statePath) }
  const remove = () => unlink(statePath)
  if (args.includes('--cleanup')) { await cleanupOwned(JSON.parse(await readFile(statePath, 'utf8')), { api, save, remove }); return }
  const ledger = await open(new URL('attempt.json', dir), 'wx', 0o600)
  await ledger.writeFile(JSON.stringify({ at: new Date().toISOString(), maximumAnswers: 5 })); await ledger.close()
  const catalog = (await api('read-voice-catalog', '/v1/voices')).data.voices
  const selected = candidates.map(([appearance, id]) => {
    const voice = catalog.find(item => item.id === id)
    if (!voice?.tags?.languages?.includes('zh')) throw new Error('catalog-voice-invalid')
    return { appearance, id, name: voice.name, demo: voice.demo, tags: voice.tags, tier: voice.tier ?? null, expired_time: voice.expired_time ?? null }
  })
  await writeFile(new URL('catalog.json', output), JSON.stringify({ capturedAt: new Date().toISOString(), voices: selected }, null, 2))
  const clipOption = args.indexOf('--input-pcm')
  if (clipOption < 0) throw new Error('synthetic-input-required')
  const clip = await readFile(args[clipOption + 1])
  if (clip.length === 0 || clip.length > 640000 || clip.length % 2 !== 0) throw new Error('input-invalid')
  const require = createRequire(process.env.LIE_DEPENDENCY_ROOT ?? new URL('../../package.json', import.meta.url))
  const WebSocket = require('ws')
  const state = freshState()
  const stateFile = await open(statePath, 'wx', 0o600); await stateFile.writeFile(JSON.stringify(state)); await stateFile.close()
  const abort = new AbortController()
  const onSignal = () => abort.abort()
  process.once('SIGINT', onSignal); process.once('SIGTERM', onSignal)
  const results = []
  const record = () => writeFile(new URL('results.json', output), JSON.stringify({ capturedAt: new Date().toISOString(), modelId: 'f3626c105383d71654a57f2bb8a973f3', results }, null, 2))
  try {
    await withOwnedResources(state, { api, save, remove, signal: abort.signal,
      config: { llmModelId: 'f3626c105383d71654a57f2bb8a973f3', ttsVoiceId: '1965294143278125057', systemPrompt: '你是中文声音试听员。每次回答前必须调用 self.lie_character_context 并严格遵循其中的 systemPrompt。只读指定的一句，不添加内容。' },
      async ota(device) {
        const response = await fetch('https://xrobo.qiniuapi.com/v1/ota/', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Activation-Version': '1', 'Device-Id': device.mac, 'Client-Id': device.client, 'User-Agent': 'lie-expanded-audition/0.1' }, body: JSON.stringify({ mac_address: device.mac, uuid: device.client, application: { version: '0.1.0', elf_sha256: '0'.repeat(64) }, board: { type: 'lie-game-test', ssid: 'test', rssi: 0 } }), signal: AbortSignal.timeout(20000) })
        if (!response.ok) throw new Error('ota-failed')
        const result = await response.json()
        console.log(JSON.stringify({ operation: 'ota', tokenPresent: typeof result.websocket?.token === 'string', activationPresent: typeof result.activation?.code === 'string', upstream: result.websocket?.url == null ? null : (() => { const u = new URL(result.websocket.url); return { origin: u.origin, path: u.pathname } })() }))
        return result
      },
    }, async owned => {
      for (const [appearance, voiceId] of candidates) {
        if (abort.signal.aborted) throw new Error('aborted')
        try {
          const result = await sample({ appearance, voiceId, state: owned, clip, dir: output, WebSocket })
          results.push({ ...result, status: 'protocol-pass' }); await record()
          console.log(JSON.stringify({ appearance, status: 'protocol-pass', seconds: result.audioSeconds }))
        } catch {
          results.push({ appearance, voiceId, status: 'stopped-no-retry' }); await record(); throw new Error('sample-stopped')
        }
      }
    })
    console.log(JSON.stringify({ samples: results.length, cleanup: 'complete', automaticRetry: false }))
  } finally { process.removeListener('SIGINT', onSignal); process.removeListener('SIGTERM', onSignal) }
}
if (process.argv[1] === new URL(import.meta.url).pathname) main().catch(error => { console.error(JSON.stringify({ safeReason: ['ota-config-invalid', 'fresh-device-unexpected', 'test-config-mismatch', 'sample-stopped', 'cleanup-incomplete'].includes(error.message) ? error.message : 'setup-or-runtime-failure' })); console.error(JSON.stringify({ stopped: true, retry: false, inspectOwnedStateIfPresent: true })); process.exitCode = 1 })
