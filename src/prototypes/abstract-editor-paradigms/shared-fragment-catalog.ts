import { reactive } from 'vue'

import { fragmentCardCatalog, type FragmentCardDefinition } from './mock-registry'

export const extendedFragmentCatalog = reactive<FragmentCardDefinition[]>([
  ...fragmentCardCatalog,
])

export function promoteFragmentCard(card: FragmentCardDefinition) {
  extendedFragmentCatalog.push(card)
}

export function getFragmentCardById(cardId: string) {
  return extendedFragmentCatalog.find((card) => card.id === cardId) ?? null
}
