<script setup lang="ts">
defineProps<{
  title: string
  open?: boolean
}>()
</script>

<template>
  <details class="handoff-inspector-section" :open="open">
    <summary class="handoff-inspector-section__summary">{{ title }}</summary>
    <div class="handoff-inspector-section__body">
      <slot />
    </div>
  </details>
</template>

<style scoped>
.handoff-inspector-section {
  border-bottom: 1px solid var(--border-color-subtle);
}

.handoff-inspector-section__summary {
  display: flex;
  align-items: center;
  padding: var(--spacing-75) var(--spacing-100);
  color: var(--color-base);
  font-family: var(--font-family-system-sans);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  list-style: none;
  cursor: pointer;
  user-select: none;
}

.handoff-inspector-section__summary::-webkit-details-marker {
  display: none;
}

.handoff-inspector-section__summary::before {
  content: '';
  width: 0.45rem;
  height: 0.45rem;
  margin-right: var(--spacing-50);
  border-right: 2px solid var(--color-subtle);
  border-bottom: 2px solid var(--color-subtle);
  transform: rotate(-45deg);
  transition: transform 120ms ease;
}

.handoff-inspector-section[open] > .handoff-inspector-section__summary::before {
  transform: rotate(45deg);
}

.handoff-inspector-section__body {
  padding: 0 var(--spacing-50) var(--spacing-75);
}
</style>
