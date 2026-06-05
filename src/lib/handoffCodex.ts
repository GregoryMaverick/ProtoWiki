/**
 * Codex component + design token detection for Engineer Mode inspector.
 */

import lightTokensRaw from '@wikimedia/codex-design-tokens/theme-wikimedia-ui.css?raw'
import darkTokensRaw from '@wikimedia/codex-design-tokens/theme-wikimedia-ui-mode-dark.css?raw'

export interface HandoffComponentInfo {
  /** Nearest Codex Vue component (e.g. CdxButton). */
  codexComponent: string | null
  /** Codex BEM modifiers on that component root (e.g. weight-quiet). */
  codexModifiers: string[]
  /** ProtoWiki shipped components in the Vue parent chain. */
  protowikiComponents: string[]
  /** Other Vue components in the parent chain (deduped). */
  vueComponents: string[]
}

export interface HandoffTokenMatch {
  property: string
  token: string
  computed: string
}

const PROTOWIKI_COMPONENTS = new Set([
  'ChromeWrapper',
  'ChromeHeader',
  'ChromeFooter',
  'PlainWrapper',
  'SpecialPageWrapper',
  'MobileWrapper',
  'ArticleWrapper',
  'ArticleRenderer',
  'ArticleLive',
  'ArticleSnapshot',
  'ArticleCustom',
  'ArticleHeader',
  'SearchBar',
  'Dashboard',
  'DashboardModule',
  'PrototypeUserSettingsPopover',
])

const VUE_INTERNAL_NAMES = new Set([
  'BaseTransition',
  'BaseTransitionGroup',
  'RouterView',
  'RouterLink',
  'Transition',
  'TransitionGroup',
  'AsyncComponentWrapper',
])

const tokenValueByName = buildTokenLookup([lightTokensRaw, darkTokensRaw])

const STYLED_PROPERTIES: Array<{ label: string; cssProp: string; tokenPrefixes: string[] }> = [
  { label: 'color', cssProp: 'color', tokenPrefixes: ['--color-'] },
  {
    label: 'background-color',
    cssProp: 'background-color',
    tokenPrefixes: ['--background-color-'],
  },
  { label: 'border-color', cssProp: 'border-color', tokenPrefixes: ['--border-color-'] },
  { label: 'font-size', cssProp: 'font-size', tokenPrefixes: ['--font-size-'] },
  { label: 'font-weight', cssProp: 'font-weight', tokenPrefixes: ['--font-weight-'] },
  { label: 'line-height', cssProp: 'line-height', tokenPrefixes: ['--line-height-'] },
  { label: 'padding-top', cssProp: 'padding-top', tokenPrefixes: ['--spacing-'] },
  { label: 'padding-right', cssProp: 'padding-right', tokenPrefixes: ['--spacing-'] },
  { label: 'padding-bottom', cssProp: 'padding-bottom', tokenPrefixes: ['--spacing-'] },
  { label: 'padding-left', cssProp: 'padding-left', tokenPrefixes: ['--spacing-'] },
  { label: 'margin-top', cssProp: 'margin-top', tokenPrefixes: ['--spacing-'] },
  { label: 'margin-right', cssProp: 'margin-right', tokenPrefixes: ['--spacing-'] },
  { label: 'margin-bottom', cssProp: 'margin-bottom', tokenPrefixes: ['--spacing-'] },
  { label: 'margin-left', cssProp: 'margin-left', tokenPrefixes: ['--spacing-'] },
  { label: 'gap', cssProp: 'gap', tokenPrefixes: ['--spacing-'] },
  { label: 'border-radius', cssProp: 'border-radius', tokenPrefixes: ['--border-radius-'] },
]

function buildTokenLookup(sources: string[]): Map<string, string> {
  const map = new Map<string, string>()
  const re = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g

  for (const raw of sources) {
    for (const match of raw.matchAll(re)) {
      const name = `--${match[1]}`
      const value = match[2].trim()
      if (!map.has(name)) map.set(name, value)
    }
  }

  return map
}

function rootFontSizePx(): number {
  const size = getComputedStyle(document.documentElement).fontSize
  const n = parseFloat(size)
  return Number.isFinite(n) ? n : 16
}

function rgbToHex(rgb: string): string | null {
  const match = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (!match) return null
  const hex = [match[1], match[2], match[3]]
    .map((n) => Number(n).toString(16).padStart(2, '0'))
    .join('')
  return `#${hex}`
}

function normalizeCSSValue(value: string, fontSizePx: number): string {
  const v = value.trim().toLowerCase()
  if (!v || v === 'none' || v === 'auto' || v === 'normal') return v

  const rgbHex = rgbToHex(v)
  if (rgbHex) return rgbHex

  if (v.endsWith('rem')) {
    const n = parseFloat(v)
    if (Number.isFinite(n)) return `${Math.round(n * fontSizePx * 100) / 100}px`
  }

  if (v.endsWith('px')) {
    const n = parseFloat(v)
    if (Number.isFinite(n)) return `${Math.round(n * 100) / 100}px`
  }

  return v
}

function tokenRawToComparable(raw: string, fontSizePx: number): string {
  const trimmed = raw.trim().toLowerCase()
  if (trimmed.startsWith('#')) {
    if (trimmed.length === 4) {
      return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`
    }
    return trimmed
  }
  return normalizeCSSValue(trimmed, fontSizePx)
}

/** Skip multi-value, calc(), or var() tokens — they cause false matches on single-value props. */
function isMatchableTokenValue(raw: string): boolean {
  const t = raw.trim()
  if (!t || t.includes('var(') || t.includes('calc(')) return false
  if (/\s/.test(t)) return false
  return true
}

function scoreTokenForProperty(token: string, tokenPrefixes: string[]): number {
  for (let i = 0; i < tokenPrefixes.length; i++) {
    if (token.startsWith(tokenPrefixes[i])) {
      return 1000 - i * 10 + token.length
    }
  }
  return -1
}

function findTokenForComputed(
  computed: string,
  fontSizePx: number,
  tokenPrefixes: string[],
): string | null {
  const target = normalizeCSSValue(computed, fontSizePx)
  if (!target || target === 'auto' || target === 'none' || target === 'normal') return null

  let best: { token: string; score: number } | null = null

  for (const [token, raw] of tokenValueByName.entries()) {
    const score = scoreTokenForProperty(token, tokenPrefixes)
    if (score < 0) continue
    if (!isMatchableTokenValue(raw)) continue
    if (tokenRawToComparable(raw, fontSizePx) !== target) continue

    if (!best || score > best.score) {
      best = { token, score }
    }
  }

  return best?.token ?? null
}

function codexClassToComponentName(className: string): string | null {
  const base = className.split('__')[0].split('--')[0]
  if (!base.startsWith('cdx-')) return null

  const parts = base.slice(4).split('-').filter(Boolean)
  if (parts.length === 0) return null

  return `Cdx${parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('')}`
}

function codexBlockClassFromElement(el: Element): string | null {
  for (const cls of el.classList) {
    const base = cls.split('__')[0].split('--')[0]
    if (base.startsWith('cdx-') && codexClassToComponentName(base)) return base
  }
  return null
}

/** Innermost Codex component root on the element or its ancestors. */
function resolveCodexFromDom(el: Element): Pick<HandoffComponentInfo, 'codexComponent' | 'codexModifiers'> {
  let node: Element | null = el

  while (node && node !== document.body) {
    const blockClass = codexBlockClassFromElement(node)
    if (blockClass) {
      const component = codexClassToComponentName(blockClass)
      if (component) {
        const modifiers = [...node.classList]
          .filter((cls) => cls.startsWith(blockClass) && cls.includes('--'))
          .map((cls) => cls.slice(blockClass.length + 2))
          .filter(Boolean)

        return {
          codexComponent: component,
          codexModifiers: [...new Set(modifiers)],
        }
      }
    }
    node = node.parentElement
  }

  return { codexComponent: null, codexModifiers: [] }
}

/**
 * Prefer the innermost inspectable node: handoff annotation, Codex block, or raw target.
 */
export function resolveInspectableElement(target: Element): Element {
  const annotated = target.closest(
    '[data-wm-handoff-name], [data-wm-handoff-behavior], [data-wm-handoff-production-note]',
  )
  if (annotated) return annotated

  let node: Element | null = target
  while (node && node !== document.body) {
    if (codexBlockClassFromElement(node)) return node
    node = node.parentElement
  }

  return target
}

interface VueParentComponent {
  type?: { __name?: string; name?: string }
  parent?: VueParentComponent | null
}

function resolveVueComponentChain(el: Element): string[] {
  const names: string[] = []
  const seen = new Set<string>()

  let instance = (el as HTMLElement & { __vueParentComponent?: VueParentComponent }).__vueParentComponent

  while (instance) {
    const name = instance.type?.__name || instance.type?.name
    if (name && !seen.has(name) && !VUE_INTERNAL_NAMES.has(name)) {
      seen.add(name)
      names.push(name)
    }
    instance = instance.parent ?? null
  }

  return names
}

function readComponentOverride(el: Element): string | null {
  const onSelf = el.getAttribute('data-wm-handoff-component')
  if (onSelf) return onSelf
  const ancestor = el.closest('[data-wm-handoff-component]')
  return ancestor?.getAttribute('data-wm-handoff-component') ?? null
}

export function resolveComponentInfo(el: Element): HandoffComponentInfo {
  const vueComponents = resolveVueComponentChain(el)
  const codexFromDom = resolveCodexFromDom(el)
  const override = readComponentOverride(el)

  const protowikiComponents = vueComponents.filter((name) => PROTOWIKI_COMPONENTS.has(name))

  // DOM innermost block beats Vue parent (e.g. CdxTab inside CdxTabs).
  let codexComponent = codexFromDom.codexComponent ?? vueComponents.find((name) => name.startsWith('Cdx')) ?? null
  if (override?.startsWith('Cdx')) codexComponent = override

  return {
    codexComponent,
    codexModifiers: codexFromDom.codexModifiers,
    protowikiComponents: override && PROTOWIKI_COMPONENTS.has(override)
      ? [override, ...protowikiComponents.filter((n) => n !== override)]
      : protowikiComponents,
    vueComponents,
  }
}

export function resolveTokenMatches(el: Element): HandoffTokenMatch[] {
  const s = getComputedStyle(el)
  const fontSizePx = rootFontSizePx()
  const matches: HandoffTokenMatch[] = []
  const seen = new Set<string>()

  for (const { label, cssProp, tokenPrefixes } of STYLED_PROPERTIES) {
    const computed = s.getPropertyValue(cssProp)
    if (!computed || computed === 'none' || computed === 'auto') continue

    const token = findTokenForComputed(computed, fontSizePx, tokenPrefixes)
    if (!token) continue

    const key = `${label}:${token}`
    if (seen.has(key)) continue
    seen.add(key)

    matches.push({
      property: label,
      token,
      computed,
    })
  }

  return matches
}

/** Primary label for selection overlay / inspector header. */
export function primaryInspectorLabel(
  components: HandoffComponentInfo,
  handoffName: string | undefined,
  tagName: string,
): string {
  if (handoffName) return handoffName
  if (components.codexComponent) return components.codexComponent
  if (components.protowikiComponents[0]) return components.protowikiComponents[0]
  return `<${tagName}>`
}
