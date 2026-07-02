export interface AuthoringOptionField {
  key: string
  label: string
}

export interface AuthoringOption {
  id: string
  label: string
  pattern: string
  helper: string
  wikidataProperty: string
  sectionId: string
  functionName: string
  functionZid: string
  fields: AuthoringOptionField[]
}

export interface ArticleSection {
  id: string
  label: string
  description: string
}

export interface SectionOutline {
  sectionId: string
  optionIds: string[]
}

export interface ArticleTypeOutline {
  id: string
  label: string
  wikidataMatch: string
  sections: SectionOutline[]
}

export type PendingSuggestionSource = 'ai' | 'promoted'

export interface PendingSuggestion {
  id: string
  source: PendingSuggestionSource
  proposedOption: Omit<AuthoringOption, 'id'>
  status: 'pending'
}

export interface CommunityConfigState {
  authoringRegistry: AuthoringOption[]
  articleTypeOutlines: ArticleTypeOutline[]
  pendingSuggestions: PendingSuggestion[]
}

export const articleSections: ArticleSection[] = [
  {
    id: 'lead',
    label: 'Lead',
    description: 'Opening sentences that introduce the topic.',
  },
  {
    id: 'early-life',
    label: 'Early life',
    description: 'Birth, upbringing, and education.',
  },
  {
    id: 'career',
    label: 'Career',
    description: 'Work, organizations, and impact.',
  },
]

export const seedAuthoringRegistry: AuthoringOption[] = [
  {
    id: 'occupation',
    label: 'Occupation',
    pattern: '[Person] is a [class]',
    helper: 'Say what the topic is.',
    wikidataProperty: 'P106 occupation',
    sectionId: 'lead',
    functionName: 'Article-less instantiating fragment',
    functionZid: 'Z10031',
    fields: [
      { key: 'entity', label: 'Person' },
      { key: 'class', label: 'Class or occupation' },
    ],
  },
  {
    id: 'birthDate',
    label: 'Date of birth',
    pattern: '[Person] was born on [Date]',
    helper: 'A short birth-date sentence for the lead.',
    wikidataProperty: 'P569 date of birth',
    sectionId: 'lead',
    functionName: 'Date-of-birth statement',
    functionZid: 'Z20421',
    fields: [
      { key: 'entity', label: 'Person' },
      { key: 'date', label: 'Date' },
    ],
  },
  {
    id: 'placeOfBirth',
    label: 'Place of birth',
    pattern: '[Person] was born in [Place]',
    helper: 'Where the topic was born.',
    wikidataProperty: 'P19 place of birth',
    sectionId: 'early-life',
    functionName: 'Place-of-birth statement',
    functionZid: 'Z20420',
    fields: [
      { key: 'entity', label: 'Person' },
      { key: 'place', label: 'Place' },
    ],
  },
  {
    id: 'education',
    label: 'Education',
    pattern: '[Person] studied at [Institution]',
    helper: 'School or university attendance.',
    wikidataProperty: 'P69 educated at',
    sectionId: 'early-life',
    functionName: 'Education statement',
    functionZid: 'Z20440',
    fields: [
      { key: 'entity', label: 'Person' },
      { key: 'institution', label: 'Institution' },
    ],
  },
  {
    id: 'notableWork',
    label: 'Notable work',
    pattern: '[Person] is a [role] of [Organization]',
    helper: 'Founding, creating, or leading something notable.',
    wikidataProperty: 'P800 notable work',
    sectionId: 'career',
    functionName: 'Defining role sentence',
    functionZid: 'Z20430',
    fields: [
      { key: 'entity', label: 'Person' },
      { key: 'role', label: 'Role' },
      { key: 'work', label: 'Organization' },
    ],
  },
  {
    id: 'award',
    label: 'Award',
    pattern: '[Person] received the [Award]',
    helper: 'A notable prize or honor.',
    wikidataProperty: 'P166 award received',
    sectionId: 'career',
    functionName: 'Award statement',
    functionZid: 'Z20450',
    fields: [
      { key: 'entity', label: 'Person' },
      { key: 'award', label: 'Award' },
    ],
  },
]

export const seedArticleTypeOutlines: ArticleTypeOutline[] = [
  {
    id: 'human-biography',
    label: 'Human biography',
    wikidataMatch: 'P31 → human (Q5)',
    sections: [
      { sectionId: 'lead', optionIds: ['birthDate', 'occupation'] },
      { sectionId: 'early-life', optionIds: ['placeOfBirth', 'education'] },
      { sectionId: 'career', optionIds: ['notableWork', 'award'] },
    ],
  },
]

export const seedPendingSuggestions: PendingSuggestion[] = [
  {
    id: 'pending-ai-occupation',
    source: 'ai',
    status: 'pending',
    proposedOption: {
      label: 'Profession',
      pattern: '[Person] works as a [class]',
      helper:
        'Suggested from mining 4,200 biography leads; function Z32962 uses entity + class arguments.',
      wikidataProperty: 'P106 occupation',
      sectionId: 'lead',
      functionName: 'X is a Y',
      functionZid: 'Z32962',
      fields: [
        { key: 'entity', label: 'Person' },
        { key: 'class', label: 'Profession' },
      ],
    },
  },
  {
    id: 'pending-promoted-birth',
    source: 'promoted',
    status: 'pending',
    proposedOption: {
      label: 'Birth date and place (combined)',
      pattern: '[Person] was born [date] in [place]',
      helper: 'Promoted from lead section: deep Wikidata birth chain on Steve Wozniak fixture.',
      wikidataProperty: 'P569 date of birth · P19 place of birth',
      sectionId: 'lead',
      functionName: 'Birth sentence from Wikidata person, English',
      functionZid: 'Z36185',
      fields: [
        { key: 'person', label: 'Wikidata person' },
        { key: 'language', label: 'Language' },
      ],
    },
  },
  {
    id: 'pending-ai-field',
    source: 'ai',
    status: 'pending',
    proposedOption: {
      label: 'Field of work',
      pattern: '[Person] works in the field of [field]',
      helper: 'Inferred from function argument labels; Wikidata property uncertain.',
      wikidataProperty: '',
      sectionId: 'lead',
      functionName: 'Field-of-work statement',
      functionZid: 'Z20455',
      fields: [
        { key: 'entity', label: 'Person' },
        { key: 'field', label: 'Field' },
      ],
    },
  },
]

export function createInitialState(): CommunityConfigState {
  return {
    authoringRegistry: seedAuthoringRegistry.map((entry) => ({
      ...entry,
      fields: entry.fields.map((field) => ({ ...field })),
    })),
    articleTypeOutlines: seedArticleTypeOutlines.map((outline) => ({
      ...outline,
      sections: outline.sections.map((section) => ({
        ...section,
        optionIds: [...section.optionIds],
      })),
    })),
    pendingSuggestions: seedPendingSuggestions.map((suggestion) => ({
      ...suggestion,
      proposedOption: {
        ...suggestion.proposedOption,
        fields: suggestion.proposedOption.fields.map((field) => ({ ...field })),
      },
    })),
  }
}

export const providerDefinitions = [
  {
    id: 'authoring-registry',
    title: 'Authoring registry',
    description:
      'Maps editor-facing information (Occupation, Date of birth, …) to sentence patterns, Wikidata properties, and Wikifunction wiring.',
  },
  {
    id: 'article-outlines',
    title: 'Article-type outlines',
    description:
      'Defines which authoring options appear in which sections for an article type (e.g. human biography).',
  },
  {
    id: 'pending-suggestions',
    title: 'Pending suggestions',
    description:
      'Review queue for promoted fragments and AI-proposed registry entries before they go live.',
  },
] as const

export type ProviderId = (typeof providerDefinitions)[number]['id']

export function sectionLabel(sectionId: string): string {
  return articleSections.find((section) => section.id === sectionId)?.label ?? sectionId
}

export function emptyAuthoringOption(): AuthoringOption {
  return {
    id: '',
    label: '',
    pattern: '',
    helper: '',
    wikidataProperty: '',
    sectionId: 'lead',
    functionName: '',
    functionZid: '',
    fields: [{ key: 'entity', label: 'Person' }],
  }
}
