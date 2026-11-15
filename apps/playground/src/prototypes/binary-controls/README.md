# Binary controls — design reference

Status: design candidate, awaiting visual approval. Open `/?item=checkbox` in the playground. This reference defines the intended experience; prototype props and DOM are not the final package API.

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

The specimen includes sizes/values, pinned hover/press/focus, availability, validation intersections, live aggregation, horizontal wrapping, long labels, external names, and actual Base/Overlay material plates. Pinned interaction states do not move DOM focus; mixed examples hold a controlled visual mask. All ordinary checkboxes remain live. Existing sign-in, collection, editor, and invite scenes consume this same control/indicator.

`CheckboxIndicator` is decorative and can be composed after a native `.binary-native` input, as demonstrated by CheckboxCard. It adds no second input or focus stop. The card's spacing, selection surface, and secondary actions belong to its own future design task.

Production implementation must preserve these decisions and prove controlled refusal, native reset, form association and serialization, fieldset/inert handling, group required validation, and cross-browser accessibility. The current local group state and validation example do not claim those guarantees. See [Overlays and Forms](../../../../../docs/concepts/overlays-and-forms.md) and the [Workbench workflow](../../../../../docs/workbench.md).

Interaction references: [WAI-ARIA Checkbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/) and [React Aria Checkbox](https://react-aria.adobe.com/Checkbox). The visual treatment is specific to Unica.
