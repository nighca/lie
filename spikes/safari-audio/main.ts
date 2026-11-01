import { createAudioProbe } from './probe'
import type { ProbeMode, ProbeReport } from './probe'

const start = document.querySelector<HTMLButtonElement>('#start')!
const stop = document.querySelector<HTMLButtonElement>('#stop')!
const mode = document.querySelector<HTMLSelectElement>('#mode')!
const status = document.querySelector<HTMLParagraphElement>('#status')!
const output = document.querySelector<HTMLTextAreaElement>('#report')!
const copy = document.querySelector<HTMLButtonElement>('#copy')!
const copyStatus = document.querySelector<HTMLParagraphElement>('#copy-status')!
const completed: ProbeReport[] = []
let trial: ReturnType<typeof createAudioProbe> | null = null
let copying = false
let trialGeneration = 0
const labels = { preparing: '正在准备；如出现权限提示，请选择允许或取消。', 'quiet-before': '静默基线：请先保持安静。', playing: '正在播放测试音。', 'quiet-after': '播放后静默：请继续保持安静。', stopped: '测试结束。' }

function update(report: ProbeReport) {
  status.textContent = report.error == null ? labels[report.phase] : `测试结束：${report.error}`
  output.value = JSON.stringify({ completed, current: report }, null, 2)
  if (report.phase !== 'stopped') return
  const cleaned = report.cleanup?.tracksEnded === true && report.cleanup.contextsClosed
  status.textContent += cleaned ? ' 麦克风和音频资源已释放。' : ' 清理未完成，请关闭本页；暂不开始新测试。'
  // Bound in-memory summaries; never keep PCM or persistent browser data.
  if (completed.length === 6) completed.shift()
  completed.push(report)
  trial = null
  start.disabled = !cleaned; mode.disabled = !cleaned; stop.disabled = true
  copy.disabled = copying
}
start.addEventListener('click', () => {
  if (!isSecureContext || navigator.mediaDevices?.getUserMedia == null) {
    status.textContent = '麦克风需要此设备信任的 HTTPS 页面；普通局域网 HTTP 地址不可用于本测试。'
    return
  }
  start.disabled = true; mode.disabled = true; stop.disabled = false
  trialGeneration++
  copy.disabled = true; copyStatus.textContent = ''
  trial = createAudioProbe(mode.value as ProbeMode, update)
  void trial.start()
})
stop.addEventListener('click', () => { stop.disabled = true; status.textContent = '正在释放；若权限提示尚未结束，请先允许或取消该提示。'; void trial?.stop() })
copy.addEventListener('click', async () => {
  if (copying || trial != null || output.value === '') return
  const text = output.value
  const generation = trialGeneration
  copying = true; copy.disabled = true; copyStatus.textContent = '正在复制…'
  try {
    await navigator.clipboard.writeText(text)
    copyStatus.textContent = generation === trialGeneration && output.value === text ? '已复制全部结果，可以直接粘贴发送。' : '已复制上一份结果；请等当前测试结束后再复制。'
  } catch {
    copyStatus.textContent = '未能复制，请长按下方结果复制。'
  } finally {
    copying = false; copy.disabled = trial != null || output.value === ''
  }
})
window.addEventListener('pagehide', () => { void trial?.stop() })
