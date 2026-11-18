# Toast design reference

Status: visual candidate for review. This playground prototype defines the intended experience; it is not a library component or the final TypeScript API.

## Purpose and boundaries

Toast reports an operation without taking the user away from their work: a copied link, a saved document, an archived item with Undo, a background export, or a recoverable failure. The underlying result, draft, or file remains available in the application. A transient toast is never the only record of essential information.

Use Alert for persistent feedback within a section, field feedback for an invalid input, Modal for a blocking decision, and Progress for a measured process. Notification history, rich messages, avatars, arbitrary action groups, and an inbox are outside this family. There is one notification size and no decorative material variants. Swipe dismissal, hover expansion, sounds, countdown bars, and custom notification hotkeys are intentionally absent.

The reusable visual parts are `ToastCard`, `ToastPlate`, `ToastViewport`, and `ToastDock`. The future provider owns messages and remaining time above portals. These part names describe anatomy, not a commitment to a public compound API.

## Anatomy and geometry

The default card is 384 px wide or the available container width, with a 1 px theme border, 12 px padding, `surface-m` radius, a 20 px leading glyph, and 8 px column gaps. Its brief, single-line form is 56 px tall at 100% text with a fine pointer; height grows with content. A semibold `body-m` title establishes the message, followed by optional regular `body-s` detail with a 4 px gap. Pixel uses the theme's calibrated type sizes and mono face; geometry does not force identical text wrapping across materials.

The title is required. Describe the outcome in the title and useful context or recovery in the detail; do not repeat the same sentence. Do not use a timestamp, decorative heading, or redundant status label. Text wraps fully, including long identifiers, without a line clamp, ellipsis, or tooltip dependency. Isolate bidirectional values with `bdi`. Toast is for concise messages; longer reports belong at a reachable destination.

A brief title and short action share a row when their natural widths fit. A description, a title/action combination that would wrap, or an explicit below layout puts the action below the text, aligned with the text's starting edge. The copy keeps its full measure beside the close control. The action never narrows the text to a few characters. Long action labels wrap on their own row. This is an adaptive structural layout, not another material variant.

Use a single neutral ghost Button in size S for recovery or inspection. Its label names the operation (`Undo`, `Retry upload`, `View file`); an error does not turn a recovery action into a destructive red button. A separate neutral ghost IconButton closes the notification. Controls use the shared Button material, including the theme's own timing and pressed behavior. No interaction translates or scales the entire card.

The default dock is 24 px from the logical inline edge and block edge, with a 384 px maximum width and 24 px minimum edge clearance. At a narrow viewport it uses the remaining width. Production placement also respects safe-area insets and the visual viewport/keyboard; it must not cover an active text field. `bottom-end` is the default; `bottom-start`, `bottom-center`, `top-start`, `top-center`, and `top-end` are supported. Start/end mirror in RTL. Positions describe the viewport, not the pointer or triggering control.

## Status, material, and motion

| Meaning           | Leading glyph                      | Lifetime by default                                |
| ----------------- | ---------------------------------- | -------------------------------------------------- |
| `neutral`         | Bell, neutral signal               | 6 s for a secondary confirmation without an action |
| `info`            | Information circle                 | 6 s for a secondary confirmation without an action |
| `success`         | Check circle                       | 6 s for a secondary confirmation without an action |
| `warning`         | Warning triangle                   | Persistent                                         |
| `danger`          | Cross circle                       | Persistent                                         |
| Loading operation | Shared Spinner, neutral foreground | Persistent                                         |

Status is expressed by glyph shape and hue, never a fully tinted card. Copy and controls remain neutral. Loading replaces the glyph and names the operation; it does not imply a percentage. Dismissing a loading toast hides the notification and does not cancel work. If the operation supports cancellation, expose an explicit `Cancel` action.

Soft uses the opaque matte overlay recipe, restrained rim, and soft floating shadow. Frost uses the shared overlay glass, blur, rim, and shadow; it must stay readable on ordinary canvas content and a dimmed modal scrim. Pixel uses an opaque plate, crisp border, zero-radius corners, corner registration marks, and an orthogonal shadow. Compact backing plates have the same material with no independent cast shadow; the front card carries the stack's elevation. Every card in the expanded queue uses its own overlay material and cast shadow. The compact action group uses the toast edge and rim at the small surface radius. It paints the overlay color over an opaque raised surface so page content cannot show through the labels, including in Frost. The group has no cast shadow. The two controls use the shared size S neutral Ghost Button and IconButton states. A decorative vertical Divider sits between them at 16 px high.

Cards appear, disappear, expand, and pack immediately in every material. Arrival and collapse have no slide or resize transition. Status updates happen in place without replaying an entrance. Shared button feedback and Spinner motion follow their existing theme recipes. Reduced motion removes transitions and Spinner motion while leaving a visible waiting state and explicit text. Forced colors retains borders, meaningful glyph shapes, text, button states, and focus using system colors; glass, motifs, and shadows disappear.

## Control states and operation changes

| State               | Intended outcome                                                                                                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rest                | Message is primary; action and visible × are discoverable without colored plates.                                                                                                                    |
| Hover / press       | The targeted button uses its shared hover and press states. The card remains passive.                                                                                                                |
| Keyboard focus      | Shared focus contour on action or ×; the scroll group also has a 2 px inset contour. The persistent chevron keeps keyboard focus when toggled. Focus remains visible over glass and alongside press. |
| Action unavailable  | Keep the message readable; disable only the action and explain the reason in the detail. × remains available.                                                                                        |
| Action pending      | Preserve label, button width, and keyboard ownership, show the shared waiting glyph, and suppress duplicate activation. × can still hide the notification.                                           |
| Rejected recovery   | Keep the same card and position, restore the action, and update the explanation. Do not add a second error toast for the same operation.                                                             |
| Successful recovery | Update the same card to the resulting status or dismiss it if the underlying UI already makes the result clear.                                                                                      |
| Operation completed | Replace Spinner with the resulting status glyph, update title/detail/action in place, and apply the resulting lifetime policy.                                                                       |

A pending recovery and a background operation are distinct: a Spinner in the leading slot reports work; a Spinner in the action reports that particular command. Do not show both for the same work. An unavailable retry is appropriate only while its reason remains useful to read; otherwise omit the action. There is no disabled, read-only, selected, or invalid state for an entire notification.

## Compact queue and reading mode

An empty queue paints nothing. A single notification shows a complete card with no dock, count, or backing plate. With two or more messages, show the newest complete card and at most two empty backing plates. Each plate is inset by 8 px per depth and steps 6 px toward the far edge. Plates never contain clipped text, hidden actions, or separately exposed accessibility nodes.

The front card is a passive, selectable message. Its quiet footer reports the full count and hidden warnings/errors (`4 notifications · 1 needs attention`), so a newer success does not silently conceal an unresolved problem. It is not a second expansion target. The single expansion control is the persistent chevron in the utility row, independent of the card's action and ×. Hover never expands the list.

Pointer or keyboard interaction holds the current front card: a new arrival updates the count but does not replace the action under the user. When the user leaves the region, the newest card may become the front card. Closing the front card intentionally reveals the next available item. Do not synthesize an empty placeholder.

The action group stays nearest the chosen viewport edge, 10 px from the nearest full card when collapsed and 14 px at the newest edge when expanded. Align the group's outer right edge to the cards' physical right edge, including in RTL. Fit the group to its contents, with 4 px internal padding inside the border and 4 px beside the Divider. Dismiss all sits to the left of the persistent chevron. The empty area beside the group passes pointer input to the page. Both controls keep their size and coordinates when toggled. The chevron points into the queue to expand and toward the group to collapse. Its accessible name includes the operation and full count, and `aria-expanded` changes on that same mounted button. The text label can wrap if it needs room while the icon remains square. Top placements put the controls first and grow downward. Bottom placements put the controls last and grow upward. The newest card stays closest to the controls when switching between top and bottom placements.

The expanded queue always uses individual cards with 12 px gaps. The normal reading limit is 420 px of card space, bounded further by the available viewport. The scrollport provides 12 px of inline breathing room, 20 px at the far edge, and 10 px at the dock edge for the backing layers and shadows. The scrollport ends 4 px before the dock. A thin native scrollbar appears when the cards overflow. The action group stays separate and fixed at the newest end.

A card that reaches either scroll edge stays put. The next card keeps moving and slides over it at full size. The parked face remains opaque until the incoming card has covered it. The parked face is clipped along the incoming card's edge. Its surface shows through the rounded corners during the overlap. Once covered, its content is hidden and only a backing layer remains. Each edge shows up to four cards in depth, including the readable front. The backing layers step out by 3 px each. Earlier notifications stay in the queue and come back into view as the user reverses the scroll.

Native sticky positioning holds the card. CSS view timelines on the normal-flow slots coordinate paint order, coverage, and backing layers. Card heights are measured when the layout changes. Wheel, touch, scrollbar, and keyboard all use the native scrollport. A card taller than the reading area scrolls at full size and fades its smallest visible fragments. Without view timelines and timeline scopes, in reduced motion or forced colors, or when the scrollport is too short for stacking, the cards scroll in their regular shape. Tab brings a card fully into view if it fits, and otherwise reveals the focused control.

New notifications join the open queue immediately at the newest edge, nearest the action group. A reader already at that edge follows the new message automatically. Preserve the reading position when the reader is away from that edge or has focus on a row control. This includes compensation when rows are inserted before them in a top placement. Ordinary scrolling reaches the new row. Arrival keeps the current keyboard focus, and font loading or wrapping keeps the newest edge in view while the reader is following it. Tab brings a focused control and its outline clear of the scroll edge without moving the outer page.

## Lifetime and announcements

Our chosen default is 6 seconds of available reading time for secondary `neutral`, `info`, or `success` messages without an action. Any action, warning, error, loading operation, or explicit persistent duration disables automatic dismissal. Essential information/functions must remain reachable elsewhere without a timer. These are product decisions informed by accessibility guidance, not a claim that WCAG mandates exactly six seconds.

Pause reasons compose independently: pointer in the region, keyboard focus in the region, inactive/hidden document, unavailable portal host, a hidden compact message, or a message outside the readable scroll area. Removing one reason does not clear the others. Resume the remaining time rather than restarting the full duration. Queue and remaining time survive portal-host changes. No visible countdown is part of Toast; the specimen's time readout is an inspection control.

Severity and announcement urgency are separate. Default announcements are polite (`role="status"`); only a genuinely important, time-sensitive message uses assertive `role="alert"`. A warning about skipped files is not automatically an interruption. Announce new messages and meaningful operation updates once, using dedicated channels independent of the visual card. Do not make the entire region live, include interactive controls in a live announcement, re-announce on expansion, or replay announcements when moving into a dialog. Avoid announcing every Spinner frame or timer tick. Repeated events for one operation update its existing identity rather than flood the queue.

## Focus, touch, and top layer

Arrival, update, automatic expiry, and host movement never steal focus. Tab follows real visible controls; Shift+Tab reverses it. Enter/Space activates buttons. Escape belongs to the active dialog or popover and never dismisses or collapses Toast. There is no roving focus model or custom navigation shortcut.

Expansion and collapse keep focus on the same persistent chevron. In a bottom placement, Shift+Tab reaches the preceding message controls; in a top placement, Tab reaches the following messages. The scroll group remains directly keyboard-focusable. Activating the toggle does not scroll the outer page or move the pointer target. Dismissing a focused card moves to the equivalent control in the next visible card, then previous, then stable dock control. Closing the final focused notification or Dismiss all returns focus to the remembered external origin/fallback without reopening a modal. If the user has already left the region, an asynchronous result must not pull focus back. The local preview uses a bounded focus approximation; the full provider must preserve exact ownership and destinations.

Coarse-pointer action, close, and dock targets are at least 44 px tall; × is at least 44 × 44 px. Targets occupy their own layout space and never overlap text or another control. Content may increase card height. Message text remains selectable in both compact and reading modes, and ordinary page clicks leave notifications intact.

The production host uses `popover="manual"`, portaled into the topmost active Unica dialog, or the body when none is open. An overlay painted above a scrim but outside the modal's DOM subtree is inert and does not satisfy the design. The native-modal specimen uses a real dialog and a manual popover inside it, preserving queue state above the portal. Opening/closing the dialog does not discard notifications; close, action, and the persistent toggle remain usable. Touch and keyboard scrolling must not trap the page outside the active modal's normal rules.

## Live reference and implementation handoff

| Section     | Inspect                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------- |
| `roles`     | Five statuses, loading, neutral material in all six presets; pinned cards.                        |
| `anatomy`   | Single line, adaptive action, detailed recovery, brief confirmation without ×; live Undo.         |
| `states`    | Pinned control feedback, focus + press, unavailable action, pending recovery.                     |
| `stack`     | Shared action group, persistent right-hand toggle, empty/single/group transitions, six positions. |
| `reading`   | Stacks at both scroll edges, four-card depth, automatic arrivals, and collapse.                   |
| `operation` | Controlled loading/success/failure/retry; Resolve/Reject are preview controls.                    |
| `overflow`  | Long titles, identifiers, mixed direction, long actions, narrow/text-scale stress.                |
| `lifetime`  | Live six-second confirmation, persistent Undo, additive pointer/focus/window/manual pauses.       |
| `modal`     | Scrim appearance and actual dialog/manual-popover interaction, preserved queue.                   |

Static matrix and state cards deliberately do not dismiss or run requests. Scene notifications pin lifetime for visual inspection. Existing Folio consumers import this same card; Overview uses a dedicated View action instead of a link hidden in the detail, and Workspace Admin composes the shared viewport and reserves its measured height below the import workflow, including reading mode, so notifications do not cover the primary footer action. These remain visual compositions, not a claim of a working backend or a production notification service.

Library implementation must define the exact React 19 API and provider authority, localization, identity/deduplication, full timer visibility accounting, live-channel scheduling, maximum queue resource policy, safe-area/visual-viewport geometry, robust focus preservation across portals, and the complete modal-host registry. Preserve the decisions above; the temporary props, DOM helpers, preview controls, and focus approximation are disposable.

References: [W3C timing guidance](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html), [W3C status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html), [React Aria Toast](https://react-aria.adobe.com/Toast), [Spectrum Toast](https://react-spectrum.adobe.com/Toast), and [Base UI Toast](https://base-ui.com/react/components/toast).
