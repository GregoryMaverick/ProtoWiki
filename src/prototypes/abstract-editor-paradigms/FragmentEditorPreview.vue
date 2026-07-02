<script setup lang="ts">
import { computed } from 'vue'

import {
  buildBirthSentence,
  birthFragmentMeta,
  getPreviewSegments,
  type FragmentFieldKey,
} from './fragment-fixture'
import { articleSubject } from './mock-registry'
import { useFragmentEditorContext } from './use-fragment-fixture'

const { fixture, highlightKey } = useFragmentEditorContext()

const previewText = computed(() => buildBirthSentence(fixture))
const segments = computed(() => getPreviewSegments(fixture))

const previewParts = computed(() => {
  const sentence = previewText.value
  const parts: { text: string; key: FragmentFieldKey | null; highlighted: boolean }[] = []
  let cursor = 0

  for (const segment of segments.value) {
    const index = sentence.indexOf(segment.text, cursor)

    if (index === -1) {
      continue
    }

    if (index > cursor) {
      parts.push({
        text: sentence.slice(cursor, index),
        key: null,
        highlighted: false,
      })
    }

    parts.push({
      text: segment.text,
      key: segment.key,
      highlighted: highlightKey.value === segment.key,
    })

    cursor = index + segment.text.length
  }

  if (cursor < sentence.length) {
    parts.push({
      text: sentence.slice(cursor),
      key: null,
      highlighted: false,
    })
  }

  return parts
})

const hasCitation = computed(() => Boolean(fixture.citation))
</script>

<template>
  <div class="fragment-preview">
    <header class="fragment-preview__header">
      <div>
        <p class="eyebrow">Generated text</p>
        <h2>{{ articleSubject }}</h2>
      </div>
    </header>

    <p class="fragment-preview__section">
      Section: <strong>{{ birthFragmentMeta.sectionLabel }}</strong>
      <span class="fragment-preview__qid">({{ birthFragmentMeta.sectionQid }})</span>
    </p>

    <div class="fragment-preview__sentence" aria-live="polite">
      <p>
        <template v-for="(part, index) in previewParts" :key="`${part.key ?? 'plain'}-${index}`">
          <mark
            v-if="part.key"
            class="fragment-preview__highlight"
            :class="{ 'fragment-preview__highlight--active': part.highlighted }"
          >
            {{ part.text }}
          </mark>
          <template v-else>{{ part.text }}</template>
        </template>
        <sup v-if="hasCitation" class="fragment-preview__citation-mark">1</sup>
      </p>
    </div>

    <section v-if="fixture.citation" class="fragment-preview__references">
      <h3>References</h3>
      <ol>
        <li>
          {{ fixture.citation.pageTitle }}. {{ fixture.citation.websiteName }}. Retrieved
          {{ fixture.citation.accessDate }}. {{ fixture.citation.url }}
        </li>
      </ol>
    </section>

    <p class="fragment-preview__hint">
      Hover or focus fields on the left to highlight matching text here (Idea 3 · dual view).
    </p>
  </div>
</template>

<style scoped>
.fragment-preview {
  border: 1px solid var(--border-color-subtle);
  background-color: var(--background-color-base);
  padding: var(--spacing-150);
}

.fragment-preview__header h2 {
  margin: 0;
}

.eyebrow {
  margin: 0 0 var(--spacing-25);
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.fragment-preview__section {
  margin: var(--spacing-100) 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.fragment-preview__qid {
  font-family: var(--font-family-monospace, monospace);
}

.fragment-preview__sentence {
  border-left: 4px solid var(--border-color-progressive);
  margin: var(--spacing-100) 0;
  padding: var(--spacing-75) var(--spacing-100);
  background-color: var(--background-color-progressive-subtle);
}

.fragment-preview__sentence p {
  margin: 0;
  line-height: var(--line-height-medium);
}

.fragment-preview__highlight {
  padding: 0 var(--spacing-12);
  border-radius: var(--border-radius-base);
  background-color: transparent;
  color: inherit;
  transition: background-color 120ms ease;
}

.fragment-preview__highlight--active {
  background-color: var(--background-color-warning-subtle);
  outline: 2px solid var(--border-color-warning);
}

.fragment-preview__citation-mark {
  margin-left: 0.1em;
  color: var(--color-progressive);
  font-size: 0.75em;
  font-weight: var(--font-weight-bold);
}

.fragment-preview__references {
  margin-top: var(--spacing-150);
  border-top: 1px solid var(--border-color-subtle);
  padding-top: var(--spacing-100);
}

.fragment-preview__references h3 {
  margin-top: 0;
}

.fragment-preview__references ol {
  margin: 0;
  padding-left: var(--spacing-150);
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.fragment-preview__hint {
  margin: var(--spacing-100) 0 0;
  color: var(--color-placeholder);
  font-size: var(--font-size-small);
}
</style>
