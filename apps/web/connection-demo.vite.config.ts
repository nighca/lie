import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vite'

import base from './vite.config'

const local = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig((environment) => mergeConfig(base(environment), {
  cacheDir: local('../../tmp/connection-demo/vite'),
  resolve: {
    alias: [
      { find: '@lie/ui/style.css', replacement: local('../../packages/ui/style.css') },
      { find: /^@lie\/ui$/, replacement: local('../../packages/ui/src/index.ts') },
      { find: /^@lie\/game-core$/, replacement: local('../../packages/game-core/src/index.ts') },
      { find: '@lie/game-core/content', replacement: local('../../packages/game-core/src/content.ts') },
      { find: /^@lie\/voice$/, replacement: local('../../packages/voice/src/index.ts') },
      { find: /^@lie\/character-animation$/, replacement: local('../../packages/character-animation/src/index.ts') },
    ],
  },
}))
