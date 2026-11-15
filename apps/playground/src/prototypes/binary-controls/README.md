# Binary controls — design reference

Status: design candidate, awaiting visual approval. Open `/?item=checkbox`, `/?item=radio`, or `/?item=switch` in the playground. This reference defines the intended experience; prototype props and DOM are not the final package API.

## Checkbox

Use Checkbox for independent selections, consent, and inclusion in a set. A check means selected; a horizontal dash means partly selected. Switch is for an on/off setting; Radio is for one choice among alternatives. There are no decorative variants or color tones.

### Anatomy and sizing

The reading order is indicator, label, then optional description below the label. The entire label row is a target. Align the indicator to the center of the first line, never the center of a multiline block. Descriptions use muted text, remain readable when disabled, and are accessible descriptions rather than part of the control's name. Put links and other interactive content outside the clickable label.

| Metric          | S             | M      | L      |
| --------------- | ------------- | ------ | ------ |
| Indicator       | 16px          | 20px   | 24px   |
| Minimum row     | 30px          | 40px   | 48px   |
| Label gap       | 6px           | 8px    | 10px   |
| Label type      | Small control | Body S | Body M |
| Description gap | 4px           | 4px    | 4px    |

Soft and Frost use a 4px corner radius, never more than one quarter of the indicator. Pixel uses square corners. The check/dash SVG box is 80% of the interior; both marks occupy the same center. A lone checkbox without visible label reserves the full row width as well as its height and must receive an accessible name. Coarse-pointer rows and lone targets expand to at least 44px without enlarging the mark. At 120% text the label line grows while indicator size stays fixed. Labels and descriptions wrap, including long unbroken text; no truncation hides a choice.

Soft uses a matte resting well, Frost uses the contextual control surface, and Pixel uses a sharp well. Selected and mixed use `--accent-solid` with `--fg-on-accent`. This keeps the mark readable even when dark themes use a bright fill. Base/Overlay changes come from the inherited `--control-bg`; no separate material prop exists.

### State and interaction decisions

| State            | Appearance and outcome                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rest             | Quiet well with the essential `--binary-border` outline.                                                                                                                  |
| Selected / mixed | Same accent fill; distinct check or dash. Mixed takes visual priority over the boolean value.                                                                             |
| Hover            | Slightly stronger empty edge; selected/mixed use the theme's hovered accent. No row background.                                                                           |
| Pressed          | Stronger empty edge and quiet plate; selected/mixed use the active accent. No displacement, scaling, or bounce in any theme.                                              |
| Keyboard focus   | 2px theme focus contour at 2px offset around the indicator; no movement. Pointer clicks do not retain this contour.                                                       |
| Read-only        | Full-contrast value and label, normal focus, no hover or press response. Explain the reason in nearby text. No dashed border or extra lock glyph inside the square.       |
| Disabled         | Muted neutral well, border, and mark; current selected/mixed shape remains visible. No focus or interaction; supporting explanation stays readable. No whole-row opacity. |
| Danger           | A distinct error edge and supporting error text, without replacing the selected accent with a destructive-action fill. Keyboard focus still uses the focus contour.       |

Disabled takes priority over danger and interaction styling. Read-only blocks edits but may retain validation feedback. Mixed takes priority over a check mark. Focus remains visible independently of value. State changes are immediate: no decorative check drawing, layout shift, or pulse; reduced motion therefore preserves exactly the same feedback. Forced colors use Canvas/ButtonText, Highlight/HighlightText, and GrayText; shape and supporting error text retain meaning without hue.

Tab visits each available checkbox; Space toggles it. Enter does not toggle a checkbox. Read-only retains focus and the submitted value, disabled excludes both. Individual and group read-only/disabled restrictions combine. These are intended library outcomes; the native prototype supports local clicks, Space, focus, and group selection, but is not a complete forms engine.

`indeterminate` is a visual/accessible mask over the boolean value, not a third submitted value. The live Select all example computes it from available children: some selected → activation selects all available items, all selected → activation clears them. Unavailable items are excluded from aggregation. No hidden remembered-subset cycle. Group selection remains application controlled; the indicator primitive itself never aggregates a collection.

Validation belongs to the containing field or application. The example reveals “choose at least one” feedback on an explicit check, then clears it after selection; it does not show an error before the first attempt. A required individual checkbox means that checkbox must be selected. A required group means at least one available member must be selected. Group heading/help/error should have explicit naming and description relationships in the library implementation, with the message presented once and referenced by the controls.

### Inspection and handoff

The specimen includes sizes/values, pinned hover/press/focus, availability, validation intersections, live aggregation, horizontal wrapping, long labels, external names, and actual Base/Overlay material plates. Pinned interaction states do not move DOM focus; mixed examples hold a controlled visual mask. All ordinary checkboxes remain live. Existing sign-in, collection, editor, invite, and batch-saved preferences scenes consume this same control/indicator.

`CheckboxIndicator` is decorative and can be composed after a native `.binary-native` input, as demonstrated by CheckboxCard. It adds no second input or focus stop. The card's spacing, selection surface, and secondary actions belong to its own future design task.

Production implementation must preserve these decisions and prove controlled refusal, native reset, form association and serialization, fieldset/inert handling, group required validation, and cross-browser accessibility. The current local group state and validation example do not claim those guarantees. See [Overlays and Forms](../../../../../docs/concepts/overlays-and-forms.md) and the [Workbench workflow](../../../../../docs/workbench.md).

Interaction references: [WAI-ARIA Checkbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/) and [React Aria Checkbox](https://react-aria.adobe.com/Checkbox). The visual treatment is specific to Unica.

## Radio

Open `/?item=radio`. Use Radio for a short, visible set of mutually exclusive alternatives. No answer is a valid initial state when a deliberate decision is required; never silently select the first option. A chosen item cannot be cleared by clicking it again. Offer an explicit “No email” / “None” option when declining is meaningful. Use Select for long lists and SegmentedControl for compact peer modes.

Radio shares Checkbox's row sizes, label/description alignment, target expansion, full-contrast read-only treatment, disabled treatment, status edge, and immediate interaction feedback. The indicator is a true circle at every size and in every theme, including Pixel. Its concentric dot occupies 50% of the interior (7/9/11px at S/M/L); the accent fill and `--fg-on-accent` dot share Checkbox's polarity. Hover/press changes fill or edge, without shrinking the circle, moving the row, or animating a dot bounce. Danger keeps the error edge even when hover and keyboard focus coincide.

### Group outcomes

- A group has one answer, a visible heading or accessible name, and optional help/error text. Vertical flow suits descriptive alternatives. Horizontal flow suits short labels; it wraps as complete options and retains reading order. Long descriptions never align the circle to the middle of the whole block.
- Tab enters the selected available option. With no selection, forward entry starts at the first available option; native reverse entry may start at the last. Arrow keys move focus and selection together, skipping disabled alternatives and wrapping. Home/End choose the first/last available option. Space selects the focused option and does not clear an existing selection. Enter does not select.
- Horizontal arrows follow the native browser's radio order; labels and physical placement mirror with RTL. Up/Down remain the unambiguous previous/next choices in either layout. A wrapped group remains one sequence, not a two-dimensional grid.
- Read-only belongs to the entire group: keep the current value and a focus entry, suppress pointer/Space/arrows/Home/End changes, and show the restriction in nearby help. A single read-only item would be contradictory because choosing a peer must clear it.
- Disabled may apply to the whole group or a single alternative. A selected option becoming disabled remains visibly selected until the user makes a new choice; do not silently replace it. Keep its explanation readable. If other alternatives are available, Tab must still enter an available neighbor without changing the value. The prototype demonstrates the visual state and native Chromium behavior; the cross-browser entry bridge, including WebKit, belongs to library implementation.
- Danger represents invalid group input, not a dangerous action. Show a single correction message near the group, retain the selected dot if an existing choice is invalid, and clear obsolete errors when the user corrects the choice. The live example begins empty, reveals an error on “Check selection”, then clears it on selection.

`null`/no answer and an explicit empty-string option are different states; unknown values must not cause an implicit first selection. Production required validation checks that an answer exists. Group disabled/read-only, native form ownership/reset, controlled refusal, fieldset handling, and focus entry across browsers must preserve the agreed outcome.

### Inspection and boundary

Sections cover sizes, live pairs with pinned interaction styling, read-only/disabled groups, unavailable selected options, vertical and wrapping horizontal layouts, deliberate empty selection, validation, long labels, and independent Base/Overlay groups. Each group receives an instance-specific native name so the six artboards never affect one another. `RadioIndicator` is the decorative shared primitive in RadioCard; no extra focus stop or interactive element is introduced.

The prototype uses native arrow behavior plus local Home/End handling. Full reusable navigation, assistive announcement timing, reset/form guarantees, and cross-browser selected-disabled entry are not claimed as shipped behavior. The separate technical implementation may change DOM and state architecture while preserving these decisions.

Interaction reference: [WAI-ARIA Radio Group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

## Switch

Open `/?item=switch`. Use Switch for an immediate on/off setting with a stable label, such as “Email notifications”. Do not rename the setting when it changes. Checkbox is preferable for inclusion/consent saved with a form; a toolbar command belongs to Button. Switch has no mixed state, decorative variants, status palette, or localized ON/OFF text inside the track.

### Geometry and materials

| Metric                                | S         | M         | L         |
| ------------------------------------- | --------- | --------- | --------- |
| Track                                 | 40 × 22px | 44 × 24px | 52 × 28px |
| Thumb                                 | 18px      | 20px      | 24px      |
| Glyph / spinner                       | 14px      | 16px      | 20px      |
| Inner inset from the outer track edge | 2px       | 2px       | 2px       |
| Minimum row                           | 30px      | 40px      | 48px      |

The thumb stays light in both states; its position and the on-track accent jointly identify the value. Soft/Frost use capsules; Pixel uses rectangular tracks and thumbs. The spinner remains circular. The 1px track edge is included in the specified dimensions, and the thumb sits another 1px inside it. No extra shadow, halo, thumb expansion, or row translation appears on press. The icon is optional decoration, never the setting's only accessible name. It is replaced by a spinner while pending without changing any geometry.

Off uses the dedicated neutral track recipe and binary edge. Light themes use a medium neutral off track to maintain thumb separation; this is an intentional correction to the earlier pale tracks, which had only 1.44–1.50:1 thumb separation. On uses `--switch-track-on` and an accent-signal edge; the dedicated darker track keeps the same light thumb readable in dark themes. The inner icon/spinner uses the on-track ink against the thumb. All fills remain calm enough for a settings panel with many independent rows.

Soft uses 160ms lateral thumb travel, Frost 140ms, Pixel an immediate positional change. The track color changes immediately. These durations belong to `--switch-travel-duration`, independently of radii. Hover changes the neutral/accent track recipe; press uses the active on recipe or a stronger neutral edge. There is no displacement perpendicular to the track. Reduced motion removes travel and freezes the spinner; adjacent “Turning … on/off” copy preserves pending meaning.

### State outcomes and priorities

- Off/on keep identical outer geometry. The thumb moves from inline-start to inline-end; RTL mirrors the movement. Pointer/touch anywhere in the label toggles once. Tab visits each available setting independently, with no radio-style arrow navigation. Space toggles; Enter toggles once per key press and must not submit a containing form.
- Keyboard focus uses the same 2px contour at 2px offset as the other binary controls. A setting without visible label receives an external name. Use an externally labelled switch for a trailing settings-row layout; the specimen shows that arrangement without adding a decorative layout variant.
- Read-only preserves the readable value and focus, blocks changes, and suppresses hover/press. Explain the reason beside the setting. Disabled uses a muted neutral track/thumb while retaining position, suppresses interaction/focus, and hides icon/spinner; supporting explanation remains readable.
- Pending retains the committed on/off value and thumb position, replaces the icon with a spinner, suppresses repeated activation, and retains input focus. It is busy and temporarily unavailable, without native disabled. This deliberately avoids displaying an unconfirmed remote value as already saved.
- On success, adopt the requested state, stop pending, and show a saved confirmation until the next change. On failure, retain the previous state, stop pending, and show an adjacent error plus retry instruction. The control's setting label stays unchanged. Failure feedback belongs beside the setting; it does not turn an off switch into a red destructive control. A new attempt clears the old error.
- Disabled takes precedence over pending and read-only decoration. Read-only plus pending can describe background synchronization and retains its full-contrast state. Group restrictions combine with individual restrictions. SwitchGroup groups independent settings; it does not require “at least one on”.

Pointer target/label wrapping rules match Checkbox: at least 44px on coarse pointers, first-line alignment, descriptive text below the stable label, no essential truncation. A trailing control keeps its width while the neighboring text wraps. Forced colors preserve an explicit track border and thumb: Canvas/ButtonText when off, Highlight/HighlightText when on, GrayText when disabled. Position keeps the value identifiable even when color differences disappear.

### Inspection and boundary

The specimen covers S/M/L off/on/icon, pinned pointer/keyboard states, read-only and disabled at both values, pending at both values and every size, read-only+pending, disabled+pending, a live success/failure/retry cycle, independent groups, trailing external labels, long content, and actual Base/Overlay surfaces. “Succeed” and “Fail” are explicit inspection controls, not a network service; clicking them naturally moves focus to that button. Pending itself never remounts or disables the focused switch. The pinned loading examples remain pending until the specimen is changed.

Existing collection/reader scenes consume Switch; SwitchCard composes SwitchIndicator. The preferences composition uses Checkbox for flags submitted together by Save preferences; the properties drawer similarly uses CheckboxCard for its deferred automation flag. Draft changes are therefore not mistaken for immediately applied settings. Production implementation must preserve the selected experience and verify async controlled authority, no repeated Enter activation, focus retention through actual responses, native form/reset/fieldset behavior, announcement timing, and cross-browser input behavior. Application request cancellation, retry policy, and network transport remain application concerns.

Interaction reference: [WAI-ARIA Switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/).
