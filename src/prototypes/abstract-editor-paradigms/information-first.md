# Information-First Paradigm

Living document for **Paradigm 1: Information-first / Fact-to-Prose editor**. Use this file to track the design intent, prototype plan, implementation status, and changes discovered while reviewing and testing.

**Prototype route:** `/abstract-editor-paradigms` → **Information** tab  
**Code:** [`index.vue`](./index.vue) (information panel section)  
**Broader exploration:** Abstract UI redesign plan (`abstract_ui_redesign_f28232a1.plan.md` in Cursor plans)

---

## 1. Mental model

The editor is **not** writing a sentence or selecting a function. They are **adding a piece of information** to an article — similar to adding a claim in Wikidata or filling an infobox field.

| Editor thinks | System does (hidden) |
| --- | --- |
| "I want to add occupation" | Maps `occupation` → `Article-less instantiating fragment` + nested wrappers |
| "Subject is Steve Wozniak" | Binds entity argument |
| "Occupation is software engineer" | Binds class/occupation argument |
| (optional) "Add citation" | Attaches reference function |

**Core principle:** Wikidata suggestions accelerate authoring but are **not** the primary model. The editor must always be able to enter information manually.

---

## 2. Target flow (design spec)

This is the flow the prototype should demonstrate:

1. User clicks **`+ Add information`**.
2. UI asks what kind of information to add: **Occupation**, **Date of birth**, **Place of birth**, **Education**, **Notable work**, **Award**, etc.
3. User chooses **Occupation**.
4. A form appears:
   - **Subject:** Steve Wozniak (pre-filled from article topic)
   - **Occupation:** ____ (empty; user types)
5. User enters `software engineer`.
6. Preview renders: *"Steve Wozniak is a software engineer."*

**Wikidata (secondary):** After step 4, the UI may show *"Suggested from Wikidata: software engineer"* with a **Use suggestion** action. The form must still work when Wikidata has no value, multiple values, or a value the editor overrides.

**Nested functions:** Never shown in the default path. One readable sentence may compile to several nested Wikifunctions behind the scenes.

---

## 3. Prototype plan

### Shared test scenario

Same as the other paradigms in this folder:

> Create a short abstract lead for **Steve Wozniak** using occupation, date of birth, notable work, and an optional citation.

Uses **mock** Wikidata and function names — no live APIs, no real ZObjects.

### Screens / states to implement

| State | Purpose |
| --- | --- |
| **Start** | Empty editor + prominent `+ Add information` |
| **Picker** | List of information types (grouped or labeled by section) |
| **Compose form** | Subject + one information field + live preview |
| **Wikidata hint** | Optional suggestion line + "Use suggestion" |
| **Saved facts** | List of added information with rendered sentence |
| **Citation toggle** | Per-fact optional citation (mock) |
| **Preview panel** | Generated article text + optional structure reveal |

### What we are testing

- Do editors understand **"add information"** as the primary action?
- Does the picker feel like choosing *what to say*, not *which function to call*?
- Is the **Subject + field** form clear without feeling like Wikidata or coding?
- Does **live preview** build trust before "Add to article"?
- Does **Wikidata as hint** feel helpful vs controlling?
- Does **Show structure** in the preview panel explain enough for reviewers?

### Success signals

- A non-technical reviewer can add occupation and date of birth without seeing function jargon.
- The flow matches the 6-step spec above without workarounds.
- Reviewers say the mental model is "adding facts" not "writing prose" or "programming."

### Out of scope (this prototype)

- Real Wikidata API / entity lookup
- Real Wikifunction evaluation or ZObject storage
- Section management, reorder, publish
- Information-to-function registry administration
- Multi-value Wikidata claims, qualifiers, references UI beyond a toggle

---

## 4. Current implementation

**Status:** Low-fidelity interactive prototype in ProtoWiki.

### Implemented

- [x] `+ Add information` as primary entry (start + after facts added)
- [x] Information type picker (6 types: Occupation, Date of birth, Place of birth, Education, Notable work, Award)
- [x] Compose form: Subject (pre-filled) + type-specific field (starts empty)
- [x] Live preview while composing + preview panel updates
- [x] Wikidata suggestion as secondary hint + **Use suggestion**
- [x] Save to article list; one entry per information type (re-select updates existing)
- [x] Per-fact citation toggle (mock)
- [x] **Show structure** reveals mock mapping (information type → function → output)
- [x] Function names hidden in default authoring UI

### Not yet implemented / known gaps

- [ ] Picker grouped by section (section shown as metadata only today)
- [ ] Edit existing fact in place (must re-add same type to update)
- [ ] Empty Wikidata suggestion state (all mock types have a suggestion)
- [ ] Multiple values per information type
- [ ] Qualifiers (e.g. occupation *from* 1976)
- [ ] Real entity picker for Subject field
- [ ] Separate route dedicated only to information-first (lives in combined paradigms page)

### Mock information registry

| Information type | Section | Wikidata (mock) | Function (mock) | Example output |
| --- | --- | --- | --- | --- |
| Occupation | Introduction | P106 | Article-less instantiating fragment | Steve Wozniak is a software engineer. |
| Date of birth | Introduction | P569 | Date-of-birth statement | Steve Wozniak was born on August 11, 1950. |
| Place of birth | Early life | P19 | Place-of-birth statement | Steve Wozniak was born in San Jose, California. |
| Education | Early life | P69 | Education statement | Steve Wozniak studied at University of California, Berkeley. |
| Notable work | Career | P800 | Defining role sentence | Steve Wozniak is a co-founder of Apple. |
| Award | Awards | P166 | Award statement | Steve Wozniak received the National Medal of Technology. |

---

## 5. Review & changelog

Document findings and changes here as you test. Newest entries at the top.

### Template for new entries

```markdown
### YYYY-MM-DD — [Reviewer name or "Testing"]

**What I tried:**
- ...

**What worked:**
- ...

**What confused me:**
- ...

**Proposed change:**
- ...

**Decision:**
- [ ] Accept change
- [ ] Defer
- [ ] Reject

**Implemented:** (link commit or note "not yet")
```

---

### 2026-06-05 — Initial prototype alignment

**What changed:**
- Replaced upfront Wikidata/function **cards** with the spec flow: `+ Add information` → picker → form → preview.
- Subject field pre-filled; information field starts **empty**.
- Wikidata moved to optional **Use suggestion** hint.
- Added information types: Place of birth, Education, Award.
- Live preview while composing; structure hidden unless **Show structure** is on.

**Why:**
- First build showed suggestion cards first, which matched Paradigm 2 (data-driven scaffold) more than Paradigm 1 (information-first).

**Open after this change:**
- Should picker options be grouped under Introduction / Early life / Career?
- Should saved facts be editable without removing and re-adding?

---

### Review log (add below)

*(Add your testing notes here.)*

---

## 6. Open questions

- Can every useful biography fact map to **one** information type + **one** function template, or do we need compound information types?
- How should the UI handle **multiple occupations** or **multiple awards**?
- When should Wikidata suggestions appear — in the picker, on the form, or both?
- Should **Subject** ever be editable, or always locked to the article's Wikidata item?
- How much of Paradigm 2 (section scaffolding) should layer on top of this without stealing the mental model?

---

## 7. Related paradigms

| Paradigm | Relationship |
| --- | --- |
| **Data-driven scaffold** | Can suggest which information types to add; should not replace manual add flow |
| **Fragment card composer** | Different unit (sentence card vs information fact); may share same underlying functions |
| **Magic typewriter** | Opposite entry (text first); useful to compare trust and error handling |

See also [`prototype-plan.md`](./prototype-plan.md) for cross-paradigm evaluation prompts.
