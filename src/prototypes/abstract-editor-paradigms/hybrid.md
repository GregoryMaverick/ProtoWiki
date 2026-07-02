# Hybrid Editor Paradigm (Section 10)

Living document for the **recommended hybrid** authoring flow from the Abstract UI redesign exploration.

**Prototype route:** `/abstract-editor-paradigms` (default) or `?variant=hybrid`  
**Code:** [`HybridEditorPanel.vue`](./HybridEditorPanel.vue), [`mock-registry.ts`](./mock-registry.ts), preview in [`index.vue`](./index.vue)

---

## Mental model

The editor does not pick a single paradigm. They follow one integrated path:

```text
Wikidata suggestion layer
→ Information-first selection
→ Fragment card composer (sections)
→ sentence/template fields
→ optional citation prompt
→ multilingual preview
→ structure/function reveal
```

**Core principle:** hide function composition by default, but never hide that structured composition exists.

---

## Target flow

1. Open the **Hybrid · Recommended** tab for **Steve Wozniak**.
2. See **Wikidata suggestions** (occupation, date of birth, etc.) with preview sentences.
3. Click **Insert fragment** on a suggestion, or use **+ Add information** for manual entry.
4. Information picker groups types by section (Lead, Early life, Career).
5. Compose form shows information label + sentence pattern (`[Person] is a [class]`) + fields.
6. Fragment lands in the correct **section tab** with editable fields.
7. Optional **citation prompt** nudges after insert; citation form uses mock `simple cite web`.
8. Preview panel shows text in **English, Spanish, or German** (mock renderers).
9. **Show structure** → Structure mode (mapping metadata) → **Show function tree** → Function mode (nested mock AST).

---

## Paradigms combined

| Layer | Source paradigm | Role in hybrid |
| --- | --- | --- |
| Wikidata strip | P2 Data-driven scaffold | Accelerate stub building; not the only path |
| + Add information | P1 Information-first | Primary manual entry |
| Section tabs + cards | P9 Fragment card composer | Article-shaped editing surface |
| Pattern chips + fields | P3 Sentence templates | User-facing sentence shape |
| Citation prompt | Cross-cutting | Verifiability without function jargon |
| Language selector | Cross-cutting | Multilingual rendering preview |
| Structure / Function | Mode architecture §7 | Progressive disclosure for reviewers |

---

## Current implementation

- [x] Wikidata suggestion strip with insert action
- [x] + Add information picker grouped by section
- [x] Compose form with pattern chip, fields, Wikidata hints, live preview
- [x] Section tabs (Lead, Early life, Career) with fragment stacks
- [x] Per-fragment citation prompt + `CitationEditorPanel`
- [x] Multilingual preview (en / es / de mock)
- [x] Three-tier reveal: Article → Structure → Function
- [x] Shared mock registry (`mock-registry.ts`)

### Not yet implemented

- [ ] Fragment reorder within a section
- [ ] Live Wikidata / Wikifunctions APIs
- [ ] Empty or multi-value Wikidata suggestion states
- [ ] Real ZObject persistence

---

## Mock card registry

| Information type | Section | Pattern | Wikidata (mock) |
| --- | --- | --- | --- |
| Occupation | Lead | `[Person] is a [class]` | P106 · software engineer |
| Date of birth | Lead | `[Person] was born on [Date]` | P569 · August 11, 1950 |
| Place of birth | Early life | `[Person] was born in [Place]` | P19 · San Jose, California |
| Education | Early life | `[Person] studied at [Institution]` | P69 · UC Berkeley |
| Notable work | Career | `[Person] is a [role] of [Organization]` | P800 · Apple |
| Award | Career | `[Person] received the [Award]` | P166 · National Medal of Technology |

---

## Review log

*(Add testing notes here.)*
