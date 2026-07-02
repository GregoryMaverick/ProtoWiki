<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CdxButton,
  CdxDialog,
  CdxField,
  CdxIcon,
  CdxMessage,
  CdxSelect,
  CdxTable,
  CdxTextInput,
} from '@wikimedia/codex'
import { cdxIconAdd, cdxIconEdit, cdxIconTrash } from '@wikimedia/codex-icons'

import {
  articleSections,
  emptyAuthoringOption,
  sectionLabel,
  type AuthoringOption,
  type AuthoringOptionField,
} from '../fixtures'

const props = defineProps<{
  registry: AuthoringOption[]
}>()

const emit = defineEmits<{
  update: [AuthoringOption[]]
}>()

const saveNotice = ref('')
const dialogOpen = ref(false)
const editingId = ref<string | null>(null)
const draft = ref<AuthoringOption>(emptyAuthoringOption())

const sectionMenuItems = computed(() =>
  articleSections.map((section) => ({
    label: section.label,
    value: section.id,
  })),
)

const tableColumns = [
  { id: 'label', label: 'Label', allowSort: true },
  { id: 'pattern', label: 'Pattern', allowSort: false },
  { id: 'wikidataProperty', label: 'Wikidata property', allowSort: false },
  { id: 'sectionId', label: 'Section', allowSort: true },
  { id: 'functionName', label: 'Function', allowSort: false },
  { id: 'actions', label: '', allowSort: false, width: '7rem', textAlign: 'end' as const },
]

const tableData = computed(() =>
  props.registry.map((entry) => ({
    ...entry,
    sectionId: sectionLabel(entry.sectionId),
    functionName: `${entry.functionName} (${entry.functionZid})`,
  })),
)

const dialogTitle = computed(() =>
  editingId.value ? 'Edit authoring option' : 'Add authoring option',
)

const primaryAction = computed(() => ({
  label: editingId.value ? 'Update' : 'Add',
  actionType: 'progressive' as const,
  disabled: !draft.value.label.trim() || !draft.value.pattern.trim(),
}))

function openCreate() {
  editingId.value = null
  draft.value = emptyAuthoringOption()
  dialogOpen.value = true
}

function openEdit(entry: AuthoringOption) {
  editingId.value = entry.id
  draft.value = {
    ...entry,
    fields: entry.fields.map((field) => ({ ...field })),
  }
  dialogOpen.value = true
}

function removeEntry(entryId: string) {
  emit(
    'update',
    props.registry.filter((entry) => entry.id !== entryId),
  )
  saveNotice.value = 'Authoring option removed (prototype).'
}

function addFieldRow() {
  draft.value.fields.push({ key: '', label: '' })
}

function removeFieldRow(index: number) {
  if (draft.value.fields.length <= 1) {
    return
  }
  draft.value.fields.splice(index, 1)
}

function confirmDialog() {
  const payload: AuthoringOption = {
    ...draft.value,
    id: editingId.value ?? `option-${Date.now()}`,
    label: draft.value.label.trim(),
    pattern: draft.value.pattern.trim(),
    helper: draft.value.helper.trim(),
    wikidataProperty: draft.value.wikidataProperty.trim(),
    functionName: draft.value.functionName.trim(),
    functionZid: draft.value.functionZid.trim(),
    fields: draft.value.fields
      .filter((field) => field.key.trim() && field.label.trim())
      .map((field) => ({ key: field.key.trim(), label: field.label.trim() })),
  }

  if (!payload.fields.length) {
    payload.fields = [{ key: 'entity', label: 'Person' }]
  }

  if (editingId.value) {
    emit(
      'update',
      props.registry.map((entry) => (entry.id === editingId.value ? payload : entry)),
    )
    saveNotice.value = 'Authoring option updated (prototype).'
  } else {
    emit('update', [...props.registry, payload])
    saveNotice.value = 'Authoring option added (prototype).'
  }

  dialogOpen.value = false
}

function updateField(index: number, patch: Partial<AuthoringOptionField>) {
  draft.value.fields[index] = { ...draft.value.fields[index], ...patch }
}
</script>

<template>
  <div class="registry-editor">
    <p class="registry-editor__lead">
      Each authoring option maps editor-facing information to a sentence pattern, Wikidata
      property bridge, and Wikifunction wiring used by the simplified editor.
    </p>

    <CdxMessage v-if="saveNotice" type="success" class="registry-editor__notice">
      {{ saveNotice }}
    </CdxMessage>

    <div class="registry-editor__toolbar">
      <CdxButton weight="primary" @click="openCreate">
        <CdxIcon :icon="cdxIconAdd" />
        Add authoring option
      </CdxButton>
    </div>

    <CdxTable
      caption="Authoring registry"
      hide-caption
      class="registry-editor__table"
      :columns="tableColumns"
      :data="tableData"
      :show-vertical-borders="false"
    >
      <template #item-actions="{ row }">
        <div class="registry-editor__row-actions">
          <CdxButton
            weight="quiet"
            :aria-label="`Edit ${row.label}`"
            @click="openEdit(registry.find((entry) => entry.id === row.id)!)"
          >
            <CdxIcon :icon="cdxIconEdit" />
          </CdxButton>
          <CdxButton
            weight="quiet"
            :aria-label="`Delete ${row.label}`"
            @click="removeEntry(row.id)"
          >
            <CdxIcon :icon="cdxIconTrash" />
          </CdxButton>
        </div>
      </template>
    </CdxTable>

    <CdxDialog
      v-model:open="dialogOpen"
      :title="dialogTitle"
      :use-close-button="true"
      :primary-action="primaryAction"
      @primary="confirmDialog"
    >
      <div class="registry-editor__form">
        <CdxField>
          <template #label>Label</template>
          <template #description>Editor-facing name, e.g. Occupation.</template>
          <CdxTextInput v-model="draft.label" placeholder="Occupation" />
        </CdxField>

        <CdxField>
          <template #label>Pattern</template>
          <template #description>Bracket placeholders shown in the simplified editor.</template>
          <CdxTextInput v-model="draft.pattern" placeholder="[Person] is a [class]" />
        </CdxField>

        <CdxField>
          <template #label>Helper text</template>
          <template #description>Short guidance shown when picking this option.</template>
          <CdxTextInput v-model="draft.helper" placeholder="Say what the topic is." />
        </CdxField>

        <CdxField>
          <template #label>Wikidata property</template>
          <template #description>Property used to pre-fill the form from Wikidata.</template>
          <CdxTextInput v-model="draft.wikidataProperty" placeholder="P106 occupation" />
        </CdxField>

        <CdxField>
          <template #label>Default section</template>
          <CdxSelect v-model:selected="draft.sectionId" :menu-items="sectionMenuItems" />
        </CdxField>

        <CdxField>
          <template #label>Function name</template>
          <CdxTextInput v-model="draft.functionName" placeholder="Article-less instantiating fragment" />
        </CdxField>

        <CdxField>
          <template #label>Function ZID</template>
          <CdxTextInput v-model="draft.functionZid" placeholder="Z10031" />
        </CdxField>

        <fieldset class="registry-editor__fields">
          <legend class="registry-editor__fields-legend">Form fields</legend>
          <div
            v-for="(field, index) in draft.fields"
            :key="index"
            class="registry-editor__field-row"
          >
            <CdxField>
              <template #label>Argument key</template>
              <CdxTextInput
                :model-value="field.key"
                placeholder="entity"
                @update:model-value="updateField(index, { key: String($event) })"
              />
            </CdxField>
            <CdxField>
              <template #label>Field label</template>
              <CdxTextInput
                :model-value="field.label"
                placeholder="Person"
                @update:model-value="updateField(index, { label: String($event) })"
              />
            </CdxField>
            <CdxButton
              weight="quiet"
              :disabled="draft.fields.length <= 1"
              :aria-label="`Remove field row ${index + 1}`"
              @click="removeFieldRow(index)"
            >
              <CdxIcon :icon="cdxIconTrash" />
            </CdxButton>
          </div>
          <CdxButton weight="quiet" @click="addFieldRow">
            <CdxIcon :icon="cdxIconAdd" />
            Add field
          </CdxButton>
        </fieldset>
      </div>
    </CdxDialog>
  </div>
</template>

<style scoped>
.registry-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100);
}

.registry-editor__lead {
  margin: 0;
  max-width: 48rem;
  color: var(--color-subtle);
}

.registry-editor__notice {
  margin: 0;
}

.registry-editor__toolbar {
  display: flex;
  justify-content: flex-start;
}

.registry-editor__row-actions {
  display: inline-flex;
  gap: var(--spacing-25);
}

.registry-editor__form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100);
}

.registry-editor__fields {
  margin: 0;
  padding: 0;
  border: none;
}

.registry-editor__fields-legend {
  margin-bottom: var(--spacing-75);
  font-weight: var(--font-weight-bold);
}

.registry-editor__field-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: var(--spacing-75);
  align-items: end;
  margin-bottom: var(--spacing-75);
}
</style>
