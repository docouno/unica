# Link — visual and interaction reference

Status: approved visual reference (2026-11-15). Open `/?item=link` in the playground. This prototype is not exported by the library. Its props and DOM demonstrate the experience; the final TypeScript API and router integration belong to library implementation.

## Purpose and boundaries

Link navigates to an address, document fragment, or application route. Preserve native URLs, context menus, middle click, modified clicks, and Enter activation. An operation without a destination uses Button; button-shaped navigation uses Button's anchor composition. Link does not own tab selection, breadcrumb layout, hover previews, or loading indicators.

Use a specific destination name. A linked heading inside a card is preferable to wrapping all of the card's prose and nested controls in one link. Icon-only navigation uses a named button-shaped link; this family is text-first.

## Type, tone, and anatomy

The root is a native inline anchor. Its text inherits the surrounding font family, size, line height, weight, letter spacing, and italic treatment. This keeps links inside Text, Title, and quotations on the same baseline. Standalone links can select `body-l`, `body-m`, `body-s`, `caption-l`, `caption-m`, or `caption-s` from the existing Text scale. `body-m` is the normal standalone reading size; caption sizes are for supporting metadata, not primary navigation.

| Tone               | Purpose                                                                         | Ink                |
| ------------------ | ------------------------------------------------------------------------------- | ------------------ |
| `accent` (default) | A destination in prose or a forward navigation opportunity                      | `--accent-soft-fg` |
| `neutral`          | Quiet policies, supporting references, secondary navigation                     | `--fg-secondary`   |
| `inherit`          | Linked headings and references within an existing neutral typographic hierarchy | Parent color       |

Inherited ink requires a readable painted context. It is appropriate in neutral prose and on a calibrated status surface such as Alert; underline and a meaningful destination identify the link without giving navigation a status tone. On a colored surface, inherited press strengthens the local ink using the theme’s context-action ink recipe. The default underline strengthens on hover; the explicit no-underline mode also strengthens the local ink so it retains visible hover feedback. Focus uses the enclosing `--action-context-ink`. A Card, theme, or new Base/Overlay surface boundary clears the outer context. Avoid inheriting low-contrast decorative text. Link has no status tones or material variants. The contextual status-surface integration was visually approved on 2026-11-16 and is shown in the [Alert reference](../alert/README.md#contextual-color).

The trailing external arrow uses the shared Icon at `1em`, baseline offset `-0.125em`, with one nonbreaking space before it. It follows the final word and does not receive the text underline. The complete link remains inline and can wrap; never turn a prose link into an indivisible flex row. A leading document glyph can be composed in the content with the same inherited baseline and nonbreaking gap.

`external` marks an external destination without changing its browsing context. `target="_blank"` also displays the arrow and adds an accessible “Opens in a new tab” description. Thus the icon means leaving the present context; the description makes the new-tab behavior explicit. Callers may localize the description. The preview appends `noopener noreferrer` for a new tab. Router composition and the final naming/description integration must preserve both the destination name and this notice.

The external arrow retains its up-right orientation in RTL, following the shared icon convention. It moves to the logical trailing position. Forward/back arrows mirror; external/document/brand symbols do not. Isolate Latin URLs and identifiers with `bdi` in mixed-direction prose.

## Underlines, states, and priority

At rest, `always` uses a 1px line, 2px underline offset, automatic descender skipping, and 72% current ink. This is a readable text cue, not the weaker decorative border token. Hover restores the line to full ink without bleaching the accent text. Rest and visited destinations look identical; browsing history does not introduce a second navigation palette.

| State or mode       | Result                                                                                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `always` (default)  | Persistent line; use in all running prose.                                                                                                                                                                                           |
| `hover`             | No resting line; a 1px full-ink line appears on hover, focus, and held press. Use in recognizable standalone navigation groups.                                                                                                      |
| `none`              | No ordinary line, including hover/focus/press. Restrict to clearly structured navigation whose layout already identifies it as interactive. Hover uses primary ink; inherited ink uses the accent on hover. Focus always has a ring. |
| Hover               | Full-ink 1px line, no baseline or weight change. Fine-hover pointers only.                                                                                                                                                           |
| Held press          | Primary text ink and full-ink line where enabled. No movement, background plate, or layout change.                                                                                                                                   |
| Keyboard focus      | Add a 2px `--focus-ring-color` contour at a 3px offset. Preserve underlying current/press state. Wrapped links expose their native text fragments.                                                                                   |
| Current destination | Persistent 2px full-ink underline, including `hover` and `none` modes. `aria-current` supplies the meaning. Hover/press/focus never weaken the line or change font weight.                                                           |
| Disabled            | `--fg-disabled` on text and arrow; retain the selected underline mode's resting treatment. Remove current styling, destination, and Tab stop. No hover, press, or focus response. Use a nearby visible explanation.                  |

Priority is **disabled → current line + transient press/hover → rest**; keyboard focus is additive for every available link. `aria-current="false"` and an empty value are not current. Current is not disabled: it retains its address and native navigation.

Soft, Frost, and Pixel all render text ink rather than a raised material. There is no glow, shadow, scale, displacement, animated underline sweep, or timing delay. Theme tokens provide the palette and focus corners (`--radius-xs`, square in Pixel). All state changes are immediate, including reduced-motion mode. Forced colors use `LinkText`, `GrayText`, and a `Highlight` focus contour; underlines and current line weight remain structural.

## Wrapping, targets, and interaction

Long labels wrap naturally and unbroken URLs may break anywhere. No automatic ellipsis, truncation, or tooltip is introduced. Keep the external marker with the last word. Focus must remain visible around multiline text without clipping at the owning container.

Inline targets retain text geometry and line spacing. Standalone navigation supplies its own layout padding and spacing; the examples grow to at least 44×44px on a coarse pointer. Do not add invisible hit areas that overlap adjacent inline destinations.

Tab and Shift+Tab visit enabled links in document order; Enter follows the address. Space scrolls and is not converted to activation. No arrow-key or roving-focus model is introduced. Native document anchors move to the addressed section; the live example uses focusable destinations so the keyboard continues from there. Its current marker follows the actual fragment, including Back/Forward; a modified click does not change the current destination in the original tab. Route-level focus after SPA navigation belongs to the application/router. Disabled links have no `href`, are exposed as unavailable links, are skipped by Tab, and suppress activation without `pointer-events: none`.

## Inspectable coverage and prototype limits

- `reading`: accent and neutral prose, inherited heading/italic quotation, standalone continuation.
- `typography`: all six text sizes, leading icon, same-tab external destination, new-tab notice.
- `states`: rest/visited appearance, hover, held press, keyboard focus, focus + press, disabled across all three tones.
- `navigation`: all underline modes, inherited unlined hover/press, current + hover, current + focus + press, unavailable destination with explanation.
- `wrapping`: multiline focus, long URL, mixed-direction identifier, directional continuation.
- `surfaces` and `overlay`: painted canvas/surface and actual translucent floating panel, with focus/current/disabled examples.
- `live`: real document fragments and external links. Pinned state samples are explicitly labeled; they do not claim to reproduce browser history.

Application scenes independently consume this prototype. Review its optical fit in sign-in, workspace overview, document collection, and rich editor. Some scene links currently simulate an action or a hover preview by intercepting navigation; those are composition stand-ins, not a Link interaction contract. Filter reset is a Button action and does not justify an action mode in Link.

The disposable preview includes enough native behavior to evaluate these decisions. Full router delegation, comprehensive assistive-technology coverage, SSR/ref composition, and cross-browser production guarantees remain library work. Any implementation must preserve the defined appearance, destination semantics, accessible notice, unavailable behavior, and focus outcomes.

## Design references

[WAI's link pattern](https://www.w3.org/WAI/ARIA/apg/patterns/link/) supports preserving native anchor behavior. [WCAG G183](https://www.w3.org/WAI/WCAG21/Techniques/general/G183) distinguishes color-only links from links with an additional visual cue. The persistent prose underline avoids relying on a color difference between adjacent pieces of text. [Carbon's link guidance](https://www.carbondesignsystem.com/building-blocks/core/components/link/guidelines) provides a useful comparison between inline and standalone navigation; Unica keeps its own typography and theme palette.
