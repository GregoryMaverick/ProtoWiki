<script setup lang="ts">
import ArticleRenderer from './ArticleRenderer.vue'
import ArticleWrapper from './ArticleWrapper.vue'
import type { Skin, Theme } from '@/theme'

interface Props {
  lang?: string
  dir?: 'ltr' | 'rtl'
  /** Seeds **`ArticleHeader`** when **`header`** is **`undefined`** (underscores → spaces). */
  title?: string
  /** Reader-visible **`ArticleHeader`** override. **`undefined`** → derive from **`title`**. */
  header?: string
  skin?: Skin
  theme?: Theme
  /** Forwarded **`ArticleWrapper`** → **`ArticleHeader`** (**`languagesCount` languages**). */
  languagesCount?: number
  /** Forwarded **`ArticleWrapper`** → **`ArticleHeader`** desktop action tabs. */
  activeAction?: 'read' | 'edit' | 'history'
}

const props = withDefaults(defineProps<Props>(), {
  lang: undefined,
  dir: undefined,
  title: undefined,
  header: undefined,
  skin: undefined,
  theme: undefined,
  languagesCount: undefined,
  activeAction: 'read',
})
</script>

<template>
  <ArticleWrapper
    :lang="props.lang"
    :dir="props.dir"
    :title="props.title"
    :header="props.header"
    :skin="props.skin"
    :theme="props.theme"
    :languages-count="props.languagesCount"
    :active-action="props.activeAction"
  >
    <template v-if="$slots['edit-actions']" #edit-actions>
      <slot name="edit-actions" />
    </template>
    <template v-if="$slots['edit-toolbar']" #edit-toolbar>
      <slot name="edit-toolbar" />
    </template>
    <ArticleRenderer :lang="props.lang" :dir="props.dir" :skin="props.skin" :theme="props.theme">
      <slot />
    </ArticleRenderer>
  </ArticleWrapper>
</template>
