<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  CdxButton,
  CdxField,
  CdxMessage,
  CdxTab,
  CdxTabs,
  CdxTextInput,
} from '@wikimedia/codex'

import CitationEditorPanel from './CitationEditorPanel.vue'
import {
  articleSections,
  articleSubject,
  citationFields,
  createDefaultWebCitation,
  defaultValuesFromWikidata,
  getHybridCard,
  hybridCardCatalog,
  hybridFragmentSentence,
  type HybridCardDefinition,
  type HybridFragment,
  type TemplateFieldDefinition,
} from './mock-registry'

const fragments = defineModel<HybridFragment[]>('fragments', { required: true })

const activeSection = ref('lead')
const informationPickerOpen = ref(false)
const composingCard = ref<HybridCardDefinition | null>(null)
const composingValues = ref<Record<string, string>>({})

const addedCardIds = computed(() => new Set(fragments.value.map((f) => f.cardId)))

const pendingSuggestions = computed(() =>
  hybridCardCatalog.filter((card) => !addedCardIds.value.has(card.id)),
)

const fragmentsForActiveSection = computed(() =>
  fragments.value.filter((fragment) => fragment.sectionId === activeSection.value),
)

const sectionLabel = (sectionId: string) =>
  articleSections.find((section) => section.id === sectionId)?.label ?? sectionId

const cardsBySection = computed(() => {
  const grouped = new Map<string, HybridCardDefinition[]>()

  for (const card of hybridCardCatalog) {
    const list = grouped.get(card.sectionId) ?? []
    list.push(card)
    grouped.set(card.sectionId, list)
  }

  return grouped
})

const composingPreview = computed(() => {
  if (!composingCard.value) {
    return ''
  }

  const values = Object.fromEntries(
    composingCard.value.fields.map((field) => [
      field.key,
      composingValues.value[field.key]?.trim() || field.placeholder,
    ]),
  )

  return composingCard.value.sentence(values)
})

const canSaveComposing = computed(() => {
  if (!composingCard.value) {
    return false
  }

  return composingCard.value.fields.every((field) => composingValues.value[field.key]?.trim())
})

function insertFromWikidata(card: HybridCardDefinition) {
  if (addedCardIds.value.has(card.id)) {
    return
  }

  fragments.value.push({
    id: `hybrid-${Date.now()}`,
    cardId: card.id,
    sectionId: card.sectionId,
    values: defaultValuesFromWikidata(card),
    source: 'wikidata',
    citation: null,
    citationPromptDismissed: false,
  })

  activeSection.value = card.sectionId
}

function openInformationPicker() {
  informationPickerOpen.value = true
  composingCard.value = null
  composingValues.value = {}
}

function cancelInformationFlow() {
  informationPickerOpen.value = false
  composingCard.value = null
  composingValues.value = {}
}

function selectInformationType(card: HybridCardDefinition) {
  composingCard.value = card
  composingValues.value = Object.fromEntries(
    card.fields.map((field) => [field.key, field.key === 'entity' ? articleSubject : '']),
  )
  informationPickerOpen.value = false
}

function useFieldWikidataSuggestion(field: TemplateFieldDefinition) {
  if (field.wikidataSuggestion) {
    composingValues.value[field.key] = field.wikidataSuggestion
  }
}

function saveComposedFragment() {
  if (!composingCard.value || !canSaveComposing.value) {
    return
  }

  const card = composingCard.value
  const trimmedValues = Object.fromEntries(
    card.fields.map((field) => [field.key, composingValues.value[field.key].trim()]),
  )

  const existingIndex = fragments.value.findIndex((f) => f.cardId === card.id)
  if (existingIndex !== -1) {
    fragments.value[existingIndex] = {
      ...fragments.value[existingIndex],
      values: trimmedValues,
      source: 'manual',
    }
  } else {
    fragments.value.push({
      id: `hybrid-${Date.now()}`,
      cardId: card.id,
      sectionId: card.sectionId,
      values: trimmedValues,
      source: 'manual',
      citation: null,
      citationPromptDismissed: false,
    })
  }

  activeSection.value = card.sectionId
  composingCard.value = null
  composingValues.value = {}
}

function removeFragment(fragmentId: string) {
  const index = fragments.value.findIndex((f) => f.id === fragmentId)
  if (index !== -1) {
    fragments.value.splice(index, 1)
  }
}

function attachCitation(fragment: HybridFragment) {
  fragment.citation = createDefaultWebCitation()
  fragment.citationExpanded = true
  fragment.citationPromptDismissed = true
}

function dismissCitationPrompt(fragment: HybridFragment) {
  fragment.citationPromptDismissed = true
}

function removeCitation(fragment: HybridFragment) {
  fragment.citation = null
  fragment.citationExpanded = undefined
}

function showCitationPrompt(fragment: HybridFragment) {
  return !fragment.citation && !fragment.citationPromptDismissed
}

function suggestionPreview(card: HybridCardDefinition) {
  return hybridFragmentSentence({
    id: '',
    cardId: card.id,
    sectionId: card.sectionId,
    values: defaultValuesFromWikidata(card),
    source: 'wikidata',
    citation: null,
  })
}
</script>

<template>
  <div class="hybrid-panel">
    <header class="panel-heading">
      <p class="eyebrow">Recommended hybrid</p>
      <h2>Fragment card composer with Wikidata assist</h2>
      <p>
        Start from <strong>Wikidata suggestions</strong> or click <strong>+ Add information</strong>.
        Each fragment lands in a section with sentence-pattern fields. Citations and structure
        reveal are optional.
      </p>
    </header>

    <section
      v-if="pendingSuggestions.length"
      class="wikidata-suggestions"
      aria-label="Wikidata suggestions"
    >
      <h3 class="wikidata-suggestions__heading">
        Suggested from Wikidata for {{ articleSubject }}
      </h3>
      <div class="wikidata-suggestions__list">
        <button
          v-for="card in pendingSuggestions"
          :key="card.id"
          type="button"
          class="wikidata-suggestion"
          @click="insertFromWikidata(card)"
        >
          <span class="wikidata-suggestion__label">{{ card.informationLabel }}</span>
          <span class="wikidata-suggestion__reason">
            {{ card.wikidataProperty }} · {{ card.wikidataSuggestion }}
          </span>
          <span class="wikidata-suggestion__preview">{{ suggestionPreview(card) }}</span>
          <span class="wikidata-suggestion__action">Insert fragment</span>
        </button>
      </div>
    </section>

    <div
      v-if="!informationPickerOpen && !composingCard"
      class="information-start"
      :class="{ 'information-start--secondary': fragments.length > 0 }"
    >
      <CdxButton action="progressive" weight="primary" @click="openInformationPicker">
        + Add information
      </CdxButton>
    </div>

    <section
      v-if="informationPickerOpen"
      class="information-picker"
      aria-label="Choose information type"
    >
      <h3>What information do you want to add?</h3>
      <div
        v-for="section in articleSections"
        :key="section.id"
        class="information-picker__group"
      >
        <h4 class="information-picker__section">{{ section.label }}</h4>
        <div class="information-picker__list">
          <button
            v-for="card in cardsBySection.get(section.id) ?? []"
            :key="card.id"
            type="button"
            class="information-picker__option"
            :disabled="addedCardIds.has(card.id)"
            @click="selectInformationType(card)"
          >
            <span class="information-picker__label">{{ card.informationLabel }}</span>
            <span class="pattern-chip">{{ card.pattern }}</span>
          </button>
        </div>
      </div>
      <CdxButton weight="quiet" @click="cancelInformationFlow">Cancel</CdxButton>
    </section>

    <section v-if="composingCard" class="compose-form" aria-label="Add information form">
      <h3>{{ composingCard.informationLabel }}</h3>
      <p class="pattern-chip pattern-chip--large">{{ composingCard.pattern }}</p>
      <p>{{ composingCard.helper }}</p>

      <div class="field-grid">
        <div
          v-for="field in composingCard.fields"
          :key="field.key"
          class="field-grid__cell"
        >
          <CdxField>
            <template #label>{{ field.label }}</template>
            <CdxTextInput
              v-model="composingValues[field.key]"
              :placeholder="field.placeholder"
            />
          </CdxField>
          <p v-if="field.wikidataSuggestion" class="wikidata-hint">
            Suggested from Wikidata:
            <strong>{{ field.wikidataSuggestion }}</strong>
            <CdxButton weight="quiet" @click="useFieldWikidataSuggestion(field)">
              Use suggestion
            </CdxButton>
          </p>
        </div>
      </div>

      <p v-if="composingPreview" class="card-output">Preview: {{ composingPreview }}</p>

      <div class="compose-form__actions">
        <CdxButton
          action="progressive"
          weight="primary"
          :disabled="!canSaveComposing"
          @click="saveComposedFragment"
        >
          Add to {{ sectionLabel(composingCard.sectionId) }}
        </CdxButton>
        <CdxButton weight="quiet" @click="composingCard = null">Back to picker</CdxButton>
        <CdxButton weight="quiet" @click="cancelInformationFlow">Cancel</CdxButton>
      </div>
    </section>

    <CdxTabs v-model:active="activeSection" class="section-tabs">
      <CdxTab
        v-for="section in articleSections"
        :key="section.id"
        :name="section.id"
        :label="section.label"
      >
        <p class="section-intro">{{ section.description }}</p>

        <p v-if="!fragmentsForActiveSection.length" class="empty-section">
          No fragments in this section yet. Add information or insert a Wikidata suggestion.
        </p>

        <div v-if="fragmentsForActiveSection.length" class="editor-stack">
          <article
            v-for="fragment in fragmentsForActiveSection"
            :key="fragment.id"
            class="edit-card"
          >
            <div class="edit-card__header">
              <div>
                <h3>{{ getHybridCard(fragment.cardId)?.informationLabel }}</h3>
                <p class="pattern-chip">{{ getHybridCard(fragment.cardId)?.pattern }}</p>
                <p>
                  {{ fragment.source === 'wikidata' ? 'From Wikidata' : 'Added manually' }}
                </p>
              </div>
              <CdxButton
                weight="quiet"
                action="destructive"
                @click="removeFragment(fragment.id)"
              >
                Remove
              </CdxButton>
            </div>

            <div class="field-grid">
              <div
                v-for="field in getHybridCard(fragment.cardId)?.fields ?? []"
                :key="field.key"
                class="field-grid__cell"
              >
                <CdxField>
                  <template #label>{{ field.label }}</template>
                  <CdxTextInput v-model="fragment.values[field.key]" />
                </CdxField>
              </div>
            </div>

            <p class="card-output">{{ hybridFragmentSentence(fragment) }}</p>

            <CdxMessage
              v-if="showCitationPrompt(fragment)"
              type="notice"
              class="citation-prompt"
            >
              Add a source for this statement?
              <div class="citation-prompt__actions">
                <CdxButton action="default" weight="normal" @click="attachCitation(fragment)">
                  Add citation
                </CdxButton>
                <CdxButton weight="quiet" @click="dismissCitationPrompt(fragment)">
                  Not now
                </CdxButton>
              </div>
            </CdxMessage>

            <div v-else-if="!fragment.citation" class="citation-actions">
              <CdxButton action="default" weight="normal" @click="attachCitation(fragment)">
                Add citation
              </CdxButton>
            </div>
            <CitationEditorPanel
              v-else
              v-model:citation="fragment.citation"
              v-model:expanded="fragment.citationExpanded"
              :fields="citationFields"
              @remove="removeCitation(fragment)"
            />
          </article>
        </div>
      </CdxTab>
    </CdxTabs>
  </div>
</template>

<style scoped>
.panel-heading {
  margin-bottom: var(--spacing-150);
}

.panel-heading h2 {
  margin-top: 0;
}

.panel-heading p {
  margin-bottom: var(--spacing-75);
  color: var(--color-subtle);
}

.eyebrow {
  margin: 0 0 var(--spacing-25);
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.information-start {
  margin-bottom: var(--spacing-150);
}

.information-start--secondary {
  margin-top: var(--spacing-100);
}

.information-picker,
.compose-form {
  margin-bottom: var(--spacing-150);
  border: 1px solid var(--border-color-subtle);
  padding: var(--spacing-100);
  background-color: var(--background-color-neutral-subtle);
}

.information-picker h3,
.compose-form h3 {
  margin-top: 0;
}

.information-picker__group {
  margin-bottom: var(--spacing-100);
}

.information-picker__section {
  margin: 0 0 var(--spacing-50);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-subtle);
}

.information-picker__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
}

.information-picker__option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-25);
  width: 100%;
  border: 1px solid var(--border-color-subtle);
  padding: var(--spacing-75) var(--spacing-100);
  background-color: var(--background-color-base);
  text-align: left;
  cursor: pointer;
}

.information-picker__option:hover:not(:disabled) {
  background-color: var(--background-color-interactive);
}

.information-picker__option:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.information-picker__label {
  font-weight: var(--font-weight-bold);
}

.wikidata-suggestions {
  margin-bottom: var(--spacing-150);
  border: 1px solid var(--border-color-subtle);
  padding: var(--spacing-100);
  background-color: var(--background-color-neutral-subtle);
}

.wikidata-suggestions__heading {
  margin: 0 0 var(--spacing-50);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-subtle);
}

.wikidata-suggestions__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
}

.wikidata-suggestion {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-25);
  width: 100%;
  border: 1px solid var(--border-color-subtle);
  padding: var(--spacing-75) var(--spacing-100);
  background-color: var(--background-color-base);
  text-align: left;
  cursor: pointer;
}

.wikidata-suggestion:hover {
  background-color: var(--background-color-interactive);
}

.wikidata-suggestion__label {
  font-weight: var(--font-weight-bold);
}

.wikidata-suggestion__reason {
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.wikidata-suggestion__preview {
  font-size: var(--font-size-small);
}

.wikidata-suggestion__action {
  color: var(--color-progressive);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
}

.wikidata-hint {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.compose-form__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-50);
}

.section-tabs {
  margin-top: var(--spacing-150);
}

.section-intro {
  margin: var(--spacing-100) 0;
  color: var(--color-subtle);
}

.empty-section {
  margin: 0;
  color: var(--color-placeholder);
  font-size: var(--font-size-small);
}

.editor-stack {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100);
}

.edit-card {
  border: 1px solid var(--border-color-subtle);
  padding: var(--spacing-100);
  background-color: var(--background-color-neutral-subtle);
}

.edit-card__header {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-100);
  align-items: flex-start;
}

.edit-card__header h3 {
  margin-top: 0;
}

.edit-card__header p {
  margin-bottom: var(--spacing-50);
  color: var(--color-subtle);
}

.pattern-chip {
  display: inline-block;
  margin: 0 0 var(--spacing-25);
  padding: var(--spacing-25) var(--spacing-50);
  border-radius: var(--border-radius-base);
  background-color: var(--background-color-progressive-subtle);
  color: var(--color-progressive);
  font-family: var(--font-family-monospace, monospace);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
}

.pattern-chip--large {
  font-size: var(--font-size-medium);
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--spacing-100);
  align-items: start;
}

.field-grid__cell {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
  min-width: 0;
}

.field-grid__cell :deep(.cdx-field) {
  margin: 0;
  width: 100%;
}

.card-output {
  border-left: 4px solid var(--border-color-progressive);
  margin: var(--spacing-100) 0;
  padding: var(--spacing-75) var(--spacing-100);
  background-color: var(--background-color-progressive-subtle);
}

.citation-actions {
  margin-top: var(--spacing-75);
}

.citation-prompt {
  margin-top: var(--spacing-75);
}

.citation-prompt__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-50);
  margin-top: var(--spacing-50);
}
</style>
