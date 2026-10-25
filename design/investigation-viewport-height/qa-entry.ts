import { createApp, h } from 'vue'
import { loadGame } from '@lie/game-core'
import '@lie/ui/style.css'
import './src/style.css'
import App from './src/App.vue'
import { createGameController } from './src/application/controller'
import { readBundledCase } from './src/application/bundledCases'
import { createCharacterPresetLoader } from './src/presentation/characterPresetLoader'
import type { ConversationScope } from './src/application/voice'
const query = new URLSearchParams(location.search)
if (!query.has('frame')) {
  const frames = [['desktop',1280,878,'normal'],['wide-desktop',1289,878,'normal'],['short-desktop',1280,720,'normal'],['mobile',391,844,'normal'],['long-four',1280,878,'long'],['zoom-css-viewport',853,585,'long'],['very-short-desktop',1280,480,'normal'],['short-mobile',391,430,'normal'],['long-mobile',391,844,'long']] as const
  for (const [id,width,height,variant] of frames.filter(([id]) => !query.has('single') || id === query.get('single'))) { const f=document.createElement('iframe');f.id=id;f.title=id;f.width=String(width);f.height=String(height);f.src=`/__investigation_height_qa.html?frame=1&variant=${variant}`;document.getElementById('app')!.append(f) }
} else {
  const original = await loadGame('empty-medal-box', readBundledCase)
  const game = query.get('variant') === 'long' ? {...original,title:'摄影社十周年纪念展闭馆前那枚蓝色珐琅纪念章究竟被谁拿走了——一个需要认真询问的长标题案件',characters:[...original.characters,{...original.characters[0],id:'fourth-qa-person',name:'第四位人物'}]} : original
  let scope: ConversationScope | null = null, ready=()=>{}
  const controller = createGameController({readGame:async()=>game,now:Date.now,newSessionId:()=>crypto.randomUUID(),voice:{create(next){scope=next;return{open:()=>new Promise<void>(resolve=>{ready=resolve}),close(){}}}}})
  const presets=createCharacterPresetLoader()
  createApp({setup:()=>()=>h(App,{controller,characterPresets:presets.state.presets,demo:false,onNavigateHome:()=>controller.end(),onRequestEnd:()=>controller.end()})}).mount('#app')
  const tools=document.createElement('aside');tools.id='qa-controls';tools.style.cssText='position:fixed;right:0;top:0;z-index:50;background:white;font:11px system-ui'
  function button(text:string,run:()=>void){const b=document.createElement('button');b.textContent=text;b.onclick=run;tools.append(b)}
  button('准备就绪',()=>ready())
  button('填入长对话',()=>{for(let i=0;i<24;i++){scope?.onEvent({type:'userText',text:`第${i+1}次询问：请再说说你当时在哪里？`});scope?.onEvent({type:'assistantText',text:'我会按顺序说明当时的情况，这是一段用于验证询问记录内部滚动的离线文字。'});scope?.onEvent({type:'listening'})}})
  document.body.append(tools);await controller.load(game.id);void presets.load()
}
