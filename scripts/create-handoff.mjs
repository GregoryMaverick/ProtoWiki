#!/usr/bin/env node
/**
 * Create src/prototypes/<slug>/handoff.ts for engineering promotion.
 * Usage: npm run handoff:new -- <slug>
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const prototypesDir = join(root, 'src', 'prototypes')

const slug = process.argv[2]?.trim()
if (!slug) {
  console.error('Usage: npm run handoff:new -- <prototype-slug>')
  console.error('Example: npm run handoff:new -- template-chrome')
  process.exit(1)
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('Slug must be kebab-case (e.g. my-feature).')
  process.exit(1)
}

const protoDir = join(prototypesDir, slug)
const indexVue = join(protoDir, 'index.vue')
if (!existsSync(indexVue)) {
  console.error(`Prototype not found: ${indexVue}`)
  console.error('Create src/prototypes/<slug>/index.vue first.')
  process.exit(1)
}

const handoffPath = join(protoDir, 'handoff.ts')
if (existsSync(handoffPath)) {
  console.error(`Handoff already exists: ${handoffPath}`)
  process.exit(1)
}

let title = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
try {
  const indexSrc = readFileSync(indexVue, 'utf8')
  const titleMatch = indexSrc.match(/title:\s*['"]([^'"]+)['"]/)
  if (titleMatch?.[1]) title = titleMatch[1]
} catch {
  /* use humanized slug */
}

const content = `import type { PrototypeHandoff } from '@/lib/handoff'

export const handoff: PrototypeHandoff = {
  slug: '${slug}',
  title: ${JSON.stringify(title)},
  status: 'draft',
  prototypeRoute: '/${slug}',
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
`

mkdirSync(protoDir, { recursive: true })
writeFileSync(handoffPath, content, 'utf8')

console.log(`Created ${handoffPath}`)
console.log(`Handoff page (after dev server reload): /handoffs/${slug}`)
console.log('Edit the file, set status to ready-for-engineering when done.')
