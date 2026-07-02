<script setup lang="ts">
import { ref } from 'vue'

import { CdxButton, CdxField, CdxTextInput } from '@wikimedia/codex'

import CitationEditorPanel from './CitationEditorPanel.vue'
import { buildBirthSentence, birthFragmentMeta } from './fragment-fixture'
import { citationFields } from './mock-registry'
import { useFragmentEditorContext } from './use-fragment-fixture'

const { fixture, setHighlight, attachCitation, removeCitation } = useFragmentEditorContext()

const showNested = ref(false)

function onFieldFocus(key: 'person' | 'date' | 'place') {
  setHighlight(key)
}

function onFieldBlur() {
  setHighlight(null)
}
</script>

<template>
  <div class="meaning-card">
    <header class="panel-heading">
      <p class="eyebrow">Idea 2</p>
      <h2>Meaning-first fragment card</h2>
      <p>Preview, section, and citation at the top; editable fields; expandable nested implementation.</p>
    </header>

    <article class="meaning-card__surface">
      <div class="meaning-card__top">
        <h3>{{ birthFragmentMeta.cardTitle }}</h3>
        <p class="meaning-card__preview">
          Preview: <strong>{{ buildBirthSentence(fixture) }}</strong>
        </p>
        <p class="meaning-card__meta">
          Section: <strong>{{ birthFragmentMeta.sectionLabel }}</strong>
          · Pattern:
          <code class="pattern-chip">{{ birthFragmentMeta.pattern }}</code>
        </p>
        <p class="meaning-card__meta">
          Citation:
          <strong v-if="fixture.citation">{{ fixture.citation.websiteName }}</strong>
          <span v-else class="meaning-card__none">None</span>
        </p>
      </div>

      <div class="meaning-card__fields">
        <h4>Fields</h4>
        <div class="field-grid">
          <CdxField>
            <template #label>Person</template>
            <CdxTextInput
              v-model="fixture.person"
              @focus="onFieldFocus('person')"
              @blur="onFieldBlur"
            />
          </CdxField>
          <CdxField>
            <template #label>Date</template>
            <CdxTextInput
              v-model="fixture.date"
              @focus="onFieldFocus('date')"
              @blur="onFieldBlur"
            />
          </CdxField>
          <CdxField>
            <template #label>Place</template>
            <CdxTextInput
              v-model="fixture.place"
              @focus="onFieldFocus('place')"
              @blur="onFieldBlur"
            />
          </CdxField>
        </div>
      </div>

      <div class="meaning-card__function">
        <h4>Function</h4>
        <p>{{ birthFragmentMeta.functionName }} ({{ birthFragmentMeta.functionZid }})</p>
        <CdxButton weight="quiet" @click="showNested = !showNested">
          {{ showNested ? 'Hide nested implementation' : 'Show nested implementation' }}
        </CdxButton>
      </div>

      <div v-if="showNested" class="meaning-card__nested">
        <pre class="meaning-card__tree">{{ JSON.stringify({
          type: 'Function call',
          function: `string to HTML fragment (${birthFragmentMeta.htmlWrapperZid})`,
          arguments: {
            inner: {
              type: 'Function call',
              function: `${birthFragmentMeta.functionName} (${birthFragmentMeta.functionZid})`,
              arguments: {
                person: `Fetch Wikidata item → ${fixture.person}`,
                date: `Format date → ${fixture.date}`,
                location: `Fetch Wikidata item → ${fixture.place}`,
                language: fixture.language,
              },
            },
          },
        }, null, 2) }}</pre>
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
    </article>
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

.meaning-card__surface {
  border: 1px solid var(--border-color-subtle);
  padding: var(--spacing-150);
  background-color: var(--background-color-neutral-subtle);
}

.meaning-card__top h3,
.meaning-card__fields h4,
.meaning-card__function h4 {
  margin-top: 0;
}

.meaning-card__preview {
  border-left: 4px solid var(--border-color-progressive);
  margin: var(--spacing-100) 0;
  padding: var(--spacing-75) var(--spacing-100);
  background-color: var(--background-color-progressive-subtle);
}

.meaning-card__meta {
  margin: var(--spacing-50) 0;
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

.meaning-card__fields,
.meaning-card__function {
  margin-top: var(--spacing-150);
  padding-top: var(--spacing-100);
  border-top: 1px solid var(--border-color-subtle);
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--spacing-100);
}

.meaning-card__nested {
  margin-top: var(--spacing-100);
}

.meaning-card__tree {
  overflow: auto;
  max-height: 240px;
  margin: 0;
  padding: var(--spacing-100);
  background-color: var(--background-color-base);
  font-size: var(--font-size-small);
  white-space: pre-wrap;
}

.citation-row {
  margin-top: var(--spacing-150);
  padding-top: var(--spacing-100);
  border-top: 1px solid var(--border-color-subtle);
}
</style>
