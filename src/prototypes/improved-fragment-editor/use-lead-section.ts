import { inject, type InjectionKey, type Ref } from 'vue'

import type { FragmentCardDefinition } from '../abstract-editor-paradigms/mock-registry'
import type { FragmentId, LeadFragmentState, LeadSectionState } from './lead-section-fixture'

export interface LeadSectionContext {
  section: LeadSectionState
  activeFragmentId: Ref<FragmentId>
  activeFragment: Ref<LeadFragmentState>
  highlightKey: Ref<string | null>
  setHighlight: (key: string | null) => void
  setActiveFragment: (id: FragmentId) => void
  attachCitation: () => void
  removeCitation: () => void
  promoteFragment: (payload: FragmentCardDefinition) => void
  promotedMessage: Ref<string | null>
  goToFragments: () => void
}

export const leadSectionContextKey: InjectionKey<LeadSectionContext> =
  Symbol('leadSectionContext')

export function useLeadSectionContext(): LeadSectionContext {
  const context = inject(leadSectionContextKey)

  if (!context) {
    throw new Error('Lead section context is missing. Wrap in FragmentEditorShell.')
  }

  return context
}
