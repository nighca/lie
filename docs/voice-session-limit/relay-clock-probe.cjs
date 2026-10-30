const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const { createHash } = require('node:crypto')
const { stripTypeScriptTypes } = require('node:module')
const path = require('node:path')
const vm = require('node:vm')
const root = path.resolve(__dirname, '../..')
const base = '60c11f72b71ead4b8e744f2281d5dbecb796d11a'
const source = execFileSync('git', ['show', `${base}:apps/gateway/src/index.ts`], { cwd: root, encoding: 'utf8' })
const code = stripTypeScriptTypes(source.slice(source.indexOf('export function relaySockets'))).replace('export function', 'function')
let now = 0, nextId = 0
const timers = new Map()
const scheduledDelays = []
const relay = vm.runInNewContext(`${code}; relaySockets`, {
  TextEncoder,
  setTimeout(callback, delay) { const id=++nextId; scheduledDelays.push(delay); timers.set(id,{callback,due:now+delay}); return id },
  clearTimeout(id) { timers.delete(id) },
})
function advance(ms) {
  now+=ms
  for (const [id,timer] of [...timers]) if(timer.due<=now) { timers.delete(id); timer.callback() }
}
function peer() {
  const listeners=new Map(), sent=[], closes=[]
  return {sent,closes,accepted:false,accept(){this.accepted=true},send(data){sent.push(data)},close(code,reason){closes.push({code,reason})},addEventListener(type,listener){listeners.set(type,listener)},emit(type,event){listeners.get(type)?.(event)}}
}
function pair() { const browser=peer(),upstream=peer(); relay(browser,upstream); assert(browser.accepted&&upstream.accepted); return {browser,upstream} }
const outcomes=[]
const first=pair()
assert.equal(scheduledDelays[0],180000)
advance(179999)
assert.equal(first.browser.closes.length,0)
first.browser.emit('message',{data:'active right before deadline'})
assert.equal(first.upstream.sent.length,1)
advance(1)
assert.equal(first.browser.closes[0].code,1000)
assert.equal(first.browser.closes[0].reason,'Conversation time limit')
assert.equal(first.upstream.closes.length,1)
first.upstream.emit('error',{})
first.browser.emit('message',{data:'late'})
assert.equal(first.browser.closes.length,1)
assert.equal(first.upstream.sent.length,1)
assert.equal(timers.size,0)
outcomes.push('180000ms timer; traffic does not refresh; paired/idempotent timeout close; late messages dropped')
const early=pair()
early.browser.emit('close',{code:1000,reason:'normal'})
assert.equal(timers.size,0)
advance(180001)
assert.equal(early.upstream.closes.length,1)
outcomes.push('early browser close clears timer and closes upstream once')
const a=pair(),b=pair()
a.upstream.emit('error',{})
assert.equal(a.browser.closes[0].code,1011)
assert.equal(b.browser.closes.length,0)
assert.equal(timers.size,1)
advance(180000)
assert.equal(b.browser.closes[0].reason,'Conversation time limit')
assert.equal(timers.size,0)
outcomes.push('independent relay lifetimes; upstream error closes one pair; remaining pair still expires')
console.log(JSON.stringify({base,sourceSha256:createHash('sha256').update(source).digest('hex'),runtime:process.version,mode:'actual base relay function with synthetic peers and fake clock; no workerd/network',outcomes,passed:true},null,2))
