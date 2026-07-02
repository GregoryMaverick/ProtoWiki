<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CdxButton, CdxMessage } from '@wikimedia/codex'

import ChromeWrapper from '@/components/ChromeWrapper.vue'
import SpecialPageWrapper from '@/components/SpecialPageWrapper.vue'

import CommunityConfigDashboard from './CommunityConfigDashboard.vue'
import {
  createInitialState,
  providerDefinitions,
  type AuthoringOption,
  type PendingSuggestion,
  type ProviderId,
} from './fixtures'
import AuthoringRegistryEditor from './providers/AuthoringRegistryEditor.vue'
import ArticleOutlinesEditor from './providers/ArticleOutlinesEditor.vue'
import PendingSuggestionsEditor from './providers/PendingSuggestionsEditor.vue'

definePage({
  meta: {
    title: 'Community configuration',
    description:
      'Prototype dashboard and editors for Abstract Wikipedia authoring registry, article-type outlines, and suggestion approval.',
  },
})

const route = useRoute()
const router = useRouter()

const state = reactive(createInitialState())
const saveNotice = ref('')

const activeProvider = computed<ProviderId | null>(() => {
  const value = route.query.provider
  if (typeof value !== 'string') {
    return null
  }

  return providerDefinitions.some((provider) => provider.id === value)
    ? (value as ProviderId)
    : null
})

const providerTitle = computed(() => {
  if (!activeProvider.value) {
    return null
  }

  return providerDefinitions.find((provider) => provider.id === activeProvider.value)?.title ?? null
})

watch(activeProvider, () => {
  saveNotice.value = ''
})

function goToDashboard() {
  router.push({ path: '/community-configuration' })
}

function onSave() {
  saveNotice.value = 'Configuration saved (prototype).'
}

function updateRegistry(next: AuthoringOption[]) {
  state.authoringRegistry.splice(0, state.authoringRegistry.length, ...next)
}

function updateOutlines(
  next: ReturnType<typeof createInitialState>['articleTypeOutlines'],
) {
  state.articleTypeOutlines.splice(0, state.articleTypeOutlines.length, ...next)
}

function onApprove(suggestion: PendingSuggestion, option: AuthoringOption) {
  state.authoringRegistry.push(option)
  const index = state.pendingSuggestions.findIndex((entry) => entry.id === suggestion.id)
  if (index !== -1) {
    state.pendingSuggestions.splice(index, 1)
  }
}

function onReject(suggestionId: string) {
  const index = state.pendingSuggestions.findIndex((entry) => entry.id === suggestionId)
  if (index !== -1) {
    state.pendingSuggestions.splice(index, 1)
  }
}
</script>

<template>
  <ChromeWrapper :last-edited-notice="false">
    <SpecialPageWrapper
      :title="activeProvider ? undefined : 'Community Configuration'"
      :actions="Boolean(activeProvider)"
      class="community-configuration"
    >
      <template v-if="activeProvider" #title>
        <nav class="community-configuration__breadcrumb" aria-label="Breadcrumb">
          <button type="button" class="community-configuration__crumb" @click="goToDashboard">
            Community Configuration
          </button>
          <span aria-hidden="true">→</span>
          <span>{{ providerTitle }}</span>
        </nav>
      </template>

      <template v-if="activeProvider" #actions>
        <CdxButton weight="quiet" @click="goToDashboard">Cancel</CdxButton>
        <CdxButton weight="primary" @click="onSave">Save</CdxButton>
      </template>

      <CdxMessage v-if="saveNotice && activeProvider" type="success" class="community-configuration__notice">
        {{ saveNotice }}
      </CdxMessage>

      <CommunityConfigDashboard
        v-if="!activeProvider"
        :pending-count="state.pendingSuggestions.length"
      />

      <AuthoringRegistryEditor
        v-else-if="activeProvider === 'authoring-registry'"
        :registry="state.authoringRegistry"
        @update="updateRegistry"
      />

      <ArticleOutlinesEditor
        v-else-if="activeProvider === 'article-outlines'"
        :registry="state.authoringRegistry"
        :outlines="state.articleTypeOutlines"
        @update-outlines="updateOutlines"
      />

      <PendingSuggestionsEditor
        v-else-if="activeProvider === 'pending-suggestions'"
        :pending="state.pendingSuggestions"
        :registry="state.authoringRegistry"
        @approve="onApprove"
        @reject="onReject"
      />
    </SpecialPageWrapper>
  </ChromeWrapper>
</template>

<style scoped>
.community-configuration__breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--spacing-50);
  margin: 0;
  font-size: var(--font-size-xx-large);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-xx-large);
}

.community-configuration__crumb {
  padding: 0;
  border: none;
  background: none;
  color: var(--color-progressive);
  font: inherit;
  cursor: pointer;
}

.community-configuration__crumb:hover {
  text-decoration: underline;
}

.community-configuration__notice {
  margin-bottom: var(--spacing-100);
}
</style>
