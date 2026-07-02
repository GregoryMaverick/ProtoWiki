<script setup lang="ts">
import { ref } from 'vue'

import { CdxButton, CdxField, CdxTextInput } from '@wikimedia/codex'

import CitationEditorPanel from './CitationEditorPanel.vue'
import { birthFragmentMeta } from './fragment-fixture'
import { citationFields } from './mock-registry'
import { useFragmentEditorContext } from './use-fragment-fixture'

const { fixture, setHighlight, attachCitation, removeCitation } = useFragmentEditorContext()

const collapsed = ref<Record<string, boolean>>({
  wrapper: false,
  meaning: false,
  person: false,
  date: false,
  place: false,
})

function toggleCollapse(key: string) {
  collapsed.value[key] = !collapsed.value[key]
}

function onFieldFocus(key: 'person' | 'date' | 'place') {
  setHighlight(key)
}

function onFieldBlur() {
  setHighlight(null)
}
</script>

<template>
  <div class="fragment-blocks">
    <header class="panel-heading">
      <p class="eyebrow">Idea 1</p>
      <h2>Interactive Scratch-like blocks</h2>
      <p>
        Colored nested blocks with typed slots, collapse toggles, and output-type badges — inspired
        by the Tampermonkey block overlay.
      </p>
    </header>

    <div class="scratch-block scratch-block--wrapper">
      <div class="scratch-block__header">
        <button type="button" class="scratch-block__collapse" @click="toggleCollapse('wrapper')">
          {{ collapsed.wrapper ? '▸' : '▾' }}
        </button>
        <span class="scratch-block__label">string to HTML fragment</span>
        <span class="scratch-block__zid">Z813</span>
        <span class="scratch-block__type">→ HTML fragment</span>
      </div>

      <div v-if="!collapsed.wrapper" class="scratch-block__body">
        <div class="scratch-block__slot-label">string:</div>

        <div class="scratch-block scratch-block--meaning">
          <div class="scratch-block__header">
            <button type="button" class="scratch-block__collapse" @click="toggleCollapse('meaning')">
              {{ collapsed.meaning ? '▸' : '▾' }}
            </button>
            <span class="scratch-block__label">{{ birthFragmentMeta.functionName }}</span>
            <span class="scratch-block__zid">Z20420</span>
            <span class="scratch-block__type">→ String</span>
          </div>

          <div v-if="!collapsed.meaning" class="scratch-block__body">
            <div class="scratch-slot">
              <span class="scratch-slot__key">person or entity:</span>
              <div class="scratch-block scratch-block--helper">
                <div class="scratch-block__header">
                  <button
                    type="button"
                    class="scratch-block__collapse"
                    @click="toggleCollapse('person')"
                  >
                    {{ collapsed.person ? '▸' : '▾' }}
                  </button>
                  <span class="scratch-block__label">Fetch Wikidata item</span>
                  <span class="scratch-block__type">→ Entity</span>
                </div>
                <div v-if="!collapsed.person" class="scratch-block__body scratch-block__body--field">
                  <CdxField>
                    <template #label>Wikidata label</template>
                    <CdxTextInput
                      v-model="fixture.person"
                      @focus="onFieldFocus('person')"
                      @blur="onFieldBlur"
                    />
                  </CdxField>
                </div>
              </div>
            </div>

            <div class="scratch-slot">
              <span class="scratch-slot__key">date:</span>
              <div class="scratch-block scratch-block--helper">
                <div class="scratch-block__header">
                  <button type="button" class="scratch-block__collapse" @click="toggleCollapse('date')">
                    {{ collapsed.date ? '▸' : '▾' }}
                  </button>
                  <span class="scratch-block__label">Format date</span>
                  <span class="scratch-block__type">→ Date</span>
                </div>
                <div v-if="!collapsed.date" class="scratch-block__body scratch-block__body--field">
                  <CdxField>
                    <template #label>Formatted date</template>
                    <CdxTextInput
                      v-model="fixture.date"
                      @focus="onFieldFocus('date')"
                      @blur="onFieldBlur"
                    />
                  </CdxField>
                </div>
              </div>
            </div>

            <div class="scratch-slot">
              <span class="scratch-slot__key">location:</span>
              <div class="scratch-block scratch-block--helper">
                <div class="scratch-block__header">
                  <button
                    type="button"
                    class="scratch-block__collapse"
                    @click="toggleCollapse('place')"
                  >
                    {{ collapsed.place ? '▸' : '▾' }}
                  </button>
                  <span class="scratch-block__label">Fetch Wikidata item</span>
                  <span class="scratch-block__type">→ Entity</span>
                </div>
                <div v-if="!collapsed.place" class="scratch-block__body scratch-block__body--field">
                  <CdxField>
                    <template #label>Wikidata label</template>
                    <CdxTextInput
                      v-model="fixture.place"
                      @focus="onFieldFocus('place')"
                      @blur="onFieldBlur"
                    />
                  </CdxField>
                </div>
              </div>
            </div>

            <div class="scratch-slot">
              <span class="scratch-slot__key">language:</span>
              <span class="scratch-slot__literal">{{ fixture.language }}</span>
            </div>
          </div>
        </div>
      </div>
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

.scratch-block {
  border-radius: var(--border-radius-base);
  margin-bottom: var(--spacing-50);
  color: var(--color-base);
}

.scratch-block--wrapper {
  background-color: var(--background-color-neutral-subtle);
  border: 2px solid var(--border-color-base);
}

.scratch-block--meaning {
  background-color: var(--background-color-success-subtle);
  border: 2px solid var(--border-color-success);
}

.scratch-block--helper {
  background-color: var(--background-color-progressive-subtle);
  border: 2px solid var(--border-color-progressive);
}

.scratch-block__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-50);
  padding: var(--spacing-50) var(--spacing-75);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
}

.scratch-block__collapse {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  font-size: var(--font-size-small);
}

.scratch-block__zid {
  font-family: var(--font-family-monospace, monospace);
  color: var(--color-subtle);
  font-weight: var(--font-weight-normal);
}

.scratch-block__type {
  margin-left: auto;
  padding: var(--spacing-12) var(--spacing-50);
  border-radius: var(--border-radius-pill);
  background-color: var(--background-color-base);
  font-size: 0.85em;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.scratch-block__body {
  padding: 0 var(--spacing-75) var(--spacing-75);
  padding-left: var(--spacing-200);
}

.scratch-block__body--field {
  padding-left: var(--spacing-100);
}

.scratch-block__slot-label {
  margin-bottom: var(--spacing-50);
  font-size: var(--font-size-small);
  color: var(--color-subtle);
}

.scratch-slot {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
  margin-bottom: var(--spacing-75);
}

.scratch-slot__key {
  font-size: var(--font-size-small);
  color: var(--color-subtle);
}

.scratch-slot__literal {
  display: inline-block;
  padding: var(--spacing-25) var(--spacing-50);
  border-radius: var(--border-radius-base);
  background-color: var(--background-color-interactive-subtle);
  font-family: var(--font-family-monospace, monospace);
  font-size: var(--font-size-small);
}

.citation-row {
  margin-top: var(--spacing-150);
}

.citation-actions {
  margin-top: var(--spacing-75);
}
</style>
