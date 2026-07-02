import {
  articleSubject,
  createDefaultWebCitation,
  formatWebCitationReference,
  type WebCitation,
} from './mock-registry'

export type FragmentFieldKey = 'person' | 'date' | 'place'

export interface BirthFragmentFixture {
  person: string
  date: string
  place: string
  language: string
  citation: WebCitation | null
  citationExpanded?: boolean
}

export const birthFragmentMeta = {
  sectionLabel: 'Lead paragraph',
  sectionQid: 'Q8776414',
  pattern: '[Person] was born on [Date] in [Place]',
  functionName: '[name] was born [date] in [place]',
  functionZid: 'Z20420',
  htmlWrapperZid: 'Z813',
  citeFunctionZid: 'Z32053',
  cardTitle: 'Birth sentence',
}

export function createDefaultBirthFixture(): BirthFragmentFixture {
  return {
    person: articleSubject,
    date: 'August 11, 1950',
    place: 'San Jose, California',
    language: 'en',
    citation: null,
  }
}

export function buildBirthSentence(fixture: BirthFragmentFixture): string {
  return `${fixture.person} was born on ${fixture.date} in ${fixture.place}.`
}

export interface PreviewSegment {
  key: FragmentFieldKey
  label: string
  text: string
}

export function getPreviewSegments(fixture: BirthFragmentFixture): PreviewSegment[] {
  return [
    { key: 'person', label: 'Person', text: fixture.person },
    { key: 'date', label: 'Date', text: fixture.date },
    { key: 'place', label: 'Place', text: fixture.place },
  ]
}

export type TreeNodeLayer = 'meaning' | 'function' | 'wrapper' | 'zid' | 'helper'

export interface FragmentTreeNode {
  id: string
  label: string
  value?: string
  zid?: string
  outputType?: string
  layer: TreeNodeLayer
  children?: FragmentTreeNode[]
  fieldKey?: FragmentFieldKey
}

export function buildFragmentTree(fixture: BirthFragmentFixture): FragmentTreeNode[] {
  const nodes: FragmentTreeNode[] = [
    {
      id: 'html-wrapper',
      label: 'string to HTML fragment',
      zid: birthFragmentMeta.htmlWrapperZid,
      outputType: 'HTML fragment',
      layer: 'wrapper',
      children: [
        {
          id: 'birth-sentence',
          label: birthFragmentMeta.functionName,
          zid: birthFragmentMeta.functionZid,
          outputType: 'String',
          layer: 'meaning',
          children: [
            {
              id: 'person-slot',
              label: 'person or entity',
              layer: 'function',
              fieldKey: 'person',
              children: [
                {
                  id: 'person-fetch',
                  label: 'Fetch Wikidata item',
                  value: fixture.person,
                  zid: 'Z8040',
                  outputType: 'Entity',
                  layer: 'helper',
                },
              ],
            },
            {
              id: 'date-slot',
              label: 'date',
              layer: 'function',
              fieldKey: 'date',
              children: [
                {
                  id: 'date-builder',
                  label: 'Format date',
                  value: fixture.date,
                  zid: 'Z20420K1',
                  outputType: 'Date',
                  layer: 'helper',
                },
              ],
            },
            {
              id: 'place-slot',
              label: 'location',
              layer: 'function',
              fieldKey: 'place',
              children: [
                {
                  id: 'place-fetch',
                  label: 'Fetch Wikidata item',
                  value: fixture.place,
                  zid: 'Z8040',
                  outputType: 'Entity',
                  layer: 'helper',
                },
              ],
            },
            {
              id: 'language-slot',
              label: 'language',
              value: fixture.language,
              layer: 'function',
            },
          ],
        },
      ],
    },
  ]

  if (fixture.citation) {
    nodes.push({
      id: 'cite-web',
      label: 'simple cite web',
      zid: birthFragmentMeta.citeFunctionZid,
      outputType: 'Cited fragment',
      layer: 'wrapper',
      value: formatWebCitationReference(fixture.citation),
    })
  }

  return nodes
}

export interface PipelineStep {
  id: string
  label: string
  detail: string
  outputType: string
  layer: TreeNodeLayer
  fieldKey?: FragmentFieldKey
}

export function buildPipelineSteps(fixture: BirthFragmentFixture): PipelineStep[] {
  const steps: PipelineStep[] = [
    {
      id: 'wikidata-person',
      label: 'Fetch Wikidata item',
      detail: fixture.person,
      outputType: 'Entity',
      layer: 'helper',
      fieldKey: 'person',
    },
    {
      id: 'date-builder',
      label: 'Format date',
      detail: fixture.date,
      outputType: 'Date',
      layer: 'helper',
      fieldKey: 'date',
    },
    {
      id: 'wikidata-place',
      label: 'Fetch Wikidata item',
      detail: fixture.place,
      outputType: 'Entity',
      layer: 'helper',
      fieldKey: 'place',
    },
    {
      id: 'birth-fn',
      label: birthFragmentMeta.functionName,
      detail: birthFragmentMeta.pattern,
      outputType: 'String',
      layer: 'meaning',
    },
    {
      id: 'html-wrap',
      label: 'string to HTML fragment',
      detail: 'Wrap rendered string',
      outputType: 'HTML fragment',
      layer: 'wrapper',
    },
  ]

  if (fixture.citation) {
    steps.push({
      id: 'cite',
      label: 'simple cite web',
      detail: fixture.citation.websiteName,
      outputType: 'Cited fragment',
      layer: 'wrapper',
    })
  }

  return steps
}

export interface TypedSlotDefinition {
  key: FragmentFieldKey | 'language'
  label: string
  expectedType: string
  inputKind: 'wikidata' | 'date-builder' | 'language'
  helperLabel: string
  wikidataSuggestion?: string
}

export const birthFragmentSlots: TypedSlotDefinition[] = [
  {
    key: 'person',
    label: 'person or entity',
    expectedType: 'Wikidata item',
    inputKind: 'wikidata',
    helperLabel: 'Fetch Wikidata item',
    wikidataSuggestion: articleSubject,
  },
  {
    key: 'date',
    label: 'date',
    expectedType: 'Date',
    inputKind: 'date-builder',
    helperLabel: 'Build date',
    wikidataSuggestion: 'August 11, 1950',
  },
  {
    key: 'place',
    label: 'location',
    expectedType: 'Wikidata item',
    inputKind: 'wikidata',
    helperLabel: 'Fetch Wikidata item',
    wikidataSuggestion: 'San Jose, California',
  },
  {
    key: 'language',
    label: 'language',
    expectedType: 'Language',
    inputKind: 'language',
    helperLabel: 'Use article language',
  },
]

export const fragmentEvaluationQuestions = [
  'Can an experienced editor understand what this fragment does in under 30 seconds?',
  'Can they identify which values are article facts and which nodes are implementation details?',
  'Can they safely change a value without breaking the function tree?',
  'Can they replace a function with a compatible alternative?',
  'Can they debug a failed preview from the UI alone?',
  'Can they attach or inspect citations without understanding citation functions?',
  'Can they understand how the fragment fits into the article section and paragraph?',
  'Can a useful fragment pattern be promoted into a reusable Wikifunction or registry card?',
  'Could the same block/tree component improve Wikifunctions implementation editing?',
]

export function attachCitationToFixture(fixture: BirthFragmentFixture) {
  if (!fixture.citation) {
    fixture.citation = createDefaultWebCitation()
    fixture.citationExpanded = true
  } else if (fixture.citationExpanded === false) {
    fixture.citationExpanded = true
  }
}

export function removeCitationFromFixture(fixture: BirthFragmentFixture) {
  fixture.citation = null
  fixture.citationExpanded = undefined
}
