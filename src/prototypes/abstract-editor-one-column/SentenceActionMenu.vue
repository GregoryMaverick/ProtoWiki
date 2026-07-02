<script setup lang="ts">
import { ref } from 'vue'
import { CdxIcon, CdxMenuButton } from '@wikimedia/codex'
import { cdxIconEllipsis } from '@wikimedia/codex-icons'

interface SentenceMenuItem {
  value: string
  label: string
  icon?: object
  disabled?: boolean
}

defineProps<{
  menuItems: SentenceMenuItem[]
  ariaLabel?: string
}>()

const emit = defineEmits<{
  select: [value: string]
}>()

const selected = ref<string | null>(null)

function onSelected(value: string | null) {
  if (!value) {
    return
  }

  emit('select', value)
  selected.value = null
}
</script>

<template>
  <CdxMenuButton
    v-model:selected="selected"
    class="sentence-action-menu"
    weight="quiet"
    :menu-items="menuItems"
    :aria-label="ariaLabel ?? 'Sentence actions'"
    @update:selected="onSelected"
  >
    <CdxIcon :icon="cdxIconEllipsis" class="sentence-action-menu__icon" />
  </CdxMenuButton>
</template>

<style scoped>
.sentence-action-menu :deep(.cdx-button) {
  min-height: 1.75rem;
  min-width: 1.75rem;
  padding: 0;
}

.sentence-action-menu__icon {
  transform: rotate(90deg);
}
</style>
