import { createCanvasRenderer } from '../../../packages/character-animation/src/canvas'
import { loadAnimationPackage } from '../../../packages/character-animation/src/load'
import { sampleClip } from '../../../packages/character-animation/src/playback'
const loaded = await loadAnimationPackage(new URL('./package.json', location.href), new AbortController().signal)
const panels = ['accusedCorrectly', 'accusedWrongly'].map(state => {
 const canvas = document.createElement('canvas'); document.querySelector('main')!.append(canvas)
 const renderer = createCanvasRenderer(canvas, loaded.data, loaded.images)
 const clip = loaded.data.clips[loaded.data.states[state]!]!
 return { state, canvas, renderer, clip }
})
const draw = (time: number) => {for (const p of panels) p.renderer.render(sampleClip(loaded.data,p.clip,time));document.querySelector('output')!.textContent = `t=${time.toFixed(2)}`}
let frame = 0
const replay = () => {cancelAnimationFrame(frame);const start=performance.now();const step = (now:number) => {const t=Math.min(1.2,(now-start)/1000);draw(t);if(t<1.2)frame=requestAnimationFrame(step)};frame=requestAnimationFrame(step)}
document.querySelector('button')!.onclick=replay
document.querySelector('input')!.oninput = event => {cancelAnimationFrame(frame);draw(Number((event.target as HTMLInputElement).value))}
draw(1.2)
for(const p of panels){const a=document.createElement('a');a.textContent=p.state;a.download=p.state+'.png';a.href=p.canvas.toDataURL();a.id=p.state;document.body.append(a)}
