import {
  articleSubject,
  createDefaultWebCitation,
  formatWebCitationReference,
  type FragmentCardDefinition,
  type WebCitation,
} from '../abstract-editor-paradigms/mock-registry'

export type FragmentId = 'birth' | 'cofounder'

export type TreeNodeLayer = 'meaning' | 'function' | 'wrapper' | 'zid' | 'helper'

export interface FragmentTreeNode {
  id: string
  label: string
  value?: string
  zid?: string
  outputType?: string
  expectedType?: string
  layer: TreeNodeLayer
  children?: FragmentTreeNode[]
  fieldKey?: string
  /** Slot row: show inline value editor */
  editableSlot?: boolean
  /** Helper row: offer compatible function replacements */
  replaceable?: boolean
  helperAlternatives?: { id: string; label: string; zid: string }[]
}

export type DateSourceMode = 'wikidata' | 'manual'

export interface BirthFragmentState {
  id: 'birth'
  cardTitle: string
  pattern: string
  functionName: string
  functionZid: string
  functionVariantId: 'full' | 'date-only'
  person: string
  date: string
  place: string
  language: string
  dateSourceMode: DateSourceMode
  citation: WebCitation | null
  citationExpanded?: boolean
  previewError: string | null
}

export interface CofounderFragmentState {
  id: 'cofounder'
  cardTitle: string
  pattern: string
  functionName: string
  functionZid: string
  person: string
  organization: string
  language: string
  citation: WebCitation | null
  citationExpanded?: boolean
  previewError: string | null
}

export type LeadFragmentState = BirthFragmentState | CofounderFragmentState

export interface LeadSectionState {
  sectionLabel: string
  sectionQid: string
  articleQid: string
  fragments: LeadFragmentState[]
}

export const leadSectionMeta = {
  sectionLabel: 'Lead paragraph',
  sectionQid: 'Q8776414',
  articleQid: 'Q483501',
  htmlWrapperZid: 'Z813',
  citeFunctionZid: 'Z32053',
  fetchWikidataZid: 'Z8040',
}

export const birthFunctionAlternatives = [
  {
    id: 'full' as const,
    functionName: '[name] was born [date] in [place]',
    functionZid: 'Z20420',
    pattern: '[Person] was born on [Date] in [Place]',
    cardTitle: 'Birth sentence',
  },
  {
    id: 'date-only' as const,
    functionName: '[name] was born on [date]',
    functionZid: 'Z20421',
    pattern: '[Person] was born on [Date]',
    cardTitle: 'Date of birth sentence',
  },
]

const birthWikidataHelpers = {
  dateOfBirthZid: 'Z20420K1',
  placeOfBirthZid: 'Z20420K2',
  manualDateZid: 'Z20420M1',
}

export const dateHelperAlternatives = [
  {
    id: 'wikidata',
    label: 'date of birth from Wikidata item',
    zid: birthWikidataHelpers.dateOfBirthZid,
  },
  {
    id: 'manual',
    label: 'Format date',
    zid: birthWikidataHelpers.manualDateZid,
  },
]

export const fetchWikidataAlternatives = [
  { id: 'article-subject', label: 'Fetch Wikidata item (article subject)', zid: 'Z8040' },
  { id: 'typed-label', label: 'Use typed literal', zid: 'Z6' },
]

export function createDefaultBirthFragment(): BirthFragmentState {
  return {
    id: 'birth',
    cardTitle: 'Birth sentence',
    pattern: '[Person] was born on [Date] in [Place]',
    functionName: '[name] was born [date] in [place]',
    functionZid: 'Z20420',
    functionVariantId: 'full',
    person: articleSubject,
    date: 'August 11, 1950',
    place: 'San Jose, California',
    language: 'en',
    dateSourceMode: 'wikidata',
    citation: null,
    previewError: null,
  }
}

export function createDefaultCofounderFragment(): CofounderFragmentState {
  return {
    id: 'cofounder',
    cardTitle: 'Co-founder sentence',
    pattern: '[Person] is a co-founder of [Organization]',
    functionName: '[name] is a co-founder of [organization]',
    functionZid: 'Z20430',
    person: articleSubject,
    organization: 'Apple Inc.',
    language: 'en',
    citation: null,
    previewError: null,
  }
}

export function createDefaultLeadSection(): LeadSectionState {
  return {
    sectionLabel: leadSectionMeta.sectionLabel,
    sectionQid: leadSectionMeta.sectionQid,
    articleQid: leadSectionMeta.articleQid,
    fragments: [createDefaultBirthFragment(), createDefaultCofounderFragment()],
  }
}

export function getFragmentById(
  section: LeadSectionState,
  id: FragmentId,
): LeadFragmentState | undefined {
  return section.fragments.find((fragment) => fragment.id === id)
}

function articleSubjectReference(): FragmentTreeNode {
  return {
    id: 'article-subject',
    label: 'article subject',
    value: `${articleSubject} → ${leadSectionMeta.articleQid}`,
    layer: 'zid',
  }
}

function fetchWikidataItemNode(id: string, value: string, fieldKey?: string): FragmentTreeNode {
  return {
    id,
    label: 'Fetch Wikidata item',
    zid: leadSectionMeta.fetchWikidataZid,
    outputType: 'Entity',
    layer: 'helper',
    fieldKey,
    replaceable: true,
    helperAlternatives: fetchWikidataAlternatives,
    children: [articleSubjectReference()],
    value,
  }
}

function buildDateSlotChildren(fragment: BirthFragmentState): FragmentTreeNode[] {
  if (fragment.dateSourceMode === 'manual') {
    return [
      {
        id: 'manual-date',
        label: 'Format date',
        zid: birthWikidataHelpers.manualDateZid,
        outputType: 'Date',
        layer: 'helper',
        fieldKey: 'date',
        replaceable: true,
        helperAlternatives: dateHelperAlternatives,
        value: fragment.date,
      },
    ]
  }

  return [
    {
      id: 'dob-from-wikidata',
      label: 'date of birth from Wikidata item',
      zid: birthWikidataHelpers.dateOfBirthZid,
      outputType: 'Date',
      layer: 'helper',
      fieldKey: 'date',
      replaceable: true,
      helperAlternatives: dateHelperAlternatives,
      value: fragment.date,
      children: [
        {
          id: 'dob-person-slot',
          label: 'person or entity',
          layer: 'function',
          children: [fetchWikidataItemNode('dob-person-fetch', fragment.person)],
        },
      ],
    },
  ]
}

function buildPlaceSlotChildren(fragment: BirthFragmentState): FragmentTreeNode[] {
  return [
    {
      id: 'pob-from-wikidata',
      label: 'place of birth from Wikidata item',
      zid: birthWikidataHelpers.placeOfBirthZid,
      outputType: 'Entity',
      layer: 'helper',
      fieldKey: 'place',
      replaceable: true,
      helperAlternatives: fetchWikidataAlternatives,
      value: fragment.place,
      children: [
        {
          id: 'pob-person-slot',
          label: 'person or entity',
          layer: 'function',
          children: [fetchWikidataItemNode('pob-person-fetch', fragment.person)],
        },
      ],
    },
  ]
}

function buildBirthMeaningChildren(fragment: BirthFragmentState): FragmentTreeNode[] {
  const children: FragmentTreeNode[] = [
    {
      id: 'person-slot',
      label: 'person or entity',
      layer: 'function',
      fieldKey: 'person',
      expectedType: 'Wikidata item',
      editableSlot: true,
      children: [fetchWikidataItemNode('person-fetch', fragment.person, 'person')],
    },
    {
      id: 'date-slot',
      label: 'date',
      layer: 'function',
      fieldKey: 'date',
      expectedType: 'Date',
      editableSlot: true,
      children: buildDateSlotChildren(fragment),
    },
  ]

  if (fragment.functionVariantId === 'full') {
    children.push({
      id: 'place-slot',
      label: 'location',
      layer: 'function',
      fieldKey: 'place',
      expectedType: 'Wikidata item',
      editableSlot: true,
      children: buildPlaceSlotChildren(fragment),
    })
  }

  children.push({
    id: 'language-slot',
    label: 'language',
    value: fragment.language,
    layer: 'function',
  })

  return children
}

export function buildBirthFragmentTree(
  fragment: BirthFragmentState,
  options: { showWrappers?: boolean } = {},
): FragmentTreeNode[] {
  const showWrappers = options.showWrappers ?? false
  const meaningNode: FragmentTreeNode = {
    id: 'birth-sentence',
    label: fragment.functionName,
    zid: fragment.functionZid,
    outputType: 'String',
    layer: 'meaning',
    children: buildBirthMeaningChildren(fragment),
  }

  const nodes: FragmentTreeNode[] = showWrappers
    ? [
        {
          id: 'html-wrapper',
          label: 'string to HTML fragment',
          zid: leadSectionMeta.htmlWrapperZid,
          outputType: 'HTML fragment',
          layer: 'wrapper',
          children: [meaningNode],
        },
      ]
    : [meaningNode]

  if (fragment.citation) {
    const citeNode: FragmentTreeNode = {
      id: 'cite-web',
      label: 'simple cite web',
      zid: leadSectionMeta.citeFunctionZid,
      outputType: 'Cited fragment',
      layer: 'wrapper',
      value: formatWebCitationReference(fragment.citation),
    }

    if (showWrappers) {
      nodes.push(citeNode)
    }
  }

  return nodes
}

export function buildCofounderFragmentTree(
  fragment: CofounderFragmentState,
  options: { showWrappers?: boolean } = {},
): FragmentTreeNode[] {
  const showWrappers = options.showWrappers ?? false
  const meaningNode: FragmentTreeNode = {
    id: 'cofounder-sentence',
    label: fragment.functionName,
    zid: fragment.functionZid,
    outputType: 'String',
    layer: 'meaning',
    children: [
      {
        id: 'person-slot',
        label: 'person or entity',
        layer: 'function',
        fieldKey: 'person',
        expectedType: 'Wikidata item',
        editableSlot: true,
        children: [fetchWikidataItemNode('cofounder-person-fetch', fragment.person, 'person')],
      },
      {
        id: 'organization-slot',
        label: 'organization',
        layer: 'function',
        fieldKey: 'organization',
        expectedType: 'Wikidata item',
        editableSlot: true,
        children: [
          {
            id: 'organization-fetch',
            label: 'Fetch Wikidata item',
            zid: leadSectionMeta.fetchWikidataZid,
            outputType: 'Entity',
            layer: 'helper',
            fieldKey: 'organization',
            replaceable: true,
            helperAlternatives: fetchWikidataAlternatives,
            value: fragment.organization,
          },
        ],
      },
      {
        id: 'cofounder-language-slot',
        label: 'language',
        value: fragment.language,
        layer: 'function',
      },
    ],
  }

  const nodes: FragmentTreeNode[] = showWrappers
    ? [
        {
          id: 'cofounder-html-wrapper',
          label: 'string to HTML fragment',
          zid: leadSectionMeta.htmlWrapperZid,
          outputType: 'HTML fragment',
          layer: 'wrapper',
          children: [meaningNode],
        },
      ]
    : [meaningNode]

  if (fragment.citation) {
    const citeNode: FragmentTreeNode = {
      id: 'cofounder-cite-web',
      label: 'simple cite web',
      zid: leadSectionMeta.citeFunctionZid,
      outputType: 'Cited fragment',
      layer: 'wrapper',
      value: formatWebCitationReference(fragment.citation),
    }

    if (showWrappers) {
      nodes.push(citeNode)
    }
  }

  return nodes
}

export function buildFragmentTree(
  fragment: LeadFragmentState,
  options: { showWrappers?: boolean } = {},
): FragmentTreeNode[] {
  if (fragment.id === 'birth') {
    return buildBirthFragmentTree(fragment, options)
  }

  return buildCofounderFragmentTree(fragment, options)
}

export function buildBirthSentence(fragment: BirthFragmentState): string {
  if (fragment.functionVariantId === 'date-only') {
    return `${fragment.person} was born on ${fragment.date}.`
  }

  return `${fragment.person} was born on ${fragment.date} in ${fragment.place}.`
}

export function buildCofounderSentence(fragment: CofounderFragmentState): string {
  return `${fragment.person} is a co-founder of ${fragment.organization}.`
}

export function buildFragmentSentence(fragment: LeadFragmentState): string {
  if (fragment.id === 'birth') {
    return buildBirthSentence(fragment)
  }

  return buildCofounderSentence(fragment)
}

export function buildLeadPreview(section: LeadSectionState): string[] {
  return section.fragments.map((fragment) => buildFragmentSentence(fragment))
}

export interface PreviewSegment {
  key: string
  label: string
  text: string
}

export function getPreviewSegments(fragment: LeadFragmentState): PreviewSegment[] {
  if (fragment.id === 'birth') {
    const segments: PreviewSegment[] = [
      { key: 'person', label: 'Person', text: fragment.person },
      { key: 'date', label: 'Date', text: fragment.date },
    ]

    if (fragment.functionVariantId === 'full') {
      segments.push({ key: 'place', label: 'Place', text: fragment.place })
    }

    return segments
  }

  return [
    { key: 'person', label: 'Person', text: fragment.person },
    { key: 'organization', label: 'Organization', text: fragment.organization },
  ]
}

export function getFragmentFieldDefinitions(fragment: LeadFragmentState) {
  if (fragment.id === 'birth') {
    const fields = [
      {
        key: 'person',
        label: 'Person',
        expectedType: 'Wikidata item',
        editable: true,
      },
      {
        key: 'date',
        label: 'Date',
        expectedType: 'Date',
        editable: true,
        sourceMode: fragment.dateSourceMode,
      },
    ]

    if (fragment.functionVariantId === 'full') {
      fields.push({
        key: 'place',
        label: 'Place',
        expectedType: 'Wikidata item',
        editable: true,
      })
    }

    return fields
  }

  return [
    {
      key: 'person',
      label: 'Person',
      expectedType: 'Wikidata item',
      editable: true,
    },
    {
      key: 'organization',
      label: 'Organization',
      expectedType: 'Wikidata item',
      editable: true,
    },
  ]
}

const datePattern = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}$/i

export function validateBirthFragment(fragment: BirthFragmentState): string | null {
  if (fragment.dateSourceMode === 'manual' && !datePattern.test(fragment.date.trim())) {
    return `This slot expects a date. The value "${fragment.date}" cannot be used here. Choose a date like "August 11, 1950" or switch back to From Wikidata.`
  }

  return null
}

export function validateFragment(fragment: LeadFragmentState): string | null {
  if (fragment.id === 'birth') {
    return validateBirthFragment(fragment)
  }

  return null
}

export function refreshFragmentValidation(fragment: LeadFragmentState) {
  fragment.previewError = validateFragment(fragment)
}

export function setBirthFunctionVariant(fragment: BirthFragmentState, variantId: 'full' | 'date-only') {
  const alternative = birthFunctionAlternatives.find((item) => item.id === variantId)
  if (!alternative) {
    return
  }

  fragment.functionVariantId = variantId
  fragment.functionName = alternative.functionName
  fragment.functionZid = alternative.functionZid
  fragment.pattern = alternative.pattern
  fragment.cardTitle = alternative.cardTitle
}

export function setDateSourceMode(fragment: BirthFragmentState, mode: DateSourceMode) {
  fragment.dateSourceMode = mode
  refreshFragmentValidation(fragment)
}

export function replaceHelperFunction(
  fragment: LeadFragmentState,
  fieldKey: string,
  alternativeId: string,
) {
  if (fragment.id === 'birth' && fieldKey === 'date') {
    setDateSourceMode(fragment, alternativeId === 'manual' ? 'manual' : 'wikidata')
    return
  }

  // Mock: other replacements update the displayed helper label via a toast in the UI;
  // values still edit through the slot field.
  void alternativeId
}

export function setFragmentFieldValue(
  fragment: LeadFragmentState,
  key: string,
  value: string,
) {
  if (fragment.id === 'birth') {
    if (key === 'person') {
      fragment.person = value
    } else if (key === 'date') {
      fragment.date = value
    } else if (key === 'place') {
      fragment.place = value
    }
    refreshFragmentValidation(fragment)
    return
  }

  if (key === 'person') {
    fragment.person = value
  } else if (key === 'organization') {
    fragment.organization = value
  }
}

export function getFragmentFieldValue(fragment: LeadFragmentState, key: string): string {
  if (key in fragment) {
    return String((fragment as Record<string, string>)[key] ?? '')
  }

  return ''
}

export function attachCitationToFragment(fragment: LeadFragmentState) {
  if (!fragment.citation) {
    fragment.citation = createDefaultWebCitation()
    fragment.citationExpanded = true
  } else if (fragment.citationExpanded === false) {
    fragment.citationExpanded = true
  }
}

export function removeCitationFromFragment(fragment: LeadFragmentState) {
  fragment.citation = null
  fragment.citationExpanded = undefined
}

export function buildPromotePayload(fragment: LeadFragmentState): FragmentCardDefinition {
  const fields = getFragmentFieldDefinitions(fragment).map((field) => ({
    key: field.key,
    label: field.label,
    defaultValue: getFragmentFieldValue(fragment, field.key),
  }))

  const variantId = fragment.id === 'birth' ? fragment.functionVariantId : null

  return {
    id: `promoted-${fragment.id}-${Date.now()}`,
    label: fragment.cardTitle,
    helper: `Promoted from lead section: ${fragment.pattern}`,
    functionName: fragment.functionName,
    fields,
    sentence: (values: Record<string, string>) => {
      if (fragment.id === 'birth') {
        const person = values.person ?? fragment.person
        const date = values.date ?? fragment.date
        const place = values.place ?? fragment.place

        if (variantId === 'date-only') {
          return `${person} was born on ${date}.`
        }

        return `${person} was born on ${date} in ${place}.`
      }

      const person = values.person ?? fragment.person
      const organization = values.organization ?? fragment.organization
      return `${person} is a co-founder of ${organization}.`
    },
  }
}
