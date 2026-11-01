import { readFile } from 'node:fs/promises'

export function createWindow(spec, now = Date.now) {
  const startMs = Date.parse(spec?.start), endMs = Date.parse(spec?.end)
  if (!/^[a-z0-9][a-z0-9-]{0,47}$/.test(spec?.id ?? '') || !Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs || endMs-startMs > 1200000) throw Error('Invalid explicit release window')
  const result = {
    id: spec.id, startMs, endMs, now,
    closeAtMs: endMs-61000,
    remaining(cleanup = false) { return Math.max(0,endMs-now()-(cleanup?0:61000)) },
    assertActive(cleanup = false) { if(now()<startMs || result.remaining(cleanup)<=0)throw Error('Outside approved release window') },
    timeout(requested,{cleanup=false,phaseRemaining=Infinity,cleanupRemaining=Infinity}={}) {
      result.assertActive(cleanup)
      const value=Math.floor(Math.min(requested,result.remaining(cleanup),phaseRemaining,cleanupRemaining))
      if(!Number.isFinite(value)||value<=0)throw Error('Request budget exhausted')
      return value
    },
  }
  return result
}
export async function readWindow(path) {
  if (!path) throw Error('Root-issued window file required')
  return createWindow(JSON.parse(await readFile(path,'utf8')))
}
export function windowFileArgument(argv) {
  const index=argv.indexOf('--window-file')
  if(index<0 || !argv[index+1] || argv.filter(v=>v==='--window-file').length!==1)throw Error('Exactly one explicit window file required')
  return argv[index+1]
}
