const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = require('node:path').resolve(__dirname, '../..');
const baseline = '60c11f72b71ead4b8e744f2281d5dbecb796d11a';
function source(path) { return require('node:child_process').execFileSync('git', ['show', baseline + ':' + require('node:path').relative(root, path)], {cwd:root, encoding:'utf8'}); }
function load(path) {
  const input = source(path);
  const code = ts.transpileModule(input, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = {exports:{}};
  vm.runInNewContext(code, {module, exports:module.exports, require:id=>load(require('node:path').resolve(require('node:path').dirname(path), id+'.ts')), setInterval, clearInterval, Uint8Array, Float32Array, DataView});
  return module.exports;
}
const {createPcmPlayer} = load(root+'/packages/voice/src/player.ts');
function context() { const sources=[]; return { currentTime:0,destination:{},sources,createBuffer(ch,n,rate){ return { duration:n/rate,copyToChannel(){} }},createBufferSource(){ const node={connect(){},disconnect(){this.disconnected=true},stop(){this.stopped=true},start(t){this.started=t},onended:null};sources.push(node);return node; } }; }
const format={format:'pcm',channels:1,bitsPerSample:16,sampleRate:16000,frameDuration:20};
const results=[];
for (const arrival of [.01,.02,.03,.04,.05]) {
 const ctx=context();const p=createPcmPlayer(ctx); p.enqueue(new Uint8Array(640),format);ctx.currentTime=arrival;p.enqueue(new Uint8Array(640),format);
 const end=ctx.sources[0].started+.02;const start=ctx.sources[1].started;
 results.push({secondArrivalMs:arrival*1000,firstStartMs:ctx.sources[0].started*1000,firstEndMs:end*1000,secondStartMs:start*1000,gapMs:Math.round((start-end)*1000)});
 if(arrival===.03) assert.equal(Math.round((start-end)*1000),10);
 p.stop(); assert(ctx.sources.every(s=>s.stopped&&s.disconnected&&s.onended===null));
}
console.log(JSON.stringify({head:baseline, sourceSha256:Object.fromEntries(['player','pcm'].map(name=>[name,require('node:crypto').createHash('sha256').update(source(root+'/packages/voice/src/'+name+'.ts')).digest('hex')])),source:'actual player.ts/pcm.ts transpiled with installed TypeScript; fake AudioContext',results},null,2));
