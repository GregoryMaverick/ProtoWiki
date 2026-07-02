<script setup lang="ts">
import { useRouter } from 'vue-router'

import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import SpecialPageWrapper from '@/components/SpecialPageWrapper.vue'

import { promoteFragmentCard } from '../abstract-editor-paradigms/shared-fragment-catalog'
import type { FragmentCardDefinition } from '../abstract-editor-paradigms/mock-registry'

import FragmentEditorShell from './FragmentEditorShell.vue'

definePage({
  meta: {
    title: 'Improved fragment editor',
    description:
      'Meaning-first fragment card for Abstract Wikipedia — nested Wikidata chains, dual preview, progressive disclosure, and promote-to-registry.',
  },
})

const router = useRouter()

function onPromote(card: FragmentCardDefinition) {
  promoteFragmentCard(card)
}

function goToFragmentCards() {
  router.push({ path: '/abstract-editor-paradigms', query: { variant: 'fragments' } })
}
</script>

<template>
  <ChromeWrapper>
    <SpecialPageWrapper title="Improved fragment editor" help class="improved-fragment-editor">
      <FragmentEditorShell @promote="onPromote" @navigate-fragments="goToFragmentCards" />
    </SpecialPageWrapper>
  </ChromeWrapper>
</template>

<style scoped>
.improved-fragment-editor :deep(.special-page-wrapper__content) {
  max-width: none;
}
</style>
