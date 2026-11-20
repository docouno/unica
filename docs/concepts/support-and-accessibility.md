# Support and Accessibility

`@docouno/unica` targets modern evergreen browsers and React 19 applications, combining strict pure-ESM package hygiene with built-in WCAG contrast, keyboard accessibility, high-contrast adaptation, and motion safety.

## Two-Tier Browser Support Floor

Unica enforces two explicit browser tiers across CSS compilation and runtime behavior:

| Support Tier | Chrome / Edge | Firefox | Safari / iOS | Contract |
| --- | --- | --- | --- | --- |
| **Guarantee** | `134+` | `136+` | `18.4+` | Full visual, motion, discrete top-layer transitions, form-in-popover focus, `@property`, and subgrid fidelity. |
| **Baseline** | `114+` | `125+` | `17.0+` | Complete functional usability, keyboard/ARIA semantics, and native `<dialog>` / `popover` operation with progressive CSS fallbacks. |

- **Platform floor rationale:** Safari / iOS `17.0+` establishes baseline Popover API support; Safari / iOS `18.4+` resolves WebKit focus and light-dismiss edge cases for interactive form controls inside popovers. Browsers below Baseline are unsupported.
- **Guarded progressive enhancements:** Features above Baseline — `@starting-style` and `transition-behavior: allow-discrete` on overlays, `field-sizing: content` on autosizing `Textarea`, CSS `subgrid` on `Calendar`, and typed `@property` custom-property interpolation — are wrapped in `@supports` or paired with deterministic fallbacks so interaction never breaks.
- **Native browser UI:** Scrollbar geometry remains platform-dependent where the browser does not expose its parts. The [scrollbar design reference](scrollbars.md) specifies desktop Chromium/WebKit geometry and the standard native fallback for Firefox and touch-primary devices; square Pixel thumb ends are not a Firefox guarantee.
- **Logical directionality (`LTR` / `RTL`):** Layout, spacing, borders, Drawer edges, and directional icons use CSS logical properties (`inline-start`, `inline-end`) and `:dir()` selectors rather than `[lang]` heuristics.

```css
.textareaAutosize {
  min-block-size: calc(var(--text-size-body-m-lh) * 3 + var(--space-m));
}

@supports (field-sizing: content) {
  .textareaAutosize {
    field-sizing: content;
  }
}
```

## React 19 & Pure-ESM Package Contract

- **React 19 peer dependencies:** Components accept `ref` as an ordinary prop and support StrictMode, concurrent rendering, server rendering, and hydration. Use `React.useId()` for stable IDs and defer DOM access until an element or its document is available.
- **Pure ESM & `isolatedDeclarations`:** `@docouno/unica` ships pure ES modules (`"type": "module"`) with explicit TypeScript boundary annotations (`isolatedDeclarations: true`), accurate `sideEffects` metadata for CSS assets, and automated release verification via `publint` and `@arethetypeswrong/core`.

## WCAG Contrast & Non-Color Differentiation

Evaluate all six reference presets (`soft-dark`, `soft-light`, `frost-dark`, `frost-light`, `pixel-dark`, `pixel-light`) in their actual component compositions:

- **Typography (`--fg-primary`, `--fg-secondary`):** Minimum `4.5:1` contrast against owning `--bg-*` and `--control-bg` surfaces (`>= 3:1` for large display headings).
- **Essential control and state indicators:** Apply the `>= 3:1` adjacent contrast requirement to the visual information needed to identify a control or its state, including binary choice indicators and custom focus indicators. Determine which border, fill, glyph, or other cue carries that information in the complete composition.
- **Resting borders:** Preserve the themes' subtle `--control-border` and overlay borders. A decorative boundary has no blanket `3:1` target; do not strengthen shared border tokens merely to satisfy a palette-wide border check. If a border is the only cue identifying an editable area, it is essential and must meet the non-text contrast requirement. Check empty fields and ghost controls explicitly; a readable label alone is not proof that the editable area can be identified.
- **Adaptive `--fg-on-accent` polarity:** Solid accent and status fills pair automatically with dark ink on high-luminance pastel/phosphor fills (`soft-dark`, `pixel-dark`) and crisp light ink on deep indigo, terracotta, and drafting-ink fills (`frost-*`, `soft-light`, `pixel-light`).
- **Non-color cues:** Validation states pair `--status-danger-*` borders with explicit `FormField` error copy (`aria-invalid="true"`, `aria-describedby`). Selected cards pair tint with structural indicators, and selected tabs have a persistent accent rule. Circular `Radio` indicators stay distinct from rectangular `Checkbox` frames even under `0px` `Pixel` geometry.

Follow [WCAG 1.4.11: Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) when selecting the essential indicators to measure. Token-level measurements alone do not establish component accessibility or palette-wide WCAG conformance.

## Keyboard Navigation & Pointer Targets

| Widget Pattern | Keyboard Model | Expected Keys |
| --- | --- | --- |
| `Tabs`, `RadioGroup`, `SegmentedControl`, `Toolbar` | Roving `tabindex` (`0` on active item, `-1` on peers) | `Arrow` keys move focus; `Home` / `End` jump to bounds; `Tab` exits cleanly. |
| `Menu`, `Select`, `DatePicker` | Top-layer popup + managed option focus | `ArrowDown` / `ArrowUp`, typeahead, `Enter` / `Space` to commit, `Escape` to dismiss and return focus. |
| `Combobox`, `Autocomplete` | Input focus + `aria-activedescendant` | Typing edits the input. `ArrowDown` / `ArrowUp` move the active option, and `Enter` can accept it while focus stays in the field. |
| `Modal`, `Drawer` | Native `<dialog>` `showModal()` containment | `Tab` / `Shift+Tab` cycle inside dialog; `Escape` fires cancellable `cancel` and restores trigger focus. |

Horizontal arrows follow the collection's computed text direction. `Home` and `End` use collection order where the pattern assigns those keys to the list. Widgets with typeahead search by label prefix, cycle through matches on repeated letters, include `Space` while a search query is active (leaving `Space` to widget activation when the buffer is empty), and start a fresh search after 600 ms. A disabled tab or choice is skipped. A disabled menu command can receive focus and be read while activation remains unavailable. An editable composite can leave its active option empty even with visible results. Its active descendant references a navigable option in the open list, and moving to that option leaves the committed form value intact.

- **Unclipped `:focus-visible` ring:** Keyboard navigation paints a crisp `2px` `--focus-ring-color` outline at `2px` offset (`0px` sharp in `Pixel`, concentric rounded in `Soft` and `Frost`); pointer clicks do not leave sticky rings on action buttons.
- **Text-field focus:** Pointer editing uses a quieter active edge (`--control-border-focus` for Input). Keyboard navigation and unknown focus origins use the explicit contour. The internal focus-origin service tracks meaningful input per owner document. Typing, composition and caret movement preserve the current origin; a composite can signal keyboard navigation while keeping focus on its text field. Components preserve native focus and supply explicit system-color focus in forced colors.
- **Built-in glyphs:** Control chrome uses pinned decorative SVGs sized by the host and painted with `currentColor`. The host owns the accessible name and state.
- **Coarse-pointer targets:** Dense desktop (`pointer: fine`) UIs use `size="s"` (`30px`) and `size="m"` (`40px`); touch-primary (`pointer: coarse`) layouts use `size="l"` (`48px`) or expanded hit areas meeting the `44×44px` target floor.

## Forced Colors & Reduced Motion

```css
@media (forced-colors: active) {
  .card,
  .popoverPanel,
  .button {
    forced-color-adjust: none;
    background: Canvas;
    color: CanvasText;
    border: 1px solid ButtonText;
  }
  .segmentedThumb[data-checked] {
    background: Highlight;
    color: HighlightText;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- **`forced-colors: active`:** Because High Contrast modes strip `box-shadow` and backdrop blur, cards, buttons, active segments, switches, and overlays preserve explicit `1px`–`2px` structural borders mapped to system color keywords (`Canvas`, `CanvasText`, `Highlight`, `HighlightText`, `ButtonText`, `GrayText`).
- **`prefers-reduced-motion: reduce`:** Collapses spatial slide/scale transitions, keycap bounce, and continuous shimmer motion to instant state changes while preserving clear non-vestibular status feedback.
