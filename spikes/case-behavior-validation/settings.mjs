import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
export const expectedModelId = 'f3626c105383d71654a57f2bb8a973f3'
export const limits = { answers: 16, durationMs: 45_000, handshakeMs: 10_000, closeMs: 1_000, frames: 4_000, audioBytes: 4_000_000, messageBytes: 65_536, outputBytes: 8_192 }
export const hash = text => createHash('sha256').update(text).digest('hex')
export async function approvedPrompt() {
  const source = await readFile(new URL('../../apps/gateway/scripts/linx-preview-resources.ts', import.meta.url), 'utf8')
  const match = source.match(/systemPrompt: '([^'\n]+)'/)
  if (match == null) throw new Error('approved-prompt-not-found')
  return match[1]
}
