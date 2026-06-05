<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

import { useEngineerMode } from '@/composables/useEngineerMode'
import {
  inspectHandoffElement,
  PROTOWIKI_INSPECTOR_WIDTH,
  resolveInspectableElement,
  type HandoffElementInspection,
} from '@/lib/handoff'

import { CdxButton } from '@wikimedia/codex'

import HandoffInspectorPanel from './HandoffInspectorPanel.vue'

const route = useRoute()
const { isActive, toggle } = useEngineerMode()

const selectedElement = ref<Element | null>(null)
const selectedInspection = ref<HandoffElementInspection | null>(null)
const selectionRect = ref<DOMRect | null>(null)

const hoveredElement = ref<Element | null>(null)
const hoveredRect = ref<DOMRect | null>(null)

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

const hoveredBoxStyle = computed(() => {
  const rect = hoveredRect.value
  if (!rect) return undefined
  return {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  }
})

const measurementLines = computed(() => {
  if (!selectionRect.value || !hoveredRect.value || !selectedElement.value || !hoveredElement.value) return []
  if (selectedElement.value === hoveredElement.value) return []

  const s = selectionRect.value
  const h = hoveredRect.value
  const lines: any[] = []

  // Top distance
  if (s.top > h.top) {
    const height = Math.round(s.top - h.top)
    lines.push({
      id: 'top',
      boxStyle: { top: `${h.top}px`, left: `${s.left + s.width / 2}px`, width: '1px', height: `${height}px` },
      labelStyle: { top: `${h.top + height / 2}px`, left: `${s.left + s.width / 2 + 4}px`, transform: 'translateY(-50%)' },
      value: height
    })
  } else if (h.top > s.bottom) {
    const height = Math.round(h.top - s.bottom)
    lines.push({
      id: 'top-out',
      boxStyle: { top: `${s.bottom}px`, left: `${s.left + s.width / 2}px`, width: '1px', height: `${height}px` },
      labelStyle: { top: `${s.bottom + height / 2}px`, left: `${s.left + s.width / 2 + 4}px`, transform: 'translateY(-50%)' },
      value: height
    })
  }

  // Bottom distance
  if (h.bottom > s.bottom) {
    const height = Math.round(h.bottom - s.bottom)
    lines.push({
      id: 'bottom',
      boxStyle: { top: `${s.bottom}px`, left: `${s.left + s.width / 2}px`, width: '1px', height: `${height}px` },
      labelStyle: { top: `${s.bottom + height / 2}px`, left: `${s.left + s.width / 2 + 4}px`, transform: 'translateY(-50%)' },
      value: height
    })
  } else if (s.top > h.bottom) {
    const height = Math.round(s.top - h.bottom)
    lines.push({
      id: 'bottom-out',
      boxStyle: { top: `${h.bottom}px`, left: `${s.left + s.width / 2}px`, width: '1px', height: `${height}px` },
      labelStyle: { top: `${h.bottom + height / 2}px`, left: `${s.left + s.width / 2 + 4}px`, transform: 'translateY(-50%)' },
      value: height
    })
  }

  // Left distance
  if (s.left > h.left) {
    const width = Math.round(s.left - h.left)
    lines.push({
      id: 'left',
      boxStyle: { top: `${s.top + s.height / 2}px`, left: `${h.left}px`, width: `${width}px`, height: '1px' },
      labelStyle: { top: `${s.top + s.height / 2 + 4}px`, left: `${h.left + width / 2}px`, transform: 'translateX(-50%)' },
      value: width
    })
  } else if (h.left > s.right) {
    const width = Math.round(h.left - s.right)
    lines.push({
      id: 'left-out',
      boxStyle: { top: `${s.top + s.height / 2}px`, left: `${s.right}px`, width: `${width}px`, height: '1px' },
      labelStyle: { top: `${s.top + s.height / 2 + 4}px`, left: `${s.right + width / 2}px`, transform: 'translateX(-50%)' },
      value: width
    })
  }

  // Right distance
  if (h.right > s.right) {
    const width = Math.round(h.right - s.right)
    lines.push({
      id: 'right',
      boxStyle: { top: `${s.top + s.height / 2}px`, left: `${s.right}px`, width: `${width}px`, height: '1px' },
      labelStyle: { top: `${s.top + s.height / 2 + 4}px`, left: `${s.right + width / 2}px`, transform: 'translateX(-50%)' },
      value: width
    })
  } else if (s.left > h.right) {
    const width = Math.round(s.left - h.right)
    lines.push({
      id: 'right-out',
      boxStyle: { top: `${s.top + s.height / 2}px`, left: `${h.right}px`, width: `${width}px`, height: '1px' },
      labelStyle: { top: `${s.top + s.height / 2 + 4}px`, left: `${h.right + width / 2}px`, transform: 'translateX(-50%)' },
      value: width
    })
  }

  return lines.filter(l => l.value > 0)
})

let selectionRafId: number | null = null

function updateRects() {
  const el = selectedElement.value
  if (el && el.isConnected) {
    selectionRect.value = el.getBoundingClientRect()
  } else {
    selectionRect.value = null
  }

  const hel = hoveredElement.value
  if (hel && hel.isConnected) {
    hoveredRect.value = hel.getBoundingClientRect()
  } else {
    hoveredRect.value = null
  }
}

function scheduleSelectionRectUpdate() {
  if (selectionRafId != null) cancelAnimationFrame(selectionRafId)
  selectionRafId = requestAnimationFrame(() => {
    selectionRafId = null
    updateRects()
  })
}

function selectElement(el: Element) {
  selectedElement.value = el
  selectedInspection.value = inspectHandoffElement(el)
  hoveredElement.value = null
  updateRects()
}

function clearSelection() {
  selectedElement.value = null
  selectedInspection.value = null
  selectionRect.value = null
  hoveredElement.value = null
  hoveredRect.value = null
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

function onDocumentMouseMove(event: MouseEvent) {
  if (!isActive.value || !selectedElement.value) return

  const target = event.target
  if (!(target instanceof Element)) return
  if (target.closest('.engineer-mode-ui')) return

  const el = resolveInspectableElement(target)
  if (el !== selectedElement.value) {
    hoveredElement.value = el
  } else {
    hoveredElement.value = null
  }
  updateRects()
}

watchEffect((onCleanup) => {
  if (!isActive.value || !selectedElement.value) return

  updateRects()

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
  document.addEventListener('mousemove', onDocumentMouseMove, true)
})

onUnmounted(() => {
  document.body.classList.remove('protowiki-engineer-mode')
  updateInspectorLayout(false)
  document.removeEventListener('click', onDocumentClick, true)
  document.removeEventListener('mousemove', onDocumentMouseMove, true)
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
        v-if="isActive && hoveredRect && hoveredBoxStyle"
        class="engineer-mode-selection engineer-mode-selection--hover"
        aria-hidden="true"
      >
        <div class="engineer-mode-selection__box" :style="hoveredBoxStyle" />
      </div>

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

      <div
        v-if="isActive && measurementLines.length"
        class="engineer-mode-measurements"
        aria-hidden="true"
      >
        <template v-for="line in measurementLines" :key="line.id">
          <div class="engineer-mode-measurements__line" :style="line.boxStyle" />
          <div class="engineer-mode-measurements__label" :style="line.labelStyle">
            {{ line.value }}
          </div>
        </template>
      </div>
    </Teleport>

    <HandoffInspectorPanel
      :inspection="selectedInspection"
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

.engineer-mode-selection--hover .engineer-mode-selection__box {
  border-color: var(--border-color-destructive, #d33);
  background: color-mix(in srgb, var(--border-color-destructive, #d33) 12%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--border-color-destructive, #d33) 35%, transparent);
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

.engineer-mode-measurements {
  position: fixed;
  inset: 0;
  z-index: 9998;
  pointer-events: none;
}

.engineer-mode-measurements__line {
  position: fixed;
  background: var(--border-color-destructive, #d33);
}

.engineer-mode-measurements__label {
  position: fixed;
  background: var(--border-color-destructive, #d33);
  color: #fff;
  font-family: var(--font-family-system-sans, sans-serif);
  font-size: 10px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 2px;
  white-space: nowrap;
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
