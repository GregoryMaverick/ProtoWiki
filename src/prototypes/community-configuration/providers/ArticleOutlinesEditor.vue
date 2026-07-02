<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CdxButton,
  CdxField,
  CdxIcon,
  CdxMessage,
  CdxSelect,
} from '@wikimedia/codex'
import { cdxIconAdd } from '@wikimedia/codex-icons'
import { cdxIconArrowDown, cdxIconArrowUp, cdxIconTrash } from '@wikimedia/codex-icons'

import {
  articleSections,
  sectionLabel,
  type ArticleTypeOutline,
  type AuthoringOption,
} from '../fixtures'

const props = defineProps<{
  registry: AuthoringOption[]
  outlines: ArticleTypeOutline[]
}>()

const emit = defineEmits<{
  'update-outlines': [ArticleTypeOutline[]]
}>()

const saveNotice = ref('')
const activeOutlineId = ref(props.outlines[0]?.id ?? 'human-biography')
const addSelection = ref<Record<string, string>>({})

const outlineMenuItems = computed(() =>
  props.outlines.map((outline) => ({
    label: outline.label,
    value: outline.id,
  })),
)

const activeOutline = computed(() =>
  props.outlines.find((outline) => outline.id === activeOutlineId.value) ?? props.outlines[0],
)

function registryLabel(optionId: string): string {
  return props.registry.find((entry) => entry.id === optionId)?.label ?? optionId
}

function sectionOutline(sectionId: string) {
  return activeOutline.value?.sections.find((section) => section.sectionId === sectionId)
}

function availableOptions(sectionId: string) {
  const current = sectionOutline(sectionId)?.optionIds ?? []
  return props.registry
    .filter((entry) => !current.includes(entry.id))
    .map((entry) => ({
      label: entry.label,
      value: entry.id,
    }))
}

function updateOutline(next: ArticleTypeOutline) {
  emit(
    'update-outlines',
    props.outlines.map((outline) => (outline.id === next.id ? next : outline)),
  )
}

function moveOption(sectionId: string, index: number, direction: -1 | 1) {
  if (!activeOutline.value) {
    return
  }

  const section = sectionOutline(sectionId)
  if (!section) {
    return
  }

  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= section.optionIds.length) {
    return
  }

  const nextIds = [...section.optionIds]
  const [moved] = nextIds.splice(index, 1)
  nextIds.splice(targetIndex, 0, moved)

  updateOutline({
    ...activeOutline.value,
    sections: activeOutline.value.sections.map((entry) =>
      entry.sectionId === sectionId ? { ...entry, optionIds: nextIds } : entry,
    ),
  })
}

function removeOption(sectionId: string, optionId: string) {
  if (!activeOutline.value) {
    return
  }

  updateOutline({
    ...activeOutline.value,
    sections: activeOutline.value.sections.map((entry) =>
      entry.sectionId === sectionId
        ? { ...entry, optionIds: entry.optionIds.filter((id) => id !== optionId) }
        : entry,
    ),
  })
  saveNotice.value = 'Outline updated (prototype).'
}

function addOption(sectionId: string, optionId: string) {
  if (!activeOutline.value || !optionId) {
    return
  }

  updateOutline({
    ...activeOutline.value,
    sections: activeOutline.value.sections.map((entry) =>
      entry.sectionId === sectionId
        ? { ...entry, optionIds: [...entry.optionIds, optionId] }
        : entry,
    ),
  })
  saveNotice.value = 'Outline updated (prototype).'
}
</script>

<template>
  <div class="outlines-editor">
    <p class="outlines-editor__lead">
      Controls which authoring options the simplified editor suggests per section—not the
      article’s actual content.
    </p>

    <CdxMessage v-if="saveNotice" type="success" class="outlines-editor__notice">
      {{ saveNotice }}
    </CdxMessage>

    <div class="outlines-editor__controls">
      <CdxField>
        <template #label>Article type</template>
        <CdxSelect v-model:selected="activeOutlineId" :menu-items="outlineMenuItems" />
      </CdxField>
      <p v-if="activeOutline" class="outlines-editor__match">
        Match rule: Wikidata {{ activeOutline.wikidataMatch }}
      </p>
    </div>

    <div v-if="activeOutline" class="outlines-editor__sections">
      <section
        v-for="section in articleSections"
        :key="section.id"
        class="outlines-editor__section"
        :aria-labelledby="`outline-section-${section.id}`"
      >
        <h3 :id="`outline-section-${section.id}`" class="outlines-editor__section-title">
          {{ section.label }}
        </h3>
        <p class="outlines-editor__section-description">{{ section.description }}</p>

        <ul class="outlines-editor__chips">
          <li
            v-for="(optionId, index) in sectionOutline(section.id)?.optionIds ?? []"
            :key="optionId"
            class="outlines-editor__chip"
          >
            <span class="outlines-editor__chip-label">{{ registryLabel(optionId) }}</span>
            <span class="outlines-editor__chip-actions">
              <CdxButton
                weight="quiet"
                :disabled="index === 0"
                :aria-label="`Move ${registryLabel(optionId)} up`"
                @click="moveOption(section.id, index, -1)"
              >
                <CdxIcon :icon="cdxIconArrowUp" />
              </CdxButton>
              <CdxButton
                weight="quiet"
                :disabled="index === (sectionOutline(section.id)?.optionIds.length ?? 1) - 1"
                :aria-label="`Move ${registryLabel(optionId)} down`"
                @click="moveOption(section.id, index, 1)"
              >
                <CdxIcon :icon="cdxIconArrowDown" />
              </CdxButton>
              <CdxButton
                weight="quiet"
                :aria-label="`Remove ${registryLabel(optionId)}`"
                @click="removeOption(section.id, optionId)"
              >
                <CdxIcon :icon="cdxIconTrash" />
              </CdxButton>
            </span>
          </li>
        </ul>

        <div v-if="availableOptions(section.id).length" class="outlines-editor__add">
          <CdxField>
            <template #label>Add to {{ sectionLabel(section.id) }}</template>
            <div class="outlines-editor__add-row">
              <CdxSelect
                v-model:selected="addSelection[section.id]"
                :menu-items="availableOptions(section.id)"
                default-label="Choose authoring option"
              />
              <CdxButton
                :disabled="!addSelection[section.id]"
                @click="
                  addOption(section.id, addSelection[section.id]);
                  addSelection[section.id] = '';
                "
              >
                <CdxIcon :icon="cdxIconAdd" />
                Add
              </CdxButton>
            </div>
          </CdxField>
        </div>
        <p v-else class="outlines-editor__empty">All registry options are already in this section.</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.outlines-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-150);
}

.outlines-editor__lead,
.outlines-editor__match,
.outlines-editor__section-description,
.outlines-editor__empty {
  margin: 0;
  color: var(--color-subtle);
}

.outlines-editor__notice {
  margin: 0;
}

.outlines-editor__controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
  max-width: 24rem;
}

.outlines-editor__sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-200);
}

.outlines-editor__section-title {
  margin: 0 0 var(--spacing-50);
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-bold);
}

.outlines-editor__chips {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
  margin: var(--spacing-75) 0;
  padding: 0;
  list-style: none;
}

.outlines-editor__chip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-75);
  padding: var(--spacing-75) var(--spacing-100);
  border: 1px solid var(--border-color-subtle);
  border-radius: var(--border-radius-base);
  background-color: var(--background-color-base);
}

.outlines-editor__chip-label {
  font-weight: var(--font-weight-bold);
}

.outlines-editor__chip-actions {
  display: inline-flex;
  gap: var(--spacing-25);
}

.outlines-editor__add {
  max-width: 32rem;
}

.outlines-editor__add-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-75);
  align-items: center;
}
</style>
