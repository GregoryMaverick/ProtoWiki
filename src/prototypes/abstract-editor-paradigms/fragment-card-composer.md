# Fragment Card Composer Paradigm

Living document for **Paradigm 9: Fragment card composer**.

**Prototype route:** `/abstract-editor-paradigms?variant=fragments` (or **P9 · Fragment cards** tab)  
**Code:** [`index.vue`](./index.vue) (fragments panel section)

---

## Mental model

The editor adds **fragment cards** from a short catalog. Each card is a lead-level sentence unit with multiple fields, prefilled on add.

## How this differs from Paradigm 3

| | **P9 Fragment cards** | **P3 Sentence templates** |
| --- | --- | --- |
| Entry | Always-visible catalog with **Add card** | **+ Add sentence** → search patterns |
| Discovery | Friendly card names ("Basic introduction") | Bracket patterns (`[Person] is a [class]`) |
| Library | 3 lead cards (original prototype) | 6 searchable patterns |
| Add flow | One-click add, edit in stack | Search → compose → preview → add |

---

## Current implementation

- [x] Flat catalog: Basic introduction, Date of birth, Founder / notable work
- [x] One-click **Add card** with prefilled fields
- [x] Stack of editable fragment cards with function name in header
- [x] Per-card citation toggle
- [x] Separate data model from Paradigm 3
