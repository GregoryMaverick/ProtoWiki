<script setup lang="ts">
import { computed } from 'vue'

import { CdxButton } from '@wikimedia/codex'

import CitationEditorPanel from './CitationEditorPanel.vue'
import { buildPipelineSteps } from './fragment-fixture'
import { citationFields } from './mock-registry'
import { useFragmentEditorContext } from './use-fragment-fixture'

const { fixture, setHighlight, attachCitation, removeCitation } = useFragmentEditorContext()

const steps = computed(() => buildPipelineSteps(fixture))

function onStepHover(fieldKey: 'person' | 'date' | 'place' | undefined) {
  if (fieldKey) {
    setHighlight(fieldKey)
  }
}

function onStepLeave() {
  setHighlight(null)
}

function layerClass(layer: string) {
  return `pipeline-step--${layer}`
}
</script>

<template>
  <div class="pipeline-view">
    <header class="panel-heading">
      <p class="eyebrow">Idea 5</p>
      <h2>Function pipeline view</h2>
      <p>
        Horizontal pipeline from Wikidata helpers through the sentence function to HTML fragment
        (and optional citation).
      </p>
    </header>

    <div class="pipeline-view__track" role="list" aria-label="Function pipeline">
      <template v-for="(step, index) in steps" :key="step.id">
        <article
          role="listitem"
          class="pipeline-step"
          :class="layerClass(step.layer)"
          tabindex="0"
          @mouseenter="onStepHover(step.fieldKey)"
          @mouseleave="onStepLeave"
          @focus="onStepHover(step.fieldKey)"
          @blur="onStepLeave"
        >
          <span class="pipeline-step__type">{{ step.outputType }}</span>
          <h3 class="pipeline-step__label">{{ step.label }}</h3>
          <p class="pipeline-step__detail">{{ step.detail }}</p>
        </article>
        <span v-if="index < steps.length - 1" class="pipeline-arrow" aria-hidden="true">→</span>
      </template>
    </div>

    <p class="pipeline-view__note">
      Hover a data step to highlight the matching value in the generated preview.
    </p>

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

.pipeline-view__track {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: var(--spacing-50);
}

.pipeline-step {
  flex: 1 1 8rem;
  min-width: 7rem;
  max-width: 11rem;
  border: 1px solid var(--border-color-subtle);
  padding: var(--spacing-100);
  background-color: var(--background-color-base);
  cursor: default;
}

.pipeline-step:focus {
  outline: 2px solid var(--border-color-progressive);
  outline-offset: 2px;
}

.pipeline-step--helper {
  border-top: 4px solid var(--border-color-progressive);
}

.pipeline-step--meaning {
  border-top: 4px solid var(--border-color-success);
}

.pipeline-step--wrapper {
  border-top: 4px solid var(--border-color-base);
}

.pipeline-step__type {
  display: block;
  margin-bottom: var(--spacing-50);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  color: var(--color-subtle);
}

.pipeline-step__label {
  margin: 0 0 var(--spacing-50);
  font-size: var(--font-size-small);
}

.pipeline-step__detail {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  word-break: break-word;
}

.pipeline-arrow {
  align-self: center;
  color: var(--color-subtle);
  font-size: var(--font-size-large);
  font-weight: var(--font-weight-bold);
}

.pipeline-view__note {
  margin: var(--spacing-100) 0 0;
  color: var(--color-placeholder);
  font-size: var(--font-size-small);
}

.citation-row {
  margin-top: var(--spacing-150);
}

@media (max-width: 700px) {
  .pipeline-view__track {
    flex-direction: column;
  }

  .pipeline-arrow {
    transform: rotate(90deg);
    align-self: flex-start;
    margin-left: var(--spacing-100);
  }

  .pipeline-step {
    max-width: none;
  }
}
</style>
