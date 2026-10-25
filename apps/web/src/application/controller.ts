import { accuse, appendDialogue, buildCharacterContext, consumeInterrogationTime, createGameSession, endSession, getInterrogationRemainingMs, loadGame, restartSession, selectCharacter, startSession } from '@lie/game-core'
import type { DialogueEntry, GameSession } from '@lie/game-core'

import { VoiceAvailabilityError } from './voice'
import type { Conversation, ConversationEvent, VoiceFeedback, VoicePort } from './voice'

export interface GameView {
  phase: 'loading' | 'failed' | GameSession['phase']
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
  reveal: string | null
  result: { readonly characterId: string; readonly correct: boolean } | null
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
  resolveVoiceId?(appearanceId: string | null): string | null
}

export function createGameController(options: ControllerOptions) {
  let session: GameSession | null = null
  let loadState: 'loading' | 'failed' | null = 'loading'
  let loadEpoch = 0
  let voiceEpoch = 0
  let active: { connection: Conversation; abort: AbortController; epoch: number } | null = null
  let voiceStatus: GameView['voiceStatus'] = 'idle'
  let voiceFeedback: VoiceFeedback = { inputLevel: 0, outputLevel: 0, inputActive: false }
  const feedbackListeners = new Set<(feedback: VoiceFeedback) => void>()
  function publishFeedback(feedback: VoiceFeedback) {
    voiceFeedback = feedback
    for (const listener of feedbackListeners) listener({ ...feedback })
  }
  let busy = false
  let notice: string | null = null
  let accusationOpen = false
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
      voiceStatus, busy, notice, accusationOpen,
      conversationActive: active != null,
      interrogationRemainingMs: remainingMs(),
      reveal: session?.phase === 'solved' ? session.result!.reveal : null,
      result: session?.result == null ? null : { characterId: session.result.characterId, correct: session.result.correct },
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
    publishFeedback({ inputLevel: 0, outputLevel: 0, inputActive: false })
    previous?.abort.abort()
    previous?.connection.close()
    busy = false
    voiceStatus = 'idle'
    return expired
  }
  function showExpiry() {
    accusationOpen = true
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
    if (busy && event.type !== 'closed' && event.type !== 'error') return
    if (enabledAt != null && remainingMs() <= 0) { expireBudget(); return }
    if (event.type === 'audioLevel') {
      publishFeedback({ inputLevel: event.inputLevel, outputLevel: event.outputLevel, inputActive: event.inputActive })
      return
    }
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
      notice = event.type === 'error' && event.reason === 'context-too-large'
        ? '当前人物的设定或对话内容超出语音传输容量，无法继续本次对话。已显示转写保留；重新连接不会缩短这些内容。'
        : '语音暂时中断。已显示转写保留，你可以重新开始对话。'
    }
    publish()
  }

  async function startConversation() {
    const current = requireSession()
    if (current.phase !== 'interrogating' || accusationOpen || active != null || getInterrogationRemainingMs(current) <= 0) return
    stopVoice()
    const epoch = voiceEpoch
    const abort = new AbortController()
    const characterId = current.currentCharacterId!
    const appearanceId = current.game.characters.find((character) => character.id === characterId)!.appearanceId
    const voiceId = options.resolveVoiceId?.(appearanceId) ?? null
    const isCurrent = () => active?.epoch === epoch && session?.sessionId === current.sessionId && session.currentCharacterId === characterId && !abort.signal.aborted
    try {
      const connection = options.voice.create({
        sessionId: current.sessionId, characterId, voiceId, epoch, signal: abort.signal, isCurrent,
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
      await connection.open()
      if (!isCurrent()) return
      busy = false
      voiceStatus = 'recording'
      enabledAt = clock.now()
      tickBudget(epoch)
    } catch (error) {
      if (voiceEpoch === epoch && !abort.signal.aborted) {
        if (error instanceof VoiceAvailabilityError) {
          stopVoice()
          notice = error.reason === 'unavailable' ? '当前环境尚未开放语音体验。' : '暂时无法确认语音服务状态，请检查网络后重试。'
          publish()
        } else acceptEvent({ type: 'error' })
      }
    }
  }

  return {
    getView,
    getVoiceFeedback: (): VoiceFeedback => ({ ...voiceFeedback }),
    subscribeVoiceFeedback(listener: (feedback: VoiceFeedback) => void) {
      feedbackListeners.add(listener)
      listener({ ...voiceFeedback })
      return () => feedbackListeners.delete(listener)
    },
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
      const resume = active != null
      const expired = stopVoice()
      session = selectCharacter(requireSession(), characterId)
      if (expired) showExpiry()
      publish()
      if (resume && !expired) void startConversation()
    },
    startConversation,
    endConversation() {
      if (stopVoice()) showExpiry()
      publish()
    },
    openAccusation() {
      if (requireSession().phase !== 'interrogating') return
      if (stopVoice()) showExpiry()
      accusationOpen = true
      publish()
    },
    closeAccusation() { accusationOpen = false; publish() },
    accuse(characterId: string) {
      if (!accusationOpen) return
      stopVoice()
      session = accuse(requireSession(), characterId, options.now())
      accusationOpen = false
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
      notice = null
      publish()
    },
    dispose() { ++loadEpoch; stopVoice(); listeners.clear(); feedbackListeners.clear() },
  }
}

export type GameController = ReturnType<typeof createGameController>
