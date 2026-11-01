<script setup lang="ts">
import { UiButton } from '@lie/ui'

import type { EditorDraft } from './draft'

defineProps<{ status: string; message: string | null; candidate: EditorDraft | null; canAdopt: boolean; canUndo: boolean; hasPrevious: boolean }>()
defineEmits<{ adopt: []; undo: []; discard: [] }>()
</script>

<template>
  <section class="authoring-demo panel" aria-label="AI 整案创作 Demo">
    <h2>一句灵感，写成一桩谜题 <small>WebMCP Demo</small></h2>
    <p role="status">{{ status }}</p>
    <p>在 ChatGPT 中描述你想写的故事，例如：“写一桩办公室午餐被拿错的轻松谜题，三个人物，有个善意的反转。”</p>
    <p class="authoring-note">本页使用独立的 Demo 草稿，不读取或替换你原来的编辑器草稿。网页工具只提供规范和编辑版本，不返回原稿正文。ChatGPT 仍可能通过普通浏览器能力查看页面；你在聊天中提供的内容沿用 ChatGPT 的处理政策。候选只有在你采用后才写入本地 Demo 草稿。</p>
    <p v-if="message != null" role="status">{{ message }}</p>
    <article v-if="candidate != null" class="authoring-candidate">
      <h3>待审阅 · {{ candidate.title }}</h3>
      <p>{{ candidate.characters.length }} 位人物 · {{ candidate.interrogationLimitSeconds / 60 }} 分钟</p>
      <details open><summary>查看整案全文（含答案与秘密）</summary>
        <h4>案件简介</h4><p>{{ candidate.summary || '未填写' }}</p>
        <h4>公共背景</h4><p>{{ candidate.background }}</p>
        <section v-for="person in candidate.characters" :key="person.id"><h4>{{ person.name }}{{ person.id === candidate.ending.culpritId ? ' · 案件答案' : '' }}</h4><p>预设：{{ person.appearanceId }}</p><p>{{ person.profile }}</p></section>
        <h4>揭晓内容</h4><p>{{ candidate.ending.reveal }}</p>
      </details>
      <p>只检查了结构和必填内容，没有核实剧情与角色表现。采用会替换当前整份 Demo 草稿。</p>
      <p v-if="!canAdopt">原稿或编辑状态已改变，这份候选不能再采用。请让 ChatGPT 重新读取编辑版本后提交。</p>
      <div class="authoring-actions"><UiButton :disabled="!canAdopt" @click="$emit('adopt')">采用这份整案</UiButton><UiButton variant="quiet" @click="$emit('discard')">放弃候选</UiButton></div>
    </article>
    <div v-if="hasPrevious" class="authoring-actions"><UiButton variant="quiet" :disabled="!canUndo" @click="$emit('undo')">撤销此次整案替换</UiButton><span v-if="!canUndo">已有后续修改，不能直接撤销覆盖。</span></div>
  </section>
</template>

<style scoped>
.authoring-demo { margin-bottom: 24px; padding: 24px; }
.authoring-demo h2 { margin: 0 0 12px; }
.authoring-demo small { display: inline-block; font-size: 12px; font-weight: normal; }
.authoring-demo p { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.7; }
.authoring-note { font-size: 13px; opacity: .8; }
.authoring-candidate { border-top: 2px solid currentColor; margin-top: 20px; padding-top: 12px; }
.authoring-candidate details { max-height: 55vh; overflow: auto; padding: 12px; background: #fffdf5; }
.authoring-candidate summary { cursor: pointer; font-weight: bold; }
.authoring-candidate h4 { margin-bottom: 4px; }
.authoring-actions { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-top: 16px; }
</style>
