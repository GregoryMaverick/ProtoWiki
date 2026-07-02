<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  CdxButton,
  CdxDialog,
  CdxField,
  CdxMessage,
  CdxRadio,
  CdxTextInput,
} from '@wikimedia/codex'

import type { DateSourceMode, FragmentTreeNode } from './lead-section-fixture'
import {
  getFragmentFieldValue,
  replaceHelperFunction,
  setDateSourceMode,
  setFragmentFieldValue,
  type BirthFragmentState,
} from './lead-section-fixture'
import { useLeadSectionContext } from './use-lead-section'

defineOptions({ name: 'FragmentNestedTreeNode' })

const props = defineProps<{
  node: FragmentTreeNode
  focusedFieldKey?: string | null
  showHelpers?: boolean
  isCollapsed: (id: string) => boolean
  toggleCollapse: (id: string) => void
}>()

const { activeFragment, setHighlight } = useLeadSectionContext()

const replaceDialogOpen = ref(false)
const replaceNotice = ref<string | null>(null)

const hasChildren = Boolean(props.node.children?.length)
const collapsed = () => props.isCollapsed(props.node.id)

const isEditableSlot = computed(
  () => Boolean(props.node.editableSlot && props.node.fieldKey),
)

const isDateSlot = computed(
  () => props.node.fieldKey === 'date' && activeFragment.value.id === 'birth',
)

const fieldValue = computed({
  get() {
    if (!props.node.fieldKey) {
      return ''
    }

    return getFragmentFieldValue(activeFragment.value, props.node.fieldKey)
  },
  set(value: string) {
    if (!props.node.fieldKey) {
      return
    }

    setFragmentFieldValue(activeFragment.value, props.node.fieldKey, value)
  },
})

const birthDateSource = computed({
  get() {
    if (activeFragment.value.id !== 'birth') {
      return 'wikidata' as DateSourceMode
    }

    return activeFragment.value.dateSourceMode
  },
  set(value: DateSourceMode) {
    if (activeFragment.value.id === 'birth') {
      setDateSourceMode(activeFragment.value, value)
    }
  },
})

const slotError = computed(() => {
  if (!props.node.fieldKey || !activeFragment.value.previewError) {
    return null
  }

  if (props.node.fieldKey === 'date' && activeFragment.value.id === 'birth') {
    return activeFragment.value.previewError
  }

  return null
})

const dateSourceOptions: { label: string; value: DateSourceMode }[] = [
  { label: 'From Wikidata', value: 'wikidata' },
  { label: 'Enter manually', value: 'manual' },
]

function layerClass(layer: FragmentTreeNode['layer']) {
  return `nested-tree-node--${layer}`
}

function onFieldFocus() {
  if (!props.node.fieldKey) {
    return
  }

  setHighlight(props.node.fieldKey)
}

function onFieldBlur() {
  setHighlight(null)
}

function insertInvalidDateDemo() {
  if (activeFragment.value.id !== 'birth' || props.node.fieldKey !== 'date') {
    return
  }

  const fragment = activeFragment.value as BirthFragmentState
  setDateSourceMode(fragment, 'manual')
  setFragmentFieldValue(fragment, 'date', 'not a date')
}

const displayChildren = () => {
  if (!props.node.children?.length || collapsed()) {
    return []
  }

  if (props.showHelpers === false) {
    return props.node.children.filter((child) => child.layer !== 'helper' && child.layer !== 'zid')
  }

  return props.node.children
}

function openReplaceDialog() {
  replaceDialogOpen.value = true
}

function confirmReplace(alternativeId: string) {
  if (!props.node.fieldKey) {
    return
  }

  replaceHelperFunction(activeFragment.value, props.node.fieldKey, alternativeId)
  const alternative = props.node.helperAlternatives?.find((item) => item.id === alternativeId)

  if (alternative) {
    replaceNotice.value = `Replaced with ${alternative.label} (${alternative.zid}).`
  }

  replaceDialogOpen.value = false
}

const replacePrimaryAction = {
  label: 'Close',
  actionType: 'default' as const,
}
</script>

<template>
  <li class="nested-tree-node" :class="layerClass(node.layer)">
    <div class="nested-tree-node__row">
      <button
        v-if="hasChildren"
        type="button"
        class="nested-tree-node__collapse"
        :aria-label="collapsed() ? 'Expand helpers' : 'Collapse helpers'"
        @click="toggleCollapse(node.id)"
      >
        {{ collapsed() ? '▸' : '▾' }}
      </button>
      <span v-else class="nested-tree-node__collapse nested-tree-node__collapse--spacer" />

      <div
        class="nested-tree-node__label-block"
        :class="{
          'nested-tree-node__label-block--focused':
            node.fieldKey && node.fieldKey === focusedFieldKey,
        }"
      >
        <span class="nested-tree-node__label">{{ node.label }}</span>
        <span v-if="node.zid" class="nested-tree-node__meta">{{ node.zid }}</span>
        <span v-if="node.outputType" class="nested-tree-node__meta">→ {{ node.outputType }}</span>
        <span v-if="node.expectedType" class="nested-tree-node__meta">expects {{ node.expectedType }}</span>
      </div>

      <span class="nested-tree-node__layer">{{ node.layer }}</span>
    </div>

    <div v-if="isEditableSlot" class="nested-tree-node__slot-editor">
      <CdxField>
        <template #label>Value</template>
        <CdxTextInput
          v-model="fieldValue"
          @focus="onFieldFocus"
          @blur="onFieldBlur"
        />
      </CdxField>

      <div v-if="isDateSlot" class="date-source-row">
        <span class="date-source-row__label">Date source:</span>
        <CdxRadio
          v-for="option in dateSourceOptions"
          :key="option.value"
          v-model="birthDateSource"
          :input-value="option.value"
          name="date-source"
        >
          {{ option.label }}
        </CdxRadio>
        <CdxButton weight="quiet" @click="insertInvalidDateDemo">Demo invalid date</CdxButton>
      </div>

      <CdxMessage v-if="slotError" type="error">{{ slotError }}</CdxMessage>
    </div>

    <div v-if="node.replaceable && node.helperAlternatives?.length" class="nested-tree-node__helper-actions">
      <CdxButton weight="quiet" @click="openReplaceDialog">Replace function…</CdxButton>
      <CdxMessage v-if="replaceNotice" type="success" class="nested-tree-node__replace-notice">
        {{ replaceNotice }}
      </CdxMessage>
    </div>

    <ul v-if="displayChildren().length" class="nested-tree-node__children">
      <FragmentNestedTreeNode
        v-for="child in displayChildren()"
        :key="child.id"
        :node="child"
        :focused-field-key="focusedFieldKey"
        :show-helpers="showHelpers"
        :is-collapsed="isCollapsed"
        :toggle-collapse="toggleCollapse"
      />
    </ul>

    <CdxDialog
      v-model:open="replaceDialogOpen"
      :title="`Replace function for ${node.label}`"
      close-button-label="Cancel"
      :dismissable="true"
      :primary-action="replacePrimaryAction"
      @primary="replaceDialogOpen = false"
    >
      <p>Choose a compatible function for this slot. Type constraints are mocked in this prototype.</p>
      <ul class="replace-list">
        <li v-for="alternative in node.helperAlternatives" :key="alternative.id">
          <CdxButton weight="normal" @click="confirmReplace(alternative.id)">
            {{ alternative.label }}
            <span class="replace-list__zid">({{ alternative.zid }})</span>
          </CdxButton>
        </li>
      </ul>
    </CdxDialog>
  </li>
</template>

<style scoped>
.nested-tree-node {
  list-style: none;
  margin-bottom: var(--spacing-75);
}

.nested-tree-node__row {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-50);
}

.nested-tree-node__collapse {
  flex: 0 0 1.25rem;
  border: 0;
  background: transparent;
  color: var(--color-subtle);
  cursor: pointer;
  padding: 0;
  line-height: 1.4;
}

.nested-tree-node__collapse--spacer {
  display: inline-block;
}

.nested-tree-node__label-block {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--spacing-50);
  border: 1px solid transparent;
  border-radius: var(--border-radius-base);
  padding: var(--spacing-25) var(--spacing-50);
}

.nested-tree-node__label-block--focused {
  border-color: var(--border-color-progressive);
  background-color: var(--background-color-progressive-subtle);
}

.nested-tree-node__label {
  font-weight: var(--font-weight-bold);
}

.nested-tree-node__meta {
  font-size: var(--font-size-small);
  color: var(--color-subtle);
}

.nested-tree-node__layer {
  flex: 0 0 auto;
  font-size: var(--font-size-small);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-subtle);
}

.nested-tree-node__slot-editor {
  margin: var(--spacing-75) 0 var(--spacing-75) calc(1.25rem + var(--spacing-50));
  padding: var(--spacing-100);
  border: 1px solid var(--border-color-subtle);
  border-radius: var(--border-radius-base);
  background-color: var(--background-color-base);
}

.nested-tree-node__helper-actions {
  margin: var(--spacing-50) 0 var(--spacing-50) calc(1.25rem + var(--spacing-50));
}

.nested-tree-node__replace-notice {
  margin-top: var(--spacing-50);
}

.nested-tree-node__children {
  list-style: none;
  margin: var(--spacing-50) 0 0 var(--spacing-150);
  padding-left: var(--spacing-100);
  border-left: 2px solid var(--border-color-subtle);
}

.nested-tree-node--meaning .nested-tree-node__label {
  color: var(--color-progressive);
}

.nested-tree-node--wrapper .nested-tree-node__label {
  color: var(--color-subtle);
}

.date-source-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-75);
  margin-top: var(--spacing-75);
}

.date-source-row__label {
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.replace-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.replace-list li {
  margin-bottom: var(--spacing-50);
}

.replace-list__zid {
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}
</style>
