# Chip & ChipGroup — design reference

Status: visual and interaction candidate, awaiting visual approval. Open `/?item=chip`. These are local playground prototypes; their props and DOM are not the final library API.

## Purpose and boundaries

A **Chip** selects a compact option. A **ChipGroup** arranges a named set of options that can wrap. Use a standalone chip for an independent boolean filter, single choice for one format or facet, and multiple choice for independent topics. A selected chip is still an option; it never gains a removal button.

Use **Badge** for passive metadata, **Tag** for an assigned value with removal, **Button** for commands and menu triggers, and **SegmentedControl** for a short, connected set of modes that stays on one rail. Chip has no decorative variants, status colors, trailing actions, icon-only form, read-only state, indeterminate state, or automatic overflow disclosure. Long explanations belong to Radio/Checkbox or their choice cards. Empty labels and interactive descendants are invalid content.

## Anatomy and scale

`[ optional option icon, replaced by check when selected | single-line label ]`

| Size       | Painted minimum | Type / line box, Soft & Frost | Icon / check | Base inline inset | Fine target minimum |
| ---------- | --------------- | ----------------------------- | ------------ | ----------------- | ------------------- |
| S          | 20 px           | 12 / 16 px                    | 14 px        | 6 px              | 24 × 24 px          |
| M, default | 24 px           | 14 / 20 px                    | 16 px        | 8 px              | 24 × 24 px          |
| L          | 28 px           | 16 / 24 px                    | 20 px        | 10 px             | 28 × 28 px          |

Pixel uses the theme's calibrated 11 / 12 / 14 px mono copy with the same line boxes. Weight is 500. The icon-to-label gap is 4 px. Frost and Pixel add their 1 px rim inside the height and to the intrinsic inline footprint; Soft has no rim. The capsule uses `--radius-full`, which resolves to 0 px in Pixel.

Selection must not change outer width, move neighboring options, or create a new wrapped row. With an option icon, the check replaces it in exactly the same frame. Without an icon, reserve the check width plus 4 px in advance: distribute this reserve evenly between the two inline insets while unselected, centering the text. Selection spends that reserve on the leading check and restores the base insets. The label moves locally by half the reserve; the outer geometry stays fixed. There is no empty-looking icon column, animated width, or animated text slide. This rule mirrors in RTL.

Painted height grows when the scaled line box plus 4 px needs more room. At 120% text, S/M/L become 23.2 / 28 / 32.8 px. A fine pointer reserves at least 24 px in each dimension, including short options such as S. A coarse pointer reserves at least 44 × 44 px in normal flow. Paint remains compact and vertically centered in that target; short chips can gain horizontal space. Targets do not overlap adjacent chips or rows. The whole target selects the option.

A group uses one size and 8 px gaps in both directions. It paints no card, rail, field border, or background. A visible legend names the set; a short description clarifies Choose one or Choose any where useful. Individual compact chips do not gain their own descriptions.

## Material and hierarchy

Unselected rest is always neutral. Selected rest uses the theme's quiet `--chip-selected-*` tint and a mandatory leading check in the same foreground as the label. Never replace this with the primary button's solid accent fill: many selected facets must remain subordinate to the main command.

- **Soft:** borderless matte capsule, warm neutral plate and terracotta selection. No elevation, glow, scale, or press travel.
- **Frost:** a fine semantic rim with a quiet neutral plane and indigo selection tint. The chip has no backdrop filter; an enclosing floating surface owns the glass. Its translucent selected fill composites on the actual owning surface.
- **Pixel:** a crisp 1 px rim, zero radius, mono text, cyan/drafting-ink selection, immediate feedback. Use the same regular system check silhouette, not a second theme-specific icon set.

The existing `--chip-*` palette and `--btn-state-duration` supply the material. Soft/Frost have a 120 ms color transition; Pixel is immediate. No new theme recipe is introduced. The same chip sits on Base and Overlay without stacking its own glass or shadow. Color and check contrast must be assessed on their actual background, alongside the visual hierarchy of the whole row.

## States and priorities

| State                   | Appearance and intended result                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unselected rest         | Neutral plate, centered text or option icon, no check.                                                                                           |
| Selected rest           | Accent tint and mandatory check; option icon is replaced.                                                                                        |
| Hover                   | Mix 8% of the current foreground into the current plane. Selection does not change in anticipation.                                              |
| Press / held Space      | Mix 14% into the current plane. No displacement or scaling. Commit follows native activation.                                                    |
| Keyboard focus          | 2 px theme focus outline at 2 px offset around the painted capsule; never clipped. Coexists with selected, hover, and press.                     |
| Unavailable, unselected | Keep the neutral material; soften foreground to 58% against the neutral background. No hover/press, activation, or Tab stop.                     |
| Unavailable, selected   | Keep the accent material and visible check; soften foreground to 62% against the neutral background. Preserve knowledge of the selection.        |
| Group disabled          | Disable every option, including through an ancestor native disabled fieldset. Keep the legend, explanation, values, and selected checks visible. |

Disabled wins over all input feedback. Press wins over hover; focus is additive. Checked state is independent of transient input feedback. Disabled options remain in reading order. Explain a non-obvious restriction near the group, as in the policy-included PDF example. A fully disabled group has no Tab stop.

Reduced motion removes the color transition. Forced colors uses Canvas/ButtonText for ordinary options, Highlight/HighlightText for selected options, GrayText for unavailable values, and a visible Highlight focus contour. The check remains a non-color selection cue.

## Selection and keyboard outcomes

Single choice uses a native radio model. Exactly one option can be selected; clicking it again keeps it selected. An initial unanswered state is allowed for a required question. To remove a single filter, provide an explicit All option; do not hide deselection behind repeated activation.

Multiple choice and standalone chips use native checkboxes. Each option toggles independently. No selected values means no restriction for a filter; it can be invalid for a required product question, with feedback owned by the group.

| Input           | Single choice                                                                            | Multiple / standalone                        |
| --------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------- |
| Pointer / touch | Select the option; focus stays local.                                                    | Toggle the option.                           |
| Tab / Shift+Tab | Enter selected enabled option, otherwise the first enabled option; then leave the group. | Visit every enabled option in reading order. |
| Space           | Select focused option; selected remains selected.                                        | Toggle focused option.                       |
| Left / Right    | Select and focus previous / next enabled option in visual reading order; mirror in RTL.  | Preserve native page behavior.               |
| Up / Down       | Select and focus previous / next enabled option in DOM order, across wrapped rows.       | Preserve native page scrolling.              |
| Home / End      | Select and focus first / last enabled option.                                            | Preserve native page behavior.               |
| Arrow at an end | Cycle to the opposite end. Skip unavailable options.                                     | No group arrow navigation.                   |

A wrapped radio group keeps reading-order navigation, not a geometric grid. Selecting must not move focus into the results. When a checked value becomes unavailable, it stays checked; re-entry must still reach an enabled option without silently changing selection. When options change externally, preserve focus if the option remains; otherwise move to the next enabled option, then previous, then the named group or the caller's next relevant control. A completely empty group has no selection control or invented disabled pill; the owner shows contextual empty feedback or omits the facet.

The prototype uses native inputs, unique group names, local state, and a small radio-key handler. It demonstrates the principal selection routes. Full cross-browser Tab entry for unanswered or checked-disabled radio sets, external option mutations, controlled refusal, and robust reset authority are library-engine obligations; these expected outcomes remain part of the handoff.

## Validation and asynchronous results

A missing required answer produces one adjacent group message and directs focus to the first enabled option. Do not repaint every valid option as danger. Once a choice satisfies the requirement, clear the error. Reset restores the caller's initial selection and clears transient validation feedback; clearing a required answer is an explicit surrounding action.

Changing filters updates selection immediately. Waiting and rejected result requests belong beside the result region, not inside a Chip. Keep selected checks visible and options operable. Do not replace a check with a spinner, change the chip width, or disable every filter while fetching. A request failure retains the user's choices and offers a retry at the surrounding result boundary. Late results must not overwrite a newer selection or steal focus.

`validation` demonstrates the missing-answer outcome with explicit local validation. `feedback` is a controlled preview: Show results / Preview failure resolve a deliberately pinned waiting state; it does not send a request. These examples settle the appearance and placement of feedback, not a generic async library API.

## Long labels, small containers, and RTL

Default width is intrinsic, bounded by the container; `--chip-max-width` adds an optional local cap. The label uses end ellipsis and yields before the check or option icon shrinks. Reserve the same selected width in both states. Never wrap a label inside one chip, silently add horizontal scrolling, or hide options behind an automatic +N control. At narrow widths, wrap whole chips.

Full text remains the native input's accessible name. For truncated string labels, hover or keyboard focus opens the existing Tooltip surface with a 320 px / viewport maximum and wrapped full text. Escape dismisses it before an enclosing layer handles Escape. The tooltip is display-only and must not toggle the option. It remains available while the pointer moves onto its content. This is a local placement preview, not the reusable positioning engine.

Touch users need an equivalent way to distinguish truncated options **before selecting**. `overflow` deliberately uses two identical prefixes and supplies an explicit Choose with full option names disclosure containing synchronized, fully wrapped native options. Opening the disclosure changes no selection; choosing there updates the same values. A selected-value readout gives confirmation. That inspection/alternate chooser belongs to the surrounding consumer; a chip label remains one selection target. Prefer short, distinct labels when possible. Rich labels need an explicit plain-text equivalent in the library design.

Logical insets, icon placement, text-only compensation, and focus geometry mirror in RTL. Use directional isolation for embedded identifiers when their data requires it; do not reverse icon shapes just because the document is RTL.

## Live reference and consumer fit

| Section        | Design question                                                                       |
| -------------- | ------------------------------------------------------------------------------------- |
| `anatomy`      | S/M/L, text-only stable width, icon replacement.                                      |
| `groups`       | Named single and multiple groups, selected summary, wrapping.                         |
| `states`       | Both selection states under pinned rest/hover/press/focus/disabled; real focus below. |
| `fit`          | Shared text scale beside Badge, Tag, Button; short-value hit geometry.                |
| `availability` | Policy-included selected value and whole-group disabled state.                        |
| `overflow`     | Similar long names, email, unbroken identifier, full-name touch chooser.              |
| `validation`   | Initial unanswered state, missing-answer feedback, focus, recovery.                   |
| `feedback`     | Immediate selection with external waiting/failure feedback.                           |
| `overlay`      | Actual floating material and underlay, with the same shared components.               |

The existing `03-document-collection` composition consumes ChipGroup for its wrapping runbook facet. Its layout switch stays a connected SegmentedControl; applied query values stay in TagGroup. The row is vertically centered with adjacent filter tags and Reset, and remains quieter than New runbook. It is an integration reference, not the family's full case catalog.

## Library implementation handoff

Preserve this appearance and intended interaction while designing the exact React 19 API and reusable mechanisms. Establish refs, controlled/uncontrolled authority, native names/values and FormData, reset without false change events, required validation, disabled fieldset semantics including the first legend exception, inert, deterministic radio entry and keyboard behavior, external option changes, rich-label inspection, and reusable tooltip lifecycle. The preview's native/local behavior is not a complete proof of those contracts. Migrate the specimen and scenes to the package and remove disposable prototype CSS when the family ships.

The interaction is informed by [Mantine's native Chip model](https://mantine.dev/core/chip/), the [WAI-ARIA radio-group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/), and [WCAG target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). The six-theme live reference specifies Unica's visual decisions.
