import { test } from 'node:test'
import assert from 'node:assert/strict'
import { patchVars, checkTime, deadline } from './release-ops.mjs'

test('replaces an existing selected key without altering neighboring r/n/backslash bytes', () => {
  const source='LINX_API_KEY=old-token\nOTHER=run\\north\nLINX_WS_TOKEN=retained\n'
  assert.equal(patchVars(source,{LINX_API_KEY:'new'}),'LINX_API_KEY="new"\nOTHER=run\\north\nLINX_WS_TOKEN=retained\n')
})
test('retains CRLF and exact non-target lines when replacing or appending', () => {
  const source='OTHER = raw\r\nLINX_API_KEY = old\r\nTAIL=nnrr'
  assert.equal(patchVars(source,{LINX_API_KEY:'next',VOICE_DEVICE_COOKIE_SECRET:'generated'}),'OTHER = raw\r\nLINX_API_KEY="next"\r\nTAIL=nnrr\r\nVOICE_DEVICE_COOKIE_SECRET="generated"\r\n')
})
test('appends to empty configuration and refuses duplicate selected keys', () => {
  assert.equal(patchVars('',{LINX_API_KEY:'new'}),'LINX_API_KEY="new"\n')
  assert.throws(()=>patchVars('LINX_API_KEY=a\nLINX_API_KEY=b\n',{LINX_API_KEY:'new'}),/Duplicate/)
})
test('stops at the absolute approved maintenance deadline',()=>{
  assert.doesNotThrow(()=>checkTime(deadline-1))
  assert.throws(()=>checkTime(deadline),/deadline/)
})
