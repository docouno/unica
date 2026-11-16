# NumberInput — design reference

Status: visually approved on 2026-11-16. Open `/?item=number-input`. This is a reusable workbench prototype, not a package export or the final TypeScript API. The settings scene and Slider's exact-entry example consume this same component.

## Purpose and boundaries

NumberInput edits a numeric quantity: a count, timeout, limit, dimension, percentage, or signed adjustment. The editor supports exact typing, with a persistent pair of full-height decrement and increment actions. Use Input for identifiers with leading zeroes, postal codes, telephone numbers, and payment-card numbers. Use Slider when relative position matters. Currency symbols and unit abbreviations are decorations; this is not a locale-aware currency formatter or arbitrary-precision calculator.

The two structural roles are `default` for a form slot and `ghost` for inline properties and numeric cells. Both retain visible actions at rest, including on touch. Ghost inherits Input's transparent fill and straight baseline; hover strengthens that baseline, rather than revealing a second framed field. Neither role has a decorative material variant.

There is no Clear action, custom leading/trailing icon, draggable label, wheel adjustment, grouping separator, range editor, or built-in slider. A label and optional supporting text explain the quantity and unit. Applications own validation timing and optional-value meaning.

## Anatomy and geometry

Decrease and increase sit flush at the two outer edges of the shared shell. Between them, the prefix → numeric editor → suffix group is centered as one amount. Status and spinner occupy the inline-end of that middle region, with equal clearance reserved on its opposite side. Feedback therefore keeps the amount centered instead of pushing it sideways. The actions have no internal dividers; spacing and their distinct glyphs establish the grouping. The numeric value remains primary; short unit affixes and actions are secondary. Status changes the shell edge and its own glyph/message, not the action palette.

| Metric                           | S                   | M (default)    | L              |
| -------------------------------- | ------------------- | -------------- | -------------- |
| Outer height                     | 30px                | 40px           | 48px           |
| Each action, width × height      | 28 × 28px           | 34 × 38px      | 44 × 46px      |
| Editor type                      | size-s-control-font | body-s         | body-m         |
| Glyph size, padding, gap, radius | Input S tokens      | Input M tokens | Input L tokens |
| Label                            | size-s-control-font | body-s         | body-m         |
| Help and message                 | caption-l           | caption-l      | caption-l      |

Use L for touch-focused forms: both targets exceed 44 × 44px. S and M retain at least a 24 × 24px target for pointer use. Text scaling does not change the control height; labels and supporting text wrap naturally. No part of the shell, value, unit, or neighboring field moves on press. This deliberately quiet response suits integrated field actions in all three materials.

The outer radius uses Input's size token. In Default, each action's outer corners use `max(0px, outerRadius - 1px)`, so its hover/press fill stays inside its end of the shell. Ghost gives both action plates two softly rounded top corners, `max(0px, outerRadius - 3px)`, and two square bottom corners (`0px`): the fill meets the straight baseline without curved cutouts while its free top edge stays soft. Pixel keeps both roles square. There is no clipped overflow around the shell's outer focus contour.

`width="full"` fills its layout slot. `width="auto"` uses the larger of an 8ch content basis and the amount group's natural width, then adds symmetric feedback gutters, two equal actions, and intervening gaps. The result caps at its container. Feedback reserves space in addition to the useful amount viewport; it never consumes the 8ch basis. The compact capacity example demonstrates units, status, and loading together. Within the amount group the editor sizes to its draft, with a minimum of 3ch. Under container pressure it can shrink back to 3ch; affixes can shrink and ellipsize. Keep unit affixes short (up to roughly five characters) and put their full meaning in the label/help. The intended minimum is a useful numeric viewport, not a universal tiny width: allocate more room when feedback and units coexist. At 360px/120% text the specimen demonstrates that crowded arrangement explicitly.

Numbers use tabular digits and remain one line, with centered text inside a compact editor. Long numbers retain a native horizontally scrolling editing viewport; never wrap, shrink the font, or fabricate an ellipsis that changes the displayed quantity. In a fixed-width or full slot, actions stay anchored when feedback appears; symmetric feedback gutters reduce the middle viewport equally at both sides. An intrinsic auto field can grow when its draft or feedback grows, keeping the amount centered within its resulting width. Use a fixed layout slot when neighboring content must stay in place. Feedback may also grow the supporting-text region below the field; applications can reserve that region when their layout requires it.

The shell, slots, and action order follow the interface direction: decrease at inline-start and increase at inline-end. The centered editor itself is an LTR island: a signed decimal such as `-12.5` retains its internal reading order in RTL. Prefix and suffix text are direction-isolated. A suffix is not automatically part of the accessible numeric value; supply the unit through the accessible name or description when necessary.

## Material and state feedback

Soft inherits Input's matte recessed plate, Frost its contextual dark/light field recipe and translucent overlay adaptation, and Pixel its square, precise outline and monospaced type. The outer field edge or baseline carries the structure; the actions add no internal borders. The pair does not look like two independent primary buttons. No new theme recipe or theme-name CSS branch is needed.

| State                             | Intended appearance and result                                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rest                              | Neutral shell, readable number, quiet units and visible actions. Ghost has a baseline; neither role has action dividers.                                                         |
| Field hover                       | Stronger neutral edge or baseline. No whole-field fill flash. The actions stay visually quiet until directly hovered.                                                            |
| Button hover                      | A local neutral plate and stronger glyph on that action only.                                                                                                                    |
| Button press                      | A slightly stronger local plate without an added border. No translation, scaling, or value movement.                                                                             |
| Pointer focus                     | Stronger existing edge/baseline, with no outer ring. Typing and caret movement keep this quiet treatment.                                                                        |
| Keyboard focus                    | One 2px contour at 2px offset around the whole compound field; statuses preserve their hue.                                                                                      |
| Info / success / warning / danger | Distinct glyph shapes, a colored edge/baseline, and readable explanation. One glyph inside the shell, no duplicate beside the message.                                           |
| Minimum or maximum                | Only the outward action becomes unavailable. The editor and inward action keep normal contrast. A one-value domain disables both actions, while typing remains available.        |
| Read-only                         | Full-contrast selectable number and visible but unavailable actions. Hover/press cues stop. Explain the policy externally when needed; no lock glyph replaces the unit.          |
| Disabled                          | Muted plate/value/actions; no status glyph, status edge, or spinner. The outside explanation stays readable. No global opacity.                                                  |
| Loading                           | A spinner at the inline-end of the middle region. Editing and stepping remain available. Busy status and validation can coexist. A blocking operation adds read-only explicitly. |

Internal dividers remain absent during hover, focus, status, press, and forced colors. Field hover does not highlight either action. Read-only can receive the full keyboard contour. Disabled takes priority over every other state. Status and busy slots are independent; the simultaneous example is an intentionally dense stress case.

Forced colors retain native system edges, an explicit baseline for Ghost, a Highlight focus contour, and GrayText unavailable actions. Glyph shapes and message text retain status meaning. Reduced motion freezes the spinner; adjacent checking text still conveys work. Value updates and focus feedback are immediate, with no motion-dependent explanation.

## Expected interaction and validation

Tab visits the numeric editor once. The two `type="button"` actions have distinct accessible names, refer to their editor, and remain available to pointer and assistive activation outside the ordinary Tab sequence. ArrowUp/ArrowDown perform one numeric step. Left/Right, Home/End, selection, clipboard, Backspace, and Delete keep native text-editing meanings. Escape keeps its enclosing page/overlay meaning; it does not clear or revert this field. There are no special PageUp/PageDown or modifier shortcuts.

Mouse activation preserves or returns focus to the editor without scrolling. Touch and assistive activation change the quantity without forcing an unfocused editor to summon the mobile keyboard. Holding an action starts repeating after 450ms, once per 100ms, without acceleration; release, pointer cancellation, or loss of capture stops it. Repetition stops producing changes at the applicable limit. Leaving the target without release continues the captured press. Loss of window focus, availability changes, and unmount also cancel repetition. Normal wheel scrolling never changes the value or steals focus and must keep the page scrollable.

Typing preserves the draft. Blur and Enter never silently clamp or snap a number. Show a meaningful validation result after an appropriate check, blur, or submission; do not interrupt the first keystrokes with an error. Once an asynchronous result is shown, a new edit clears the stale result. The local checking harness offers explicit response buttons; it is not a network validator.

| Input and constraints                     | Result                                                                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `125`, range `0…50`                       | Keep `125` on blur/Enter and explain the maximum. Increase is unavailable; decrease returns to `50`.                                        |
| `-5`, range `0…50`                        | Keep the value with an explanation. Decrease is unavailable; increase returns to `0`.                                                       |
| `12`, `min=0`, `step=5`                   | Keep the typed value; report the step if checked. Increase selects `15`, decrease selects `10`.                                             |
| `12`, `min=0`, `max=12`, `step=5`         | `12` is a step mismatch. The last permitted step is `10`; increase is unavailable and decrease selects `10`.                                |
| `0.2`, `step=0.1`                         | Increase selects `0.3`, with no visible floating-point tail.                                                                                |
| `0.25`, `step="any"`                      | Keep arbitrary decimal precision while typing. Actions change it by ±1, retaining its fractional part within the bounds.                    |
| Empty optional field                      | Stay empty until the user edits or steps. Never turn empty into zero on blur.                                                               |
| Empty required field                      | Explain the missing value after blur/check/submission. The required mark and accessible required state are both present.                    |
| Empty unconstrained field                 | Increase starts at `1`, decrease at `-1` for the default step.                                                                              |
| Empty field containing zero in its domain | Take one directional step from zero, constrained to the domain and step grid. For `min=0`, step 1, decrease starts at `0`, increase at `1`. |
| Empty wholly positive / negative domain   | Either action starts at the nearest allowed value to zero: the lower / upper permitted step respectively.                                   |
| Incomplete sign, decimal, or exponent     | Leave the browser's in-progress edit intact. On completion, explain an unfinished number rather than showing a false zero.                  |

The illustrative step grid is based at explicit `min`, otherwise zero. The final library contract must document its exact base and decimal precision limits consistently with native validity, and preserve every demonstrated outcome. Native `badInput`, empty input, and numeric zero are different states; the browser can expose an unfinished edit as an empty DOM value. Exact intermediate notation, localized keyboard behavior, and exponent entry vary by browser. This candidate uses native `type="number"`, with browser mini-spinners hidden, and does not implement a separate text parser.

## Inspection and implementation boundary

Sections: `roles`, `anatomy`, `interaction`, `feedback`, `availability`, `bounds`, `live`, `overflow`, and `surfaces`. Pinned state comparisons keep appearance without moving actual focus. Labels and captions identify those comparisons. The material plates are static; they do not pretend to implement a popover. The settings scene owns its application layout, while Slider's exact-entry example shares the quantity with its adjacent field. Empty and out-of-range drafts remain visible in that field while the Slider keeps its last valid value.

Live native editing, arrow stepping, pointer actions/hold, local validation, feedback correction, and common numeric synchronization make the design inspectable. The prototype uses local draft state and simple arithmetic. It does not prove strict controlled refusal, controlled/uncontrolled authority, complete decimal precision, changing domains, reset/submission, disabled fieldsets, SSR/hydration, assistive announcements, or full browser/touch certification. These are library engineering obligations, not permission to invent a different appearance or interaction. The full hold lifecycle under changing domains and assistive/mobile focus behavior still require production verification.

Review all six presets on Base and actual Overlay plates, at 360/768/1280/1440px, 120% text, and RTL. Inspect real focus, target size, number readability, contrast, unavailable actions, reduced motion, and forced colors. The shipped implementation replaces prototype imports, removes the temporary component CSS, and publishes its actual contract in `docs/components/number-input.md`.

Interaction references: [WAI spinbutton pattern](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/), [quantity example](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/examples/quantity-spinbutton/), and [native number input](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/number).
