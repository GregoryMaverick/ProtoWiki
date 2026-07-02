<script setup lang="ts">
import { computed, provide, reactive, ref } from 'vue'

import { CdxButton, CdxMessage } from '@wikimedia/codex'

import FragmentMeaningCard from './FragmentMeaningCard.vue'
import LeadSectionPreview from './LeadSectionPreview.vue'
import {
  attachCitationToFragment,
  buildFragmentSentence,
  createDefaultLeadSection,
  removeCitationFromFragment,
  type FragmentId,
} from './lead-section-fixture'
import type { FragmentCardDefinition } from '../abstract-editor-paradigms/mock-registry'
import { leadSectionContextKey } from './use-lead-section'

const props = defineProps<{
  fragmentsTabUrl?: string
}>()

const emit = defineEmits<{
  promote: [FragmentCardDefinition]
  'navigate-fragments': []
}>()

const section = reactive(createDefaultLeadSection())
const activeFragmentId = ref<FragmentId>('birth')
const highlightKey = ref<string | null>(null)
const promotedMessage = ref<string | null>(null)

const activeFragment = computed(() => {
  const fragment = section.fragments.find((item) => item.id === activeFragmentId.value)
  if (!fragment) {
    return section.fragments[0]
  }

  return fragment
})

function setHighlight(key: string | null) {
  highlightKey.value = key
}

function setActiveFragment(id: FragmentId) {
  activeFragmentId.value = id
  highlightKey.value = null
  promotedMessage.value = null
}

function attachCitation() {
  attachCitationToFragment(activeFragment.value)
}

function removeCitation() {
  removeCitationFromFragment(activeFragment.value)
}

function promoteFragment(payload: FragmentCardDefinition) {
  emit('promote', payload)
  const linkHint = props.fragmentsTabUrl
    ? ` Open the Fragments tab to add it to the lead.`
    : ' Open the Fragments tab to add it to the lead.'
  promotedMessage.value = `Added "${payload.label}" to the registry.${linkHint}`
}

function goToFragments() {
  emit('navigate-fragments')
}

provide(leadSectionContextKey, {
  section,
  activeFragmentId,
  activeFragment,
  highlightKey,
  setHighlight,
  setActiveFragment,
  attachCitation,
  removeCitation,
  promoteFragment,
  promotedMessage,
  goToFragments,
})
</script>

<template>
  <div class="fragment-editor-shell">
    <CdxMessage type="notice" class="fragment-editor-shell__brief">
      <strong>Improved fragment editor.</strong> Edit Steve Wozniak's lead fragments with inline slot
      editors in the function tree, replace nested helpers, and toggle to the Advanced
      (<code>ZObjectKeyValue</code>) view. Generated text updates on the right.
    </CdxMessage>

    <div class="fragment-editor-shell__dual">
      <section class="fragment-editor-shell__workbench" aria-label="Fragment editor workbench">
        <nav class="fragment-list" aria-label="Fragments in section">
          <h2 class="fragment-list__heading">Fragments in lead</h2>
          <CdxButton
            v-for="(fragment, index) in section.fragments"
            :key="fragment.id"
            class="fragment-list__item"
            :action="activeFragmentId === fragment.id ? 'progressive' : 'default'"
            :weight="activeFragmentId === fragment.id ? 'primary' : 'normal'"
            @click="setActiveFragment(fragment.id)"
          >
            <span class="fragment-list__index">{{ index + 1 }}</span>
            <span class="fragment-list__content">
              <strong>{{ fragment.cardTitle }}</strong>
              <small>{{ buildFragmentSentence(fragment) }}</small>
            </span>
          </CdxButton>
        </nav>

        <div class="fragment-editor-shell__card">
          <FragmentMeaningCard />
        </div>
      </section>

      <aside class="fragment-editor-shell__preview" aria-label="Generated text preview">
        <LeadSectionPreview />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.fragment-editor-shell__brief {
  margin-bottom: var(--spacing-150);
}

.fragment-editor-shell__dual {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.75fr);
  gap: var(--spacing-200);
  align-items: start;
}

.fragment-editor-shell__workbench,
.fragment-editor-shell__preview {
  min-width: 0;
}

.fragment-list {
  margin-bottom: var(--spacing-150);
}

.fragment-list__heading {
  margin: 0 0 var(--spacing-75);
  font-size: var(--font-size-medium);
}

.fragment-list__item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-75);
  width: 100%;
  margin-bottom: var(--spacing-50);
  text-align: left;
  height: auto;
  padding: var(--spacing-75) var(--spacing-100);
}

.fragment-list__index {
  flex: 0 0 auto;
  font-weight: var(--font-weight-bold);
}

.fragment-list__content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-25);
  min-width: 0;
}

.fragment-list__content small {
  color: var(--color-subtle);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fragment-editor-shell__card {
  border: 1px solid var(--border-color-subtle);
  background-color: var(--background-color-base);
  padding: var(--spacing-150);
}

.fragment-editor-shell__preview {
  border: 1px solid var(--border-color-subtle);
  background-color: var(--background-color-base);
  padding: var(--spacing-150);
  position: sticky;
  top: var(--spacing-100);
}

@media (max-width: 900px) {
  .fragment-editor-shell__dual {
    grid-template-columns: 1fr;
  }

  .fragment-editor-shell__preview {
    position: static;
  }
}
</style>
