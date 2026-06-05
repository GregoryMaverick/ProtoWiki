<script setup lang="ts">
import { RouterView } from 'vue-router'

import EngineerMode from '@/components/handoff/EngineerMode.vue'
</script>

<template>
  <div class="protowiki-app-shell">
    <RouterView />
  </div>
  <EngineerMode />
</template>

<style scoped>
.protowiki-app-shell {
  min-height: 100vh;
}
</style>
