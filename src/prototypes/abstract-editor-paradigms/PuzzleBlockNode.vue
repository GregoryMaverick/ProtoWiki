<script setup lang="ts">
import { computed, inject } from 'vue'
import { CdxButton } from '@wikimedia/codex'

import CitationEditorPanel from './CitationEditorPanel.vue'
import type {
  ActivePuzzleBlock,
  PuzzleBlockTemplate,
  PuzzleDragPayload,
  PuzzleSlot,
} from './puzzle-types'
import { isBlockComplete, resolveBlockOutput } from './puzzle-types'

interface PuzzleContext {
  getTemplate: (id: string) => PuzzleBlockTemplate | undefined
  dragPayload: { value: PuzzleDragPayload | null }
  canDropOnSlot: (expectedType: PuzzleBlockTemplate['outputType']) => boolean
  dropOnSlot: (block: ActivePuzzleBlock, slotKey: string, expectedType: PuzzleBlockTemplate['outputType']) => void
  removeSlotContent: (block: ActivePuzzleBlock, slotKey: string) => void
  citationFields: { key: string; label: string; inputType?: 'text' | 'url' }[]
  attachCitation: (host: ActivePuzzleBlock) => void
  removeCitation: (host: ActivePuzzleBlock) => void
}

const props = defineProps<{
  block: ActivePuzzleBlock
  depth?: number
  isRoot?: boolean
}>()

const emit = defineEmits<{
  remove: []
}>()

const puzzle = inject<PuzzleContext>('puzzleContext')
if (!puzzle) {
  throw new Error('PuzzleBlockNode requires puzzleContext')
}

const depth = computed(() => props.depth ?? 0)
const template = computed(() => puzzle.getTemplate(props.block.templateId))
const slots = computed((): PuzzleSlot[] => template.value?.slots ?? [])
const complete = computed(() => isBlockComplete(props.block, puzzle.getTemplate))
const outputPreview = computed(() => resolveBlockOutput(props.block, puzzle.getTemplate))

function slotIsActive(slot: PuzzleSlot): boolean {
  if (props.block.filledSlots[slot.key]) {
    return false
  }

  return puzzle.canDropOnSlot(slot.expectedType)
}

function slotContentLabel(slotKey: string): string {
  const content = props.block.filledSlots[slotKey]
  if (!content) {
    return ''
  }

  if (content.kind === 'literal') {
    return content.value.label
  }

  return puzzle.getTemplate(content.block.templateId)?.label ?? 'Nested block'
}

function onSlotDragover(event: DragEvent, slot: PuzzleSlot) {
  if (!slotIsActive(slot)) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
}

function onSlotDrop(event: DragEvent, slot: PuzzleSlot) {
  if (!slotIsActive(slot)) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  puzzle.dropOnSlot(props.block, slot.key, slot.expectedType)
}
</script>

<template>
  <article
    class="puzzle-fn-block"
    :class="{
      'puzzle-fn-block--root': isRoot,
      'puzzle-fn-block--nested': !isRoot,
      'puzzle-fn-block--complete': complete,
    }"
    :style="{ '--puzzle-depth': depth }"
  >
    <header class="puzzle-fn-block__header">
      <div>
        <p class="puzzle-fn-block__type">
          {{ template?.outputType }}<span v-if="!isRoot"> · nest {{ depth }}</span>
        </p>
        <h4 class="puzzle-fn-block__title">{{ template?.label }}</h4>
        <p class="puzzle-fn-block__fn">{{ template?.functionName }}</p>
      </div>
      <CdxButton
        v-if="isRoot"
        weight="quiet"
        action="destructive"
        @click="emit('remove')"
      >
        Remove
      </CdxButton>
      <button
        v-else
        class="puzzle-value-block__remove puzzle-nested-remove"
        type="button"
        aria-label="Remove nested block"
        @click="emit('remove')"
      >
        ×
      </button>
    </header>

    <div class="puzzle-fn-block__slots">
      <div
        v-for="slot in slots"
        :key="slot.key"
        class="puzzle-slot"
        :class="{
          'puzzle-slot--filled': block.filledSlots[slot.key],
          'puzzle-slot--active': slotIsActive(slot),
        }"
      >
        <span class="puzzle-slot__label">{{ slot.label }} · {{ slot.expectedType }}</span>

        <div
          v-if="block.filledSlots[slot.key]?.kind === 'literal'"
          class="puzzle-value-block puzzle-value-block--in-slot"
        >
          <span class="puzzle-value-block__type">{{ block.filledSlots[slot.key].value.type }}</span>
          <span class="puzzle-value-block__label">{{ slotContentLabel(slot.key) }}</span>
          <button
            class="puzzle-value-block__remove"
            type="button"
            aria-label="Remove block"
            @click="puzzle.removeSlotContent(block, slot.key)"
          >
            ×
          </button>
        </div>

        <div
          v-else-if="block.filledSlots[slot.key]?.kind === 'block'"
          class="puzzle-slot__nested"
          @dragover.stop
          @drop.stop
        >
          <PuzzleBlockNode
            :block="block.filledSlots[slot.key].block"
            :depth="depth + 1"
            @remove="puzzle.removeSlotContent(block, slot.key)"
          />
        </div>

        <div
          v-else
          class="puzzle-slot__dropzone"
          @dragover="onSlotDragover($event, slot)"
          @drop="onSlotDrop($event, slot)"
        >
          Drop {{ slot.expectedType }} literal or function block
        </div>
      </div>
    </div>

    <p v-if="complete && isRoot" class="card-output">{{ outputPreview }}</p>

    <div v-if="complete && isRoot">
      <div v-if="!block.citation" class="citation-actions">
        <CdxButton action="default" weight="normal" @click="puzzle.attachCitation(block)">
          Add citation
        </CdxButton>
      </div>
      <CitationEditorPanel
        v-else
        v-model:citation="block.citation"
        v-model:expanded="block.citationExpanded"
        :fields="puzzle.citationFields"
        @remove="puzzle.removeCitation(block)"
      />
    </div>
  </article>
</template>

<style scoped>
.puzzle-fn-block {
  --puzzle-indent: calc(var(--puzzle-depth, 0) * var(--spacing-75));
  margin-left: var(--puzzle-indent);
  border: 2px solid var(--border-color-base);
  border-radius: var(--border-radius-base);
  background-color: var(--background-color-base);
  padding: var(--spacing-75);
}

.puzzle-fn-block--root {
  margin-left: 0;
  border-color: var(--border-color-progressive);
}

.puzzle-fn-block--nested {
  margin-top: var(--spacing-50);
  border-style: dashed;
  background-color: var(--background-color-neutral-subtle);
}

.puzzle-fn-block--complete.puzzle-fn-block--nested {
  border-color: var(--border-color-success);
}

.puzzle-fn-block__header {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-100);
  margin-bottom: var(--spacing-75);
}

.puzzle-fn-block__type {
  margin: 0;
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-subtle);
}

.puzzle-fn-block__title {
  margin: var(--spacing-25) 0 0;
  font-size: var(--font-size-medium);
}

.puzzle-fn-block__fn {
  margin: var(--spacing-25) 0 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.puzzle-fn-block__slots {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75);
}

.puzzle-slot {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-25);
}

.puzzle-slot__label {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  color: var(--color-subtle);
}

.puzzle-slot__dropzone {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: var(--spacing-50);
  border: 2px dashed var(--border-color-subtle);
  border-radius: var(--border-radius-base);
  color: var(--color-placeholder);
  font-size: var(--font-size-small);
  transition: border-color 0.15s, background-color 0.15s, color 0.15s;
}

.puzzle-slot--active .puzzle-slot__dropzone {
  border-color: var(--border-color-progressive);
  background-color: var(--background-color-progressive-subtle);
  color: var(--color-progressive);
}

.puzzle-value-block {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-50);
  padding: var(--spacing-25) var(--spacing-75);
  border-radius: var(--border-radius-base);
  background-color: var(--background-color-interactive-subtle);
  border: 1px solid var(--border-color-interactive);
  font-size: var(--font-size-small);
}

.puzzle-value-block--in-slot {
  background-color: var(--background-color-base);
  border-color: var(--border-color-base);
}

.puzzle-value-block__type {
  font-weight: var(--font-weight-bold);
  color: var(--color-subtle);
  font-size: 0.85em;
  text-transform: uppercase;
}

.puzzle-value-block__remove,
.puzzle-nested-remove {
  background: none;
  border: none;
  padding: 0 var(--spacing-25);
  margin-left: var(--spacing-25);
  color: var(--color-destructive);
  cursor: pointer;
  font-size: 1.2em;
  line-height: 1;
}

.puzzle-slot__nested {
  position: relative;
}

.card-output {
  border-left: 4px solid var(--border-color-progressive);
  margin: var(--spacing-100) 0 0;
  padding: var(--spacing-75) var(--spacing-100);
  background-color: var(--background-color-progressive-subtle);
}

.citation-actions {
  margin-top: var(--spacing-75);
}
</style>
