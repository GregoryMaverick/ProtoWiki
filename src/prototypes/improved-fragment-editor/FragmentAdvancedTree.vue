<script setup lang="ts">
import { CdxField, CdxTextInput } from '@wikimedia/codex'

import { leadSectionMeta } from './lead-section-fixture'
import { useLeadSectionContext } from './use-lead-section'

const { activeFragment, setHighlight } = useLeadSectionContext()

function onFieldFocus(key: string) {
  setHighlight(key)
}

function onFieldBlur() {
  setHighlight(null)
}
</script>

<template>
  <div class="advanced-tree">
    <p class="advanced-tree__intro">
      Production-style <code>ZObjectKeyValue</code> tree — same expert surface as today, shown
      alongside the improved slot editor for comparison.
    </p>

    <details open class="native-node">
      <summary>Function call · string to HTML fragment ({{ leadSectionMeta.htmlWrapperZid }})</summary>
      <div class="native-node__body">
        <div class="native-kv">
          <span class="native-kv__key">string:</span>
          <details open class="native-node native-node--nested">
            <summary>
              Function call · {{ activeFragment.functionName }} ({{ activeFragment.functionZid }})
            </summary>
            <div class="native-node__body">
              <div class="native-kv">
                <span class="native-kv__key">person or entity:</span>
                <details class="native-node native-node--nested">
                  <summary>Function call · Fetch Wikidata item ({{ leadSectionMeta.fetchWikidataZid }})</summary>
                  <div class="native-node__body">
                    <CdxField>
                      <template #label>Z6K1 / label</template>
                      <CdxTextInput
                        v-model="activeFragment.person"
                        @focus="onFieldFocus('person')"
                        @blur="onFieldBlur"
                      />
                    </CdxField>
                  </div>
                </details>
              </div>

              <template v-if="activeFragment.id === 'birth'">
                <div class="native-kv">
                  <span class="native-kv__key">date:</span>
                  <details class="native-node native-node--nested">
                    <summary>
                      Function call ·
                      {{
                        activeFragment.dateSourceMode === 'wikidata'
                          ? 'date of birth from Wikidata item'
                          : 'Format date'
                      }}
                    </summary>
                    <div class="native-node__body">
                      <CdxField>
                        <template #label>Z6K1 / formatted date</template>
                        <CdxTextInput
                          v-model="activeFragment.date"
                          @focus="onFieldFocus('date')"
                          @blur="onFieldBlur"
                        />
                      </CdxField>
                    </div>
                  </details>
                </div>

                <div v-if="activeFragment.functionVariantId === 'full'" class="native-kv">
                  <span class="native-kv__key">location:</span>
                  <details class="native-node native-node--nested">
                    <summary>Function call · place of birth from Wikidata item</summary>
                    <div class="native-node__body">
                      <CdxField>
                        <template #label>Z6K1 / label</template>
                        <CdxTextInput
                          v-model="activeFragment.place"
                          @focus="onFieldFocus('place')"
                          @blur="onFieldBlur"
                        />
                      </CdxField>
                    </div>
                  </details>
                </div>

                <div class="native-kv">
                  <span class="native-kv__key">language:</span>
                  <span class="native-kv__value">{{ activeFragment.language }}</span>
                </div>
              </template>

              <template v-else>
                <div class="native-kv">
                  <span class="native-kv__key">organization:</span>
                  <details class="native-node native-node--nested">
                    <summary>Function call · Fetch Wikidata item ({{ leadSectionMeta.fetchWikidataZid }})</summary>
                    <div class="native-node__body">
                      <CdxField>
                        <template #label>Z6K1 / label</template>
                        <CdxTextInput
                          v-model="activeFragment.organization"
                          @focus="onFieldFocus('organization')"
                          @blur="onFieldBlur"
                        />
                      </CdxField>
                    </div>
                  </details>
                </div>

                <div class="native-kv">
                  <span class="native-kv__key">language:</span>
                  <span class="native-kv__value">{{ activeFragment.language }}</span>
                </div>
              </template>
            </div>
          </details>
        </div>
      </div>
    </details>
  </div>
</template>

<style scoped>
.advanced-tree__intro {
  margin: 0 0 var(--spacing-100);
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.native-node {
  border: 1px solid var(--border-color-subtle);
  border-radius: var(--border-radius-base);
  margin-bottom: var(--spacing-75);
  background-color: var(--background-color-neutral-subtle);
}

.native-node summary {
  cursor: pointer;
  padding: var(--spacing-75) var(--spacing-100);
  font-weight: var(--font-weight-bold);
}

.native-node__body {
  padding: 0 var(--spacing-100) var(--spacing-100);
}

.native-node--nested {
  margin-top: var(--spacing-50);
  margin-left: var(--spacing-100);
}

.native-kv {
  display: grid;
  grid-template-columns: 10rem minmax(0, 1fr);
  gap: var(--spacing-75);
  align-items: start;
  margin-bottom: var(--spacing-75);
}

.native-kv__key {
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  padding-top: var(--spacing-50);
}

.native-kv__value {
  padding-top: var(--spacing-50);
}
</style>
