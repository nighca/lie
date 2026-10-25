// Offline investigation. Requires the repository's existing TypeScript dependency.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.argv[2] || path.resolve(__dirname, '../../..');
const dependencyRoot = process.argv[3] || root;
const ts = require(path.join(dependencyRoot, 'node_modules/typescript'));
const cache = new Map();
function load(relative) {
  const file = path.resolve(root, relative.endsWith('.ts') ? relative : relative + '.ts');
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'exports', js)(name => name === '@lie/game-core' ? load('packages/game-core/src/index') : load(path.relative(root, path.resolve(path.dirname(file), name))), exports);
  return exports;
}
const bytes = value => new TextEncoder().encode(value).length;
const reply = (text, id=1) => JSON.stringify({type:'mcp',payload:{jsonrpc:'2.0',id,result:{content:[{type:'text',text}],isError:false}}});
const LIMIT=65536; // Existing gateway value, investigation only; not a proposed second runtime constant.
(async()=>{
  const {validateGame}=load('packages/game-core/src/content');
  const {buildCharacterContext}=load('packages/game-core/src/context');
  const {draftGame}=load('apps/web/src/editor/draft');
  const {encodeGameLink,decodeSharedGame}=load('apps/web/src/editor/share');
  const {createVoiceChannel}=load('packages/voice/src/channel');
  const {relaySockets}=load('apps/gateway/src/index');
  const preset={id:'coral-bob'};
  function game(profile) {return validateGame({id:'three-person-probe',title:'三人案',background:'公共背景',interrogationLimitSeconds:600,characters:['a','b','c'].map(id=>({id,name:id,profile:id==='a'?profile:'本人设定',appearanceId:preset.id})),ending:{culpritId:'a',reveal:'完整经过'}})}
  for(const [kind,profile] of [['normal','本人设定'],['large','人'.repeat(12000)]]) {
    const pack=game(profile);
    assert.equal(draftGame(pack,[preset]).characters.length,3);
    const link=await encodeGameLink(pack,'https://example.invalid');
    assert.equal((await decodeSharedGame(new URL(link).hash,[preset])).characters[0].profile,profile);
    const context=buildCharacterContext(pack,'a',[]);
    // Investigation-only alternative: retain instructions/facts in systemPrompt and complete history,
    // omit the duplicate background/profile keys; do not change actual runtime serializers.
    const compact={characterId:context.characterId,characterName:context.characterName,systemPrompt:context.systemPrompt,history:context.history};
    console.log(JSON.stringify({kind,characters:3,contentBytes:bytes(JSON.stringify(pack)),shareUrlCharacters:link.length,contextJsonBytes:bytes(JSON.stringify(context)),wireBytes:bytes(reply(JSON.stringify(context))),deduplicatedWireBytes:bytes(reply(JSON.stringify(compact)))}));
  }
  const pack=game('本人设定');
  const history=Array.from({length:40},(_,n)=>({id:String(n),role:n%2?'assistant':'user',text:'史'.repeat(600),at:n,interrupted:false}));
  const context=buildCharacterContext(pack,'a',history);
  console.log(JSON.stringify({kind:'history-growth',entries:40,charactersPerEntry:600,wireBytes:bytes(reply(JSON.stringify(context))),allHistoryRetained:true}));
  // Measure UTF-8 and JSON escaping, not JS text length. Backslash/quote/newline examples.
  for(const text of ['人','"','\\','\n']) console.log(JSON.stringify({kind:'escaping',text,jsLength:text.length,textBytes:bytes(text),wireBytes:bytes(reply(text)),wireBytesWithLongId:bytes(reply(text,'id-'.repeat(100)))}));
  // Invoke actual channel serialization and actual relay for exact inclusive boundary cases.
  for(const expected of [LIMIT,LIMIT+1]) {
    const text='x'.repeat(expected-bytes(reply('')));
    const sent=[], events=[];
    const socket={readyState:1,binaryType:'arraybuffer',send(value){sent.push(value)},close(){},onopen:null,onmessage:null,onerror:null,onclose:null};
    const channel=createVoiceChannel({createSocket:()=>socket,tools:[{name:'probe',description:'probe',inputSchema:{},execute:async()=>text}],onEvent:event=>events.push(event)});
    const opened=channel.open(); socket.onopen();
    socket.onmessage({data:JSON.stringify({type:'hello',transport:'websocket',audio_params:{format:'pcm',channels:1,sample_rate:16000}})});
    socket.onmessage({data:JSON.stringify({type:'mcp',payload:{id:0,method:'tools/list'}})});
    await opened;
    socket.onmessage({data:JSON.stringify({type:'mcp',payload:{id:1,method:'tools/call',params:{name:'probe'}}})});
    await new Promise(resolve=>setImmediate(resolve));
    const actual=sent.find(data=>typeof data==='string'&&data.includes('"id":1'));
    assert.equal(actual,reply(text)); assert.equal(bytes(actual),expected);
    function peer(){return {handlers:{},closed:[],sent:[],accept(){},addEventListener(type,handler){this.handlers[type]=handler},close(code){this.closed.push(code)},send(data){this.sent.push(data)}}}
    const browser=peer(),upstream=peer(); relaySockets(browser,upstream);
    browser.handlers.message({data:actual});
    if(expected===LIMIT){assert.equal(upstream.sent.length,1);assert.equal(browser.closed.length,0);browser.handlers.close({code:1000,reason:'probe complete'})}
    else {assert.deepEqual(browser.closed,[1009]);assert.equal(upstream.sent.length,0)}
    channel.close();
    console.log(JSON.stringify({kind:'wire-boundary',wireBytes:bytes(actual),forwarded:upstream.sent.length,closeCodes:browser.closed}));
  }
})();
