import { accuse, appendDialogue, buildCharacterContext, consumeInterrogationTime, createGameSession, endSession, getInterrogationRemainingMs, loadGame, restartSession, selectCharacter, startSession } from '@lie/game-core'
import type { DialogueEntry, GameSession } from '@lie/game-core'

import type { Conversation, ConversationEvent, VoicePort } from './voice'

export interface GameView {
  phase: 'loading' | 'failed' | 'intro' | 'interrogating' | 'ended' | 'solved'
  title: string
  background: string
  characters: readonly { id: string; name: string; appearanceId: string | null }[]
  currentCharacterId: string | null
  history: readonly DialogueEntry[]
  voiceStatus: 'idle' | 'recording' | 'waiting' | 'speaking' | 'error'
  busy: boolean
  conversationActive: boolean
  interrogationRemainingMs: number
  notice: string | null
  accusationOpen: boolean
  accusationFeedback: string | null
  reveal: string | null
}

export interface ConversationClock {
  now(): number
  setTimeout(action: () => void, delayMs: number): ReturnType<typeof setTimeout>
  clearTimeout(timer: ReturnType<typeof setTimeout>): void
}

export interface ControllerOptions {
  readGame(gameId: string): Promise<unknown>
  voice: VoicePort
  newSessionId(): string
  now(): number
  clock?: ConversationClock
}

export function createGameController(options: ControllerOptions) {
  let session: GameSession | null = null
  let loadState: 'loading' | 'failed' | null = 'loading'
  let loadEpoch = 0
  let voiceEpoch = 0
  let active: { connection: Conversation; abort: AbortController; epoch: number } | null = null
  let voiceStatus: GameView['voiceStatus'] = 'idle'
  let busy = false
  let notice: string | null = null
  let accusationOpen = false
  let accusationFeedback: string | null = null
  let pendingText = ''
  let entrySequence = 0
  const clock: ConversationClock = options.clock ?? {
    now: () => performance.now(),
    setTimeout: (action, delay) => setTimeout(action, delay),
    clearTimeout: (timer) => clearTimeout(timer),
  }
  let enabledAt: number | null = null
  let budgetTimer: ReturnType<typeof setTimeout> | null = null
  const listeners = new Set<(view: GameView) => void>()

  function getView(): GameView {
    const history = session?.currentCharacterId != null ? session.histories[session.currentCharacterId].map((entry) => ({ ...entry })) : []
    return {
      phase: loadState ?? session!.phase,
      title: session?.game.title ?? '正在准备案件',
      background: session?.game.background ?? '',
      characters: session?.game.characters.map(({ id, name, appearanceId }) => ({ id, name, appearanceId })) ?? [],
      currentCharacterId: session?.currentCharacterId ?? null,
      history: pendingText.length > 0 ? [...history, { id: 'pending-answer', role: 'assistant', text: pendingText, at: options.now(), interrupted: false }] : history.map((entry) => ({ ...entry })),
      voiceStatus, busy, notice, accusationOpen, accusationFeedback,
      conversationActive: active != null,
      interrogationRemainingMs: remainingMs(),
      reveal: session?.phase === 'solved' ? session.result!.reveal : null,
    }
  }

  function publish() { for (const listener of listeners) listener(getView()) }
  function requireSession() {
    if (session == null) throw new Error('Game is not loaded')
    return session
  }
  function append(role: 'user' | 'assistant', text: string, interrupted = false) {
    const current = requireSession()
    session = appendDialogue(current, current.currentCharacterId!, { id: `${current.sessionId}-${++entrySequence}`, role, text, at: options.now(), interrupted })
  }
  function flushPending(interrupted: boolean) {
    if (pendingText.length === 0) return
    append('assistant', pendingText, interrupted)
    pendingText = ''
  }
  function remainingMs() {
    if (session == null) return 0
    return Math.max(0, getInterrogationRemainingMs(session) - (enabledAt == null ? 0 : Math.max(0, clock.now() - enabledAt)))
  }
  function settleTime() {
    if (budgetTimer != null) clock.clearTimeout(budgetTimer)
    budgetTimer = null
    if (enabledAt == null) return
    const elapsed = Math.max(0, clock.now() - enabledAt)
    enabledAt = null
    session = consumeInterrogationTime(requireSession(), elapsed)
  }
  function stopVoice(interrupted = true) {
    const expired = enabledAt != null && remainingMs() <= 0
    settleTime()
    flushPending(interrupted)
    voiceEpoch++
    const previous = active
    active = null
    previous?.abort.abort()
    previous?.connection.close()
    busy = false
    voiceStatus = 'idle'
    return expired
  }
  function showExpiry() {
    accusationOpen = true
    accusationFeedback = null
    notice = '询问时间已用完。你可以回看对话，并选择最终指认；重新开始一局可再次询问。'
  }
  function expireBudget() {
    stopVoice()
    showExpiry()
    publish()
  }
  function tickBudget(epoch: number) {
    if (active?.epoch !== epoch || enabledAt == null) return
    const remaining = remainingMs()
    if (remaining <= 0) { expireBudget(); return }
    budgetTimer = clock.setTimeout(() => tickBudget(epoch), Math.min(250, remaining))
    publish()
  }
  function acceptEvent(event: ConversationEvent) {
    if (enabledAt != null && remainingMs() <= 0) { expireBudget(); return }
    if (event.type === 'userText') { append('user', event.text); voiceStatus = 'waiting' }
    if (event.type === 'speaking') voiceStatus = 'speaking'
    if (event.type === 'assistantText') { pendingText += event.text; voiceStatus = 'speaking' }
    if (event.type === 'listening' || event.type === 'interrupted') {
      flushPending(event.type === 'interrupted')
      voiceStatus = 'recording'
    }
    if (event.type === 'closed' || event.type === 'error') {
      stopVoice()
      voiceStatus = 'error'
      notice = '语音暂时中断。已显示转写保留，你可以重新开始对话。'
    }
    publish()
  }

  return {
    getView,
    subscribe(listener: (view: GameView) => void) {
      listeners.add(listener)
      listener(getView())
      return () => listeners.delete(listener)
    },
    async load(gameId: string) {
      const request = ++loadEpoch
      stopVoice()
      session = null
      loadState = 'loading'
      accusationOpen = false
      accusationFeedback = null
      notice = null
      publish()
      try {
        const game = await loadGame(gameId, options.readGame)
        if (request !== loadEpoch) return
        session = createGameSession(game, { sessionId: options.newSessionId(), now: options.now() })
        loadState = null
      } catch {
        if (request !== loadEpoch) return
        loadState = 'failed'
        notice = '案件暂时无法加载，请稍后重试。'
      }
      publish()
    },
    start() {
      session = startSession(requireSession(), options.now())
      publish()
    },
    selectCharacter(characterId: string) {
      if (requireSession().currentCharacterId === characterId) return
      const expired = stopVoice()
      session = selectCharacter(requireSession(), characterId)
      if (expired) showExpiry()
      else notice = '已切换人物，已显示转写保留。'
      publish()
    },
    async startConversation() {
      const current = requireSession()
      if (current.phase !== 'interrogating' || accusationOpen || active != null || getInterrogationRemainingMs(current) <= 0) return
      stopVoice()
      const epoch = voiceEpoch
      const abort = new AbortController()
      const characterId = current.currentCharacterId!
      const isCurrent = () => active?.epoch === epoch && session?.sessionId === current.sessionId && session.currentCharacterId === characterId && !abort.signal.aborted
      const connection = options.voice.create({
        sessionId: current.sessionId, characterId, epoch, signal: abort.signal, isCurrent,
        readContext() {
          if (!isCurrent()) throw new Error('Conversation is no longer active')
          const live = requireSession()
          return buildCharacterContext(live.game, characterId, live.histories[characterId])
        },
        onEvent(event) { if (isCurrent()) acceptEvent(event) },
      })
      active = { connection, abort, epoch }
      busy = true
      voiceStatus = 'waiting'
      notice = null
      publish()
      try {
        await connection.open()
        if (!isCurrent()) return
        busy = false
        voiceStatus = 'recording'
        enabledAt = clock.now()
        tickBudget(epoch)
      } catch {
        if (isCurrent()) acceptEvent({ type: 'error' })
      }
    },
    endConversation() {
      if (stopVoice()) showExpiry()
      else notice = '已结束对话，已显示转写保留。'
      publish()
    },
    openAccusation() {
      if (requireSession().phase !== 'interrogating') return
      if (stopVoice()) showExpiry()
      accusationOpen = true
      accusationFeedback = null
      publish()
    },
    closeAccusation() { accusationOpen = false; accusationFeedback = null; publish() },
    accuse(characterId: string) {
      if (!accusationOpen) return
      stopVoice()
      session = accuse(requireSession(), characterId, options.now())
      if (session.phase === 'solved') accusationOpen = false
      else accusationFeedback = getInterrogationRemainingMs(session) > 0 ? '这次指认不正确。你可以返回调查，继续听取大家的说法。' : '这次指认不正确。你可以回看对话，再次指认，或重新开始一局。'
      publish()
    },
    end() {
      stopVoice()
      session = endSession(requireSession(), options.now())
      accusationOpen = false
      notice = null
      publish()
    },
    restart() {
      stopVoice()
      session = restartSession(requireSession(), { sessionId: options.newSessionId(), now: options.now() })
      accusationOpen = false
      accusationFeedback = null
      notice = null
      publish()
    },
    dispose() { ++loadEpoch; stopVoice(); listeners.clear() },
  }
}

export type GameController = ReturnType<typeof createGameController>
