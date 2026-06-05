<script setup lang="ts">
import { computed, ref } from 'vue'

import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconClose } from '@wikimedia/codex-icons'

import type { HandoffElementInspection } from '@/lib/handoff'

import HandoffInspectorPropRow from './HandoffInspectorPropRow.vue'
import HandoffInspectorSection from './HandoffInspectorSection.vue'

const props = defineProps<{
  inspection: HandoffElementInspection | null
}>()

defineEmits<{
  close: []
}>()

const copiedValue = ref<string | null>(null)

const hasNotes = computed(() => {
  const n = props.inspection?.notes
  return Boolean(n?.name || n?.behavior || n?.productionNote)
})

const codexComponent = computed(() => props.inspection?.components.codexComponent ?? null)
const codexModifiers = computed(() => props.inspection?.components.codexModifiers ?? [])
const protowikiComponents = computed(() => props.inspection?.components.protowikiComponents ?? [])

const layoutCells = computed(() => {
  const layout = props.inspection?.layout
  if (!layout) return []
  return [
    { label: 'W', value: `${layout.width}px` },
    { label: 'H', value: `${layout.height}px` },
  ]
})

const layoutMetaEntries = computed(() => {
  const layout = props.inspection?.layout
  if (!layout) return []
  return [
    { label: 'Display', value: layout.display },
    { label: 'Position', value: layout.position },
    { label: 'Overflow', value: layout.overflow },
    { label: 'z-index', value: layout.zIndex },
  ]
})

const typographyEntries = computed(() => {
  const typography = props.inspection?.typography
  if (!typography) return []
  return [
    { label: 'Font', value: typography.fontFamily },
    { label: 'Size', value: typography.fontSize },
    { label: 'Weight', value: typography.fontWeight },
    { label: 'Line height', value: typography.lineHeight },
    { label: 'Letter spacing', value: typography.letterSpacing },
    { label: 'Align', value: typography.textAlign },
  ]
})

async function copyValue(value: string) {
  if (!navigator.clipboard) return
  await navigator.clipboard.writeText(value)
  copiedValue.value = value
  window.setTimeout(() => {
    if (copiedValue.value === value) copiedValue.value = null
  }, 1400)
}
</script>

<template>
  <aside
    v-if="inspection"
    class="handoff-inspector-panel"
    role="complementary"
    aria-label="Engineer Mode inspector"
  >
    <header class="handoff-inspector-panel__header">
      <p class="handoff-inspector-panel__eyebrow">Engineer Mode</p>
      <div class="handoff-inspector-panel__header-row">
        <h2 class="handoff-inspector-panel__title">Inspect</h2>
        <CdxButton
          weight="quiet"
          :icon-only="true"
          aria-label="Close inspector"
          @click="$emit('close')"
        >
          <CdxIcon :icon="cdxIconClose" />
        </CdxButton>
      </div>
    </header>

    <div v-if="codexComponent || protowikiComponents.length" class="handoff-inspector-panel__hero">
      <button
        v-if="codexComponent"
        type="button"
        class="handoff-inspector-panel__component-name"
        @click="copyValue(codexComponent)"
      >
        {{ codexComponent }}
      </button>
      <p v-else-if="inspection.displayName" class="handoff-inspector-panel__component-name">
        {{ inspection.displayName }}
      </p>

      <p v-if="codexModifiers.length" class="handoff-inspector-panel__modifiers">
        <span v-for="mod in codexModifiers" :key="mod" class="handoff-inspector-panel__modifier">{{
          mod
        }}</span>
      </p>

      <p v-if="protowikiComponents.length" class="handoff-inspector-panel__breadcrumb">
        <button
          v-for="(name, index) in protowikiComponents"
          :key="name"
          type="button"
          class="handoff-inspector-panel__breadcrumb-item"
          @click="copyValue(name)"
        >
          {{ name }}<span v-if="index < protowikiComponents.length - 1" aria-hidden="true"> · </span>
        </button>
      </p>
    </div>

    <div class="handoff-inspector-panel__body">
      <div v-if="hasNotes" class="handoff-inspector-panel__notes">
        <p v-if="inspection.notes.name" class="handoff-inspector-panel__note-line">
          <strong>Name</strong> {{ inspection.notes.name }}
        </p>
        <p v-if="inspection.notes.behavior" class="handoff-inspector-panel__note-line">
          <strong>Behavior</strong> {{ inspection.notes.behavior }}
        </p>
        <p v-if="inspection.notes.productionNote" class="handoff-inspector-panel__note-line">
          <strong>Production</strong> {{ inspection.notes.productionNote }}
        </p>
      </div>

      <HandoffInspectorSection
        v-if="inspection.designTokens.length"
        title="Design tokens"
        :open="true"
      >
        <HandoffInspectorPropRow
          v-for="match in inspection.designTokens"
          :key="`${match.property}-${match.token}`"
          :label="match.property"
          :value="`var(${match.token})`"
          :hint="match.computed"
          @copy="copyValue"
        />
      </HandoffInspectorSection>

      <HandoffInspectorSection title="Layout" :open="true">
        <div class="handoff-inspector-panel__measures">
          <button
            v-for="cell in layoutCells"
            :key="cell.label"
            type="button"
            class="handoff-inspector-panel__measure"
            @click="copyValue(cell.value)"
          >
            <span class="handoff-inspector-panel__measure-label">{{ cell.label }}</span>
            <span class="handoff-inspector-panel__measure-value">{{ cell.value }}</span>
          </button>
        </div>
        <HandoffInspectorPropRow
          v-for="entry in layoutMetaEntries"
          :key="entry.label"
          :label="entry.label"
          :value="entry.value"
          @copy="copyValue"
        />
      </HandoffInspectorSection>

      <HandoffInspectorSection title="Box model">
        <div class="handoff-inspector-panel__box-model" aria-label="Box model">
          <div class="handoff-inspector-panel__edge">{{ inspection.margin.top }}</div>
          <div class="handoff-inspector-panel__box-row">
            <div class="handoff-inspector-panel__edge">{{ inspection.margin.left }}</div>
            <div class="handoff-inspector-panel__padding-box">
              <div class="handoff-inspector-panel__edge">{{ inspection.padding.top }}</div>
              <div class="handoff-inspector-panel__box-row">
                <div class="handoff-inspector-panel__edge">{{ inspection.padding.left }}</div>
                <div class="handoff-inspector-panel__content-box">
                  {{ inspection.layout.width }}×{{ inspection.layout.height }}
                </div>
                <div class="handoff-inspector-panel__edge">{{ inspection.padding.right }}</div>
              </div>
              <div class="handoff-inspector-panel__edge">{{ inspection.padding.bottom }}</div>
            </div>
            <div class="handoff-inspector-panel__edge">{{ inspection.margin.right }}</div>
          </div>
          <div class="handoff-inspector-panel__edge">{{ inspection.margin.bottom }}</div>
        </div>
      </HandoffInspectorSection>

      <HandoffInspectorSection title="Typography">
        <HandoffInspectorPropRow
          v-for="entry in typographyEntries"
          :key="entry.label"
          :label="entry.label"
          :value="entry.value"
          @copy="copyValue"
        />
      </HandoffInspectorSection>

    </div>

    <Transition name="handoff-inspector-panel__toast">
      <p v-if="copiedValue" class="handoff-inspector-panel__toast" role="status">Copied</p>
    </Transition>
  </aside>
</template>

<style scoped>
.handoff-inspector-panel {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 10000;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: var(--protowiki-inspector-width, min(20rem, 100vw));
  height: 100vh;
  border-left: 1px solid var(--border-color-subtle);
  background: var(--background-color-base);
  color: var(--color-base);
  font-family: var(--font-family-system-sans);
  font-size: var(--font-size-small);
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.06);
}

.handoff-inspector-panel__header {
  flex-shrink: 0;
  padding: var(--spacing-75) var(--spacing-100) var(--spacing-50);
  border-bottom: 1px solid var(--border-color-subtle);
}

.handoff-inspector-panel__eyebrow {
  margin: 0 0 var(--spacing-25);
  color: var(--color-subtle);
  font-size: var(--font-size-x-small);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.handoff-inspector-panel__header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-50);
}

.handoff-inspector-panel__title {
  margin: 0;
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-bold);
}

.handoff-inspector-panel__hero {
  flex-shrink: 0;
  padding: var(--spacing-100) var(--spacing-100) var(--spacing-75);
  border-bottom: 1px solid var(--border-color-subtle);
  background: var(--background-color-neutral-subtle);
}

.handoff-inspector-panel__component-name {
  display: block;
  width: 100%;
  margin: 0 0 var(--spacing-25);
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-progressive);
  font-family: var(--font-family-monospace);
  font-size: var(--font-size-large);
  font-weight: var(--font-weight-bold);
  line-height: 1.25;
  text-align: left;
  cursor: copy;
}

.handoff-inspector-panel__component-name:hover {
  text-decoration: underline;
}

.handoff-inspector-panel__modifiers {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-25);
  margin: var(--spacing-50) 0 0;
}

.handoff-inspector-panel__modifier {
  padding: 0.125rem var(--spacing-50);
  border-radius: var(--border-radius-pill);
  background: var(--background-color-base);
  color: var(--color-subtle);
  font-family: var(--font-family-monospace);
  font-size: var(--font-size-x-small);
}

.handoff-inspector-panel__breadcrumb {
  margin: var(--spacing-50) 0 0;
  color: var(--color-subtle);
  font-size: var(--font-size-x-small);
  line-height: var(--line-height-small);
}

.handoff-inspector-panel__breadcrumb-item {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: copy;
}

.handoff-inspector-panel__breadcrumb-item:hover {
  color: var(--color-progressive);
  text-decoration: underline;
}

.handoff-inspector-panel__chain {
  margin: var(--spacing-25) 0 0;
  color: var(--color-subtle);
  font-family: var(--font-family-monospace);
  font-size: var(--font-size-x-small);
  line-height: var(--line-height-small);
}

.handoff-inspector-panel__chain-item {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: copy;
}

.handoff-inspector-panel__chain-item:hover {
  color: var(--color-progressive);
}

.handoff-inspector-panel__chain-sep {
  margin: 0 var(--spacing-25);
  color: var(--color-disabled);
}

.handoff-inspector-panel__body {
  flex: 1;
  overflow: auto;
}

.handoff-inspector-panel__notes {
  margin: var(--spacing-75) var(--spacing-100) 0;
  padding: var(--spacing-75);
  border-radius: var(--border-radius-base);
  background: var(--background-color-warning-subtle);
  font-size: var(--font-size-x-small);
  line-height: var(--line-height-small);
}

.handoff-inspector-panel__note-line {
  margin: 0;
}

.handoff-inspector-panel__note-line + .handoff-inspector-panel__note-line {
  margin-top: var(--spacing-50);
}

.handoff-inspector-panel__measures {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--spacing-25);
  margin-bottom: var(--spacing-50);
  padding: 0 var(--spacing-50);
}

.handoff-inspector-panel__measure {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: var(--spacing-50);
  border: 1px solid var(--border-color-subtle);
  border-radius: var(--border-radius-base);
  background: var(--background-color-neutral-subtle);
  color: inherit;
  text-align: left;
  cursor: copy;
}

.handoff-inspector-panel__measure:hover {
  border-color: var(--border-color-progressive);
  background: var(--background-color-base);
}

.handoff-inspector-panel__measure-label {
  color: var(--color-subtle);
  font-size: var(--font-size-x-small);
}

.handoff-inspector-panel__measure-value {
  font-family: var(--font-family-monospace);
  font-size: 0.8125rem;
}

.handoff-inspector-panel__box-model {
  margin: var(--spacing-50) var(--spacing-50) var(--spacing-75);
  padding: 0;
  border-radius: var(--border-radius-base);
  background: color-mix(in srgb, var(--background-color-warning-subtle, #ffcc33) 40%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color-warning, #fc3) 50%, transparent);
  font-family: var(--font-family-monospace);
  font-size: 0.6875rem;
  text-align: center;
}

.handoff-inspector-panel__box-row {
  display: grid;
  grid-template-columns: minmax(2rem, 1fr) 3fr minmax(2rem, 1fr);
}

.handoff-inspector-panel__edge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 1.5rem;
  color: var(--color-subtle);
}

.handoff-inspector-panel__padding-box {
  background: color-mix(in srgb, var(--background-color-success-subtle, #14866d) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color-success, #14866d) 40%, transparent);
}

.handoff-inspector-panel__content-box {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
  background: color-mix(in srgb, var(--background-color-progressive-subtle, #eaf3ff) 60%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color-progressive, #36c) 40%, transparent);
  color: var(--color-progressive);
  font-weight: var(--font-weight-bold);
}

.handoff-inspector-panel__toast {
  position: absolute;
  bottom: var(--spacing-100);
  left: 50%;
  margin: 0;
  padding: var(--spacing-25) var(--spacing-75);
  border-radius: var(--border-radius-pill);
  background: var(--background-color-inverted);
  color: var(--color-inverted);
  font-size: var(--font-size-x-small);
  transform: translateX(-50%);
}

.handoff-inspector-panel__toast-enter-active,
.handoff-inspector-panel__toast-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}

.handoff-inspector-panel__toast-enter-from,
.handoff-inspector-panel__toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
</style>
