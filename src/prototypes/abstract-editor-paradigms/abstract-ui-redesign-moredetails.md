# Abstract Article Creation Experience — Team Exploration Document

> **Scope:** The **abstract article creation experience** — interface, workflow, concepts, and supporting systems. Not screens alone.

> **Status:** Divergent exploration — not final designs  
> **Audience:** Design, product, and engineering collaborators  
> **Condensed slide deck:** `[abstract-ui-redesign-slides.md](./abstract-ui-redesign-slides.md)` (Marp format, ~20 slides)  
> **ProtoWiki prototypes:** `/abstract-editor-one-column`, `/abstract-editor-paradigms`, `/improved-fragment-editor`, `/community-configuration`

This document is the **full narrative** for team review. It covers the UX problem with the current Abstract Wikipedia **abstract article creation flow**, an **example solution** (one-column article editor), function matching / the authoring registry, and open questions for a production direction.

**You are encouraged to review this direction, critique the example solution, and propose additions (see [Call to action](#call-to-action) below).**

---

## Introduction

**Abstract Wikipedia** aims to let contributors write language-independent articles using **Wikifunctions**. Instead of writing English or French text, editors compose structured data and functions that evaluate into natural language across hundreds of wikis.

**The Challenge:** How do we design an **abstract article creation experience** that lets **article contributors who do not think in Wikifunctions** (experienced Wikipedia editors and other volunteers outside the current Wikifunctions expert bubble) reach that goal **without** learning function composition, Z-IDs, or AST wiring?

Today, the **whole stack** is effectively aligned with people already comfortable with Wikifunctions — and even for them, the default path is heavier than it needs to be for everyday sentences. The redesign closes the gap for Wikipedia-minded contributors **and** offers a faster routine path for experts, while keeping manual nested-function editing for when composition or debugging actually requires it.

---

## The core problem

The core problem is that Abstract Wikipedia’s article creation flow exposes function composition, while article editors in general think in information and prose. Contributors are asked to manually build and wire nested functions rather than working toward abstract articles in terms they already understand. We need an abstract article creation experience that hides functions and maps user intent to the right structure behind the scenes.

### What contributors want — and what blocks them

Contributors want to **create abstract articles** — add facts, sections, citations, and prose that renders across wikis. What blocks many volunteers today is **not** missing Wikipedia skills. The system asks them to build **complex, nested, functional logic** by hand: **function composition**, **Z-IDs** (Wikifunctions object identifiers), and manual **Abstract Syntax Tree (AST)** wiring — the tree-shaped structure of nested function calls, wrappers, arguments and types the system uses internally.

**The goal:** Bridge the gap between the editor's mental model ("I want to add an occupation") and the system's requirement (`Instantiating_Fragment(Entity, Class)`).

### What it feels like

- **AST exposed as UI:** To write a simple sentence like "Paris is a city", the user must manually build a tree: they select `string to HTML fragment` (Z813), then nest `Article-less instantiating fragment` (Z10031) inside it.
- **Deep nesting & type coercion:** Users must manually manage data types. Changing a simple text box into a nested function requires clicking a "three dots" menu, selecting "Change mode", and switching from "Literal" to "Function call".
- **Technical jargon:** The UI uses terms like "fragment", "literal", and "argument reference", which are alien to standard Wikipedia editors.
- **Uncanny valley of text editing:** A blank text box plus NLP guessing fails on complex sentences (often 4+ levels of nesting for grammar and pluralization). Users expect a text editor to "just work".


| What users experience         | What the system currently asks                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| "I want to add date of birth" | Pick `string to HTML fragment`, nest `Article-less instantiating fragment`, manage types |
| "Paris is a city"             | Build a multi-level AST by hand                                                          |
| Ordinary text editing         | Function calls, literals, argument references                                            |


### Not just "which function?"

It is **partially true** that users do not know which function to use — but that is a **symptom**, not the whole problem. Users should not have to know functions at all; the experience should translate intent into structure behind the scenes.

The issue is not only **discovery** ("which function?"). It is also:

- **Exposure** — functions and the AST are shown as the primary UI, not as an implementation detail.
- **Composition** — even with the right function name, the user must still build and wire the tree.
- **Complexity** — one readable sentence often requires several nested functions (wrappers, renderers, references, grammar).
- **Jargon** — terms like "fragment", "literal", and "argument reference" are alien to Wikipedia editors.
- **Wrong metaphor** — the interface feels like programming, not writing an encyclopedia article.

**Useful formulations for reviews:**

- **Strong (aligned with this document):** "The main problem is that Abstract Wikipedia's abstract article creation flow exposes function composition, while Wikipedia editors think in information and prose. We need experiences that hide functions and map user intent to the right structure."
- **Acceptable (narrower):** "The main problem is that users don't know what function to use for what they want to write — and the current UI forces them to figure that out manually."
- **Weak (misleading):** "Users need to learn Wikifunctions better." This fights the direction of the example solution below; the goal is progressive disclosure, not training casual editors to think like function curators.

### Knowing the function still isn't enough

**No** — knowing which function to use would help a little, but it would **not** solve the main problem. The current Abstract editor still asks editors to **build and wire up** that function by hand. That is where most of the pain lives.

**Example:** An editor wants to write *"Steve Wozniak is a software engineer."* If they know they need something like `Article-less instantiating fragment`, they still must:

1. Find that function in a large catalogue (Z-IDs, technical names).
2. Nest it inside `string to HTML fragment` (or similar wrappers).
3. Fill arguments with the correct **types** (entity vs string vs class).
4. Switch modes from "Literal" to "Function call" when a field needs nesting.
5. Add references, grammar, pluralization, and language-specific rendering — often as **more nested functions**.
6. Debug when the preview looks wrong.

**One sentence ≠ one function.** Even with perfect function knowledge, one readable sentence often requires several functions stacked together:

```text
User's sentence: "Steve Wozniak is a software engineer."

Behind the scenes (simplified):
  HTML fragment wrapper
    └── instantiating sentence function
          ├── subject (entity)
          └── class (string / typed value)
    └── reference wrapper (if cited)
    └── language-specific renderer
```

A user who knows one function name still does not know which **wrapper** functions are required, in what **order** to nest them, how to fix **type mismatches**, or how to attach a **citation**.


| Problem                                                        | Would knowing the function fix it? |
| -------------------------------------------------------------- | ---------------------------------- |
| Technical jargon ("fragment", "literal", "argument reference") | No                                 |
| Deep nesting in the UI                                         | No                                 |
| Type coercion / "Change mode"                                  | No                                 |
| Blank canvas ("what should this article include?")             | No                                 |
| Sourcing, neutrality, section structure                        | No                                 |
| "Does this read well in my language?"                          | No                                 |
| Wikidata has no value / wrong value                            | No                                 |


**When function knowledge does matter:** For novel composition, debugging broken renderers, authoring new function groups, or edge cases the registry does not cover — i.e. when contributors need to **manually compose, inspect, or debug** function trees. That includes Wikifunctions contributors and template curators. It does **not** mean they should use the full fragment tree for every sentence.

**Experts want a fast path too:** Even experienced Wikifunctions editors who *can* navigate nested fragments often *should not have to* for routine work. Adding a date of birth, occupation, or other registry-backed fact is high friction in the current AST editor compared to choosing an information type, filling a short form, and accepting a Wikidata pre-fill. The simplified abstract article creation experience is therefore not only for contributors outside the Wikifunctions bubble — it is the **default for common article edits** for everyone, with deeper inspection or manual composition available only when actually required.

**The real test:** If we gave every editor a cheat sheet of function names, would `Help:How to create an article` suddenly feel easy? Almost certainly **no**, because the tutorial pain is not mainly "I didn't know Z10031" — it is building the tree, managing types, and thinking like a programmer instead of like an editor — **even for people who already know how**.

**Design implication:** Better function documentation, search, or training is a **partial patch** for those edge cases, not a substitute for a fast default path. The stronger solution is intent-based experiences (information types, sentence templates, Wikidata suggestions) that **compile** to functions automatically — and a way to reach the underlying composition when that compiler path is not enough.

### Discovery, composition, and mental model

When evaluating any complex tool, separate three layers:

1. **Discovery** — user does not know *what* to pick.
2. **Composition** — user knows *what* but cannot *assemble* it.
3. **Mental model** — user thinks in the wrong vocabulary entirely.

Abstract Wikipedia's main issue is **(2) and (3)**. Knowing function names only addresses a thin slice of **(1)**.

---

## Who we are designing for

### Who can use the editor today (reality check)

Based on the current Abstract Wikipedia creation flow the interface is **practically aligned with Wikifunctions-literate contributors**, not with the broad Wikipedia volunteer base:


| Who edits successfully today       | Why the current UI works for them                                |
| ---------------------------------- | ---------------------------------------------------------------- |
| **Wikifunctions contributors**     | Already understand functions, types, Z-IDs, and composition      |
| **Technical early adopters**       | Tolerate AST exposure, nesting, and "Change mode" workflows      |
| **Abstract Wikipedia specialists** | Have learned the tutorial pain and internalized the mental model |


Everyone else — including many **experienced Wikipedia editors** — hits the wall described in [The core problem](#the-core-problem). Familiarity with enwiki editing, Wikidata, or infoboxes does **not** automatically transfer to Abstract's function-composition UI.

### Primary design target (who we need to reach)

The **primary audience for a simplified abstract article creation experience** is not a single persona called "the average Wikipedia editor." It is broader and more precise:

**Contributors who bring Wikipedia article values and skills, but not Wikifunctions literacy.**

That includes, for example:

- Editors who write and review prose, structure, sourcing, and neutrality on language wikis
- Casual contributors who want to add or fix **one fact** in an abstract article
- Wikidata-aware editors who think in claims and properties, not function trees
- Community reviewers who care how generated text reads in their language

They may be highly skilled Wikipedians. The gap is **not** "inexperienced vs experienced" — it is **abstract article creation vs function composition**.

We are **not** designing only for beginners. We are designing so that **Wikipedia-minded contributors do not have to become Wikifunctions experts** to add useful abstract content.

### Overlapping roles (all need consideration)


| Role                                     | Job to be done                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| **Casual article contributor**           | "I know a fact that belongs in this article; help me add it safely."           |
| **Experienced Wikipedia editor**         | "Help me shape a readable, verifiable article."                                |
| **Wikidata / Wikifunctions contributor** | "Let me inspect, debug, and improve the generated structure."                  |
| **Language / community reviewer**        | "Show me how this renders in my language; let me flag or fix problems."        |
| **Function / template curator**          | "Help me expose the right creation options without overwhelming contributors." |


### Design implication

A UI that is perfect for a function curator or Wikifunctions power user may be hostile to a casual article editor. The strongest design likely needs **progressive disclosure**: a simple abstract article creation experience for contributors outside the Wikifunctions bubble, and a path for reviewers and experts to inspect or edit underlying function composition when needed — including the people who use the editor successfully today.

---

## Cross-cutting design principles

These principles should apply regardless of which interaction model ships.

- **Information is often the user's starting point.** A Wikipedia editor may think "I need to add occupation", "I need to add date of birth", or "I need to add a source" before thinking about a sentence or function.
- **Wikidata suggestions are an accelerator, not the whole model.** Suggestions from Wikidata can help the creation flow, but the editor still needs a way to create new abstract content when the data is missing, incomplete, wrong, or unsuitable for the article.
- **One sentence is not always one function.** A single readable sentence may require several nested functions for rendering, type conversion, grammar, references, agreement, pluralization, or language-specific behavior. The simple UI must hide this complexity, but the system must still preserve it.
- **The interface should avoid pretending to be ordinary prose editing unless it can support ordinary prose editing.** A familiar text editor is attractive, but if it fails on normal editor behavior, it can confuse and frustrate users.
- **Simple mode and advanced mode should not mean "good UI" and "bad UI."** Advanced editors need access to powerful function structure, but that does not require preserving the current raw nested dropdown interface.
- **Everything should remain reviewable.** Generated prose, selected facts, function choices, references, and language renderings should be inspectable by other editors.

---

## Example solution: one-column article editor

This section describes a **concrete direction** for the abstract article creation experience. It is implemented as the ProtoWiki prototype `**/abstract-editor-one-column`** (one-column article editor with section chips, modals, and registry-backed compilation).

### What it looks like

- **Article-shaped page** — `ChromeWrapper` + `ArticleCustom`, so it feels like editing a Wikipedia article, not a separate tooling panel.
- **One column** — Lead and body sections (e.g. *Early life*, *Career*) follow the **article type** (human biography in the fixture).
- **Ordered info chips** — under each section, the registry and Wikidata supply suggestion **chips** in the order facts usually appear in an article (e.g. Date of birth, Occupation in the lead).

### How it works

1. **Open the article** — contributor lands on an abstract article (fixture: *Steve Wozniak*).
2. **Sections load from blueprint** — section list and chip order come from article type + **authoring registry** (mocked in `mock-registry.ts`).
3. **Click a chip** — a modal opens with form fields for that information type (e.g. Occupation: person + occupation). Wikidata values can pre-fill fields; the contributor edits or accepts and saves.
4. **Chip becomes prose** — after save, the chip is **replaced in place** by the rendered sentence (still clickable to reopen the modal and edit).
5. `**+ Add` at end of section** — contributor searches the registry for another information type or sentence pattern and inserts a new fragment after existing chips/sentences.
6. **Functions stay hidden** — each chip maps to a **function group**; `composeFunctionLayers()` compiles form values into the nested Wikifunction tree. Z-IDs and AST wiring are not shown in normal mode.

### Example: Steve Wozniak biography


| Section        | Suggested chips (typical order) | What the contributor does                                                                         |
| -------------- | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Lead**       | Date of birth · Occupation      | Clicks *Occupation* → accepts Wikidata pre-fill → *Steve Wozniak is a software engineer.* appears |
| **Early life** | Place of birth · Education      | Fills or skips chips; empty chips remain as suggestions                                           |
| **Career**     | Notable work · Award            | Uses **+ Add** to insert another registry card if needed                                          |


### What this demonstrates about the core problem


| Today (function composition)                   | This example (abstract article creation) |
| ---------------------------------------------- | ---------------------------------------- |
| Pick `string to HTML fragment`, nest functions | Click *Occupation*                       |
| Manage literals vs function calls              | Fill a short form or accept Wikidata     |
| See AST nodes                                  | See sentences and information labels     |
| Build wrappers manually                        | Registry + compiler assemble the tree    |


### Try it in ProtoWiki

```bash
npm run dev
# → /abstract-editor-one-column
```

Related code: `src/prototypes/abstract-editor-one-column/index.vue` (uses `mock-registry.ts` from `abstract-editor-paradigms/`).

### Still open (not solved by this prototype alone)

- Production **authoring registry** and community curation
- **Multilingual preview** on every edit
- End-to-end **citation** workflow
- **Structure / Function** reveal for reviewers (toolbar hooks exist; full modes TBD)

## Competitive inspiration (selected)

These external systems are useful references, not because they solve the exact same problem, but because they translate human intent into structured output.

- **VisualEditor / Wikitext:** Demonstrates the need for a friendly default mode and a powerful source-like mode. Abstract Wikipedia likely needs the same principle, but the advanced mode does not have to be the current raw nested dropdown UI.
- **Wikidata item editor:** Strong model for information-first editing, qualifiers, references, and statement review. Risk: it can feel too data-entry-heavy for article prose.
- **Infobox editors:** Good analogy for adding article-relevant facts through structured fields. Risk: an article is more than an infobox.
- **Scratch / Blockly:** Strong model for typed composition and preventing invalid states. Risk: visual block canvases may not scale well for abstract article creation.
- **TurboTax / Typeform:** Strong model for guided contribution and reducing blank canvas anxiety. Risk: slow for expert users.
- **Grammarly / Hemingway:** Strong model for live feedback on prose. Risk: Abstract Wikipedia needs semantic correctness, not just style feedback.
- **Translation memory tools:** Useful because Abstract Wikipedia is ultimately multilingual rendering. They show how to align source structure with target-language output.
- **Airtable / Notion / Jira filters:** Strong examples of tokenized structured input, slash commands, and autocomplete-driven authoring.
- **Node graph tools such as Blender, Unreal Blueprints, or Figma logic:** Strong inspiration for advanced function composition, especially when nesting gets deep.

---

## Mode architecture

A simple VisualEditor-vs-source split may be too steep. Abstract Wikipedia likely needs progressive disclosure across at least three levels:

- **Article Mode:** Default for average editors. Users add information, select suggestions, fill sentence cards, add citations, reorder fragments, and preview the article.
- **Structure Mode:** Intermediate mode. Users inspect which information, template, function, citation, and Wikidata values produced a fragment. This is for reviewers and experienced editors who need transparency without raw ZObject editing.
- **Function Mode:** Advanced mode. Users manually build, debug, or replace nested function structures. This should be redesigned, potentially as a node graph, typed block editor, or clearer source-like editor rather than the current raw nested dropdown pattern.

This preserves power-user capability without making every newcomer start in the deep end.

---

## Evaluation criteria

To move from exploration to prototype selection, the experience should be judged against concrete abstract article creation tasks:

- Can a non-technical editor add occupation, date of birth, or place of birth without seeing raw function jargon?
- Can the same editor add a citation without knowing the citation function name?
- Can an editor create content manually when Wikidata does not have the needed fact?
- Can a reviewer understand which function-generated sentence produced which preview text?
- Can advanced users reveal and debug the generated function composition?
- Does the workflow preserve Wikipedia values: verifiability, neutrality, reviewability, and edit history?
- Does the UI scale from a one-sentence stub to a multi-section article?
- Can the editor preview how the fragment renders in multiple languages or detect when a language renderer fails?
- Does the interface make invalid function composition difficult or impossible?
- Does the interface support both quick contribution and careful review?

---

## The hidden dependency: authoring registry

The **one-column article editor** (and any similar abstract article creation experience) depends on a **matching layer**: something that connects editor intent ("add occupation", a Wikidata claim, a chip label) to the correct **function structure** (Z7 tree) stored in an abstract article fragment.

In the ProtoWiki prototype, this layer is **faked** in `mock-registry.ts`: each information type is a hand-authored object with label, Wikidata property, function name, form fields, and (for hybrid cards) a pre-built `functionTree`. Production needs a real equivalent — an **authoring registry** — plus a **compiler** that turns form values into valid function calls.

### 9.1 The Hidden Dependency


| Layer                  | What it does                                                                |
| ---------------------- | --------------------------------------------------------------------------- |
| **Authoring registry** | Maps user-facing concepts to compile recipes                                |
| **Compiler**           | Turns form values + template into a Z7 function-call tree                   |
| **Wikidata bridge**    | Pre-fills fields from claims (`P106`, `P569`, …)                            |
| **Preview / save**     | Evaluates the tree (`abstractwiki_run_fragment`) and stores it in a section |


A registry entry is not just "occupation → Z10031". It is a **compile recipe**:

```text
Authoring template: "Occupation"
├── User-facing
│   ├── label: "Occupation"
│   ├── section: Introduction
│   ├── pattern: "[Person] is a [class]"
│   └── fields: Person (entity), Occupation (class/string)
├── Wikidata (optional)
│   ├── property: P106
│   └── value transform: Q-id → label, or use raw string
├── Function wiring
│   ├── root Z8: Z10031 (or Z32962)
│   ├── argument map: form.entity → "entity", form.class → "class"
│   └── auto-wrappers: Z813 (string→HTML fragment), citation Z32053, …
└── Constraints
    ├── applies when: article item instance of Q5 (human)
    └── preview languages: en, es, de renderers
```

**Chicken-and-egg order in production:**

1. Someone writes Wikifunctions that can render article sentences (Z8 implementations).
2. Curators define **authoring templates** or **function groups**: label, fields, which ZID, argument mapping, wrappers.
3. Optionally link each template to Wikidata properties.
4. The article UI reads the registry; editors never touch ZIDs in normal mode.

Today's real Abstract editor largely skips steps 2–3 and shows raw suggested HTML-returning functions — which is why this redesign work exists.

### 9.2 Function vs. Function Group

A **function** is one Z8 object (e.g. Z32962 *Article-less instantiating HTML fragment*: entity + class + language → HTML fragment).

A **function group** is a reusable recipe for abstract article creation: the user-facing card **plus** the nested structure needed to produce one fragment (wrappers, formatters, citation, section placement).

Example function group for "Occupation":

```text
Function group: Occupation sentence for human biography

User-facing label: Occupation
Applies to: Wikidata item is human; property P106
Used in: Lead section
Editor fields: Person, Occupation

Function structure:
  HTML fragment wrapper
    └── occupation / class sentence function (e.g. Z32962)
          ├── person entity
          └── occupation class
  optional citation wrapper
```

The one-column editor needs **function groups**, not raw functions. Matching systems should be designed around groups; individual Z8 metadata feeds into group assembly.

### 9.3 Runtime Pipeline (Simplified)

```text
Editor picks "Occupation"
  → registry lookup
  → show form fields
  → (optional) Wikidata P106 pre-fill
  → user fills values
  → compiler builds Z7 tree
  → abstractwiki_run_fragment preview
  → save fragment to article section
```

In the one-column editor, the contributor picks a mapping by:


| User action                            | Registry lookup                          |
| -------------------------------------- | ---------------------------------------- |
| Click an info chip (e.g. *Occupation*) | Chip id → function group → modal fields  |
| Accept Wikidata on a chip              | Property (e.g. `P106`) → pre-fill fields |
| **+ Add** search in a section          | Search label/pattern → function group id |


---

## Hybrid matching architecture

### 9.4 Approaches to Building & Maintaining Mappings

None of these alone is sufficient. The strongest architecture is a **hybrid**: community-approved function groups as source of truth, with automation to discover, suggest, rank, and pre-fill.

#### A. Community Configuration / Curated Function Groups

**Concept:** Editors or contributors define approved **function groups** that represent information types, article sections, or Wikidata properties.

**Strengths:**

- Reliable; humans decide the mapping.
- Matches Wikipedia culture (templates, infoboxes, citation styles are community-maintained).
- Best foundation for high-trust production workflows.

**Risks:**

- Maintenance burden: create, review, localize, update, retire mappings.
- Registry can lag behind the function catalogue if maintained separately.

**Role:** **Source of truth** for article-facing authoring options.

#### B. AI / Machine Learning Matching

**Concept:** Models infer which information type or function group matches user input or article context.

Two distinct jobs:

1. **Edit-time suggestion** — user writes *"Steve Wozniak is a software engineer"*; model proposes Occupation card + field values; user confirms.
2. **Registry-building assistant** — model clusters similar function usage in existing articles and proposes new function groups for curator review.

**Strengths:**

- Low friction for discovery and draft matching.
- Can help scale curation.

**Risks:**

- Wrong information type, hallucinated functions, missed nuance/sourcing.
- Must never save silently without confirmation.

**Role:** **Assistant layer** for suggestions and curation — not the sole matcher.

#### C. Regex / Pattern Matching

**Concept:** Fixed patterns match controlled sentence shapes.

```text
Input:  "Steve Wozniak was born on August 11, 1950."
Pattern: "{Person} was born on {Date}"
Fields:  Person = Steve Wozniak, Date = August 11, 1950
```

**Strengths:**

- Predictable, fast, no hallucination.
- Good for validation and import of known templates.

**Risks:**

- Brittle for varied natural prose (*"Born in 1950, Wozniak…"*, *"Wozniak's birth date is…"*).

**Role:** **Helper** for controlled natural language and template validation — not open-ended prose.

#### D. Mining Existing Abstract Articles

**Concept:** Analyze stored abstract articles to discover which function structures editors already use for occupation, birth date, awards, etc., and propose reusable function groups.

**Strengths:**

- Reflects real community practice.
- Finds common patterns and duplicates.
- Excellent **curation aid** as the corpus grows.

**Risks:**

- Early articles may be inconsistent; bad patterns may propagate.
- Rare article types lack examples.
- Still needs human approval.

**Role:** **Discovery and audit** — suggest mappings, detect gaps, rank by usage frequency.

#### E. Wikidata Property Mapping

**Concept:** Map Wikidata properties to function groups.

```text
P106 occupation  → Human occupation sentence (Lead)
P569 date of birth → Date-of-birth sentence (Lead / Early life)
P19 place of birth → Place-of-birth sentence (Early life)
```

**Strengths:**

- Structured facts already exist; strong bridge for Wikidata-driven chips in the one-column editor.

**Risks:**

- Wikidata says *what*; it does not say *how to phrase it* or which wrappers to use.

**Role:** **Data bridge** connected to function groups — not a replacement for them.

#### F. Article-Type Recipes

**Concept:** Default function groups per article type (human biography, city, film, organization).

```text
If item is human → offer biography groups (occupation, P569, P19, …)
If item is city    → offer place groups (country, population, …)
```

**Role:** **Scoping** — reduces blank canvas and irrelevant options.

#### G. Function Metadata at Creation Time (Upstream Registry Generation)

**Concept:** Redesign the Wikifunctions function creation form so authors declare **structured authoring capabilities upfront**. The registry is **auto-generated** (or draft-generated) from that metadata instead of maintained in a separate system.

**Example:** Z32962 already carries human-readable hints in its Wikifunctions form:

- Inputs: `entity`, `class`, `language`
- Description: *"Makes a sentence of the form 'X is a Y' as an HTML fragment…"*
- Alias: *"X is a Y as HTML fragment"*

The opportunity is to make this **machine-readable** at publish time.

**Proposed two-level metadata:**


| Level                      | Captured at function creation | Example                                                                                   |
| -------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------- |
| **A. Function capability** | Auto-indexed                  | Output: HTML fragment; pattern: `[Entity] is a [Class]`; argument roles; semantic intent  |
| **B. Article authoring**   | Draft + curator review        | Editor label: Occupation; Wikidata: P106; section: Lead; field labels: Person, Occupation |


**Workflow:**

```text
Function author creates Z32962
  → creation form asks structured metadata
  → function published on Wikifunctions
  → system generates draft registry entry(ies)
  → curators review and approve
  → article UI shows approved cards
```

One function may generate **multiple draft cards** (occupation, instance of, class membership) from the same capability metadata.

**Strengths:**

- Metadata created at the best moment (author knows sentence shape and types).
- Single source of truth; reduces duplicate maintenance.
- Scales better than a fully hand-written parallel registry.
- Extends what Z2K5 / labels already do in unstructured form.

**Risks / limitations:**

- **Function ≠ function group** — creation form captures one Z8; wrappers, citations, and section placement may still need assembly elsewhere.
- **Not every Z8 is for articles** — metadata must be optional (toggle: "intended for Abstract Wikipedia article sentences").
- **Authors may not know article UX** — technical semantics at creation; editorial packaging (section, "Occupation" vs "class") at curation.
- **Existing catalogue** — backfill needed for functions already published without metadata.
- **Stale metadata** — registry must track function revisions and flag broken mappings.

**Assessment:** Very good for **function-level capability metadata** and **draft registry generation**; partially good for full production authoring; **not sufficient alone** without curator approval and function-group assembly.

**Role:** **Upstream input** — auto-generate draft capabilities; community configuration approves and packages them.

#### H. Additional Supporting Mechanisms

- **Approved catalogue / marketplace** — only vetted function groups appear in the article editor; low-level helpers stay hidden.
- **Usage-based ranking** — rank candidates by frequency, language coverage, test pass rate, community approval.
- **Interactive disambiguation** — when input is ambiguous (*"associated with Apple"*), ask: co-founded? worked at? notable work?
- **Test-driven function groups** — each group has example inputs and expected outputs per language before promotion.
- **Human review queue** — AI/mining/regex proposals enter a queue: Approve / Edit / Merge / Reject.

### 9.5 What Does Not Solve Matching Automatically

- **Wikidata alone** — provides facts, not sentence functions or wrappers.
- **Wikifunctions search alone** — finds functions by label; does not know editorial context.
- **NLP alone** — needs a catalogue to match against and confirmation UI.
- **Hiding function names** — still requires a registry underneath.

### 9.6 Recommended Hybrid Architecture

```text
Community-approved function group registry     = source of truth
Wikidata property mappings                   = structured data bridge
Article-type recipes                         = scope which groups to show
Function creation metadata (Z32962-style)    = auto-generate draft capabilities
AI / regex / search                          = suggest matches at edit time
Mining existing abstract articles            = discover patterns, improve registry
Human review queue                           = quality control before promotion
```

**Principle:** Humans define trusted mappings. Machines help discover, suggest, rank, and pre-fill them.

### 9.8 Registry Storage Options (Engineering)


| Storage                                   | Pros                          | Cons                                           |
| ----------------------------------------- | ----------------------------- | ---------------------------------------------- |
| Wiki pages / JSON on Abstract Wikipedia   | Community-editable, versioned | Needs schema discipline                        |
| Wikibase items (meta-items for templates) | Reuses Wikidata tooling       | Heavy for simple templates                     |
| Extension database table                  | Fast queries                  | Less transparent                               |
| Annotations on Z8 objects                 | Close to functions            | Hard to express multi-function wrappers        |
| Generated from Wikifunctions metadata     | Stays near catalogue          | Covers discovery, not full editorial packaging |


Early production likely starts **small and curated** (e.g. 10–20 biography function groups), as the ProtoWiki mock registry simulates.

### 9.9 Open Design Questions for Matching

- Who can create, approve, edit, and retire function groups?
- How are draft entries from function metadata merged with community-configured groups?
- How does the compiler stay in sync when a root Z8 changes its arguments?
- Should one Wikidata property map to one card or many (by article type / section)?
- How is matching quality measured (preview success, reverts, language renderer failures)?

---

## Layered system (final concept)

### 9.7 Final Architecture Concept

The strongest emerging concept is not a single replacement editor. It is a layered system where **simplified editing**, **registry matching**, **Wikifunctions reuse**, and an **improved fragment editor** reinforce each other.

```text
Simplified editor UI
  lets average editors add information, choose sentence structures,
  use Wikidata suggestions, add citations, reorder fragments, and preview output
        ↓
Authoring registry
  connects information / sentence intents to approved reusable functions
  and article-facing metadata
        ↓
Fragment model
  / improved fragment editor
  stores and exposes the actual article: sections, fragments, order,
  citations, paragraph grouping, and the function call used by each fragment
        ↓
Wikifunctions
  owns reusable functions, including high-level functions built from
  nested implementations
```

This model separates responsibilities:


| Piece                                         | Primary job                                                                                                                                                                                                                                                    |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Simplified editor UI**                      | Let average editors contribute through information, sentence cards, citations, and preview without seeing raw ZObjects.                                                                                                                                        |
| **Authoring registry**                        | Match editor intent to reusable functions and store article-facing metadata such as labels, fields, Wikidata properties, article types, and suggested sections.                                                                                                |
| **Fragment model / improved fragment editor** | Store and expose what is actually in one article: sections, fragments, ordering, citations, paragraph grouping, and per-fragment function calls. Average editors see a simplified version; reviewers and experts can reveal and modify more detail in context. |
| **Wikifunctions**                             | Create, test, document, and maintain reusable functions, including high-level article-fragment functions composed from nested functions.                                                                                                                       |


The registry is **not** the article. It is the menu of things an editor can add. The fragment model / improved fragment editor is the actual article content and its editing surface: what was added, where it appears, and which function renders it.

#### Fragment Model / Improved Fragment Editor

The old raw nested function interface should not be treated as the permanent foundation. But the capabilities it provides still matter: experts need to inspect, customize, debug, and repair fragments.

In this concept, the **fragment model** and the **improved fragment editor** should be treated as one product surface: the stored article is a set of fragments, and the editor is how people view and change those fragments. The difference is only depth of detail.

The improved fragment editor is not review-only. It is also where contributors can **create new fragments**, test real article-specific function compositions, and identify patterns worth promoting into reusable Wikifunctions or registry entries. This makes it the bridge between expert construction and simplified editor reuse.

The same fragment can be shown at different levels:

```text
Lead section

Fragment: Occupation
  Preview: Steve Wozniak is a software engineer.
  Citation: attached
  Registry entry: Occupation / P106
  Function: Human occupation article fragment
  Function call / arguments: [expand to edit]
```

In other words, there does not need to be a separate abstract "composition layer" plus a separate "function mode" as disconnected systems. There can be one **fragment model / fragment editor**: each fragment contains both editorial metadata (section, order, citation, grouping) and the function call that renders it. Function editing is an expert view of the same fragment, not a separate article model.

Design directions for this editor include:

- **Meaning-first fragment cards** — start from rendered output, section, citation, and editable values.
- **Interactive block/tree workbench** — improve on Scratch-like visualizers by making nested function blocks editable, typed, collapsible, and previewable.
- **Typed slots** — show what each argument expects and offer compatible values or functions.
- **Plain-language debugging** — explain type and preview failures in editor-facing terms.
- **Safe function swap** — replace a function with compatible alternatives while preserving arguments.
- **Promote-to-reuse workflow** — turn a successful fragment pattern into a high-level Wikifunction and/or registry card.
- **Shared function-composition component** — reuse the same nested-function editing patterns in the Wikifunctions editor.

For deeper brainstorming and a WikiLambda code audit of the current Abstract editor (`Abstract.vue`, `ZObjectKeyValue`, suggested-functions config), see `src/prototypes/abstract-editor-paradigms/improved-fragment-editor.md`.

#### Verdict

This is a strong final architecture concept:

> Abstract Wikipedia should have a simplified editor powered by a registry that maps editor intent to reusable Wikifunctions, while an improved fragment editor lets reviewers and experts inspect, customize, and promote useful fragment patterns into reusable functions and registry entries.

Open questions remain, but this direction avoids two bad extremes: it does not force average editors into raw function composition, and it does not duplicate Wikifunctions inside Abstract Wikipedia.

---

## The reuse loop

#### The Reuse Loop

The system should support a growth path from one-off expert work to reusable authoring options:

```text
1. Expert builds a useful fragment in Abstract Wikipedia.
2. The pattern proves useful across articles or article types.
3. It is converted into a high-level Wikifunction or linked to an existing one.
4. It is added to the authoring registry with article-facing metadata.
5. Average editors can now reuse it through the simplified editor UI.
```

This avoids requiring the registry to be perfect from day one. It can start small, then grow from real article-writing practice.

#### High-Level Wikifunctions vs. Fragment-Specific Composition

High-level reusable sentence functions should mostly live in **Wikifunctions**. A complex nested function group can become a single Wikifunction so Abstract Wikipedia does not need to expose or duplicate the internal nesting.

However, not every article-writing variation should become a new Wikifunction. Abstract Wikipedia still needs article-level fragment composition for things like:

- section placement;
- fragment order;
- paragraph grouping;
- spacing between rendered fragments;
- citation attachment;
- whether a fragment is shown, hidden, split, or moved.

Those are article-editing concerns, not necessarily reusable language functions.

**Principle:** Wikifunctions should own reusable linguistic and semantic functions. Abstract Wikipedia should own article composition, editorial context, and fragment assembly.

---

## Recommended direction

The **one-column article editor** (`/abstract-editor-one-column`) is the current recommended concrete expression of the abstract article creation experience:

```text
Article type blueprint
  → sections with ordered Wikidata + registry chips
  → chip modal (fill fields / accept Wikidata)
  → sentence in place (click to re-edit)
  → + Add for extra registry cards per section
  → compiler builds nested functions behind the scenes
  → (future) structure / function reveal for reviewers
```

The key product principle: **hide function composition by default, but never hide that structured function composition exists.** Contributors should not need to understand the AST to add useful content; reviewers and experts still need a path to inspect and debug what was compiled.

---

## Live ProtoWiki prototypes

Explore in the ProtoWiki app (`npm run dev`):


| Route                             | What it explores                                                            |
| --------------------------------- | --------------------------------------------------------------------------- |
| `**/abstract-editor-one-column`** | **Primary example** — article-shaped editor, section chips, modals, `+ Add` |
| `/abstract-editor-paradigms`      | Earlier exploration tabs (cards, hybrid, puzzle)                            |
| `/improved-fragment-editor`       | Meaning-first fragment editor shell                                         |
| `/community-configuration`        | Registry / function group curation UI                                       |


**Mock registry:** `mock-registry.ts` simulates the authoring registry used by the one-column editor.

---

## Open research questions

These questions should be answered before converging on one design direction:

- Can common article information types reliably map to known Wikifunctions?
- What percentage of useful first-pass article sentences can be generated from Wikidata claims?
- How often does a sentence require deep function nesting, and which types of nesting are most common?
- Should citations be attached to facts, generated sentences, function calls, or rendered HTML fragments?
- How should the UI represent uncertainty, missing renderers, or failed generation in a language?
- How much control do language communities need over the rendered text?
- What is the smallest useful set of templates or cards needed for a good first prototype?
- How should users switch from simple mode to structure or function mode without losing context?

**Matching-specific questions (from registry design):**

- Who can create, approve, edit, and retire function groups?
- How are draft entries from function metadata merged with community-configured groups?
- How does the compiler stay in sync when a root Z8 changes its arguments?
- Should one Wikidata property map to one card or many (by article type / section)?
- How is matching quality measured (preview success, reverts, language renderer failures)?

---

## Call to action

This is a living exploration document.

- **Try** `/abstract-editor-one-column` and note what feels natural vs confusing.
- **Critique** the example solution — what is missing for real abstract article creation?
- **Propose** test article types: biography, city, film, organization, event.
- **Extend** the mock registry (`mock-registry.ts`) with new function groups your article type needs.

