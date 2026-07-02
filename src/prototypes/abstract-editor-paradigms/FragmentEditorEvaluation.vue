<script setup lang="ts">
import { reactive } from 'vue'

import { CdxCheckbox } from '@wikimedia/codex'

import { fragmentEvaluationQuestions } from './fragment-fixture'

defineProps<{
  variantLabel: string
}>()

const ratings = reactive<Record<number, boolean | null>>(
  Object.fromEntries(fragmentEvaluationQuestions.map((_, index) => [index, null])),
)

function setRating(index: number, value: boolean) {
  ratings[index] = ratings[index] === value ? null : value
}
</script>

<template>
  <section class="fragment-evaluation" aria-label="Fragment editor evaluation">
    <header class="fragment-evaluation__header">
      <h3>Evaluation checklist</h3>
      <p>
        Rate <strong>{{ variantLabel }}</strong> while editing the birth sentence fixture
        (§8 in <code>improved-fragment-editor.md</code>).
      </p>
    </header>

    <ul class="fragment-evaluation__list">
      <li
        v-for="(question, index) in fragmentEvaluationQuestions"
        :key="question"
        class="fragment-evaluation__item"
      >
        <p class="fragment-evaluation__question">{{ question }}</p>
        <div class="fragment-evaluation__choices">
          <label class="fragment-evaluation__choice">
            <CdxCheckbox
              :model-value="ratings[index] === true"
              @update:model-value="setRating(index, true)"
            />
            Yes
          </label>
          <label class="fragment-evaluation__choice">
            <CdxCheckbox
              :model-value="ratings[index] === false"
              @update:model-value="setRating(index, false)"
            />
            No
          </label>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.fragment-evaluation {
  border: 1px solid var(--border-color-subtle);
  background-color: var(--background-color-neutral-subtle);
  padding: var(--spacing-150);
}

.fragment-evaluation__header h3 {
  margin: 0 0 var(--spacing-50);
}

.fragment-evaluation__header p {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.fragment-evaluation__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-100);
  margin: var(--spacing-150) 0 0;
  padding: 0;
  list-style: none;
}

.fragment-evaluation__item {
  border: 1px solid var(--border-color-subtle);
  padding: var(--spacing-100);
  background-color: var(--background-color-base);
}

.fragment-evaluation__question {
  margin: 0 0 var(--spacing-75);
}

.fragment-evaluation__choices {
  display: flex;
  gap: var(--spacing-150);
}

.fragment-evaluation__choice {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-50);
  cursor: pointer;
}
</style>
