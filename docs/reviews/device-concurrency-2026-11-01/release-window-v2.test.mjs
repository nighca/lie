import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createWindow, windowFileArgument } from './release-window-v2.mjs'
const spec={id:'run02',start:'2026-11-01T08:00:00Z',end:'2026-11-01T08:20:00Z'}
test('requires root-issued bounded window and does not start early',()=>{
 let now=Date.parse(spec.start)-1;const w=createWindow(spec,()=>now)
 assert.throws(()=>w.assertActive(),/Outside/)
 now++;assert.doesNotThrow(()=>w.assertActive())
 assert.throws(()=>createWindow({...spec,end:'2026-11-01T08:21:00Z'}),/Invalid/)
 assert.throws(()=>windowFileArgument([]),/explicit/)
})
test('reserves global close and cleanup time through every request',()=>{
 let now=Date.parse(spec.start);const w=createWindow(spec,()=>now)
 assert.equal(w.remaining(),1139000)
 assert.equal(w.timeout(20000,{phaseRemaining:17000}),17000)
 now=Date.parse(spec.end)-65000
 assert.equal(w.timeout(10000),4000)
 assert.equal(w.timeout(8000,{cleanup:true,cleanupRemaining:3000}),3000)
 now=w.closeAtMs;assert.throws(()=>w.assertActive(),/Outside/)
 assert.equal(w.remaining(true),61000)
 now=w.endMs;assert.throws(()=>w.assertActive(true),/Outside/)
})
