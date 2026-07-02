<script setup lang="ts">
import { computed, ref } from 'vue'

import { CdxButton, CdxCheckbox } from '@wikimedia/codex'

import CitationEditorPanel from './CitationEditorPanel.vue'
import FragmentTreeBranch from './FragmentTreeBranch.vue'
import {
  buildFragmentTree,
  type FragmentTreeNode,
  type TreeNodeLayer,
} from './fragment-fixture'
import { citationFields } from './mock-registry'
import { useFragmentEditorContext } from './use-fragment-fixture'

const { fixture, setHighlight, attachCitation, removeCitation } = useFragmentEditorContext()

const filters = ref<Record<TreeNodeLayer, boolean>>({
  meaning: true,
  function: true,
  wrapper: false,
  zid: false,
  helper: false,
})

const tree = computed(() => buildFragmentTree(fixture))

function layerVisible(layer: TreeNodeLayer): boolean {
  return filters.value[layer]
}

function filterTree(nodes: FragmentTreeNode[]): FragmentTreeNode[] {
  const result: FragmentTreeNode[] = []

  for (const node of nodes) {
    if (layerVisible(node.layer)) {
      const children = node.children ? filterTree(node.children) : undefined

      result.push({
        ...node,
        children: children?.length ? children : undefined,
      })
    } else if (node.children?.length) {
      result.push(...filterTree(node.children))
    }
  }

  return result
}

const filteredTree = computed(() => filterTree(tree.value))

const filterOptions: { key: TreeNodeLayer; label: string }[] = [
  { key: 'meaning', label: 'Show article meaning' },
  { key: 'function', label: 'Show function calls' },
  { key: 'wrapper', label: 'Show wrappers' },
  { key: 'zid', label: 'Show raw ZIDs' },
  { key: 'helper', label: 'Show helper functions' },
]

function onNodeFocus(fieldKey: 'person' | 'date' | 'place') {
  setHighlight(fieldKey)
}

function onNodeBlur() {
  setHighlight(null)
}
</script>

<template>
  <div class="filtered-tree">
    <header class="panel-heading">
      <p class="eyebrow">Idea 6</p>
      <h2>Layered tree + filters</h2>
      <p>Keep the tree, but toggle which layers are visible — meaning, wrappers, ZIDs, helpers.</p>
    </header>

    <fieldset class="filtered-tree__filters">
      <legend>Visible layers</legend>
      <label v-for="option in filterOptions" :key="option.key" class="filtered-tree__filter">
        <CdxCheckbox v-model="filters[option.key]" />
        {{ option.label }}
      </label>
    </fieldset>

    <div class="filtered-tree__canvas" role="tree" aria-label="Filtered function tree">
      <FragmentTreeBranch
        v-for="node in filteredTree"
        :key="node.id"
        :node="node"
        :depth="0"
        :show-zids="filters.zid"
        @focus-field="onNodeFocus"
        @blur-field="onNodeBlur"
      />
      <p v-if="!filteredTree.length" class="filtered-tree__empty">
        No nodes match the current filters. Enable more layers above.
      </p>
    </div>

    <div class="citation-row">
      <div v-if="!fixture.citation" class="citation-actions">
        <CdxButton action="default" weight="normal" @click="attachCitation">Add citation</CdxButton>
      </div>
      <CitationEditorPanel
        v-else
        v-model:citation="fixture.citation"
        v-model:expanded="fixture.citationExpanded"
        :fields="citationFields"
        @remove="removeCitation"
      />
    </div>
  </div>
</template>

<style scoped>
.panel-heading {
  margin-bottom: var(--spacing-150);
}

.panel-heading h2 {
  margin-top: 0;
}

.panel-heading p {
  margin-bottom: 0;
  color: var(--color-subtle);
}

.eyebrow {
  margin: 0 0 var(--spacing-25);
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.filtered-tree__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-100);
  margin: 0 0 var(--spacing-150);
  padding: var(--spacing-100);
  border: 1px solid var(--border-color-subtle);
  background-color: var(--background-color-neutral-subtle);
}

.filtered-tree__filters legend {
  font-weight: var(--font-weight-bold);
  padding: 0 var(--spacing-50);
}

.filtered-tree__filter {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-50);
  font-size: var(--font-size-small);
}

.filtered-tree__canvas {
  border: 1px solid var(--border-color-subtle);
  padding: var(--spacing-100);
  background-color: var(--background-color-base);
}

.filtered-tree__empty {
  margin: 0;
  color: var(--color-placeholder);
  font-size: var(--font-size-small);
}

.citation-row {
  margin-top: var(--spacing-150);
}
</style>
