<script setup lang="ts">
import { computed } from 'vue'

import CharacterNameText from './CharacterNameText.vue'
import type { CharacterName } from './characterNames'

const props = defineProps<{ text: string; characters: readonly CharacterName[] }>()
const parts = computed(() => props.text.split(/(\r\n|\r|\n)/))
</script>

<template>
  <div class="public-background-text"><template v-for="(part, index) in parts" :key="index"><p v-if="index % 2 === 0"><CharacterNameText :text="part" :characters="characters" /></p><template v-else>{{ part }}</template></template></div>
</template>

<style scoped>
.public-background-text { white-space: normal; }
.public-background-text > p { min-height: 1lh; margin: 0; white-space: pre-wrap; }
.public-background-text > p + p { margin-top: .75em; }
</style>
