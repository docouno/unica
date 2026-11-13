# Support and Accessibility

`@docouno/unica` targets modern evergreen browsers and React 19+ applications, combining strict pure-ESM package hygiene with built-in WCAG contrast, keyboard accessibility, high-contrast adaptation, and motion safety.

## Two-Tier Browser Support Floor

Unica enforces two explicit browser tiers across CSS compilation and runtime behavior:

| Support Tier | Chrome / Edge | Firefox | Safari / iOS | Contract |
| --- | --- | --- | --- | --- |
| **Guarantee** | `134+` | `136+` | `18.4+` | Full visual, motion, discrete top-layer transitions, form-in-popover focus, `@property`, and subgrid fidelity. |
| **Baseline** | `114+` | `125+` | `17.0+` | Complete functional usability, keyboard/ARIA semantics, and native `<dialog>` / `popover` operation with progressive CSS fallbacks. |

- **Platform floor rationale:** Safari / iOS `17.0+` establishes baseline Popover API support; Safari / iOS `18.4+` resolves WebKit focus and light-dismiss edge cases for interactive form controls inside popovers. Browsers below Baseline are unsupported.
- **Guarded progressive enhancements:** Features above Baseline — `@starting-style` and `transition-behavior: allow-discrete` on overlays, `field-sizing: content` on autosizing `Textarea`, CSS `subgrid` on `Calendar`, and typed `@property` custom-property interpolation — are wrapped in `@supports` or paired with deterministic fallbacks so interaction never breaks.
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

## React 19+ & Pure-ESM Package Contract

- **React `>= 19.0.0` peer dependency:** Every component accepts `ref` directly as an ordinary prop (zero `React.forwardRef` wrappers) and is safe under React StrictMode, concurrent rendering, and server-side rendering + hydration (`React.useId()` deterministic IDs, zero module-scope `window` or `document` reads).
- **Pure ESM & `isolatedDeclarations`:** `@docouno/unica` ships pure ES modules (`"type": "module"`) with explicit TypeScript boundary annotations (`isolatedDeclarations: true`), accurate `sideEffects` metadata for CSS assets, and automated release verification via `publint` and `@arethetypeswrong/core`.

## WCAG Contrast & Non-Color Differentiation

All six reference presets (`soft-dark`, `soft-light`, `frost-dark`, `frost-light`, `pixel-dark`, `pixel-light`) enforce WCAG 2.1 AA contrast floors:

- **Typography (`--fg-primary`, `--fg-secondary`):** Minimum `4.5:1` contrast against owning `--bg-*` and `--control-bg` surfaces (`>= 3:1` for large display headings).
- **Control boundaries & focus contours:** Resting field borders (`--control-border`), binary choice indicators (`Checkbox`, `Radio`, `Switch`), and `:focus-visible` outlines maintain `>= 3:1` adjacent contrast.
- **Adaptive `--fg-on-accent` polarity:** Solid accent and status fills pair automatically with dark ink on high-luminance pastel/phosphor fills (`soft-dark`, `pixel-dark`) and crisp light ink on deep indigo, terracotta, and drafting-ink fills (`frost-*`, `soft-light`, `pixel-light`).
- **Non-color cues:** Validation states pair `--status-danger-*` borders with explicit `FormField` error copy (`aria-invalid="true"`, `aria-describedby`); selected cards/tabs pair tint with structural indicators; circular `Radio` indicators stay distinct from rectangular `Checkbox` frames even under `0px` `Pixel` geometry.

## Keyboard Navigation & Pointer Targets

| Widget Pattern | Keyboard Model | Expected Keys |
| --- | --- | --- |
| `Tabs`, `RadioGroup`, `SegmentedControl`, `Toolbar` | Roving `tabindex` (`0` on active item, `-1` on peers) | `Arrow` keys move focus; `Home` / `End` jump to bounds; `Tab` exits cleanly. |
| `Menu`, `Select`, `DatePicker` | Top-layer popup + managed option focus | `ArrowDown` / `ArrowUp`, typeahead, `Enter` / `Space` to commit, `Escape` to dismiss and return focus. |
| `Combobox`, `Autocomplete` | Input focus + `aria-activedescendant` | Typing filters inline while `ArrowDown` / `ArrowUp` and `Enter` navigate options without stealing caret focus. |
| `Modal`, `Drawer` | Native `<dialog>` `showModal()` containment | `Tab` / `Shift+Tab` cycle inside dialog; `Escape` fires cancellable `cancel` and restores trigger focus. |

- **Unclipped `:focus-visible` ring:** Keyboard navigation paints a crisp `2px` `--focus-ring-color` outline at `2px` offset (`0px` sharp in `Pixel`, concentric rounded in `Soft` and `Frost`); pointer clicks do not leave sticky rings on action buttons.
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
