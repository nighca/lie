import type { GameController } from './controller'

export function observePageLifecycle(controller: GameController, page: Document, window: Window) {
  function visibilityChanged() {
    if (page.hidden && controller.getView().conversationActive) controller.endConversation()
  }
  function leave() {
    page.removeEventListener('visibilitychange', visibilityChanged)
    window.removeEventListener('pagehide', leave)
    controller.dispose()
  }
  page.addEventListener('visibilitychange', visibilityChanged)
  window.addEventListener('pagehide', leave)
  return leave
}
