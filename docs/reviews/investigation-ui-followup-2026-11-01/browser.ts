import { createApp, h, ref } from 'vue'
import Transcript from '../../../packages/ui/src/components/Transcript.vue'
import '../../../packages/ui/style.css'

createApp({
  setup() {
    const messages = ref(Array.from({ length: 12 }, (_, i) => ({ id: String(i), speaker: i % 2 ? '甲' : '你', text: `第${i + 1}条记录，供向上翻阅。`.repeat(4), mine: i % 2 === 0 })))
    const narrow = ref(false)
    let timer: ReturnType<typeof setInterval> | null = null
    const stop = () => { if (timer != null) clearInterval(timer); timer = null }
    return () => h('main', { style: { width: narrow.value ? '320px' : '600px', margin: '20px auto' } }, [
      h('p', '仅合成转写，无语音、网络或本地存储。滚动框内向上翻阅，再返回底部。'),
      h('button', { onClick() {
        stop()
        messages.value = [...messages.value, { id: String(messages.value.length), speaker: '甲', text: '', mine: false }]
        let count = 0
        timer = setInterval(() => {
          messages.value = messages.value.map((message, i) => i === messages.value.length - 1 ? { ...message, text: message.text + '这是一段持续流式输出的合成文字。' } : { ...message })
          if (++count === 80) stop()
        }, 150)
      } }, '开始流式输出'),
      h('button', { onClick: stop }, '停止输出'),
      h('button', { onClick() { narrow.value = !narrow.value } }, '切换宽度'),
      h(Transcript, { messages: messages.value, animate: true, style: { '--lie-transcript-max-height': '320px', marginTop: '20px' } }),
    ])
  },
}).mount('#app')
