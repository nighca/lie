import type { Plugin } from 'vite'
import type { ImageOptimizer, ImageStats } from './image-optimize.mjs'
export type StaticAssetOptions = { optimizeImage?: ImageOptimizer | null }
export function staticAssets(options?: StaticAssetOptions): Plugin
export function fingerprintAssets(publicDirectory: string, options?: StaticAssetOptions): Promise<{ urls: Map<string, string>; outputs: Map<string, Buffer>; manifestUrl: string; imageStats: ImageStats | null }>
