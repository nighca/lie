import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Budget } from './release-api.mjs'

test('keeps cleanup reserve and counts upper bounds without phase reset',()=>{
  const b=new Budget();b.http(4);b.http(4);b.http(1);b.http(1)
  for(let n=0;n<6;n++)b.ws()
  assert.deepEqual(b.c,{http:16,logical:6,upgrades:12,socketMs:0})
  assert.throws(()=>b.ws(),/WS budget/)
  b.http(4);assert.throws(()=>b.http(1),/HTTP budget/)
  b.http(4,true);assert.throws(()=>b.http(1,true),/HTTP budget/)
})
test('resumed counters cannot bypass aggregate socket or HTTP limits',()=>{
  assert.throws(()=>new Budget({socketMs:90000}).ws(),/WS budget/)
  assert.throws(()=>new Budget({http:24}).http(1,true),/HTTP budget/)
  const b=new Budget({http:19});b.http(1);assert.throws(()=>b.http(1),/HTTP budget/)
})

import { validHello, validCookieAttributes, replacementProven } from './release-api.mjs'
test('requires protocol hello session and PCM16k mono',()=>{
 const good={transport:'websocket',session_id:'test',audio_params:{format:'pcm',sample_rate:16000,channels:1}}
 assert.equal(validHello(good),true)
 assert.equal(validHello({...good,session_id:''}),false)
 assert.equal(validHello({...good,audio_params:{...good.audio_params,sample_rate:24000}}),false)
})
test('checks HttpOnly Secure SameSite and root path without exposing Cookie',()=>{
 const good='__Host-lie-device=synthetic; Path=/; HttpOnly; SameSite=Lax; Secure'
 assert.equal(validCookieAttributes(good),true)
 assert.equal(validCookieAttributes(good.replace('; Secure','')),false)
 assert.equal(validCookieAttributes(good.replace('Path=/','Path=/other')),false)
})
test('does not confuse timeout or caller close with natural same-device replacement',()=>{
 const old={closed:true,code:1000,callerClose:false,limitClose:false,terminated:false,closedAt:20}
 assert.equal(replacementProven(old,{startedAt:10}),true)
 assert.equal(replacementProven({...old,limitClose:true},{startedAt:10}),false)
 assert.equal(replacementProven({...old,callerClose:true},{startedAt:10}),false)
 assert.equal(replacementProven({...old,closedAt:5},{startedAt:10}),false)
 assert.equal(replacementProven({...old,code:1006},{startedAt:10}),false)
})

import { requestTimeout, canUnbind } from './release-api.mjs'
test('prepare gets twenty seconds and every HTTP request is capped by phase/global cleanup reserve',()=>{
 assert.equal(requestTimeout(20000,220000,120000),20000)
 assert.equal(requestTimeout(20000,16000,120000),16000)
 assert.equal(requestTimeout(20000,220000,9000),9000)
 assert.equal(requestTimeout(8000,Infinity,5000,3000),3000)
 assert.throws(()=>requestTimeout(20000,0,120000),/exhausted/)
})
test('uncertain or unconfirmed preparation is never an automatic unbind target',()=>{
 const jar={preflightUnbound:true,prepareAttempted:true,bound:true,prepareUncertain:false,cleaned:false}
 assert.equal(canUnbind(jar),true)
 assert.equal(canUnbind({...jar,bound:false,prepareUncertain:true}),false)
 assert.equal(canUnbind({...jar,prepareUncertain:true}),false)
 assert.equal(canUnbind({...jar,preflightUnbound:false}),false)
})

import { advanceSocketCounter } from './release-api.mjs'
test('settles already-live sockets across an awaited save before increasing live count',()=>{
 const c={socketMs:0};let last=0
 last=advanceSocketCounter(c,last,5,1)
 last=advanceSocketCounter(c,last,20,1)
 last=advanceSocketCounter(c,last,25,2)
 assert.equal(c.socketMs,30)
 assert.equal(last,25)
})
