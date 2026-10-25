const parameters = new URLSearchParams(location.search)
const correct = parameters.get('result') !== 'wrong'
const missing = parameters.has('missing')
const character = correct ? { name: '顾遥', id: 'coral-bob' } : { name: '沈禾', id: 'sunny-moustache' }
document.body.classList.toggle('wrong', !correct)
document.body.classList.toggle('hide-words', parameters.has('hideWords'))
document.body.classList.toggle('gray', parameters.has('gray'))
document.querySelector('#badge').textContent = correct ? '指认正确' : '本局结束'
document.querySelector('#heading').textContent = correct ? '谜题解开了！' : '指认不正确'
document.querySelector('#name').textContent = parameters.has('longName') ? `来自社区摄影社的特别来宾${character.name}` : character.name
document.querySelector('#story-heading').textContent = correct ? '完整经过' : '这次调查已结束'
const portrait = document.querySelector('#portrait')
const initial = document.querySelector('#initial')
initial.textContent = character.name.slice(0, 1)
function showInitial() { portrait.hidden = true; initial.hidden = false }
portrait.addEventListener('error', showInitial)
if (missing) showInitial()
else portrait.src = `/design/character-presets/assets/${character.id}/default.png`
function paragraph(text) { const element = document.createElement('p'); element.textContent = text; document.querySelector('#story').append(element) }
if (correct) {
  fetch('/apps/web/public/games/empty-medal-box.json').then(response => response.json()).then(game => {
    for (const text of game.ending.reveal.split('\n\n')) paragraph(text)
    if (parameters.has('long')) paragraph('以下仅为排版压力测试，不属于案件真相。'.repeat(24))
  })
} else paragraph('想再试一次，请重新开始一局。')
