import assert from 'node:assert/strict'
import path from 'node:path'
const {previousReleases}=await import(path.join(process.argv[2],'scripts/release-assets.mjs'))
const identity={repository:'nighca/lie',sourceSha:'f'.repeat(40),runId:9999,runAttempt:1}
const run=id=>({id,run_attempt:1,repository:{full_name:'nighca/lie'},head_repository:{full_name:'nighca/lie'},head_branch:'main',head_sha:id.toString(16).padStart(40,'0'),event:'push',path:'.github/workflows/ci.yml'})
const steps=time=>[{name:'Deploy verified production build',conclusion:'success',completed_at:time},{name:'Upload deployed immutable assets',conclusion:'success'}]
// The selected deployed archive has expired and has been removed from the listing.
const deleted={async json(url){if(url.includes('/workflows/'))return{total_count:1,workflow_runs:[run(1)]};if(url.includes('/jobs'))return{total_count:1,jobs:[{name:'verify',steps:steps('2026-10-01T00:00:00Z')}]};return{total_count:0,artifacts:[]}},async zip(){throw Error('must not download')}}
let expiredError=null;try{await previousReleases(deleted,identity,Date.parse('2026-10-25'))}catch(error){expiredError=error.message}
assert.equal(expiredError,'Deployed release artifact missing or ambiguous')
console.log(JSON.stringify({id:'RC-01',expiredArchiveOmittedByApi:true,result:expiredError,expectedPolicy:'explicit expiration omission or documented recovery, not mandatory download of a deleted object'}))
// Page1 has two eligible deployments but excludes an older-created run recently rerun/deployed.
const calls=[];const firstPage=Array.from({length:100},(_,i)=>run(200-i));const hidden=run(1)
const paged={async json(url){calls.push(url);if(url.includes('/workflows/'))return{total_count:101,workflow_runs:url.includes('page=2')?[hidden]:firstPage};if(url.includes('/jobs')){const id=Number(/runs\/(\d+)/.exec(url)[1]);return{total_count:1,jobs:[{name:'verify',steps:id===1?steps('2026-10-25T03:00:00Z'):id>=199?steps(`2026-10-25T0${id===200?2:1}:00:00Z`):[]}]}}const id=Number(/runs\/(\d+)/.exec(url)[1]);return{total_count:1,artifacts:[{id,name:`deployed-immutable-v1-${run(id).head_sha}-1`,size_in_bytes:1,workflow_run:{id,head_sha:run(id).head_sha,head_branch:'main'},expired:true,expires_at:'2026-10-24'}]}},async zip(){throw Error('expired fixture must not download')}}
const result=await previousReleases(paged,identity,Date.parse('2026-10-25'))
assert.deepEqual(result.skipped.map(x=>x.runId),[200,199]);assert(!calls.some(x=>x.includes('page=2')))
console.log(JSON.stringify({id:'RC-02',apiTotalCount:101,enumerated:100,hiddenOlderRunLatestDeployment:1,selected:result.skipped.map(x=>x.runId),requestedPage2:false,refusedIncompleteSearch:false}))
