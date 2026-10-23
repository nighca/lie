import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { createServer as createViteServer } from 'vite'
import WebSocket, { WebSocketServer } from 'ws'

const { values } = parseArgs({ options: { 'state-file': { type: 'string' }, port: { type: 'string', default: '5188' } } })
if (!values['state-file']) throw new Error('Pass --state-file explicitly; no default credentials are read')
const port = Number(values.port)
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid port')
const state = JSON.parse(await readFile(values['state-file'], 'utf8'))
const device = state.devices?.[1]
if (!state.agentId || !device?.bound || !device.token) throw new Error('Dedicated device index 1 is not available')
const origin = `http://127.0.0.1:${port}`
const path = (relative) => fileURLToPath(new URL(relative, import.meta.url))
const vite = await createViteServer({
  configFile: false, root: path('./harness/'),
  server: { middlewareMode: true, hmr: false, fs: {
    allow: [path('./harness/'), path('../../packages/voice/src/'), path('../../node_modules/')],
    deny: ['**/.linx-api-key', '**/.dev.vars*', '**/linx-*-state.json', '**/realtime-state.json', '**/.git/**']
  } }, logLevel: 'warn'
})
const server = createServer((request, response) => {
  response.setHeader('Cache-Control', 'no-store')
  vite.middlewares(request, response)
})
const acceptor = new WebSocketServer({ noServer: true, maxPayload: 65536 })
let active = false
let disposeActive = () => {}
server.on('upgrade', (request, transport, head) => {
  const reject = (status) => { transport.end(`HTTP/1.1 ${status}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`) }
  if (request.url !== '/voice' || request.headers.origin !== origin || request.headers.host !== `127.0.0.1:${port}`) { reject('403 Forbidden'); return }
  if (active) { reject('409 Conflict'); return }
  active = true
  let browser = null
  let done = false
  const upstream = new WebSocket('wss://xrobo-io.qiniuapi.com/v1/ws/', { handshakeTimeout: 10000, maxPayload: 65536,
    headers: { Authorization: `Bearer ${device.token}`, 'Device-Id': device.mac, 'Client-Id': randomUUID(), 'Protocol-Version': '1', 'X-Agent-ID': state.agentId } })
  const timer = setTimeout(() => finish(), 180000)
  function finish() {
    if (done) return
    done = true; active = false; clearTimeout(timer)
    if (browser == null && !transport.destroyed) reject('502 Bad Gateway')
    browser?.close(1000, 'Experiment ended'); upstream.close()
  }
  disposeActive = finish
  transport.on('error', finish)
  transport.on('close', finish)
  upstream.on('error', finish)
  upstream.on('unexpected-response', (_, response) => { response.resume(); finish() })
  upstream.on('close', finish)
  upstream.on('open', () => {
    if (done) return
    acceptor.handleUpgrade(request, transport, head, socket => {
      browser = socket
      socket.on('message', (data, binary) => { if (upstream.readyState === 1) upstream.send(data, { binary }) })
      upstream.on('message', (data, binary) => { if (socket.readyState === 1) socket.send(data, { binary }) })
      socket.on('close', finish); socket.on('error', finish)
    })
  })
})
server.listen(port, '127.0.0.1', () => console.log(JSON.stringify({ harness: origin, deviceIndex: 1, autoConnect: false, inference: 'only-after-user-click' })))
async function shutdown() { disposeActive(); acceptor.close(); await vite.close(); server.close(); }
process.once('SIGINT', () => void shutdown())
process.once('SIGTERM', () => void shutdown())
