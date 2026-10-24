import { spawn, execFileSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))

export function readMain(root) {
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
  if (git('rev-parse', '--show-toplevel') !== realpathSync(root)) throw new Error('Run from the main checkout root')
  if (git('branch', '--show-current') !== 'main') throw new Error('Checkout is not on main')
  if (git('status', '--porcelain', '--untracked-files=no') !== '') throw new Error('Tracked files are dirty')
  const sha = git('rev-parse', 'HEAD')
  if (git('rev-parse', 'refs/heads/main') !== sha) throw new Error('Checkout does not match main')
  return { sha, lock: git('rev-parse', 'HEAD:package-lock.json'), lockDirectory: git('rev-parse', '--git-path', 'main-preview.lock') }
}

function start(command, root, env) {
  const child = spawn(command[0], command.slice(1), { cwd: root, env, stdio: 'inherit', detached: true })
  const done = new Promise((resolveDone) => {
    child.once('error', (error) => resolveDone({ error }))
    child.once('exit', (code, signal) => resolveDone({ code, signal }))
  })
  const service = { child, done, result: null }
  void done.then((result) => { service.result = result })
  return service
}

async function stopChildren(children) {
  for (const { child } of children) {
    if (child.pid != null) {
      try { process.kill(-child.pid, 'SIGTERM') } catch (error) { if (error.code !== 'ESRCH') throw error }
    }
  }
  await Promise.race([Promise.all(children.map(({ done }) => done)), delay(1500)])
  for (const { child } of children) {
    if (child.pid != null) {
      try { process.kill(-child.pid, 'SIGKILL') } catch (error) { if (error.code !== 'ESRCH') throw error }
    }
  }
}

export async function runMainPreview({ root = projectRoot, pollMs = 1500, signal, commands = {
  install: ['npm', 'ci'],
  generate: [process.execPath, 'scripts/appearances.mjs'],
  services: [
    ['npm', 'run', 'dev', '--workspace', '@lie/gateway'],
    [process.execPath, 'node_modules/vite/bin/vite.js', 'apps/web', '--host', '127.0.0.1', '--port', '8787', '--strictPort']
  ]
} } = {}) {
  const initial = readMain(root)
  const lockDirectory = resolve(root, initial.lockDirectory)
  try { await mkdir(lockDirectory) }
  catch (error) {
    if (error.code !== 'EEXIST') throw error
    const conflict = new Error(`Another main preview owns ${lockDirectory}; check its owner before removing the lock`)
    let owner
    try { owner = Number(await readFile(resolve(lockDirectory, 'owner'), 'utf8')) } catch { throw conflict }
    if (!Number.isInteger(owner) || owner <= 0) throw conflict
    try { process.kill(owner, 0); throw conflict } catch (error) { if (error.code !== 'ESRCH') throw conflict }
    await mkdir(resolve(lockDirectory, 'reclaim'))
    await rm(lockDirectory, { recursive: true })
    await mkdir(lockDirectory)
  }
  await writeFile(resolve(lockDirectory, 'owner'), String(process.pid))
  let installedLock = null
  let children = []
  let activeSha = null
  let lastMessage = null
  let onAbort
  const aborted = new Promise((resolveAbort) => {
    onAbort = () => resolveAbort(null)
    if (signal?.aborted) onAbort()
    else signal?.addEventListener('abort', onAbort, { once: true })
  })
  try {
    while (!signal?.aborted) {
      let current
      try { current = readMain(root) }
      catch (error) {
        await stopChildren(children)
        children = []
        activeSha = null
        if (lastMessage !== error.message) console.error(`[main-preview] Paused: ${error.message}`)
        lastMessage = error.message
        await delay(pollMs, null, { signal }).catch(() => {})
        continue
      }
      if (current.sha !== activeSha) {
        await stopChildren(children)
        children = []
        if (current.lock !== installedLock) {
          console.log('[main-preview] Installing updated main dependencies with npm ci')
          const installation = start(commands.install, root, process.env)
          children = [installation]
          const result = await Promise.race([installation.done, aborted])
          if (signal?.aborted) break
          if (result.code !== 0) throw new Error('npm ci failed; preview stopped. Fix dependencies and restart dev:main')
          installedLock = current.lock
          children = []
          try { if (readMain(root).sha !== current.sha) continue } catch { continue }
        }
        const generation = start(commands.generate, root, process.env)
        children = [generation]
        const result = await Promise.race([generation.done, aborted])
        if (signal?.aborted) break
        if (result.code !== 0) throw new Error('Appearance generation failed; preview remains stopped')
        children = []
        try { if (readMain(root).sha !== current.sha) continue } catch { continue }
        const env = { ...process.env, LIE_GATEWAY_PORT: '8788', LIE_VOICE_GATEWAY_URL: 'http://127.0.0.1:8788', LIE_MAIN_SHA: current.sha }
        children = commands.services.map((command) => start(command, root, env))
        activeSha = current.sha
        lastMessage = null
        console.log(`[main-preview] Starting main ${activeSha} at http://127.0.0.1:8787`)
      }
      await delay(pollMs, null, { signal }).catch(() => {})
      const exited = children.find(({ result }) => result != null)
      if (exited != null && !signal?.aborted) throw new Error(`Preview service exited: ${JSON.stringify(exited.result)}`)
    }
  } finally {
    signal?.removeEventListener('abort', onAbort)
    await stopChildren(children)
    await rm(lockDirectory, { recursive: true })
  }
}

if (process.argv[1] != null && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const controller = new AbortController()
  process.once('SIGINT', () => controller.abort())
  process.once('SIGTERM', () => controller.abort())
  runMainPreview({ signal: controller.signal }).catch((error) => {
    console.error(`[main-preview] ${error.message}`)
    process.exitCode = 1
  })
}
