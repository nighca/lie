import { randomBytes, randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

class ProbeError extends Error {}

export function otaTargetShape(value) {
  if (typeof value !== 'string') return { scheme: 'invalid', knownHost: false, knownPath: false, hasQuery: false, hasUserinfo: false, hasUnexpectedPort: false }
  try {
    const url = new URL(value)
    return {
      scheme: url.protocol === 'ws:' ? 'ws' : url.protocol === 'wss:' ? 'wss' : 'other',
      knownHost: url.hostname === 'xrobo-io.qiniuapi.com', knownPath: url.pathname === '/v1/ws/',
      hasQuery: url.search !== '', hasUserinfo: url.username !== '' || url.password !== '', hasUnexpectedPort: url.port !== ''
    }
  } catch { return { scheme: 'invalid', knownHost: false, knownPath: false, hasQuery: false, hasUserinfo: false, hasUnexpectedPort: false } }
}

export const canary = '青瓷风铃七二'
export const people = {
  A: { name: '阿蓝', password: '蓝鲸七号' }, B: { name: '小黄', password: '柠檬九号' },
  N: { name: '阿绿', password: '青松三号' }, X: { name: '小紫', password: '紫云六号' }
}
export function context(person, history = []) {
  return {
    background: '这是合成角色测试，每个人只知道自己的资料和本人history。',
    profile: `你叫${person.name}，你的人物口令是${person.password}。`,
    systemPrompt: '只依据当前人物和本人history回答。没有的信息明确说不知道，不编造玩家暗号。', history
  }
}
export function contentPass(kind, text) {
  const identity = people[kind === 'A2' ? 'A' : kind]
  const forbidden = Object.values(people).filter(p => p !== identity).map(p => p.password)
  if (forbidden.some(x => text.includes(x))) return false
  if (kind === 'A2') return text.includes(canary)
  if (!text.includes(identity.name) || !text.includes(identity.password)) return false
  if (kind === 'A') return text.includes(canary)
  return !text.includes(canary) && /不知道|不清楚|没有告诉|没告诉|没有告知|未告知|不知晓|未曾告知/.test(text)
}

export async function runApproved({ keyPath, privateDir, resultPath, WebSocket }) {
  const owner = 'lie-p0-independent-device-2026-11-01-run-02'
  await mkdir(privateDir, { recursive: true, mode: 0o700 })
  const statePath = resolve(privateDir, 'state.json')
  const state = { owner, agentName: `LIE-P0-independent-${Date.now()}-${randomBytes(3).toString('hex')}`, agentId: null, createAttempted: false, devices: [], cleanupComplete: false }
  await writeFile(statePath, JSON.stringify(state), { flag: 'wx', mode: 0o600 })
  const key = (await readFile(keyPath, 'utf8')).trim()
  if (!key) throw new ProbeError('Empty management key')
  const report = { owner, startedAt: null, operations: [], channels: [], questions: [], completed: false, cleanup: {} }
  const globalAbort = new AbortController()
  const cleanupAbort = new AbortController()
  let cleanupMode = false
  let failure = null
  let hardTimer = null
  let cleanupTimer = null
  const sockets = []
  const sessionIds = []
  const begin = Date.now()
  const elapsed = () => Date.now() - begin
  const save = async () => {
    const temporary = resolve(privateDir, `.state-${randomUUID()}.json`)
    await writeFile(temporary, JSON.stringify(state), { flag: 'wx', mode: 0o600 })
    await rename(temporary, statePath)
  }
  function stop(reason) {
    failure ??= reason
    globalAbort.abort()
  }
  function check() {
    if (failure || globalAbort.signal.aborted) throw new ProbeError(failure ?? 'Experiment deadline')
  }
  async function request(operation, url, options, businessCode = true) {
    if (!cleanupMode) check()
    const signal = AbortSignal.any([(cleanupMode ? cleanupAbort : globalAbort).signal, AbortSignal.timeout(20000)])
    const op = { operation, startedAtMs: elapsed(), durationMs: null, status: null, code: null, success: false }
    report.operations.push(op)
    try {
      const response = await fetch(url, { ...options, signal, redirect: 'error' })
      op.status = response.status
      const data = await response.json()
      op.code = typeof data.code === 'number' ? data.code : null
      if (!response.ok || (businessCode && data.code !== 0)) throw new ProbeError('Rejected operation')
      op.success = true
      return data
    } catch {
      throw new ProbeError(`Operation failed: ${operation}`)
    } finally { op.durationMs = elapsed() - op.startedAtMs }
  }
  const api = (operation, path, method = 'GET', body = null) => request(operation, `https://xrobo.qiniu.com${path}`, {
    method, headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    ...(body == null ? {} : { body: JSON.stringify(body) })
  })
  async function allocate(label) {
    const device = { label, mac: `02:${randomBytes(5).toString('hex').match(/../g).join(':')}`, client: randomUUID(),
      otaAttempted: false, bindAttempted: false, bound: false, token: null, uncertain: true }
    state.devices.push(device)
    await save()
    async function ota(stage) {
      device.otaAttempted = true
      await save()
      return request(`${label}-${stage}`, 'https://xrobo.qiniuapi.com/v1/ota/', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Activation-Version': '1',
          'Device-Id': device.mac, 'Client-Id': device.client, 'User-Agent': 'lie-p0-test/1' },
        body: JSON.stringify({ mac_address: device.mac, uuid: device.client,
          application: { version: '0.1.0', elf_sha256: '0'.repeat(64) }, board: { type: 'lie-game-test', ssid: 'test', rssi: 0 } })
      }, false)
    }
    const first = await ota('ota-initial')
    if (first.websocket?.token) throw new ProbeError('Unexpected already-bound generated Device; stop ownership check')
    if (typeof first.activation?.code !== 'string') throw new ProbeError('Missing activation code')
    device.bindAttempted = true
    device.uncertain = true
    await save()
    await api(`${label}-bind`, `/xiaozhi/device/bind/${state.agentId}/${first.activation.code}`, 'POST')
    device.bound = true
    device.uncertain = false
    await save()
    const next = await ota('ota-token')
    if (typeof next.websocket?.token !== 'string' || !next.websocket.token) throw new ProbeError('Missing Device token')
    report.otaTargets ??= []
    const target = otaTargetShape(next.websocket.url)
    report.otaTargets.push({ device: label, ...target })
    if (!['ws', 'wss'].includes(target.scheme) || !target.knownHost || !target.knownPath ||
      target.hasQuery || target.hasUserinfo || target.hasUnexpectedPort) throw new ProbeError('Unexpected OTA target shape')
    device.token = next.websocket.token
    await save()
    return device
  }
  function open(label, device, projection) {
    check()
    const startedAtMs = elapsed()
    const r = { label, device: device.label, startedAtMs, openedAtMs: null, helloAtMs: null, readyAtMs: null,
      callerClose: false, closeAtMs: null, closeCode: null, closeObserved: false, terminated: false, readyState: null }
    report.channels.push(r)
    const ws = new WebSocket('wss://xrobo-io.qiniuapi.com/v1/ws/', { handshakeTimeout: 10000,
      headers: { Authorization: `Bearer ${device.token}`, 'Device-Id': device.mac, 'Client-Id': randomUUID(),
        'Protocol-Version': '1', 'X-Agent-ID': state.agentId } })
    let hello = false, tools = false, readySettled = false, pending = null, sessionId = null
    let resolveReady
    const ready = new Promise(resolve => { resolveReady = resolve })
    let resolveClosed
    const closed = new Promise(resolve => { resolveClosed = resolve })
    const send = value => { if (ws.readyState !== WebSocket.OPEN) throw new ProbeError('Socket not open'); ws.send(JSON.stringify(value)) }
    function becomeReady() {
      if (hello && tools && !readySettled) { readySettled = true; r.readyAtMs = elapsed(); resolveReady(true) }
    }
    function fail(reason) {
      stop(reason)
      resolveReady(false)
      if (pending) { clearTimeout(pending.timer); pending.resolve(false); pending = null }
    }
    ws.on('error', () => { if (!r.callerClose) fail(`WebSocket error: ${label}`) })
    ws.on('close', code => {
      r.closeAtMs = elapsed(); r.closeCode = code; r.closeObserved = true; r.readyState = ws.readyState
      resolveClosed()
      if (!r.callerClose) fail(`Unexpected WebSocket close: ${label}`)
    })
    ws.on('open', () => {
      if (globalAbort.signal.aborted) return
      r.openedAtMs = elapsed()
      try { send({ type: 'hello', version: 1, transport: 'websocket', features: { mcp: true }, audio_params: {
        format: 'pcm', sample_rate: 16000, channels: 1, bit_depth: 16, endianness: 'little', frame_duration: 20, frame_size: 320, sample_format: 'signed_int16' } }) } catch { fail(`Hello send failed: ${label}`) }
    })
    ws.on('message', (data, binary) => {
      if (globalAbort.signal.aborted) return
      if (binary) { if (pending) pending.result.audioBytes += data.length; return }
      let m
      try { m = JSON.parse(data.toString()) } catch { fail(`Invalid protocol JSON: ${label}`); return }
      if (m == null || typeof m !== 'object') { fail(`Invalid protocol message: ${label}`); return }
      if (m.type === 'hello') {
        if (m.audio_params?.format !== 'pcm' || m.audio_params?.sample_rate !== 16000 || m.audio_params?.channels !== 1) { fail(`Unsupported PCM: ${label}`); return }
        hello = true; r.helloAtMs = elapsed()
        if (typeof m.session_id !== 'string' || !m.session_id) { fail(`Missing session: ${label}`); return }
        sessionId = m.session_id
        sessionIds.push(sessionId)
        becomeReady()
      }
      if (m.type === 'tts' && pending) {
        if (m.state === 'sentence_start' && typeof m.text === 'string') {
          pending.result.text += m.text
          if (/额度不足|余额不足/.test(m.text)) { fail('Provider quota response'); return }
        }
        if (m.state === 'stop') {
          const p = pending; pending = null; clearTimeout(p.timer)
          p.result.ttsStop = true; p.result.aborted = m.is_aborted === true
          p.result.finishedAtMs = elapsed(); p.resolve(true)
        }
      }
      const q = m.type === 'mcp' ? m.payload : null
      if (q?.id == null) return
      let response
      if (q.method === 'initialize') response = { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'lie-independent-device-test', version: '1' } }
      else if (q.method === 'tools/list') response = { tools: [{ name: 'self.lie_character_context', description: '回答前读取当前人物及本人的完整history。', inputSchema: { type: 'object', properties: {}, additionalProperties: false } }], nextCursor: null }
      else if (q.method === 'tools/call' && q.params?.name === 'self.lie_character_context') {
        if (pending) pending.result.toolsCalled++
        response = { content: [{ type: 'text', text: JSON.stringify(projection) }], isError: false }
      } else { fail(`Unexpected MCP method: ${label}`); return }
      try { send({ type: 'mcp', payload: { jsonrpc: '2.0', id: q.id, result: response } }) }
      catch { fail(`MCP send failed: ${label}`); return }
      if (q.method === 'tools/list') { tools = true; becomeReady() }
    })
    const abort = () => { if (pending) { clearTimeout(pending.timer); pending.resolve(false); pending = null }; resolveReady(false) }
    globalAbort.signal.addEventListener('abort', abort, { once: true })
    const readyTimer = setTimeout(() => { if (!readySettled) fail(`Ready timeout: ${label}`) }, 10000)
    return {
      r, ws,
      async waitReady() { const ok = await ready; clearTimeout(readyTimer); check(); if (!ok) throw new ProbeError('Ready failed') },
      async ask(kind, question) {
        check()
        if (report.questions.length >= 6 || pending || ws.readyState !== WebSocket.OPEN) throw new ProbeError('Question boundary')
        const result = { number: report.questions.length + 1, channel: label, kind, question, text: '', audioBytes: 0, toolsCalled: 0,
          startedAtMs: elapsed(), finishedAtMs: null, ttsStop: false, aborted: false, passed: false }
        report.questions.push(result)
        const ok = await new Promise(resolve => {
          const timer = setTimeout(() => { fail(`Question timeout: ${result.number}`) }, 25000)
          pending = { result, resolve, timer }
          try { send({ type: 'listen', session_id: sessionId, state: 'detect', text: question }) }
          catch { fail(`Question send failed: ${result.number}`) }
        })
        check()
        result.passed = ok && result.toolsCalled > 0 && result.ttsStop && !result.aborted && result.audioBytes > 0 && contentPass(kind, result.text)
        if (!result.passed) throw new ProbeError(`Question assertion failed: ${result.number}`)
        return result
      },
      async close() {
        clearTimeout(readyTimer)
        globalAbort.signal.removeEventListener('abort', abort)
        if (ws.readyState !== WebSocket.CLOSED) {
          r.callerClose = true
          try { ws.close(1000, 'Owned experiment complete') } catch { /* Terminate fallback below. */ }
          await Promise.race([closed, new Promise(resolve => setTimeout(resolve, 2500))])
          if (ws.readyState !== WebSocket.CLOSED) {
            r.terminated = true; ws.terminate()
            await Promise.race([closed, new Promise(resolve => setTimeout(resolve, 500))])
          }
        }
        r.readyState = ws.readyState
        return r.closeObserved && r.closeCode === 1000 && !r.terminated && ws.readyState === WebSocket.CLOSED
      }
    }
  }
  async function connect(label, device, projection) {
    const channel = open(label, device, projection)
    sockets.push(channel)
    await channel.waitReady()
    return channel
  }
  async function closeForReuse(channel) {
    if (!await channel.close()) throw new ProbeError('Close not confirmed for sequential reuse')
    check()
  }
  const hold = async () => {
    await new Promise(resolve => {
      const done = () => { clearTimeout(timer); globalAbort.signal.removeEventListener('abort', done); resolve() }
      const timer = setTimeout(done, 3000)
      globalAbort.signal.addEventListener('abort', done, { once: true })
      if (globalAbort.signal.aborted) done()
    })
    check()
  }
  try {
    report.startedAt = new Date().toISOString()
    hardTimer = setTimeout(() => stop('Experiment deadline'), 300000)
    state.createAttempted = true
    await save()
    const created = await api('create-agent', '/xiaozhi/agent', 'POST', { agentName: state.agentName, assistantName: '对话角色',
      memModelId: 'Memory_nomem', intentModelId: 'Intent_function_call',
      systemPrompt: '你是中文语音游戏角色。每次回答前必须调用self.lie_character_context，严格扮演当前profile人物。history是本人物完整历史，不得使用其他人物或连接信息。没有的信息明确说不知道。简短回答，不超过60个汉字。只能调用self.lie_character_context。' })
    if (typeof created.data !== 'string' || !created.data) throw new ProbeError('Uncertain Agent creation response')
    state.agentId = created.data
    await save()
    await api('configure-agent', `/xiaozhi/agent/${state.agentId}`, 'PUT', { chatHistoryConf: 0, memModelId: 'Memory_nomem', extra: { disable_greeting: true, llm: { max_tokens: 160, enable_search: false } } })
    const detail = await api('read-agent', `/xiaozhi/agent/${state.agentId}`)
    let extra = detail.data?.extra
    if (typeof extra === 'string') {
      try { extra = JSON.parse(extra) } catch { throw new ProbeError('Agent extra readback invalid JSON') }
    }
    report.config = {
      memModelId: detail.data?.memModelId === 'Memory_nomem' ? 'Memory_nomem' : null,
      chatHistoryConf: detail.data?.chatHistoryConf === 0 ? 0 : null,
      disable_greeting: typeof extra?.disable_greeting === 'boolean' ? extra.disable_greeting : null,
      max_tokens: typeof extra?.llm?.max_tokens === 'number' ? extra.llm.max_tokens : null,
      enable_search: typeof extra?.llm?.enable_search === 'boolean' ? extra.llm.enable_search : null
    }
    if (report.config.memModelId !== 'Memory_nomem' || report.config.chatHistoryConf !== 0 ||
      report.config.disable_greeting !== true || report.config.max_tokens !== 160 || report.config.enable_search !== false) {
      throw new ProbeError('Agent config readback mismatch')
    }
    const d1 = await allocate('D1')
    let a = await connect('D1-A', d1, context(people.A))
    await hold()
    const d2Started = elapsed()
    const d2 = await allocate('D2')
    const x = await connect('D2-X', d2, context(people.X))
    report.dynamicD2ToReadyMs = elapsed() - d2Started
    await hold()
    report.concurrentOpenBeforeQuestions = a.ws.readyState === WebSocket.OPEN && x.ws.readyState === WebSocket.OPEN
    if (!report.concurrentOpenBeforeQuestions) throw new ProbeError('Independent Devices not concurrently open')
    const q1 = `我的暗号是${canary}。请确认，并说出你的名字和人物口令。`
    const first = await a.ask('A', q1)
    await x.ask('X', '你叫什么名字，人物口令是什么？你知道玩家的暗号吗？')
    await closeForReuse(a)
    a = await connect('D1-B', d1, context(people.B))
    await a.ask('B', '你叫什么名字，人物口令是什么？你知道玩家的暗号吗？')
    await closeForReuse(a)
    a = await connect('D1-A2', d1, context(people.A, [{ role: 'user', text: q1 }, { role: 'assistant', text: first.text }]))
    await a.ask('A2', '我之前告诉你的暗号是什么？')
    await closeForReuse(a)
    a = await connect('D1-N', d1, context(people.N))
    await a.ask('N', '你叫什么名字，人物口令是什么？你知道玩家的暗号吗？')
    await x.ask('X', '请再说你的名字和人物口令。你知道玩家的暗号吗？')
    report.d2StayedOpen = x.ws.readyState === WebSocket.OPEN && !x.r.closeObserved
    report.distinctSessions = sessionIds.length === 5 && new Set(sessionIds).size === 5
    report.completed = report.questions.length === 6 && report.questions.every(q => q.passed) && report.d2StayedOpen && report.distinctSessions
  } catch (error) {
    report.error = failure ?? (error instanceof ProbeError ? error.message : 'Unexpected internal failure')
  } finally {
    clearTimeout(hardTimer)
    globalAbort.abort()
    cleanupMode = true
    report.cleanup.startedAt = new Date().toISOString()
    cleanupTimer = setTimeout(() => cleanupAbort.abort(), Math.max(0, Math.min(60000, begin + 360000 - Date.now())))
    try {
      await Promise.all(sockets.map(c => c.close()))
      report.cleanup.allSocketsClosed = sockets.every(c => c.ws.readyState === WebSocket.CLOSED && c.r.closeObserved)
      if (!report.cleanup.allSocketsClosed) throw new ProbeError('Owned socket closure not observed; resource cleanup deferred')
      for (const d of state.devices) {
        if (!d.bound) continue
        await api(`${d.label}-unbind`, '/xiaozhi/device/unbind', 'POST', { deviceId: d.mac })
        d.bound = false; d.token = null
        await save()
      }
      if (state.devices.some(d => d.uncertain) || (!state.agentId && state.createAttempted)) throw new ProbeError('Uncertain owned resource needs reconciliation')
      if (state.agentId) {
        await api('delete-agent', `/xiaozhi/agent/${state.agentId}`, 'DELETE')
        state.agentId = null
        await save()
      }
      state.cleanupComplete = true
      await save()
      report.cleanup.resourcesRemoved = true
      report.cleanup.scope = 'Owned device bindings removed and owned Agent deleted; not proof of all provider registry/log/history erasure'
    } catch (error) { report.cleanup.error = error instanceof ProbeError ? error.message : 'Unexpected cleanup failure'; report.cleanup.resourcesRemoved = false }
    clearTimeout(cleanupTimer)
    report.cleanup.finishedAt = new Date().toISOString()
    report.finishedAt = new Date().toISOString()
    report.elapsedMs = elapsed()
    await writeFile(resultPath, JSON.stringify(report, null, 2) + '\n')
  }
  return report
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href && process.argv.includes('--execute-approved')) {
  try {
  const WebSocket = (await import('/Users/nighca/code/nighca/lie/node_modules/ws/wrapper.mjs')).default
  const root = resolve(import.meta.dirname, '../../../..')
  const report = await runApproved({ keyPath: '/Users/nighca/code/nighca/lie/.linx-api-key',
    privateDir: resolve(root, 'tmp/p0-independent-device-2026-11-01-run-02'), resultPath: resolve(import.meta.dirname, 'results-02.json'), WebSocket })
  console.log(JSON.stringify({ completed: report.completed, error: report.error ?? null, questions: report.questions.length, cleanup: report.cleanup }))
  if (!report.completed || !report.cleanup.resourcesRemoved) process.exitCode = 1
  } catch {
    console.log(JSON.stringify({ completed: false, error: 'Unexpected setup or output failure; inspect private ownership state before further actions' }))
    process.exitCode = 1
  }
}
