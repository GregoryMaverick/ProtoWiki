<script setup lang="ts">
/**
 * Dual-path content entry prototype
 *
 * One input field accepts both:
 *   - Information keywords  ("occupation", "date of birth", "P106")
 *   - Full sentences        ("Steve Wozniak is a software engineer.")
 *
 * Two matchers run in parallel against the same authoring registry
 * (hybridCardCatalog). Both paths converge on the same compose form.
 * The user picks a result, edits pre-filled fields, and saves a fragment.
 */

import { computed, reactive, ref } from 'vue'
import {
  CdxButton,
  CdxField,
  CdxMessage,
  CdxSelect,
  CdxTextInput,
} from '@wikimedia/codex'
import ChromeWrapper from '@/components/ChromeWrapper.vue'
import {
  articleSections,
  articleSubject,
  hybridCardCatalog,
  previewLanguages,
  type PreviewLanguage,
  type HybridCardDefinition,
  type SectionDefinition,
} from '../abstract-editor-paradigms/mock-registry'

definePage({
  meta: {
    title: 'Dual-path content entry',
    description:
      'One field accepts an information keyword ("occupation") or a sentence ("Wozniak is a software engineer"). Both paths open the same compose form.',
  },
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MatchType = 'information' | 'sentence' | 'both'
type Confidence = 'high' | 'medium' | 'low'

interface SearchResult {
  cardId: string
  card: HybridCardDefinition
  matchType: MatchType
  confidence: Confidence
  /** Slot values extracted from a sentence match; used to pre-fill compose fields. */
  prefill?: Record<string, string>
}

interface SavedFragment {
  id: string
  cardId: string
  sectionId: string
  values: Record<string, string>
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const query = ref('')
const composingCard = ref<HybridCardDefinition | null>(null)
const composingValues = ref<Record<string, string>>({})
const savedFragments = reactive<SavedFragment[]>([])
const activeSection = ref('lead')
const previewLanguage = ref<PreviewLanguage>('en')

// ---------------------------------------------------------------------------
// Information matcher
// ---------------------------------------------------------------------------
// Scores cards by comparing the query to informationLabel and wikidataProperty.
// Works best for short queries like "occupation", "born", or "P106".

function confidenceLevel(score: number): Confidence {
  return score >= 8 ? 'high' : score >= 3 ? 'medium' : 'low'
}

function scoreInformation(input: string): SearchResult[] {
  const q = input.trim().toLowerCase()
  if (!q) return []

  const results: SearchResult[] = []

  for (const card of hybridCardCatalog) {
    const label = card.informationLabel.toLowerCase()
    const property = card.wikidataProperty.toLowerCase()

    let score = 0
    if (label === q) score += 10
    else if (label.startsWith(q)) score += 7
    else if (label.includes(q)) score += 5
    else if (q.includes(label)) score += 4

    if (property.includes(q)) score += 3

    // Partial word matches across label tokens
    for (const word of label.split(' ')) {
      if (word.length > 2 && q.includes(word)) score += 2
    }

    if (score > 0) {
      results.push({
        cardId: card.id,
        card,
        matchType: 'information',
        confidence: confidenceLevel(score),
      })
    }
  }

  return results.sort(
    (a, b) => confidenceOrder(b.confidence) - confidenceOrder(a.confidence),
  )
}

// ---------------------------------------------------------------------------
// Sentence matcher
// ---------------------------------------------------------------------------
// Converts each card's [Slot] pattern into a capturing regex, runs it against
// the input, and extracts slot values for pre-filling the compose form.
//
// e.g. "[Person] is a [class]"  →  /^(.+?) is a (.+?)\.?$/i
//      "Steve Wozniak is a software engineer."
//      → prefill: { entity: "Steve Wozniak", class: "software engineer" }

function buildPatternRegex(pattern: string): RegExp | null {
  let regexStr = ''
  let remaining = pattern

  while (remaining.includes('[')) {
    const open = remaining.indexOf('[')
    const close = remaining.indexOf(']', open)
    if (close === -1) break
    // Escape the literal text before this slot, then add a capture group
    const literal = remaining.slice(0, open).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    regexStr += literal + '(.+?)'
    remaining = remaining.slice(close + 1)
  }

  // Escape any remaining literal text and allow an optional trailing period
  regexStr += remaining.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.?'

  try {
    return new RegExp(`^${regexStr}$`, 'i')
  } catch {
    return null
  }
}

function scoreSentence(input: string): SearchResult[] {
  const q = input.trim()
  // Require at least 3 words — a single word is more likely a keyword
  if (q.split(/\s+/).length < 3) return []

  const results: SearchResult[] = []

  for (const card of hybridCardCatalog) {
    const regex = buildPatternRegex(card.pattern)
    if (!regex) continue

    const match = q.match(regex)
    if (!match) continue

    // Map capture groups back to field keys in order
    const prefill: Record<string, string> = {}
    card.fields.forEach((field, i) => {
      if (match[i + 1]) prefill[field.key] = match[i + 1].trim()
    })

    results.push({
      cardId: card.id,
      card,
      matchType: 'sentence',
      confidence: 'high',
      prefill,
    })
  }

  return results
}

// ---------------------------------------------------------------------------
// Merge & rank
// ---------------------------------------------------------------------------

function confidenceOrder(c: Confidence): number {
  return c === 'high' ? 3 : c === 'medium' ? 2 : 1
}

function matchTypeOrder(m: MatchType): number {
  return m === 'both' ? 3 : m === 'sentence' ? 2 : 1
}

const searchResults = computed<SearchResult[]>(() => {
  const q = query.value.trim()
  if (q.length < 2) return []

  // Build a map from cardId → result, starting with information hits
  const merged = new Map<string, SearchResult>(
    scoreInformation(q).map((r) => [r.cardId, r]),
  )

  // Overlay sentence hits; if a card appears in both, mark it 'both'
  for (const hit of scoreSentence(q)) {
    if (merged.has(hit.cardId)) {
      merged.set(hit.cardId, { ...hit, matchType: 'both', confidence: 'high' })
    } else {
      merged.set(hit.cardId, hit)
    }
  }

  return [...merged.values()].sort(
    (a, b) =>
      matchTypeOrder(b.matchType) - matchTypeOrder(a.matchType) ||
      confidenceOrder(b.confidence) - confidenceOrder(a.confidence),
  )
})

const noResults = computed(
  () => query.value.trim().length > 1 && searchResults.value.length === 0,
)

// ---------------------------------------------------------------------------
// Compose form
// ---------------------------------------------------------------------------

function openCompose(result: SearchResult) {
  composingCard.value = result.card
  // Pre-fill with sentence-extracted values, then fall back to article subject
  // for the entity field, and empty for everything else
  composingValues.value = Object.fromEntries(
    result.card.fields.map((field) => [
      field.key,
      result.prefill?.[field.key] ?? (field.key === 'entity' ? articleSubject : ''),
    ]),
  )
  query.value = ''
}

const composingPreview = computed(() => {
  if (!composingCard.value) return ''
  const values = Object.fromEntries(
    composingCard.value.fields.map((field) => [
      field.key,
      composingValues.value[field.key]?.trim() || `[${field.label}]`,
    ]),
  )
  return composingCard.value.sentence(values)
})

const canSave = computed(
  () =>
    composingCard.value?.fields.every((f) => composingValues.value[f.key]?.trim()) ?? false,
)

function useWikidataSuggestion(fieldKey: string, suggestion: string) {
  composingValues.value[fieldKey] = suggestion
}

function saveFragment() {
  if (!composingCard.value || !canSave.value) return
  const card = composingCard.value
  savedFragments.push({
    id: `frag-${Date.now()}`,
    cardId: card.id,
    sectionId: card.sectionId,
    values: Object.fromEntries(
      card.fields.map((f) => [f.key, composingValues.value[f.key].trim()]),
    ),
  })
  activeSection.value = card.sectionId
  composingCard.value = null
  composingValues.value = {}
}

function cancelCompose() {
  composingCard.value = null
  composingValues.value = {}
}

// ---------------------------------------------------------------------------
// Fragment display helpers
// ---------------------------------------------------------------------------

function fragmentCard(frag: SavedFragment): HybridCardDefinition | undefined {
  return hybridCardCatalog.find((c) => c.id === frag.cardId)
}

function fragmentSentence(frag: SavedFragment): string {
  const card = fragmentCard(frag)
  return card ? card.sentence(frag.values) : ''
}

function fragmentsForSection(sectionId: string): SavedFragment[] {
  return savedFragments.filter((f) => f.sectionId === sectionId)
}

const sectionOrder = computed(() => articleSections.map((s) => s.id))

const fragmentsInArticleOrder = computed(() => {
  const bySection = new Map<string, SavedFragment[]>()
  for (const frag of savedFragments) {
    const list = bySection.get(frag.sectionId) ?? []
    list.push(frag)
    bySection.set(frag.sectionId, list)
  }

  const ordered: { section: SectionDefinition; fragments: SavedFragment[] }[] = []
  for (const sectionId of sectionOrder.value) {
    const section = articleSections.find((s) => s.id === sectionId)
    if (!section) continue
    const frags = bySection.get(sectionId) ?? []
    ordered.push({ section, fragments: frags })
  }

  return ordered
})

const previewLanguageOptions = computed(() =>
  previewLanguages.map((lang) => ({ value: lang.code, label: lang.label })),
)

function removeFragment(id: string) {
  const i = savedFragments.findIndex((f) => f.id === id)
  if (i !== -1) savedFragments.splice(i, 1)
}

function sectionLabel(section: SectionDefinition): string {
  return section.label
}
</script>

<template>
  <ChromeWrapper>
    <div class="dpe-page">
      <div class="dpe-page__inner">

        <!-- Page header -->
        <header class="dpe-header">
          <p class="dpe-header__eyebrow">Abstract article · {{ articleSubject }}</p>
          <h1 class="dpe-header__title">Dual-path content entry</h1>
          <p class="dpe-header__desc">
            Type a <strong>fact name</strong> like <code>occupation</code> or write a
            <strong>sentence</strong> like
            <code>Steve Wozniak is a software engineer.</code> — one input, two ways in,
            the same compose form.
          </p>
        </header>

        <div class="dpe-body">

          <!-- ── Left: editor column ──────────────────────────────────── -->
          <div class="dpe-editor-col">

            <!-- Unified input -->
            <div class="dpe-search-box">
              <CdxField>
                <template #label>Add content</template>
                <template #description>
                  Try <code>occupation</code>, <code>date of birth</code>, or
                  <code>Steve Wozniak is a software engineer.</code>
                </template>
                <CdxTextInput
                  v-model="query"
                  placeholder="Type a fact name or write a sentence…"
                  :disabled="!!composingCard"
                />
              </CdxField>
            </div>

            <!-- Search results -->
            <div v-if="searchResults.length && !composingCard" class="dpe-results">
              <p class="dpe-results__heading">
                {{ searchResults.length }}
                match{{ searchResults.length === 1 ? '' : 'es' }} for
                <em>{{ query }}</em>
              </p>
              <ul class="dpe-results__list">
                <li
                  v-for="result in searchResults"
                  :key="result.cardId"
                  class="dpe-result"
                >
                  <!-- Match-type badges -->
                  <div class="dpe-result__badges">
                    <span
                      v-if="result.matchType === 'information' || result.matchType === 'both'"
                      class="dpe-badge dpe-badge--info"
                    >Information type</span>
                    <span
                      v-if="result.matchType === 'sentence' || result.matchType === 'both'"
                      class="dpe-badge dpe-badge--sentence"
                    >Matches your sentence</span>
                    <span class="dpe-confidence" :data-level="result.confidence">
                      {{ result.confidence }} confidence
                    </span>
                  </div>

                  <!-- Card body -->
                  <div class="dpe-result__body">
                    <strong class="dpe-result__label">{{ result.card.informationLabel }}</strong>
                    <code class="dpe-pattern-chip">{{ result.card.pattern }}</code>

                    <!-- Parsed slot values extracted from the typed sentence -->
                    <p
                      v-if="result.prefill && Object.keys(result.prefill).length"
                      class="dpe-result__extracted"
                    >
                      <span class="dpe-label-text">Parsed from sentence:</span>
                      <span
                        v-for="(val, key) in result.prefill"
                        :key="key"
                        class="dpe-pill"
                      >{{ key }}: <strong>{{ val }}</strong></span>
                    </p>
                  </div>

                  <CdxButton
                    weight="primary"
                    action="progressive"
                    @click="openCompose(result)"
                  >
                    Compose
                  </CdxButton>
                </li>
              </ul>
            </div>

            <!-- No-results message -->
            <CdxMessage
              v-if="noResults && !composingCard"
              type="warning"
              class="dpe-no-results"
            >
              No matching information type or sentence pattern found.
              Try shorter wording like <code>occupation</code>, or a simpler sentence
              like <code>Steve Wozniak is a software engineer.</code>
            </CdxMessage>

            <!-- ── Compose form ─────────────────────────────────────── -->
            <section v-if="composingCard" class="dpe-compose" aria-label="Compose fragment">
              <header class="dpe-compose__header">
                <h2 class="dpe-compose__title">{{ composingCard.informationLabel }}</h2>
                <code class="dpe-pattern-chip dpe-pattern-chip--lg">{{ composingCard.pattern }}</code>
                <p class="dpe-compose__helper">{{ composingCard.helper }}</p>
              </header>

              <!-- Fields -->
              <div class="dpe-compose__fields">
                <div
                  v-for="field in composingCard.fields"
                  :key="field.key"
                  class="dpe-compose__field-wrap"
                >
                  <CdxField>
                    <template #label>{{ field.label }}</template>
                    <CdxTextInput
                      v-model="composingValues[field.key]"
                      :placeholder="field.placeholder"
                    />
                  </CdxField>
                  <p v-if="field.wikidataSuggestion" class="dpe-wikidata-hint">
                    Wikidata suggests: <strong>{{ field.wikidataSuggestion }}</strong>
                    <CdxButton
                      weight="quiet"
                      @click="useWikidataSuggestion(field.key, field.wikidataSuggestion!)"
                    >
                      Use
                    </CdxButton>
                  </p>
                </div>
              </div>

              <!-- Live preview -->
              <div v-if="composingPreview" class="dpe-compose__preview">
                <span class="dpe-label-text">Preview:</span> {{ composingPreview }}
              </div>

              <!-- Actions -->
              <div class="dpe-compose__actions">
                <CdxButton
                  weight="primary"
                  action="progressive"
                  :disabled="!canSave"
                  @click="saveFragment"
                >
                  Add to {{ articleSections.find(s => s.id === composingCard!.sectionId)?.label }}
                </CdxButton>
                <CdxButton weight="quiet" @click="cancelCompose">Cancel</CdxButton>
              </div>
            </section>

          </div>

          <!-- ── Right: article preview column ───────────────────────── -->
          <div class="dpe-article-col">
            <div class="dpe-generated">
              <header class="dpe-generated__header">
                <div>
                  <p class="dpe-eyebrow">Generated text</p>
                  <h2 class="dpe-generated__title">{{ articleSubject }}</h2>
                </div>
                <div class="dpe-generated__language">
                  <CdxField>
                    <template #label>Language</template>
                    <CdxSelect v-model:selected="previewLanguage" :menu-items="previewLanguageOptions" />
                  </CdxField>
                </div>
              </header>

              <div class="dpe-generated__body" aria-live="polite">
                <p v-if="!savedFragments.length" class="dpe-generated__empty">
                  No generated text yet. Add content using the editor on the left.
                </p>

                <template v-else>
                  <template v-for="group in fragmentsInArticleOrder" :key="group.section.id">
                    <template v-if="group.fragments.length">
                      <h3 v-if="group.section.id !== 'lead'" class="dpe-generated__section">
                        {{ sectionLabel(group.section) }}
                      </h3>
                      <p class="dpe-generated__paragraph">
                        <template v-for="frag in group.fragments" :key="frag.id">
                          {{ fragmentSentence(frag) }}
                          <span> </span>
                        </template>
                      </p>
                    </template>
                  </template>
                </template>
              </div>
            </div>

            <details class="dpe-fragments-panel">
              <summary class="dpe-fragments-panel__summary">Fragments (edit / remove)</summary>
              <div class="dpe-fragment-stack">
                <p v-if="!savedFragments.length" class="dpe-section-empty">
                  No fragments yet.
                </p>

                <article v-for="frag in savedFragments" :key="frag.id" class="dpe-fragment">
                  <div class="dpe-fragment__top">
                    <div class="dpe-fragment__meta">
                      <span class="dpe-fragment__info-label">
                        {{ fragmentCard(frag)?.informationLabel }}
                      </span>
                      <code class="dpe-pattern-chip">{{ fragmentCard(frag)?.pattern }}</code>
                      <p class="dpe-fragment__placement">
                        Section: <strong>{{ sectionLabel(articleSections.find(s => s.id === frag.sectionId)!) }}</strong>
                      </p>
                    </div>
                    <CdxButton weight="quiet" action="destructive" @click="removeFragment(frag.id)">
                      Remove
                    </CdxButton>
                  </div>

                  <p class="dpe-fragment__sentence">{{ fragmentSentence(frag) }}</p>

                  <details class="dpe-fragment__details">
                    <summary class="dpe-fragment__summary">Show structure</summary>
                    <div class="dpe-structure">
                      <p class="dpe-structure__row">
                        <span class="dpe-label-text">Information type:</span>
                        {{ fragmentCard(frag)?.informationLabel }}
                      </p>
                      <p class="dpe-structure__row">
                        <span class="dpe-label-text">Pattern:</span>
                        <code>{{ fragmentCard(frag)?.pattern }}</code>
                      </p>
                      <p class="dpe-structure__row">
                        <span class="dpe-label-text">Function:</span>
                        {{ fragmentCard(frag)?.functionName }}
                      </p>
                      <p class="dpe-structure__row">
                        <span class="dpe-label-text">Wikidata property:</span>
                        {{ fragmentCard(frag)?.wikidataProperty }}
                      </p>
                      <p class="dpe-structure__row">
                        <span class="dpe-label-text">Values:</span>
                        <span v-for="(val, key) in frag.values" :key="key" class="dpe-pill"
                          >{{ key }}: <strong>{{ val }}</strong></span
                        >
                      </p>
                    </div>
                  </details>
                </article>
              </div>
            </details>
          </div>

        </div>
      </div>
    </div>
  </ChromeWrapper>
</template>

<style scoped>
/* ── Page shell ──────────────────────────────────────────────────────────── */

.dpe-page {
  padding: var(--spacing-150) 0 var(--spacing-300);
}

.dpe-page__inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 var(--spacing-150);
}

/* ── Header ──────────────────────────────────────────────────────────────── */

.dpe-header {
  margin-bottom: var(--spacing-200);
  padding-bottom: var(--spacing-150);
  border-bottom: 1px solid var(--border-color-subtle);
}

.dpe-header__eyebrow {
  font-size: var(--font-size-x-small);
  color: var(--color-subtle);
  margin: 0 0 var(--spacing-50);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dpe-header__title {
  font-size: var(--font-size-xx-large);
  font-weight: var(--font-weight-bold);
  margin: 0 0 var(--spacing-75);
}

.dpe-header__desc {
  color: var(--color-subtle);
  margin: 0;
  max-width: 56em;
}

/* ── Two-column body ─────────────────────────────────────────────────────── */

.dpe-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--spacing-200);
  align-items: start;
}

@media (max-width: 768px) {
  .dpe-body {
    grid-template-columns: 1fr;
  }
}

/* ── Editor column ───────────────────────────────────────────────────────── */

.dpe-editor-col,
.dpe-article-col {
  min-width: 0;
}

.dpe-editor-col {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-125);
}

.dpe-search-box {
  background-color: var(--background-color-base);
  border: 1px solid var(--border-color-subtle);
  border-radius: var(--border-radius-base);
  padding: var(--spacing-100);
}

/* ── Results list ────────────────────────────────────────────────────────── */

.dpe-results {
  border: 1px solid var(--border-color-subtle);
  border-radius: var(--border-radius-base);
  background-color: var(--background-color-base);
  overflow: hidden;
}

.dpe-results__heading {
  margin: 0;
  padding: var(--spacing-75) var(--spacing-100);
  font-size: var(--font-size-x-small);
  color: var(--color-subtle);
  border-bottom: 1px solid var(--border-color-subtle);
}

.dpe-results__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.dpe-result {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75);
  padding: var(--spacing-100);
  border-bottom: 1px solid var(--border-color-subtle);
}

.dpe-result:last-child {
  border-bottom: none;
}

.dpe-result__badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-50);
}

.dpe-badge {
  display: inline-block;
  padding: 2px var(--spacing-75);
  border-radius: var(--border-radius-pill);
  font-size: var(--font-size-x-small);
  font-weight: var(--font-weight-bold);
}

.dpe-badge--info {
  background-color: var(--background-color-progressive-subtle);
  color: var(--color-progressive);
}

.dpe-badge--sentence {
  background-color: var(--background-color-success-subtle);
  color: var(--color-success);
}

.dpe-confidence {
  font-size: var(--font-size-x-small);
  color: var(--color-subtle);
}

.dpe-confidence[data-level="high"] {
  color: var(--color-success);
}

.dpe-result__body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
}

.dpe-result__label {
  font-size: var(--font-size-medium);
}

.dpe-result__extracted {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-50);
  margin: 0;
  font-size: var(--font-size-small);
}

.dpe-no-results {
  margin-top: var(--spacing-50);
}

/* ── Compose form ────────────────────────────────────────────────────────── */

.dpe-compose {
  background-color: var(--background-color-base);
  border: 1px solid var(--border-color-subtle);
  border-radius: var(--border-radius-base);
  padding: var(--spacing-125);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100);
}

.dpe-compose__header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
  padding-bottom: var(--spacing-100);
  border-bottom: 1px solid var(--border-color-subtle);
}

.dpe-compose__title {
  margin: 0;
  font-size: var(--font-size-large);
  font-weight: var(--font-weight-bold);
}

.dpe-compose__helper {
  margin: 0;
  font-size: var(--font-size-small);
  color: var(--color-subtle);
}

.dpe-compose__fields {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100);
}

.dpe-compose__field-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-25);
}

.dpe-wikidata-hint {
  display: flex;
  align-items: center;
  gap: var(--spacing-50);
  margin: 0;
  font-size: var(--font-size-small);
  color: var(--color-subtle);
}

.dpe-compose__preview {
  background-color: var(--background-color-neutral-subtle);
  border-radius: var(--border-radius-base);
  padding: var(--spacing-75) var(--spacing-100);
  font-style: italic;
}

.dpe-compose__actions {
  display: flex;
  gap: var(--spacing-75);
  padding-top: var(--spacing-50);
}

/* ── Article preview column ──────────────────────────────────────────────── */

.dpe-section-empty {
  font-size: var(--font-size-small);
  color: var(--color-subtle);
  font-style: italic;
  text-align: center;
  padding: var(--spacing-200) var(--spacing-100);
}

.dpe-fragment-stack {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100);
}

/* ── Generated text preview (Abstract-like) ──────────────────────────────── */

.dpe-generated {
  border: 1px solid var(--border-color-subtle);
  background-color: var(--background-color-base);
  border-radius: var(--border-radius-base);
  padding: var(--spacing-150);
  min-width: 0;
}

.dpe-generated__header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: start;
  gap: var(--spacing-100);
  margin-bottom: var(--spacing-100);
}

.dpe-generated__header > div:first-child {
  flex: 1 1 10rem;
  min-width: 0;
}

.dpe-eyebrow {
  margin: 0 0 var(--spacing-25);
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.dpe-generated__title {
  margin: 0;
  font-size: 2.25rem;
  line-height: 1.1;
}

.dpe-generated__language {
  flex: 0 1 12rem;
  min-width: 0;
  max-width: 100%;
}

.dpe-generated__language :deep(.cdx-field) {
  max-width: 100%;
}

.dpe-generated__language :deep(.cdx-select) {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.dpe-generated__language :deep(.cdx-select-vue) {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.dpe-generated__language :deep(.cdx-select-vue__handle) {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.dpe-generated__body {
  border-top: 1px solid var(--border-color-subtle);
  padding-top: var(--spacing-100);
}

.dpe-generated__empty {
  margin: 0;
  color: var(--color-subtle);
  font-style: italic;
}

.dpe-generated__section {
  margin: var(--spacing-200) 0 var(--spacing-75);
  font-size: var(--font-size-large);
}

.dpe-generated__paragraph {
  margin: 0;
  font-size: var(--font-size-medium);
  line-height: var(--line-height-large);
}

/* ── Secondary fragments panel ───────────────────────────────────────────── */

.dpe-fragments-panel {
  margin-top: var(--spacing-150);
}

.dpe-fragments-panel__summary {
  cursor: pointer;
  color: var(--color-subtle);
  user-select: none;
  font-size: var(--font-size-small);
  margin-bottom: var(--spacing-75);
}

.dpe-fragments-panel__summary:hover {
  color: var(--color-base);
}

/* ── Fragment card ───────────────────────────────────────────────────────── */

.dpe-fragment {
  border: 1px solid var(--border-color-subtle);
  border-radius: var(--border-radius-base);
  padding: var(--spacing-100);
  background-color: var(--background-color-base);
}

.dpe-fragment__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-75);
  margin-bottom: var(--spacing-75);
}

.dpe-fragment__meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-25);
}

.dpe-fragment__info-label {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-small);
}

.dpe-fragment__sentence {
  margin: 0 0 var(--spacing-75);
}

.dpe-fragment__placement {
  margin: var(--spacing-25) 0 0;
  color: var(--color-subtle);
  font-size: var(--font-size-x-small);
}

.dpe-fragment__details {
  font-size: var(--font-size-small);
}

.dpe-fragment__summary {
  cursor: pointer;
  color: var(--color-subtle);
  user-select: none;
  font-size: var(--font-size-small);
}

.dpe-fragment__summary:hover {
  color: var(--color-base);
}

/* ── Structure reveal ────────────────────────────────────────────────────── */

.dpe-structure {
  margin-top: var(--spacing-75);
  background-color: var(--background-color-neutral-subtle);
  border-radius: var(--border-radius-base);
  padding: var(--spacing-75) var(--spacing-100);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
}

.dpe-structure__row {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-50);
}

/* ── Shared atoms ────────────────────────────────────────────────────────── */

.dpe-label-text {
  font-size: var(--font-size-x-small);
  font-weight: var(--font-weight-bold);
  color: var(--color-subtle);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.dpe-pattern-chip {
  display: inline-block;
  background-color: var(--background-color-neutral-subtle);
  color: var(--color-base);
  padding: 1px var(--spacing-75);
  border-radius: var(--border-radius-base);
  font-size: var(--font-size-x-small);
}

.dpe-pattern-chip--lg {
  font-size: var(--font-size-small);
}

.dpe-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-25);
  background-color: var(--background-color-progressive-subtle);
  color: var(--color-progressive);
  border-radius: var(--border-radius-pill);
  padding: 1px var(--spacing-75);
  font-size: var(--font-size-x-small);
}
</style>
