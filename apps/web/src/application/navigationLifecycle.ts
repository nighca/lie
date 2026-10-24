import type { GameController } from './controller'

export function observeNavigationLifecycle(getController: () => GameController | null, discard: () => void, restore: () => void, page: Document, browser: Window) {
  function beforeUnload(event: BeforeUnloadEvent) {
    if (getController()?.getView().phase !== 'interrogating') return
    event.preventDefault()
    event.returnValue = ''
  }
  function hidden() {
    const controller = getController()
    if (page.hidden && controller?.getView().conversationActive) controller.endConversation()
  }
  function shown(event: PageTransitionEvent) { if (event.persisted) restore() }
  page.addEventListener('visibilitychange', hidden)
  browser.addEventListener('pagehide', discard)
  browser.addEventListener('pageshow', shown)
  let guarded = false
  function sync() {
    const next = getController()?.getView().phase === 'interrogating'
    if (next === guarded) return
    guarded = next
    if (next) browser.addEventListener('beforeunload', beforeUnload)
    else browser.removeEventListener('beforeunload', beforeUnload)
  }
  return {
    sync,
    dispose() {
      page.removeEventListener('visibilitychange', hidden)
      browser.removeEventListener('pagehide', discard)
      browser.removeEventListener('pageshow', shown)
      browser.removeEventListener('beforeunload', beforeUnload)
    },
  }
}
