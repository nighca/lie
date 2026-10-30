<script setup lang="ts">
import type { PageBuild } from '../build/page-version'

defineProps<{ build: PageBuild | null }>()
</script>

<template>
  <details class="page-version">
    <summary>页面版本 {{ build == null ? '开发版' : build.commit == null ? '未知' : build.commit.slice(0, 7) }}<span v-if="build?.dirty"> · 本地改动</span></summary>
    <div class="page-version__details">
      <p v-if="build?.commit != null"><code>{{ build.commit }}</code></p>
      <p v-if="build == null">当前为开发环境。</p>
      <p v-else-if="build.commit == null">此构建未提供 Git 版本。</p>
      <p v-if="build?.dirty">构建包含未提交的本地改动。</p>
      <p>仅表示当前页面的构建版本。</p>
    </div>
  </details>
</template>

<style scoped>
.page-version { position: relative; width: fit-content; max-width: 100%; margin-left: auto; color: var(--lie-muted); font-size: 12px; line-height: 1.6; }
summary { cursor: pointer; padding: 4px 0 4px 8px; border-radius: 4px; }
summary:focus-visible { outline: 2px solid var(--lie-ink); outline-offset: 3px; }
.page-version__details { position: absolute; right: 0; bottom: calc(100% + 8px); z-index: 5; width: 300px; max-width: calc(100vw - 32px); padding: 12px 16px; border: 1px solid var(--lie-ink); border-radius: 12px; background: var(--lie-surface); box-shadow: 0 3px 0 #111b4514; }
p { margin: 0; }
p + p { margin-top: 6px; }
code { color: var(--lie-ink); overflow-wrap: anywhere; user-select: all; }
</style>
