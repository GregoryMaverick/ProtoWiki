<script setup lang="ts">
import { CdxField, CdxTextInput } from '@wikimedia/codex'

import type { FragmentTreeNode, TreeNodeLayer } from './fragment-fixture'
import { useFragmentEditorContext } from './use-fragment-fixture'

defineOptions({ name: 'FragmentTreeBranch' })

defineProps<{
  node: FragmentTreeNode
  depth: number
  showZids: boolean
}>()

const emit = defineEmits<{
  'focus-field': [key: 'person' | 'date' | 'place']
  'blur-field': []
}>()

const { fixture } = useFragmentEditorContext()

function layerClass(layer: TreeNodeLayer) {
  return `tree-node--${layer}`
}
</script>

<template>
  <div
    class="tree-node"
    :class="[layerClass(node.layer), { 'tree-node--nested': depth > 0 }]"
    :style="{ marginLeft: `${depth * 16}px` }"
    role="treeitem"
  >
    <div class="tree-node__row">
      <span class="tree-node__label">{{ node.label }}</span>
      <span v-if="showZids && node.zid" class="tree-node__zid">{{ node.zid }}</span>
      <span v-if="node.outputType" class="tree-node__type">→ {{ node.outputType }}</span>
    </div>

    <div v-if="node.fieldKey" class="tree-node__field">
      <CdxField>
        <template #label>{{ node.label }}</template>
        <CdxTextInput
          v-model="fixture[node.fieldKey]"
          @focus="emit('focus-field', node.fieldKey)"
          @blur="emit('blur-field')"
        />
      </CdxField>
    </div>
    <p v-else-if="node.value" class="tree-node__value">{{ node.value }}</p>

    <FragmentTreeBranch
      v-for="child in node.children"
      :key="child.id"
      :node="child"
      :depth="depth + 1"
      :show-zids="showZids"
      @focus-field="emit('focus-field', $event)"
      @blur-field="emit('blur-field')"
    />
  </div>
</template>

<style scoped>
.tree-node {
  margin-bottom: var(--spacing-75);
  padding: var(--spacing-50) var(--spacing-75);
  border-radius: var(--border-radius-base);
}

.tree-node--meaning {
  background-color: var(--background-color-success-subtle);
}

.tree-node--function {
  background-color: var(--background-color-neutral-subtle);
}

.tree-node--wrapper {
  background-color: var(--background-color-base);
  border: 1px dashed var(--border-color-subtle);
}

.tree-node--helper {
  background-color: var(--background-color-progressive-subtle);
}

.tree-node__row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--spacing-50);
}

.tree-node__label {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-small);
}

.tree-node__zid {
  font-family: var(--font-family-monospace, monospace);
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.tree-node__type {
  margin-left: auto;
  font-size: var(--font-size-small);
  color: var(--color-subtle);
}

.tree-node__value {
  margin: var(--spacing-50) 0 0;
  font-size: var(--font-size-small);
  color: var(--color-subtle);
}

.tree-node__field {
  margin-top: var(--spacing-50);
}
</style>
