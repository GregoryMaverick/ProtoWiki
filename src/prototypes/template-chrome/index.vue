<script setup lang="ts">
definePage({
  meta: {
    title: 'Template: Chrome',
    description: 'Template for prototypes with a Wikipedia header and footer.',
  },
})

import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
</script>

<template>
  <ChromeWrapper>
    <main>
      <h1>Chrome wrapper</h1>
      <p
        data-wm-handoff-name="Intro paragraph"
        data-wm-handoff-behavior="Static starter copy for the chrome template"
        data-wm-handoff-production-note="Replace with real article or special-page content in production"
      >
        Starter template — empty chrome wrapper.
      </p>
    </main>
  </ChromeWrapper>
</template>

<style scoped>
main {
  padding: var(--spacing-100);
}
</style>
