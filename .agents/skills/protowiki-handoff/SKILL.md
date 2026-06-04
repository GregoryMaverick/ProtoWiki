---
name: protowiki-handoff
description: ProtoWiki prototype-to-production handoff — Engineer Mode inspector (available before promotion), on-demand handoff.ts promotion, engineering handoff pages at /handoffs/<slug>, and portable data-wm-handoff-* annotations for Wikimedia prototypes outside ProtoWiki. Use when promoting a prototype for engineering, annotating UI for handoff, or helping engineers move from prototype to MediaWiki production.
license: MIT
---

# ProtoWiki handoff

Two layers:

1. **Engineer Mode / Inspector** — always available on any prototype route. Toggle via the floating **Engineer Mode** button or `?engineerMode=1`. Click elements to see **Codex component names** (e.g. `CdxButton`), **ProtoWiki component names**, matched **design token** names (`--spacing-100`, `--color-progressive`), computed styles, accessibility hints, and `data-wm-handoff-*` notes. Works **before** formal promotion.
2. **Formal handoff package** — created only when a designer promotes a prototype. Adds `src/prototypes/<slug>/handoff.ts` and a page at `/handoffs/<slug>`.

## Promote a prototype for engineering

```bash
npm run handoff:new -- my-feature
```

This creates [`src/prototypes/<slug>/handoff.ts`](../../../src/prototypes/) (only if the prototype folder and `index.vue` already exist). Edit the file: goal, flows, states, data needs, engineering questions, acceptance criteria. Set `status` to `ready-for-engineering` when ready.

The gallery shows an **Engineering handoff** link only for prototypes that have `handoff.ts`.

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
| Handoff types + inspector helpers | `src/lib/handoff.ts` |
| Codex component + token detection | `src/lib/handoffCodex.ts` |
| Registry (`import.meta.glob` on `**/handoff.ts`) | `src/lib/handoffRegistry.ts` |
| Engineer Mode toggle + click inspector | `src/components/handoff/EngineerMode.vue` |
| Inspector panel (Codex UI) | `src/components/handoff/HandoffInspectorPanel.vue` |
| Copyable inspector fields | `src/components/handoff/HandoffInspectorCopyField.vue` |
| Handoff page UI | `src/components/handoff/HandoffPage.vue` |
| Dynamic route `/handoffs/:slug` | `src/handoffs/[slug]/index.vue` |
| Create handoff script | `scripts/create-handoff.mjs` |

## Outside ProtoWiki

The same `data-wm-handoff-*` attributes and a JSON/TS handoff metadata shape can be used in vibe-coded Wikimedia prototypes. ProtoWiki is the reference implementation; a future **Wikimedia Prototype Handoff Kit** could ship a standalone inspector script and Cursor skill for non-ProtoWiki repos.

## Related skills

- [`protowiki-create-prototype`](../protowiki-create-prototype/SKILL.md) — add the prototype first
- [`protowiki-deploy`](../protowiki-deploy/SKILL.md) — share handoff via PR preview URLs
- [`codex-usage`](../codex-usage/SKILL.md) — prefer Codex components in prototypes engineers will implement
