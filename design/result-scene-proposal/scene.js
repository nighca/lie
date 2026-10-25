const parameters = new URLSearchParams(location.search)
const correct = parameters.get('result') !== 'wrong'
const shortName = correct ? '顾遥' : '沈禾'
const name = parameters.has('longName') ? `来自社区摄影社的特别来宾${shortName}` : shortName
const portrait = document.querySelector('#portrait')
const initial = document.querySelector('#initial')
document.body.dataset.result = correct ? 'correct' : 'wrong'
document.body.style.setProperty('--accent', correct ? '#ff665b' : '#ffcf43')
document.querySelector('#name').textContent = name
document.querySelector('#badge').textContent = correct ? '指认正确' : '本局结束'
document.querySelector('#heading').textContent = correct ? '谜题解开了！' : '指认不正确'
document.querySelector('#story-heading').textContent = correct ? '完整经过' : '这次调查已结束'
initial.textContent = name.slice(0, 1)
portrait.addEventListener('error', () => { portrait.hidden = true; initial.hidden = false })
portrait.src = parameters.has('missing') ? './missing-portrait.png' : `../character-presets/assets/${correct ? 'coral-bob' : 'sunny-moustache'}/default.png`
const story = document.querySelector('#story')
function paragraph(text) { const element = document.createElement('p'); element.textContent = text; story.append(element) }
if (correct) {
  const game = await fetch('../../apps/web/public/games/empty-medal-box.json').then(response => response.json())
  for (const text of game.ending.reveal.split('\n\n')) paragraph(text)
  if (parameters.has('long')) {
    paragraph('以下仅为排版压力测试，不属于案件真相。'.repeat(12))
    paragraph('长中文姓名、连续正文与显式段落都需要保留，阅读完整经过后可以正常滚动到下方按钮。'.repeat(6))
  }
} else {
  paragraph('想再试一次，请重新开始一局。')
}
