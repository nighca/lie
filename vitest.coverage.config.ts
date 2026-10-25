import { defineConfig } from 'vitest/config'

const projects = [
  ['web', 'apps/web'],
  ['gateway', 'apps/gateway'],
  ['ui', 'packages/ui'],
  ['character-animation', 'packages/character-animation'],
] as const

export default defineConfig({
  test: {
    projects: [
      ...projects.map(([name, root]) => ({
        extends: `./${root}/vitest.config.ts`,
        root,
        test: { name },
      })),
      ...['game-core', 'voice'].map((name) => ({
        extends: false,
        root: `packages/${name}`,
        test: { name, environment: 'node' },
      })),
    ],
    reporters: ['default', 'json'],
    outputFile: { json: 'coverage/application-tests.json' },
    coverage: {
      provider: 'v8',
      include: ['apps/{web,gateway}/src/**/*.{ts,vue}', 'packages/{ui,game-core,voice,character-animation}/src/**/*.{ts,vue}'],
      exclude: ['**/*.d.ts', 'packages/ui/src/demo/**'],
      reportsDirectory: 'coverage/application',
      reporter: ['text-summary', 'json', 'json-summary', 'html', 'lcov'],
    },
  },
})
