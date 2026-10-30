
import { createApp, ref } from 'vue/dist/vue.esm-bundler.js'
import PageVersion from '/src/PageVersion.vue'
import '@lie/ui/style.css'
import '/src/style.css'
const commit = 'fd0493773e3b47ee934b2a391e8f69b49f632c58'
createApp({
  components: { PageVersion },
  setup() {
    const open = ref(false)
    const build = ref({ commit, dirty: false })
    function show(mode) {
      build.value = mode === 'dev' ? null : { commit: mode === 'unknown' ? null : commit, dirty: mode === 'dirty' }
      open.value = true
    }
    return { open, build, show }
  },
  template: `<main style="padding:24px;max-width:800px;margin:auto">
    <p>设计审看 · 页面口供</p><h1>报上版本。</h1>
    <p>直接渲染正式弹窗组件。正式构建示例采用本任务真实基线 SHA，非当前预览服务的构建编号。</p>
    <nav style="display:flex;flex-wrap:wrap;gap:12px;margin-top:24px">
      <button class="lie-button" @click="show('clean')">正式构建示例</button>
      <button class="lie-button" @click="show('dirty')">本地改动</button>
      <button class="lie-button" @click="show('dev')">开发版</button>
      <button class="lie-button" @click="show('unknown')">未知版本</button>
    </nav>
    <PageVersion :open="open" :build="build" @close="open = false" />
  </main>`
}).mount('#preview')
