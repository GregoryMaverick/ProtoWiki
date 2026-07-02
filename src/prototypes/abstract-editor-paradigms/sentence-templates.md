# Sentence Template Paradigm

Living document for **Paradigm 3: Sentence template forms**.

**Prototype route:** `/abstract-editor-paradigms?variant=sentence-templates` (or **P3 · Sentence templates** tab)  
**Code:** [`index.vue`](./index.vue) (sentence-templates panel section)

---

## Mental model

The editor picks a **sentence pattern** (not a function name), fills the blanks, and previews before adding — similar rhythm to Information-first, but patterns are syntactic not semantic.

## How this differs from Paradigm 9

| | **P3 Sentence templates** | **P9 Fragment cards** |
| --- | --- | --- |
| Primary label | `[Person] was born on [Date]` | "Date of birth" |
| Discovery | Global search across patterns | Fixed catalog at top |
| Flow | + Add sentence → search → compose → add | Add card → edit stack |
| Pattern count | 6 (lead, early life, career) | 3 (lead only) |

---

## Current implementation

- [x] `+ Add sentence` entry (like Information-first)
- [x] Searchable pattern picker across full library
- [x] Compose form with Wikidata hints per field + live preview
- [x] Saved sentences show pattern chip + editable slots
- [x] Separate state from Paradigm 9
