<script setup lang="ts">
import { CdxButton, CdxField, CdxSelect, CdxTextInput } from '@wikimedia/codex'

import CitationEditorPanel from './CitationEditorPanel.vue'
import { birthFragmentMeta, birthFragmentSlots } from './fragment-fixture'
import { citationFields } from './mock-registry'
import { useFragmentEditorContext } from './use-fragment-fixture'

const { fixture, setHighlight, attachCitation, removeCitation } = useFragmentEditorContext()

const languageOptions = [
  { label: 'English (en)', value: 'en' },
  { label: 'Spanish (es)', value: 'es' },
  { label: 'German (de)', value: 'de' },
]

function slotValue(key: string): string {
  if (key === 'language') {
    return fixture.language
  }

  return fixture[key as 'person' | 'date' | 'place']
}

function updateSlot(key: string, value: string) {
  if (key === 'language') {
    fixture.language = value
    return
  }

  fixture[key as 'person' | 'date' | 'place'] = value
}

function useSuggestion(key: string, suggestion: string | undefined) {
  if (suggestion) {
    updateSlot(key, suggestion)
  }
}

function onFieldFocus(key: 'person' | 'date' | 'place') {
  setHighlight(key)
}

function onFieldBlur() {
  setHighlight(null)
}
</script>

<template>
  <div class="typed-slots">
    <header class="panel-heading">
      <p class="eyebrow">Idea 4</p>
      <h2>Typed slot builder</h2>
      <p>
        Function template with labeled typed slots — each slot shows the expected type and
        compatible input helpers.
      </p>
    </header>

    <div class="typed-slots__function">
      <p class="typed-slots__function-label">Function</p>
      <p class="typed-slots__function-name">{{ birthFragmentMeta.functionName }}</p>
      <span class="typed-slots__function-zid">{{ birthFragmentMeta.functionZid }}</span>
    </div>

    <div class="typed-slots__grid">
      <article
        v-for="slot in birthFragmentSlots"
        :key="slot.key"
        class="typed-slot"
        :class="`typed-slot--${slot.inputKind}`"
      >
        <header class="typed-slot__header">
          <span class="typed-slot__label">{{ slot.label }}</span>
          <span class="typed-slot__type">{{ slot.expectedType }}</span>
        </header>

        <p class="typed-slot__helper">{{ slot.helperLabel }}</p>

        <CdxField v-if="slot.key === 'language'">
          <template #label>Article language</template>
          <CdxSelect
            v-model:selected="fixture.language"
            :menu-items="languageOptions"
            default-label="English"
          />
        </CdxField>

        <template v-else>
          <CdxField>
            <template #label>{{ slot.label }}</template>
            <CdxTextInput
              :model-value="slotValue(slot.key)"
              @update:model-value="updateSlot(slot.key, $event)"
              @focus="onFieldFocus(slot.key as 'person' | 'date' | 'place')"
              @blur="onFieldBlur"
            />
          </CdxField>
          <p v-if="slot.wikidataSuggestion" class="wikidata-hint">
            Suggested:
            <strong>{{ slot.wikidataSuggestion }}</strong>
            <CdxButton weight="quiet" @click="useSuggestion(slot.key, slot.wikidataSuggestion)">
              Use suggestion
            </CdxButton>
          </p>
        </template>
      </article>
    </div>

    <div class="citation-row">
      <div v-if="!fixture.citation" class="citation-actions">
        <CdxButton action="default" weight="normal" @click="attachCitation">Add citation</CdxButton>
      </div>
      <CitationEditorPanel
        v-else
        v-model:citation="fixture.citation"
        v-model:expanded="fixture.citationExpanded"
        :fields="citationFields"
        @remove="removeCitation"
      />
    </div>
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
  margin-bottom: 0;
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

.typed-slots__function {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--spacing-50);
  margin-bottom: var(--spacing-150);
  padding: var(--spacing-100);
  border: 1px solid var(--border-color-subtle);
  background-color: var(--background-color-neutral-subtle);
}

.typed-slots__function-label {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  text-transform: uppercase;
  font-weight: var(--font-weight-bold);
}

.typed-slots__function-name {
  margin: 0;
  font-family: var(--font-family-monospace, monospace);
  font-weight: var(--font-weight-bold);
}

.typed-slots__function-zid {
  color: var(--color-subtle);
  font-family: var(--font-family-monospace, monospace);
  font-size: var(--font-size-small);
}

.typed-slots__grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100);
}

.typed-slot {
  border: 1px solid var(--border-color-subtle);
  padding: var(--spacing-100);
  background-color: var(--background-color-base);
}

.typed-slot--wikidata {
  border-left: 4px solid var(--border-color-progressive);
}

.typed-slot--date-builder {
  border-left: 4px solid var(--border-color-warning);
}

.typed-slot--language {
  border-left: 4px solid var(--border-color-success);
}

.typed-slot__header {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-100);
  margin-bottom: var(--spacing-50);
}

.typed-slot__label {
  font-weight: var(--font-weight-bold);
}

.typed-slot__type {
  padding: var(--spacing-12) var(--spacing-50);
  border-radius: var(--border-radius-pill);
  background-color: var(--background-color-neutral-subtle);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.typed-slot__helper {
  margin: 0 0 var(--spacing-75);
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.wikidata-hint {
  margin: var(--spacing-50) 0 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.citation-row {
  margin-top: var(--spacing-150);
}
</style>
