import { fileURLToPath, URL as NodeURL } from 'node:url'

import { build } from 'vite'

export async function workerScript(): Promise<string> {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      minify: false,
      lib: { entry: fileURLToPath(new NodeURL('../src/index.ts', import.meta.url)), formats: ['es'] }
    }
  })
  const output = Array.isArray(result) ? result[0].output : 'output' in result ? result.output : []
  const script = output.find((item) => item.type === 'chunk' && item.isEntry)
  if (script?.type !== 'chunk') throw new Error('Missing bundled worker')
  return script.code
}
