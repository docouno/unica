# Choice cards — design reference

Status: visual design approved on 2026-11-16. Open `/?item=checkbox-card`, `/?item=radio-card`, and `/?item=switch-card`. This reference describes the intended experience. The local props, shared slot aliases, appearance pins, and native preview wiring are not the final package API.

## Purpose and boundaries

- **CheckboxCard** is an independent choice, usually one of several options submitted together. Use a compact Checkbox for short copy. Cards may also stand alone when one explained consent or inclusion choice merits the space. An aggregate “select all” remains a compact Checkbox; these option cards have no mixed state.
- **RadioCard** presents one alternative in a named set. The group may start without an answer. A repeated click does not clear the selected alternative. Offer an explicit “None” option when declining is meaningful. Use a compact Radio for short alternatives, Select for long lists, and SegmentedControl for short peer modes.
- **SwitchCard** applies an on/off setting immediately. Keep its title stable. Use CheckboxCard when a separate Save or Apply commits the setting. SwitchCard has no mixed, required-group, or danger variant; failed persistence is adjacent feedback.

All three have zero decorative variants. Their background and selected boundary consume the existing contextual `--choice-card-*` recipe. Base and Overlay adapt by inheritance. Soft has warm matte plates, Frost has cool plates with a translucent veil inside overlays, and Pixel has square plates. Selection is a quiet accent wash and contour, with a mandatory visible check, circular dot, or thumb position. Pixel's Radio remains circular. These option plates have no external shadow, hover lift, translation, scale, or button press physics. Dense settings should not look like a stack of floating buttons.

## Anatomy and density

Reading order is primary indicator, title, optional description, optional metadata, and optional secondary actions. CheckboxCard and RadioCard default to an inline-start indicator; SwitchCard defaults to inline-end. End placement is also useful for short option lists. Placement mirrors in RTL; price and identifiers can use a local `bdi` when their direction must be preserved.

| Metric                       | S                          | M (default) | L           |
| ---------------------------- | -------------------------- | ----------- | ----------- |
| Content inset                | 12px                       | 16px        | 24px        |
| Surface radius in Soft/Frost | 10px                       | 12px        | 16px        |
| Indicator/content gap        | 8px                        | 12px        | 12px        |
| Checkbox / Radio mark        | 16px                       | 20px        | 24px        |
| Switch track                 | 40 × 22px                  | 44 × 24px   | 52 × 28px   |
| Label                        | Body S, 600                | Body S, 600 | Body M, 600 |
| Description                  | Caption L, 1.5 line height | Body S      | Body S      |
| Label/description gap        | 4px                        | 4px         | 4px         |

Body typography follows the theme's font and text-size recipes, including Pixel's compact metrics. The indicator is centered on the **first title line**, never against the full description or card height. A label-only card therefore centers its mark against its only content line. The switch may extend slightly above/below that line box; the inset reserves space. Mixed RadioCard/SwitchCard stacks retain the same title baseline and content inset.

Metadata is below the description, separated by 8px in total: the normal 4px stack gap plus 4px metadata margin. Use a passive Badge, price, scope, or short qualifier. A Badge never replaces the primary title or the selection marker. Keep the state of an option distinct from its price or “Included” metadata. Secondary actions follow with 12px total separation. The price is supporting content, not the control's entire name. No mandatory icon, thumbnail, or empty media slot is reserved.

The entire free card surface activates the primary input once. Primary focus draws one 2px theme contour with 2px offset around the **whole card**, with no duplicate ring on the embedded mark. The root does not clip the contour or its secondary controls. A secondary Link or Button owns its own normal target and focus ring; focusing it does not outline the whole card. A stretched label and sibling secondary layer keep interactive elements out of `<label>`. Hovering a secondary action only highlights that action. A disabled secondary action must not disable the primary card.

`indicatorPlacement="none"` means manual placement, not absence of a marker. Supply the matching decorative `*CardIndicator` inside the content; it tracks the same native input without adding another target or focus stop. The specimen shows the manual marker aligned at the title's end. Never communicate selection only by a colored border. Omitting all visible markers is outside the design.

Cards have an intrinsic height and minimum 44px target. No essential text is ellipsized, clamped, or made internally scrollable. Long unbroken identifiers wrap. Metadata and actions wrap into new rows. Adjacent cards may stretch to equal outer height; content remains top aligned and no title line moves to center a tall neighbor. The example grid switches to one column when two 15rem options cannot fit; that is a composition choice, not a card breakpoint. Stress controls must preserve the marker's width at 360px and 120% text.

## State priorities and interaction

| State                          | Appearance and expected result                                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rest, unchecked/off            | Neutral contextual plate and quiet edge, with the empty shape or off thumb clearly visible.                                                                                                             |
| Selected/on                    | Accent wash and selected edge; check/dot/position retains the non-color signal. No geometry changes.                                                                                                    |
| Hover on primary target        | Slightly stronger outer edge; selected edge blends toward the theme signal. No action emphasis across the whole text.                                                                                   |
| Held press                     | Quiet selection-tinted plate and stronger edge. Selected stays selected until activation completes. All geometry stays stationary.                                                                      |
| Keyboard focus                 | Independent outer contour remains visible during hover, press, selected, read-only, invalid, or pending states.                                                                                         |
| Read-only                      | Full-contrast value and content, no hover/press change, normal focus. Explain the policy with nearby text; a lock may accompany that explanation, never replace the mark.                               |
| Disabled                       | Neutral plate with a dashed boundary, muted title and mark, retained selected shape/position. The description stays readable. No whole-card opacity, hover, press, focus, or spinner.                   |
| Invalid CheckboxCard/RadioCard | A 2px error edge around the plate and a single explanatory field/group message. Keep the selected accent and check/dot. Focus remains a separate outer contour.                                         |
| Pending SwitchCard             | Spinner inside the existing thumb, stable title, adjacent “Turning … on/off” feedback. Retain the last committed value, current position, focus, and full-contrast plate. Suppress repeated activation. |
| Failed SwitchCard request      | Stop the spinner, retain the committed value, show a local error explaining that the change was not saved and how to retry. Do not turn the setting into a red action or claim success.                 |
| Successful SwitchCard request  | Adopt the requested value, stop the spinner, and show a concise saved confirmation until the next attempt.                                                                                              |

Disabled overrides interaction, invalid decoration, and pending. Read-only blocks editing without fading the value; read-only plus pending can represent background synchronization. Invalid feedback does not erase selection. Focus is independent of these states. Secondary informational links can remain available while the primary option is disabled or read-only; disable a configuration action separately when it cannot be used. Do not blanket-disable useful explanations.

Outer plate feedback uses a 120ms color/border transition in all materials. The indicator changes shape/value immediately. Only Switch's thumb travels: Soft 160ms, Frost 140ms, Pixel immediate, inherited from its theme recipe. Reduced motion removes plate transitions, thumb travel, and spinner rotation; adjacent pending text retains meaning. Forced colors use Canvas, ButtonText, Highlight/HighlightText and GrayText, preserve the marker and disabled dash, and retain an outer focus contour.

CheckboxCard: Tab visits each available input and its secondary actions in DOM order; Space toggles, Enter keeps native checkbox behavior. RadioCard: a set has a visible heading or accessible name and one primary Tab entry. Native arrows move focus and selection together through available alternatives; repeated selection cannot clear the answer. Home/End are intended first/last shortcuts in the library. Individual disabled alternatives retain their displayed value until a user chooses a peer. Read-only applies to the whole radio set. Independent terms/details actions remain reachable without forcing a selection, including on unselected alternatives; do not silently remove those links from Tab order. SwitchCard: each setting is independently tabbable; Space and a single nonrepeating Enter toggle, and Enter must not submit a containing form.

Titles provide concise accessible names and remain stable across states. Descriptions explain consequences; field/group help and errors are referenced separately. A logical group has a visible heading, help, and one correction message. Validation appears on an explicit attempt, not on initial render, and clears when the choice is corrected. A selected choice can remain invalid when it conflicts with policy. No automatic scrolling, focus stealing, or destructive side effect accompanies validation or selection.

## Inspection and integration

Each family has sizes, rich anatomy, label-only and manual placement, pinned interaction states and intersections, live read-only/disabled values, long content, and actual floating material over the workbench underlay. CheckboxCard and RadioCard include live empty-selection validation. SwitchCard adds pending off/on at all sizes, priority intersections, and an explicit local success/failure/retry harness. Appearance pins never set DOM focus and do not freeze the live value. Succeed/Fail are preview controls, not product buttons or a simulated network service; focus naturally moves to them when clicked. The pending input itself is never remounted or natively disabled.

Existing Folio scenes independently consume the new family: page properties (RadioCard and deferred CheckboxCard), invite/access (CheckboxCard), and import policy (RadioCard). Page properties intentionally keeps its CheckboxCard because Save properties applies the automation flag. The immediate SwitchCard is inspected in its own material/context study. Do not duplicate these application screens inside the component specimens.

The native preview supports pointer/Space, native radio arrows and mutual exclusion, direct refs, independently clickable/focusable secondary actions, local validation, read-only blocking, and controlled pending outcomes. Each radio study has an instance-specific native name, so six artboards never share selection. Compound examples explicitly connect descriptions when needed.

The library implementation must design and prove the exact React 19/TypeScript API, group context and mixed compact/card membership, controlled refusal, native form submission/reset and validation authority, disabled fieldset/inert behavior, cross-browser radio focus entry and Home/End shortcuts, announcements, and ref/composition guarantees. Preserve all visual and user decisions above. The current prototype does not claim those complete reusable mechanisms. Public package documentation belongs with that implementation; this is the live design handoff.

References: [WAI-ARIA Switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/), [Checkbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/), and [Radix Radio Cards](https://www.radix-ui.com/themes/docs/components/radio-cards). These inform semantics and comparative patterns; Unica's material and interaction choices are specified here.

Interaction references: [WAI-ARIA Checkbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/), [Radio Group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/), and [Switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/). The visual treatment and rich-action composition are specific to this family.
