import { createCanvasRenderer, loadAnimationPackage, sampleClip } from '../../../packages/character-animation/src/index'

const id = new URLSearchParams(location.search).get('id') ?? 'sunny-moustache'
const loaded = await loadAnimationPackage(new URL(`/design/result-reactions/${id}/package.json`, location.href), new AbortController().signal)
const states = ['default', 'accusedCorrectly', 'accusedWrongly'] as const
const items = states.map(state => {
  const canvas = document.querySelector<HTMLCanvasElement>(`#${state}`)!
  const renderer = createCanvasRenderer(canvas, loaded.data, loaded.images)
  const clip = loaded.data.clips[loaded.data.states[state]!]
  return { state, canvas, renderer, clip }
})
const slider = document.querySelector<HTMLInputElement>('#time')!
let frame = 0
function render(t: number) {
  for (const { renderer, clip, state } of items) renderer.render(sampleClip(loaded.data, clip, state === 'default' ? 0 : t * clip.duration))
  slider.value = String(t)
  document.querySelector('#status')!.textContent = `${id} · ${Math.round(t * 100)}% · 头身刚性，不循环`
}
for (const item of items.slice(1)) {
  item.renderer.render(sampleClip(loaded.data, item.clip, item.clip.duration))
  const anchor = document.querySelector<HTMLAnchorElement>(item.state === 'accusedCorrectly' ? '#correct' : '#wrong')!
  anchor.href = item.canvas.toDataURL('image/png')
  anchor.download = `${item.state}.png`
}
slider.addEventListener('input', () => { cancelAnimationFrame(frame); render(Number(slider.value)) })
document.querySelector('#replay')!.addEventListener('click', () => {
  cancelAnimationFrame(frame)
  const start = performance.now()
  function draw(now: number) { const t = Math.min((now - start) / 1250, 1); render(t); if (t < 1) frame = requestAnimationFrame(draw) }
  frame = requestAnimationFrame(draw)
})
render(1)
const checkButton = document.createElement('button')
checkButton.textContent = '检查终态一致'
checkButton.addEventListener('click', () => {
  const same = items.slice(1).every(item => item.canvas.toDataURL('image/png') === document.querySelector<HTMLAnchorElement>(item.state === 'accusedCorrectly' ? '#correct' : '#wrong')!.href)
  document.querySelector('#status')!.textContent = same ? '通过：播放终态与静态导出像素一致' : '未到终态'
})
document.querySelector('h1')!.after(checkButton)
