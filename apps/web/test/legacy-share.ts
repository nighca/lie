import { gzipSync } from 'node:zlib'

export async function legacyGameLink(game: unknown, base: string): Promise<string> {
  return `${base}/play#game=${gzipSync(JSON.stringify(game)).toString('base64url')}`
}
