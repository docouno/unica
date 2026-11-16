# Tag & TagGroup — visual specification

Status: approved visual and interaction design reference. Open `/?item=tag` in the playground. These prototypes establish appearance and intended interaction; their props and internal structure are not the shipped library API.

## Purpose

A **Tag** represents an already assigned value with one removal action: a label, query facet, recipient, or selected entity. Its text is not a link or toggle. Static metadata belongs to **Badge**; selecting an option belongs to **Chip**. Color describes the value, not the destructive severity of clicking ×. Removing a tag is normally reversible; permanent deletion needs a separate named action.

A **TagGroup** arranges related removable values in reading order. It adds no card, field border, or background of its own. It owns collection navigation and disclosure; the caller owns values, the group name, removal results, and the destination after the last value is removed. Input, validation, serialization, and creation belong to the surrounding field.

## Anatomy and scale

`[ optional leading icon | single-line label | remove target [ remove plate / × ] ]`

| Size       | Painted capsule | Type / line box, Soft and Frost | Leading icon | × glyph | Remove plate | Fine-pointer target |
| ---------- | --------------- | ------------------------------- | ------------ | ------- | ------------ | ------------------- |
| S          | 22 px           | 12 / 16 px                      | 14 px        | 12 px   | 16 px        | 24 × 24 px          |
| M, default | 26 px           | 14 / 20 px                      | 16 px        | 14 px   | 20 px        | 26 × 26 px          |
| L          | 30 px           | 16 / 24 px                      | 20 px        | 16 px   | 24 px        | 30 × 30 px          |

Pixel uses its calibrated 11 / 12 / 14 px text with the same line boxes. Text weight is 500. Text-only leading insets are 8 / 10 / 12 px. The leading icon-to-label gap is 4 px; the label-to-remove-plate gap is 3 px at 100% text. With a leading icon, its passive wrapper hugs the glyph instead of reserving a square as wide as the capsule is tall. The icon's SVG frame begins 6 / 7 / 8 px from the painted leading edge at 100% text, preserving its optical balance with the wider removal end. The label follows the SVG frame by exactly 4 px; the glyph's own drawing adds its natural optical whitespace. Increasing capsule or touch-target height must not add hidden space between icon and label. The outer inset is half the painted height minus half the icon size, plus an optical correction of 2 / 2 / 3 px.

The removal target starts immediately after the label without covering it. Its plate is inset from that boundary by half the difference between the painted capsule and plate heights: 3 px at 100% text. The × stays centered inside the plate, so its glyph sits slightly farther from the label than the passive leading icon. This gives the hover, pressed, and focus surfaces room beside the text. The remove plate has equal top, bottom, and trailing insets: 3 px at 100% text. The capsule ends half its painted height beyond the remove center. Any extra target width is reserved after the painted capsule, keeping visible spacing independent of pointer type. This mirrors in RTL and applies equally to all themes without a leading button or state-dependent padding. A rectangular transparent button reserves its target in normal flow; only the smaller inner plate paints feedback. At 100% text, painted heights are 22 / 26 / 30 px and fine-pointer rows are 24 / 26 / 30 px. S keeps a 24 px target around its 22 px paint. Outlines and targets are never clipped by the capsule.

The capsule keeps its minimum size as text grows, expanding when the scaled line box plus 4 px requires more room. At 120% text, S/M/L grow to 23.2 / 28 / 32.8 px. On a coarse pointer, the target and its reserved row become at least 44 × 44 px. The painted capsule and its content spacing stay compact and identical across pointer types; the larger transparent trailing reserve can make touch groups look more spread out. Its equal plate insets are preserved at every size, text scale, and pointer type; the transparent target reserves any extra space outside the painted edge. The target never overlaps the text. Tapping the label, including its trailing edge, never removes the value; the preview also guards touch-browser retargeting near the button. No target extends over another tag or another row. Small metadata should not be used as a touch-only primary workflow without this space.

Use one size within a group. The group gap defaults to 8 px. It wraps whole tags into new rows and never puts the collection behind an implicit horizontal scroll area.

## Fit with neighboring components

Tag uses 22 / 26 / 30 px painted heights while fields and buttons retain 30 / 40 / 48 px. Matching size names align text and icon scale, not the outer height of every family. Within a group, tags and the disclosure share a painted height and minimum target height. Beside controls, align their vertical centers. Inside a field, reserve air around the tag and allow the field to grow when values wrap.

TagsInput uses 2 / 5 / 6 px vertical padding plus its 1 px border, preserving the control heights for a single row at 100% text with a fine pointer. A coarse pointer reserves a 44 px remove target, so its field can grow. Badge remains a quieter passive marker at 20 / 24 / 28 px; no neighboring component scale changes. The 2 px difference from Badge leaves room for the removal action without making Tag as tall as a field. The 4 px step between Tag sizes is consistent across the family; its painted height need not be a multiple of 4 px.

## Material and meaning

- **Soft:** borderless matte capsule, restrained local hover/press fill, circular inner plate.
- **Frost:** a 1 px semantic rim, quiet fill, rounded inner plate. The tag has no backdrop blur; a containing overlay supplies the glass material. The same semantic values stay legible in base surfaces, fields, and overlays.
- **Pixel:** 1 px rim, zero-radius capsule and inner plate, calibrated mono copy, immediate local feedback. Pending uses the shared Spinner's eight-cell perimeter; Soft/Frost use its circular arc.

The six statuses are `neutral`, `accent`, `info`, `success`, `warning`, and `danger`. Default to neutral. A colored tag still has an ordinary remove action; the × does not turn red on hover. Use meaningful text and, where useful, a leading icon so color is not the only distinction.

The current prototype consumes the existing semantic marker palette and the theme's action timing (`--btn-state-duration`, 120 ms for Soft/Frost and 0 ms for Pixel). No new theme recipe or theme-name selector is needed. There is no translated, scaled, raised, or glowing press state.

## Removal states

| State                 | Appearance and outcome                                                                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rest                  | Quiet capsule; visible × with the same readable foreground as the value.                                                                                                                     |
| Hover ×               | Only the inner plate receives a 12% current-foreground tint. Pointing at the label does not highlight the capsule.                                                                           |
| Press ×               | Only the inner plate changes to a 20% tint. Geometry is stable.                                                                                                                              |
| Keyboard focus        | A 2 px inset focus contour surrounds the inner plate, including S; the outer capsule stays calm. Focus coexists with hover or press.                                                         |
| Removal unavailable   | The value, its icon, and its material remain readable. Only × is attenuated to 38%; it is disabled and has no hover, press, or tab stop. Explain a non-obvious restriction in adjacent text. |
| Awaiting confirmation | Keep the value in place. Replace × with a small spinner in the same plate; preserve keyboard focus and suppress repeat removal. A nearby message explains the delay.                         |
| Rejected removal      | Keep the value and restore ×. Show the reason beside the collection; do not repaint a valid value as an invalid tag.                                                                         |
| Accepted removal      | Remove the tag immediately and reflow the collection without a collapsing animation. The owner may offer Undo.                                                                               |

Disabled wins over interactions; pending wins over hover/press but retains focus. Pending consumes the shared decorative Spinner at the inherited 12 / 14 / 16 px glyph size and foreground; the plate and target do not resize. Native disabled fieldsets disable the remove button. Reduced motion removes transitions and Spinner motion while preserving a visible waiting indicator and message. Forced colors keeps a system-color outline, readable text, disabled action color, and visible focus.

The six state comparisons pair text-only and leading-icon tags; both samples are explicitly pinned. Other samples remove and restore real local values. The delayed-removal panel has explicit confirmation/rejection controls; it does not pretend to perform a network request.

## Group disclosure and focus

A supplied count limit shows the first N values and a neutral **+N more** action. It matches the capsule's 22 / 26 / 30 px painted height and reserves the same minimum target height. A subtle solid border and no × distinguish it from an assigned value. The number counts hidden values, including disabled ones. It has no dashed outline, popup, or unrelated button-height jump.

Expansion reveals the tail in the same wrapping flow and changes the action to **Show less**. Focus stays on that action. Collapsing returns to the count limit. When the count no longer exceeds the limit, the disclosure disappears. Disabling removal never disables disclosure: required values must still be readable.

The group has one Tab entry across all available remove buttons **and the disclosure button**. This resolves the distinction between an action collection and a row of unrelated controls:

| Input                      | Intended result                                                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Tab / Shift+Tab            | Enter at the last active available action, or the first on initial entry; then leave the whole group.                         |
| Left / Right               | Previous / next available action in reading order, including across wrapped rows; mirror in RTL, no wrap at the ends.         |
| Home / End                 | First / last available action, including disclosure.                                                                          |
| Enter / Space              | Activate the focused remove or disclosure button.                                                                             |
| Delete / Backspace         | Remove the focused value; never collapse the disclosure or operate on another value. Ignore held-key repeat.                  |
| Up / Down                  | Keep normal page scrolling.                                                                                                   |
| Confirmed focused removal  | Next available value, then previous, then disclosure, then the owner's empty destination, then the named group as a fallback. |
| User leaves during a delay | Do not pull focus back into the collection when the result arrives.                                                           |

A short polite announcement names an accepted removal. Rejected removal keeps the value and its focus, with adjacent feedback. An empty collection shows a short contextual message and leaves creation/reset outside the TagGroup. A disabled-only group without a disclosure has no Tab stop; the values remain in the reading order.

## Long values and narrow spaces

Tags have no arbitrary width cap by default, but cannot exceed their container. `--tag-max-width` demonstrates an explicit local cap. The text uses end ellipsis and yields space before the leading icon or × can shrink. Full text remains in the accessible remove name; bidirectional data can be isolated with `bdi` by the caller. Empty labels and labels with interactive descendants are not valid content.

For truncated string labels, the prototype shows the full value in the existing Tooltip surface on pointer hover or keyboard focus. The full value wraps within a 320 px maximum width (and the available viewport); the tooltip grows with its content and has no internal scrollbar. Escape dismisses it before an enclosing overlay handles Escape. This is a display preview with local placement, not the future reusable tooltip/positioning engine. Rich labels need an explicit plain-text equivalent in the library implementation.

A hover tooltip is insufficient on touch. The overflow example also shows an adjacent full-value readout and an explicit **Show full values** list. A consumer with potentially ambiguous truncated values must offer an equivalent reachable inspection view; it cannot rely on a browser `title` or ask the user to remove the value to read it. This inspection action belongs to the surrounding collection, not a hidden second action on the Tag's label.

## Live reference and consumer fit

| Workbench section | What it settles                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| `anatomy`         | Sizes, leading icons, optical spacing, remove/restore.                                                   |
| `palette`         | All six semantic colors in all six themes.                                                               |
| `states`          | Local feedback with and without a leading icon, unavailable and pending appearance, focus at every size. |
| `groups`          | S/M/L wrapping, collapsed/expanded flow, mixed disabled values, keyboard route.                          |
| `fit`             | Live S/M/L tags inside fields, beside controls and passive badges; shared values expose wrapping.        |
| `locked`          | Readable locked values with working disclosure.                                                          |
| `overflow`        | Long human labels, an email address, an unbroken identifier, full-value inspection.                      |
| `removal`         | Last removal, empty state, delayed acceptance/rejection, external focus destination.                     |
| `overlay`         | The same components on an actual floating material and underlay.                                         |

Existing compositions consume this design independently. Collection query facets use TagGroup, with the next filter receiving focus after removal and Reset after the last filter. Static reader and extension metadata use Badge. The shared TagsInput sketch uses Tag for removable recipients; its surrounding editor returns focus after removal. A compact native Full values disclosure lets touch users inspect complete addresses without truncation; it remains available when removal is disabled. These are bounded integration corrections, not redesigns of those families or application flows.

## Implementation handoff

Preserve this visual and interaction reference while designing the React 19 public API. The disposable prototype is not proof of a complete collection engine. Library implementation must establish controlled state authority, localized strings, robust async focus ownership and external item changes, refs, form/fieldset integration where applicable, complete rich-label inspection, and reusable tooltip positioning/lifecycle. TagGroup itself does not submit form data. Keep the library obligations separate from the native/local preview behavior verified here.

The pattern is informed by [Carbon's dismissible-tag guidance](https://www.carbondesignsystem.com/building-blocks/core/components/tag/guidelines), the [WAI-ARIA toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/), and [WCAG target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). The live six-theme design is the visual reference for this implementation.
