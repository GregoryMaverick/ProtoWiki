export type PuzzleBlockType =
  | 'Entity'
  | 'Class'
  | 'Date'
  | 'Work'
  | 'Place'
  | 'Award'
  | 'Text'
  | 'HtmlFragment'

export interface PuzzleValueBlock {
  id: string
  label: string
  type: PuzzleBlockType
}

export interface PuzzleSlot {
  key: string
  expectedType: PuzzleBlockType
  label: string
}

export interface PuzzleBlockTemplate {
  id: string
  label: string
  functionName: string
  /** Type this block outputs when all slots are filled. */
  outputType: PuzzleBlockType
  /** If true, can be added to the root canvas as a top-level fragment. */
  rootCapable: boolean
  /** If true, appears in the function palette for dragging into slots. */
  nestable: boolean
  slots: PuzzleSlot[]
  resolve: (values: Record<string, string>) => string
}

export type PuzzleSlotContent =
  | { kind: 'literal'; value: PuzzleValueBlock }
  | { kind: 'block'; block: ActivePuzzleBlock }

export interface PuzzleBlockCitation {
  url: string
  pageTitle: string
  websiteName: string
  accessDate: string
  displayLanguage: string
}

export interface ActivePuzzleBlock {
  id: string
  templateId: string
  filledSlots: Record<string, PuzzleSlotContent>
  citation: PuzzleBlockCitation | null
  citationExpanded?: boolean
}

export type PuzzleDragPayload =
  | { kind: 'literal'; value: PuzzleValueBlock }
  | { kind: 'template'; template: PuzzleBlockTemplate }

export function createPuzzleBlockId(): string {
  return `puzzle-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function createEmptyPuzzleBlock(templateId: string): ActivePuzzleBlock {
  return {
    id: createPuzzleBlockId(),
    templateId,
    filledSlots: {},
    citation: null,
  }
}

export function getSlotContentType(
  content: PuzzleSlotContent,
  getTemplate: (id: string) => PuzzleBlockTemplate | undefined,
): PuzzleBlockType | null {
  if (content.kind === 'literal') {
    return content.value.type
  }

  return getTemplate(content.block.templateId)?.outputType ?? null
}

export function resolveSlotContent(
  content: PuzzleSlotContent,
  getTemplate: (id: string) => PuzzleBlockTemplate | undefined,
): string {
  if (content.kind === 'literal') {
    return content.value.label
  }

  return resolveBlockOutput(content.block, getTemplate)
}

export function resolveBlockOutput(
  block: ActivePuzzleBlock,
  getTemplate: (id: string) => PuzzleBlockTemplate | undefined,
): string {
  const template = getTemplate(block.templateId)
  if (!template) {
    return ''
  }

  const values: Record<string, string> = {}
  for (const slot of template.slots) {
    const content = block.filledSlots[slot.key]
    values[slot.key] = content ? resolveSlotContent(content, getTemplate) : ''
  }

  return template.resolve(values)
}

export function isSlotContentComplete(
  content: PuzzleSlotContent | undefined,
  expectedType: PuzzleBlockType,
  getTemplate: (id: string) => PuzzleBlockTemplate | undefined,
): boolean {
  if (!content) {
    return false
  }

  if (content.kind === 'literal') {
    return content.value.type === expectedType
  }

  return isBlockComplete(content.block, getTemplate)
}

export function isBlockComplete(
  block: ActivePuzzleBlock,
  getTemplate: (id: string) => PuzzleBlockTemplate | undefined,
): boolean {
  const template = getTemplate(block.templateId)
  if (!template) {
    return false
  }

  return template.slots.every((slot) =>
    isSlotContentComplete(block.filledSlots[slot.key], slot.expectedType, getTemplate),
  )
}

export function serializeBlockStructure(
  block: ActivePuzzleBlock,
  getTemplate: (id: string) => PuzzleBlockTemplate | undefined,
): Record<string, unknown> {
  const template = getTemplate(block.templateId)
  const args: Record<string, unknown> = {}

  for (const slot of template?.slots ?? []) {
    const content = block.filledSlots[slot.key]
    if (!content) {
      continue
    }

    if (content.kind === 'literal') {
      args[slot.key] = { literal: content.value.label, type: content.value.type }
    } else {
      args[slot.key] = serializeBlockStructure(content.block, getTemplate)
    }
  }

  return {
    function: template?.functionName,
    template: template?.label,
    arguments: args,
    output: resolveBlockOutput(block, getTemplate),
  }
}
