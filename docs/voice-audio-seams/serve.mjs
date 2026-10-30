import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('./', import.meta.url)).replace(/\/$/, '')
const origin = 'http://127.0.0.1:5544'
const types = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml' }
const server = createServer(async (request, response) => {
  try {
    const path = new URL(request.url, origin).pathname
    response.setHeader('Cache-Control', 'no-store')
    if (path === '/__results' && request.method === 'POST') {
      if (request.headers.origin !== origin || request.headers['content-type'] !== 'application/json') { response.writeHead(403); response.end(); return }
      const chunks = []; let size = 0
      for await (const chunk of request) {
        size += chunk.length
        if (size > 2 * 1024 * 1024) throw new Error('Synthetic result exceeds bound')
        chunks.push(chunk)
      }
      const result = JSON.parse(Buffer.concat(chunks).toString())
      if (result.kind !== 'synthetic-offline-pcm-seams' || result.cases.length !== 72) throw new Error('Unexpected fixture result')
      await writeFile(resolve(root, 'native-results.json'), JSON.stringify(result) + '\n')
      response.end('Saved synthetic results'); return
    }
    if (request.method !== 'GET') { response.writeHead(405); response.end(); return }
    const file = resolve(root, '.' + (path === '/' ? '/native.html' : decodeURIComponent(path)))
    if (!file.startsWith(root + sep)) { response.writeHead(403); response.end(); return }
    response.setHeader('Content-Type', types[extname(file)] ?? 'text/plain; charset=utf-8')
    response.end(await readFile(file))
  } catch (error) { response.writeHead(400); response.end('Fixture request failed') }
})
server.on('error', error => { console.error(error.message); process.exitCode = 1 })
server.listen(5544, '127.0.0.1', () => console.log(JSON.stringify({ port: 5544, pid: process.pid, root })))
