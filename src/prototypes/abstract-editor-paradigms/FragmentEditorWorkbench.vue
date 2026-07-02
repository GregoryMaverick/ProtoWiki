<script setup lang="ts">
import { computed, provide, reactive, ref } from 'vue'

import { CdxButton, CdxMessage } from '@wikimedia/codex'

import FragmentEditorBlocks from './FragmentEditorBlocks.vue'
import FragmentEditorEvaluation from './FragmentEditorEvaluation.vue'
import FragmentEditorFilteredTree from './FragmentEditorFilteredTree.vue'
import FragmentEditorMeaningCard from './FragmentEditorMeaningCard.vue'
import FragmentEditorNativeTree from './FragmentEditorNativeTree.vue'
import FragmentEditorPipeline from './FragmentEditorPipeline.vue'
import FragmentEditorPreview from './FragmentEditorPreview.vue'
import FragmentEditorTypedSlots from './FragmentEditorTypedSlots.vue'
import {
  attachCitationToFixture,
  createDefaultBirthFixture,
  removeCitationFromFixture,
  type FragmentFieldKey,
} from './fragment-fixture'
import { fragmentEditorContextKey } from './use-fragment-fixture'

export type FragmentEditorVariantId =
  | 'blocks'
  | 'meaning-card'
  | 'typed-slots'
  | 'pipeline'
  | 'filtered-tree'
  | 'native-tree'

const variants: {
  id: FragmentEditorVariantId
  label: string
  shortLabel: string
  ideaNumber: string
}[] = [
  { id: 'blocks', label: 'Scratch-like blocks', shortLabel: 'I1 · Blocks', ideaNumber: '1' },
  { id: 'meaning-card', label: 'Meaning-first card', shortLabel: 'I2 · Meaning', ideaNumber: '2' },
  { id: 'typed-slots', label: 'Typed slot builder', shortLabel: 'I4 · Slots', ideaNumber: '4' },
  { id: 'pipeline', label: 'Function pipeline', shortLabel: 'I5 · Pipeline', ideaNumber: '5' },
  { id: 'filtered-tree', label: 'Layered tree + filters', shortLabel: 'I6 · Tree', ideaNumber: '6' },
  { id: 'native-tree', label: 'Native-style tree (baseline)', shortLabel: 'Baseline · Native', ideaNumber: '—' },
]

const selectedVariant = ref<FragmentEditorVariantId>('meaning-card')
const fixture = reactive(createDefaultBirthFixture())
const highlightKey = ref<FragmentFieldKey | null>(null)

function setHighlight(key: FragmentFieldKey | null) {
  highlightKey.value = key
}

function attachCitation() {
  attachCitationToFixture(fixture)
}

function removeCitation() {
  removeCitationFromFixture(fixture)
}

provide(fragmentEditorContextKey, {
  fixture,
  highlightKey,
  setHighlight,
  attachCitation,
  removeCitation,
})

const activeVariant = computed(
  () => variants.find((variant) => variant.id === selectedVariant.value) ?? variants[0],
)

const variantComponent = computed(() => {
  switch (selectedVariant.value) {
    case 'blocks':
      return FragmentEditorBlocks
    case 'meaning-card':
      return FragmentEditorMeaningCard
    case 'typed-slots':
      return FragmentEditorTypedSlots
    case 'pipeline':
      return FragmentEditorPipeline
    case 'filtered-tree':
      return FragmentEditorFilteredTree
    case 'native-tree':
      return FragmentEditorNativeTree
    default:
      return FragmentEditorMeaningCard
  }
})
</script>

<template>
  <div class="fragment-workbench">
    <CdxMessage type="notice" class="fragment-workbench__brief">
      Compare six improved fragment editor ideas on the <strong>same birth sentence fixture</strong>:
      Steve Wozniak · August 11, 1950 · San Jose, California. Shared state carries across variants;
      the right pane is the dual-view preview (Idea 3) for all variants.
    </CdxMessage>

    <section class="fragment-workbench__switcher" aria-label="Fragment editor variants">
      <CdxButton
        v-for="variant in variants"
        :key="variant.id"
        :action="selectedVariant === variant.id ? 'progressive' : 'default'"
        :weight="selectedVariant === variant.id ? 'primary' : 'normal'"
        @click="selectedVariant = variant.id"
      >
        {{ variant.shortLabel }}
      </CdxButton>
    </section>

    <div class="fragment-workbench__dual">
      <section class="fragment-workbench__editor" aria-label="Fragment editor variant">
        <div class="prototype-panel">
          <component :is="variantComponent" />
        </div>
      </section>

      <aside class="fragment-workbench__preview" aria-label="Generated text preview">
        <FragmentEditorPreview />
      </aside>
    </div>

    <FragmentEditorEvaluation :variant-label="activeVariant.label" />
  </div>
</template>

<style scoped>
.fragment-workbench__brief {
  margin-bottom: var(--spacing-150);
}

.fragment-workbench__switcher {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-50);
  margin-bottom: var(--spacing-150);
}

.fragment-workbench__dual {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.75fr);
  gap: var(--spacing-200);
  align-items: start;
  margin-bottom: var(--spacing-200);
}

.fragment-workbench__editor,
.fragment-workbench__preview {
  min-width: 0;
}

.prototype-panel {
  border: 1px solid var(--border-color-subtle);
  background-color: var(--background-color-base);
  padding: var(--spacing-150);
}

@media (max-width: 900px) {
  .fragment-workbench__dual {
    grid-template-columns: 1fr;
  }
}
</style>
