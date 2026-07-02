---
marp: true
theme: default
paginate: true
header: "Abstract Article Creation"
footer: "Divergent exploration — not final designs"
---

# Abstract Article Creation Experience

**Divergent exploration** — interface, workflow, concepts, and systems

- How do contributors **outside the Wikifunctions bubble** create abstract articles?
- Without learning function composition, ASTs, or Z-IDs?
- This deck summarizes [`abstract-ui-redesign-moredetails.md`](./abstract-ui-redesign-moredetails.md)

---

## Introduction

Contributors write **language-independent abstract articles** using **Wikifunctions**.

- Structured data + functions → natural language across hundreds of wikis
- **The challenge:** design an **abstract article creation experience** so contributors **create abstract articles** without learning function composition, Z-IDs, or **AST** wiring
- Today the stack suits Wikifunctions-comfortable users; the redesign closes the gap for everyone else

---

## The core problem

A **function composition workflow** — not an **abstract article creation experience**. The **Abstract Syntax Tree (AST)** is exposed directly.

| What users want | What the system asks |
| --- | --- |
| "Add date of birth" | Pick wrappers, nest fragments, manage types |
| "Paris is a city" | Build a multi-level AST by hand |
| Ordinary editing | Function calls, literals, argument references |

- AST as UI · deep nesting · jargon · uncanny valley of text editing

---

## The core problem (continued)

**Not just "which function?"** — knowing the function name does **not** fix composition or mental model.

*"Steve Wozniak is a software engineer."* → still requires wrappers, types, citations, renderers.

**Main issues:** composition **(2)** and mental model **(3)** — not discovery alone **(1)**

---

## Who we are designing for

| Role | Job to be done |
| --- | --- |
| **Casual contributor** | Add one fact safely, no Wikifunctions knowledge |
| **Experienced Wikipedia editor** | Shape readable, verifiable articles |
| **Wikidata / Wikifunctions contributor** | Inspect, debug, improve structure |
| **Language reviewer** | Check natural rendering in their language |
| **Function curator** | Expose the right authoring options |

**Progressive disclosure:** simple surface first, depth when the job requires it.

---

## Cross-cutting design principles

- **Information** is often the starting point — not sentences or functions
- **Wikidata** accelerates; it is not the whole model
- **One sentence** may require several nested functions — hide complexity, preserve it
- **Don't fake prose editing** unless it can support ordinary editor behavior
- **Simple ≠ dumbed down; advanced ≠ raw nested dropdowns**
- **Everything remains reviewable** — prose, facts, functions, citations, renderings

---

## Example solution: one-column editor

**Route:** `/abstract-editor-one-column` — article-shaped page, not a tooling panel.

| Step | Contributor sees |
| --- | --- |
| 1 | Sections from article type (Lead, Early life, Career) |
| 2 | Ordered **info chips** per section (Date of birth, Occupation, …) |
| 3 | Click chip → **modal** → fill fields or accept Wikidata |
| 4 | Chip becomes **sentence** (click to re-edit) |
| 5 | **+ Add** → search registry for another card |

Functions compile behind the scenes via `mock-registry.ts`.

---

## Competitive inspiration (selected)

| System | Lesson |
| --- | --- |
| VisualEditor / Wikitext | Friendly default + powerful source mode |
| Wikidata editor | Information-first, qualifiers, references |
| Infobox editors | Structured facts — but articles ≠ infoboxes |
| Scratch / Blockly | Typed composition — may not scale for prose |
| TurboTax / Typeform | Guided onboarding — slow for experts |
| Notion / Airtable | Tokenized structured input |

---

## Mode architecture

Progressive disclosure across **three levels**:

| Mode | Audience | What they do |
| --- | --- | --- |
| **Article** | Average editors | Add info, cards, citations, preview |
| **Structure** | Reviewers | See which template/function produced a fragment |
| **Function** | Experts | Build, debug, replace nested structures |

Advanced mode should be **redesigned** — node graph, typed blocks, or clearer source view — not raw nested dropdowns.

---

## Evaluation criteria

Can a non-technical editor…

- Add occupation, DOB, or place of birth **without function jargon**?
- Add a **citation** without knowing the citation function?
- Create content when **Wikidata has no value**?
- Let reviewers **trace preview → function**?
- Let experts **reveal and debug** composition?
- Preserve **verifiability, neutrality, edit history**?
- Scale from **one-sentence stub** to multi-section article?
- **Preview multiple languages** and detect renderer failures?

---

## The hidden dependency: authoring registry

Every friendly abstract article creation UI needs a **matching layer**:

| Layer | Role |
| --- | --- |
| **Authoring registry** | Maps user concepts → compile recipes |
| **Compiler** | Form values + template → Z7 function-call tree |
| **Wikidata bridge** | Pre-fills from claims (P106, P569, …) |
| **Preview / save** | Evaluate tree → store fragment in section |

A registry entry is a **compile recipe** — not just "occupation → Z10031".

---

## Hybrid matching architecture

```text
Community-approved function group registry  = source of truth
Wikidata property mappings                = data bridge
Article-type recipes                      = scope which groups to show
Function creation metadata                = auto-generate draft capabilities
AI / regex / search                       = suggest at edit time
Mining existing abstract articles         = discover patterns
Human review queue                        = quality control
```

**Principle:** Humans define trusted mappings. Machines discover, suggest, rank, pre-fill.

---

## Layered system (final concept)

```text
Simplified editor UI
  → information, cards, citations, preview
        ↓
Authoring registry
  → intent → approved reusable functions
        ↓
Fragment model / improved fragment editor
  → sections, fragments, order, citations, function calls
        ↓
Wikifunctions
  → reusable linguistic & semantic functions
```

**Registry = menu of what to add. Fragments = what is actually in the article.**

---

## The reuse loop

```text
1. Expert builds a useful fragment
2. Pattern proves useful across articles
3. Convert to high-level Wikifunction
4. Add to authoring registry with metadata
5. Average editors reuse via simplified UI
```

Registry does not need to be perfect day one — grow from real article-writing practice.

---

## Recommended direction

**One-column editor** — chips, modals, registry compiler, sentences in place.

Hide function composition by default; keep it inspectable for experts.

---

## Live ProtoWiki prototypes

| Route | Focus |
| --- | --- |
| **`/abstract-editor-one-column`** | Primary example |
| `/community-configuration` | Registry curation |
| `/improved-fragment-editor` | Fragment shell |

---

## Open research questions

- What % of useful sentences can come from Wikidata claims alone?
- How often does one sentence need deep nesting — and which types?
- Citations on facts, sentences, function calls, or rendered HTML?
- How to represent uncertainty and failed language renderers?
- Smallest useful template/card set for a first prototype?
- How to switch Article → Structure → Function **without losing context**?

---

## Call to action

- Try **`/abstract-editor-one-column`**
- Critique what is missing
- Propose test article types (biography, city, film, …)

> **Full document:** [`abstract-ui-redesign-moredetails.md`](./abstract-ui-redesign-moredetails.md)

---

# Thank you

**Questions & discussion**

ProtoWiki: `npm run dev` → `/abstract-editor-one-column`
