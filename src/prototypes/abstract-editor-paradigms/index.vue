<script setup lang="ts">
import { computed, provide, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  CdxButton,
  CdxField,
  CdxMessage,
  CdxSelect,
  CdxTextInput,
} from '@wikimedia/codex'

import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import SpecialPageWrapper from '@/components/SpecialPageWrapper.vue'

import CitationEditorPanel from './CitationEditorPanel.vue'
import HybridEditorPanel from './HybridEditorPanel.vue'
import PuzzleBlockNode from './PuzzleBlockNode.vue'
import {
  articleSections,
  articleSubject,
  citationFields,
  citationKey,
  createDefaultWebCitation,
  formatCitationForStructure,
  formatWebCitationReference,
  getHybridCard,
  hybridFragmentSentence,
  informationTypes,
  previewLanguages,
  sentenceTemplateCatalog,
  type FactDefinition,
  type FragmentCardDefinition,
  type HybridFragment,
  type PreviewLanguage,
  type TemplateDefinition,
  type TemplateFieldDefinition,
  type WebCitation,
} from './mock-registry'
import type {
  ActivePuzzleBlock,
  PuzzleBlockTemplate,
  PuzzleDragPayload,
  PuzzleValueBlock,
} from './puzzle-types'
import {
  createEmptyPuzzleBlock,
  isBlockComplete,
  resolveBlockOutput,
  serializeBlockStructure,
} from './puzzle-types'
import { extendedFragmentCatalog, getFragmentCardById } from './shared-fragment-catalog'

interface CitationHost {
  citation: WebCitation | null
  citationExpanded?: boolean
}

definePage({
  meta: {
    title: 'Abstract editor paradigms',
    description:
      'Hybrid abstract editor plus comparison prototypes for information-first, fragment cards, sentence templates, and more.',
  },
})

type ParadigmId =
  | 'hybrid'
  | 'information'
  | 'fragments'
  | 'sentence-templates'
  | 'typewriter'
  | 'puzzle'

type PreviewRevealMode = 'article' | 'structure' | 'function'

interface ActiveFact extends FactDefinition {
  subject: string
  value: string
  citation: WebCitation | null
  citationExpanded?: boolean
}

interface ActiveFragmentCard {
  id: string
  cardId: string
  values: Record<string, string>
  citation: WebCitation | null
  citationExpanded?: boolean
}

interface ActiveSentenceTemplate {
  id: string
  templateId: string
  values: Record<string, string>
  citation: WebCitation | null
  citationExpanded?: boolean
}

interface PreviewLine {
  text: string
  citation: WebCitation | null
}

interface NumberedPreviewLine extends PreviewLine {
  citationNumber: number | null
}

interface TypewriterMatch {
  id: string
  label: string
  sentence: string
  functionName: string
  confidence: string
}

interface ConfirmedTypewriterSentence extends TypewriterMatch {
  inputText: string
  citation: WebCitation | null
  citationExpanded?: boolean
}

const paradigms: { id: ParadigmId; label: string; shortLabel: string; paradigmNumber: string }[] = [
  { id: 'hybrid', label: 'Hybrid editor (recommended)', shortLabel: 'Hybrid · Recommended', paradigmNumber: '§10' },
  { id: 'information', label: 'Information-first editor', shortLabel: 'P1 · Information', paradigmNumber: '1' },
  {
    id: 'fragments',
    label: 'Fragment card composer',
    shortLabel: 'P9 · Fragment cards',
    paradigmNumber: '9',
  },
  {
    id: 'sentence-templates',
    label: 'Sentence template forms',
    shortLabel: 'P3 · Sentence templates',
    paradigmNumber: '3',
  },
  { id: 'typewriter', label: 'Magic typewriter', shortLabel: 'P4 · Typewriter', paradigmNumber: '4' },
  { id: 'puzzle', label: 'Visual puzzle', shortLabel: 'P5 · Visual puzzle', paradigmNumber: '5' },
]

const route = useRoute()
const router = useRouter()

const paradigmQueryAliases: Record<string, ParadigmId> = {
  hybrid: 'hybrid',
  recommended: 'hybrid',
  information: 'information',
  fragments: 'fragments',
  cards: 'fragments',
  'sentence-templates': 'sentence-templates',
  typewriter: 'typewriter',
  puzzle: 'puzzle',
}

function paradigmFromQuery(): ParadigmId | null {
  const raw = route.query.variant
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value || typeof value !== 'string') {
    return null
  }

  if (
    value === 'fragment-editor' ||
    value === 'fragment' ||
    value === 'fragment-editor-comparison'
  ) {
    router.replace({ path: '/improved-fragment-editor' })
    return null
  }

  return paradigmQueryAliases[value] ?? null
}

const selectedParadigm = ref<ParadigmId>(paradigmFromQuery() ?? 'hybrid')

watch(selectedParadigm, (paradigmId) => {
  if (paradigmFromQuery() === paradigmId) {
    return
  }

  router.replace({ query: { ...route.query, variant: paradigmId } })
})

watch(
  () => route.query.variant,
  () => {
    const fromQuery = paradigmFromQuery()
    if (fromQuery && fromQuery !== selectedParadigm.value) {
      selectedParadigm.value = fromQuery
    }
  },
)
const showStructure = ref(false)
const previewRevealMode = ref<PreviewRevealMode>('article')
const previewLanguage = ref<PreviewLanguage>('en')

const subject = articleSubject

const hybridFragments = reactive<HybridFragment[]>([])

const activeFacts = reactive<ActiveFact[]>([])
const informationPickerOpen = ref(false)
const composingFact = ref<FactDefinition | null>(null)
const composingSubject = ref(subject)
const composingValue = ref('')

function openInformationPicker() {
  informationPickerOpen.value = true
  composingFact.value = null
  composingValue.value = ''
}

function cancelInformationFlow() {
  informationPickerOpen.value = false
  composingFact.value = null
  composingValue.value = ''
}

function selectInformationType(fact: FactDefinition) {
  composingFact.value = fact
  composingSubject.value = subject
  composingValue.value = ''
  informationPickerOpen.value = false
}

function useWikidataSuggestion() {
  if (composingFact.value) {
    composingValue.value = composingFact.value.wikidataSuggestion
  }
}

function saveComposedFact() {
  if (!composingFact.value || !composingValue.value.trim()) {
    return
  }

  if (activeFacts.some((item) => item.id === composingFact.value?.id)) {
    const existing = activeFacts.find((item) => item.id === composingFact.value?.id)
    if (existing) {
      existing.subject = composingSubject.value
      existing.value = composingValue.value.trim()
    }
  } else {
    activeFacts.push({
      ...composingFact.value,
      subject: composingSubject.value,
      value: composingValue.value.trim(),
      citation: null,
    })
  }

  composingFact.value = null
  composingValue.value = ''
}

function attachCitation(item: CitationHost) {
  if (!item.citation) {
    item.citation = createDefaultWebCitation()
    item.citationExpanded = true
  } else if (item.citationExpanded === false) {
    item.citationExpanded = true
  }
}

function removeCitation(item: CitationHost) {
  item.citation = null
  item.citationExpanded = undefined
}

const composingPreview = computed(() => {
  if (!composingFact.value || !composingValue.value.trim()) {
    return ''
  }

  return composingFact.value.sentence(composingSubject.value, composingValue.value.trim())
})

function removeFact(id: string) {
  const index = activeFacts.findIndex((fact) => fact.id === id)
  if (index !== -1) {
    activeFacts.splice(index, 1)
  }
}

const sentenceTemplates = reactive<ActiveSentenceTemplate[]>([])
const sentencePickerOpen = ref(false)
const sentenceSearchQuery = ref('')
const composingSentenceTemplate = ref<TemplateDefinition | null>(null)
const composingSentenceValues = ref<Record<string, string>>({})

const fragmentCards = reactive<ActiveFragmentCard[]>([])

function getFragmentCard(cardId: string) {
  return getFragmentCardById(cardId)
}

function getSentenceTemplate(templateId: string) {
  return sentenceTemplateCatalog.find((template) => template.id === templateId) ?? null
}

function fragmentCardSentence(card: ActiveFragmentCard) {
  const definition = getFragmentCard(card.cardId)
  if (!definition) {
    return ''
  }

  return definition.sentence(card.values)
}

function sentenceTemplateOutput(entry: ActiveSentenceTemplate) {
  const template = getSentenceTemplate(entry.templateId)
  if (!template) {
    return ''
  }

  return template.sentence(entry.values)
}

function defaultValuesForTemplate(template: TemplateDefinition) {
  return Object.fromEntries(
    template.fields.map((field) => [field.key, field.key === 'entity' ? subject : '']),
  )
}

function openSentencePicker() {
  sentencePickerOpen.value = true
  sentenceSearchQuery.value = ''
  composingSentenceTemplate.value = null
  composingSentenceValues.value = {}
}

function cancelSentenceFlow() {
  sentencePickerOpen.value = false
  composingSentenceTemplate.value = null
  composingSentenceValues.value = {}
  sentenceSearchQuery.value = ''
}

function startComposingSentenceTemplate(template: TemplateDefinition) {
  composingSentenceTemplate.value = template
  composingSentenceValues.value = defaultValuesForTemplate(template)
}

function addFragmentCard(card: FragmentCardDefinition) {
  fragmentCards.push({
    id: `p9-${Date.now()}`,
    cardId: card.id,
    values: Object.fromEntries(card.fields.map((field) => [field.key, field.defaultValue])),
    citation: null,
  })
}

function removeFragmentCard(cardId: string) {
  const index = fragmentCards.findIndex((card) => card.id === cardId)
  if (index !== -1) {
    fragmentCards.splice(index, 1)
  }
}

function useSentenceFieldWikidataSuggestion(field: TemplateFieldDefinition) {
  if (field.wikidataSuggestion) {
    composingSentenceValues.value[field.key] = field.wikidataSuggestion
  }
}

const composingSentencePreview = computed(() => {
  if (!composingSentenceTemplate.value) {
    return ''
  }

  const values = Object.fromEntries(
    composingSentenceTemplate.value.fields.map((field) => [
      field.key,
      composingSentenceValues.value[field.key]?.trim() || field.placeholder,
    ]),
  )

  return composingSentenceTemplate.value.sentence(values)
})

const canSaveComposingSentence = computed(() => {
  if (!composingSentenceTemplate.value) {
    return false
  }

  return composingSentenceTemplate.value.fields.every((field) =>
    composingSentenceValues.value[field.key]?.trim(),
  )
})

function saveComposingSentence() {
  if (!composingSentenceTemplate.value || !canSaveComposingSentence.value) {
    return
  }

  sentenceTemplates.push({
    id: `p3-${Date.now()}`,
    templateId: composingSentenceTemplate.value.id,
    values: Object.fromEntries(
      composingSentenceTemplate.value.fields.map((field) => [
        field.key,
        composingSentenceValues.value[field.key].trim(),
      ]),
    ),
    citation: null,
  })

  cancelSentenceFlow()
}

function removeSentenceTemplate(entryId: string) {
  const index = sentenceTemplates.findIndex((entry) => entry.id === entryId)
  if (index !== -1) {
    sentenceTemplates.splice(index, 1)
  }
}

function sectionLabelForTemplate(template: TemplateDefinition) {
  return articleSections.find((section) => section.id === template.sectionId)?.label ?? ''
}

const filteredSentenceTemplates = computed(() => {
  const query = sentenceSearchQuery.value.trim().toLowerCase()

  return sentenceTemplateCatalog.filter((template) => {
    if (!query) {
      return true
    }

    const haystack = [
      template.label,
      template.pattern,
      template.helper,
      ...template.searchKeywords,
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
})

const draftSentence = ref('')
const pendingMatch = ref<TypewriterMatch | null>(null)
const typewriterWarning = ref('')
const confirmedTypewriterSentences = reactive<ConfirmedTypewriterSentence[]>([])

function sentenceCount(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) {
    return 0
  }

  const endings = trimmed.match(/[.!?]+(\s|$)/g)
  return endings ? endings.length : 1
}

function analyzeDraftSentence() {
  pendingMatch.value = null
  typewriterWarning.value = ''

  const text = draftSentence.value.trim()
  if (!text) {
    typewriterWarning.value = 'Enter one sentence to analyze.'
    return
  }

  if (text.includes('\n') || sentenceCount(text) > 1) {
    typewriterWarning.value =
      'Enter one sentence at a time. Add each sentence separately, then confirm it before writing the next one.'
    return
  }

  const lower = text.toLowerCase()

  if (text.includes(',') || text.includes(' who ')) {
    typewriterWarning.value =
      'This sentence contains a clause that may require nested functions. Try a simpler sentence, or confirm only if the match below looks correct.'
  }

  if (lower.includes('software engineer') || (lower.includes('engineer') && !lower.includes('born'))) {
    pendingMatch.value = {
      id: `tw-${Date.now()}`,
      label: 'Detected occupation sentence',
      sentence: text.endsWith('.') ? text : `${text}.`,
      functionName: 'Article-less instantiating fragment',
      confidence: 'High',
    }
    return
  }

  if (lower.includes('born')) {
    pendingMatch.value = {
      id: `tw-${Date.now()}`,
      label: 'Detected birth-date sentence',
      sentence: text.endsWith('.') ? text : `${text}.`,
      functionName: 'Date-of-birth statement',
      confidence: 'Medium',
    }
    return
  }

  if (lower.includes('apple') || lower.includes('co-founder')) {
    pendingMatch.value = {
      id: `tw-${Date.now()}`,
      label: 'Detected organization relationship',
      sentence: text.endsWith('.') ? text : `${text}.`,
      functionName: 'Defining role sentence',
      confidence: 'Medium',
    }
    return
  }

  if (!typewriterWarning.value) {
    typewriterWarning.value =
      'No matching abstract sentence pattern was found. Try a simpler factual sentence such as "Steve Wozniak is a software engineer."'
  }
}

function confirmPendingMatch() {
  if (!pendingMatch.value) {
    return
  }

  confirmedTypewriterSentences.push({
    ...pendingMatch.value,
    inputText: draftSentence.value.trim(),
    citation: null,
  })

  draftSentence.value = ''
  pendingMatch.value = null
  typewriterWarning.value = ''
}

function rejectPendingMatch() {
  pendingMatch.value = null
}

function removeConfirmedSentence(id: string) {
  const index = confirmedTypewriterSentences.findIndex((sentence) => sentence.id === id)
  if (index !== -1) {
    confirmedTypewriterSentences.splice(index, 1)
  }
}

// --- Paradigm 5: Visual Puzzle (nested function blocks) ---

const puzzleValueBlocks: PuzzleValueBlock[] = [
  { id: 'v-entity-woz', label: 'Steve Wozniak', type: 'Entity' },
  { id: 'v-class-se', label: 'software engineer', type: 'Class' },
  { id: 'v-date-full', label: 'August 11, 1950', type: 'Date' },
  { id: 'v-work-apple', label: 'Apple', type: 'Work' },
  { id: 'v-place-sj', label: 'San Jose, California', type: 'Place' },
  { id: 'v-text-aug', label: 'August', type: 'Text' },
  { id: 'v-text-11', label: '11', type: 'Text' },
  { id: 'v-text-1950', label: '1950', type: 'Text' },
  { id: 'v-text-steve', label: 'Steve', type: 'Text' },
  { id: 'v-text-woz', label: 'Wozniak', type: 'Text' },
]

const puzzleBlockTemplates: PuzzleBlockTemplate[] = [
  {
    id: 'html-wrapper',
    label: 'string to HTML fragment',
    functionName: 'Z813',
    outputType: 'HtmlFragment',
    rootCapable: true,
    nestable: false,
    slots: [{ key: 'inner', expectedType: 'HtmlFragment', label: 'Inner fragment' }],
    resolve: (values) => values.inner,
  },
  {
    id: 'instantiating-fragment',
    label: 'Article-less instantiating fragment',
    functionName: 'Z10031',
    outputType: 'HtmlFragment',
    rootCapable: false,
    nestable: true,
    slots: [
      { key: 'entity', expectedType: 'Entity', label: 'Entity' },
      { key: 'class', expectedType: 'Class', label: 'Class' },
    ],
    resolve: (values) => `${values.entity} is a ${values.class}.`,
  },
  {
    id: 'dob-statement',
    label: 'Date-of-birth statement',
    functionName: 'Date-of-birth statement',
    outputType: 'HtmlFragment',
    rootCapable: true,
    nestable: true,
    slots: [
      { key: 'entity', expectedType: 'Entity', label: 'Entity' },
      { key: 'date', expectedType: 'Date', label: 'Date' },
    ],
    resolve: (values) => `${values.entity} was born on ${values.date}.`,
  },
  {
    id: 'notable-work',
    label: 'Defining role sentence',
    functionName: 'Defining role sentence',
    outputType: 'HtmlFragment',
    rootCapable: true,
    nestable: true,
    slots: [
      { key: 'entity', expectedType: 'Entity', label: 'Entity' },
      { key: 'work', expectedType: 'Work', label: 'Work' },
    ],
    resolve: (values) => `${values.entity} is a co-founder of ${values.work}.`,
  },
  {
    id: 'entity-from-label',
    label: 'Entity from label',
    functionName: 'Entity resolver',
    outputType: 'Entity',
    rootCapable: false,
    nestable: true,
    slots: [{ key: 'label', expectedType: 'Text', label: 'Label' }],
    resolve: (values) => values.label,
  },
  {
    id: 'date-builder',
    label: 'Format date',
    functionName: 'Date formatter',
    outputType: 'Date',
    rootCapable: false,
    nestable: true,
    slots: [
      { key: 'month', expectedType: 'Text', label: 'Month' },
      { key: 'day', expectedType: 'Text', label: 'Day' },
      { key: 'year', expectedType: 'Text', label: 'Year' },
    ],
    resolve: (values) => `${values.month} ${values.day}, ${values.year}`,
  },
  {
    id: 'join-text',
    label: 'Join text',
    functionName: 'Text join',
    outputType: 'Text',
    rootCapable: false,
    nestable: true,
    slots: [
      { key: 'left', expectedType: 'Text', label: 'Left' },
      { key: 'right', expectedType: 'Text', label: 'Right' },
    ],
    resolve: (values) => `${values.left} ${values.right}`.trim(),
  },
  {
    id: 'quote-text',
    label: 'Quote text',
    functionName: 'Text quoter',
    outputType: 'Text',
    rootCapable: false,
    nestable: true,
    slots: [{ key: 'inner', expectedType: 'Text', label: 'Inner text' }],
    resolve: (values) => `"${values.inner}"`,
  },
  {
    id: 'class-from-label',
    label: 'Class from label',
    functionName: 'Class resolver',
    outputType: 'Class',
    rootCapable: false,
    nestable: true,
    slots: [{ key: 'label', expectedType: 'Text', label: 'Label' }],
    resolve: (values) => values.label,
  },
]

const puzzleRootTemplates = computed(() =>
  puzzleBlockTemplates.filter((template) => template.rootCapable),
)

const puzzleNestableTemplates = computed(() =>
  puzzleBlockTemplates.filter((template) => template.nestable),
)

const activePuzzleRoots = reactive<ActivePuzzleBlock[]>([])
const puzzleDragPayload = ref<PuzzleDragPayload | null>(null)

function getPuzzleTemplate(id: string): PuzzleBlockTemplate | undefined {
  return puzzleBlockTemplates.find((template) => template.id === id)
}

function addPuzzleRoot(template: PuzzleBlockTemplate) {
  activePuzzleRoots.push(createEmptyPuzzleBlock(template.id))
}

function removePuzzleRoot(id: string) {
  const index = activePuzzleRoots.findIndex((block) => block.id === id)
  if (index !== -1) {
    activePuzzleRoots.splice(index, 1)
  }
}

function startPuzzleDragLiteral(event: DragEvent, value: PuzzleValueBlock) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('text/plain', value.id)
  }
  puzzleDragPayload.value = { kind: 'literal', value }
}

function startPuzzleDragTemplate(event: DragEvent, template: PuzzleBlockTemplate) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('text/plain', template.id)
  }
  puzzleDragPayload.value = { kind: 'template', template }
}

function endPuzzleDrag() {
  puzzleDragPayload.value = null
}

function canDropOnPuzzleSlot(expectedType: PuzzleBlockTemplate['outputType']): boolean {
  const payload = puzzleDragPayload.value
  if (!payload) {
    return false
  }

  if (payload.kind === 'literal') {
    return payload.value.type === expectedType
  }

  return payload.template.outputType === expectedType
}

function dropOnPuzzleSlot(
  block: ActivePuzzleBlock,
  slotKey: string,
  expectedType: PuzzleBlockTemplate['outputType'],
) {
  const payload = puzzleDragPayload.value
  if (!payload || !canDropOnPuzzleSlot(expectedType)) {
    return
  }

  if (payload.kind === 'literal') {
    block.filledSlots[slotKey] = { kind: 'literal', value: payload.value }
  } else {
    block.filledSlots[slotKey] = {
      kind: 'block',
      block: createEmptyPuzzleBlock(payload.template.id),
    }
  }

  puzzleDragPayload.value = null
}

function removePuzzleSlotContent(block: ActivePuzzleBlock, slotKey: string) {
  delete block.filledSlots[slotKey]
}

provide('puzzleContext', {
  getTemplate: getPuzzleTemplate,
  dragPayload: puzzleDragPayload,
  canDropOnSlot: canDropOnPuzzleSlot,
  dropOnSlot: dropOnPuzzleSlot,
  removeSlotContent: removePuzzleSlotContent,
  citationFields,
  attachCitation,
  removeCitation,
})

const previewLanguageOptions = previewLanguages.map((lang) => ({
  label: lang.label,
  value: lang.code,
}))

const activePreviewLanguage = computed(() =>
  previewLanguages.find((lang) => lang.code === previewLanguage.value),
)

function cyclePreviewRevealMode() {
  if (selectedParadigm.value === 'hybrid') {
    const order: PreviewRevealMode[] = ['article', 'structure', 'function']
    const index = order.indexOf(previewRevealMode.value)
    previewRevealMode.value = order[(index + 1) % order.length]
    return
  }

  showStructure.value = !showStructure.value
}

const previewRevealLabel = computed(() => {
  if (selectedParadigm.value === 'hybrid') {
    if (previewRevealMode.value === 'structure') {
      return 'Show function tree'
    }
    if (previewRevealMode.value === 'function') {
      return 'Hide structure'
    }
    return 'Show structure'
  }

  return showStructure.value ? 'Hide structure' : 'Show structure'
})

const showRevealPanel = computed(() => {
  if (selectedParadigm.value === 'hybrid') {
    return previewRevealMode.value !== 'article'
  }

  return showStructure.value
})

const previewLines = computed((): PreviewLine[] => {
  if (selectedParadigm.value === 'hybrid') {
    const sectionOrder = articleSections.map((section) => section.id)

    return [...hybridFragments]
      .sort(
        (a, b) =>
          sectionOrder.indexOf(a.sectionId) - sectionOrder.indexOf(b.sectionId),
      )
      .map((fragment) => ({
        text: hybridFragmentSentence(fragment, previewLanguage.value),
        citation: fragment.citation,
      }))
  }

  if (selectedParadigm.value === 'information') {
    const lines = activeFacts.map((fact) => ({
      text: fact.sentence(fact.subject, fact.value),
      citation: fact.citation,
    }))

    if (composingPreview.value) {
      lines.push({ text: composingPreview.value, citation: null })
    }

    return lines
  }

  if (selectedParadigm.value === 'sentence-templates') {
    const lines = sentenceTemplates.map((entry) => ({
      text: sentenceTemplateOutput(entry),
      citation: entry.citation,
    }))

    if (composingSentencePreview.value && composingSentenceTemplate.value) {
      lines.push({ text: composingSentencePreview.value, citation: null })
    }

    return lines
  }

  if (selectedParadigm.value === 'fragments') {
    return fragmentCards.map((card) => ({
      text: fragmentCardSentence(card),
      citation: card.citation,
    }))
  }

  if (selectedParadigm.value === 'puzzle') {
    return activePuzzleRoots
      .filter((block) => isBlockComplete(block, getPuzzleTemplate))
      .map((block) => ({
        text: resolveBlockOutput(block, getPuzzleTemplate),
        citation: block.citation,
      }))
  }

  return confirmedTypewriterSentences.map((sentence) => ({
    text: sentence.sentence,
    citation: sentence.citation,
  }))
})

const numberedPreviewLines = computed((): NumberedPreviewLine[] => {
  const citationNumbers = new Map<string, number>()
  let nextNumber = 1

  return previewLines.value.map((line) => {
    if (!line.citation) {
      return { ...line, citationNumber: null }
    }

    if (!citationNumbers.has(citationKey(line.citation))) {
      citationNumbers.set(citationKey(line.citation), nextNumber)
      nextNumber += 1
    }

    return {
      ...line,
      citationNumber: citationNumbers.get(citationKey(line.citation)) ?? null,
    }
  })
})

const previewReferences = computed(() => {
  const references: WebCitation[] = []

  for (const line of previewLines.value) {
    if (!line.citation) {
      continue
    }

    const key = citationKey(line.citation)
    if (!references.some((reference) => citationKey(reference) === key)) {
      references.push(line.citation)
    }
  }

  return references
})

const structurePreview = computed(() => {
  if (selectedParadigm.value === 'hybrid') {
    return [...hybridFragments]
      .sort(
        (a, b) =>
          articleSections.findIndex((section) => section.id === a.sectionId) -
          articleSections.findIndex((section) => section.id === b.sectionId),
      )
      .map((fragment) => {
        const card = getHybridCard(fragment.cardId)

        return {
          section: articleSections.find((section) => section.id === fragment.sectionId)?.label,
          informationType: card?.informationLabel,
          wikidataProperty: card?.wikidataProperty,
          pattern: card?.pattern,
          source: fragment.source,
          function: card?.functionName,
          arguments: fragment.values,
          citation: formatCitationForStructure(fragment.citation),
          output: hybridFragmentSentence(fragment, previewLanguage.value),
        }
      })
  }

  if (selectedParadigm.value === 'information') {
    return activeFacts.map((fact) => ({
      source: fact.wikidataProperty,
      informationType: fact.label,
      subject: fact.subject,
      value: fact.value,
      function: fact.functionName,
      citation: formatCitationForStructure(fact.citation),
      output: fact.sentence(fact.subject, fact.value),
    }))
  }

  if (selectedParadigm.value === 'sentence-templates') {
    return sentenceTemplates.map((entry) => {
      const template = getSentenceTemplate(entry.templateId)

      return {
        pattern: template?.pattern,
        function: template?.functionName,
        arguments: entry.values,
        citation: formatCitationForStructure(entry.citation),
        output: sentenceTemplateOutput(entry),
      }
    })
  }

  if (selectedParadigm.value === 'fragments') {
    return fragmentCards.map((card) => {
      const definition = getFragmentCard(card.cardId)

      return {
        card: definition?.label,
        function: definition?.functionName,
        arguments: card.values,
        citation: formatCitationForStructure(card.citation),
        output: fragmentCardSentence(card),
      }
    })
  }

  if (selectedParadigm.value === 'puzzle') {
    return activePuzzleRoots.map((block) => ({
      ...serializeBlockStructure(block, getPuzzleTemplate),
      citation: formatCitationForStructure(block.citation),
    }))
  }

  return confirmedTypewriterSentences.map((sentence) => ({
    inputText: sentence.inputText,
    detectedPattern: sentence.label,
    confidence: sentence.confidence,
    function: sentence.functionName,
    citation: formatCitationForStructure(sentence.citation),
    output: sentence.sentence,
  }))
})

const functionPreview = computed(() => {
  if (selectedParadigm.value !== 'hybrid' || previewRevealMode.value !== 'function') {
    return []
  }

  return [...hybridFragments]
    .sort(
      (a, b) =>
        articleSections.findIndex((section) => section.id === a.sectionId) -
        articleSections.findIndex((section) => section.id === b.sectionId),
    )
    .map((fragment) => {
      const card = getHybridCard(fragment.cardId)

      return {
        informationType: card?.informationLabel,
        functionTree: card?.functionTree,
        citation: formatCitationForStructure(fragment.citation),
      }
    })
})
</script>

<template>
  <ChromeWrapper :last-edited-notice="false" username="Username1982">
    <SpecialPageWrapper
      title="Abstract editor paradigms"
      help
      class="abstract-editor-paradigms"
    >
      <section class="prototype-brief">
        <CdxMessage type="notice">
          These are low-fidelity interaction prototypes for the same task:
          <strong>create a short abstract lead for Steve Wozniak</strong>. Start with
          <strong>Hybrid · Recommended</strong> — Wikidata suggestions, information-first entry,
          section-based fragment cards, multilingual preview, and optional structure reveal. Other
          tabs isolate individual paradigms for comparison. The
          <strong>improved fragment editor</strong> lives on its own page:
          <router-link to="/improved-fragment-editor">/improved-fragment-editor</router-link>.
        </CdxMessage>
      </section>

      <section class="prototype-switcher" aria-label="Prototype variants">
        <CdxButton
          v-for="paradigm in paradigms"
          :key="paradigm.id"
          :action="selectedParadigm === paradigm.id ? 'progressive' : 'default'"
          :weight="selectedParadigm === paradigm.id ? 'primary' : 'normal'"
          @click="selectedParadigm = paradigm.id"
        >
          {{ paradigm.shortLabel }}
        </CdxButton>
      </section>

      <div class="workspace">
        <section class="workspace__editor" aria-label="Prototype editor">
          <div v-if="selectedParadigm === 'hybrid'" class="prototype-panel">
            <HybridEditorPanel v-model:fragments="hybridFragments" />
          </div>

          <div v-else-if="selectedParadigm === 'information'" class="prototype-panel">
            <header class="panel-heading">
              <p class="eyebrow">Paradigm 1</p>
              <h2>Information-first editor</h2>
              <p>
                Click <strong>+ Add information</strong>, choose what you want to add, fill in the
                form, and let the system map it to functions behind the scenes.
              </p>
            </header>

            <div
              v-if="!informationPickerOpen && !composingFact"
              class="information-start"
            >
              <CdxButton action="progressive" weight="primary" @click="openInformationPicker">
                + Add information
              </CdxButton>
            </div>

            <section v-if="informationPickerOpen" class="information-picker" aria-label="Choose information type">
              <h3>What information do you want to add?</h3>
              <div class="information-picker__list">
                <button
                  v-for="fact in informationTypes"
                  :key="fact.id"
                  type="button"
                  class="information-picker__option"
                  :disabled="activeFacts.some((item) => item.id === fact.id)"
                  @click="selectInformationType(fact)"
                >
                  <span class="information-picker__label">{{ fact.label }}</span>
                  <span class="information-picker__meta">{{ fact.section }}</span>
                </button>
              </div>
              <CdxButton weight="quiet" @click="cancelInformationFlow">Cancel</CdxButton>
            </section>

            <section v-if="composingFact" class="compose-form" aria-label="Add information form">
              <h3>{{ composingFact.label }}</h3>

              <CdxField>
                <template #label>Subject</template>
                <CdxTextInput v-model="composingSubject" />
              </CdxField>

              <CdxField>
                <template #label>{{ composingFact.fieldLabel }}</template>
                <CdxTextInput v-model="composingValue" placeholder="Enter value…" />
              </CdxField>

              <p v-if="composingFact.wikidataSuggestion" class="wikidata-hint">
                Suggested from Wikidata:
                <strong>{{ composingFact.wikidataSuggestion }}</strong>
                <CdxButton weight="quiet" @click="useWikidataSuggestion">Use suggestion</CdxButton>
              </p>

              <p v-if="composingPreview" class="card-output">
                Preview: {{ composingPreview }}
              </p>

              <div class="compose-form__actions">
                <CdxButton
                  action="progressive"
                  weight="primary"
                  :disabled="!composingValue.trim()"
                  @click="saveComposedFact"
                >
                  Add to article
                </CdxButton>
                <CdxButton weight="quiet" @click="cancelInformationFlow">Cancel</CdxButton>
              </div>
            </section>

            <div v-if="activeFacts.length" class="editor-stack">
              <article v-for="fact in activeFacts" :key="fact.id" class="edit-card">
                <div class="edit-card__header">
                  <div>
                    <h3>{{ fact.label }}</h3>
                    <p>{{ fact.section }}</p>
                  </div>
                  <CdxButton weight="quiet" action="destructive" @click="removeFact(fact.id)">
                    Remove
                  </CdxButton>
                </div>

                <p class="card-output">{{ fact.sentence(fact.subject, fact.value) }}</p>

                <div v-if="!fact.citation" class="citation-actions">
                  <CdxButton action="default" weight="normal" @click="attachCitation(fact)">
                    Add citation
                  </CdxButton>
                </div>
                <CitationEditorPanel
                  v-else
                  v-model:citation="fact.citation"
                  v-model:expanded="fact.citationExpanded"
                  :fields="citationFields"
                  @remove="removeCitation(fact)"
                />
              </article>
            </div>

            <div
              v-if="activeFacts.length && !informationPickerOpen && !composingFact"
              class="information-start information-start--secondary"
            >
              <CdxButton action="default" weight="normal" @click="openInformationPicker">
                + Add information
              </CdxButton>
            </div>
          </div>

          <div v-else-if="selectedParadigm === 'fragments'" class="prototype-panel fragments-panel">
            <header class="panel-heading">
              <p class="eyebrow">Paradigm 9</p>
              <h2>Fragment card composer</h2>
              <p>
                Add <strong>fragment cards</strong> to the lead from a short catalog. Each card is a
                sentence-shaped unit with editable fields — closer to the Abstract Wikipedia
                section-fragment model.
              </p>
            </header>

            <div class="template-list">
              <article
                v-for="card in extendedFragmentCatalog"
                :key="card.id"
                class="template-row"
              >
                <div>
                  <h3>{{ card.label }}</h3>
                  <p>{{ card.helper }}</p>
                  <small>Function: {{ card.functionName }}</small>
                </div>
                <CdxButton action="progressive" weight="primary" @click="addFragmentCard(card)">
                  Add card
                </CdxButton>
              </article>
            </div>

            <div v-if="fragmentCards.length" class="editor-stack">
              <article
                v-for="card in fragmentCards"
                :key="card.id"
                class="edit-card"
              >
                <div class="edit-card__header">
                  <div>
                    <h3>{{ getFragmentCard(card.cardId)?.label }}</h3>
                    <p>
                      Lead fragment · {{ getFragmentCard(card.cardId)?.functionName }}
                    </p>
                  </div>
                  <CdxButton
                    weight="quiet"
                    action="destructive"
                    @click="removeFragmentCard(card.id)"
                  >
                    Remove
                  </CdxButton>
                </div>

                <div class="field-grid">
                  <div
                    v-for="field in getFragmentCard(card.cardId)?.fields ?? []"
                    :key="field.key"
                    class="field-grid__cell"
                  >
                    <CdxField>
                      <template #label>{{ field.label }}</template>
                      <CdxTextInput v-model="card.values[field.key]" />
                    </CdxField>
                  </div>
                </div>

                <p class="card-output">{{ fragmentCardSentence(card) }}</p>

                <div v-if="!card.citation" class="citation-actions">
                  <CdxButton action="default" weight="normal" @click="attachCitation(card)">
                    Add citation
                  </CdxButton>
                </div>
                <CitationEditorPanel
                  v-else
                  v-model:citation="card.citation"
                  v-model:expanded="card.citationExpanded"
                  :fields="citationFields"
                  @remove="removeCitation(card)"
                />
              </article>
            </div>
          </div>

          <div
            v-else-if="selectedParadigm === 'sentence-templates'"
            class="prototype-panel sentence-templates-panel"
          >
            <header class="panel-heading">
              <p class="eyebrow">Paradigm 3</p>
              <h2>Sentence template forms</h2>
              <p>
                Click <strong>+ Add sentence</strong>, search for a fill-in-the-blank pattern like
                <code>[Person] was born on [Date]</code>, fill the slots, then add it to the article.
              </p>
            </header>

            <div
              v-if="!sentencePickerOpen && !composingSentenceTemplate"
              class="information-start"
            >
              <CdxButton action="progressive" weight="primary" @click="openSentencePicker">
                + Add sentence
              </CdxButton>
            </div>

            <section
              v-if="sentencePickerOpen && !composingSentenceTemplate"
              class="template-picker"
              aria-label="Search sentence patterns"
            >
              <h3>What sentence shape do you need?</h3>

              <CdxField>
                <template #label>Search patterns</template>
                <template #description>
                  Try "born", "studied", "co-founder", or "award".
                </template>
                <CdxTextInput
                  v-model="sentenceSearchQuery"
                  placeholder="What are you trying to say?"
                />
              </CdxField>

              <div class="template-picker__list">
                <button
                  v-for="template in filteredSentenceTemplates"
                  :key="template.id"
                  type="button"
                  class="template-picker__option"
                  @click="startComposingSentenceTemplate(template)"
                >
                  <span class="pattern-chip">{{ template.pattern }}</span>
                  <span class="template-picker__helper">
                    {{ template.helper }} · {{ sectionLabelForTemplate(template) }}
                  </span>
                </button>
                <p v-if="!filteredSentenceTemplates.length" class="template-picker__empty">
                  No patterns match that search. Try another word.
                </p>
              </div>

              <CdxButton weight="quiet" @click="cancelSentenceFlow">Cancel</CdxButton>
            </section>

            <section
              v-if="composingSentenceTemplate"
              class="compose-form"
              aria-label="Fill sentence template"
            >
              <h3>{{ composingSentenceTemplate.pattern }}</h3>
              <p>{{ composingSentenceTemplate.helper }}</p>

              <div class="field-grid">
                <div
                  v-for="field in composingSentenceTemplate.fields"
                  :key="field.key"
                  class="field-grid__cell"
                >
                  <CdxField>
                    <template #label>{{ field.label }}</template>
                    <CdxTextInput
                      v-model="composingSentenceValues[field.key]"
                      :placeholder="field.placeholder"
                    />
                  </CdxField>
                  <p v-if="field.wikidataSuggestion" class="wikidata-hint">
                    Suggested from Wikidata:
                    <strong>{{ field.wikidataSuggestion }}</strong>
                    <CdxButton weight="quiet" @click="useSentenceFieldWikidataSuggestion(field)">
                      Use suggestion
                    </CdxButton>
                  </p>
                </div>
              </div>

              <p v-if="composingSentencePreview" class="card-output">
                Preview: {{ composingSentencePreview }}
              </p>

              <div class="compose-form__actions">
                <CdxButton
                  action="progressive"
                  weight="primary"
                  :disabled="!canSaveComposingSentence"
                  @click="saveComposingSentence"
                >
                  Add to article
                </CdxButton>
                <CdxButton weight="quiet" @click="composingSentenceTemplate = null">
                  Back to search
                </CdxButton>
                <CdxButton weight="quiet" @click="cancelSentenceFlow">Cancel</CdxButton>
              </div>
            </section>

            <div v-if="sentenceTemplates.length" class="editor-stack">
              <article
                v-for="entry in sentenceTemplates"
                :key="entry.id"
                class="edit-card"
              >
                <div class="edit-card__header">
                  <div>
                    <p class="pattern-chip">
                      {{ getSentenceTemplate(entry.templateId)?.pattern }}
                    </p>
                    <p>{{ getSentenceTemplate(entry.templateId)?.helper }}</p>
                  </div>
                  <CdxButton
                    weight="quiet"
                    action="destructive"
                    @click="removeSentenceTemplate(entry.id)"
                  >
                    Remove
                  </CdxButton>
                </div>

                <div class="field-grid">
                  <div
                    v-for="field in getSentenceTemplate(entry.templateId)?.fields ?? []"
                    :key="field.key"
                    class="field-grid__cell"
                  >
                    <CdxField>
                      <template #label>{{ field.label }}</template>
                      <CdxTextInput
                        v-model="entry.values[field.key]"
                        :placeholder="field.placeholder"
                      />
                    </CdxField>
                  </div>
                </div>

                <p class="card-output">{{ sentenceTemplateOutput(entry) }}</p>

                <div v-if="!entry.citation" class="citation-actions">
                  <CdxButton action="default" weight="normal" @click="attachCitation(entry)">
                    Add citation
                  </CdxButton>
                </div>
                <CitationEditorPanel
                  v-else
                  v-model:citation="entry.citation"
                  v-model:expanded="entry.citationExpanded"
                  :fields="citationFields"
                  @remove="removeCitation(entry)"
                />
              </article>
            </div>

            <div
              v-if="sentenceTemplates.length && !sentencePickerOpen && !composingSentenceTemplate"
              class="information-start information-start--secondary"
            >
              <CdxButton action="default" weight="normal" @click="openSentencePicker">
                + Add sentence
              </CdxButton>
            </div>
          </div>

          <div v-else-if="selectedParadigm === 'typewriter'" class="prototype-panel">
            <header class="panel-heading">
              <p class="eyebrow">Paradigm 4</p>
              <h2>Magic typewriter</h2>
              <p>
                Write <strong>one sentence at a time</strong>. The system proposes a function match
                for that sentence. Confirm it, then add the next sentence.
              </p>
            </header>

            <section class="compose-form typewriter-compose" aria-label="Write one sentence">
              <CdxField>
                <template #label>Sentence {{ confirmedTypewriterSentences.length + 1 }}</template>
                <template #description>
                  Example: "Steve Wozniak is a software engineer." Add a clause with a comma to see
                  the warning state.
                </template>
                <CdxTextInput v-model="draftSentence" placeholder="Write one sentence…" />
              </CdxField>

              <div class="compose-form__actions">
                <CdxButton
                  action="progressive"
                  weight="primary"
                  :disabled="!draftSentence.trim()"
                  @click="analyzeDraftSentence"
                >
                  Find matching function
                </CdxButton>
              </div>
            </section>

            <CdxMessage v-if="typewriterWarning" type="warning" class="inline-message">
              {{ typewriterWarning }}
            </CdxMessage>

            <article v-if="pendingMatch" class="edit-card typewriter-pending">
              <div class="edit-card__header">
                <div>
                  <h3>{{ pendingMatch.label }}</h3>
                  <p>
                    Confidence: {{ pendingMatch.confidence }} · Function:
                    {{ pendingMatch.functionName }}
                  </p>
                </div>
              </div>
              <p class="card-output">{{ pendingMatch.sentence }}</p>
              <div class="compose-form__actions">
                <CdxButton action="progressive" weight="primary" @click="confirmPendingMatch">
                  Confirm sentence
                </CdxButton>
                <CdxButton weight="quiet" @click="rejectPendingMatch">Try again</CdxButton>
              </div>
            </article>

            <div v-if="confirmedTypewriterSentences.length" class="editor-stack">
              <h3 class="typewriter-confirmed-heading">Confirmed sentences</h3>
              <article
                v-for="sentence in confirmedTypewriterSentences"
                :key="sentence.id"
                class="edit-card"
              >
                <div class="edit-card__header">
                  <div>
                    <h3>{{ sentence.label }}</h3>
                    <p>{{ sentence.functionName }}</p>
                  </div>
                  <CdxButton
                    weight="quiet"
                    action="destructive"
                    @click="removeConfirmedSentence(sentence.id)"
                  >
                    Remove
                  </CdxButton>
                </div>
                <p class="card-output">{{ sentence.sentence }}</p>

                <div v-if="!sentence.citation" class="citation-actions">
                  <CdxButton action="default" weight="normal" @click="attachCitation(sentence)">
                    Add citation
                  </CdxButton>
                </div>
                <CitationEditorPanel
                  v-else
                  v-model:citation="sentence.citation"
                  v-model:expanded="sentence.citationExpanded"
                  :fields="citationFields"
                  @remove="removeCitation(sentence)"
                />
              </article>
            </div>
          </div>

          <div v-else-if="selectedParadigm === 'puzzle'" class="prototype-panel puzzle-panel">
            <header class="panel-heading">
              <p class="eyebrow">Paradigm 5</p>
              <h2>Visual puzzle</h2>
              <p>
                Compose nested <strong>function blocks</strong> like Scratch: literals and helper
                functions snap into typed slots. Wrong types cannot connect.
              </p>
            </header>

            <CdxMessage type="notice" class="inline-message puzzle-hint">
              Nesting is unlimited. Try 4+ levels: <strong>string to HTML fragment</strong> →
              <strong>Date-of-birth statement</strong> → <strong>Entity from label</strong> →
              <strong>Join text</strong> (with <strong>Steve</strong> + <strong>Wozniak</strong>).
              Or nest <strong>Format date</strong> inside the Date slot with Text literals in each
              part.
            </CdxMessage>

            <div class="puzzle-palette">
              <section class="puzzle-palette__section">
                <h3>Root blocks</h3>
                <div class="puzzle-palette__items">
                  <CdxButton
                    v-for="template in puzzleRootTemplates"
                    :key="template.id"
                    @click="addPuzzleRoot(template)"
                  >
                    + {{ template.label }}
                  </CdxButton>
                </div>
              </section>

              <section class="puzzle-palette__section">
                <h3>Function blocks (drag into slots)</h3>
                <div class="puzzle-palette__items">
                  <div
                    v-for="template in puzzleNestableTemplates"
                    :key="template.id"
                    class="puzzle-fn-chip"
                    draggable="true"
                    @dragstart="startPuzzleDragTemplate($event, template)"
                    @dragend="endPuzzleDrag"
                  >
                    <span class="puzzle-fn-chip__type">{{ template.outputType }}</span>
                    <span class="puzzle-fn-chip__label">{{ template.label }}</span>
                  </div>
                </div>
              </section>

              <section class="puzzle-palette__section">
                <h3>Literal blocks (drag into slots)</h3>
                <div class="puzzle-palette__items">
                  <div
                    v-for="block in puzzleValueBlocks"
                    :key="block.id"
                    class="puzzle-value-block"
                    draggable="true"
                    @dragstart="startPuzzleDragLiteral($event, block)"
                    @dragend="endPuzzleDrag"
                  >
                    <span class="puzzle-value-block__type">{{ block.type }}</span>
                    <span class="puzzle-value-block__label">{{ block.label }}</span>
                  </div>
                </div>
              </section>
            </div>

            <div class="puzzle-canvas">
              <h3 v-if="activePuzzleRoots.length" class="puzzle-canvas__heading">Canvas</h3>
              <p v-else class="puzzle-canvas__empty">
                Add a root block, then drag function and literal blocks into its slots.
              </p>
              <div class="editor-stack">
                <PuzzleBlockNode
                  v-for="block in activePuzzleRoots"
                  :key="block.id"
                  :block="block"
                  is-root
                  @remove="removePuzzleRoot(block.id)"
                />
              </div>
            </div>
          </div>
        </section>

        <aside class="workspace__preview" aria-label="Generated article preview">
          <div class="preview-card">
            <header class="preview-card__header">
              <div>
                <p class="eyebrow">Generated text</p>
                <h2>{{ subject }}</h2>
              </div>
              <CdxButton weight="quiet" @click="cyclePreviewRevealMode">
                {{ previewRevealLabel }}
              </CdxButton>
            </header>

            <div v-if="selectedParadigm === 'hybrid'" class="preview-language">
              <CdxField>
                <template #label>Preview language</template>
                <CdxSelect
                  v-model:selected="previewLanguage"
                  :menu-items="previewLanguageOptions"
                  default-label="English"
                />
              </CdxField>
              <CdxMessage
                v-if="activePreviewLanguage?.fallbackNotice"
                type="notice"
                class="inline-message"
              >
                {{ activePreviewLanguage.fallbackNotice }}
              </CdxMessage>
            </div>

            <div v-if="numberedPreviewLines.length" class="article-preview">
              <p v-for="(line, index) in numberedPreviewLines" :key="`${line.text}-${index}`">
                {{ line.text
                }}<sup v-if="line.citationNumber" class="citation-mark">{{
                  line.citationNumber
                }}</sup>
              </p>
            </div>
            <p v-else class="empty-preview">
              Add or confirm content in the editor to see the abstract article preview.
            </p>

            <section v-if="previewReferences.length" class="references-preview">
              <h3>References</h3>
              <ol>
                <li
                  v-for="(reference, index) in previewReferences"
                  :key="`${citationKey(reference)}-${index}`"
                >
                  {{ formatWebCitationReference(reference) }}
                </li>
              </ol>
            </section>

            <section
              v-if="showRevealPanel && previewRevealMode === 'structure'"
              class="structure-preview"
            >
              <h3>Structure mode</h3>
              <pre>{{ JSON.stringify(structurePreview, null, 2) }}</pre>
            </section>

            <section
              v-if="showRevealPanel && previewRevealMode === 'function'"
              class="structure-preview"
            >
              <h3>Function mode</h3>
              <pre>{{ JSON.stringify(functionPreview, null, 2) }}</pre>
            </section>

            <section
              v-if="showRevealPanel && selectedParadigm !== 'hybrid'"
              class="structure-preview"
            >
              <h3>Generated structure</h3>
              <pre>{{ JSON.stringify(structurePreview, null, 2) }}</pre>
            </section>
          </div>

          <div class="test-notes">
            <h3>What this prototype tests</h3>
            <ul v-if="selectedParadigm === 'hybrid'">
              <li>Do Wikidata suggestions feel helpful without blocking manual entry?</li>
              <li>Do section tabs and fragment cards match the Abstract Wikipedia model?</li>
              <li>Does multilingual preview communicate cross-wiki value?</li>
              <li>Does Structure → Function reveal build trust without becoming the default UI?</li>
            </ul>
            <ul v-else>
              <li>Can editors add content without seeing raw ZObject details?</li>
              <li>Does the mental model feel like facts, sentence patterns, or text drafting?</li>
              <li>Does the advanced reveal build trust without becoming the default UI?</li>
            </ul>
          </div>
        </aside>
      </div>
    </SpecialPageWrapper>
  </ChromeWrapper>
</template>

<style scoped>
.abstract-editor-paradigms {
  --prototype-panel-border: var(--border-color-subtle);
}

.prototype-brief {
  margin-bottom: var(--spacing-150);
}

.prototype-switcher {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-50);
  margin-bottom: var(--spacing-150);
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
  gap: var(--spacing-200);
  align-items: start;
}

.workspace__editor,
.workspace__preview {
  min-width: 0;
}

.prototype-panel,
.preview-card,
.test-notes {
  border: 1px solid var(--prototype-panel-border);
  background-color: var(--background-color-base);
}

.prototype-panel,
.preview-card {
  padding: var(--spacing-150);
}

.test-notes {
  margin-top: var(--spacing-100);
  padding: var(--spacing-100);
  color: var(--color-subtle);
}

.panel-heading {
  margin-bottom: var(--spacing-150);
}

.panel-heading h2,
.preview-card h2,
.edit-card h3,
.template-row h3,
.test-notes h3 {
  margin-top: 0;
}

.eyebrow {
  margin: 0 0 var(--spacing-25);
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.information-start {
  margin-bottom: var(--spacing-150);
}

.information-start--secondary {
  margin-top: var(--spacing-150);
  margin-bottom: 0;
}

.information-picker,
.compose-form {
  margin-bottom: var(--spacing-150);
  border: 1px solid var(--border-color-subtle);
  padding: var(--spacing-100);
  background-color: var(--background-color-neutral-subtle);
}

.information-picker h3,
.compose-form h3 {
  margin-top: 0;
}

.information-picker__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
  margin: var(--spacing-100) 0;
}

.information-picker__option {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-100);
  width: 100%;
  border: 1px solid var(--border-color-subtle);
  padding: var(--spacing-75) var(--spacing-100);
  background-color: var(--background-color-base);
  text-align: left;
  cursor: pointer;
}

.information-picker__option:hover:not(:disabled) {
  background-color: var(--background-color-interactive);
}

.information-picker__option:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.information-picker__label {
  font-weight: var(--font-weight-bold);
}

.information-picker__meta {
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.wikidata-hint {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.compose-form__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-50);
}

.typewriter-compose {
  margin-bottom: var(--spacing-100);
}

.typewriter-pending {
  margin-top: var(--spacing-100);
}

.typewriter-confirmed-heading {
  margin: 0;
  font-size: var(--font-size-medium);
}

.editor-stack {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100);
  margin-top: var(--spacing-150);
}

.edit-card,
.template-row {
  border: 1px solid var(--border-color-subtle);
  padding: var(--spacing-100);
  background-color: var(--background-color-neutral-subtle);
}

.edit-card__header,
.template-row,
.preview-card__header {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-100);
  align-items: flex-start;
}

.edit-card__header p,
.template-row p,
.panel-heading p {
  margin-bottom: var(--spacing-75);
  color: var(--color-subtle);
}

.section-tabs {
  margin-bottom: var(--spacing-100);
}

.section-intro {
  margin: 0 0 var(--spacing-100);
  color: var(--color-subtle);
}

.section-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-100);
  align-items: center;
  margin-bottom: var(--spacing-100);
}

.section-meta {
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.empty-section {
  margin: 0;
  color: var(--color-placeholder);
  font-size: var(--font-size-small);
}

.pattern-chip {
  display: inline-block;
  margin: 0 0 var(--spacing-25);
  padding: var(--spacing-25) var(--spacing-50);
  border-radius: var(--border-radius-base);
  background-color: var(--background-color-progressive-subtle);
  color: var(--color-progressive);
  font-family: var(--font-family-monospace, monospace);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
}

.pattern-chip--large {
  font-size: var(--font-size-medium);
}

.fragment-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-25);
  justify-content: flex-end;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75);
}

.fragment-catalog {
  margin-bottom: var(--spacing-150);
  border: 1px solid var(--border-color-subtle);
  padding: var(--spacing-100);
  background-color: var(--background-color-neutral-subtle);
}

.template-picker {
  margin-top: var(--spacing-150);
  border: 1px solid var(--border-color-subtle);
  padding: var(--spacing-100);
  background-color: var(--background-color-neutral-subtle);
}

.template-picker__header {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-100);
  align-items: flex-start;
  margin-bottom: var(--spacing-100);
}

.template-picker__header h3 {
  margin: 0;
}

.template-picker__list,
.wikidata-suggestions__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
  margin: var(--spacing-100) 0;
}

.template-picker__option,
.wikidata-suggestion {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-25);
  width: 100%;
  border: 1px solid var(--border-color-subtle);
  padding: var(--spacing-75) var(--spacing-100);
  background-color: var(--background-color-base);
  text-align: left;
  cursor: pointer;
}

.template-picker__option:hover,
.wikidata-suggestion:hover {
  background-color: var(--background-color-interactive);
}

.template-picker__helper,
.wikidata-suggestion__reason {
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.template-picker__empty {
  margin: 0;
  color: var(--color-placeholder);
  font-size: var(--font-size-small);
}

.wikidata-suggestions__heading {
  margin: var(--spacing-100) 0 var(--spacing-50);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-subtle);
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--spacing-100);
  align-items: start;
}

.field-grid__cell {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
  min-width: 0;
}

.field-grid__cell :deep(.cdx-field) {
  margin: 0;
  width: 100%;
}

.card-output,
.article-preview {
  border-left: 4px solid var(--border-color-progressive);
  margin: var(--spacing-100) 0;
  padding: var(--spacing-75) var(--spacing-100);
  background-color: var(--background-color-progressive-subtle);
}

.article-preview p {
  margin: 0 0 var(--spacing-75);
  line-height: var(--line-height-medium);
}

.article-preview p:last-child {
  margin-bottom: 0;
}

.empty-preview {
  color: var(--color-placeholder);
}

.preview-language {
  margin-bottom: var(--spacing-100);
}

.inline-message {
  margin-top: var(--spacing-100);
}

.citation-actions {
  margin-top: var(--spacing-75);
}

.citation-mark {
  margin-left: 0.1em;
  color: var(--color-progressive);
  font-size: 0.75em;
  font-weight: var(--font-weight-bold);
}

.references-preview {
  margin-top: var(--spacing-150);
  border-top: 1px solid var(--border-color-subtle);
  padding-top: var(--spacing-100);
}

.references-preview h3 {
  margin-top: 0;
}

.references-preview ol {
  margin: 0;
  padding-left: var(--spacing-150);
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.structure-preview {
  margin-top: var(--spacing-150);
  border-top: 1px solid var(--border-color-subtle);
  padding-top: var(--spacing-100);
}

.structure-preview pre {
  overflow: auto;
  max-height: 360px;
  padding: var(--spacing-100);
  background-color: var(--background-color-neutral-subtle);
  font-size: var(--font-size-small);
  white-space: pre-wrap;
}

@media (max-width: 900px) {
  .workspace {
    grid-template-columns: 1fr;
  }
}

/* Puzzle Paradigm */
.puzzle-hint {
  margin-bottom: var(--spacing-100);
}

.puzzle-palette {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-150);
  margin-bottom: var(--spacing-200);
  padding-bottom: var(--spacing-150);
  border-bottom: 1px solid var(--border-color-subtle);
}

.puzzle-palette__section h3 {
  margin: 0 0 var(--spacing-75);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-subtle);
}

.puzzle-palette__items {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-50);
}

.puzzle-fn-chip,
.puzzle-value-block {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-50);
  padding: var(--spacing-25) var(--spacing-75);
  border-radius: var(--border-radius-base);
  font-size: var(--font-size-small);
  cursor: grab;
  user-select: none;
}

.puzzle-fn-chip {
  background-color: var(--background-color-progressive-subtle);
  border: 1px solid var(--border-color-progressive);
}

.puzzle-value-block {
  background-color: var(--background-color-interactive-subtle);
  border: 1px solid var(--border-color-interactive);
}

.puzzle-fn-chip:active,
.puzzle-value-block:active {
  cursor: grabbing;
}

.puzzle-fn-chip__type,
.puzzle-value-block__type {
  font-weight: var(--font-weight-bold);
  color: var(--color-subtle);
  font-size: 0.85em;
  text-transform: uppercase;
}

.puzzle-canvas__heading {
  margin: 0 0 var(--spacing-100);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-subtle);
}

.puzzle-canvas__empty {
  margin: 0 0 var(--spacing-100);
  color: var(--color-placeholder);
  font-size: var(--font-size-small);
}
</style>
