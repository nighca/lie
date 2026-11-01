import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = dirname(fileURLToPath(import.meta.url))
const require = createRequire(resolve(process.env.LIE_DEMO_TEST_ROOT ?? resolve(directory, '../../..'), 'package.json'))
const { JSDOM } = require('jsdom')
const fragment = await readFile(resolve(directory, 'demo.html'), 'utf8')
const results = []

function fixture() {
  let now = 0
  let sequence = 0
  const timers = new Map()
  const calls = []
  const dom = new JSDOM(fragment, {
    runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(window) {
      window.performance.now = () => now
      window.setTimeout = (callback, delay) => { const id = ++sequence; timers.set(id, { callback, at: now + delay, interval: null }); return id }
      window.setInterval = (callback, delay) => { const id = ++sequence; timers.set(id, { callback, at: now + delay, interval: delay }); return id }
      window.clearTimeout = window.clearInterval = id => timers.delete(id)
      window.HTMLDialogElement.prototype.showModal = function () { this.open = true; this.querySelector('[autofocus]').focus() }
      window.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new window.Event('close')) }
      for (const name of ['fetch', 'XMLHttpRequest', 'WebSocket']) window[name] = () => { calls.push(name); throw new Error(`Forbidden ${name}`) }
      window.navigator.mediaDevices = { getUserMedia() { calls.push('getUserMedia'); throw new Error('Forbidden microphone') } }
      Object.defineProperty(window, 'localStorage', { get() { calls.push('localStorage'); throw new Error('Forbidden storage') } })
    },
  })
  function advance(duration) {
    const target = now + duration
    for (;;) {
      const next = [...timers].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0]
      if (next == null) break
      const [id, timer] = next
      now = timer.at
      if (timer.interval == null) timers.delete(id)
      else timer.at += timer.interval
      timer.callback()
    }
    now = target
  }
  const q = selector => dom.window.document.querySelector(selector)
  return { dom, q, advance, calls, timers, click: selector => q(selector).click(), time: () => q('[data-time]').textContent }
}

async function check(name, run) {
  const test = fixture()
  try { run(test); assert.deepEqual(test.calls, []); results.push({ name, passed: true }) }
  finally { test.dom.window.close() }
}

await check('preparation is free, stop pauses, restart uses same budget', t => {
  t.click('[data-voice]'); t.advance(999); assert.equal(t.time(), '02:00')
  t.advance(1001); assert.equal(t.time(), '01:59')
  t.click('[data-voice]'); t.advance(4000); assert.equal(t.time(), '01:59')
  t.click('[data-voice]'); t.advance(2000); assert.equal(t.time(), '01:58')
})
await check('expanding and collapsing timing help does not pause', t => {
  t.click('[data-voice]'); t.advance(2000)
  t.click('[data-explain]'); assert.equal(t.q('[data-explain]').getAttribute('aria-expanded'), 'true')
  t.advance(1000); assert.equal(t.time(), '01:58')
  t.click('[data-explain]'); assert.equal(t.q('#lh-time-rules').hidden, true)
  t.advance(1000); assert.equal(t.time(), '01:57')
})
await check('active character switch prepares again, shares time and keeps histories', t => {
  t.click('[data-voice]'); t.advance(2000)
  assert.equal(t.q('[data-records]').children.length, 2)
  t.click('[data-person="1"]'); assert.equal(t.time(), '01:59')
  assert.equal(t.q('[data-voice]').textContent, '取消连接')
  t.advance(999); assert.equal(t.time(), '01:59')
  t.advance(1001); assert.equal(t.time(), '01:58')
  t.click('[data-voice]'); t.click('[data-person="0"]')
  assert.equal(t.q('[data-voice]').textContent, '开启模拟对话')
  assert.equal(t.q('[data-records]').children.length, 2)
  t.advance(3000); assert.equal(t.time(), '01:58')
})
await check('cancelled preparation cannot start late, same-person click is inert', t => {
  t.click('[data-voice]'); t.advance(300); t.click('[data-voice]'); t.advance(3000)
  assert.equal(t.time(), '02:00'); assert.equal(t.q('[data-records]').children.length, 1)
  t.click('[data-voice]'); t.advance(2000); t.click('[data-person="0"]'); t.advance(1000)
  assert.equal(t.time(), '01:58'); assert.equal(t.q('[data-voice]').textContent, '结束对话')
})
await check('accusation pauses; returning restores focus without resuming', t => {
  t.click('[data-voice]'); t.advance(2000); t.click('[data-answer]')
  assert.equal(t.q('dialog').open, true)
  assert.match(t.q('#lh-accusation-consequence').textContent, /立即提交.*结束本局/s)
  assert.equal(t.dom.window.document.activeElement, t.q('[data-return]'))
  t.advance(4000); assert.equal(t.time(), '01:59')
  t.click('[data-return]'); assert.equal(t.q('dialog').open, false)
  assert.equal(t.dom.window.document.activeElement, t.q('[data-answer]'))
  t.advance(1000); assert.equal(t.time(), '01:59')
})
await check('clicking either person immediately ends the demo, reset starts fresh', t => {
  t.click('[data-answer]'); t.click('[data-accuse="1"]')
  assert.equal(t.q('[data-investigation]').hidden, true)
  assert.equal(t.q('[data-result]').hidden, false)
  assert.match(t.q('[data-result-person]').textContent, /许澄/)
  assert.equal(t.q('dialog').open, false)
  assert.equal(t.dom.window.document.activeElement, t.q('[data-restart]'))
  t.click('[data-restart]'); assert.equal(t.time(), '02:00')
  assert.equal(t.q('[data-result]').hidden, true)
  assert.equal(t.q('[data-records]').children.length, 1)
  t.click('[data-answer]'); t.click('[data-accuse="0"]')
  assert.match(t.q('[data-result-person]').textContent, /林夏/)
})
await check('expiry stops conversation, allows review and does not repeatedly open on switch', t => {
  t.click('[data-voice]'); t.advance(121000)
  assert.equal(t.time(), '00:00'); assert.equal(t.q('dialog').open, true)
  assert.equal(t.q('[data-voice]').disabled, true)
  t.click('[data-return]'); t.click('[data-person="1"]')
  assert.equal(t.q('dialog').open, false)
  assert.equal(t.q('[data-expiry]').hidden, false)
  t.click('[data-answer]'); assert.equal(t.q('dialog').open, true)
})
await check('document hidden pauses current conversation', t => {
  t.click('[data-voice]'); t.advance(2000)
  Object.defineProperty(t.dom.window.document, 'hidden', { value: true })
  t.dom.window.document.dispatchEvent(new t.dom.window.Event('visibilitychange'))
  t.advance(4000); assert.equal(t.time(), '01:59')
  assert.equal(t.q('[data-voice]').textContent, '开启模拟对话')
})

assert.ok(Buffer.byteLength(fragment) < 1000000)
assert.equal(/<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i.test(fragment), false)
assert.equal(/\b(fetch|XMLHttpRequest|WebSocket|getUserMedia|localStorage|sessionStorage)\b/.test(fragment), false)
assert.equal(/<script[^>]+src|<img[^>]+src|@import|url\(/i.test(fragment), false)
const report = { date: '2026-11-01', node: process.version, jsdom: require('jsdom/package.json').version, checks: results, networkAndStorageCalls: 0, limits: ['jsdom dialog shim does not validate native focus trapping, Escape, layout, assistive technology or browser rendering', 'No product, real voice, microphone, provider, account, browser storage or service test'] }
await writeFile(resolve(directory, 'verification.json'), `${JSON.stringify(report, null, 2)}\n`)
console.log(`${results.length} interaction checks passed; static fragment checks passed; network/storage calls 0.`)
