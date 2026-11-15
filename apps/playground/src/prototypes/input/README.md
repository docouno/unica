# Input & FormField — design reference

Status: draft visual candidate, awaiting visual approval. Open `/?item=input` in the playground. This is a live design reference, not a package export or a final TypeScript API. Application [scenes](../../scenes/) consume the same prototype.

## Purpose and roles

Input is a single-line text field for names, addresses, search, and inline editing. Native text selection, caret movement, and copying remain familiar. Password visibility, numeric steppers, masking, suggestions, and multi-value entry belong to other families or the application. A native password field without a reveal action can still use this shell.

- `default` defines a visible form slot, including empty fields. Prefer it for standalone forms and touch interfaces.
- `ghost` is an inline editing role in an already recognizable editing context. Its fill is transparent, with a persistent, quiet 1px baseline. Upper corners follow the theme; lower corners are square so the baseline stays straight. Hover and pointer focus change only the baseline, using distinct resting, hovered, and focused edge colors. The fill stays transparent and the other three edges stay absent. A non-neutral status colors the baseline even at rest. Prefer Default for standalone forms; show Ghost in an understandable editing context, such as the specimen’s editable details.

Edge states share one semantic scale across both roles: `--control-border` at rest, `--control-border-hover` on hover, and `--control-border-focus` while editing. The focused edge is neutral and more distinct than hover, separate from the high-visibility keyboard `--focus-ring-color`. Status edges retain their meaning instead of switching to the neutral focus color.

The themes own material: matte separation in Soft, a quiet base plate and translucent overlay veil in Frost, and sharp rectangular geometry in Pixel. Keep the existing thin resting borders. Evaluate the field's complete affordance and actual context; a decorative border's contrast alone does not establish or disprove accessibility. Fields do not translate, depress, or glow on pointer press. Feedback changes immediately; only the progress ring rotates.

## Anatomy and geometry

The reading order is label, field shell, description, message. Description and message form one supporting group: 8px from the field, 4px between the two lines. Labels remain outside the field and may wrap; placeholders never replace an accessible name. A required asterisk accompanies the native required state. Mark optional fields in the label when useful to the form.

Inside the shell, the order follows the interface direction:

`leading icon → prefix → value → suffix → Clear → status glyph → spinner`

A decorative trailing icon appears only when neither status nor loading feedback occupies that end. Clear, status, and spinner have separate slots and can coexist. Text affixes and decorative icons are not actions. Adjacent picker prototypes also reuse the shell for interactive adornments; those action containers stay untruncated and preserve their full local focus contour. The clear action has an accessible name such as “Clear workspace address”.

| Metric                     | S    | M    | L    |
| -------------------------- | ---- | ---- | ---- |
| Height                     | 30px | 40px | 48px |
| Horizontal inset           | 10px | 16px | 20px |
| Slot gap                   | 6px  | 8px  | 10px |
| Icon / status / spinner    | 14px | 16px | 20px |
| Radius, Soft and Frost     | 6px  | 8px  | 10px |
| Radius, Pixel              | 0px  | 0px  | 0px  |
| Clear target, fine pointer | 24px | 24px | 28px |

Use L for touch; its clear target grows to 44px on a coarse primary pointer. Do not place S/M fields in a touch layout without providing the required target space. At 120% text, text grows while the chosen height, glyph size, and spacing stay fixed; the examples verify this range. Further browser zoom must retain native usability.

The clear glyph shares the trailing decorative icon’s end inset. Its larger hit area extends into existing padding and gaps instead of adding extra visible spacing around the glyph. M uses a 24px button around a 16px glyph, compensating 4px at either side. Keep at least 2px between the hit area and neighboring content; S and L/coarse reserve extra room where necessary. The hover plate is therefore closer to the edge than the glyph, and the value viewport stays fixed when Clear disappears.

Values and labels use the primary foreground; icons and affixes use the secondary foreground; placeholders and helper copy use the muted foreground. Read-only values retain full contrast. Disabled uses the disabled foreground without fading the whole field twice.

`full` fills available width. The prototype's `auto` reference is a bounded 20rem field, capped at the container width; engineering can refine the exact width API without changing the demonstrated layouts. Affixes stay on one line, shrink, and ellipsize before the editable region loses its 4ch floor. Their complete essential content must also be available in helper copy or the accessible name. Keep units concise. Nonessential decoration should be omitted when a consuming layout cannot accommodate all slots.

Long values use the native horizontal viewport. At rest they ellipsize; on focus the caret scrolls through the actual value. Labels, descriptions, and messages wrap, including unbroken strings. Shell height never grows because of an affix. In RTL the slots follow reading direction, and affix text is bidi-isolated. An explicit `dir="ltr"` sets the direction of the whole field shell, including the URL prefix, value, and suffix; the external label and helper remain in the surrounding interface direction. Use this complete LTR island for structured addresses.

## States and their precedence

| State                             | Appearance and expected outcome                                                                                                                                                                                                                                                                                |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rest                              | Quiet framed plate for Default; transparent fill and a quiet baseline for Ghost. Filled and empty states share dimensions.                                                                                                                                                                                     |
| Hover                             | Both roles use `--control-border-hover` for their neutral edge: the existing frame on Default, only the baseline on Ghost. Ghost keeps its transparent fill. Status keeps its own edge. Read-only and disabled do not advertise editing on hover.                                                              |
| Pointer focus                     | After a click or tap, both roles use `--control-border-focus` for their existing edge. Ghost keeps its transparent fill and baseline-only geometry. Pointer focus has no outer contour. Typing, selection, and caret movement preserve this quiet appearance.                                                  |
| Keyboard focus                    | A 2px outer contour at 2px offset encloses the whole shell. Neutral uses the theme focus token; other statuses retain their hue. The contour stays visible while typing after keyboard navigation.                                                                                                             |
| Clear focus                       | Only the action has a local focus contour. The shell does not retain a second input-focus ring.                                                                                                                                                                                                                |
| Clear hover / press               | Local neutral plate, stronger edge on press, no movement of the field or text.                                                                                                                                                                                                                                 |
| Info / success / warning / danger | Status edge, distinct glyph shape, and a readable message. Input uses one glyph inside the shell, without duplicating it beside the message. Danger identifies invalid input. Color is not the only signal.                                                                                                    |
| Read-only                         | Value stays readable, focusable, selectable, and copyable. Clear is hidden, retaining its reserved space. Status remains visible. Explain why editing is unavailable nearby when it is not obvious.                                                                                                            |
| Disabled                          | No input, Tab, actions, status glyph, or spinner. Default has a muted plate; Ghost retains a subdued baseline and transparent fill. Disabled takes priority over loading/status; the external explanation remains readable.                                                                                    |
| Loading                           | Indicates ongoing work, not an implicit editing lock. Keep input focus, typing, selection, and outer geometry. Clear remains visible but temporarily unavailable, retaining its slot; an already focused clear action keeps focus. Status and spinner coexist. A blocking operation adds read-only explicitly. |
| Read-only + loading               | Visible busy feedback on a selectable value; no clear action.                                                                                                                                                                                                                                                  |

The prototype tracks pointer versus keyboard navigation within its document. Ordinary typing and caret movement after a click do not switch focus styling; Tab navigation does. Focus returned from Clear or moved programmatically inherits the initiating interaction; without an observed interaction, use visible keyboard focus. Forced colors preserve a strong indicator for either origin. The library implementation must preserve these outcomes while supporting platform and assistive focus preferences.

Clear reserves its width even when empty. Clearing via pointer, Enter, or Space empties the value and returns focus to the input. Escape is not a custom clear shortcut and retains its enclosing page/overlay meaning; native search behavior is browser-owned. Clicking a noninteractive decoration or shell padding focuses the field. Do not interrupt IME composition to clear text.

Applications own validation timing. Keep a field calm while a user first types. Show validation after a relevant check, blur, or submission; explain the correction in text. New edits must not present a stale asynchronous result as current. The live example demonstrates neutral → checking → success/danger → correction, with explicit response buttons. It is not a network validator. Messages flow below the field rather than covering neighboring content; a form can reserve message space when its layout needs it.

Autofill should retain the same text hierarchy, shell geometry, and visible value as an ordinary filled field. Browser-specific autofill paint, password-manager decorations, and mobile keyboards need production browser verification; this candidate does not simulate a verified autofill engine.

## Inspection and implementation boundary

| Section        | Design question                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `roles`        | Filled and empty default/ghost at every size.                                                  |
| `anatomy`      | Decorations, affixes, clear reservation, slot priority, all-slot coexistence, S/M/L feedback.  |
| `interaction`  | Pinned hover/pointer focus/keyboard focus/clear states, live examples, and end-slot alignment. |
| `feedback`     | All five statuses across both roles; pointer and keyboard focus preserve the status hue.       |
| `availability` | Editable, read-only, disabled, loading, and meaningful intersections.                          |
| `live`         | Controlled editing and explicit checking/result/correction transitions.                        |
| `overflow`     | Long values, both affixes, wrapping labels/messages, external naming, width, and RTL.          |
| `surfaces`     | Identical fields on actual base and overlay material plates; these plates are static.          |

Inspect all six presets, 360/768/1280/1440px, 120% text, RTL, and real Base/Overlay consumers. Relevant existing consumers include sign-in, editor link popover, invite modal, and catalog search. Select and NumberInput also share parts of the prototype CSS; check them after shell changes.

Forced colors retain explicit system borders (a baseline for Ghost), local action focus, and Highlight input focus for both pointer and keyboard origins. Status glyph shape and message preserve meaning when colors collapse. Reduced motion freezes the ring; adjacent checking copy continues to explain the state.

The native input, clear action, composition guard, and local examples make the intended experience inspectable. Pinned states do not move actual DOM focus. Full controlled/uncontrolled authority, reset and external form association, disabled fieldsets, assistive announcement timing, browser autofill, and cross-browser input-type behavior are implementation obligations under [Overlays and Forms](../../../../../docs/concepts/overlays-and-forms.md). The implementation must preserve these visual and interaction decisions, replace prototype imports, remove the temporary component CSS, and publish the actual API in `docs/components/input.md`.
