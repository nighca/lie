import type { GameDefinition } from '@lie/game-core'

/** Prepare a source file, not a PR; GitHub owns the author's confirmation and submission. */
export function prepareSubmission(game: GameDefinition) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(game.id)) throw new Error('案件标识不适合作为投稿文件名，请创建新草稿后再投稿')
  const filename = `content/games/${game.id}.json`
  const url = new URL('https://github.com/nighca/lie/new/main')
  url.searchParams.set('filename', filename)
  return { filename, json: `${JSON.stringify(game, null, 2)}\n`, url: url.href }
}
