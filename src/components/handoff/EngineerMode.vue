<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

import { useEngineerMode } from '@/composables/useEngineerMode'
import {
  inspectHandoffElement,
  PROTOWIKI_INSPECTOR_WIDTH,
  prototypeSlugFromPath,
  resolveInspectableElement,
  type HandoffElementInspection,
} from '@/lib/handoff'
import { getHandoffBySlug } from '@/lib/handoffRegistry'

import { CdxButton } from '@wikimedia/codex'

import HandoffInspectorPanel from './HandoffInspectorPanel.vue'

const route = useRoute()
const { isActive, toggle } = useEngineerMode()

const selectedElement = ref<Element | null>(null)
const selectedInspection = ref<HandoffElementInspection | null>(null)
const selectionRect = ref<DOMRect | null>(null)

const prototypeSlug = computed(() => prototypeSlugFromPath(route.path))

const handoff = computed(() => {
  const slug = prototypeSlug.value
  return slug ? (getHandoffBySlug(slug) ?? null) : null
})

const selectionLabel = computed(() => selectedInspection.value?.displayName ?? '')

const selectionBoxStyle = computed(() => {
  const rect = selectionRect.value
  if (!rect) return undefined
  return {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  }
})

const selectionLabelStyle = computed(() => {
  const rect = selectionRect.value
  if (!rect) return undefined
  const labelAbove = rect.top >= 24
  return {
    top: labelAbove ? `${rect.top}px` : `${rect.bottom}px`,
    left: `${rect.left}px`,
    transform: labelAbove ? 'translateY(calc(-100% - 2px))' : 'translateY(2px)',
  }
})

let selectionRafId: number | null = null

function updateSelectionRect() {
  const el = selectedElement.value
  if (!el || !el.isConnected) {
    selectionRect.value = null
    return
  }
  selectionRect.value = el.getBoundingClientRect()
}

function scheduleSelectionRectUpdate() {
  if (selectionRafId != null) cancelAnimationFrame(selectionRafId)
  selectionRafId = requestAnimationFrame(() => {
    selectionRafId = null
    updateSelectionRect()
  })
}

function selectElement(el: Element) {
  selectedElement.value = el
  selectedInspection.value = inspectHandoffElement(el)
  updateSelectionRect()
}

function clearSelection() {
  selectedElement.value = null
  selectedInspection.value = null
  selectionRect.value = null
}

function onDocumentClick(event: MouseEvent) {
  if (!isActive.value) return

  const target = event.target
  if (!(target instanceof Element)) return

  if (target.closest('.engineer-mode-ui')) return

  const el = resolveInspectableElement(target)
  selectElement(el)
  event.preventDefault()
  event.stopPropagation()
}

watchEffect((onCleanup) => {
  if (!isActive.value || !selectedElement.value) return

  updateSelectionRect()

  window.addEventListener('scroll', scheduleSelectionRectUpdate, true)
  window.addEventListener('resize', scheduleSelectionRectUpdate)

  const ro = new ResizeObserver(scheduleSelectionRectUpdate)
  ro.observe(selectedElement.value)

  onCleanup(() => {
    window.removeEventListener('scroll', scheduleSelectionRectUpdate, true)
    window.removeEventListener('resize', scheduleSelectionRectUpdate)
    ro.disconnect()
  })
})

function updateBodyClass(active: boolean) {
  document.body.classList.toggle('protowiki-engineer-mode', active)
}

function updateInspectorLayout(open: boolean) {
  const root = document.documentElement
  root.classList.toggle('protowiki-inspector-open', open)
  if (open) {
    root.style.setProperty('--protowiki-inspector-width', PROTOWIKI_INSPECTOR_WIDTH)
  } else {
    root.style.removeProperty('--protowiki-inspector-width')
  }
}

watch(isActive, (active) => {
  updateBodyClass(active)
  if (!active) {
    clearSelection()
  }
})

watch(selectedInspection, (inspection) => {
  updateInspectorLayout(Boolean(inspection))
}, { immediate: true })

watch(
  () => route.path,
  () => {
    clearSelection()
  },
)

onMounted(() => {
  updateBodyClass(isActive.value)
  document.addEventListener('click', onDocumentClick, true)
})

onUnmounted(() => {
  document.body.classList.remove('protowiki-engineer-mode')
  updateInspectorLayout(false)
  document.removeEventListener('click', onDocumentClick, true)
  if (selectionRafId != null) cancelAnimationFrame(selectionRafId)
})

const toggleLabel = computed(() =>
  isActive.value ? 'Exit Engineer Mode' : 'Engineer Mode',
)
</script>

<template>
  <div class="engineer-mode-ui">
    <CdxButton
      class="engineer-mode-ui__toggle"
      :action="isActive ? 'progressive' : 'default'"
      :weight="isActive ? 'primary' : 'normal'"
      :aria-pressed="isActive"
      @click="toggle"
    >
      {{ toggleLabel }}
    </CdxButton>

    <p v-if="isActive" class="engineer-mode-ui__hint">
      Click any element to inspect. Annotated elements use
      <code>data-wm-handoff-*</code>.
    </p>

    <Teleport to="body">
      <div
        v-if="isActive && selectionRect && selectionBoxStyle"
        class="engineer-mode-selection"
        aria-hidden="true"
      >
        <div class="engineer-mode-selection__box" :style="selectionBoxStyle" />
        <div class="engineer-mode-selection__label" :style="selectionLabelStyle">
          {{ selectionLabel }}
        </div>
      </div>
    </Teleport>

    <HandoffInspectorPanel
      :inspection="selectedInspection"
      :handoff="handoff"
      @close="clearSelection"
    />
  </div>
</template>

<style>
/* Global: highlight annotated elements while Engineer Mode is on */
body.protowiki-engineer-mode [data-wm-handoff-name],
body.protowiki-engineer-mode [data-wm-handoff-behavior],
body.protowiki-engineer-mode [data-wm-handoff-production-note] {
  outline: 2px dashed var(--border-color-progressive, #36c);
  outline-offset: 2px;
  cursor: crosshair;
}

/* Figma-style selection overlay (teleported to body) */
.engineer-mode-selection {
  position: fixed;
  inset: 0;
  z-index: 9998;
  pointer-events: none;
}

.engineer-mode-selection__box {
  position: fixed;
  box-sizing: border-box;
  border: 2px solid var(--border-color-progressive, #36c);
  border-radius: 1px;
  background: color-mix(in srgb, var(--border-color-progressive, #36c) 12%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--border-color-progressive, #36c) 35%, transparent);
}

.engineer-mode-selection__label {
  position: fixed;
  max-width: min(20rem, 90vw);
  padding: 2px 6px;
  border-radius: 2px;
  background: var(--border-color-progressive, #36c);
  color: #fff;
  font-family: var(--font-family-system-sans, sans-serif);
  font-size: 11px;
  font-weight: 700;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

<style scoped>
.engineer-mode-ui__toggle {
  position: fixed;
  bottom: var(--spacing-100);
  right: var(--spacing-100);
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transition: right 160ms ease;
}

html.protowiki-inspector-open .engineer-mode-ui__toggle {
  right: calc(var(--protowiki-inspector-width, min(20rem, 100vw)) + var(--spacing-100));
}

.engineer-mode-ui__hint {
  position: fixed;
  bottom: calc(var(--spacing-100, 1rem) + 2.75rem);
  right: var(--spacing-100, 1rem);
  z-index: 9999;
  max-width: 14rem;
  margin: 0;
  padding: var(--spacing-50, 0.5rem);
  border-radius: var(--border-radius-base, 2px);
  background: var(--background-color-inverted, #202122);
  color: var(--color-inverted, #fff);
  font-family: var(--font-family-system-sans, sans-serif);
  font-size: 0.75rem;
  line-height: 1.35;
  transition: right 160ms ease;
}

html.protowiki-inspector-open .engineer-mode-ui__hint {
  right: calc(var(--protowiki-inspector-width, min(20rem, 100vw)) + var(--spacing-100));
}

.engineer-mode-ui__hint code {
  font-size: 0.7rem;
}
</style>
