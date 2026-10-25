<script setup lang="ts">
import { computed } from 'vue'

import { splitCharacterNames, type CharacterName } from './characterNames'

const props = defineProps<{ text: string; characters: readonly CharacterName[] }>()
const segments = computed(() => splitCharacterNames(props.text, props.characters))
</script>

<template>
  <span class="character-name-text"><template v-for="(segment, index) in segments" :key="index"><mark v-if="segment.highlighted" class="character-name" :style="segment.accent == null ? null : { '--character-name-accent': segment.accent }">{{ segment.text }}</mark><template v-else>{{ segment.text }}</template></template></span>
</template>

<style scoped>
.character-name-text { white-space: pre-wrap; }
.character-name {
  margin-inline: .12em;
  color: var(--lie-ink);
  font-weight: 700;
  background: color-mix(in srgb, var(--character-name-accent, var(--lie-muted)) 18%, var(--lie-surface));
  box-shadow: inset 0 -.12em 0 color-mix(in srgb, var(--character-name-accent, var(--lie-muted)) 65%, var(--lie-surface));
  border-radius: .2em;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}
</style>
