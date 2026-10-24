import { randomBytes, randomUUID } from 'node:crypto'
import { matrix } from './matrix.mjs'
export const ownerPrefix = 'LIE-case-followup-'
export function freshState() {
  const identities = [...new Set(matrix.map(row => `${row.gameId}/${row.characterId}`))]
  return { name: `${ownerPrefix}${randomUUID()}`, agentId: null, createAttempted: false, devices: identities.map(identity => ({ identity, mac: `02:${randomBytes(5).toString('hex').match(/../g).join(':')}`, client: randomUUID(), bindAttempted: false, bound: false, token: null })) }
}
export function verifyOwner(state) {
  const expected = new Set(matrix.map(row => `${row.gameId}/${row.characterId}`))
  if (!state.name?.startsWith(ownerPrefix) || state.devices.length !== expected.size || new Set(state.devices.map(item => item.mac)).size !== expected.size) throw new Error('owner-invalid')
  if (state.devices.some(item => !expected.has(item.identity)) || new Set(state.devices.map(item => item.identity)).size !== expected.size) throw new Error('owner-invalid')
}
export async function cleanupOwned(state, { api, save, remove }) {
  verifyOwner(state)
  const errors = []
  for (const device of state.devices) {
    if (!device.bindAttempted && !device.bound) continue
    try {
      await api('unbind-owned', '/xiaozhi/device/unbind', 'POST', { deviceId: device.mac })
      device.bound = false; device.bindAttempted = false; device.token = null
      await save(state)
    } catch { errors.push('unbind-failed') }
  }
  if (state.agentId != null) {
    try {
      await api('delete-owned', `/xiaozhi/agent/${state.agentId}`, 'DELETE')
      state.agentId = null; state.createAttempted = false
      await save(state)
    } catch { errors.push('delete-failed') }
  } else if (state.createAttempted) errors.push('create-ownership-unconfirmed')
  if (errors.length > 0) throw new Error('cleanup-incomplete')
  await remove()
}
export async function withOwnedResources(state, options, run) {
  const { api, ota, save, config, signal } = options
  function checkAbort() { if (signal?.aborted) throw new Error('execution-aborted') }
  verifyOwner(state)
  try {
    if (state.agentId != null || state.createAttempted || state.devices.some(item => item.bindAttempted || item.bound)) throw new Error('refusing-setup-resume')
    checkAbort()
    state.createAttempted = true
    await save(state)
    const created = await api('create-owned', '/xiaozhi/agent', 'POST', { agentName: state.name, assistantName: '对话角色', llmModelId: config.llmModelId, ttsVoiceId: config.ttsVoiceId, memModelId: 'Memory_nomem', intentModelId: 'Intent_function_call', systemPrompt: config.systemPrompt })
    if (typeof created.data !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(created.data)) throw new Error('create-result-invalid')
    state.agentId = created.data
    await save(state)
    checkAbort()
    await api('configure-owned', `/xiaozhi/agent/${state.agentId}`, 'PUT', { chatHistoryConf: 0, memModelId: 'Memory_nomem', extra: { disable_greeting: true, llm: { max_tokens: 160, enable_search: false } } })
    const detail = (await api('verify-owned', `/xiaozhi/agent/${state.agentId}`)).data
    if (detail.llmModelId !== config.llmModelId || detail.ttsVoiceId !== config.ttsVoiceId || detail.systemPrompt !== config.systemPrompt || detail.memModelId !== 'Memory_nomem' || detail.chatHistoryConf !== 0 || detail.extra?.llm?.max_tokens !== 160 || detail.extra?.llm?.enable_search !== false || detail.extra?.disable_greeting !== true) throw new Error('test-config-mismatch')
    for (const device of state.devices) {
      checkAbort()
      let result = await ota(device)
      if (result.websocket?.token != null || typeof result.activation?.code !== 'string') throw new Error('fresh-device-unexpected')
      checkAbort()
      device.bindAttempted = true
      await save(state)
      await api('bind-owned', `/xiaozhi/device/bind/${state.agentId}/${encodeURIComponent(result.activation.code)}`, 'POST')
      device.bound = true
      await save(state)
      checkAbort()
      result = await ota(device)
      const upstream = new URL(result.websocket?.url ?? 'invalid:')
      if (!['ws:', 'wss:'].includes(upstream.protocol) || upstream.hostname !== 'xrobo-io.qiniuapi.com' || !['/v1/ws', '/v1/ws/'].includes(upstream.pathname) || upstream.port || upstream.username || upstream.password || upstream.search || upstream.hash || typeof result.websocket?.token !== 'string' || !result.websocket.token) throw new Error('ota-config-invalid')
      device.token = result.websocket.token
      await save(state)
    }
    return await run(state)
  } finally {
    await cleanupOwned(state, options)
  }
}
