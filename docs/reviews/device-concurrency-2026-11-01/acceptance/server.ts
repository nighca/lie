import { readFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { Miniflare } from 'miniflare'
import { workerScript } from '../../apps/gateway/test/worker-script.ts'

// This harness uses only fixed fake keys and intercepts all outbound provider IO.
const port = 5182
await new Promise<void>((yes, no) => {
  const probe = createServer()
  probe.once('error', no)
  probe.listen(port, '127.0.0.1', () => probe.close(error => error ? no(error) : yes()))
})
const fixture = readFileSync(resolve('apps/gateway/test/voice-fixture.ts'), 'utf8')
const start = fixture.indexOf('export const fakeLinx = `') + 'export const fakeLinx = `'.length
const end = fixture.indexOf('`\n\nconst script', start)
if (start < 24 || end < start) throw new Error('Fake fixture not found')
const echo = "server.addEventListener('message',event=>{if(event.data === 'server-close')server.close(1000,'upstream complete');else server.send(event.data);});"
const protocol = `server.addEventListener('message',event=>{
  if(typeof event.data!=='string'){calls.input=(calls.input||0)+1;return;}
  const message=JSON.parse(event.data);
  const send=value=>server.send(JSON.stringify(value));
  if(message.type==='hello') {
    send({type:'hello',transport:'websocket',session_id:'fake-'+mac,audio_params:{format:'pcm',sample_rate:16000,channels:1,bits_per_sample:16}});
    for(const [id,method] of [[1,'initialize'],[2,'tools/list']])send({type:'mcp',payload:{jsonrpc:'2.0',id,method,params:{}}});
  }
  if(message.type==='listen'&&message.state==='start') {
    send({type:'stt',text:'合成输入，仅用于设备隔离验收'});
    send({type:'tts',state:'start'});send({type:'tts',state:'sentence_start',text:'这是 fake provider 的合成语音验收。'});
    for(let i=0;i<12;i++)server.send(new Uint8Array(640).buffer);send({type:'tts',state:'stop'});
  }
});`
let fake = fixture.slice(start, end)
if (!fake.includes(echo)) throw new Error('Fake protocol hook changed')
fake = fake.replace(echo, protocol)
const manifest = (modules: Record<string, {type:'esm';contents:string}>) => ({mainModule:'index.js',modulesRoot:process.cwd(),modules})
const script = await workerScript()
const wrapper = `import gateway from './gateway.js'; export default {async fetch(request,env,ctx){const path=new URL(request.url).pathname;if(path.startsWith('/__fake/'))return fetch('https://upstream.test/'+(path.endsWith('/control')?'control':'state'),{method:request.method,body:request.body,duplex:'half'});return gateway.fetch(request,env,ctx);}}`
const instance = new Miniflare({host:'127.0.0.1',port,workers:[{config:{name:'gateway',compatibilityDate:'2026-10-23',compatibilityFlags:['enable_request_signal'],manifest:manifest({'index.js':{type:'esm',contents:wrapper},'gateway.js':{type:'esm',contents:script}}),env:{LINX_API_KEY:{type:'text',value:'fake-management-key'},LINX_AGENT_ID:{type:'text',value:'test-agent'},VOICE_DEVICE_COOKIE_SECRET:{type:'text',value:'test-cookie-signing-key-at-least-32-bytes'},VOICE_DEVICE_ENVIRONMENT:{type:'text',value:'p0-browser-fake'},ASSETS:{type:'assets'}},assets:{directory:resolve('apps/web/dist'),hasUserWorker:true,notFoundHandling:'single-page-application',runWorkerFirst:['/api/*','/games/*','/static/*','/assets/*','/__fake/*']}},dev:{outboundService:{type:'worker',worker:'upstream'}}},{config:{name:'upstream',compatibilityDate:'2026-10-23',manifest:manifest({'index.js':{type:'esm',contents:fake}})}}]})
console.log(JSON.stringify({kind:'fake-only',url:String(await instance.ready),pid:process.pid}))
let stopping=false
async function stop(){if(stopping)return;stopping=true;await instance.dispose();process.exit(0)}
process.on('SIGINT',stop);process.on('SIGTERM',stop)
