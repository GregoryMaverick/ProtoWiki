# Improved Fragment Editor

Living design note for an **Improved Fragment Editor** in Abstract Wikipedia.

This is separate from the simplified editor UI. The simplified editor helps average contributors add content through information types, sentence templates, Wikidata suggestions, citations, and previews. The improved fragment editor is the deeper surface where contributors can **create, inspect, debug, modify, and promote function-backed fragments**.

The fragment editor should not be treated as review-only. It is also the place where new fragment patterns can be built before they become reusable Wikifunctions or registry entries.

---

## 1. Core Goal

The improved fragment editor is **not** a simplified or review-only surface for experts. It is the **full expert editing environment** that production already provides — nested function calls, typed arguments, function replacement, citations, fragment CRUD, preview, errors, copy/paste, and escape to raw ZObject editing — with **better UI and interaction**.

The problem with production is not missing power. It is that the same power is exposed through a generic `ZObjectKeyValue` tree that is hard to scan, weak on editorial meaning, and disconnected from article context. The improved editor should **keep every expert capability** while making structure understandable, safer to change, and easier to debug.

In one sentence:

> The improved fragment editor should let contributors create and edit function-backed article fragments in context with **full expert power**, while making nested function structure understandable, safer to change, and reusable.

### Design contract: same capabilities, better surface

| Production today (keep) | Improved interaction (add or reshape) |
| --- | --- |
| Edit any nested function call and argument | Visual tree / blocks that **read and write** the same ZObject store (`setValueByKeyPath`, `setFunctionCallArguments`) |
| Replace a function with another compatible function | In-slot **Replace function…** with type-aware search, not only raw selectors |
| `ZObjectKeyValue` for arbitrary ZObjects | **Always available** as native / advanced view — not deprecated |
| Live fragment preview + errors | Same preview queue; errors translated to human-readable messages beside the slot that failed |
| Fragment move / insert / copy / paste / delete | Same CRUD; clearer fragment list and article placement |
| `simple cite web` and other citation wrappers | Citation as first-class UI, not an opaque nested branch |
| Suggested functions (community ZID list) | Grow toward registry-aware function picker |
| Copy/paste Z89 HTML-fragment function calls | Preserve; improved editor is another view of pasted trees |

**Non-goal:** removing expert features in favour of a flat “fields only” form. Sentence-level fields and pattern chips are a **fast path** into the same underlying tree, not a separate toy model.

**ProtoWiki honesty:** the current `/improved-fragment-editor` prototype demonstrates meaning-first layout, dual preview, and disclosure layers. It does **not** yet round-trip all expert edits through an interactive nested editor. See §10.

It should support two kinds of work:

1. **Article-specific work:** build or modify a fragment for a particular abstract article.
2. **Reusable-pattern work:** turn a useful fragment pattern into a high-level Wikifunction and/or an authoring registry entry.

This matters because the registry cannot grow from theory alone. Editors and experts need a place to construct real fragments first, discover what patterns work, and then promote good patterns into reusable options for the simplified editor.

---

## 2. Core Problems

### Problem 1: The current tree exposes structure without enough meaning

The current tree view shows the technical nesting:

```text
string to HTML fragment
  string:
    [name] was born [date] in [place], English
      person or entity:
        Fetch Wikidata item
      date:
        Z20420K1 ...
      location:
        Fetch Wikidata item
      language:
        en
simple cite web
```

This is powerful, but the editor has to infer:

*   what sentence this produces;
*   which part is the article meaning;
*   which part is wrapping / conversion;
*   which part is citation;
*   which arguments are editable;
*   which ZIDs are implementation details;
*   where the fragment sits in the article.

The technical structure is present, but the editorial meaning is weak.

### Problem 2: Nested functions are hard to scan

Raw trees become visually heavy very quickly. Deep nesting makes it difficult to answer basic questions:

*   What is the main function here?
*   Which values are inputs?
*   Which nested functions are helper functions?
*   Which part failed?
*   What can I safely edit?

The interface needs hierarchy, but hierarchy alone is not enough. It also needs grouping, labels, color, previews, and type hints.

### Problem 3: The editor does not clearly distinguish authoring intent from implementation mechanics

For example:

```text
[name] was born [date] in [place]
```

is the authoring intent.

```text
string to HTML fragment
Fetch Wikidata item
date object internals
language reference
```

are implementation details.

The editor should make both available, but not visually equal.

### Problem 4: Fragment construction is the missing bridge to the registry

The simplified editor depends on a registry of approved mappings. But those mappings have to come from somewhere.

A realistic growth loop is:

```text
1. Contributor builds a fragment in the improved fragment editor.
2. The fragment works well in real article context.
3. The pattern appears useful across articles.
4. It is promoted into a high-level Wikifunction or linked to an existing one.
5. It is added to the registry.
6. Average editors can reuse it from the simplified editor.
```

So the fragment editor is not just an expert fallback. It is the workshop where future registry entries are discovered and shaped.

### Problem 5: Improvements should benefit Wikifunctions too

The improved fragment editor and the Wikifunctions editor both deal with nested typed function structures. They are not the same product surface, but they share the same hard interaction problem:

> How do humans safely build, inspect, and debug nested function calls?

A good solution should produce reusable UI patterns or shared components for both Abstract Wikipedia and Wikifunctions.

---

## 3. Current WikiLambda Abstract Editor (Code Audit)

**Source:** WikiLambda extension at `mediawiki/extensions/WikiLambda` (local checkout reviewed June 2026).  
**Screenshot reference:** current Abstract Article edit UI — left pane shows nested function tree; right pane shows **Generated text** with fragment highlight sync.

The current implementation already confirms much of the architecture discussed in the redesign plan. The improved fragment editor should **build on** this foundation, not replace the underlying article model.

### 3.1 What the current UI already is

The Abstract edit view (`Abstract.vue`) is a **50/50 split layout**:

| Left column | Right column |
| --- | --- |
| **Abstract Article** editor | **Generated text** preview |
| Sections + fragments as ZObject trees | Rendered HTML per fragment, per language |

Component hierarchy:

```text
Abstract.vue
├── AbstractContent.vue          "Abstract Article" panel + Publish
│   └── AbstractContentSection.vue   per section (e.g. lead paragraph Q8776414)
│       └── AbstractContentFragment.vue   per fragment
│           └── ZObjectKeyValue.vue       generic nested ZObject editor
└── AbstractPreview.vue          "Generated text" + language selector
    └── AbstractPreviewFragment.vue   debounced run + highlight sync
```

**Key insight:** fragment editing today is not a specialized fragment editor. Each fragment is edited through the **same generic `ZObjectKeyValue` tree** used elsewhere in WikiLambda. The screenshot's nested dropdowns (`Function call` → `string to HTML fragment` → `[name] was born…` → argument slots) are this component rendering a Z7 function-call tree in place.

### 3.2 Data model (matches the fragment-model concept)

From `abstractWiki.js` and `AbstractContentSection.vue`:

*   Abstract articles are keyed by Wikidata QID.
*   Content is organized into **sections** (Wikidata QIDs such as `Q8776414` = lead paragraph).
*   Each section contains a **fragments list**.
*   Fragment index `0` is reserved (internal metadata; hidden from the fragment list UI).
*   User-visible fragments start at index `1`.
*   Each fragment is stored as a **function call** (Z7) that should return an HTML fragment (Z89).

Example from the screenshot (Steve Wozniak lead):

```text
Section: lead paragraph (Q8776414)
  Fragment:
    string to HTML fragment
      string:
        [name] was born [date] in [place]
          person or entity → Fetch Wikidata item (article subject)
          date → date of birth from Wikidata item
          location → Fetch Wikidata item
          language → en

Preview output:
  "Steve Wozniak was born on 11 August 1950 in San Jose."
```

This is exactly the **fragment model** described in the plan: sections, ordered fragments, function calls — with article composition metadata living around the same stored objects.

### 3.3 What already works well (keep and extend)

These existing capabilities should inform the improved fragment editor design:

| Capability | Where it lives | Why it matters |
| --- | --- | --- |
| **Split editor + preview** | `Abstract.vue` | Users already see structure and output side by side — strong base for a workbench |
| **Fragment ↔ preview highlight** | `AbstractContentFragment.vue` + `AbstractPreviewFragment.vue` + highlight layer | Hover/focus on left highlights rendered text on right — excellent for understanding fragments |
| **Debounced fragment preview** | `abstractWiki.js` (`runAbstractWikiFragment`, queue, retry/backoff) | Live preview infrastructure already exists |
| **Fragment CRUD** | `AbstractContentFragment.vue` menu | Move before/after, insert before/after, copy/paste, delete |
| **Add fragment menu** | `AbstractContentSection.vue` | Empty function call **or** pick from suggested HTML-returning functions |
| **Community suggested functions** | `AbstractSuggestedFunctionsSchema.php` | Up to 10 ZIDs configurable community-wide — early form of a function picker, not a full registry |
| **Clipboard paste** | `AbstractContentSection.vue` | Experts can copy/paste Z89 HTML-fragment function calls |
| **Publish workflow** | `AbstractPublish.vue` | Standard wiki save path |

The Tampermonkey **Better Abstract Wikipedia** experiment improves **readability** of this same tree (tree view + colored blocks) but does not replace the editing component — it renders the stored ZObject structure visually on top of the native UI.

### 3.4 What is missing today (improved editor opportunities)

| Gap | Current behavior | Improved editor opportunity |
| --- | --- | --- |
| **No meaning-first layer** | User lands in raw `ZObjectKeyValue` tree | **Add** preview + sentence pattern + slot labels on top of the same tree — do not remove native editing |
| **No authoring registry** | Suggested functions = flat list of up to 10 ZIDs | Map information types / sentence patterns to functions with editorial metadata |
| **No progressive disclosure** | Full nesting visible immediately | Default to a scannable view; experts can expand to full depth or open native tree |
| **Wrapper noise** | `string to HTML fragment` looks same as semantic function | Group/collapse wrappers; explain "why is this here?" |
| **Technical parameter names** | `Z20420K1`, argument keys until async label fetch | Typed slots with stable editor-facing labels |
| **No promote-to-reuse** | Useful fragments stay article-specific | "Save as Wikifunction" / "Add to registry" workflow |
| **No article-aware function search** | Generic ZObject selector + 10 suggested ZIDs | Search ranked by section, article type, slot type, intent |
| **Shared visual editor** | Blocks/tree are read-only overlays | Interactive block editor as alternative view of `ZObjectKeyValue` data |

### 3.5 Implications for the Scratch / block idea

The block prototype and the current native editor are **two views of the same data**:

```text
Stored fragment (Z7 tree)
  ├── Native view: ZObjectKeyValue nested forms
  └── Visual view: colored function blocks + typed chips
```

A production improved fragment editor should:

1.  **Keep** `ZObjectKeyValue` as a **first-class** editor — full power, always reachable (per-fragment “Advanced” or split toggle).
2.  **Add** an interactive visual layer that reads and writes the **same** store (`setValueByKeyPath`, `setFunctionCallArguments`) — this is the default expert surface, not a read-only overlay.
3.  **Reuse** the existing preview queue and highlight sync — the visual layer should not need a separate preview pipeline.
4.  **Share** the block/tree component with Wikifunctions implementation pages (the Tampermonkey script already does this for `Z14K2` compositions).

```text
Stored fragment (Z7 tree) — single source of truth
  ├── Improved view (default): labeled slots, collapsible helpers, inline edits, replace-function
  └── Native view (expert): ZObjectKeyValue — same data, no feature loss
```

The screenshot shows why blocks help: the native tree for a birth sentence already contains **semantic function** (`[name] was born…`), **Wikidata fetchers**, and **date internals** at the same visual level. Blocks can color and group these by role (sentence / data / wrapper / citation).

### 3.6 Suggested functions config = proto-registry

`AbstractSuggestedFunctionsSchema.php` is an early hint of registry thinking:

```php
// Community-configured list of HTML-returning ZIDs for "Add fragment" menu
SuggestedFunctions: max 10 ZIDs, default Z31465, Z32123, ...
```

This is **not** yet a registry entry (no information labels, Wikidata properties, field schemas, or sentence patterns). But it shows where community configuration already plugs into the Abstract editor. A full registry could extend this schema or replace it with richer card metadata while keeping the same insertion point in `AbstractContentSection.addFragment()`.

### 3.7 Code locations for future prototyping

| Area | Path |
| --- | --- |
| Abstract edit layout | `resources/ext.wikilambda.app/views/Abstract.vue` |
| Section + add fragment | `resources/ext.wikilambda.app/components/abstract/AbstractContentSection.vue` |
| Per-fragment editor shell | `resources/ext.wikilambda.app/components/abstract/AbstractContentFragment.vue` |
| Generic ZObject tree | `resources/ext.wikilambda.app/components/types/ZObjectKeyValue.vue` |
| Preview + errors | `resources/ext.wikilambda.app/components/abstract/AbstractPreviewFragment.vue` |
| Fragment render queue | `resources/ext.wikilambda.app/store/stores/abstractWiki.js` |
| Suggested functions config | `includes/Config/AbstractSuggestedFunctionsSchema.php` |

---

## 4. Design Principles

### Start from the rendered fragment

The first thing users should understand is the output:

```text
Moungi Bawendi was born on March 15, 1961 in Paris.
```

Then they can reveal the structure that produced it.

### Preserve article context

A fragment is not just a function call. It lives inside an article section and may have citations, paragraph grouping, order, and editorial intent.

The editor should show:

*   article title / item;
*   section;
*   rendered preview;
*   citation state;
*   relation to surrounding fragments.

### Separate meaning from mechanics

The editor should visually separate:

*   **meaning:** birth date, occupation, place of birth, citation;
*   **mechanics:** string-to-HTML conversion, language argument, internal date object, wrapper functions.

Both matter, but they should not be equally prominent.

### Reveal complexity progressively

A single fragment can have layers:

```text
Layer 1: Preview and article placement
Layer 2: Information / sentence pattern
Layer 3: Function call and arguments
Layer 4: Nested implementation details
Layer 5: Raw ZObject JSON / source
```

Users should not land immediately at layer 5.

### Make types visible and useful

Type information should help users make valid choices:

```text
person or entity → Wikidata item
date → date object
location → Wikidata item
language → language code
```

Types should feel like guardrails, not jargon.

### Keep preview and errors close to the edit

Every structural change should have a nearby preview or validation result.

Bad:

```text
ZError: expected Z6005, got Z6091
```

Better:

```text
This slot expects a date. You inserted a Wikidata item.
Choose a date value or use a date-building function.
```

### Support promotion to reuse

If a fragment is useful, the editor should help turn it into:

*   a high-level Wikifunction;
*   a registry entry;
*   a suggested card for the simplified editor;
*   a reusable article-type recipe.

### Share patterns with Wikifunctions

Nested block rendering, typed slots, function search, argument mapping, preview, errors, and tests should be designed so they can improve the Wikifunctions editor too.

---

## 5. Existing Scratch-Like / Block Prototype

A prior Tampermonkey experiment, **Better Abstract Wikipedia** (author: dsantamaria), overlays the current WikiLambda Abstract editor documented in §3. It reads the same `wgWikiLambda.content` JSON that powers `AbstractContent.vue` and renders it two ways:

*   **Tree view** — replaces the native Abstract Article panel; resolves function labels, parameter names, Wikidata Q-labels, and argument references (similar to the screenshot's left pane, but with readable labels);
*   **Visual block view** — Scratch-like colored blocks appended below the page (see Moungi Bawendi / Steve Wozniak examples);
*   **Native toggle** — users can switch between Tree view and Native (`ZObjectKeyValue`) editing;
*   **Wikifunctions parity** — same block/tree rendering on Implementation pages (`Z14K2` composition);
*   Wikidata item chips, argument reference chips, return-type badges (`→ HTML fragment`), links back to Wikifunctions.

The visual block view maps directly onto the screenshot's native tree:

```text
Native (ZObjectKeyValue)          Visual blocks (read-only overlay)
────────────────────────          ────────────────────────────────
string to HTML fragment      →    [tan block] string to HTML fragment → HTML fragment
  [name] was born…           →      [lavender block] [name] was born… → String
    Fetch Wikidata item      →        [green block] Fetch Wikidata item
    date of birth from WD    →        [nested date blocks / Z-object tree]
    Paris / San Jose         →        [purple chip] Paris
```

This is a strong proof of direction. It shows that the same underlying ZObject structure can be made much more readable **without changing the backend or store** — the overlay fetches labels via `wikilambda_fetch` and Wikidata APIs, matching what a native Vue component could do inside `AbstractContentFragment.vue`.

However, the experiment is mostly **read-only**:

*   blocks are not directly editable;
*   users cannot drag values into slots;
*   type errors are not prevented;
*   preview is not deeply integrated into edits;
*   article-level controls such as section movement, citations, and paragraph grouping are not first-class;
*   there is no path from a useful block pattern to a reusable function or registry entry.

The next design step is to turn this from a visualizer into an **interactive fragment-construction environment**.

---

## 6. Brainstorm: Improved Fragment Editor Ideas

### Idea 1: Interactive Scratch-Like Blocks

Build on the Tampermonkey visual block direction, but make blocks editable.

Each function appears as a block:

```text
[ string to HTML fragment ] → HTML fragment
  string:
    [ born-in sentence ] → String
      person: [Moungi Bawendi]
      date: [March 15, 1961]
      place: [Paris]
      language: [English]
```

Key interactions:

*   drag function blocks into compatible typed slots;
*   search for a function inside a slot;
*   replace one nested function with another compatible function;
*   collapse helper functions;
*   show output type on each block;
*   show invalid slots before saving.

This is best for expert composition and teaching. It can also be reused in Wikifunctions.

Risk: it may become visually noisy for large fragments unless collapsing and grouping are excellent.

### Idea 2: Meaning-First Fragment Card With Expandable Function Blocks

Start with the fragment as article content:

```text
Birth sentence
Preview: Moungi Bawendi was born on March 15, 1961 in Paris.
Section: Lead
Citation: simple cite web
```

Then reveal:

```text
Information pattern:
  [Person] was born on [Date] in [Place]

Fields:
  Person: Moungi Bawendi
  Date: March 15, 1961
  Place: Paris

Function:
  born-in sentence function
  [Show nested implementation]
```

This is the most approachable expert editor. It keeps the fragment grounded in what the article says.

Risk: if it hides too much, experts may not trust it. It needs a reliable path to full function details.

### 6.1 Idea 2 detailed spec (implemented prototype)

**Route:** `/improved-fragment-editor`  
**Shell:** `FragmentEditorShell.vue` — dual view (Idea 3) with fragment list + meaning card left, full lead preview right.

#### Content fixture: Steve Wozniak lead (multi-fragment, multi-nested)

The prototype uses **two fragments** in section `Q8776414` (lead paragraph) so editors can switch between a deeply nested birth sentence and a shallower co-founder sentence on the same card UI.

**Fragment 1 — Birth sentence (default)**

```text
Preview: Steve Wozniak was born on August 11, 1950 in San Jose, California.

Nested tree (Layer 4, helpers visible):
  [name] was born [date] in [place] (Z20420)
    person → Fetch Wikidata item → article subject (Q483501)
    date → date of birth from Wikidata item (Z20420K1)
            → person → Fetch Wikidata item → article subject
    location → place of birth from Wikidata item (Z20420K2)
            → person → Fetch Wikidata item → article subject
    language → en
```

**Fragment 2 — Co-founder sentence**

```text
Preview: Steve Wozniak is a co-founder of Apple.

Nested tree:
  [name] is a co-founder of [organization] (Z20430)
    person → Fetch Wikidata item → article subject
    organization → Fetch Wikidata item → Apple Inc.
```

Fixture data lives in `lead-section-fixture.ts`. Tree builders expose the same nesting pain as the WikiLambda screenshot (§3.2) while Layer 1–2 stay readable.

#### Five disclosure layers on the meaning card

| Layer | UI | Birth fragment behavior |
| --- | --- | --- |
| 1 · Preview & placement | Card title + placement (section, pattern, citation); **rendered sentence only in Generated text pane** | Fragment list shows both lead sentences; active fragment highlighted in right pane |
| 2 · Pattern & fields | Pattern chip, typed fields | Person / Date / Place with expected types; field focus highlights phrase in preview |
| 3 · Function mapping | Function name + ZID, change-function select | Swap between full birth sentence and date-only variant |
| 4 · Nested implementation | `FragmentNestedTree.vue` with layer badges, collapse, filters | Expand date slot to see Wikidata chain; hide wrappers/helpers by default |
| 5 · Raw source | Optional `<details>` JSON | Escape hatch only |

**Date source toggle (birth only):** `From Wikidata` (default nested chain) vs `Enter manually` (`Format date` helper). Swapping updates preview, validation, and Layer 4 tree together.

**Error demo:** manual date + invalid value (or “Demo invalid date” button) shows a friendly message: *This slot expects a date…* — not raw ZError.

**Promote to registry:** `Promote to registry` → dialog → appends card to `extendedFragmentCatalog` in `index.vue` → visible on **P9 · Fragment cards** tab.

#### Problem / goal mapping

| ID | How the prototype demonstrates it |
| --- | --- |
| P1 Structure without meaning | User lands on preview + pattern before any tree |
| P2 Hard to scan nesting | 8+ nodes under birth; filters collapse wrappers/helpers |
| P3 Intent vs mechanics | Fields = intent; nested tree = mechanics on demand |
| P4 Bridge to registry | Promote workflow adds card to fragment catalog |
| G1 Edit in context | Section + 2-fragment list + dual preview |
| G2 Reusable patterns | Promote + function swap on birth fragment |

### Idea 3: Dual View: Article Preview + Function Workbench

Use a split layout:

```text
Left: fragment workbench
Right: live article preview
```

The left side edits fields, blocks, citations, or function calls. The right side shows:

*   rendered sentence;
*   paragraph context;
*   multilingual preview;
*   error / fallback state.

This helps users understand the effect of each structural change.

Risk: screen space, especially on smaller devices.

### Idea 4: Typed Slot Builder

Instead of starting from a giant tree, the editor shows empty typed slots:

```text
Function: [name] was born [date] in [place]

person or entity: [Select Wikidata item]
date:             [Build date]
location:         [Select Wikidata item]
language:         [Use article language]
```

Each slot offers compatible inputs:

*   literal value;
*   Wikidata item;
*   argument reference;
*   nested function that returns the expected type.

This makes type constraints useful rather than hidden.

Risk: for very advanced compositions, typed slots may still become complex.

### Idea 5: Function Pipeline View

Show the fragment as a pipeline instead of a tree:

```text
Wikidata item → born-in sentence → string → HTML fragment → cited fragment
```

This is useful when the main question is:

> What transformations happen from data to rendered article fragment?

It may be easier than tree nesting for some users because it shows flow.

Risk: not all function structures are linear; branching and nested arguments may be awkward.

### Idea 6: Layered Tree View

Keep the tree, but add layers and visual filters:

```text
[x] Show article meaning
[x] Show function calls
[ ] Show wrappers
[ ] Show raw ZIDs
[ ] Show implementation helper functions
```

Users can simplify the tree without leaving the same view.

Example:

*   Beginner expert: show meaningful functions only.
*   Debugger: show wrappers and raw ZIDs.
*   Function author: show full implementation.

This is an incremental improvement over the current tree.

Risk: filters must be understandable; otherwise users may not know what they are hiding.

### Idea 7: Inline Explainers / "Why Is This Here?"

Every function block can answer:

```text
Why is this here?
```

Example:

```text
string to HTML fragment
This wrapper converts the generated sentence string into an HTML fragment,
which is the type Abstract Wikipedia stores inside article sections.
```

This is especially useful for wrappers and helper functions that are necessary but not meaningful to article editors.

Risk: too much explanation can clutter the interface. It should be on demand.

### Idea 8: Safe Function Swap

Experts often need to replace a function without rebuilding the whole fragment.

The editor could show compatible alternatives:

```text
Current function:
  [Person] was born [Date] in [Place]

Compatible alternatives:
  [Person] was born on [Date]
  [Person] was born in [Place]
  [Person] was born [Date] in [Place] and later moved to [Place]
```

The editor preserves matching arguments where possible.

Risk: compatibility depends on good function metadata and type information.

### Idea 9: Promote to Function / Promote to Registry

After building a fragment, an expert can choose:

```text
Promote this pattern
```

The system asks:

```text
What should be reusable?

- This exact fragment for this article only
- A reusable function on Wikifunctions
- A registry card for simplified editors
- Both a Wikifunction and registry card
```

For a registry card:

```text
Editor label: Place of birth
Sentence pattern: [Person] was born in [Place]
Wikidata property: P19
Article type: Human biography
Suggested section: Early life
```

This makes the fragment editor the workshop that grows the simplified editor.

Risk: needs review and approval workflow to avoid low-quality registry growth.

### Idea 10: Fragment Diff and Review

Function-backed edits need human-readable diffs.

Instead of only:

```text
Z7K1 changed from Z123 to Z456
```

show:

```text
Rendered change:
  Before: Moungi Bawendi was born in Paris.
  After:  Moungi Bawendi was born on March 15, 1961 in Paris.

Structural change:
  Added date argument.
  Switched from place-of-birth sentence to date-and-place-of-birth sentence.
```

This makes complex edits reviewable.

Risk: requires good mapping from structure changes to human explanations.

### Idea 11: Test Cases Inside the Fragment Editor

When a fragment pattern is being promoted, the editor can ask for examples:

```text
Example 1:
  Person: Moungi Bawendi
  Date: March 15, 1961
  Place: Paris
  Expected English: Moungi Bawendi was born on March 15, 1961 in Paris.

Example 2:
  Person: Ada Lovelace
  Date: December 10, 1815
  Place: London
```

This borrows from Wikifunctions testers and helps decide whether a pattern is reusable.

Risk: may be too heavy for ordinary article edits; best for promotion workflow.

### Idea 12: Error-First Debugging Mode

When a fragment fails, the editor shifts into diagnosis:

```text
Preview failed

Problem:
  The date slot expects a Date object.
  This fragment contains plain text: "March 15, 1961".

Suggested fixes:
  - Convert text to Date object
  - Use date builder
  - Choose a function that accepts plain text
```

The failing block is highlighted in the tree / block view.

Risk: error messages depend on runtime and type metadata quality.

### Idea 13: Argument Reference Map

One confusing part of Abstract/Wikifunctions trees is argument references such as `Z825K1`.

The editor could show a small map:

```text
Article arguments
  subject item → Moungi Bawendi
  language → English

Function arguments
  person or entity → subject item
  location → Paris
```

This makes references visible without requiring users to understand raw keys.

Risk: too many argument sources may need careful grouping.

### Idea 14: Article-Aware Function Search

Inside a typed slot or fragment editor, function search should know the article context:

```text
Article type: human
Section: lead
Slot expects: HTML fragment or string
Current intent: birth
```

So search results are ranked:

```text
1. Date and place of birth sentence
2. Date of birth sentence
3. Place of birth sentence
4. Generic event sentence
```

This is better than plain Wikifunctions search.

Risk: depends on registry metadata and usage signals.

### Idea 15: "Explain This Fragment" Mode

A read-only explanation mode could translate the tree into prose:

```text
This lead fragment creates an HTML sentence.
It fetches the article subject, Moungi Bawendi.
It builds a date for March 15, 1961.
It fetches Paris from Wikidata.
It renders a birth sentence in English.
It attaches a simple web citation.
```

This helps onboarding, review, and debugging.

Risk: explanations must stay accurate as functions change.

### Idea 16: Shared Function Composition Component

The block/tree editor should be implemented as a reusable component usable in both:

*   Abstract Wikipedia fragment editing;
*   Wikifunctions implementation editing.

Shared capabilities:

*   nested function block rendering;
*   typed slots;
*   compatible function search;
*   argument references;
*   preview / run;
*   errors;
*   collapse / expand;
*   raw ZObject escape hatch.

Product-specific additions:

| Surface | Adds |
| --- | --- |
| Abstract Wikipedia fragment editor | sections, citations, paragraph grouping, article preview, registry metadata |
| Wikifunctions editor | implementations, testers, type signatures, documentation, publication workflow |

This avoids solving the same nested-function UX twice.

---

## 7. Recommended Exploration Directions

The strongest next prototype should combine three ideas:

### Direction A: Meaning-first fragment card

Start from article output, section, citation, and editable fields.

### Direction B: Expandable block/tree workbench

Reveal function calls as interactive typed blocks, not raw nested forms.

### Direction C: Promote-to-reuse workflow

Let a working fragment become a candidate Wikifunction / registry entry.

Together:

```text
Fragment card
  → show fields and preview
  → expand function block tree
  → edit typed slots safely
  → preview / debug
  → promote reusable pattern
```

This turns the fragment editor into the missing bridge between hand-built expert fragments and simplified editor options.

---

## 8. Evaluation Questions

Use these questions when testing fragment editor concepts:

*   Can an experienced editor understand what a fragment does in under 30 seconds?
*   Can they identify which values are article facts and which nodes are implementation details?
*   Can they safely change a value without breaking the function tree?
*   Can they replace a function with a compatible alternative?
*   Can they debug a failed preview from the UI alone?
*   Can they attach or inspect citations without understanding citation functions?
*   Can they understand how the fragment fits into the article section and paragraph?
*   Can a useful fragment pattern be promoted into a reusable Wikifunction or registry card?
*   Could the same block/tree component improve Wikifunctions implementation editing?

---

## 9. Open Questions

*   Should the improved fragment editor live inside Abstract Wikipedia article editing, Wikifunctions, or as a shared embedded component?
*   How much editing should be allowed in the visual block view versus a structured form?
*   What is the smallest useful set of block interactions: select, replace, drag, collapse, type-check, preview?
*   How should wrappers and helper functions be hidden or grouped?
*   What approval process is needed before a promoted fragment becomes a registry entry?
*   How should one-off article-specific fragments differ from reusable high-level Wikifunctions?
*   Can function metadata from Wikifunctions provide enough labels, argument names, and types for this editor?
*   How should the editor handle language-specific failures?

---

## 10. ProtoWiki implementation status

**Route:** `/improved-fragment-editor`  
**Shell:** `FragmentEditorShell.vue` — Idea 2 meaning-first card + Idea 3 dual preview (replaces the six-variant comparison workbench).

| Component | Role |
| --- | --- |
| `FragmentEditorShell.vue` | Fragment list, workbench layout, context provider |
| `FragmentMeaningCard.vue` | Layers 1–3 + citation + promote dialog + nested toggle |
| `FragmentNestedTree.vue` / `FragmentNestedTreeNode.vue` | Layer 4 tree with layer badges, collapse, filters, field sync |
| `LeadSectionPreview.vue` | Right pane: full lead paragraph, per-fragment highlight |
| `lead-section-fixture.ts` | Multi-fragment fixture with deep Wikidata nesting |
| `use-lead-section.ts` | Shared state (active fragment, highlight, promote) |

**Content fixture:** Steve Wozniak lead (`Q8776414`) with two fragments:

1. Birth — `[Person] was born on [Date] in [Place]` with nested `date of birth from Wikidata item` and `place of birth from Wikidata item` chains.
2. Co-founder — `[Person] is a co-founder of [Organization]` with moderate nesting.

**Implemented in this prototype:**

*   **Integrated slot editing** — Person / Date / Place / Organization inputs live on argument slots in the improved function tree; helpers collapsed by default
*   **Replace function…** on helper rows (date source swap is fully wired; other replacements mocked with confirmation)
*   **Improved vs Advanced** toggle — Advanced view mirrors production `ZObjectKeyValue` nesting; both views edit the same mock fragment state
*   Dual lead preview, function swap, validation errors, promote-to-registry

**Still mocked / not production-complete:**

*   Interactive nested editing — replace function, edit any argument, Wikidata picker on helper nodes
*   Round-trip to a canonical ZObject / `ZObjectKeyValue` model (mock store is flat fields + decorative tree)
*   Native/advanced tree toggle alongside improved view
*   Drag-and-drop block composition, copy/paste fragment, fragment CRUD menus
*   Live preview queue and real ZError handling

**Test plan:** see `prototype-plan.md` → Fragment editor; use §6.1 evaluation checklist when reviewing Idea 2.

