import type { PrototypeHandoff } from '@/lib/handoff'

export const handoff: PrototypeHandoff = {
  slug: 'template-dashboard',
  title: 'Template: Dashboard',
  status: 'ready-for-engineering',
  prototypeRoute: '/template-dashboard',
  goal:
    'Ship a reusable newcomer-style dashboard layout (primary column + sidebar on desktop, stacked link cards on mobile) inside Vector/Minerva chrome for special-page experiences.',
  approvedFlows: [
    'Editor opens the special page and sees a desktop two-column dashboard (primary ~66%, sidebar ~34%)',
    'On mobile skin, modules appear as stacked tappable cards with optional CTA strip',
    'Editor taps a mobile module card (with `to`) to navigate to a sub-route',
    'Editor reads static sidebar modules (impact stats, learn/policies) without leaving the page',
    'Optional mobile-only banner slot (e.g. share feedback) appears above the card stack',
  ],
  statesCovered: [
    'desktop — `#primary` + `#sidebar` via default skin',
    'mobile — `#mobile` + `#banner` via `?skin=mobile` or narrow viewport',
    'link card vs static card — `DashboardModule` with and without `to`',
    'CTA strip — `cta="Open module"` vs `cta={null}` to hide strip',
  ],
  codexComponents: ['CdxIcon', 'CdxButton'],
  dataNeeds: [
    'Impact metrics (thanks sent, edits completed) from newcomer/homepage APIs or user preferences',
    'Primary module body (suggested edits, review queue) from product-specific endpoints',
    'Help link target for `SpecialPageWrapper` help affordance',
  ],
  accessibilityNotes: [
    'Mobile link cards use RouterLink with visible title and arrow; ensure focus order matches visual stack',
    'Impact rows pair icon + metric + label — keep meaningful text for screen readers when metrics load',
    'Special page title comes from `useConfig().pageTitle` — wire to real special-page heading in production',
  ],
  prototypeShortcuts: [
    'Placeholder copy and em-dash metrics (`—`) stand in for live data',
    'Module `to` targets and banner link route to gallery home (`/`) for demo navigation only',
    'Chrome tools and last-edited notice are disabled or mocked via `ChromeWrapper` props',
  ],
  engineeringQuestions: [
    'Should `Dashboard` / `DashboardModule` live in GrowthExperiments, a shared library, or core special-page chrome?',
    'Which ResourceLoader / Vue entrypoint mounts dashboard modules on the real newcomer homepage?',
    'How should mobile vs desktop module duplication be authored — one config object or separate templates?',
    'Do impact stats share the same API as `template-homepage` (`dashpage-fixtures` pattern)?',
  ],
  acceptanceCriteria: [
    'Layout matches GrowthExperiments newcomer homepage grid and mobile card stack at 640px breakpoint',
    'Desktop sidebar modules render as static cards; mobile modules with `to` render as full-width link cards',
    'Per-slot sizing hooks (`dashboard-slot--*`) remain available for product-specific min-heights',
    'Engineer Mode surfaces `Dashboard`, `DashboardModule`, and Codex icons on annotated regions',
    'Handoff page documents flows, data needs, and open questions for implementers',
  ],
}
