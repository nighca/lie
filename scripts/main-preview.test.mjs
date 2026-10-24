import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { readMain, runMainPreview } from './main-preview.mjs'

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'lie-main-preview-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  git('init', '-b', 'main')
  git('config', 'user.name', 'Preview Test')
  git('config', 'user.email', 'preview@example.test')
  await writeFile(join(root, '.gitignore'), 'events\n')
  await writeFile(join(root, 'package-lock.json'), '{}\n')
  await writeFile(join(root, 'source'), 'first\n')
  const commit = () => { git('add', '.gitignore', 'package-lock.json', 'source'); git('commit', '-m', 'fixture'); return git('rev-parse', 'HEAD') }
  commit()
  const script = (body) => [process.execPath, '-e', body]
  const record = (event) => `require('node:fs').appendFileSync('events', JSON.stringify(${event})+'\\n');`
  const commands = {
    generate: script(record("{event:'generate'}")),
    install: script(record("{event:'install'}")),
    services: [script(`${record("{event:'start',sha:process.env.LIE_MAIN_SHA,pid:process.pid,gateway:process.env.LIE_GATEWAY_PORT}")}setInterval(()=>{},1000)`)]
  }
  const events = async () => {
    try { return (await readFile(join(root, 'events'), 'utf8')).trim().split('\n').map(JSON.parse) }
    catch (error) { if (error.code === 'ENOENT') return []; throw error }
  }
  return { root, git, commit, script, commands, events }
}

async function until(check) {
  const deadline = Date.now() + 5000
  while (!(await check())) {
    if (Date.now() > deadline) throw new Error('Timed out waiting for preview')
    await delay(20)
  }
}

function running(t, options) {
  const controller = new AbortController()
  const done = runMainPreview({ ...options, pollMs: 30, signal: controller.signal })
  // Mark rejection handled while tests inspect a running process.
  void done.catch(() => {})
  t.after(async () => { controller.abort(); await done.catch(() => {}) })
  return { done, controller }
}

function alive(pid) {
  try { process.kill(pid, 0); return true } catch (error) { if (error.code === 'ESRCH') return false; throw error }
}

test('refreshes clean main, pauses dirty source, resumes, and cleans only its own process', async (t) => {
  const f = await fixture(t)
  const runner = running(t, f)
  await until(async () => (await f.events()).some((event) => event.event === 'start'))
  const first = (await f.events()).find((event) => event.event === 'start')
  assert.equal(first.sha, f.git('rev-parse', 'HEAD'))
  assert.equal(first.gateway, '8788')
  await assert.rejects(runMainPreview({ ...f }), /Another main preview owns/)
  await writeFile(join(f.root, 'source'), 'second\n')
  await until(() => !alive(first.pid))
  assert.throws(() => readMain(f.root), /dirty/)
  const sha = f.commit()
  await until(async () => (await f.events()).some((event) => event.sha === sha))
  const second = (await f.events()).find((event) => event.sha === sha)
  f.git('switch', '-c', 'other')
  await until(() => !alive(second.pid))
  f.git('switch', 'main')
  await until(async () => (await f.events()).filter((event) => event.event === 'start').length === 3)
  runner.controller.abort()
  await runner.done
  assert.equal((await f.events()).filter((event) => event.event === 'generate').length, 3)
  await assert.rejects(readFile(join(f.root, '.git/main-preview.lock')), { code: 'ENOENT' })
})

test('installs changed lock before regeneration and stops on install failure', async (t) => {
  const f = await fixture(t)
  f.commands.install = f.script("const fs=require('node:fs'); fs.appendFileSync('events', JSON.stringify({event:'install'})+'\\n'); if(fs.readFileSync('package-lock.json','utf8').includes('changed')) process.exit(3)")
  const runner = running(t, f)
  await until(async () => (await f.events()).some((event) => event.event === 'start'))
  const first = (await f.events()).find((event) => event.event === 'start')
  await writeFile(join(f.root, 'package-lock.json'), '{"changed":true}\n')
  f.commit()
  await assert.rejects(runner.done, /npm ci failed/)
  assert.equal(alive(first.pid), false)
  assert.deepEqual((await f.events()).map((event) => event.event), ['install', 'generate', 'start', 'install'])
})

test('new lock regenerates and launches new SHA after successful installation', async (t) => {
  const f = await fixture(t)
  const runner = running(t, f)
  await until(async () => (await f.events()).some((event) => event.event === 'start'))
  await writeFile(join(f.root, 'package-lock.json'), '{"changed":true}\n')
  const sha = f.commit()
  await until(async () => (await f.events()).some((event) => event.sha === sha))
  assert.deepEqual((await f.events()).map((event) => event.event), ['install', 'generate', 'start', 'install', 'generate', 'start'])
  runner.controller.abort()
  await runner.done
})

test('service failure stops its sibling and releases lock for a later restart', async (t) => {
  const f = await fixture(t)
  f.commands.services.push(f.script('setTimeout(()=>process.exit(2),100)'))
  const runner = running(t, f)
  await assert.rejects(runner.done, /Preview service exited/)
  const first = (await f.events()).find((event) => event.event === 'start')
  assert.equal(alive(first.pid), false)
  await assert.rejects(readFile(join(f.root, '.git/main-preview.lock')), { code: 'ENOENT' })
})


test('reclaims a verified dead owner but preserves unknown owner locks', async (t) => {
  const f = await fixture(t)
  const dead = Number(execFileSync(process.execPath, ['-e', 'console.log(process.pid)'], { encoding: 'utf8' }).trim())
  const lock = join(f.root, '.git/main-preview.lock')
  await mkdir(lock)
  await writeFile(join(lock, 'owner'), String(dead))
  const runner = running(t, f)
  await until(async () => (await f.events()).some((event) => event.event === 'start'))
  assert.equal(await readFile(join(lock, 'owner'), 'utf8'), String(process.pid))
  runner.controller.abort()
  await runner.done
  await mkdir(lock)
  await assert.rejects(runMainPreview({ ...f }), /Another main preview owns/)
})


test('web dev server blocks private gateway files while exposing main SHA', async (t) => {
  const { createServer, loadConfigFromFile } = await import('vite')
  const root = await mkdtemp(join(tmpdir(), 'lie-preview-private-'))
  const gateway = join(root, 'gateway')
  await mkdir(join(gateway, '.cloudflare'), { recursive: true })
  for (const file of ['.dev.vars', '.dev.vars.local', '.linx-api-key', '.env', '.cloudflare/private.json']) {
    await writeFile(join(gateway, file), 'fixture-private-marker')
  }
  process.env.LIE_MAIN_SHA = 'fixture-main-sha'
  const loaded = await loadConfigFromFile({ command: 'serve', mode: 'development' }, new URL('../apps/web/vite.config.ts', import.meta.url).pathname)
  const server = await createServer({
    ...loaded.config,
    configFile: false,
    root,
    logLevel: 'silent',
    server: { ...loaded.config.server, port: 0, fs: { ...loaded.config.server.fs, allow: [root] } }
  })
  t.after(async () => { await server.close(); delete process.env.LIE_MAIN_SHA; await rm(root, { recursive: true, force: true }) })
  await server.listen()
  const address = server.httpServer.address()
  const base = `http://127.0.0.1:${address.port}`
  for (const file of ['.dev.vars', '.dev.vars.local', '.linx-api-key', '.env', '.cloudflare/private.json']) {
    const response = await fetch(`${base}/@fs/${join(gateway, file)}`)
    assert.equal(response.status, 403, file)
    assert.equal((await response.text()).includes('fixture-private-marker'), false)
  }
  const status = await fetch(`${base}/__lie/main-status`)
  assert.deepEqual(await status.json(), { branch: 'main', sha: 'fixture-main-sha' })
  assert.equal(status.headers.get('cache-control'), 'no-store')
})

test('cancelling installation stops its process group before any services start', async (t) => {
  const f = await fixture(t)
  f.commands.install = f.script(`
    const child = require('node:child_process').spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { stdio: 'ignore' });
    require('node:fs').appendFileSync('events', JSON.stringify({event:'install',pid:process.pid,descendant:child.pid})+'\\n');
    setInterval(()=>{},1000);
  `)
  const runner = running(t, f)
  await until(async () => (await f.events()).length > 0)
  const installation = (await f.events())[0]
  runner.controller.abort()
  await runner.done
  await until(() => !alive(installation.descendant))
  assert.equal(alive(installation.pid), false)
  assert.deepEqual((await f.events()).map((event) => event.event), ['install'])
})


test('concurrent dead-lock reclaimers launch only one service group', async (t) => {
  const f = await fixture(t)
  const dead = Number(execFileSync(process.execPath, ['-e', 'console.log(process.pid)'], { encoding: 'utf8' }).trim())
  const lock = join(f.root, '.git/main-preview.lock')
  await mkdir(lock)
  await writeFile(join(lock, 'owner'), String(dead))
  const controller = new AbortController()
  const errors = []
  const contenders = Array.from({ length: 2 }, () => {
    const result = runMainPreview({ ...f, pollMs: 30, signal: controller.signal })
    void result.catch((error) => { errors.push(error) })
    return result
  })
  try {
    await until(async () => errors.length === 1 && (await f.events()).some((event) => event.event === 'start'))
    assert.equal(await readFile(join(lock, 'owner'), 'utf8'), String(process.pid))
    assert.equal((await f.events()).filter((event) => event.event === 'start').length, 1)
  } finally {
    controller.abort()
    const outcomes = await Promise.allSettled(contenders)
    assert.equal(outcomes.filter((result) => result.status === 'fulfilled').length, 1)
    assert.equal(outcomes.filter((result) => result.status === 'rejected').length, 1)
  }
})

test('default runner generates the current character preset source before launching services', async (t) => {
  const f = await fixture(t)
  await mkdir(join(f.root, 'scripts'))
  await mkdir(join(f.root, 'node_modules/vite/bin'), { recursive: true })
  await mkdir(join(f.root, 'bin'))
  await writeFile(join(f.root, 'scripts/character-presets.mjs'), "import { appendFileSync } from 'node:fs';appendFileSync('events', JSON.stringify({event:'generate'})+'\\n')")
  await writeFile(join(f.root, 'node_modules/vite/bin/vite.js'), "require('node:fs').appendFileSync('events', JSON.stringify({event:'web'})+'\\n');setInterval(()=>{},1000)")
  const npm = join(f.root, 'bin/npm')
  await writeFile(npm, `#!${process.execPath}\nconst fs=require('node:fs'); const install=process.argv[2]==='ci'; fs.appendFileSync('events',JSON.stringify({event:install?'install':'gateway'})+'\\n'); if(!install)setInterval(()=>{},1000)`, { mode: 0o755 })
  const previous = process.env.PATH
  process.env.PATH = `${join(f.root, 'bin')}:${previous}`
  const controller = new AbortController()
  const done = runMainPreview({ root: f.root, pollMs: 30, signal: controller.signal })
  void done.catch(() => {})
  try {
    await until(async () => {
      const events = await f.events()
      return events.some(({ event }) => event === 'web') && events.some(({ event }) => event === 'gateway')
    })
    const events = (await f.events()).map(({ event }) => event)
    assert.deepEqual(events.slice(0, 2), ['install', 'generate'])
  } finally {
    controller.abort()
    await done
    process.env.PATH = previous
  }
})
