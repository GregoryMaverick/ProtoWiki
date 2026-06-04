<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

import HandoffPage from '@/components/handoff/HandoffPage.vue'
import PlainWrapper from '@/components/PlainWrapper.vue'
import { getHandoffBySlug } from '@/lib/handoffRegistry'

definePage({
  meta: {
    title: 'Engineering handoff',
    description: 'Prototype-to-production handoff package',
  },
})

const route = useRoute()

const slug = computed(() => {
  const p = route.params.slug
  return typeof p === 'string' ? p : Array.isArray(p) ? p[0] : ''
})

const handoff = computed(() => getHandoffBySlug(slug.value))
</script>

<template>
  <HandoffPage v-if="handoff" :handoff="handoff" />
  <PlainWrapper v-else heading="Handoff not found">
    <p>
      No handoff package exists for <code>{{ slug }}</code>. Promote a prototype with
      <code>npm run handoff:new -- &lt;slug&gt;</code> and edit
      <code>src/prototypes/&lt;slug&gt;/handoff.ts</code>.
    </p>
    <p>
      <RouterLink to="/">Back to gallery</RouterLink>
    </p>
  </PlainWrapper>
</template>
