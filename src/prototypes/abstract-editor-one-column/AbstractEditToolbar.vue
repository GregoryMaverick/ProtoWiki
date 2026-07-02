<script setup lang="ts">
import { ref } from 'vue'
import {
  CdxButton,
  CdxIcon,
  CdxMenuButton,
  CdxToggleButton,
  CdxToggleButtonGroup,
} from '@wikimedia/codex'
import {
  cdxIconDownTriangle,
  cdxIconLightbulb,
  cdxIconReference,
} from '@wikimedia/codex-icons'

const props = defineProps<{
  canPublish?: boolean
  abstractEditorUrl: string
}>()

const emit = defineEmits<{
  paragraphChange: [value: string]
  cite: []
  publish: []
}>()

const suggestionsEnabled = defineModel<boolean>('suggestionsEnabled', { default: true })

const paragraphSelection = ref<string | null>(null)
const editorMode = ref<'visual' | 'abstract'>('visual')

const paragraphItems = [
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'heading', label: 'Heading' },
  { value: 'subheading2', label: 'Subheading 2' },
  { value: 'subheading3', label: 'Subheading 3' },
]

const editorButtons = [
  { value: 'visual' as const, label: 'Simplified editing' },
  { value: 'abstract' as const, label: 'Abstract content' },
]

const paragraphLabel = ref('Paragraph')

function onParagraphSelected(value: string | null) {
  if (!value) {
    return
  }

  const item = paragraphItems.find((entry) => entry.value === value)
  paragraphLabel.value = item?.label ?? 'Paragraph'
  emit('paragraphChange', value)
  paragraphSelection.value = null
}

function onEditorModeChange(value: string | number | (string | number)[] | null) {
  if (value === 'abstract') {
    window.location.assign(props.abstractEditorUrl)
    return
  }

  editorMode.value = 'visual'
}
</script>

<template>
  <div class="ve-toolbar" role="toolbar" aria-label="Editing toolbar">
    <div class="ve-toolbar__section ve-toolbar__section--tools">
      <CdxMenuButton
        v-model:selected="paragraphSelection"
        class="ve-toolbar__paragraph"
        weight="quiet"
        :menu-items="paragraphItems"
        aria-label="Change paragraph format"
        @update:selected="onParagraphSelected"
      >
        {{ paragraphLabel }}
        <CdxIcon class="ve-toolbar__caret" :icon="cdxIconDownTriangle" size="small" />
      </CdxMenuButton>

      <CdxButton class="ve-toolbar__cite" weight="quiet" @click="emit('cite')">
        <CdxIcon :icon="cdxIconReference" />
        <span class="ve-toolbar__cite-label">Cite</span>
      </CdxButton>
    </div>

    <div class="ve-toolbar__section ve-toolbar__section--end">
      <CdxToggleButton
        v-model="suggestionsEnabled"
        class="ve-toolbar__tool ve-toolbar__suggestions"
        aria-label="Toggle suggestions"
        :aria-pressed="suggestionsEnabled"
        :title="suggestionsEnabled ? 'Hide suggestions' : 'Show suggestions'"
      >
        <CdxIcon :icon="cdxIconLightbulb" />
      </CdxToggleButton>

      <CdxToggleButtonGroup
        v-model="editorMode"
        class="ve-toolbar__editor-group"
        :buttons="editorButtons"
        aria-label="Switch editor"
        @update:model-value="onEditorModeChange"
      />

      <CdxButton
        class="ve-toolbar__publish"
        action="progressive"
        weight="primary"
        :disabled="!canPublish"
        @click="emit('publish')"
      >
        Publish changes…
      </CdxButton>
    </div>
  </div>
</template>

<style scoped>
.ve-toolbar {
  display: flex;
  align-items: stretch;
  min-height: 2.625rem;
  border-block: 1px solid var(--border-color-subtle);
  background-color: var(--background-color-base);
  font-family: var(--font-family-base);
  font-size: var(--font-size-small);
}

.ve-toolbar__section {
  display: flex;
  align-items: center;
  gap: var(--spacing-12, 2px);
  padding: var(--spacing-25) var(--spacing-50);
  border-inline-end: 1px solid var(--border-color-subtle);
}

.ve-toolbar__section--end {
  margin-inline-start: auto;
  border-inline-end: none;
  padding-inline-end: var(--spacing-75);
}

.ve-toolbar__paragraph :deep(.cdx-button),
.ve-toolbar__cite.cdx-button,
.ve-toolbar__tool :deep(.cdx-button) {
  min-height: 2rem;
  padding-inline: var(--spacing-75);
  border: none;
  border-radius: var(--border-radius-base);
  background-color: transparent;
  color: var(--color-base);
  font-size: var(--font-size-small);
  box-shadow: none;
}

.ve-toolbar__suggestions.cdx-toggle-button {
  min-height: 2rem;
  min-width: 2rem;
  padding-inline: var(--spacing-50);
  border: none;
  border-radius: var(--border-radius-base);
  background-color: transparent;
  color: var(--color-base);
  font-size: var(--font-size-small);
  box-shadow: none;
}

.ve-toolbar__paragraph :deep(.cdx-button:hover),
.ve-toolbar__cite.cdx-button:hover,
.ve-toolbar__tool :deep(.cdx-button:hover),
.ve-toolbar__suggestions.cdx-toggle-button:hover {
  background-color: var(--background-color-interactive-subtle);
}

.ve-toolbar__suggestions.cdx-toggle-button[aria-pressed='true'] {
  background-color: var(--background-color-progressive-subtle);
  color: var(--color-progressive);
}

.ve-toolbar__suggestions.cdx-toggle-button[aria-pressed='true']:hover {
  background-color: var(--background-color-progressive-subtle--hover, var(--background-color-progressive-subtle));
}

.ve-toolbar__cite.cdx-button {
  gap: var(--spacing-35);
}

.ve-toolbar__cite-label {
  font-size: var(--font-size-small);
}

.ve-toolbar__caret {
  margin-inline-start: var(--spacing-35);
  opacity: 0.75;
}

.ve-toolbar__tool :deep(.cdx-button) {
  min-width: 2rem;
  padding-inline: var(--spacing-50);
}

.ve-toolbar__editor-group {
  display: inline-flex;
  align-self: center;
  margin-inline-start: var(--spacing-25);
}

.ve-toolbar__editor-group :deep(.cdx-toggle-button-group) {
  display: inline-flex;
  align-items: stretch;
  flex-wrap: nowrap;
}

.ve-toolbar__editor-group :deep(.cdx-toggle-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-small);
  white-space: nowrap;
}

.ve-toolbar__editor-group :deep(.cdx-toggle-button--toggled-on) {
  font-weight: var(--font-weight-bold);
}

.ve-toolbar__publish.cdx-button {
  min-height: 2rem;
  margin-inline-start: var(--spacing-50);
  white-space: nowrap;
  border: none;
  box-shadow: none;
}
</style>
