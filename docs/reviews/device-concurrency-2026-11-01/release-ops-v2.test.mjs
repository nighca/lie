import { test } from 'node:test'
import assert from 'node:assert/strict'
import { allowedCurrent, uploadTimeout } from './release-ops-v2.mjs'
test('restore/application allow only exact original or expected bytes, including partial completion',()=>{
 const old=Buffer.from('original'),next=Buffer.from('expected')
 assert.equal(allowedCurrent(old,old,next),true)
 assert.equal(allowedCurrent(next,old,next),true)
 assert.equal(allowedCurrent(Buffer.from('external edit'),old,next),false)
})
test('one upload has finite maximum and retains CI/API reserve',()=>{
 assert.equal(uploadTimeout({remaining:()=>1139000}),300000)
 assert.equal(uploadTimeout({remaining:()=>500000}),110000)
 assert.throws(()=>uploadTimeout({remaining:()=>419999}),/Insufficient/)
})

import { parseRows, selectPreviousCandidate, candidateProjection, uploadDecision } from './release-ops-v2.mjs'
const id='11111111-1111-4111-8111-111111111111'
const version={id,annotations:{'workers/tag':'cookie-device-candidate-20261101'}}
const getFixture={...version,bindings:['LINX_API_KEY','LINX_WS_TOKEN','LINX_AGENT_ID','VOICE_DEVICE_COOKIE_SECRET','LINX_DEVICE_ID'].map(name=>({name,type:'secret_text'})),urls:['https://11111111-lie-game.nighca.workers.dev']}
test('accepts only observed list/get metadata shapes and never malformed-as-empty',()=>{
 assert.deepEqual(parseRows({deployments:[]},'deployments'),[])
 assert.throws(()=>parseRows({result:[]},'versions'),/Unrecognized/)
 assert.throws(()=>selectPreviousCandidate({versions:{items:[]}}),/Unrecognized/)
 assert.equal(candidateProjection(getFixture,id).url,'https://11111111-lie-game.nighca.workers.dev')
 assert.throws(()=>candidateProjection({...getFixture,urls:[]},id),/URL/)
 assert.throws(()=>candidateProjection({...getFixture,bindings:{}},id),/Malformed/)
})
test('reconciles one exact tag, stops ambiguity, and permits at most one new-tag upload',()=>{
 assert.equal(selectPreviousCandidate({versions:[version]}).previous.id,id)
 assert.equal(selectPreviousCandidate({versions:[]}).previous,null)
 assert.throws(()=>selectPreviousCandidate({versions:[version,{...version,id:'22222222-2222-4222-8222-222222222222'}]}),/Ambiguous/)
 assert.equal(uploadDecision({windowId:'run02',previous:candidateProjection(getFixture,id)},'run02',true),'reuse')
 assert.equal(uploadDecision({windowId:'run02',previous:null},'run02',false),'upload')
 assert.throws(()=>uploadDecision({windowId:'run02',previous:null},'run02',true),/already attempted/)
})
