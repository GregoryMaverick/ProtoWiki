import { inject, type InjectionKey, type Ref } from 'vue'

import type { BirthFragmentFixture, FragmentFieldKey } from './fragment-fixture'

export interface FragmentEditorContext {
  fixture: BirthFragmentFixture
  highlightKey: Ref<FragmentFieldKey | null>
  setHighlight: (key: FragmentFieldKey | null) => void
  attachCitation: () => void
  removeCitation: () => void
}

export const fragmentEditorContextKey: InjectionKey<FragmentEditorContext> =
  Symbol('fragmentEditorContext')

export function useFragmentEditorContext(): FragmentEditorContext {
  const context = inject(fragmentEditorContextKey)

  if (!context) {
    throw new Error('Fragment editor context is missing. Wrap in FragmentEditorWorkbench.')
  }

  return context
}
