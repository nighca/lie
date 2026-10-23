import { accuse, appendDialogue, buildCharacterContext, createGameSession, endSession, loadGame, restartSession, selectCharacter, startSession } from '@lie/game-core'
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
  notice: string | null
  accusationOpen: boolean
  accusationFeedback: string | null
  reveal: string | null
}

export interface ControllerOptions {
  readGame(gameId: string): Promise<unknown>
  voice: VoicePort
  newSessionId(): string
  now(): number
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
  function stopVoice(interrupted = true) {
    flushPending(interrupted)
    voiceEpoch++
    const previous = active
    active = null
    previous?.abort.abort()
    previous?.connection.close()
    busy = false
    voiceStatus = 'idle'
  }
  function acceptEvent(event: ConversationEvent) {
    if (event.type === 'userText') append('user', event.text)
    if (event.type === 'speaking') voiceStatus = 'speaking'
    if (event.type === 'assistantText') { pendingText += event.text; voiceStatus = 'speaking' }
    if (event.type === 'idle') stopVoice(false)
    if (event.type === 'closed' || event.type === 'error') {
      stopVoice()
      voiceStatus = 'error'
      notice = '语音暂时中断。已显示转写保留，你可以重新开始说话。'
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
      stopVoice()
      session = selectCharacter(requireSession(), characterId)
      notice = '已切换人物，已显示转写保留。'
      publish()
    },
    async startInput() {
      const current = requireSession()
      if (current.phase !== 'interrogating' || accusationOpen || busy) return
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
        await connection.startInput()
        if (!isCurrent()) return
        busy = false
        voiceStatus = 'recording'
        publish()
      } catch {
        if (isCurrent()) acceptEvent({ type: 'error' })
      }
    },
    finishInput() {
      if (active == null || voiceStatus !== 'recording') return
      voiceStatus = 'waiting'
      try { active.connection.finishInput() } catch { acceptEvent({ type: 'error' }); return }
      publish()
    },
    interrupt() {
      stopVoice()
      notice = '已停止语音，已显示转写保留。'
      publish()
    },
    openAccusation() {
      if (requireSession().phase !== 'interrogating') return
      stopVoice()
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
      else accusationFeedback = '这次指认不正确。你可以返回调查，继续听取大家的说法。'
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
