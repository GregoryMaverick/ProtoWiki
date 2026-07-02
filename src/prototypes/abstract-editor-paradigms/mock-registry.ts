export interface WebCitation {
  url: string
  pageTitle: string
  websiteName: string
  accessDate: string
  displayLanguage: string
}

export interface TemplateFieldDefinition {
  key: string
  label: string
  placeholder: string
  wikidataSuggestion?: string
}

export interface SectionDefinition {
  id: string
  label: string
  description: string
}

export type HybridCardKind = 'sentence' | 'paragraph' | 'section-heading'

export interface HybridCardDefinition {
  id: string
  informationLabel: string
  sectionId: string
  pattern: string
  helper: string
  functionName: string
  functionZid: string
  implementationZid?: string
  implementationLabel?: string
  kind?: HybridCardKind
  /** Listed in Add a sentence search in every section (respecting excludeLead). */
  searchableEverywhere?: boolean
  /** Omit from Add a sentence when the active section is lead. */
  excludeLead?: boolean
  /** Extra terms for Add a sentence information search. */
  searchKeywords?: string[]
  /** Only discoverable via Add a sentence, not as a suggestion chip. */
  addSearchOnly?: boolean
  wikidataProperty: string
  wikidataSuggestion: string
  fields: TemplateFieldDefinition[]
  sentence: (values: Record<string, string>) => string
  functionTree: object
}

export interface HybridFragment {
  id: string
  cardId: string
  sectionId: string
  values: Record<string, string>
  source: 'wikidata' | 'manual'
  citation: WebCitation | null
  citationExpanded?: boolean
  citationPromptDismissed?: boolean
}

export interface FactDefinition {
  id: string
  label: string
  section: string
  wikidataProperty: string
  functionName: string
  fieldLabel: string
  wikidataSuggestion: string
  sentence: (subject: string, value: string) => string
}

export interface TemplateDefinition {
  id: string
  label: string
  pattern: string
  helper: string
  sectionId: string
  functionName: string
  searchKeywords: string[]
  fields: TemplateFieldDefinition[]
  sentence: (values: Record<string, string>) => string
}

export interface FragmentCardDefinition {
  id: string
  label: string
  helper: string
  functionName: string
  fields: { key: string; label: string; defaultValue: string }[]
  sentence: (values: Record<string, string>) => string
}

export type PreviewLanguage = 'en' | 'es' | 'de'

export interface PreviewLanguageOption {
  code: PreviewLanguage
  label: string
  fallbackNotice?: string
}

export const articleSubject = 'Steve Wozniak'

export const articleQid = 'Q483382'

export function abstractArticleEditUrl(qid: string = articleQid, uselang = 'en'): string {
  const params = new URLSearchParams({
    title: qid,
    action: 'edit',
    uselang,
  })

  return `https://abstract.wikipedia.org/w/index.php?${params.toString()}`
}

export const citeWebFunction = {
  zid: 'Z32053',
  label: 'simple cite web',
}

export const citationFields: {
  key: keyof WebCitation
  label: string
  inputType?: 'text' | 'url'
}[] = [
  { key: 'url', label: 'Link', inputType: 'url' },
  { key: 'pageTitle', label: 'Page title' },
  { key: 'websiteName', label: 'Website name' },
  { key: 'accessDate', label: 'Date accessed' },
]

export const articleSections: SectionDefinition[] = [
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

export const previewLanguages: PreviewLanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'de', label: 'German', fallbackNotice: 'Some German renderers use a fallback pluralization.' },
]

export const wikifunctions = {
  htmlFragment: { zid: 'Z813', label: 'string to HTML fragment' },
  paragraph: {
    zid: 'Z32123',
    label: 'paragraph',
    helper: 'Wraps the provided content in HTML paragraph tags.',
    inputLabel: 'content',
  },
  sectionTitleH2: {
    zid: 'Z31465',
    label: 'section title (H2)',
    helper: 'Create a section title out of the given string. H2 subtitle. For H3 use Z33691.',
  },
  birthFromWikidataEn: {
    zid: 'Z36185',
    label: 'Birth sentence from Wikidata person, English',
    implementationZid: 'Z36187',
    implementationLabel: 'simple birth sentence from WD person, English',
    helper:
      'Given a Wikidata person item, fetches date of birth (P569) and place of birth (P19), then returns an English sentence in the form "[name] was born [date] in [place]."',
  },
} as const

function htmlWrapper(inner: object) {
  return {
    type: 'Function call',
    function: `${wikifunctions.htmlFragment.label} (${wikifunctions.htmlFragment.zid})`,
    arguments: { inner },
  }
}

export function paragraphWrapper(content: object) {
  return {
    type: 'Function call',
    function: `${wikifunctions.paragraph.label} (${wikifunctions.paragraph.zid})`,
    arguments: {
      content,
    },
  }
}

export function composeFragmentTree(innerCall: object) {
  return paragraphWrapper(htmlWrapper(innerCall))
}

export function composeFunctionLayers(card: HybridCardDefinition): string[] {
  if (card.kind === 'paragraph') {
    return [`${wikifunctions.paragraph.label} (${wikifunctions.paragraph.zid})`]
  }

  if (card.kind === 'section-heading') {
    return [`${card.functionName} (${card.functionZid})`]
  }

  const layers = [
    `${wikifunctions.paragraph.label} (${wikifunctions.paragraph.zid})`,
    `${wikifunctions.htmlFragment.label} (${wikifunctions.htmlFragment.zid})`,
    `${card.functionName} (${card.functionZid})`,
  ]

  if (card.implementationZid) {
    layers.push(
      `${card.implementationLabel ?? 'implementation'} (${card.implementationZid})`,
    )
  }

  return layers
}

export function isCardAvailableInAddSearch(
  card: HybridCardDefinition,
  sectionId: string,
): boolean {
  if (card.excludeLead && sectionId === 'lead') {
    return false
  }

  if (card.searchableEverywhere || card.addSearchOnly) {
    return true
  }

  return card.sectionId === sectionId
}

export const sectionHeadingFunction = {
  functionZid: wikifunctions.sectionTitleH2.zid,
  pattern: '[Section title]',
  helper: wikifunctions.sectionTitleH2.helper,
  functionName: wikifunctions.sectionTitleH2.label,
  fields: [
    { key: 'title', label: 'Section title', placeholder: 'Early life' },
  ],
  heading: (values: Record<string, string>) => values.title?.trim() || 'Untitled section',
  functionTree: {
    type: 'Function call',
    function: `${wikifunctions.sectionTitleH2.label} (${wikifunctions.sectionTitleH2.zid})`,
    arguments: {
      'Z31465K1': 'String(Early life)',
    },
  },
}

export const hybridCardCatalog: HybridCardDefinition[] = [
  {
    id: 'birthFromWikidata',
    informationLabel: 'Date and place of birth',
    sectionId: 'lead',
    pattern: '[Person] was born [date] in [place]',
    helper: wikifunctions.birthFromWikidataEn.helper,
    functionName: wikifunctions.birthFromWikidataEn.label,
    functionZid: wikifunctions.birthFromWikidataEn.zid,
    implementationZid: wikifunctions.birthFromWikidataEn.implementationZid,
    implementationLabel: wikifunctions.birthFromWikidataEn.implementationLabel,
    wikidataProperty: 'P569 date of birth · P19 place of birth',
    wikidataSuggestion: 'August 11, 1950 · San Jose, California',
    fields: [
      {
        key: 'person',
        label: 'Person',
        placeholder: articleSubject,
        wikidataSuggestion: articleSubject,
      },
      {
        key: 'date',
        label: 'Date of birth',
        placeholder: 'August 11, 1950',
        wikidataSuggestion: 'August 11, 1950',
      },
      {
        key: 'place',
        label: 'Place of birth',
        placeholder: 'San Jose, California',
        wikidataSuggestion: 'San Jose, California',
      },
      {
        key: 'language',
        label: 'Language',
        placeholder: 'English',
        wikidataSuggestion: 'English',
      },
    ],
    sentence: (values) => {
      const person = values.person?.split('(')[0].trim() || articleSubject
      const date = values.date?.trim() || 'August 11, 1950'
      const place = values.place?.trim() || 'San Jose, California'
      return `${person} was born ${date} in ${place}.`
    },
    functionTree: composeFragmentTree({
      type: 'Function call',
      function: `${wikifunctions.birthFromWikidataEn.label} (${wikifunctions.birthFromWikidataEn.zid})`,
      implementation: `${wikifunctions.birthFromWikidataEn.implementationLabel} (${wikifunctions.birthFromWikidataEn.implementationZid})`,
      arguments: {
        person: `Item(${articleQid})`,
        language: 'English (Z1002)',
        'from Wikidata P569': 'August 11, 1950',
        'from Wikidata P19': 'San Jose, California',
      },
    }),
  },
  {
    id: 'occupation',
    informationLabel: 'Occupation',
    sectionId: 'lead',
    pattern: '[Person] is a [class]',
    helper: 'Say what the topic is.',
    functionName: 'Article-less instantiating fragment',
    functionZid: 'Z10031',
    wikidataProperty: 'P106 occupation',
    wikidataSuggestion: 'software engineer',
    fields: [
      { key: 'entity', label: 'Person', placeholder: articleSubject, wikidataSuggestion: articleSubject },
      { key: 'class', label: 'Class or occupation', placeholder: 'software engineer', wikidataSuggestion: 'software engineer' },
    ],
    sentence: (values) => `${values.entity} is a ${values.class}.`,
    functionTree: composeFragmentTree({
      type: 'Function call',
      function: 'Article-less instantiating fragment (Z10031)',
      arguments: { entity: 'Entity(Steve Wozniak)', class: 'Class(software engineer)' },
    }),
  },
  {
    id: 'birthDate',
    informationLabel: 'Date of birth',
    sectionId: 'lead',
    pattern: '[Person] was born on [Date]',
    helper: 'A short birth-date sentence for the lead.',
    functionName: 'Date-of-birth statement',
    functionZid: 'Z20421',
    wikidataProperty: 'P569 date of birth',
    wikidataSuggestion: 'August 11, 1950',
    fields: [
      { key: 'entity', label: 'Person', placeholder: articleSubject, wikidataSuggestion: articleSubject },
      { key: 'date', label: 'Date', placeholder: 'August 11, 1950', wikidataSuggestion: 'August 11, 1950' },
    ],
    sentence: (values) => `${values.entity} was born on ${values.date}.`,
    functionTree: composeFragmentTree({
      type: 'Function call',
      function: 'Date-of-birth statement (Z20421)',
      arguments: {
        entity: 'Entity(Steve Wozniak)',
        date: {
          type: 'Function call',
          function: 'Format date',
          arguments: { month: 'August', day: '11', year: '1950' },
        },
      },
    }),
  },
  {
    id: 'placeOfBirth',
    informationLabel: 'Place of birth',
    sectionId: 'early-life',
    pattern: '[Person] was born in [Place]',
    helper: 'Where the topic was born.',
    functionName: 'Place-of-birth statement',
    functionZid: 'Z20420',
    wikidataProperty: 'P19 place of birth',
    wikidataSuggestion: 'San Jose, California',
    fields: [
      { key: 'entity', label: 'Person', placeholder: articleSubject, wikidataSuggestion: articleSubject },
      { key: 'place', label: 'Place', placeholder: 'San Jose, California', wikidataSuggestion: 'San Jose, California' },
    ],
    sentence: (values) => `${values.entity} was born in ${values.place}.`,
    functionTree: composeFragmentTree({
      type: 'Function call',
      function: 'Place-of-birth statement',
      arguments: {
        entity: 'Entity(Steve Wozniak)',
        place: 'Place(San Jose, California)',
      },
    }),
  },
  {
    id: 'education',
    informationLabel: 'Education',
    sectionId: 'early-life',
    pattern: '[Person] studied at [Institution]',
    helper: 'School or university attendance.',
    functionName: 'Education statement',
    functionZid: 'Z20440',
    wikidataProperty: 'P69 educated at',
    wikidataSuggestion: 'University of California, Berkeley',
    fields: [
      { key: 'entity', label: 'Person', placeholder: articleSubject, wikidataSuggestion: articleSubject },
      {
        key: 'institution',
        label: 'Institution',
        placeholder: 'University of California, Berkeley',
        wikidataSuggestion: 'University of California, Berkeley',
      },
    ],
    sentence: (values) => `${values.entity} studied at ${values.institution}.`,
    functionTree: composeFragmentTree({
      type: 'Function call',
      function: 'Education statement',
      arguments: {
        entity: 'Entity(Steve Wozniak)',
        institution: 'Institution(University of California, Berkeley)',
      },
    }),
  },
  {
    id: 'notableWork',
    informationLabel: 'Notable work',
    sectionId: 'career',
    pattern: '[Person] is a [role] of [Organization]',
    helper: 'Founding, creating, or leading something notable.',
    functionName: 'Defining role sentence',
    functionZid: 'Z20430',
    wikidataProperty: 'P800 notable work',
    wikidataSuggestion: 'Apple',
    fields: [
      { key: 'entity', label: 'Person', placeholder: articleSubject, wikidataSuggestion: articleSubject },
      { key: 'role', label: 'Role', placeholder: 'co-founder', wikidataSuggestion: 'co-founder' },
      { key: 'work', label: 'Organization', placeholder: 'Apple', wikidataSuggestion: 'Apple' },
    ],
    sentence: (values) => `${values.entity} is a ${values.role} of ${values.work}.`,
    functionTree: composeFragmentTree({
      type: 'Function call',
      function: 'Defining role sentence (Z20430)',
      arguments: {
        entity: 'Entity(Steve Wozniak)',
        role: 'Role(co-founder)',
        work: 'Work(Apple)',
      },
    }),
  },
  {
    id: 'award',
    informationLabel: 'Award',
    sectionId: 'career',
    pattern: '[Person] received the [Award]',
    helper: 'A notable prize or honor.',
    functionName: 'Award statement',
    functionZid: 'Z20450',
    wikidataProperty: 'P166 award received',
    wikidataSuggestion: 'National Medal of Technology',
    fields: [
      { key: 'entity', label: 'Person', placeholder: articleSubject, wikidataSuggestion: articleSubject },
      {
        key: 'award',
        label: 'Award',
        placeholder: 'National Medal of Technology',
        wikidataSuggestion: 'National Medal of Technology',
      },
    ],
    sentence: (values) => `${values.entity} received the ${values.award}.`,
    functionTree: composeFragmentTree({
      type: 'Function call',
      function: 'Award statement',
      arguments: {
        entity: 'Entity(Steve Wozniak)',
        award: 'Award(National Medal of Technology)',
      },
    }),
  },
  {
    id: 'paragraph',
    kind: 'paragraph',
    addSearchOnly: true,
    searchableEverywhere: true,
    informationLabel: 'Paragraph',
    sectionId: 'lead',
    pattern: '[Paragraph]',
    helper: wikifunctions.paragraph.helper,
    functionName: wikifunctions.paragraph.label,
    functionZid: wikifunctions.paragraph.zid,
    searchKeywords: ['paragraph', 'block', 'wrap', 'p tag'],
    wikidataProperty: 'HTML structure',
    wikidataSuggestion: '',
    fields: [
      {
        key: 'content',
        label: 'HTML fragment content',
        placeholder: 'Sentence or HTML fragment to wrap in <p>…</p>',
      },
    ],
    sentence: (values) => values.content?.trim() || '…',
    functionTree: {
      type: 'Function call',
      function: `${wikifunctions.paragraph.label} (${wikifunctions.paragraph.zid})`,
      arguments: {
        'Z32123K1': 'HTML fragment (Z89)',
      },
    },
  },
  {
    id: 'sectionTitle',
    kind: 'section-heading',
    addSearchOnly: true,
    searchableEverywhere: true,
    informationLabel: 'Section title',
    sectionId: 'early-life',
    pattern: '[Section title]',
    helper: wikifunctions.sectionTitleH2.helper,
    functionName: wikifunctions.sectionTitleH2.label,
    functionZid: wikifunctions.sectionTitleH2.zid,
    searchKeywords: ['section', 'title', 'heading', 'h2', 'subtitle', 'header'],
    wikidataProperty: 'Article structure',
    wikidataSuggestion: '',
    fields: [
      { key: 'title', label: 'Section title', placeholder: 'Early life' },
    ],
    sentence: (values) => values.title?.trim() || 'Untitled section',
    functionTree: {
      type: 'Function call',
      function: `${wikifunctions.sectionTitleH2.label} (${wikifunctions.sectionTitleH2.zid})`,
      arguments: {
        'Z31465K1': 'String(Early life)',
      },
    },
  },
]

const multilingualSentences: Record<PreviewLanguage, Record<string, (values: Record<string, string>) => string>> = {
  en: Object.fromEntries(hybridCardCatalog.map((card) => [card.id, card.sentence])),
  es: {
    birthFromWikidata: (v) => {
      const person = v.person?.split('(')[0].trim() || articleSubject
      const date = v.date?.trim() || '11 de agosto de 1950'
      const place = v.place?.trim() || 'San José, California'
      return `${person} nació el ${date} en ${place}.`
    },
    occupation: (v) => `${v.entity} es ingeniero de software.`,
    birthDate: (v) => `${v.entity} nació el ${v.date}.`,
    placeOfBirth: (v) => `${v.entity} nació en ${v.place}.`,
    education: (v) => `${v.entity} estudió en la ${v.institution}.`,
    notableWork: (v) => `${v.entity} es cofundador de ${v.work}.`,
    award: (v) => `${v.entity} recibió la ${v.award}.`,
  },
  de: {
    birthFromWikidata: (v) => {
      const person = v.person?.split('(')[0].trim() || articleSubject
      const date = v.date?.trim() || '11. August 1950'
      const place = v.place?.trim() || 'San Jose, Kalifornien'
      return `${person} wurde am ${date} in ${place} geboren.`
    },
    occupation: (v) => `${v.entity} ist Softwareentwickler.`,
    birthDate: (v) => `${v.entity} wurde am ${v.date} geboren.`,
    placeOfBirth: (v) => `${v.entity} wurde in ${v.place} geboren.`,
    education: (v) => `${v.entity} studierte an der ${v.institution}.`,
    notableWork: (v) => `${v.entity} ist Mitbegründer von ${v.work}.`,
    award: (v) => `${v.entity} erhielt die ${v.award}.`,
  },
}

export function getHybridCard(cardId: string): HybridCardDefinition | null {
  return hybridCardCatalog.find((card) => card.id === cardId) ?? null
}

export function hybridFragmentSentence(fragment: HybridFragment, language: PreviewLanguage = 'en'): string {
  const card = getHybridCard(fragment.cardId)
  if (!card) {
    return ''
  }

  const renderer = multilingualSentences[language][fragment.cardId] ?? card.sentence
  return renderer(fragment.values)
}

export function defaultValuesForHybridCard(card: HybridCardDefinition): Record<string, string> {
  return Object.fromEntries(
    card.fields.map((field) => [
      field.key,
      field.wikidataSuggestion ?? (field.key === 'entity' ? articleSubject : ''),
    ]),
  )
}

export function defaultValuesFromWikidata(card: HybridCardDefinition): Record<string, string> {
  return Object.fromEntries(
    card.fields.map((field) => [
      field.key,
      field.wikidataSuggestion ?? (field.key === 'entity' ? articleSubject : ''),
    ]),
  )
}

export function createDefaultWebCitation(): WebCitation {
  return {
    url: 'https://www.britannica.com/biography/Steve-Wozniak',
    pageTitle: 'Steve Wozniak | Biography, Apple, & Facts',
    websiteName: 'Encyclopaedia Britannica',
    accessDate: '4 October 2023',
    displayLanguage: 'en',
  }
}

export function formatWebCitationReference(citation: WebCitation): string {
  return `${citation.pageTitle}. ${citation.websiteName}. Retrieved ${citation.accessDate}. ${citation.url}`
}

export function citationKey(citation: WebCitation): string {
  return [
    citation.url,
    citation.pageTitle,
    citation.websiteName,
    citation.accessDate,
    citation.displayLanguage,
  ].join('|')
}

export function formatCitationForStructure(citation: WebCitation | null) {
  if (!citation) {
    return null
  }

  return {
    type: 'Function call',
    function: `${citeWebFunction.label} (${citeWebFunction.zid})`,
    URL: citation.url,
    'title of webpage': citation.pageTitle,
    'website name': citation.websiteName,
    'access date': citation.accessDate,
    'display language': citation.displayLanguage,
  }
}

export const informationTypes: FactDefinition[] = [
  {
    id: 'occupation',
    label: 'Occupation',
    section: 'Introduction',
    wikidataProperty: 'P106 occupation',
    functionName: 'Article-less instantiating fragment',
    fieldLabel: 'Occupation',
    wikidataSuggestion: 'software engineer',
    sentence: (entity, value) => `${entity} is a ${value}.`,
  },
  {
    id: 'birthDate',
    label: 'Date of birth',
    section: 'Introduction',
    wikidataProperty: 'P569 date of birth',
    functionName: 'Date-of-birth statement',
    fieldLabel: 'Date',
    wikidataSuggestion: 'August 11, 1950',
    sentence: (entity, value) => `${entity} was born on ${value}.`,
  },
  {
    id: 'placeOfBirth',
    label: 'Place of birth',
    section: 'Early life',
    wikidataProperty: 'P19 place of birth',
    functionName: 'Place-of-birth statement',
    fieldLabel: 'Place',
    wikidataSuggestion: 'San Jose, California',
    sentence: (entity, value) => `${entity} was born in ${value}.`,
  },
  {
    id: 'education',
    label: 'Education',
    section: 'Early life',
    wikidataProperty: 'P69 educated at',
    functionName: 'Education statement',
    fieldLabel: 'School or university',
    wikidataSuggestion: 'University of California, Berkeley',
    sentence: (entity, value) => `${entity} studied at ${value}.`,
  },
  {
    id: 'notableWork',
    label: 'Notable work',
    section: 'Career',
    wikidataProperty: 'P800 notable work',
    functionName: 'Defining role sentence',
    fieldLabel: 'Work or organization',
    wikidataSuggestion: 'Apple',
    sentence: (entity, value) => `${entity} is a co-founder of ${value}.`,
  },
  {
    id: 'award',
    label: 'Award',
    section: 'Awards',
    wikidataProperty: 'P166 award received',
    functionName: 'Award statement',
    fieldLabel: 'Award',
    wikidataSuggestion: 'National Medal of Technology',
    sentence: (entity, value) => `${entity} received the ${value}.`,
  },
]

export const fragmentCardCatalog: FragmentCardDefinition[] = [
  {
    id: 'intro',
    label: 'Basic introduction',
    helper: 'Use this when you want to say what the topic is.',
    functionName: 'Article-less instantiating fragment',
    fields: [
      { key: 'entity', label: 'Subject', defaultValue: articleSubject },
      { key: 'class', label: 'Class or occupation', defaultValue: 'software engineer' },
    ],
    sentence: (values) => `${values.entity} is a ${values.class}.`,
  },
  {
    id: 'birth',
    label: 'Date of birth',
    helper: 'Use this for a short birth-date sentence.',
    functionName: 'Date-of-birth statement',
    fields: [
      { key: 'entity', label: 'Subject', defaultValue: articleSubject },
      { key: 'date', label: 'Date', defaultValue: 'August 11, 1950' },
    ],
    sentence: (values) => `${values.entity} was born on ${values.date}.`,
  },
  {
    id: 'founder',
    label: 'Founder / notable work',
    helper: 'Use this when the topic is known for founding or creating something.',
    functionName: 'Defining role sentence',
    fields: [
      { key: 'entity', label: 'Subject', defaultValue: articleSubject },
      { key: 'role', label: 'Role', defaultValue: 'co-founder' },
      { key: 'work', label: 'Organization or work', defaultValue: 'Apple' },
    ],
    sentence: (values) => `${values.entity} is a ${values.role} of ${values.work}.`,
  },
]

export const sentenceTemplateCatalog: TemplateDefinition[] = [
  {
    id: 'intro',
    label: 'Occupation / class',
    pattern: '[Person] is a [class]',
    helper: 'Say what the topic is.',
    sectionId: 'lead',
    functionName: 'Article-less instantiating fragment',
    searchKeywords: ['occupation', 'engineer', 'is a', 'introduction', 'class', 'profession'],
    fields: [
      { key: 'entity', label: 'Person', placeholder: articleSubject, wikidataSuggestion: articleSubject },
      { key: 'class', label: 'Class or occupation', placeholder: 'software engineer', wikidataSuggestion: 'software engineer' },
    ],
    sentence: (values) => `${values.entity} is a ${values.class}.`,
  },
  {
    id: 'birth',
    label: 'Date of birth',
    pattern: '[Person] was born on [Date]',
    helper: 'A short birth-date sentence for the lead.',
    sectionId: 'lead',
    functionName: 'Date-of-birth statement',
    searchKeywords: ['born', 'birth', 'date', 'birthday'],
    fields: [
      { key: 'entity', label: 'Person', placeholder: articleSubject, wikidataSuggestion: articleSubject },
      { key: 'date', label: 'Date', placeholder: 'August 11, 1950', wikidataSuggestion: 'August 11, 1950' },
    ],
    sentence: (values) => `${values.entity} was born on ${values.date}.`,
  },
  {
    id: 'birthplace',
    label: 'Place of birth',
    pattern: '[Person] was born in [Place]',
    helper: 'Where the topic was born.',
    sectionId: 'early-life',
    functionName: 'Place-of-birth statement',
    searchKeywords: ['born in', 'birthplace', 'place', 'city'],
    fields: [
      { key: 'entity', label: 'Person', placeholder: articleSubject, wikidataSuggestion: articleSubject },
      { key: 'place', label: 'Place', placeholder: 'San Jose, California', wikidataSuggestion: 'San Jose, California' },
    ],
    sentence: (values) => `${values.entity} was born in ${values.place}.`,
  },
  {
    id: 'education',
    label: 'Education',
    pattern: '[Person] studied at [Institution]',
    helper: 'School or university attendance.',
    sectionId: 'early-life',
    functionName: 'Education statement',
    searchKeywords: ['studied', 'education', 'university', 'school', 'college'],
    fields: [
      { key: 'entity', label: 'Person', placeholder: articleSubject, wikidataSuggestion: articleSubject },
      {
        key: 'institution',
        label: 'Institution',
        placeholder: 'University of California, Berkeley',
        wikidataSuggestion: 'University of California, Berkeley',
      },
    ],
    sentence: (values) => `${values.entity} studied at ${values.institution}.`,
  },
  {
    id: 'founder',
    label: 'Role / organization',
    pattern: '[Person] is a [role] of [Organization]',
    helper: 'Founding, creating, or leading something notable.',
    sectionId: 'career',
    functionName: 'Defining role sentence',
    searchKeywords: ['co-founder', 'founder', 'apple', 'organization', 'company', 'created'],
    fields: [
      { key: 'entity', label: 'Person', placeholder: articleSubject, wikidataSuggestion: articleSubject },
      { key: 'role', label: 'Role', placeholder: 'co-founder', wikidataSuggestion: 'co-founder' },
      { key: 'work', label: 'Organization', placeholder: 'Apple', wikidataSuggestion: 'Apple' },
    ],
    sentence: (values) => `${values.entity} is a ${values.role} of ${values.work}.`,
  },
  {
    id: 'award',
    label: 'Award received',
    pattern: '[Person] received the [Award]',
    helper: 'A notable prize or honor.',
    sectionId: 'career',
    functionName: 'Award statement',
    searchKeywords: ['award', 'medal', 'prize', 'honor', 'received'],
    fields: [
      { key: 'entity', label: 'Person', placeholder: articleSubject, wikidataSuggestion: articleSubject },
      {
        key: 'award',
        label: 'Award',
        placeholder: 'National Medal of Technology',
        wikidataSuggestion: 'National Medal of Technology',
      },
    ],
    sentence: (values) => `${values.entity} received the ${values.award}.`,
  },
]
