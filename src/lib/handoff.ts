/**
 * Wikimedia prototype handoff metadata and inspector attribute conventions.
 * Uses `data-wm-handoff-*` so annotations work outside ProtoWiki too.
 */

import {
  primaryInspectorLabel,
  resolveComponentInfo,
  resolveTokenMatches,
  type HandoffComponentInfo,
  type HandoffTokenMatch,
} from './handoffCodex'

export type { HandoffComponentInfo, HandoffTokenMatch } from './handoffCodex'
export { primaryInspectorLabel, resolveInspectableElement } from './handoffCodex'

export type HandoffStatus = 'draft' | 'ready-for-engineering' | 'in-engineering'

export interface PrototypeHandoff {
  slug: string
  title: string
  status: HandoffStatus
  /** Route to the live prototype, e.g. `/template-chrome`. */
  prototypeRoute: string
  goal: string
  approvedFlows: string[]
  statesCovered: string[]
  codexComponents: string[]
  dataNeeds: string[]
  accessibilityNotes: string[]
  prototypeShortcuts: string[]
  engineeringQuestions: string[]
  acceptanceCriteria: string[]
}

/** Route for the engineering handoff page for a slug. */
export function handoffRouteForSlug(slug: string): string {
  return `/handoffs/${slug}`
}

/** Width of the Engineer Mode inspector panel — keep in sync with global layout CSS. */
export const PROTOWIKI_INSPECTOR_WIDTH = 'min(20rem, 100vw)'

/** `data-wm-handoff-*` attribute names (framework-agnostic). */
export const WM_HANDOFF_ATTR = {
  name: 'data-wm-handoff-name',
  behavior: 'data-wm-handoff-behavior',
  productionNote: 'data-wm-handoff-production-note',
  component: 'data-wm-handoff-component',
} as const

export interface WmHandoffElementNotes {
  name?: string
  behavior?: string
  productionNote?: string
}

export function readWmHandoffNotes(el: Element): WmHandoffElementNotes {
  return {
    name: el.getAttribute(WM_HANDOFF_ATTR.name) ?? undefined,
    behavior: el.getAttribute(WM_HANDOFF_ATTR.behavior) ?? undefined,
    productionNote: el.getAttribute(WM_HANDOFF_ATTR.productionNote) ?? undefined,
  }
}

export function elementHasWmHandoffNotes(el: Element): boolean {
  const notes = readWmHandoffNotes(el)
  return Boolean(notes.name || notes.behavior || notes.productionNote)
}

interface CssBoxEdges {
  top: string
  right: string
  bottom: string
  left: string
}

interface HandoffLayoutSnapshot {
  x: number
  y: number
  width: number
  height: number
  display: string
  position: string
  zIndex: string
  overflow: string
}

interface HandoffTypographySnapshot {
  fontFamily: string
  fontSize: string
  fontWeight: string
  lineHeight: string
  letterSpacing: string
  textAlign: string
}

interface HandoffColorSnapshot {
  color: string
  backgroundColor: string
  borderColor: string
  opacity: string
  contrastRatio: string | null
}

interface HandoffDomAttribute {
  name: string
  value: string
}

/** Subset of computed styles useful for engineering handoff (not a Figma clone). */
export interface HandoffComputedStyleSnapshot {
  display: string
  width: string
  height: string
  margin: string
  padding: string
  fontSize: string
  fontWeight: string
  lineHeight: string
  color: string
  backgroundColor: string
  border: string
}

function edgeSnapshot(s: CSSStyleDeclaration, prefix: 'margin' | 'padding'): CssBoxEdges {
  return {
    top: s.getPropertyValue(`${prefix}-top`),
    right: s.getPropertyValue(`${prefix}-right`),
    bottom: s.getPropertyValue(`${prefix}-bottom`),
    left: s.getPropertyValue(`${prefix}-left`),
  }
}

function rounded(value: number): number {
  return Math.round(value * 100) / 100
}

function parseRgb(value: string): [number, number, number] | null {
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const linear = [r, g, b].map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

function contrastRatio(foreground: string, background: string): string | null {
  const fg = parseRgb(foreground)
  const bg = parseRgb(background)
  if (!fg || !bg) return null

  const l1 = relativeLuminance(fg)
  const l2 = relativeLuminance(bg)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return `${((lighter + 0.05) / (darker + 0.05)).toFixed(2)}:1`
}

export function snapshotComputedStyles(el: Element): HandoffComputedStyleSnapshot {
  const s = getComputedStyle(el)
  return {
    display: s.display,
    width: s.width,
    height: s.height,
    margin: s.margin,
    padding: s.padding,
    fontSize: s.fontSize,
    fontWeight: s.fontWeight,
    lineHeight: s.lineHeight,
    color: s.color,
    backgroundColor: s.backgroundColor,
    border: s.border,
  }
}

function selectorPathForElement(el: Element): string {
  const parts: string[] = []
  let current: Element | null = el

  while (current && current !== document.body && parts.length < 5) {
    const tag = current.tagName.toLowerCase()
    const id = current.id ? `#${current.id}` : ''
    const className = [...current.classList].slice(0, 2).map((c) => `.${c}`).join('')
    parts.unshift(`${tag}${id}${className}`)
    current = current.parentElement
  }

  return parts.join(' > ')
}

function readableAttributes(el: Element): HandoffDomAttribute[] {
  return [...el.attributes]
    .filter((attr) => attr.name !== 'style')
    .map((attr) => ({
      name: attr.name,
      value: attr.value,
    }))
    .slice(0, 12)
}

export interface HandoffElementInspection {
  tagName: string
  /** Best label for UI (handoff name, Codex component, or tag). */
  displayName: string
  selectorPath: string
  id: string | null
  className: string | null
  text: string
  role: string | null
  ariaLabel: string | null
  attributes: HandoffDomAttribute[]
  components: HandoffComponentInfo
  designTokens: HandoffTokenMatch[]
  notes: WmHandoffElementNotes
  layout: HandoffLayoutSnapshot
  margin: CssBoxEdges
  padding: CssBoxEdges
  typography: HandoffTypographySnapshot
  colors: HandoffColorSnapshot
  styles: HandoffComputedStyleSnapshot
}

export function inspectHandoffElement(el: Element): HandoffElementInspection {
  const text = (el.textContent ?? '').trim().slice(0, 200)
  const s = getComputedStyle(el)
  const rect = el.getBoundingClientRect()
  const notes = readWmHandoffNotes(el)
  const components = resolveComponentInfo(el)
  const tagName = el.tagName.toLowerCase()

  return {
    tagName,
    displayName: primaryInspectorLabel(components, notes.name, tagName),
    selectorPath: selectorPathForElement(el),
    id: el.id || null,
    className: el.getAttribute('class'),
    text,
    role: el.getAttribute('role'),
    ariaLabel: el.getAttribute('aria-label'),
    attributes: readableAttributes(el),
    components,
    designTokens: resolveTokenMatches(el),
    notes,
    layout: {
      x: rounded(rect.left),
      y: rounded(rect.top),
      width: rounded(rect.width),
      height: rounded(rect.height),
      display: s.display,
      position: s.position,
      zIndex: s.zIndex,
      overflow: s.overflow,
    },
    margin: edgeSnapshot(s, 'margin'),
    padding: edgeSnapshot(s, 'padding'),
    typography: {
      fontFamily: s.fontFamily,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      lineHeight: s.lineHeight,
      letterSpacing: s.letterSpacing,
      textAlign: s.textAlign,
    },
    colors: {
      color: s.color,
      backgroundColor: s.backgroundColor,
      borderColor: s.borderColor,
      opacity: s.opacity,
      contrastRatio: contrastRatio(s.color, s.backgroundColor),
    },
    styles: snapshotComputedStyles(el),
  }
}

/** First path segment for top-level prototype routes, or slug from `/handoffs/:slug`. */
export function prototypeSlugFromPath(path: string): string | null {
  const segments = path.replace(/^\/|\/$/g, '').split('/').filter(Boolean)
  if (segments.length === 0) return null
  if (segments[0] === 'handoffs' && segments.length >= 2) return segments[1]
  if (segments[0] === 'handoffs') return null
  return segments[0]
}

export function createEmptyHandoff(slug: string, title: string): PrototypeHandoff {
  return {
    slug,
    title,
    status: 'draft',
    prototypeRoute: `/${slug}`,
    goal: '',
    approvedFlows: [],
    statesCovered: [],
    codexComponents: [],
    dataNeeds: [],
    accessibilityNotes: [],
    prototypeShortcuts: [],
    engineeringQuestions: [],
    acceptanceCriteria: [],
  }
}
