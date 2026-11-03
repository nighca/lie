import { fileURLToPath, URL as NodeURL } from 'node:url'

import { Miniflare } from 'miniflare'

import { browserDeviceCookie, newBrowserDevice } from '../src/browser-device'
import type { GatewayEnv } from '../src/index'

import { workerScript } from './worker-script'

export const testOrigin = 'https://game.example'
export const credentials = { VOICE_TRANSPORT: 'relay', LINX_API_KEY: 'fake-management-key', LINX_WS_TOKEN: 'fake-shared-token', LINX_AGENT_ID: 'test-agent', VOICE_DEVICE_COOKIE_SECRET: 'test-cookie-signing-key-at-least-32-bytes', VOICE_DEVICE_ENVIRONMENT: 'test' }
export const fakeLinx = `
const devices = new Map();
const sockets = new Map();
let options = {};
const calls = {ota:0,bind:0,list:0,ws:0};
export default { async fetch(request) {
  const url = new URL(request.url);
  if(url.origin === 'https://upstream.test') {
    if(url.pathname === '/control') { options = {...options,...await request.json()}; return Response.json({ok:true}); }
    return Response.json({calls,devices:Array.from(devices.values()).map(d=>({mac:d.mac,client:d.client,agent:d.agent}))});
  }
  if(url.origin === 'https://xrobo.qiniuapi.com' && url.pathname === '/v1/ota/') {
    calls.ota++;
    const body = await request.json();
    const mac = request.headers.get('Device-Id');
    const client = request.headers.get('Client-Id');
    if(body.mac_address !== mac || body.uuid !== client) return Response.json({error:'bad identity'});
    if(options.otaDelayMs) await new Promise(resolve=>setTimeout(resolve,options.otaDelayMs));
    if(options.otaBodyStall) return new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('{'));}}));
    if(options.oversizedOta) return Response.json({padding:'x'.repeat(65537)});
    if(!devices.has(mac)) devices.set(mac,{mac,client,code:String(devices.size+1).padStart(6,'0'),agent:null});
    const d=devices.get(mac);
    if(options.failConfirmedOta && d.agent) return new Response('private provider failure',{status:500});
    return Response.json(d.agent ? {websocket:{url:'ws://xrobo-io.qiniuapi.com/v1/ws/',token:'device-token-'+mac}} : {activation:{code:d.code}});
  }
  if(url.origin === 'https://xrobo.qiniu.com') {
    if(request.headers.get('Authorization') !== 'Bearer fake-management-key') return Response.json({code:401},{status:401});
    const parts=url.pathname.split('/');
    if(request.method === 'GET' && url.pathname === '/xiaozhi/device/bind/test-agent') {
      calls.list++;
      return Response.json({code:0,data:Array.from(devices.values()).filter(d=>d.agent==='test-agent').map(d=>({id:d.mac.toUpperCase(),macAddress:d.mac.toUpperCase(),agentId:options.foreignAgent?'other-agent':d.agent}))});
    }
    if(request.method === 'POST' && parts.length === 6 && parts[2] === 'device' && parts[3] === 'bind') {
      calls.bind++;
      const d=Array.from(devices.values()).find(d=>d.code===parts[5]);
      if(!d || options.rejectBind) return Response.json({code:409},{status:409});
      if(d.agent) return Response.json({code:409},{status:409});
      d.agent=parts[4];
      if(options.conflictAfterBind) return Response.json({code:409},{status:409});
      if(options.malformedAfterBind) return new Response('lost response');
      return Response.json({code:0,data:{macAddress:d.mac}});
    }
  }
  if(url.origin === 'https://xrobo-io.qiniuapi.com' && url.pathname === '/v1/ws/') {
    calls.ws++;
    const mac=request.headers.get('Device-Id'); const d=devices.get(mac);
    const authorization=request.headers.get('Authorization');
    if(!d?.agent || !(authorization === 'Bearer device-token-'+mac || authorization === 'Bearer fake-shared-token') || request.headers.get('X-Agent-ID') !== d.agent || request.headers.get('Client-Id') !== d.client || request.headers.get('Protocol-Version') !== '1') return new Response('private fake details',{status:401});
    if(options.rejectSharedToken && authorization === 'Bearer fake-shared-token') return new Response('expired shared token',{status:401});
    if(options.rejectWs) return new Response('private fake details',{status:401});
    const owner={};
    const [client,server]=Object.values(new WebSocketPair()); server.accept(); server.binaryType='arraybuffer'; sockets.set(mac,owner);
    const replacement=setInterval(()=>{if(sockets.get(mac)!==owner){clearInterval(replacement);server.close(1000,'Replaced by newer connection');}},5);
    server.addEventListener('message',event=>{if(event.data === 'server-close')server.close(1000,'upstream complete');else server.send(event.data);});
    server.addEventListener('close',event=>{clearInterval(replacement);if(sockets.get(mac)===owner)sockets.delete(mac);try{server.close(event.code===1005?1000:event.code,event.reason);}catch{}});
    return new Response(null,{status:101,webSocket:client});
  }
  return new Response('Unexpected fake request',{status:500});
} }`

const script = workerScript()
export async function voiceRuntime(bindings: Record<string, string> = credentials, upstream = fakeLinx, secondGateway = false) {
  const manifest = (contents: string) => ({ mainModule: 'index.js', modulesRoot: process.cwd(), modules: { 'index.js': { type: 'esm' as const, contents } } })
  const gateway = (name: string, contents: string) => ({
    config: {
      ...(name === 'gateway-two' ? { triggers: [{ type: 'fetch' as const, pattern: 'game-two.example/*' }] } : {}),
      name, compatibilityDate: '2026-10-23', compatibilityFlags: ['enable_request_signal'], manifest: manifest(contents),
      env: { ...Object.fromEntries(Object.entries(bindings).map(([key, value]) => [key, { type: 'text' as const, value }])), ...(name === 'gateway' ? { ASSETS: { type: 'assets' as const } } : {}) },
      ...(name === 'gateway' ? { assets: { directory: fileURLToPath(new NodeURL('./fixtures/', import.meta.url)), hasUserWorker: true, notFoundHandling: 'single-page-application' as const, runWorkerFirst: ['/api/*', '/games/*'] } } : {})
    },
    dev: { outboundService: { type: 'worker' as const, worker: 'upstream' } }
  })
  const instance = new Miniflare({ workers: [gateway('gateway', await script), ...(secondGateway ? [gateway('gateway-two', await script)] : []), { config: { name: 'upstream', compatibilityDate: '2026-10-23', manifest: manifest(upstream) } }] })
  await instance.ready
  return instance
}
export function cookieFrom(response: { headers: { get(name: string): string | null } }) {
  const cookie = response.headers.get('Set-Cookie')?.split(';')[0]
  if (!cookie) throw new Error('Missing fixture cookie')
  return cookie
}

export async function signedCookie(bindings: Record<string, string> = credentials) {
  const env: GatewayEnv = { ...credentials, VOICE_MAX_SESSION_SECONDS: '600', ...bindings,
    ASSETS: { fetch: async () => new Response('unused'), connect() { throw new Error('Unexpected asset connection') } } }
  const request = new Request(`${testOrigin}/api/voice/prepare`)
  return (await browserDeviceCookie(request, env, newBrowserDevice(request, env))).split(';')[0]
}
