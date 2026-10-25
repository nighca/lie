import type { ImageTools } from './image-tools.mjs'
export type ImageResult = { bytes: Buffer; extension: '.png' | '.webp' }
export type ImageOptimizer = (bytes: Buffer) => Promise<ImageResult>
export type ImageStats = { encoded: number; cached: number; preserved: number }
export const imagePolicy: string
export function createImageOptimizer(options?: { cacheDirectory?: string; tools?: ImageTools | null; command?: (file: string, args: string[], options: object) => Promise<{ stdout: Buffer }>; warn?: (message: string) => void }): Promise<{ optimize: ImageOptimizer; stats: ImageStats }>
