import type { Plugin } from 'vite'

export function staticAssets(): Plugin
export function fingerprintAssets(publicDirectory: string): Promise<{ urls: Map<string, string>; outputs: Map<string, Buffer>; manifestUrl: string }>
