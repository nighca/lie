export function pngPixels(bytes: Buffer): { width: number; height: number; alpha: Buffer } | null
export function pamAlpha(bytes: Buffer, width: number, height: number): Buffer
export function webpSize(bytes: Buffer): { width: number; height: number }
