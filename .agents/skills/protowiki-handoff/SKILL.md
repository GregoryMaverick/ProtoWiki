---
name: protowiki-handoff
description: ProtoWiki Engineer Mode visual inspector — click-to-inspect on any prototype, Codex component detection, design tokens, layout/box model, distance measurements, and portable data-wm-handoff-* annotations. Use when annotating UI for developer handoff or helping engineers inspect prototypes.
license: MIT
---

# ProtoWiki Engineer Mode

**Engineer Mode / Inspector** — available on any prototype route. Toggle via the floating **Engineer Mode** button or `?engineerMode=1`. Click elements to see **Codex component names** (e.g. `CdxButton`), **ProtoWiki component names**, matched **design token** names (`--spacing-100`, `--color-progressive`), layout, box model, typography, and `data-wm-handoff-*` notes.

## Annotate important UI

Use framework-agnostic attributes (portable outside ProtoWiki):

```vue
<CdxButton
  data-wm-handoff-name="Publish button"
  data-wm-handoff-behavior="Submits the edit summary"
  data-wm-handoff-production-note="Needs real edit API and permission checks"
>
  Publish
</CdxButton>
```

Optional override when detection is ambiguous:

```html
<div data-wm-handoff-component="CdxMenu">…</div>
```

Constants live in [`src/lib/handoff.ts`](../../../src/lib/handoff.ts) (`WM_HANDOFF_ATTR`).

## Key paths

| Piece | Location |
| --- | --- |
| Inspector helpers + annotation attrs | `src/lib/handoff.ts` |
| Codex component + token detection | `src/lib/handoffCodex.ts` |
| Engineer Mode toggle + click inspector | `src/components/handoff/EngineerMode.vue` |
| Inspector panel | `src/components/handoff/HandoffInspectorPanel.vue` |
| URL-synced toggle | `src/composables/useEngineerMode.ts` |

## Outside ProtoWiki

The same `data-wm-handoff-*` attributes can be used in vibe-coded Wikimedia prototypes. ProtoWiki is the reference implementation for the inspector pattern.

## Related skills

- [`protowiki-create-prototype`](../protowiki-create-prototype/SKILL.md) — add the prototype first
- [`protowiki-deploy`](../protowiki-deploy/SKILL.md) — share prototypes via PR preview URLs
- [`codex-usage`](../codex-usage/SKILL.md) — prefer Codex components in prototypes engineers will implement
