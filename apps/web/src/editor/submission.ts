import type { GameDefinition } from '@lie/game-core'

import { nextOfficialCaseSequence } from '../application/bundledCases'

/** Prepare a source file, not a PR; GitHub owns the author's confirmation and submission. */
export function prepareSubmission(game: GameDefinition, sequence = nextOfficialCaseSequence) {
  if (game.summary == null || game.summary.trim() === '') throw new Error('投稿前请填写案件简介')
  if (!Number.isSafeInteger(sequence) || sequence <= 0) throw new Error('无法建议投稿序号，请由维护者核对')
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(game.id)) throw new Error('案件标识不适合作为投稿文件名，请创建新草稿后再投稿')
  const filename = `content/games/${String(sequence).padStart(2, '0')}-${game.id}.json`
  const url = new URL('https://github.com/nighca/lie/new/main')
  url.searchParams.set('filename', filename)
  return { filename, json: `${JSON.stringify(game, null, 2)}\n`, url: url.href }
}
