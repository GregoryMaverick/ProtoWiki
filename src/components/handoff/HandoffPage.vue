<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import PlainWrapper from '@/components/PlainWrapper.vue'
import type { PrototypeHandoff } from '@/lib/handoff'
const props = defineProps<{
  handoff: PrototypeHandoff
}>()

const statusLabel = computed(() => {
  switch (props.handoff.status) {
    case 'draft':
      return 'Draft'
    case 'ready-for-engineering':
      return 'Ready for engineering'
    case 'in-engineering':
      return 'In engineering'
    default:
      return props.handoff.status
  }
})

function listSection(title: string, items: string[]) {
  return items.length > 0 ? { title, items } : null
}

const sections = computed(() => {
  const h = props.handoff
  return [
    listSection('Approved flows', h.approvedFlows),
    listSection('States covered', h.statesCovered),
    listSection('Codex components', h.codexComponents),
    listSection('Data needs', h.dataNeeds),
    listSection('Accessibility notes', h.accessibilityNotes),
    listSection('Prototype shortcuts', h.prototypeShortcuts),
    listSection('Engineering questions', h.engineeringQuestions),
    listSection('Acceptance criteria', h.acceptanceCriteria),
  ].filter(Boolean) as { title: string; items: string[] }[]
})
</script>

<template>
  <PlainWrapper :heading="handoff.title">
    <template #actions>
      <RouterLink class="handoff-page__prototype-link" :to="handoff.prototypeRoute">
        Open prototype
      </RouterLink>
    </template>

    <div class="handoff-page">
      <p class="handoff-page__meta">
        <span class="handoff-page__status">{{ statusLabel }}</span>
        ·
        <span>Handoff for <code>{{ handoff.slug }}</code></span>
      </p>

      <section v-if="handoff.goal" class="handoff-page__section">
        <h2>Goal</h2>
        <p>{{ handoff.goal }}</p>
      </section>

      <section
        v-for="section in sections"
        :key="section.title"
        class="handoff-page__section"
      >
        <h2>{{ section.title }}</h2>
        <ul>
          <li v-for="(item, i) in section.items" :key="i">{{ item }}</li>
        </ul>
      </section>

      <section class="handoff-page__section handoff-page__section--tools">
        <h2>Tools</h2>
        <p>
          Open the
          <RouterLink :to="{ path: handoff.prototypeRoute, query: { engineerMode: '1' } }">
            prototype with Engineer Mode
          </RouterLink>
          to inspect annotated elements.
        </p>
      </section>
    </div>
  </PlainWrapper>
</template>

<style scoped>
.handoff-page__prototype-link {
  font-size: var(--font-size-small, 0.875rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-progressive, #36c);
  text-decoration: none;
}

.handoff-page__prototype-link:hover {
  text-decoration: underline;
}

.handoff-page__meta {
  margin: 0 0 var(--spacing-100, 1rem);
  color: var(--color-subtle, #54595d);
  font-size: var(--font-size-small, 0.875rem);
}

.handoff-page__status {
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-base, #202122);
}

.handoff-page__section {
  margin-bottom: var(--spacing-150, 1.5rem);
}

.handoff-page__section h2 {
  margin: 0 0 var(--spacing-50, 0.5rem);
  font-size: var(--font-size-medium, 1rem);
}

.handoff-page__section ul {
  margin: 0;
  padding-left: 1.25rem;
}

.handoff-page__section--tools a {
  color: var(--color-progressive, #36c);
}
</style>
