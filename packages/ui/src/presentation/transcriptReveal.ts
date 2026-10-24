export interface RevealMessage {
  id: string
  speaker: string
  text: string
  mine?: boolean
  interrupted?: boolean
  pending?: boolean
}

export interface RevealRow<T> { key: number; message: T; text: string }

const frameMs = 32
const maxCatchupMs = 800
const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('zh', { granularity: 'grapheme' }) : null
const graphemes = (text: string) => segmenter == null ? [text] : Array.from(segmenter.segment(text), (part) => part.segment)

export function createTranscriptReveal<T extends RevealMessage>(changed: (rows: RevealRow<T>[]) => void) {
  let rows: RevealRow<T>[] = []
  let active: RevealRow<T> | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let deadline = 0
  let sequence = 0
  let initialized = false
  let disposed = false

  function cancelTimer() { if (timer != null) clearTimeout(timer); timer = null }
  function publish() { changed([...rows]) }
  function schedule() {
    cancelTimer()
    if (active == null) return
    timer = setTimeout(() => {
      timer = null
      if (active == null || disposed) return
      const target = graphemes(active.message.text)
      const shown = graphemes(active.text).length
      const remainingTime = Math.max(0, deadline - Date.now())
      const count = remainingTime === 0 ? target.length : Math.min(target.length, shown + Math.max(1, Math.ceil((target.length - shown) * frameMs / remainingTime)))
      active.text = target.slice(0, count).join('')
      if (active.text === active.message.text) active = null
      publish()
      schedule()
    }, frameMs)
  }

  return {
    update(messages: readonly T[], animate: boolean) {
      if (disposed) return
      const previous = rows
      const oldActive = active
      rows = messages.map((message, index) => {
        let row = previous.find((item) => item.message.id === message.id)
        const pending = previous[index]
        if (row == null && pending?.message.pending && !message.pending && !message.mine && pending.message.speaker === message.speaker && message.text.startsWith(pending.message.text)) row = pending
        if (row == null) row = { key: ++sequence, message: { ...message }, text: !initialized || message.mine ? message.text : '' }
        else if (!message.text.startsWith(row.message.text)) row.text = message.text
        row.message = { ...message }
        return row
      })
      const latest = rows.at(-1) ?? null
      const next = animate && segmenter != null && latest != null && !latest.message.mine && !latest.message.interrupted && latest.text !== latest.message.text ? latest : null
      for (const row of rows) if (row !== next) row.text = row.message.text
      active = next
      if (active !== oldActive) deadline = Date.now() + maxCatchupMs
      initialized = true
      publish()
      if (timer == null || active == null) schedule()
    },
    dispose() { disposed = true; cancelTimer(); active = null; rows = [] },
  }
}
