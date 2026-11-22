# FormField design reference

FormField gives one control, a group of controls, or a composite editor a visible name and an orderly supporting area. Data-entry controls do not expose shorthand `label`, `description`, or `message` props; wrap labeled controls and groups in `FormField`, or use native `<label htmlFor>` / `aria-label` on standalone inline fields (see [Feedback and Errors](../../../../../docs/concepts/feedback-and-errors.md)). This reference defines appearance and intended interaction; prototype props and DOM do not prescribe the shipped API.

## Scope and anatomy

The reusable visual parts are `FormField`, `FormFieldLabel`, `FormFieldDescription`, and `FormFieldFeedback`. FormField has no decorative variants, background, enclosing border, shadow, pressed state, or independent focus ring. The contained control and its theme own their material and interaction states.

The reading order is **label → control or group → description → feedback**. Description and feedback coexist. Requirements remain visible during correction; feedback never replaces instructions. Labels, instructions, and messages wrap, including unbroken strings. Nothing uses ellipsis except the control's own value viewport.

- The label uses primary text at medium weight. Danger changes the feedback and the relevant control, not the label.
- A required asterisk follows the label, paired with native required behavior on a single control. A form may explain the marker once. A required group expresses its actual selection rule in text; marking every checkbox required would change that rule.
- Optional text is a quiet continuation of the label. It is a content choice, not a default badge on every optional field. Required takes precedence if both are supplied.
- A secondary label action occupies a separate focus target at the end of the heading. It wraps below the label if necessary. It must never be nested in the clickable label or replace the label.
- Description uses the muted text token. Short paragraphs, lists, and meaningful links are supported, without browser paragraph margins changing the form rhythm.
- Feedback uses the corresponding semantic foreground and a distinct glyph shape. Neutral feedback has no status icon. Missing non-neutral message content receives a localizable fallback: Information / Valid / Review this value / Needs attention. A useful correction is preferable to a generic fallback.

## Geometry and layout

| Metric                        | S                             | M                    | L                    |
| ----------------------------- | ----------------------------- | -------------------- | -------------------- |
| Matching control height       | 30px                          | 40px                 | 48px                 |
| Label font                    | `--size-s-control-font`       | `--text-size-body-s` | `--text-size-body-m` |
| Label line height             | 1.4                           | 1.4                  | 1.4                  |
| Label weight                  | 500                           | 500                  | 500                  |
| Label to control, vertical    | 8px                           | 8px                  | 8px                  |
| Control to support            | 8px                           | 8px                  | 8px                  |
| Description to feedback       | 4px                           | 4px                  | 4px                  |
| Supporting font / line height | `--text-size-caption-l` / 1.5 | same                 | same                 |

The sizes follow the contained controls, including Pixel's smaller compact font. Do not enlarge only the label in a dense row. L is the preferred touch size. At 120% text, fonts and supporting lines grow while control height and spacing remain fixed. Labels can wrap instead of truncating.

Vertical is the normal form stack. Horizontal uses a shared `1fr : 2fr` label-to-body grid with a 24px column gap. `--form-field-label-width` can set a common bounded label column on a group of rows. Description and feedback always stay in the body column. DOM and reading order do not change.

Horizontal changes to vertical below **30rem of available field width**, including narrow cards on wide screens. This is a container threshold. A consumer with unusually long labels or large type may choose vertical sooner. Avoid forcing a desktop label column into a narrow drawer.

For single-line controls, center the label's first line box against the 30/40/48px control, leaving subsequent label lines below it. A textarea aligns to its first text row rather than its entire height. Binary groups use their first row, never the total height of the list. Choice cards and composite fields with inner labels use top alignment with the group boundary; their outer heading introduces the set instead of imitating an individual card's inset label.

The wrapper does not add inter-field spacing. The examples use 24px between independent fields, 20px within size studies, and 4px between rich support blocks. A consumer controls its form rhythm. Fields in the same row share a size.

## Feedback ownership and state priorities

| Situation                         | Design outcome                                                                                                                                                                                              |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Neutral / filled / empty          | Same label and supporting geometry. A placeholder supplements the label.                                                                                                                                    |
| Info / success / warning / danger | Semantic text and shape identify the result. Danger identifies invalid input. Warning is advisory and does not imply submission is blocked.                                                                 |
| Input or Textarea with status     | The shell owns the glyph; suppress the duplicate feedback glyph.                                                                                                                                            |
| Binary group or custom widget     | The feedback row owns the glyph. A group error marks the group rule, without inventing a different meaning for each option.                                                                                 |
| Composite field                   | Identify the incorrect inner control and explain it in the shared message. If that control already owns the glyph, omit a second shared glyph.                                                              |
| Read-only                         | The value remains readable, focusable, selectable, and copyable. Relevant status stays visible. Explain why editing is unavailable when needed.                                                             |
| Disabled                          | The control cannot edit or receive Tab focus. Subdue the label once; keep the external reason readable. Suppress stale validation and busy feedback. The preview passes disabled to the control explicitly. |
| Checking                          | Keep editing available unless the operation independently requires read-only. Use a shell spinner and concise checking copy, with no second wrapper spinner. New edits invalidate stale results.            |
| Pointer / keyboard focus          | Only the control or label action owns focus treatment. No additional ring surrounds the entire FormField.                                                                                                   |

Feedback flows into layout immediately, without fades, slides, or collapse animations. A form may reserve one supporting line when keeping adjacent rows steady matters. The live example exposes both choices. Reservation is a minimum, never a fixed height: longer feedback grows and pushes following content down. Empty reservation has no accessible message.

No validation appears merely because a user starts typing. Applications choose check/blur/submit timing. On submit, focus the first invalid control; for a group, focus its first relevant enabled option. Keep entered values. Editing clears a stale result, while the next relevant check may show a new one. Do not announce every field simultaneously with `role="alert"`. Form-level failures and overall saved feedback belong to the application; FormField does not introduce a form store, network validation, or an error-summary component.

## Semantics and direction

A single control uses a real label linked to its ID. A group uses a noninteractive heading linked to its named group or fieldset; clicking this heading must not toggle the first option. Each option retains its own label. Composite fields retain inner names such as Start / End. Description and feedback IDs are explicitly connected in the examples; future library scope helpers must preserve the same outcomes without duplicate labels or descriptions.

Layout follows logical reading direction. Group headers, required/optional text, label actions, and support align with the surrounding interface. A URL or email can set its entire shell to `dir="ltr"` while its external label and support remain in RTL. Keyboard order follows the DOM rather than the visual grid.

Soft and Frost use their normal primary/muted/semantic foregrounds; Frost obtains readability from those colors on the actual overlay panel. Pixel uses the active monospace font and sharp control geometry. FormField has no material-specific motion. Forced colors use system foregrounds while glyph shape, marker, and message preserve meaning. There is no independent animation to disable under reduced motion.

## Inspection and handoff

| Section        | What to inspect                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `layout`       | S/M/L, vertical/horizontal, optional/required, Ghost in an editing context.                    |
| `anatomy`      | Label action, persistent rich instructions, textarea, standalone parts.                        |
| `feedback`     | All five statuses on controls/groups, glyph ownership, fallback labels.                        |
| `groups`       | Checkbox, Radio, Switch, choice cards, first-row versus top alignment.                         |
| `availability` | Read-only, disabled, checking, read-only + checking, pinned pointer/keyboard focus.            |
| `live`         | Submit error, first-invalid focus, correction, success, reset, optional message reservation.   |
| `overflow`     | Long label action and copy, links, RTL/LTR island, composite field, narrow-container collapse. |
| `overlay`      | Real static floating material with a validation toggle.                                        |

The native controls and local validation example are live. Focus samples are explicitly pinned and do not move DOM focus. Feedback and group matrices pin validation decisions; changing their values does not run a validator. The overlay is a static surface study, not a popup lifecycle implementation. Existing sign-in, properties drawer, invitation, and preferences scenes provide product context; they continue using their existing wrappers until a separate integration change.

Inspect all six presets, Base/Overlay, 360/768/1280/1440px, 120% text, and RTL. Verify readability together with hierarchy, not by strengthening every border. Full controlled/uncontrolled authority, generated scope helpers, reset association, announcement timing, disabled-fieldset behavior, and cross-browser semantics are library-stage obligations under [Overlays and Forms](../../../../../docs/concepts/overlays-and-forms.md). Preserve the design, replace local imports, remove temporary component CSS, and document the real API in `docs/components/form-field.md` at that stage.
