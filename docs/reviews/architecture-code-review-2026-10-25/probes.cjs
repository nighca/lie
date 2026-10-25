// Run with Node 24; reads the frozen repository's TypeScript without editing it.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const root = process.argv[2] || path.resolve(__dirname, '../../..');
const ts = require(path.join(root, 'node_modules/typescript'));
const cache = new Map();
function load(relative) {
  const file = path.resolve(root, relative.endsWith('.ts') ? relative : relative + '.ts');
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'exports', js)(name => name === '@lie/game-core' ? load('packages/game-core/src/index') : load(path.relative(root, path.resolve(path.dirname(file), name))), exports);
  return exports;
}
(async () => {
  const { validateGame } = load('packages/game-core/src/content');
  const { buildCharacterContext } = load('packages/game-core/src/context');
  const game = validateGame({ id:'probe', title:'probe', background:'background', interrogationLimitSeconds:600, characters:[{ id:'a',name:'a',profile:'人'.repeat(12000),appearanceId:null }], ending:{culpritId:'a',reveal:'reveal'} });
  const bytes = new TextEncoder().encode(JSON.stringify(game)).length;
  assert(bytes < 128*1024);
  const { encodeGameLink, decodeSharedGame } = load('apps/web/src/editor/share');
  const link = await encodeGameLink(game, 'https://example.invalid');
  assert(link.length < 16000);
  assert.equal((await decodeSharedGame(new URL(link).hash, [])).characters[0].profile, game.characters[0].profile);
  const context = JSON.stringify(buildCharacterContext(game, 'a', []));
  const frame = JSON.stringify({ type:'mcp',payload:{jsonrpc:'2.0',id:1,result:{content:[{type:'text',text:context}],isError:false}} });
  const { relaySockets } = load('apps/gateway/src/index');
  function socket() { const listeners = {}; return { listeners, closed:[], sent:[], accept(){}, addEventListener(k,fn){listeners[k]=fn}, close(code){this.closed.push(code)},send(data){this.sent.push(data)} }; }
  const browser=socket(),upstream=socket(); relaySockets(browser,upstream);
  browser.listeners.message({data:frame});
  assert.deepEqual(browser.closed,[1009]); assert.equal(upstream.sent.length,0);
  console.log(JSON.stringify({probe:'CR-01',contentBytes:bytes,shareUrlCharacters:link.length,contextFrameBytes:new TextEncoder().encode(frame).length,closeCode:browser.closed[0],forwarded:upstream.sent.length}));
  let mounted=false, fetched=false;
  let source=fs.readFileSync(path.join(root,'apps/web/src/main.ts'),'utf8').split('\n').filter(line=>!line.startsWith('import ')&&!line.startsWith('const demo =')&&!line.startsWith('void main()')).join('\n');
  const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  const contextVm=vm.createContext({ fetch(){fetched=true;return new Promise(()=>{})}, createApp(){return {use(){},mount(){mounted=true}}},createRouter(){return {isReady:async()=>{}}},createWebHistory(){},Application:{},demo:false,readCharacterPresets(){return []} });
  vm.runInContext(js+'\nmain();',contextVm);
  await new Promise(resolve=>setTimeout(resolve,25));
  assert.equal(fetched,true); assert.equal(mounted,false);
  console.log(JSON.stringify({probe:'CR-02',optionalManifestPending:true,appMounted:mounted,elapsedObservationMs:25,limitation:'fake pending fetch; no browser/network outage claim'}));
})();
