# Textarea — design reference

Status: design approved on 2026-11-15. Open `/?item=textarea` in the playground. This reference specifies appearance and expected interaction; it is not a package export or the final TypeScript API. The existing [page properties drawer](../../scenes/06-page-properties-drawer.scene.tsx) and [invite modal](../../scenes/07-invite-access-modal.scene.tsx) consume this same prototype.

## Purpose and composition

Textarea accepts paragraphs of plain text: descriptions, comments, prompts, handoff notes, and logs. It provides room to read and edit without becoming an editor toolbar. Rich text, syntax highlighting, attachments, mentions, and submission actions belong to other components or the application. There is no built-in clear button, loading spinner, prefix, or suffix. A single accidental action should not erase a long draft.

`default` is a framed form slot. `ghost` is inline editing within an already understandable editing context: transparent fill and a persistent quiet baseline, matching [Input](../input/README.md). Ghost is not a substitute for a visible label or editing context. Prefer Default for standalone forms and touch layouts.

Width fills the form column by default. The optional auto-width reference is 28rem, capped by its container. Consumers control narrower layouts. Neither mode changes the text size to make content fit.

Soft supplies matte plates, Frost a recessed base plate and translucent overlay material, Pixel square geometry and monospaced rhythm. Textarea never adds its own glow, press displacement, bevel, or material selector. Thin theme edges remain quiet; text and feedback carry the hierarchy.

## Anatomy and geometry

Reading order: label → native text viewport → description → message and counter. A separate FormField can supply the label and guidance; do not duplicate these parts. Placeholder copy is a short invitation, never the only accessible name or an essential instruction.

| Metric                     | S    | M    | L     |
| -------------------------- | ---- | ---- | ----- |
| Horizontal text inset      | 10px | 16px | 20px  |
| Vertical text inset        | 8px  | 12px | 16px  |
| Text size, Soft / Frost    | 13px | 14px | 16px  |
| Text size, Pixel           | 11px | 12px | 14px  |
| Line height, all themes    | 20px | 20px | 24px  |
| Status glyph               | 14px | 16px | 20px  |
| Text-to-status minimum gap | 6px  | 8px  | 10px  |
| Radius, Soft / Frost       | 6px  | 8px  | 10px  |
| Radius, Pixel              | 0px  | 0px  | 0px   |
| Three-row height           | 78px | 86px | 106px |

The native textarea fills the entire framed box, including the bottom resize corner. The surrounding shell paints the continuous material and frame. The line-height tokens scale with 120% text; padding, glyph size, and radius do not. Height follows the enlarged line rhythm, preserving the requested visible rows. The 1px border contributes 2px to the total height. S is for dense desktop forms, M for ordinary forms, L for comfortable touch entry.

For ordinary wrapped text, a single status glyph sits at the first line's vertical center near inline-end. It is outside the scrolling text contents, so it stays in place while the user reads lower paragraphs. Its protected column is reserved in every state, including neutral. Switching validation must not change line wrapping, height, caret position, selection, or scroll position.

The status glyph uses the same end inset as Input in every size: 10 / 16 / 20px inside the border for S / M / L. The native viewport does not reserve an empty scrollbar gutter. When the content overflows, the real scrollbar takes its own space; ordinary scrollbar appearance may change text wrapping, but validation alone never changes the reserved glyph column or its position. Forced colors use a 20px status-inset minimum to keep wider system controls clear.

Textarea uses the same compact native scrollbar recipe as Popover: a 10px channel with a 4px visible thumb on desktop Chromium/WebKit, and native `thin` on the standard path. The track is transparent; thumb colors and hover/drag feedback come from the shared recipe. Scrollbar parts explicitly use the default arrow cursor, while the editable text retains its text cursor. Clicking the track or dragging the thumb scrolls natively without repositioning the text selection; focus follows native browser behavior. There is no custom scrolling engine.

Manual resize keeps the browser's real drag target and vertical-only behavior. On fine-pointer Blink/WebKit browsers, its native resizer is painted as two short diagonal strokes in a 6px square, 2px inside the corner; RTL mirrors the strokes and corner. The strokes use the current field-edge color, including its hover, focus, and status tone, so the handle stays as quiet as the frame. The mark fits inside the compact native corner. The browser owns the resize cursor and hit target; Chromium uses a vertical resize cursor for this vertical-only control. Fixed, autosize, and disabled fields have no handle. Unsupported browsers, coarse pointers, and forced colors retain the system marker. This is progressive styling of the real handle, not a separate simulated drag control.

Labels are 8px from the control. Supporting content starts 8px below it; description and footer are 4px apart. Description spans the full width. Message and counter align on their first baseline, separated by at least 16px. A message receives the flexible space; when both cannot fit comfortably, the counter moves to the next line at inline-end. A counter without a message sits at inline-end without an empty left cell. Long labels, messages, and uninterrupted references wrap rather than stretch the form.

Counter digits are tabular. Numeric phrases should be bidi-isolated. The normal counter uses muted foreground, independently of field status: an invalid email-like reference or missing context does not make the length itself wrong. Only a length-related error colors that counter. The slot can present characters, words, bytes, or another application measure; it neither counts nor enforces a limit itself.

## Height and overflow

| Mode            | Expected result                                                                                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manual, default | Three initial rows. Native vertical resize only; minimum one visible line. Dragged height stays while typing. The surrounding layout follows the new height.                                             |
| Fixed           | Requested rows with `resize="none"`. Content stays scrollable; no resize grip.                                                                                                                           |
| Autosize        | Starts at `minRows` (three by default), grows and shrinks with content, and scrolls after `maxRows`. Without a maximum it grows with the page. No resize grip, even if manual resize was also requested. |
| Read-only       | Keeps the chosen height policy. Manual resize, scrolling, selection, and copying remain available.                                                                                                       |
| Disabled        | Editing, keyboard focus, and manual resize are unavailable. A content-sized field can retain its content-based height.                                                                                   |

Autosize and manual resize have one owner each; do not combine them. Neither growth nor shrinkage is animated. Layout should track the caret immediately, without a spring, delayed jump, or visual scroll reset. Avoid unbounded autosize inside a compact dialog. Short placeholders are particularly important because native content sizing can grow to fit placeholder text too.

The live prototype uses guarded native `field-sizing: content`, line-height-based limits, and a fixed minimum-row fallback with scrolling. The fallback has no drag grip. The library stage must preserve that usable progressive enhancement and resolve browser details. A browser without content sizing must never hide the entered text or imply that automatic growth is working.

Default wrapping retains explicit newlines and softly wraps long paragraphs, URLs, and uninterrupted tokens. The text viewport, not the entire field or page, scrolls. An explicit `wrap="off"` example keeps log lines intact and allows horizontal scrolling. In this mode the single status glyph moves to the feedback message below the field, and the internal status reserve is removed in every state. The field retains its status edge and focus hue. This keeps the native viewport uninterrupted: End, arrow navigation, selection, typing, and scrolling expose the complete line without a fixed decoration covering it. Supply meaningful feedback; the prototype falls back to a short status label when none is provided. The footer glyph is 1em, separated from the text by 6px and centered on its first line. It never duplicates a glyph inside the control. Keep log fields in an LTR island when their content needs it. Interface RTL mirrors text insets, the status reserve, and native scrollbar/resize placement where the browser supports it; it does not reverse the characters of a numeric counter.

## States and transitions

| State                             | Appearance and interaction                                                                                                                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rest                              | Default uses `--control-bg` and the quiet control border. Ghost is transparent with the same quiet baseline. Empty and filled geometry match.                                                                         |
| Hover                             | Neutral editable edges use `--control-border-hover`. Ghost changes only its baseline. No fill change, movement, or size change. Read-only and disabled do not advertise editing on hover.                             |
| Pointer focus                     | The neutral edge uses `--control-border-focus`; Ghost remains baseline-only. No outer contour in ordinary colors. Typing and caret navigation preserve that quiet focus origin.                                       |
| Keyboard focus                    | A full 2px contour at 2px offset, enclosing all four corners. Neutral uses the focus token; status retains its hue. Pixel stays square.                                                                               |
| Info / success / warning / danger | Status edge, one distinct glyph, and readable feedback. Ghost colors its baseline, not its whole resting surface. Danger marks invalid content. One glyph: inside wrapped fields; beside feedback for unwrapped logs. |
| Read-only                         | Full foreground contrast, text cursor, Tab focus, selection, scrolling, copying, and permitted manual resize. Status remains meaningful. Explain the reason nearby when it is not obvious.                            |
| Disabled                          | Muted plate and disabled foreground, without multiplying opacity. Ghost stays transparent. Status glyph, status edge, and resize grip are suppressed; the external explanation remains readable.                      |
| Focus + status + overflow         | The complete contour preserves status, the glyph remains separate from the scrolling content, and the native scrollbar and resize corner remain usable.                                                               |

State priority is disabled → status → neutral editing feedback. Read-only prevents editing but does not erase a valid status or keyboard focus. Forced colors use system foregrounds and a strong Highlight contour for either focus origin; availability is still visible. There are no component transitions to disable for reduced motion.

Apps choose validation timing. Ordinary typing starts neutral. A useful check, blur, or submit can produce a result; a subsequent correction clears a stale result. Do not turn every ordinary keystroke red. The live specimen includes a soft length budget, an explicit local check, retained over-limit input, and correction. Its response is a demonstration, not a network operation.

A soft budget preserves the entire draft, including a pasted over-limit value. It shows how much to remove and lets the user edit it. Native `maxLength` is a separate deliberate policy that blocks extra input. The specimen distinguishes a grapheme count from the browser's UTF-16 length measure; consumers must describe their own policy clearly. Exact-limit input is valid. A near-limit warning is a local example policy, not an automatic component feature.

## Expected accessible interaction

- Use a real textarea with an explicit visible label or accessible name. Required fields include the native required state; the asterisk is decorative.
- Enter inserts a newline. During composition it belongs to the IME. Escape never clears the draft and retains the enclosing page or overlay's meaning. Tab moves to the next control; Textarea does not trap it. Submission shortcuts belong to the application and must not interrupt composition.
- Clicking the native text region or its padding focuses the field. There is no status action or extra status tab stop. The fixed glyph is decorative because associated message text carries its meaning.
- Description, message, counter, and external description references form one reading chain. Error feedback states what to fix. Color alone is insufficient.
- Do not put an updating counter in an assertive or per-keystroke live region. Announce an actionable validation result at an appropriate boundary; the production form integration must choose and verify that timing without repetitive speech.
- Read-only participates in reading, focus, selection, and form submission. Disabled is out of Tab and form submission, including disabled fieldsets. The prototype suppresses disabled visuals through native CSS as well.
- The library must preserve controlled and uncontrolled authority, ref access to the native element, form association, reset/default restoration, and accessible focus preferences. Reset restores content and the corresponding content-driven height; application-owned messages and counters must be reset by their owner.

## Review route and prototype boundary

Sections cover roles and sizes, pinned hover/focus, all semantic feedback, availability combinations, height modes, footer anatomy, live changes, overflow/direction, and Base/Overlay plates. Pinned appearances never move DOM focus. Use the real controls to compare clicking, Tab, typing, selecting, resizing, scrolling, and copying.

Inspect all six presets and both surfaces. Check 360, 768, 1280, and 1440px; 120% text; RTL; the long invalid field with scroll and resize; and the two existing composition consumers. Evaluate the complete material, not just numeric border contrast. The package and portable workbench shell are unchanged.

Native input and CSS provide enough behavior to inspect this design. The prototype does not claim a complete production form engine, cross-browser autosize validation, final prop unions, assistive-technology announcements, or comprehensive reset/ref tests. Those belong to the library stage. The chosen visual states and expected user outcomes above must survive that implementation.

Design references: [Input](../input/README.md), [native scrollbars](../scrollbar/README.md), [MDN content sizing](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/field-sizing), and [GOV.UK character count](https://design-system.service.gov.uk/components/character-count/). These informed the separation between a visible length budget and a hard input limit; they do not prescribe this component's material or API.
