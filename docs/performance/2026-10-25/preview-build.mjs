import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Miniflare } from 'miniflare'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const built = join(root, 'apps/gateway/.cloudflare/output/v0/workers/default')
const config = JSON.parse(await readFile(join(built, 'worker.config.json')))
const contents = await readFile(join(built, 'bundle/index.js'), 'utf8')
const runtime = new Miniflare({host:'127.0.0.1',port:5544,workers:[{config:{
  name:config.name,compatibilityDate:config.compatibilityDate,
  env:{ASSETS:{type:'assets'}},
  manifest:{mainModule:'index.js',modulesRoot:root,modules:{'index.js':{type:'esm',contents}}},
  assets:{...config.assets,directory:join(built,'assets'),hasUserWorker:true}
}}]})
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,async()=>{await runtime.dispose();process.exit(0)})
console.log(JSON.stringify({owner:'root/production_performance',pid:process.pid,url:String(await runtime.ready),purpose:'bounded IAB build acceptance; no provider credentials',stop:'Ctrl-C when acceptance ends'}))
