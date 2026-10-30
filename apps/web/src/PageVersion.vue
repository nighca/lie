<script setup lang="ts">
import { ref, watch } from 'vue'
import { UiButton, UiDialog } from '@lie/ui'

import type { PageBuild } from '../build/page-version'

const props = defineProps<{ build: PageBuild | null; open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const copyMessage = ref('')

watch(() => props.open, () => { copyMessage.value = '' })

async function copyVersion() {
  if (props.build?.commit == null) return
  try {
    await navigator.clipboard.writeText(props.build.commit)
    copyMessage.value = '已复制，口供带走。'
  } catch {
    copyMessage.value = '复制未成功，可以选中上方编号手动复制。'
  }
}
</script>

<template>
  <UiDialog class="page-version" :open="open" title="报上版本。" @close="emit('close')">
    <p class="version-intro">小红点被你发现了。现在，核对一下身份。</p>
    <div class="version-record">
      <div class="version-identity">
        <div>
          <p class="version-label">页面版本 / 构建编号</p>
          <strong>{{ build == null ? '开发版' : build.commit == null ? '未知' : build.commit.slice(0, 7) }}</strong>
        </div>
        <span class="version-stamp" aria-hidden="true">只认<br>本页</span>
      </div>
      <p v-if="build?.dirty" class="version-dirty">＋ 本地改动</p>
      <div class="version-details">
        <template v-if="build?.commit != null">
          <p class="version-label">完整 Git SHA</p>
          <code tabindex="0" aria-label="完整构建版本，可选择复制">{{ build.commit }}</code>
        </template>
        <p v-if="build == null">当前为开发环境，还没有正式构建编号。</p>
        <p v-else-if="build.commit == null">此构建未提供 Git 版本，身份暂时成谜。</p>
        <p v-if="build?.dirty" class="version-local-note">构建包含未提交的本地改动。</p>
      </div>
    </div>
    <p class="version-scope">仅表示当前页面的构建版本。排查缓存或部署问题时，可以用它核对。</p>
    <div v-if="build?.commit != null" class="version-copy">
      <UiButton variant="secondary" @click="copyVersion">复制完整版本号</UiButton>
      <p role="status">{{ copyMessage }}</p>
    </div>
  </UiDialog>
</template>

<style scoped>
.page-version { width: min(500px, calc(100% - 32px)); padding: 28px; }
.page-version :deep(.lie-dialog__header) { padding-inline: 40px; text-align: left; justify-content: flex-start; padding-left: 0; }
.page-version :deep(.lie-dialog__header h2) { margin: 0; font-size: 32px; }
p { margin: 0; }
.version-intro { color: var(--lie-muted); font-size: 14px; }
.version-record { margin-top: 24px; padding: 22px; border: 2px solid var(--lie-ink); border-radius: 8px 8px 22px 8px; background: #fff8d6; box-shadow: 4px 4px 0 #111b4514; }
.version-identity { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.version-label { color: var(--lie-muted); font-size: 12px; }
strong { display: block; margin-top: 4px; font-size: clamp(28px, 7vw, 40px); font-weight: 850; line-height: 1.25; letter-spacing: -1px; }
.version-stamp { flex-shrink: 0; display: grid; place-content: center; width: 62px; height: 62px; border: 2px solid #b53732; border-radius: 50%; color: #b53732; font-size: 14px; font-weight: 800; line-height: 1.2; text-align: center; transform: rotate(12deg); }
.version-dirty { width: fit-content; margin-top: 12px; padding: 2px 8px; border-radius: 6px; background: #ffe0d6; font-size: 12px; font-weight: 700; }
.version-details { margin-top: 20px; padding-top: 16px; border-top: 1px dashed #111b454d; font-size: 14px; }
code { display: block; margin-top: 6px; color: var(--lie-ink); font-size: 13px; line-height: 1.8; overflow-wrap: anywhere; user-select: all; }
code:focus-visible { outline: 3px solid var(--lie-primary); outline-offset: 4px; }
.version-local-note { margin-top: 8px; }
.version-scope { margin-top: 20px; color: var(--lie-muted); font-size: 12px; }
.version-copy { margin-top: 20px; }
.version-copy .lie-button { width: 100%; min-height: 46px; border-width: 2px; border-radius: 14px; font-size: 14px; }
.version-copy p { min-height: 20px; margin-top: 10px; color: var(--lie-muted); font-size: 12px; text-align: center; }
@media (max-width: 400px) {
  .page-version { padding: 24px 20px; }
  .version-record { padding: 18px; }
}
</style>
