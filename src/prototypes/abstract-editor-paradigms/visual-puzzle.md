# Visual Puzzle Paradigm

Living document for **Paradigm 5: Visual Puzzle / Scratch-Style Interface**.

**Prototype route:** `/abstract-editor-paradigms?variant=puzzle` (or **P5 · Visual puzzle** tab)  
**Code:** [`index.vue`](./index.vue), [`PuzzleBlockNode.vue`](./PuzzleBlockNode.vue), [`puzzle-types.ts`](./puzzle-types.ts)

---

## Mental model

Abstract content is built by connecting **typed blocks**. Literals and function blocks snap into slots; wrong types cannot connect. **Function blocks nest inside other function blocks**, making the AST hierarchy visible (unlike forms in P1/P3/P9).

## How this differs from other paradigms

| | **P5 Visual puzzle** | **P1 / P3 / P9** |
| --- | --- | --- |
| Interaction | Drag literals and function blocks into typed slots | Forms, cards, or search + fill |
| Nesting | Visible: e.g. `string to HTML fragment` → `instantiating fragment` → Entity/Class | Hidden behind templates |
| Type safety | Physical: slots reject wrong block types | Field validation only |
| Best for | Learning composition, debugging why types must match | Everyday fact/sentence entry |

## Example nested flow

There is **no depth limit** in the engine — nesting is recursive. Depth was previously hard to reach because (a) parent slots intercepted drag-and-drop events and (b) the block catalog had no `Text → Text` helpers for deeper chains.

**4-level example:**

1. Add root **string to HTML fragment** (Z813).
2. Drop **Date-of-birth statement** in its `HtmlFragment` slot.
3. In `Entity`, drop **Entity from label** → in `Label`, drop **Join text** → fill `Left`/`Right` with **Steve** and **Wozniak** Text literals.
4. In `Date`, drop **Format date** → fill month/day/year Text literals (each part can also nest **Join text** or **Quote text**).

**3-level biography:**

1. **string to HTML fragment** → **Article-less instantiating fragment** → Entity/Class literals or resolvers.

## Current implementation

- [x] Root function blocks (HTML wrapper, DOB, notable work)
- [x] Nestable function blocks (instantiating fragment, entity resolver, date formatter)
- [x] Typed literal palette (Entity, Class, Date, Work, Text, …)
- [x] Recursive slot UI with drag-and-drop type constraints
- [x] Live preview and nested structure reveal
- [x] Citation support on completed root blocks
