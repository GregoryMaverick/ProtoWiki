<script setup lang="ts">
import { CdxButton, CdxField, CdxTextInput } from '@wikimedia/codex'

export interface WebCitation {
  url: string
  pageTitle: string
  websiteName: string
  accessDate: string
  displayLanguage: string
}

const citation = defineModel<WebCitation>('citation', { required: true })
const expanded = defineModel<boolean>('expanded', { default: true })

defineProps<{
  fields: {
    key: keyof WebCitation
    label: string
    inputType?: 'text' | 'url'
  }[]
}>()

const emit = defineEmits<{
  remove: []
}>()

function collapse() {
  expanded.value = false
}

function expand() {
  expanded.value = true
}

function remove() {
  emit('remove')
}
</script>

<template>
  <div class="citation-editor">
    <template v-if="expanded">
      <p class="citation-editor__heading">Where did this come from?</p>
      <div class="citation-editor__fields">
        <CdxField v-for="field in fields" :key="field.key">
          <template #label>{{ field.label }}</template>
          <CdxTextInput
            v-model="citation[field.key]"
            :input-type="field.inputType ?? 'text'"
          />
        </CdxField>
      </div>
      <div class="citation-editor__actions">
        <CdxButton weight="quiet" @click="collapse">Done</CdxButton>
        <CdxButton weight="quiet" action="destructive" @click="remove">
          Remove citation
        </CdxButton>
      </div>
    </template>

    <template v-else>
      <div class="citation-editor__collapsed">
        <p class="citation-editor__heading">Source</p>
        <p class="citation-summary">
          {{ citation.websiteName }} · {{ citation.pageTitle }}
        </p>
      </div>
      <div class="citation-editor__actions">
        <CdxButton weight="quiet" @click="expand">Edit citation</CdxButton>
        <CdxButton weight="quiet" action="destructive" @click="remove">
          Remove citation
        </CdxButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.citation-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100);
  margin-top: var(--spacing-75);
  border-top: 1px solid var(--border-color-subtle);
  padding-top: var(--spacing-100);
}

.citation-editor__heading {
  margin: 0;
  font-weight: var(--font-weight-bold);
}

.citation-editor__fields {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100);
}

.citation-editor__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-50);
}

.citation-summary {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}
</style>
