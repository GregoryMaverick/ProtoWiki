<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  CdxButton,
  CdxCheckbox,
  CdxDialog,
  CdxField,
  CdxMessage,
  CdxSelect,
  CdxTextInput,
} from '@wikimedia/codex'

import CitationEditorPanel from '../abstract-editor-paradigms/CitationEditorPanel.vue'
import FragmentAdvancedTree from './FragmentAdvancedTree.vue'
import FragmentNestedTree from './FragmentNestedTree.vue'
import {
  birthFunctionAlternatives,
  buildFragmentSentence,
  buildFragmentTree,
  buildPromotePayload,
  setBirthFunctionVariant,
  type BirthFragmentState,
} from './lead-section-fixture'
import { citationFields } from '../abstract-editor-paradigms/mock-registry'
import { useLeadSectionContext } from './use-lead-section'

const {
  activeFragment,
  attachCitation,
  removeCitation,
  promoteFragment,
  promotedMessage,
  goToFragments,
} = useLeadSectionContext()

type EditorView = 'improved' | 'advanced'

const editorView = ref<EditorView>('improved')
const showWrappers = ref(false)
const showHelpers = ref(true)
const showRawSource = ref(false)
const promoteDialogOpen = ref(false)
const promoteLabel = ref('')
const promoteHelper = ref('')

const previewText = computed(() => {
  if (activeFragment.value.previewError) {
    return activeFragment.value.previewError
  }

  return buildFragmentSentence(activeFragment.value)
})

const treeNodes = computed(() =>
  buildFragmentTree(activeFragment.value, { showWrappers: showWrappers.value }),
)

const rawSource = computed(() => JSON.stringify(treeNodes.value, null, 2))

const functionVariantOptions = computed(() =>
  birthFunctionAlternatives.map((item) => ({
    label: item.functionName,
    value: item.id,
  })),
)

function openPromoteDialog() {
  promoteLabel.value = activeFragment.value.cardTitle
  promoteHelper.value = `Promoted from lead section: ${activeFragment.value.pattern}`
  promoteDialogOpen.value = true
}

function confirmPromote() {
  const payload = buildPromotePayload(activeFragment.value)
  payload.label = promoteLabel.value.trim() || payload.label
  payload.helper = promoteHelper.value.trim() || payload.helper
  promoteFragment(payload)
  promoteDialogOpen.value = false
}

function onFunctionVariantChange(value: string | null) {
  if (activeFragment.value.id !== 'birth' || !value) {
    return
  }

  setBirthFunctionVariant(activeFragment.value, value as 'full' | 'date-only')
}

const promotePrimaryAction = {
  label: 'Add to registry',
  actionType: 'progressive' as const,
}
</script>

<template>
  <article class="meaning-card">
    <header class="meaning-card__header">
      <p class="eyebrow">Improved fragment editor</p>
      <h2>{{ activeFragment.cardTitle }}</h2>
      <p class="meaning-card__lede">
        Edit argument slots inline in the function tree. Expand helpers to inspect or replace nested
        functions. Switch to <strong>Advanced</strong> for the production-style native tree.
      </p>
    </header>

    <div class="meaning-card__layer meaning-card__layer--placement">
      <h3>Placement</h3>
      <p class="meaning-card__meta">
        Section: <strong>Lead paragraph</strong>
        · Pattern:
        <code class="pattern-chip">{{ activeFragment.pattern }}</code>
      </p>
      <p class="meaning-card__meta">
        Citation:
        <strong v-if="activeFragment.citation">{{ activeFragment.citation.websiteName }}</strong>
        <span v-else class="meaning-card__none">None</span>
      </p>
    </div>

    <div class="meaning-card__layer">
      <div class="structure-header">
        <h3>Fragment structure</h3>
        <div class="view-toggle" role="tablist" aria-label="Editor view">
          <CdxButton
            :action="editorView === 'improved' ? 'progressive' : 'default'"
            :weight="editorView === 'improved' ? 'primary' : 'normal'"
            @click="editorView = 'improved'"
          >
            Improved
          </CdxButton>
          <CdxButton
            :action="editorView === 'advanced' ? 'progressive' : 'default'"
            :weight="editorView === 'advanced' ? 'primary' : 'normal'"
            @click="editorView = 'advanced'"
          >
            Advanced
          </CdxButton>
        </div>
      </div>

      <p class="meaning-card__function-line">
        {{ activeFragment.functionName }}
        <span class="meaning-card__zid">({{ activeFragment.functionZid }})</span>
      </p>

      <div v-if="activeFragment.id === 'birth'" class="function-variant-row">
        <CdxField>
          <template #label>Change sentence function</template>
          <CdxSelect
            :model-value="(activeFragment as BirthFragmentState).functionVariantId"
            :menu-items="functionVariantOptions"
            default-label="Choose function"
            @update:model-value="onFunctionVariantChange"
          />
        </CdxField>
      </div>

      <template v-if="editorView === 'improved'">
        <div class="nested-controls">
          <CdxCheckbox v-model="showWrappers">Show wrappers</CdxCheckbox>
          <CdxCheckbox v-model="showHelpers">Show helper functions</CdxCheckbox>
          <CdxCheckbox v-model="showRawSource">Show raw ZObject JSON</CdxCheckbox>
        </div>

        <FragmentNestedTree
          :key="activeFragment.id"
          :nodes="treeNodes"
          :show-wrappers="showWrappers"
          :show-helpers="showHelpers"
        />

        <details v-if="showRawSource" class="raw-source">
          <summary>Raw ZObject tree</summary>
          <pre>{{ rawSource }}</pre>
        </details>
      </template>

      <FragmentAdvancedTree v-else />
    </div>

    <div class="meaning-card__layer meaning-card__layer--citation">
      <div v-if="!activeFragment.citation" class="citation-actions">
        <CdxButton action="default" weight="normal" @click="attachCitation">Add citation</CdxButton>
      </div>
      <CitationEditorPanel
        v-else
        v-model:citation="activeFragment.citation"
        v-model:expanded="activeFragment.citationExpanded"
        :fields="citationFields"
        @remove="removeCitation"
      />
    </div>

    <footer class="meaning-card__footer">
      <CdxButton action="progressive" weight="primary" @click="openPromoteDialog">
        Promote to registry
      </CdxButton>
    </footer>

    <CdxMessage v-if="promotedMessage" type="success" class="meaning-card__promoted">
      {{ promotedMessage }}
      <CdxButton class="meaning-card__promoted-link" weight="quiet" @click="goToFragments">
        Open Fragment cards tab
      </CdxButton>
    </CdxMessage>

    <CdxDialog
      v-model:open="promoteDialogOpen"
      title="Promote fragment to registry"
      close-button-label="Close"
      :dismissable="true"
      :primary-action="promotePrimaryAction"
      @primary="confirmPromote"
    >
      <p>
        Add this fragment pattern to the simplified editor catalog so average contributors can reuse
        it as a fragment card.
      </p>
      <CdxField>
        <template #label>Card label</template>
        <CdxTextInput v-model="promoteLabel" />
      </CdxField>
      <CdxField>
        <template #label>Helper text</template>
        <CdxTextInput v-model="promoteHelper" />
      </CdxField>
      <p class="promote-preview">
        Preview: <strong>{{ previewText }}</strong>
      </p>
    </CdxDialog>
  </article>
</template>

<style scoped>
.eyebrow {
  margin: 0 0 var(--spacing-25);
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.meaning-card__header h2 {
  margin-top: 0;
}

.meaning-card__lede {
  margin: var(--spacing-50) 0 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.meaning-card__layer {
  margin-top: var(--spacing-150);
  padding-top: var(--spacing-100);
  border-top: 1px solid var(--border-color-subtle);
}

.meaning-card__layer h3 {
  margin-top: 0;
}

.meaning-card__layer--placement {
  margin-top: var(--spacing-100);
  padding-top: 0;
  border-top: 0;
}

.meaning-card__meta {
  margin: var(--spacing-50) 0 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.meaning-card__none {
  color: var(--color-placeholder);
}

.pattern-chip {
  padding: var(--spacing-12) var(--spacing-50);
  border-radius: var(--border-radius-base);
  background-color: var(--background-color-progressive-subtle);
  color: var(--color-progressive);
  font-family: var(--font-family-monospace, monospace);
  font-size: var(--font-size-small);
}

.structure-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-100);
  margin-bottom: var(--spacing-100);
}

.view-toggle {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-50);
}

.meaning-card__function-line {
  margin-top: 0;
}

.meaning-card__zid {
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.function-variant-row {
  max-width: 28rem;
  margin-bottom: var(--spacing-100);
}

.nested-controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-100);
  margin-bottom: var(--spacing-100);
}

.raw-source {
  margin-top: var(--spacing-100);
}

.raw-source pre {
  overflow: auto;
  max-height: 240px;
  margin: var(--spacing-50) 0 0;
  padding: var(--spacing-100);
  background-color: var(--background-color-neutral-subtle);
  font-size: var(--font-size-small);
}

.citation-actions {
  margin-top: var(--spacing-50);
}

.meaning-card__footer {
  margin-top: var(--spacing-150);
  padding-top: var(--spacing-100);
  border-top: 1px solid var(--border-color-subtle);
}

.meaning-card__promoted {
  margin-top: var(--spacing-100);
}

.meaning-card__promoted-link {
  margin-left: var(--spacing-75);
}

.promote-preview {
  margin-bottom: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}
</style>
