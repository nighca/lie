export type ImageTools = { cwebp: string; dwebp: string; identity: string }
export function imageTools(cacheDirectory?: string): Promise<ImageTools>
export const imageCacheDirectory: string
export const toolReleases: Record<string, { name: string; archive: string; cwebp: string; dwebp: string }>
export function sha256(bytes: Buffer | string): string
