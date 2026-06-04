import type { PrototypeHandoff } from '@/lib/handoff'

export const handoff: PrototypeHandoff = {
  slug: 'template-chrome',
  title: 'Template: Chrome',
  status: 'ready-for-engineering',
  prototypeRoute: '/template-chrome',
  goal: 'Demonstrate the chrome wrapper handoff workflow for designers and engineers.',
  approvedFlows: [
    'Visitor lands on a page with Vector-style header and footer',
    'Visitor reads the starter content in the main column',
  ],
  statesCovered: ['default', 'desktop chrome', 'mobile skin via ?skin=mobile'],
  codexComponents: [],
  dataNeeds: [],
  accessibilityNotes: ['Header landmarks use nav with aria-label Site'],
  prototypeShortcuts: ['Chrome tools are mocked and not wired to real MediaWiki'],
  engineeringQuestions: [
    'Should this pattern live in a MediaWiki extension or core ResourceLoader module?',
  ],
  acceptanceCriteria: [
    'Chrome matches Vector / Minerva layout expectations',
    'Engineer Mode can inspect annotated elements on the prototype',
  ],
}
