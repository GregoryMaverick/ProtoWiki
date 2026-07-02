<script setup lang="ts">
import { CdxButton, CdxField, CdxTextInput } from '@wikimedia/codex'

import CitationEditorPanel from './CitationEditorPanel.vue'
import { birthFragmentMeta } from './fragment-fixture'
import { citationFields } from './mock-registry'
import { useFragmentEditorContext } from './use-fragment-fixture'

const { fixture, setHighlight, attachCitation, removeCitation } = useFragmentEditorContext()

function onFieldFocus(key: 'person' | 'date' | 'place') {
  setHighlight(key)
}

function onFieldBlur() {
  setHighlight(null)
}
</script>

<template>
  <div class="native-tree">
    <header class="panel-heading">
      <p class="eyebrow">Baseline</p>
      <h2>Native-style tree</h2>
      <p>
        WikiLambda-like nested labels — the current Abstract Article editor surface for comparison
        (generic <code>ZObjectKeyValue</code> tree).
      </p>
    </header>

    <div class="native-tree__section">
      <p class="native-tree__section-label">
        Section: {{ birthFragmentMeta.sectionLabel }} ({{ birthFragmentMeta.sectionQid }})
      </p>

      <details open class="native-node">
        <summary>Function call · string to HTML fragment (Z813)</summary>
        <div class="native-node__body">
          <div class="native-kv">
            <span class="native-kv__key">string:</span>
            <details open class="native-node native-node--nested">
              <summary>
                Function call · {{ birthFragmentMeta.functionName }} ({{ birthFragmentMeta.functionZid }})
              </summary>
              <div class="native-node__body">
                <div class="native-kv">
                  <span class="native-kv__key">person or entity:</span>
                  <details class="native-node native-node--nested">
                    <summary>Function call · Fetch Wikidata item (Z8040)</summary>
                    <div class="native-node__body">
                      <CdxField>
                        <template #label>Z6K1 / label</template>
                        <CdxTextInput
                          v-model="fixture.person"
                          @focus="onFieldFocus('person')"
                          @blur="onFieldBlur"
                        />
                      </CdxField>
                    </div>
                  </details>
                </div>

                <div class="native-kv">
                  <span class="native-kv__key">date:</span>
                  <details class="native-node native-node--nested">
                    <summary>Function call · Format date (Z20420K1)</summary>
                    <div class="native-node__body">
                      <CdxField>
                        <template #label>Z6K1 / formatted date</template>
                        <CdxTextInput
                          v-model="fixture.date"
                          @focus="onFieldFocus('date')"
                          @blur="onFieldBlur"
                        />
                      </CdxField>
                    </div>
                  </details>
                </div>

                <div class="native-kv">
                  <span class="native-kv__key">location:</span>
                  <details class="native-node native-node--nested">
                    <summary>Function call · Fetch Wikidata item (Z8040)</summary>
                    <div class="native-node__body">
                      <CdxField>
                        <template #label>Z6K1 / label</template>
                        <CdxTextInput
                          v-model="fixture.place"
                          @focus="onFieldFocus('place')"
                          @blur="onFieldBlur"
                        />
                      </CdxField>
                    </div>
                  </details>
                </div>

                <div class="native-kv">
                  <span class="native-kv__key">language:</span>
                  <span class="native-kv__value">{{ fixture.language }}</span>
                </div>
              </div>
            </details>
          </div>
        </div>
      </details>

      <details v-if="fixture.citation" open class="native-node">
        <summary>Function call · simple cite web (Z32053)</summary>
        <div class="native-node__body">
          <CitationEditorPanel
            v-model:citation="fixture.citation"
            v-model:expanded="fixture.citationExpanded"
            :fields="citationFields"
            @remove="removeCitation"
          />
        </div>
      </details>
    </div>

    <div v-if="!fixture.citation" class="citation-actions">
      <CdxButton action="default" weight="normal" @click="attachCitation">Add citation</CdxButton>
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

.native-tree__section {
  border: 1px solid var(--border-color-subtle);
  padding: var(--spacing-100);
  background-color: var(--background-color-neutral-subtle);
}

.native-tree__section-label {
  margin: 0 0 var(--spacing-100);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  color: var(--color-subtle);
}

.native-node {
  margin-bottom: var(--spacing-75);
  border: 1px solid var(--border-color-subtle);
  background-color: var(--background-color-base);
}

.native-node--nested {
  margin-top: var(--spacing-50);
}

.native-node summary {
  padding: var(--spacing-75) var(--spacing-100);
  cursor: pointer;
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
}

.native-node__body {
  padding: 0 var(--spacing-100) var(--spacing-100);
  padding-left: var(--spacing-200);
}

.native-kv {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
  margin-bottom: var(--spacing-100);
}

.native-kv__key {
  font-size: var(--font-size-small);
  color: var(--color-subtle);
  font-family: var(--font-family-monospace, monospace);
}

.native-kv__value {
  font-size: var(--font-size-small);
  font-family: var(--font-family-monospace, monospace);
}

.citation-actions {
  margin-top: var(--spacing-150);
}
</style>
