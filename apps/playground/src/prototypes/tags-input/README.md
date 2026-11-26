# TagsInput — design reference

Status: approved Wave 1 design reference. Open `/?item=tags-input`. This reusable playground prototype uses the packaged Tag. The Invite & Access scene uses the same field.

## Purpose and boundaries

TagsInput edits an ordered set of free-form strings: subjects, topic labels, domain allowlists, or email recipients. It combines accepted Tag tokens and a persistent draft editor in one field. Spaces and commas remain part of a value, so `Paris, Texas` is one tag. Newlines separate batches.

Use Select or Combobox for a catalog, suggestions, or rich entities. Use TagGroup for removal without an editor, and Badge for passive metadata. This family has no inline renaming of accepted tags, per-tag semantic colors, avatars, suggestions, clear-all action, asynchronous item validation, or built-in email parsing. Applications supply any synchronous validation and explain their rules. Accepted values remain neutral when the draft is rejected.

## Anatomy and geometry

`accepted Tag(s) → [persistent textarea + Add] → supporting text / capacity`.

The editor and Add form one flexible tail. They wrap together after the tags. Add remains mounted throughout editing and keeps a stable action slot. It stays quiet rather than competing with a form's primary action. A multiline draft opens across the field with a narrow, permanent action space at its inline end. Add sits beside the last visible line, before the native scrollbar; the text viewport reaches the bottom of the field. The accepted collection grows naturally; it never hides tags behind a counter or a horizontal scrollbar.

| Metric                                 | S                   | M (default)        | L                  |
| -------------------------------------- | ------------------- | ------------------ | ------------------ |
| Minimum field height                   | 30px                | 40px               | 48px               |
| Minimum Tag paint / fine target height | 22 / 24px           | 26 / 26px          | 30 / 30px          |
| Padding, block / inline                | 2 / 4px             | 5 / 8px            | 6 / 8px            |
| Flow gap                               | 4px                 | 6px                | 6px                |
| Editor/action row minimum              | 24px                | 28px               | 34px               |
| Editor type                            | size-s-control-font | body-s             | body-m             |
| Editor line box                        | body-s line height  | body-s line height | body-m line height |
| Editor inline inset                    | 4px                 | 6px                | 10px               |
| Add type                               | editor type         | editor type        | editor type        |

All dimensions are minima. Text scaling, multiline input, wrapping, and touch targets can grow the field. A populated single row at 100% text shares Input's 30/40/48px rhythm. The outer radius uses the matching control token. Tag keeps its approved minimum sizing, palette, content spacing, and independent target geometry. Long labels wrap in place, and their paint grows around the complete text. The removal target stays beside the first line. The field owns its tokens' painted corners: the inset-radius rule resolves to `--radius-xs` (4px in Soft/Frost, 0px in Pixel) for all three current sizes. The removal plate follows the same rule and reaches the same micro-radius floor. Its local focus ring stays inside that plate and does not collide with the field edge. This geometry also applies in Ghost, on Overlay, during wrapping, and with larger touch targets. A token keeps its corner radius when it moves to another row or gains a text line.

The tail has a useful basis of about 12ch plus action and editor inset clearance, capped by its container. In the compact tail, the textarea fills the remaining width and Add's width stays intrinsic, with a minimum of 36px and 8px padding on each inline side of its label. Add shares the editor's type size and line box, with semibold text. The common editor/action row is the larger of the size minimum and the editor line box plus the action's 2px border; this keeps the action and draft aligned even when a short expanded draft shrinks to one line at 120% text. Its hover, press, and focus plate uses the same 4px/0px corners as the field tokens. On coarse pointers, Add and the draft have at least 44px height, Add has at least 44px width, and Tag reserves its established 44px targets without overlap. Do not force compact 30px rows on touch. Narrow fields may move the whole tail below the tags.

The first explicit newline or soft wrap opens the expanded draft with its reserved action space. This expanded layout remains until the draft is successfully accepted or completely cleared; shortening a nonempty draft, blur, hover, or focus does not fold it back into the tail. This prevents width-dependent layout oscillation. A soft wrap remains part of one value; only actual newlines separate a batch.

The draft grows to four visible line boxes, then scrolls vertically. Its real textarea uses the shared native scrollbar recipe: a 10px gutter and 4px visible thumb on desktop, `thin` standard fallback, theme-owned corners and colors, and system rendering in forced colors. The scrollbar follows the textarea's inline edge. With a real native gutter, the expanded textarea extends into the field's inline-end padding so the track ends 4px inside the field border in every size. The shared compact recipe adds its existing 3px transparent thumb border, giving a 7px gap from the visible thumb to the inner field edge on desktop. Matching extra textarea padding preserves the text width and the position of Add; the action is anchored to the original content row. There is no outset or extra allowance when the native gutter is absent. The scrollbar's paint, width, states, and platform fallbacks come unchanged from the shared recipe, independently of the button's padding. Add is anchored beside the last visible line and does not scroll with the text. The text reserves the action's width plus a flow gap on every line, so no line can pass under the button; there is no full-width row below the viewport. The reserved strip has no separate fill, divider, or shadow. Native gutter space appears only when scrolling is needed. In expanded layout, Add keeps its intrinsic width with a 44px minimum. The text reserves that actual width plus a flow gap, rather than estimating its label width. Add is flush with the tail's inline end when there is no scrollbar, just as in the compact tail. A real native scrollbar moves the action inward by exactly its measured gutter; there is no permanent scrollbar allowance or extra editor inset beside the button. The text naturally has less width while that scrollbar is present. Shrinking below the scroll threshold removes the gutter and restores the action to the edge. This normal reflow occurs only when content or available space changes; hover, press, and focus never move the action. The complete action remains inside the common row and aligns with the last text line. Only fields that render Add reserve its action space; read-only and disabled fields use the complete text width. On coarse pointers, a 44px editor row supplies matching vertical padding, keeping the last line aligned with Add's center. The preview remeasures the intrinsic action after font or text-scale changes as well as after field-width changes. It also remeasures the real gutter when the outer row changes width, even when the text's usable width stays the same, so a disappearing native scrollbar cannot leave an old action inset.

The native textarea, initially `rows={1}`, remains mounted during editing, layout transitions, adding, rejection, and mode changes. The preview measures its content height and also responds to inherited typography changes and font loading. Returning to a narrower typeface removes any unused text rows, keeping Add beside the actual last line. Production may use any robust auto-height mechanism that preserves this result on supported browsers.

Standalone Tag retains its capsule. The `shape` case compares the same live values outside and inside the field in S/M/L. The editor supplies `data-unica-tag-layout="field"` and its inset radius through `--tag-field-radius`. The rounded field shell remains 6/8/10px in Soft/Frost. Its tokens have smaller corner radii.

## Roles, materials, and states

Default has the shared field background and edge. Ghost inherits Input's transparent field and straight baseline, including status and focus treatment. Ghost is recognizable at rest rather than revealing an entirely new rectangle on first interaction. Neither role has material variants.

Soft uses the matte field recipe and borderless Tag paint. Frost uses its contextual Base/Overlay field recipe with crisp, matte tokens; the surrounding overlay owns glass blur. Pixel uses square outer and inner corners, monospaced type, and precise outlines. Integrated Add has no physical press travel in any theme. Nothing translates, scales, or shifts on hover or press.

| State                             | Appearance and result                                                                                                                                                                                    |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty rest                        | Placeholder and muted, unavailable Add. Stable action slot.                                                                                                                                              |
| Populated rest                    | Neutral accepted tokens; a visible draft editor and quiet Add.                                                                                                                                           |
| Field hover                       | Stronger existing neutral edge/baseline. No whole-field fill flash.                                                                                                                                      |
| Pointer editing                   | Stronger edge/baseline, without an outer keyboard contour. Typing after a click keeps this treatment.                                                                                                    |
| Editor keyboard focus             | One 2px outer contour at 2px offset. Status preserves its focus hue.                                                                                                                                     |
| Tag navigation                    | Local 2px contour inside the active removal plate. No simultaneous outer ring.                                                                                                                           |
| Add hover / press                 | Local accent tint; press adds an edge. No geometry changes.                                                                                                                                              |
| Add keyboard focus                | Local inset 2px contour. Editor remains visible beside it; every line keeps clear of its target.                                                                                                         |
| Info / success / warning / danger | Colored edge/baseline and one distinct glyph beside readable supporting feedback. No duplicate glyph inside the flow of tags.                                                                            |
| Rejected draft                    | Danger edge and specific reason. Keep the complete draft and all previously accepted tags.                                                                                                               |
| Capacity reached                  | Quiet `n / max` and “Remove a tag to add another.” No danger status merely for filling the field. Add becomes unavailable; editing/copying the draft and removing a tag remain possible.                 |
| Read-only                         | Complete values projected one per line in the same selectable textarea. No tokens, removal, or Add. A retained draft appears separately as “Unadded draft” and returns when editing resumes.             |
| Disabled                          | Muted shell and draft, unavailable removal, no Add, status, or error treatment. Accepted strings and external explanations remain readable; no global opacity. Complete-value reading remains available. |

Disabled wins over validation and hover. Read-only suppresses mutation and draft-error presentation; application status may still describe accepted values. A rejected batch keeps its error until the next draft edit or removal; editing clears stale feedback and a later explicit attempt validates again. Capacity does not silently discard a draft. Removing a value immediately frees room and can enable Add without retyping. The complete `n / max` capacity counter is isolated in LTR order in both interface directions.

Forced colors retain system edges, a Ghost baseline, Highlight focus, and GrayText unavailable actions. Status glyph shapes and text carry meaning without color. Reduced motion removes local transitions; focus and value changes are immediate and do not depend on animation.

## Acceptance, rejection, and keyboard outcomes

**Only explicit acceptance adds values:** Enter outside IME composition, Add, or a successful multiline paste. Leaving the field preserves the draft. Moving to a form action or closing its containing surface must not silently accept it.

The local acceptance pipeline trims each line, ignores empty lines, rejects exact case-sensitive duplicates against both accepted values and the current batch, applies synchronous application validation, and checks capacity. It accepts the entire batch in line order or accepts nothing. Domain/email case policy belongs to application normalization in the library contract; this prototype does not apply it implicitly.

| Input/action                 | Result                                                                                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Space or comma               | Ordinary text. `Paris, Texas` stays one tag.                                                                                                                                |
| Enter                        | Attempt the whole draft; prevent native form submission. Empty/whitespace draft does nothing.                                                                               |
| Shift+Enter                  | Insert a newline to repair or author a batch.                                                                                                                               |
| Add                          | Attempt the same pipeline; return to the editor after activation.                                                                                                           |
| IME Enter                    | Continue composition; never accept prematurely.                                                                                                                             |
| Single-line paste            | Native text insertion at selection/caret. It remains a draft.                                                                                                               |
| Multiline LF/CRLF paste      | Combine the clipboard with draft text at its selection and attempt the resulting batch. Any failure retains that entire text, including line breaks.                        |
| Rejection                    | “Nothing added. Line N: …” or an explicit capacity reason. Previously valid pasted lines remain visible beside the rejected line; no partial success.                       |
| Successful acceptance        | Append every candidate, clear the draft/error, keep the editor in place, announce the result politely.                                                                      |
| Blur                         | Preserve the draft with no validation or implicit acceptance.                                                                                                               |
| Form submission with a draft | Block submission and direct the user to the visible editor: “Add or clear the draft before continuing.” Never serialize only accepted tags while silently losing the draft. |

Tab visits the editor, then enabled Add. Tag removal buttons are outside the ordinary Tab sequence. At a collapsed caret in position zero, the backward arrow enters the last removal action; backward means Left in LTR and Right in RTL. An empty draft's first Backspace also enters that action without removing anything. A second Backspace/Delete removes it. Held-key repeats, including native Enter activation, must never delete a chain of values.

Inside tag navigation, Left/Right follow reading order across wrapping rows, mirrored for RTL. Home/End select first/last. No cycling; forward from the end returns to the editor. Escape returns to the editor without clearing the draft. Tab continues from the editor's ordinary position; Shift+Tab goes to the preceding external control. Up/Down and native editor selection, clipboard, and modifier shortcuts keep their native meaning.

After keyboard removal, focus goes to the next tag, otherwise the previous tag, otherwise the editor. Pointer removal returns to the editor. A label click never removes a tag. Enter/Space on an already focused removal button activates its explicitly named remove action. The field label names the persistent editor, help/feedback describe it, and accepted/removal outcomes use polite announcements. Exact reusable focus ownership, mobile keyboard behavior, and full assistive technology contracts must be verified during library implementation.

## Complete values, direction, and reading

Accepted values are complete, selectable text inside their tokens. Short labels retain one line. A long value uses the available width and wraps; `overflow-wrap: anywhere` also handles unbroken addresses and identifiers, while `pre-wrap` preserves internal spaces. The token's paint grows around all lines; its separate × stays beside the first line, with the same minimum target and no text overlap. There is no arbitrary per-tag width or line cap beyond the container.

Hover, focus, and a label tap do not insert content, reveal a duplicate value, or change the field's height. There is no ellipsis, hover readout, tooltip, or “Show full values” disclosure in TagsInput. Complete values remain readable and selectable on touch and when removal is disabled. Very long accepted content can make the field tall; applications can apply an appropriate length rule through validation instead of silently hiding text. Read-only projects complete values in the existing textarea and keeps any unadded draft separately labeled.

RTL mirrors the field/action layout and keyboard route. Each accepted string is isolated with `bdi`, so a Latin address or mixed-script label retains its own content order. The draft remains a native textarea; users can select and copy its entire content. Labels, supporting text, and accepted values wrap at narrow widths and increased text size.

## Inspection and implementation boundary

States opens with the generated roles-by-size slice. **Populated and empty fields** compares both roles at each size and retains the empty-field instructions. The other studies cover standalone and inset token geometry, anatomy, focus and pointer states, feedback, batch repair, availability, long values, bounded drafts, material contexts, and draft protection. The toolbar loads recipient batches and switches the Subjects example between editing and reading. Pinned examples identify the states being compared.

In **Filter notes by topic**, only committed tags change the matching notes. **Preview a recipient list** submits a repeated `recipient` field for each accepted address. The containing form owns these carriers. A pending draft keeps focus in the editor on attempted submission. The submission study uses the same pattern with the repeated field name `topic`.

The prototype does not implement final controlled/uncontrolled authority, application normalization, localization, hidden repeated form carriers, required-by-accepted-values semantics, reset/default synchronization, disabled fieldsets, external collection focus ownership, SSR/hydration, or complete browser/assistive technology certification. These are library engineering obligations. They must preserve the visual and interaction decisions above, including draft protection, atomic rejection, readable full values, and selection in read-only mode. The shipped contract belongs in `docs/components/tags-input.md`; implementation removes the temporary prototype and component CSS and switches every consumer to `@docouno/unica`.

Comparison references: [Mantine TagsInput](https://mantine.dev/core/tags-input/) and [Chakra Tags Input](https://chakra-ui.com/docs/components/tags-input). Their option sets are useful references, not this family's contract.

The mixed-script study includes local font subsets for its Arabic, Hebrew, and Japanese example words so their complete labels remain readable in offline captures.
