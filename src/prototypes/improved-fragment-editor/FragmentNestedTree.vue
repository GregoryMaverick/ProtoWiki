<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import FragmentNestedTreeNode from './FragmentNestedTreeNode.vue'
import type { FragmentTreeNode } from './lead-section-fixture'

const props = defineProps<{
  nodes: FragmentTreeNode[]
  showWrappers?: boolean
  showHelpers?: boolean
  focusedFieldKey?: string | null
}>()

const collapsed = ref<Record<string, boolean>>({})

function collectDefaultCollapsedIds(nodes: FragmentTreeNode[]): string[] {
  const ids: string[] = []

  for (const node of nodes) {
    if (node.layer === 'helper' || node.layer === 'zid' || node.layer === 'wrapper') {
      ids.push(node.id)
    }

    if (node.children?.length) {
      ids.push(...collectDefaultCollapsedIds(node.children))
    }
  }

  return ids
}

function applyDefaultCollapse(nodes: FragmentTreeNode[]) {
  const next: Record<string, boolean> = { ...collapsed.value }

  for (const id of collectDefaultCollapsedIds(nodes)) {
    next[id] = true
  }

  collapsed.value = next
}

watch(
  () => props.nodes,
  (nodes) => {
    applyDefaultCollapse(nodes)
  },
  { immediate: true },
)

function filterNode(node: FragmentTreeNode): FragmentTreeNode | null {
  if (node.layer === 'wrapper' && !props.showWrappers) {
    if (node.children?.length) {
      const children = node.children
        .map((child) => filterNode(child))
        .filter((child): child is FragmentTreeNode => child !== null)

      if (children.length === 1) {
        return children[0]
      }

      return children.length
        ? { ...node, children }
        : null
    }

    return null
  }

  const children = node.children
    ?.map((child) => filterNode(child))
    .filter((child): child is FragmentTreeNode => child !== null)

  return {
    ...node,
    children: children?.length ? children : undefined,
  }
}

const visibleNodes = computed(() => {
  return props.nodes
    .map((node) => filterNode(node))
    .filter((node): node is FragmentTreeNode => node !== null)
})

function isCollapsed(id: string) {
  return collapsed.value[id] ?? false
}

function toggleCollapse(id: string) {
  collapsed.value[id] = !isCollapsed(id)
}
</script>

<template>
  <ul class="nested-tree">
    <FragmentNestedTreeNode
      v-for="node in visibleNodes"
      :key="node.id"
      :node="node"
      :focused-field-key="focusedFieldKey"
      :show-helpers="showHelpers"
      :is-collapsed="isCollapsed"
      :toggle-collapse="toggleCollapse"
    />
  </ul>
</template>

<style scoped>
.nested-tree {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
