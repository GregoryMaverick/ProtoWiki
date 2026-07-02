<script setup lang="ts">
import { useRouter } from 'vue-router'

import { providerDefinitions, type ProviderId } from './fixtures'

defineProps<{
  pendingCount: number
}>()

const router = useRouter()

function openProvider(providerId: ProviderId) {
  router.push({ path: '/community-configuration', query: { provider: providerId } })
}
</script>

<template>
  <div class="cc-dashboard">
    <section class="cc-dashboard__intro" aria-labelledby="cc-intro-heading">
      <h2 id="cc-intro-heading" class="cc-dashboard__subheading">What is Community Configuration?</h2>
      <p class="cc-dashboard__lead">
        Community Configuration is a tool that allows communities to set up and control the
        configuration of different Abstract Wikipedia features, helping administrators suit their
        community-specific needs.
      </p>
    </section>

    <div class="cc-dashboard__callouts">
      <section class="cc-dashboard__callout" aria-labelledby="cc-learn-heading">
        <h3 id="cc-learn-heading" class="cc-dashboard__callout-title">Learn more</h3>
        <p>
          <a
            href="https://www.mediawiki.org/wiki/Extension:CommunityConfiguration"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more about Community Configuration
          </a>
          , what it is, how it works, and the team’s ongoing work on it.
        </p>
      </section>

      <section class="cc-dashboard__callout" aria-labelledby="cc-feedback-heading">
        <h3 id="cc-feedback-heading" class="cc-dashboard__callout-title">Send us your feedback</h3>
        <p>
          We would love to hear your thoughts! Reach out to us through our
          <a
            href="https://abstract.wikipedia.org/wiki/Abstract_Wikipedia:Talk"
            target="_blank"
            rel="noopener noreferrer"
          >
            talk page
          </a>
          .
        </p>
      </section>
    </div>

    <section class="cc-dashboard__features" aria-labelledby="cc-features-heading">
      <h2 id="cc-features-heading" class="cc-dashboard__subheading">Features</h2>

      <div class="cc-dashboard__grid">
        <button
          v-for="provider in providerDefinitions"
          :key="provider.id"
          type="button"
          class="cc-dashboard__tile"
          @click="openProvider(provider.id)"
        >
          <span class="cc-dashboard__tile-header">
            <span class="cc-dashboard__tile-title">{{ provider.title }}</span>
            <span
              v-if="provider.id === 'pending-suggestions' && pendingCount > 0"
              class="cc-dashboard__badge"
            >
              {{ pendingCount }} pending
            </span>
          </span>
          <span class="cc-dashboard__tile-description">{{ provider.description }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.cc-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-200);
}

.cc-dashboard__subheading {
  margin: 0 0 var(--spacing-75);
  font-size: var(--font-size-large);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-large);
}

.cc-dashboard__lead {
  margin: 0;
  max-width: 52rem;
  color: var(--color-base);
}

.cc-dashboard__callouts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-100);
}

.cc-dashboard__callout {
  padding: var(--spacing-100);
  border-radius: var(--border-radius-base);
  background-color: var(--background-color-interactive-subtle);
}

.cc-dashboard__callout-title {
  margin: 0 0 var(--spacing-50);
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-bold);
}

.cc-dashboard__callout p {
  margin: 0;
  font-size: var(--font-size-medium);
}

.cc-dashboard__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-100);
}

.cc-dashboard__tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-50);
  width: 100%;
  padding: var(--spacing-100);
  border: 1px solid var(--border-color-subtle);
  border-radius: var(--border-radius-base);
  background-color: var(--background-color-base);
  color: var(--color-base);
  text-align: start;
  cursor: pointer;
  transition: background-color 100ms ease;
}

.cc-dashboard__tile:hover {
  background-color: var(--background-color-interactive-subtle);
}

.cc-dashboard__tile:focus-visible {
  outline: 2px solid var(--border-color-progressive);
  outline-offset: 2px;
}

.cc-dashboard__tile-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-50);
  width: 100%;
}

.cc-dashboard__tile-title {
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-bold);
  color: var(--color-progressive);
}

.cc-dashboard__badge {
  padding: 0 var(--spacing-50);
  border-radius: var(--border-radius-pill);
  background-color: var(--background-color-notice-subtle);
  color: var(--color-base);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-normal);
}

.cc-dashboard__tile-description {
  font-size: var(--font-size-medium);
  color: var(--color-base);
}

@media (max-width: 48rem) {
  .cc-dashboard__callouts,
  .cc-dashboard__grid {
    grid-template-columns: 1fr;
  }
}
</style>
