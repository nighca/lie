import assert from 'node:assert/strict'
import http from 'node:http'
import net from 'node:net'
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { createServer } from 'vite'
import WebSocket from 'ws'

const repository = fileURLToPath(new URL('../', import.meta.url))
const gatewayDirectory = fileURLToPath(new URL('../apps/gateway/', import.meta.url))
for (const directory of [repository, gatewayDirectory]) {
  const privateFiles = (await readdir(directory)).filter(name => (name === '.env' || name.startsWith('.env.') || name.startsWith('.dev.vars')) && name !== '.env.example')
  assert.equal(privateFiles.length, 0, 'Run this diagnostic in a fresh worktree without local environment or secret files')
}
for (const name of ['LINX_WS_TOKEN', 'LINX_DEVICE_ID', 'LINX_AGENT_ID']) assert(!process.env[name], 'Voice credential environment variables must be absent')

function handshake(url, origin) {
  return new Promise(resolve => {
    const client = new WebSocket(url.replace('http:', 'ws:') + '/api/voice', { origin, handshakeTimeout: 2500 })
    client.on('unexpected-response', (_request, response) => {
      response.resume()
      resolve({ status: response.statusCode })
      client.terminate()
    })
    client.on('error', error => resolve({ error: error.message }))
    client.on('open', () => { resolve({ status: 101 }); client.close() })
  })
}
function httpControl(url, origin) {
  return new Promise((resolve, reject) => {
    const request = http.get(url + '/api/voice', { headers: { Origin: origin, Upgrade: 'websocket', Connection: 'close' } }, response => {
      response.resume()
      resolve(response.statusCode)
    })
    request.setTimeout(2500, () => request.destroy(new Error('HTTP control timed out')))
    request.on('error', reject)
  })
}
const closedPorts = []
const servers = []
async function viteServer(application, gatewayUrl = null) {
  if (gatewayUrl != null) process.env.LIE_VOICE_GATEWAY_URL = gatewayUrl
  const server = await createServer({ root: repository + 'apps/' + application, configFile: repository + 'apps/' + application + '/vite.config.ts', server: { port: 0, strictPort: true, watch: null, hmr: false }, logLevel: 'silent' })
  servers.push(server)
  await server.listen()
  const port = server.httpServer.address().port
  closedPorts.push(port)
  return 'http://127.0.0.1:' + port
}
async function pair(url) { return [await handshake(url, url), await handshake(url, 'https://other.example')] }
function classify(results) {
  if (results[0].status === 503 && results[1].status === 403) return 'HTTP rejection preserved'
  assert(results.every(result => result.error === 'socket hang up'), 'Unexpected handshake result: ' + JSON.stringify(results))
  return 'development host discarded Worker rejection'
}
const fake = http.createServer()
fake.on('upgrade', (request, socket) => {
  const status = request.headers.origin === 'http://' + request.headers.host ? 503 : 403
  socket.end(`HTTP/1.1 ${status} ${http.STATUS_CODES[status]}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`)
})
await new Promise(resolve => fake.listen(0, '127.0.0.1', resolve))
const fakeUrl = 'http://127.0.0.1:' + fake.address().port
closedPorts.push(fake.address().port)
try {
  const directFake = await pair(fakeUrl)
  const viaWebFake = await pair(await viteServer('web', fakeUrl))
  assert.deepEqual(directFake, [{ status: 503 }, { status: 403 }])
  assert.deepEqual(viaWebFake, directFake)
  process.env.LIE_GATEWAY_PORT = '0'
  const gatewayUrl = await viteServer('gateway')
  const status = await (await fetch(gatewayUrl + '/api/voice/status', { signal: AbortSignal.timeout(2500) })).json()
  assert.equal(status.status, 'unavailable', 'Refuse to perform a voice handshake with a configured provider')
  const controls = [await httpControl(gatewayUrl, gatewayUrl), await httpControl(gatewayUrl, 'https://other.example')]
  assert.deepEqual(controls, [503, 403])
  const gatewayResults = await pair(gatewayUrl)
  const actualWebUrl = await viteServer('web', gatewayUrl)
  const viaWebGateway = await pair(actualWebUrl)
  assert.equal(classify(viaWebGateway), classify(gatewayResults))
  const metadata = JSON.parse(await readFile(new URL('../node_modules/@cloudflare/vite-plugin/package.json', import.meta.url), 'utf8'))
  console.log(JSON.stringify({ node: process.version, cloudflareVitePlugin: metadata.version, fakeDirect: directFake, fakeViaWeb: viaWebFake, workerHttpControl: controls, actualGateway: gatewayResults, actualGatewayViaWeb: viaWebGateway, conclusion: classify(gatewayResults), ownedPorts: closedPorts }))
} finally {
  fake.closeAllConnections()
  const cleanup = await Promise.allSettled([...servers.reverse().map(server => server.close()), new Promise(resolve => fake.close(resolve))])
  const failures = cleanup.filter(result => result.status === 'rejected').map(result => result.reason)
  if (failures.length > 0) throw new AggregateError(failures, 'Diagnostic server cleanup failed')
}
for (const port of closedPorts) {
  await new Promise((resolve, reject) => {
    const socket = net.connect({ host: '127.0.0.1', port })
    socket.setTimeout(1000, () => socket.destroy(new Error('Closed-port check timed out')))
    socket.on('connect', () => { socket.destroy(); reject(new Error('Owned port remains open: ' + port)) })
    socket.on('error', error => error.code === 'ECONNREFUSED' ? resolve() : reject(error))
  })
}
console.log('PASS: all owned loopback ports are closed; no production service or provider was used')
