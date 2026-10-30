<script setup lang="ts">
import { UiDialog } from '@lie/ui'

import type { PageBuild } from '../build/page-version'

defineProps<{ build: PageBuild | null; open: boolean }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <UiDialog class="page-version" :open="open" title="页面版本" @close="emit('close')">
    <p>构建版本 <strong>{{ build == null ? '开发版' : build.commit == null ? '未知' : build.commit.slice(0, 7) }}</strong><span v-if="build?.dirty"> · 本地改动</span></p>
    <p v-if="build?.commit != null"><code>{{ build.commit }}</code></p>
    <p v-if="build == null">当前为开发环境。</p>
    <p v-else-if="build.commit == null">此构建未提供 Git 版本。</p>
    <p v-if="build?.dirty">构建包含未提交的本地改动。</p>
    <p>仅表示当前页面的构建版本。</p>
  </UiDialog>
</template>

<style scoped>
.page-version { width: min(560px, calc(100% - 40px)); }
p { margin: 0; }
p + p { margin-top: 12px; }
code { color: var(--lie-ink); overflow-wrap: anywhere; user-select: all; }
</style>
