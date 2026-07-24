<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { CdxButton, CdxDialog, CdxField, CdxIcon, CdxMessage, CdxTextInput } from '@wikimedia/codex'
import {
  cdxIconAdd,
  cdxIconArrowDown,
  cdxIconArrowUp,
  cdxIconEdit,
  cdxIconTableAddRowAfter,
  cdxIconTableAddRowBefore,
  cdxIconTrash,
} from '@wikimedia/codex-icons'

import ArticleCustom from '@/components/article/ArticleCustom.vue'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import SentenceActionMenu from './SentenceActionMenu.vue'
import AbstractEditToolbar from './AbstractEditToolbar.vue'
import {
  abstractArticleEditUrl,
  articleSections,
  composeFunctionLayers,
  exampleValuesForCard,
  hybridCardCatalog,
  isCardAvailableInAddSearch,
  sectionHeadingFunction,
  type HybridCardDefinition,
  type TemplateFieldDefinition,
} from '../abstract-editor-paradigms/mock-registry'

definePage({
  meta: {
    title: 'Abstract editor one-column article',
    description:
      'Standalone article-shaped abstract editor: section function groups compile nested Wikifunctions into prose.',
  },
})

interface SectionPlan {
  sectionId: string
  chipOrder: string[]
  isCustom?: boolean
}

interface FunctionGroupFragment {
  id: string
  cardId: string
  values: Record<string, string>
}

type FragmentMenuAction =
  | 'edit'
  | 'move-up'
  | 'move-down'
  | 'insert-above'
  | 'insert-below'
  | 'delete'

type SectionMenuAction = 'edit' | 'delete'

type DialogMode = 'chip' | 'add-search' | 'section-heading'

type MatchType = 'information' | 'sentence' | 'both'
type Confidence = 'high' | 'medium' | 'low'

interface SearchResult {
  cardId: string
  card: HybridCardDefinition
  matchType: MatchType
  confidence: Confidence
  prefill?: Record<string, string>
}

const articleBlueprint = reactive<SectionPlan[]>([
  {
    sectionId: 'lead',
    chipOrder: [
      'birthDate',
      'occupation',
      'whereFrom',
      'citizenship',
      'nickname',
      'languagesSpoken',
    ],
  },
  {
    sectionId: 'early-life',
    chipOrder: ['placeOfBirth', 'education', 'spouse'],
  },
  {
    sectionId: 'career',
    chipOrder: [
      'notableWork',
      'award',
      'workplace',
      'fieldOfWork',
      'memberOf',
      'notableWorksList',
    ],
  },
])

const sectionHeadingValues = reactive<Record<string, Record<string, string>>>(
  Object.fromEntries(
    articleSections
      .filter((section) => section.id !== 'lead')
      .map((section) => [section.id, { title: section.label }]),
  ),
)

const sectionFragments = reactive<Record<string, FunctionGroupFragment[]>>(
  Object.fromEntries(articleBlueprint.map((section) => [section.sectionId, []])),
)

const showDialog = ref(false)
const dialogMode = ref<DialogMode>('chip')
const activeChipCard = ref<HybridCardDefinition | null>(null)
const activeSectionId = ref('')
const editingFragmentId = ref<string | null>(null)
const activeInsertIndex = ref(0)
const editingValues = ref<Record<string, string>>({})
const addSearchQuery = ref('')
const showPublishDialog = ref(false)
const publishNotice = ref('')
const suggestionsEnabled = ref(false)
const editingNewSection = ref(false)

const abstractEditorUrl = abstractArticleEditUrl()

const sectionLabelMap = computed(() =>
  Object.fromEntries(articleSections.map((section) => [section.id, section.label])),
)

function sectionTitle(sectionId: string): string {
  if (sectionId === 'lead') {
    return sectionLabelMap.value[sectionId] ?? sectionId
  }

  return sectionHeadingText(sectionId)
}

function sectionHeadingText(sectionId: string): string {
  const values = sectionHeadingValues[sectionId]
  if (!values) {
    return sectionLabelMap.value[sectionId] ?? sectionId
  }

  return sectionHeadingFunction.heading(values)
}

function sectionMenuItems() {
  return [
    { value: 'edit' as const, label: 'Edit', icon: cdxIconEdit },
    { value: 'delete' as const, label: 'Delete', icon: cdxIconTrash },
  ]
}

function cardFromId(cardId: string): HybridCardDefinition | null {
  return hybridCardCatalog.find((card) => card.id === cardId) ?? null
}

function functionGroupLayers(card: HybridCardDefinition): string[] {
  return composeFunctionLayers(card)
}

const sectionHeadingLayers = [
  `${sectionHeadingFunction.functionName} (${sectionHeadingFunction.functionZid})`,
]

const editingPreview = computed(() => {
  if (dialogMode.value === 'section-heading') {
    return sectionHeadingFunction.heading(editingValues.value)
  }

  if (!activeChipCard.value) {
    return ''
  }

  const values = Object.fromEntries(
    activeChipCard.value.fields.map((field) => [
      field.key,
      editingValues.value[field.key]?.trim() || field.placeholder,
    ]),
  )

  return activeChipCard.value.sentence(values)
})

function sectionFragmentsList(sectionId: string): FunctionGroupFragment[] {
  return sectionFragments[sectionId] ?? []
}

function fragmentText(fragment: FunctionGroupFragment): string {
  const card = cardFromId(fragment.cardId)
  if (!card) {
    return ''
  }
  return card.sentence(fragment.values)
}

function placedCardIds(sectionId: string): Set<string> {
  return new Set(sectionFragmentsList(sectionId).map((fragment) => fragment.cardId))
}

function pendingChipIds(sectionId: string, chipOrder: string[]): string[] {
  const placed = placedCardIds(sectionId)
  return chipOrder.filter((cardId) => {
    if (placed.has(cardId)) {
      return false
    }

    const card = cardFromId(cardId)
    return card && !card.addSearchOnly
  })
}

function sectionHasSavedContent(sectionId: string): boolean {
  return sectionFragmentsList(sectionId).length > 0
}

function sectionIsVisible(section: SectionPlan): boolean {
  if (sectionHasSavedContent(section.sectionId)) {
    return true
  }

  if (section.isCustom) {
    return true
  }

  return suggestionsEnabled.value
}

function slugifySectionId(title: string): string {
  const base =
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'section'

  let sectionId = base
  let suffix = 2

  while (articleBlueprint.some((section) => section.sectionId === sectionId)) {
    sectionId = `${base}-${suffix}`
    suffix += 1
  }

  return sectionId
}

function addSection(title: string) {
  const trimmedTitle = title.trim()
  const sectionId = slugifySectionId(trimmedTitle)
  const anchorIndex = activeSectionId.value
    ? articleBlueprint.findIndex((section) => section.sectionId === activeSectionId.value)
    : articleBlueprint.length - 1
  const insertIndex = anchorIndex >= 0 ? anchorIndex + 1 : articleBlueprint.length

  articleBlueprint.splice(insertIndex, 0, {
    sectionId,
    chipOrder: [],
    isCustom: true,
  })
  sectionFragments[sectionId] = []
  sectionHeadingValues[sectionId] = { title: trimmedTitle }
  activeSectionId.value = sectionId
}

const visibleSections = computed(() =>
  articleBlueprint.filter((section) => sectionIsVisible(section)),
)

const showFallbackAddSection = computed(() => visibleSections.value.length === 0)

const fallbackAddSectionId = computed(
  () => articleBlueprint[0]?.sectionId ?? 'lead',
)

function fragmentMenuItems(index: number, length: number) {
  return [
    { value: 'edit' as const, label: 'Edit', icon: cdxIconEdit },
    {
      value: 'move-up' as const,
      label: 'Move up',
      icon: cdxIconArrowUp,
      disabled: index === 0,
    },
    {
      value: 'move-down' as const,
      label: 'Move down',
      icon: cdxIconArrowDown,
      disabled: index === length - 1,
    },
    {
      value: 'insert-above' as const,
      label: 'Insert above',
      icon: cdxIconTableAddRowBefore,
    },
    {
      value: 'insert-below' as const,
      label: 'Insert below',
      icon: cdxIconTableAddRowAfter,
    },
    { value: 'delete' as const, label: 'Delete', icon: cdxIconTrash },
  ]
}

function openEditSectionDialog(sectionId: string) {
  editingNewSection.value = false
  dialogMode.value = 'section-heading'
  activeChipCard.value = null
  activeSectionId.value = sectionId
  editingFragmentId.value = null
  editingValues.value = {
    title:
      sectionHeadingValues[sectionId]?.title ??
      sectionLabelMap.value[sectionId] ??
      '',
  }
  showDialog.value = true
}

function deleteSection(sectionId: string) {
  const index = articleBlueprint.findIndex((section) => section.sectionId === sectionId)
  if (index < 0) {
    return
  }

  articleBlueprint.splice(index, 1)
  delete sectionFragments[sectionId]
  delete sectionHeadingValues[sectionId]
}

function onSectionMenuAction(sectionId: string, action: SectionMenuAction | null) {
  if (!action) {
    return
  }

  switch (action) {
    case 'edit':
      openEditSectionDialog(sectionId)
      break
    case 'delete':
      deleteSection(sectionId)
      break
  }
}

function openEditFragmentDialog(sectionId: string, fragmentId: string) {
  const fragment = sectionFragmentsList(sectionId).find((entry) => entry.id === fragmentId)
  const card = fragment ? cardFromId(fragment.cardId) : null
  if (!fragment || !card) {
    return
  }

  dialogMode.value = 'chip'
  activeChipCard.value = card
  activeSectionId.value = sectionId
  editingFragmentId.value = fragmentId
  activeInsertIndex.value = sectionFragmentsList(sectionId).findIndex((entry) => entry.id === fragmentId)
  editingValues.value = { ...fragment.values }
  showDialog.value = true
}

function openChipDialog(cardId: string, sectionId: string) {
  const card = cardFromId(cardId)
  if (!card) {
    return
  }

  dialogMode.value = 'chip'
  activeChipCard.value = card
  activeSectionId.value = sectionId
  editingFragmentId.value = null
  activeInsertIndex.value = sectionFragmentsList(sectionId).length
  editingValues.value = emptyValuesForCard(card)
  showDialog.value = true
}

function openAddSearchDialog(sectionId: string, insertIndex?: number) {
  dialogMode.value = 'add-search'
  activeChipCard.value = null
  activeSectionId.value = sectionId
  editingFragmentId.value = null
  activeInsertIndex.value = insertIndex ?? sectionFragmentsList(sectionId).length
  addSearchQuery.value = ''
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  editingFragmentId.value = null
  editingNewSection.value = false
}

function pageTitleFieldValue(field: TemplateFieldDefinition): string {
  return field.wikidataSuggestion ?? field.placeholder
}

function isPrefillField(field: TemplateFieldDefinition): boolean {
  return field.suggestionSource === 'pageTitle' || field.suggestionSource === 'default'
}

function emptyValuesForCard(card: HybridCardDefinition): Record<string, string> {
  return Object.fromEntries(
    card.fields.map((field) => [
      field.key,
      // Prefill page-title and default fields; Wikidata fields stay empty.
      isPrefillField(field) ? pageTitleFieldValue(field) : '',
    ]),
  )
}

function showFieldSuggestion(field: TemplateFieldDefinition): boolean {
  // Prefill fields open filled; only true Wikidata suggestions show Use.
  return Boolean(field.wikidataSuggestion) && !isPrefillField(field)
}

function fieldInputPlaceholder(field: TemplateFieldDefinition): string {
  // Prefill fields and Wikidata Use rows don't need ghost text.
  if (isPrefillField(field) || showFieldSuggestion(field)) {
    return ''
  }
  return field.placeholder
}

function fieldSuggestionLabel(field: TemplateFieldDefinition): string {
  return field.suggestionSource === 'pageTitle' ? 'Page title' : 'Wikidata'
}

function applyFieldSuggestion(fieldKey: string, value: string) {
  editingValues.value[fieldKey] = value
}

function moveFragment(sectionId: string, fromIndex: number, delta: number) {
  const list = sectionFragments[sectionId]
  if (!list) {
    return
  }

  const toIndex = fromIndex + delta
  if (toIndex < 0 || toIndex >= list.length) {
    return
  }

  const [item] = list.splice(fromIndex, 1)
  list.splice(toIndex, 0, item)
}

function deleteFragment(sectionId: string, index: number) {
  const list = sectionFragments[sectionId]
  if (!list) {
    return
  }

  list.splice(index, 1)
}

function onFragmentMenuAction(sectionId: string, index: number, action: FragmentMenuAction | null) {
  if (!action) {
    return
  }

  switch (action) {
    case 'edit': {
      const fragment = sectionFragmentsList(sectionId)[index]
      if (fragment) {
        openEditFragmentDialog(sectionId, fragment.id)
      }
      break
    }
    case 'move-up':
      moveFragment(sectionId, index, -1)
      break
    case 'move-down':
      moveFragment(sectionId, index, 1)
      break
    case 'insert-above':
      openAddSearchDialog(sectionId, index)
      break
    case 'insert-below':
      openAddSearchDialog(sectionId, index + 1)
      break
    case 'delete':
      deleteFragment(sectionId, index)
      break
  }
}

function upsertFragmentAtIndex(
  sectionId: string,
  fragment: FunctionGroupFragment,
  insertIndex: number,
  replaceFragmentId: string | null,
) {
  const list = [...sectionFragmentsList(sectionId)]

  if (replaceFragmentId) {
    const replaceIndex = list.findIndex((entry) => entry.id === replaceFragmentId)
    if (replaceIndex >= 0) {
      list[replaceIndex] = { ...fragment, id: replaceFragmentId }
      sectionFragments[sectionId] = list
      return
    }
  }

  const duplicateIndex = list.findIndex((entry) => entry.cardId === fragment.cardId)
  if (duplicateIndex >= 0) {
    const [existing] = list.splice(duplicateIndex, 1)
    const adjustedIndex = insertIndex > duplicateIndex ? insertIndex - 1 : insertIndex
    list.splice(adjustedIndex, 0, { ...existing, values: fragment.values })
  } else {
    list.splice(insertIndex, 0, fragment)
  }

  sectionFragments[sectionId] = list
}

function confidenceLevel(score: number): Confidence {
  return score >= 8 ? 'high' : score >= 3 ? 'medium' : 'low'
}

function scoreCardForInformation(card: HybridCardDefinition, q: string): number {
  if (!isCardAvailableInAddSearch(card, activeSectionId.value)) {
    return 0
  }

  const label = card.informationLabel.toLowerCase()
  const property = card.wikidataProperty.toLowerCase()
  let score = 0

  if (label === q) score += 10
  else if (label.startsWith(q)) score += 7
  else if (label.includes(q)) score += 5
  else if (q.includes(label)) score += 4

  if (property && property.includes(q)) score += 3

  for (const word of label.split(' ')) {
    if (word.length > 2 && q.includes(word)) score += 2
  }

  const functionName = card.functionName.toLowerCase()
  if (functionName.includes(q) || (functionName.length > 2 && q.includes(functionName))) {
    score += 6
  }

  for (const keyword of card.searchKeywords ?? []) {
    const term = keyword.toLowerCase()
    if (term === q) score += 9
    else if (term.startsWith(q) || q.startsWith(term)) score += 7
    else if (term.includes(q) || q.includes(term)) score += 5
  }

  if (card.functionZid.toLowerCase().includes(q)) {
    score += 4
  }

  return score
}

function scoreInformation(input: string): SearchResult[] {
  const q = input.trim().toLowerCase()
  if (!q) return []

  const results: SearchResult[] = []

  for (const card of hybridCardCatalog) {
    const score = scoreCardForInformation(card, q)
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

function buildPatternRegex(pattern: string): RegExp | null {
  let regexStr = ''
  let remaining = pattern

  while (remaining.includes('[')) {
    const open = remaining.indexOf('[')
    const close = remaining.indexOf(']', open)
    if (close === -1) break

    const literal = remaining.slice(0, open).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    regexStr += literal + '(.+?)'
    remaining = remaining.slice(close + 1)
  }

  regexStr += remaining.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.?'

  try {
    return new RegExp(`^${regexStr}$`, 'i')
  } catch {
    return null
  }
}

function scoreSentence(input: string): SearchResult[] {
  const q = input.trim()
  if (q.split(/\s+/).length < 3) return []

  const results: SearchResult[] = []

  for (const card of hybridCardCatalog) {
    if (!isCardAvailableInAddSearch(card, activeSectionId.value)) {
      continue
    }

    if (card.kind === 'paragraph' || card.kind === 'section-heading') {
      continue
    }

    const regex = buildPatternRegex(card.pattern)
    if (!regex) continue

    const match = q.match(regex)
    if (!match) continue

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

function confidenceOrder(c: Confidence): number {
  return c === 'high' ? 3 : c === 'medium' ? 2 : 1
}

function matchTypeOrder(m: MatchType): number {
  return m === 'both' ? 3 : m === 'sentence' ? 2 : 1
}

const addSearchResults = computed<SearchResult[]>(() => {
  const q = addSearchQuery.value.trim()
  if (q.length < 2) {
    return []
  }

  const merged = new Map<string, SearchResult>(
    scoreInformation(q).map((r) => [r.cardId, r]),
  )

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

const addSearchNoResults = computed(
  () => addSearchQuery.value.trim().length > 1 && addSearchResults.value.length === 0,
)

function selectAddSearchResult(result: SearchResult) {
  if (result.card.kind === 'section-heading') {
    editingNewSection.value = true
    dialogMode.value = 'section-heading'
    activeChipCard.value = null
    editingFragmentId.value = null
    editingValues.value = { title: '' }
    return
  }

  dialogMode.value = 'chip'
  activeChipCard.value = result.card
  editingValues.value = Object.fromEntries(
    result.card.fields.map((field) => [
      field.key,
      result.prefill?.[field.key] ??
        (isPrefillField(field) ? pageTitleFieldValue(field) : ''),
    ]),
  )
}

const canSaveDialog = computed(() => {
  if (dialogMode.value === 'add-search') {
    return false
  }

  if (dialogMode.value === 'section-heading') {
    return Boolean(editingValues.value.title?.trim())
  }

  if (!activeChipCard.value) {
    return false
  }

  return activeChipCard.value.fields.every((field) => editingValues.value[field.key]?.trim())
})

const primaryDialogAction = computed(() =>
  dialogMode.value === 'add-search'
    ? undefined
    : {
        label:
          dialogMode.value === 'section-heading'
            ? editingNewSection.value
              ? 'Add section'
              : 'Save section'
            : 'Add sentence',
        actionType: 'progressive' as const,
        disabled: !canSaveDialog.value,
      },
)

function saveDialog() {
  if (!canSaveDialog.value) {
    return
  }

  if (dialogMode.value === 'section-heading') {
    const title = editingValues.value.title.trim()

    if (editingNewSection.value) {
      addSection(title)
    } else {
      sectionHeadingValues[activeSectionId.value] = { title }
    }

    closeDialog()
    return
  }

  if (!activeChipCard.value) {
    return
  }

  const fragment: FunctionGroupFragment = {
    id: editingFragmentId.value ?? `frag-${Date.now()}`,
    cardId: activeChipCard.value.id,
    values: Object.fromEntries(
      activeChipCard.value.fields.map((field) => [
        field.key,
        editingValues.value[field.key].trim(),
      ]),
    ),
  }

  upsertFragmentAtIndex(
    activeSectionId.value,
    fragment,
    activeInsertIndex.value,
    editingFragmentId.value,
  )

  closeDialog()
}

const savedFunctionGroupCount = computed(() =>
  articleBlueprint.reduce(
    (count, section) => count + sectionFragmentsList(section.sectionId).length,
    0,
  ),
)

const pendingFunctionGroupCount = computed(() =>
  articleBlueprint.reduce(
    (count, section) => count + pendingChipIds(section.sectionId, section.chipOrder).length,
    0,
  ),
)

const canPublish = computed(() => savedFunctionGroupCount.value > 0)

function openPublishDialog() {
  publishNotice.value = ''
  showPublishDialog.value = true
}

function confirmPublish() {
  publishNotice.value = `Published ${savedFunctionGroupCount.value} function group${
    savedFunctionGroupCount.value === 1 ? '' : 's'
  } to the abstract article.`
  showPublishDialog.value = false
}
</script>

<template>
  <ChromeWrapper :last-edited-notice="false" username="Username1982">
    <main class="one-column-page">
      <ArticleCustom
        title="Steve_Wozniak"
        header="Steve Wozniak"
        :languages-count="42"
        active-action="edit"
      >
        <template #edit-toolbar>
          <AbstractEditToolbar
            v-model:suggestions-enabled="suggestionsEnabled"
            :can-publish="canPublish"
            :abstract-editor-url="abstractEditorUrl"
            @publish="openPublishDialog"
          />
        </template>

        <CdxMessage v-if="publishNotice" type="success">
          {{ publishNotice }}
        </CdxMessage>

        <section
          v-for="section in visibleSections"
          :key="section.sectionId"
          :class="{ 'hand-authored-lead': section.sectionId === 'lead' }"
        >
          <h2 v-if="section.sectionId !== 'lead'" class="section-heading">
            <span class="info-sentence-group info-sentence-group--heading">
              <button
                type="button"
                class="info-sentence section-heading-button"
                :title="`Edit section function: ${sectionHeadingFunction.pattern}`"
                @click="openEditSectionDialog(section.sectionId)"
              >
                {{ sectionHeadingText(section.sectionId) }}
              </button>
              <span class="prose-sentence-menu-wrap">
                <SentenceActionMenu
                  :menu-items="sectionMenuItems()"
                  aria-label="Section actions"
                  @select="onSectionMenuAction(section.sectionId, $event as SectionMenuAction)"
                />
              </span>
            </span>
          </h2>

          <p
            v-if="sectionFragmentsList(section.sectionId).length"
            class="section-prose"
          >
            <span
              v-for="(fragment, index) in sectionFragmentsList(section.sectionId)"
              :key="fragment.id"
              class="prose-sentence-row"
            >
              <span class="info-sentence-group">
                <button
                  type="button"
                  class="info-sentence"
                  :title="`Edit function group: ${cardFromId(fragment.cardId)?.pattern ?? ''}`"
                  @click="openEditFragmentDialog(section.sectionId, fragment.id)"
                >
                  {{ fragmentText(fragment) }}
                </button>
                <span class="prose-sentence-menu-wrap">
                  <SentenceActionMenu
                    :menu-items="fragmentMenuItems(index, sectionFragmentsList(section.sectionId).length)"
                    aria-label="Sentence actions"
                    @select="onFragmentMenuAction(section.sectionId, index, $event as FragmentMenuAction)"
                  />
                </span>
              </span>
            </span>
          </p>

          <div class="chip-row" role="group" :aria-label="`${sectionTitle(section.sectionId)} actions`">
            <template v-if="suggestionsEnabled">
              <button
                v-for="cardId in pendingChipIds(section.sectionId, section.chipOrder)"
                :key="cardId"
                type="button"
                class="info-chip"
                :title="`Function group: ${cardFromId(cardId)?.pattern ?? cardId}`"
                @click="openChipDialog(cardId, section.sectionId)"
              >
                <strong>{{ cardFromId(cardId)?.informationLabel ?? cardId }}</strong>
              </button>
            </template>

            <CdxButton
              class="add-sentence"
              weight="quiet"
              @click="openAddSearchDialog(section.sectionId)"
            >
              <CdxIcon :icon="cdxIconAdd" size="small" />
              Add
            </CdxButton>
          </div>
        </section>

        <section
          v-if="showFallbackAddSection"
          class="hand-authored-lead fallback-add-section"
        >
          <div class="chip-row" role="group" aria-label="Add">
            <CdxButton
              class="add-sentence"
              weight="quiet"
              @click="openAddSearchDialog(fallbackAddSectionId)"
            >
              <CdxIcon :icon="cdxIconAdd" size="small" />
              Add
            </CdxButton>
          </div>
        </section>
      </ArticleCustom>
    </main>

    <CdxDialog
      v-model:open="showDialog"
      :title="
        dialogMode === 'add-search'
          ? 'Add information'
          : dialogMode === 'section-heading'
            ? editingNewSection
              ? 'New section'
              : `Section heading · ${sectionTitle(activeSectionId)}`
            : `${activeChipCard?.informationLabel ?? 'Function group'}`
      "
      close-button-label="Close"
      :dismissable="true"
      :primary-action="primaryDialogAction"
      @primary="saveDialog"
    >
      <template v-if="dialogMode === 'add-search'">
        <CdxField>
          <template #label>What information would you like to add?</template>
          <CdxTextInput
            v-model="addSearchQuery"
          />
        </CdxField>

        <div v-if="addSearchResults.length" class="search-results">
          <button
            v-for="result in addSearchResults"
            :key="result.cardId"
            type="button"
            class="search-result"
            @click="selectAddSearchResult(result)"
          >
            <strong>{{ result.card.informationLabel }}</strong>
            <span>{{ result.card.helper }}</span>
            <small>Example: {{ result.card.sentence(exampleValuesForCard(result.card)) }}</small>
          </button>
        </div>

        <p v-if="addSearchNoResults" class="search-empty">
          No matching information found. Try another word or a short sentence.
        </p>
      </template>

      <template v-else-if="dialogMode === 'section-heading'">
        <p class="function-group-intro">
          Section headings are <strong>function groups</strong> too: a Wikifunction compiles the
          title into an HTML heading for this part of the article.
        </p>
        <p class="pattern-chip">{{ sectionHeadingFunction.pattern }}</p>
        <p class="function-group-helper">{{ sectionHeadingFunction.helper }}</p>

        <div class="field-list">
          <div
            v-for="field in sectionHeadingFunction.fields"
            :key="field.key"
            class="field-list__item"
          >
            <CdxField>
              <template #label>{{ field.label }}</template>
              <CdxTextInput
                v-model="editingValues[field.key]"
                :placeholder="field.placeholder"
              />
            </CdxField>
          </div>
        </div>

        <p v-if="editingPreview" class="sentence-preview">
          Preview: {{ editingPreview }}
        </p>
      </template>

      <template v-else-if="activeChipCard">

        <div class="field-list">
          <div
            v-for="field in activeChipCard.fields"
            :key="field.key"
            class="field-list__item"
          >
            <CdxField>
              <template #label>{{ field.label }}</template>
              <CdxTextInput
                v-model="editingValues[field.key]"
                :placeholder="fieldInputPlaceholder(field)"
              />
            </CdxField>
            <p v-if="showFieldSuggestion(field)" class="field-suggestion">
              {{ fieldSuggestionLabel(field) }}:
              <strong>{{ field.wikidataSuggestion }}</strong>
              <CdxButton
                weight="quiet"
                @click="applyFieldSuggestion(field.key, field.wikidataSuggestion || '')"
              >
                Use
              </CdxButton>
            </p>
          </div>
        </div>

        <p v-if="editingPreview" class="sentence-preview">
          Preview: {{ editingPreview }}
        </p>
      </template>
    </CdxDialog>

    <CdxDialog
      v-model:open="showPublishDialog"
      title="Save your changes"
      close-button-label="Close"
      :dismissable="true"
      :primary-action="{
        label: 'Publish changes',
        actionType: 'progressive',
      }"
      @primary="confirmPublish"
    >
      <p>
        Publishing saves your function groups as abstract article fragments. Readers will see the
        generated prose on the Read tab after publish.
      </p>
      <p>
        <strong>{{ savedFunctionGroupCount }}</strong>
        function group{{ savedFunctionGroupCount === 1 ? '' : 's' }} ready to publish.
      </p>
      <p v-if="pendingFunctionGroupCount > 0" class="publish-warning">
        {{ pendingFunctionGroupCount }} suggested function group{{
          pendingFunctionGroupCount === 1 ? ''
          : 's'
        }}
        in this draft are still empty. You can publish now and finish them later.
      </p>
    </CdxDialog>
  </ChromeWrapper>
</template>

<style scoped>
.one-column-page {
  padding: 0 var(--spacing-100);
}

.publish-warning {
  margin: var(--spacing-100) 0 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.section-prose {
  margin: 0 0 var(--spacing-100);
  line-height: var(--line-height-large);
}

.section-heading {
  margin: var(--spacing-150) 0 var(--spacing-75);
}

.section-heading-button {
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
}

.info-sentence-group--heading {
  display: inline;
}

.prose-sentence-row {
  display: inline;
  white-space: normal;
}

.prose-sentence-row:not(:last-child)::after {
  content: ' ';
  white-space: pre;
}

.info-sentence-group {
  display: inline;
  border-radius: var(--border-radius-base);
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

.info-sentence-group:hover,
.info-sentence-group:focus-within {
  background-color: var(--background-color-progressive-subtle);
}

.prose-sentence-menu-wrap {
  display: inline-flex;
  align-items: center;
  width: 1.75rem;
  overflow: visible;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  vertical-align: baseline;
  transition: opacity var(--transition-duration-base, 100ms);
}

.info-sentence-group:hover .prose-sentence-menu-wrap,
.info-sentence-group:focus-within .prose-sentence-menu-wrap {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  margin-inline-start: var(--spacing-25);
}

@media (hover: none) {
  .prose-sentence-menu-wrap {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }
}

.prose-sentence-menu-wrap :deep(.sentence-action-menu) {
  position: relative;
  z-index: 2;
}

.prose-sentence-menu-wrap :deep(.cdx-menu-button__menu-wrapper) {
  overflow: visible;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-50);
  align-items: center;
  margin: 0 0 var(--spacing-100);
}

.info-chip {
  display: inline-flex;
  flex-direction: column;
  gap: var(--spacing-25);
  border: 1px solid var(--border-color-subtle);
  border-radius: var(--border-radius-pill);
  background-color: var(--background-color-neutral-subtle);
  padding: var(--spacing-50) var(--spacing-100);
  text-align: left;
  cursor: pointer;
}

.info-chip:hover {
  background-color: var(--background-color-interactive);
}

.info-chip--completed {
  border-color: var(--border-color-progressive);
  background-color: var(--background-color-progressive-subtle);
}

.info-chip strong {
  font-size: var(--font-size-small);
}

.info-sentence {
  display: inline;
  border: none;
  border-radius: var(--border-radius-base);
  background-color: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0;
  margin: 0;
  font: inherit;
  line-height: inherit;
  text-align: start;
  vertical-align: baseline;
}

.info-sentence:hover {
  background-color: transparent;
}

.add-sentence.cdx-button {
  gap: var(--spacing-35);
  color: var(--color-progressive);
  font-weight: var(--font-weight-bold);
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75);
}

.field-list__item {
  border: 1px solid var(--border-color-subtle);
  background-color: var(--background-color-neutral-subtle);
  padding: var(--spacing-75);
}

.field-suggestion {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
  margin-top: var(--spacing-100);
}

.search-result {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-25);
  border: 1px solid var(--border-color-subtle);
  background-color: var(--background-color-neutral-subtle);
  border-radius: var(--border-radius-base);
  padding: var(--spacing-75);
  text-align: left;
  cursor: pointer;
}

.search-result:hover {
  background-color: var(--background-color-interactive);
}

.search-result span,
.search-result small,
.search-empty {
  color: var(--color-subtle);
}

.function-group-intro,
.function-group-helper {
  margin: 0 0 var(--spacing-75);
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.pattern-chip {
  display: inline-block;
  margin: 0 0 var(--spacing-50);
  padding: var(--spacing-25) var(--spacing-50);
  border-radius: var(--border-radius-base);
  background-color: var(--background-color-progressive-subtle);
  color: var(--color-progressive);
  font-family: var(--font-family-monospace, monospace);
  font-size: var(--font-size-small);
}

.function-group-structure {
  margin-bottom: var(--spacing-100);
  border: 1px solid var(--border-color-subtle);
  border-radius: var(--border-radius-base);
  padding: var(--spacing-75);
  background-color: var(--background-color-neutral-subtle);
}

.function-group-structure summary {
  cursor: pointer;
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
}

.function-group-structure__layers {
  margin: var(--spacing-75) 0;
  padding-left: var(--spacing-125);
  font-size: var(--font-size-small);
}

.function-group-structure__tree {
  overflow: auto;
  max-height: 200px;
  margin: 0;
  padding: var(--spacing-75);
  background-color: var(--background-color-base);
  font-size: var(--font-size-x-small);
  white-space: pre-wrap;
}

.sentence-preview {
  margin: var(--spacing-100) 0 0;
  padding: var(--spacing-75);
  border-left: 4px solid var(--border-color-progressive);
  background-color: var(--background-color-progressive-subtle);
}
</style>
