<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CdxButton,
  CdxDialog,
  CdxField,
  CdxMessage,
  CdxSelect,
  CdxTable,
  CdxTextInput,
} from '@wikimedia/codex'

import {
  articleSections,
  sectionLabel,
  type AuthoringOption,
  type PendingSuggestion,
} from '../fixtures'

const props = defineProps<{
  pending: PendingSuggestion[]
  registry: AuthoringOption[]
}>()

const emit = defineEmits<{
  approve: [PendingSuggestion, AuthoringOption]
  reject: [string]
}>()

const saveNotice = ref('')
const detailsOpen = ref(false)
const approveOpen = ref(false)
const activeSuggestion = ref<PendingSuggestion | null>(null)
const approveDraft = ref<AuthoringOption | null>(null)

const tableColumns = [
  { id: 'label', label: 'Proposed label', allowSort: true },
  { id: 'pattern', label: 'Pattern / helper', allowSort: false },
  { id: 'source', label: 'Source', allowSort: true },
  { id: 'wikidataProperty', label: 'Suggested Wikidata property', allowSort: false },
  { id: 'actions', label: '', allowSort: false, width: '12rem', textAlign: 'end' as const },
]

const tableData = computed(() =>
  props.pending.map((suggestion) => ({
    id: suggestion.id,
    label: suggestion.proposedOption.label,
    pattern: suggestion.proposedOption.pattern,
    helper: suggestion.proposedOption.helper,
    source: sourceLabel(suggestion.source),
    sourceKind: suggestion.source,
    wikidataProperty: suggestion.proposedOption.wikidataProperty || '—',
  })),
)

const sectionMenuItems = computed(() =>
  articleSections.map((section) => ({
    label: section.label,
    value: section.id,
  })),
)

const approvePrimaryAction = computed(() => ({
  label: 'Approve and add to registry',
  actionType: 'progressive' as const,
  disabled: !approveDraft.value?.label.trim(),
}))

function sourceLabel(source: PendingSuggestion['source']): string {
  return source === 'ai' ? 'AI suggestion' : 'Promoted from fragment editor'
}

function openDetails(suggestionId: string) {
  activeSuggestion.value = props.pending.find((entry) => entry.id === suggestionId) ?? null
  detailsOpen.value = true
}

function openApprove(suggestionId: string) {
  const suggestion = props.pending.find((entry) => entry.id === suggestionId)
  if (!suggestion) {
    return
  }

  activeSuggestion.value = suggestion
  approveDraft.value = {
    id: `approved-${suggestion.id}-${Date.now()}`,
    ...suggestion.proposedOption,
    fields: suggestion.proposedOption.fields.map((field) => ({ ...field })),
  }
  approveOpen.value = true
}

function confirmApprove() {
  if (!activeSuggestion.value || !approveDraft.value) {
    return
  }

  emit('approve', activeSuggestion.value, approveDraft.value)
  saveNotice.value = `"${approveDraft.value.label}" approved and added to the authoring registry (prototype).`
  approveOpen.value = false
  activeSuggestion.value = null
  approveDraft.value = null
}

function rejectSuggestion(suggestionId: string) {
  const suggestion = props.pending.find((entry) => entry.id === suggestionId)
  if (!suggestion) {
    return
  }

  emit('reject', suggestionId)
  saveNotice.value = `"${suggestion.proposedOption.label}" rejected (prototype).`
}
</script>

<template>
  <div class="pending-editor">
    <p class="pending-editor__lead">
      Registry entries do not go live without curator approval—even when a function or AI
      pipeline suggests a Wikidata property mapping.
    </p>

    <CdxMessage v-if="saveNotice" type="success" class="pending-editor__notice">
      {{ saveNotice }}
    </CdxMessage>

    <CdxTable
      caption="Pending suggestions"
      hide-caption
      class="pending-editor__table"
      :columns="tableColumns"
      :data="tableData"
      :show-vertical-borders="false"
    >
      <template #item-pattern="{ row }">
        <div class="pending-editor__pattern">
          <code>{{ row.pattern }}</code>
          <span class="pending-editor__helper">{{ row.helper }}</span>
        </div>
      </template>

      <template #item-source="{ row }">
        <span
          class="pending-editor__badge"
          :class="{
            'pending-editor__badge--ai': row.sourceKind === 'ai',
            'pending-editor__badge--promoted': row.sourceKind === 'promoted',
          }"
        >
          {{ row.source }}
        </span>
      </template>

      <template #item-actions="{ row }">
        <div class="pending-editor__row-actions">
          <CdxButton weight="quiet" @click="openDetails(row.id)">View</CdxButton>
          <CdxButton weight="primary" @click="openApprove(row.id)">Approve</CdxButton>
          <CdxButton weight="quiet" @click="rejectSuggestion(row.id)">Reject</CdxButton>
        </div>
      </template>
    </CdxTable>

    <CdxDialog
      v-model:open="detailsOpen"
      title="Suggestion details"
      :use-close-button="true"
      :primary-action="{ label: 'Close', actionType: 'default' }"
      @primary="detailsOpen = false"
    >
      <dl v-if="activeSuggestion" class="pending-editor__details">
        <dt>Label</dt>
        <dd>{{ activeSuggestion.proposedOption.label }}</dd>
        <dt>Pattern</dt>
        <dd><code>{{ activeSuggestion.proposedOption.pattern }}</code></dd>
        <dt>Helper</dt>
        <dd>{{ activeSuggestion.proposedOption.helper }}</dd>
        <dt>Wikidata property</dt>
        <dd>{{ activeSuggestion.proposedOption.wikidataProperty || 'Not suggested' }}</dd>
        <dt>Function</dt>
        <dd>
          {{ activeSuggestion.proposedOption.functionName }}
          ({{ activeSuggestion.proposedOption.functionZid }})
        </dd>
        <dt>Default section</dt>
        <dd>{{ sectionLabel(activeSuggestion.proposedOption.sectionId) }}</dd>
        <dt>Fields</dt>
        <dd>
          <ul>
            <li
              v-for="field in activeSuggestion.proposedOption.fields"
              :key="field.key"
            >
              {{ field.label }} (<code>{{ field.key }}</code>)
            </li>
          </ul>
        </dd>
      </dl>
    </CdxDialog>

    <CdxDialog
      v-model:open="approveOpen"
      title="Approve suggestion"
      :use-close-button="true"
      :primary-action="approvePrimaryAction"
      @primary="confirmApprove"
    >
      <div v-if="approveDraft" class="pending-editor__approve-form">
        <p>Confirm the registry mapping before it goes live in the simplified editor.</p>

        <CdxField>
          <template #label>Label</template>
          <CdxTextInput v-model="approveDraft.label" />
        </CdxField>

        <CdxField>
          <template #label>Pattern</template>
          <CdxTextInput v-model="approveDraft.pattern" />
        </CdxField>

        <CdxField>
          <template #label>Wikidata property</template>
          <CdxTextInput v-model="approveDraft.wikidataProperty" />
        </CdxField>

        <CdxField>
          <template #label>Section</template>
          <CdxSelect v-model:selected="approveDraft.sectionId" :menu-items="sectionMenuItems" />
        </CdxField>

        <CdxField>
          <template #label>Function</template>
          <CdxTextInput
            :model-value="`${approveDraft.functionName} (${approveDraft.functionZid})`"
            disabled
          />
        </CdxField>
      </div>
    </CdxDialog>
  </div>
</template>

<style scoped>
.pending-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100);
}

.pending-editor__lead {
  margin: 0;
  max-width: 48rem;
  color: var(--color-subtle);
}

.pending-editor__notice {
  margin: 0;
}

.pending-editor__pattern {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-25);
}

.pending-editor__helper {
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.pending-editor__badge {
  display: inline-block;
  padding: var(--spacing-25) var(--spacing-50);
  border-radius: var(--border-radius-pill);
  font-size: var(--font-size-small);
}

.pending-editor__badge--ai {
  background-color: var(--background-color-notice-subtle);
}

.pending-editor__badge--promoted {
  background-color: var(--background-color-success-subtle);
}

.pending-editor__row-actions {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--spacing-25);
}

.pending-editor__details {
  display: grid;
  grid-template-columns: 10rem 1fr;
  gap: var(--spacing-50) var(--spacing-100);
  margin: 0;
}

.pending-editor__details dt {
  margin: 0;
  font-weight: var(--font-weight-bold);
}

.pending-editor__details dd {
  margin: 0;
}

.pending-editor__details ul {
  margin: 0;
  padding-inline-start: var(--spacing-150);
}

.pending-editor__approve-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100);
}
</style>
