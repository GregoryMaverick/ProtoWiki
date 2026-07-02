# Abstract Editor Paradigms Prototype Plan

## Shared Scenario

All variants use the same task so they can be compared fairly:

> Create a short abstract lead for **Steve Wozniak** using occupation, date of birth, notable work / organization, and an optional citation.

The prototype uses mock Wikidata and Wikifunctions data. This keeps the evaluation focused on the interaction model rather than API completeness.

## Variants

### 0. Hybrid Editor (recommended — Section 10)

Combines Wikidata suggestions, information-first entry, section-based fragment cards, sentence-pattern fields, optional citations, multilingual preview, and structure/function reveal in one flow.

**Detailed plan & review log:** [`hybrid.md`](./hybrid.md)

**Tests:**

- Do Wikidata suggestions feel helpful without blocking manual entry?
- Is "add information" still the primary mental model when suggestions are visible?
- Do section tabs + fragment cards feel like the Abstract Wikipedia section/fragment model?
- Does the pattern chip clarify the sentence shape?
- Does multilingual preview communicate cross-wiki value?
- Does Structure → Function reveal build trust without becoming the default UI?

### 1. Information-First Editor

The editor starts from the information they want to add, such as `Occupation` or `Date of birth`.

**Detailed plan & review log:** [`information-first.md`](./information-first.md)

**Tests:**

- Do editors naturally understand "add information" as the primary action?
- Does seeing Wikidata property + function mapping build trust or add noise?
- Can users still create content manually when Wikidata is only a suggestion?

### 2. Fragment Card Composer (Paradigm 9)

The editor builds the article **section by section**. They browse fragment cards for a section and add with one click, then edit, reorder, or cite each fragment.

**Detailed plan & review log:** [`fragment-card-composer.md`](./fragment-card-composer.md)

**Tests:**

- Does section + fragment feel like the Abstract Wikipedia model?
- Is one-click **Add card** fast enough for stub building?
- Do Wikidata-suggested cards help without taking over?

### 3. Sentence Template Forms (Paradigm 3)

The editor searches for a **sentence pattern** such as `[Person] is a [class]`, fills slots in a compose step, then adds the fragment.

**Detailed plan & review log:** [`sentence-templates.md`](./sentence-templates.md)

**Tests:**

- Can users find the right pattern through search?
- Does compose-before-add build trust?
- Does this feel different from P9 fragment browsing?

### 4. Magic Typewriter

The editor types **one sentence at a time**, receives a proposed function match, confirms it, then writes the next sentence.

**Tests:**

- Does one-sentence-at-a-time feel usable without feeling too slow?
- Does free text feel easier or misleading?
- Do confirmation cards make the NLP risk acceptable?
- How should the UI explain unsupported clauses or uncertain mappings?
- What happens when the user tries to paste a whole paragraph?

### 5. Visual Puzzle (Paradigm 5)

The editor builds abstract content by connecting typed blocks. If two pieces do not fit, the UI prevents the connection.

**Detailed plan & review log:** [`visual-puzzle.md`](./visual-puzzle.md)

**Tests:**

- Does the drag-and-drop interface make type constraints understandable?
- Is it clear how to build nested structures?
- Does it feel too much like a programming tool for average editors?

## Evaluation Prompts

Ask reviewers to try each variant and answer:

- Start with **Hybrid (recommended)** — does the combined flow feel coherent?
- Which variant made it easiest to add the first useful statement?
- Which variant made the generated text most trustworthy?
- Which variant made Wikidata suggestions feel helpful rather than controlling?
- Which variant best explained the hidden function structure?
- Which variant would an average Wikipedia editor understand fastest?
- Which variant should be combined with another?

## Prototype Scope

This is intentionally low-fidelity. It does not persist edits, call live Wikidata, or generate real ZObjects. It is designed to test mental models before investing in production architecture.

## Improved fragment editor (Idea 2)

**Route:** `/improved-fragment-editor` (separate from abstract editor paradigms)

**Layout:** left = fragment list + meaning-first card; right = full lead preview with highlight sync.

**Tests:**

1. Open birth fragment — can you understand the sentence in under 30 seconds without reading ZIDs?
2. Expand nested implementation — expand the date slot; does the Wikidata chain explain nesting pain?
3. Toggle date source Wikidata → manual — does preview + tree update together?
4. Demo invalid date — is the error message understandable?
5. Switch to co-founder fragment — does the same card UI scale to shallower nesting?
6. Promote to registry — does the card appear on **P9 · Fragment cards** in abstract editor paradigms?
7. Complete the evaluation checklist in `improved-fragment-editor.md` §6.1.

**Design doc:** `src/prototypes/improved-fragment-editor/improved-fragment-editor.md`
