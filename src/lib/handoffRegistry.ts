import type { PrototypeHandoff } from './handoff'

type HandoffModule = { handoff: PrototypeHandoff }

const handoffModules = import.meta.glob<HandoffModule>('../prototypes/**/handoff.ts', {
  eager: true,
})

function slugFromHandoffPath(path: string): string | null {
  const match = path.match(/\/prototypes\/([^/]+)\/handoff\.ts$/)
  return match?.[1] ?? null
}

const handoffsBySlug = new Map<string, PrototypeHandoff>()

for (const [path, mod] of Object.entries(handoffModules)) {
  const slug = slugFromHandoffPath(path)
  if (!slug || !mod?.handoff) continue
  handoffsBySlug.set(slug, mod.handoff)
}

export function getHandoffBySlug(slug: string): PrototypeHandoff | undefined {
  return handoffsBySlug.get(slug)
}

export function hasHandoff(slug: string): boolean {
  return handoffsBySlug.has(slug)
}

export function getAllHandoffs(): PrototypeHandoff[] {
  return [...handoffsBySlug.values()].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
  )
}

export function getHandoffSlugs(): string[] {
  return [...handoffsBySlug.keys()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}
