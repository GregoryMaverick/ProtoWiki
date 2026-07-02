<script setup lang="ts">
import { computed } from 'vue'

import {
  buildFragmentSentence,
  buildFragmentTree,
  getPreviewSegments,
  leadSectionMeta,
  type FragmentId,
} from './lead-section-fixture'
import { articleSubject } from '../abstract-editor-paradigms/mock-registry'
import { useLeadSectionContext } from './use-lead-section'

const { section, activeFragmentId, activeFragment, highlightKey } = useLeadSectionContext()

const previewSentences = computed(() =>
  section.fragments.map((fragment) => ({
    id: fragment.id,
    text: fragment.previewError ? fragment.previewError : buildFragmentSentence(fragment),
    hasError: Boolean(fragment.previewError),
    hasCitation: Boolean(fragment.citation),
  })),
)

function isActiveFragment(id: FragmentId) {
  return activeFragmentId.value === id
}

function buildHighlightedParts(fragmentId: FragmentId, sentence: string) {
  const fragment = section.fragments.find((item) => item.id === fragmentId)
  if (!fragment || fragment.previewError) {
    return [{ text: sentence, key: null as string | null, highlighted: false }]
  }

  const segments = getPreviewSegments(fragment)
  const parts: { text: string; key: string | null; highlighted: boolean }[] = []
  let cursor = 0

  for (const segment of segments) {
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
      highlighted: isActiveFragment(fragmentId) && highlightKey.value === segment.key,
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
}
</script>

<template>
  <div class="lead-preview">
    <header class="lead-preview__header">
      <div>
        <p class="eyebrow">Generated text</p>
        <h2>{{ articleSubject }}</h2>
      </div>
    </header>

    <p class="lead-preview__section">
      Section: <strong>{{ leadSectionMeta.sectionLabel }}</strong>
      <span class="lead-preview__qid">({{ leadSectionMeta.sectionQid }})</span>
    </p>

    <div class="lead-preview__paragraph" aria-live="polite">
      <p
        v-for="entry in previewSentences"
        :key="entry.id"
        class="lead-preview__sentence"
        :class="{
          'lead-preview__sentence--active': isActiveFragment(entry.id),
          'lead-preview__sentence--error': entry.hasError,
        }"
      >
        <template
          v-for="(part, index) in buildHighlightedParts(entry.id, entry.text)"
          :key="`${entry.id}-${part.key ?? 'plain'}-${index}`"
        >
          <mark
            v-if="part.key"
            class="lead-preview__highlight"
            :class="{ 'lead-preview__highlight--active': part.highlighted }"
          >
            {{ part.text }}
          </mark>
          <template v-else>{{ part.text }}</template>
        </template>
        <sup v-if="entry.hasCitation && !entry.hasError" class="lead-preview__citation-mark">1</sup>
      </p>
    </div>

    <section v-if="activeFragment.citation" class="lead-preview__references">
      <h3>References</h3>
      <ol>
        <li>
          {{ activeFragment.citation.pageTitle }}. {{ activeFragment.citation.websiteName }}.
          Retrieved {{ activeFragment.citation.accessDate }}. {{ activeFragment.citation.url }}
        </li>
      </ol>
    </section>

    <p class="lead-preview__hint">
      Editing <strong>{{ activeFragment.cardTitle }}</strong> — focus a field on the left to
      highlight the matching phrase.
    </p>
  </div>
</template>

<style scoped>
.eyebrow {
  margin: 0 0 var(--spacing-25);
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.lead-preview__header h2 {
  margin: 0;
}

.lead-preview__section {
  margin: var(--spacing-100) 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.lead-preview__qid {
  color: var(--color-placeholder);
}

.lead-preview__paragraph {
  border: 1px solid var(--border-color-subtle);
  padding: var(--spacing-150);
  background-color: var(--background-color-base);
}

.lead-preview__sentence {
  margin: 0 0 var(--spacing-100);
  line-height: 1.6;
}

.lead-preview__sentence:last-child {
  margin-bottom: 0;
}

.lead-preview__sentence--active {
  border-left: 4px solid var(--border-color-progressive);
  padding-left: var(--spacing-100);
}

.lead-preview__sentence--error {
  color: var(--color-error);
  border-left-color: var(--border-color-error);
}

.lead-preview__highlight {
  background-color: var(--background-color-progressive-subtle);
  color: inherit;
  padding: 0 var(--spacing-12);
  border-radius: var(--border-radius-base);
}

.lead-preview__highlight--active {
  outline: 2px solid var(--border-color-progressive);
}

.lead-preview__citation-mark {
  margin-left: var(--spacing-12);
  color: var(--color-progressive);
}

.lead-preview__references {
  margin-top: var(--spacing-150);
  font-size: var(--font-size-small);
}

.lead-preview__references h3 {
  margin-top: 0;
}

.lead-preview__hint {
  margin: var(--spacing-100) 0 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}
</style>
