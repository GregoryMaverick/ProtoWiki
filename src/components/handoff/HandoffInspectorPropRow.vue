<script setup lang="ts">
defineProps<{
  label: string
  value: string
  hint?: string
  mono?: boolean
}>()

const emit = defineEmits<{
  copy: [value: string]
}>()
</script>

<template>
  <button
    type="button"
    class="handoff-inspector-prop-row"
    :title="hint ? `${hint} — click to copy` : 'Click to copy'"
    @click="emit('copy', value)"
  >
    <span class="handoff-inspector-prop-row__label">{{ label }}</span>
    <span class="handoff-inspector-prop-row__value" :class="{ 'handoff-inspector-prop-row__value--mono': mono !== false }">
      <slot name="leading" />
      {{ value }}
    </span>
  </button>
</template>

<style scoped>
.handoff-inspector-prop-row {
  display: grid;
  width: 100%;
  grid-template-columns: 6.25rem minmax(0, 1fr);
  gap: var(--spacing-50);
  align-items: center;
  padding: var(--spacing-25) var(--spacing-50);
  border: 0;
  border-radius: var(--border-radius-base);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: copy;
}

.handoff-inspector-prop-row:hover {
  background: var(--background-color-neutral-subtle);
}

.handoff-inspector-prop-row__label {
  color: var(--color-subtle);
  font-size: var(--font-size-x-small);
  font-weight: var(--font-weight-normal);
}

.handoff-inspector-prop-row__value {
  min-width: 0;
  overflow: hidden;
  font-size: var(--font-size-small);
  line-height: var(--line-height-small);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.handoff-inspector-prop-row__value--mono {
  font-family: var(--font-family-monospace);
  font-size: 0.8125rem;
}
</style>
