# Popover design reference

Status: design approved on 2026-11-15. Open `/?item=popover` in the playground. This is a design prototype, not a package export or a finalized TypeScript API. The [rich editor scene](../../scenes/05-rich-editor.scene.tsx) consumes the same surface independently.

## Purpose and boundaries

A non-modal surface next to its source for short context, immediate preferences, or a compact transaction. The page remains available. No scrim, page scroll lock, focus trap, arrow, or decorative material variant.

Use Menu for commands, Select for picking a field value, Tooltip for a short non-interactive label, HoverCard for a hover preview, and Modal/Drawer for long or blocking work. Content loading or a save error does not turn the surface into an Alert. Deep navigation and destructive confirmation are not Popover patterns.

## Anatomy and geometry

| Part    | Design                                                                                                                                                                                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surface | S / M / L width ceilings: 18 / 22 / 28rem. Shrinks to available width. Shared `surface-s` radius: 10px in Soft/Frost, 0px in Pixel.                                                                                             |
| Insets  | S: 12px padding / 8px section gap. M: 16px / 12px. L: 24px / 16px. Surface size is independent of control size.                                                                                                                 |
| Header  | Heading-s title, an optional body-s secondary description 4px below the title row. No eyebrow, oversized heading, or divider by default.                                                                                        |
| Close   | At the logical end of the title row. S control target on a fine pointer; 44px square on a coarse pointer. Title reserves the target width plus 8px, so long text never collides.                                                |
| Body    | Text, metadata, fields, or a compact group of settings. No additional card shell or competing elevation.                                                                                                                        |
| Footer  | Optional, content-owned actions at the logical end, 8px apart. Secondary Cancel precedes primary Save. An independent Unlink action stays at the logical start in the editor. Actions wrap in source order instead of clipping. |
| Scroll  | Header and footer stay outside the scrollable body. A subtle separator marks the footer only in the constrained example. Body focus rings have 4px of inner clearance.                                                          |

Visible titles are used throughout this reference; descriptions and footers are optional. A future accessible-name override must not silently remove space reserved for Close. The prototype layout slots are illustrative anatomy, not a requirement for the shipped compound API.

Use S controls for dense desktop chrome such as the rich editor and M for ordinary settings and forms. All controls in one action row use the same size. Larger text can increase height; fixed surface widths must not crop the title, field support text, or buttons. URLs keep LTR text direction inside an RTL layout.

## Material and interaction

Soft is opaque and quietly elevated. Frost uses the selected transparent fill, 20px blur with 125.4% saturation, soft shadow and a highlight that follows the top corners and fades; it has no continuous decorative outline. Pixel is opaque, square, with corner ticks and a hard offset shadow. These differences come from the shared theme recipes, without theme selectors in component CSS.

The panel appears and disappears immediately in all six presets. It does not slide, scale, bounce, or animate its height. This is an intentional compact-overlay choice, including reduced-motion mode. Embedded Button and Input retain their own material behavior; panel geometry never dictates their press motion.

Close has a quiet secondary glyph at rest, a neutral hover fill, a stronger neutral press fill and a 2px visible keyboard ring offset by 2px. It does not translate on press. Close remains available during loading, errors and saving. Disabled triggers do not open a panel; a read-only field remains selectable and copyable.

## Placement and limited space

- Default: bottom, centered. The live study starts at bottom/start to make edge alignment easy to inspect. Logical sides are top/bottom/start/end; alignment is start/center/end. Inline sides mirror in RTL; top/bottom remain physical.
- Keep an 8px gap to the anchor and at least 16px of viewport edge clearance, respecting safe-area insets in the implementation.
- Try the requested side. Flip to the opposite side when it has more usable room. Shift along the cross-axis to stay inside the available area. If neither inline side can fit the panel, prefer a vertical placement.
- Clamp width to the available viewport, then height to the chosen side. Scroll the body; keep the title, Close and actions reachable. Reposition on viewport/keyboard resize and scroll. Close when the source leaves the visible viewport instead of leaving an orphaned panel.
- At extreme heights where fixed header/footer cannot fit, allow the whole panel to scroll as a final escape. Never clip interactive content or invent a modal mode. The keyboard may require scrolling the focused field into view.

The live framed area deliberately acts as a small available viewport even with a single artboard. It demonstrates flip/shift and a native top layer. The Overflow case pins a 360px height limit for repeatable body-scroll inspection. It is not a claim of complete mobile keyboard, safe-area, zoom or production positioning coverage.

The body uses the shared [native scrollbar recipe](../../../../../docs/components/scrollbar.md), with a transparent track and compact width. The outer panel does not scroll in the normal layout. Its decorative layers do not extend the scrollable bounds; the browser's default `overflow: auto` on `[popover]` is explicitly reset.

## Expected focus and dismissal

| Action                            | Expected result                                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Keyboard, mouse or pen activation | Open and focus the first meaningful control, skipping Close. If there is no meaningful control, focus the panel. |
| Touch or programmatic opening     | Focus the panel without opening the software keyboard. Tapping a field then edits it normally.                   |
| Close, Cancel or Escape           | Close and return focus to the invoking source. In a nested chain, Escape closes only the top child.              |
| Outside press                     | Close and let the pressed target receive focus/action. Do not pull focus back from that target.                  |
| Tab beyond the last control       | Continue to the next element outside and close. No focus trap.                                                   |
| Shift+Tab back to the trigger     | Leave the panel open; the source is still part of this interaction.                                              |
| Trigger activated again           | Toggle closed, preserving the content's transaction policy.                                                      |
| Trigger removed                   | Close and use a meaningful surviving focus target; never restore focus to a detached element.                    |

The panel is a named non-modal dialog. A visible Close is always present in the selected patterns. A short description can label context, but a whole interactive body must not become a single `aria-describedby` announcement. Async feedback uses a local status/alert; pending never disables the entire panel or its exit.

A child Select/Menu remains part of its parent's interaction: interacting with it must not dismiss the parent; Escape closes the child first and restores its source. Keep the parent's material intact without adding a second panel shadow around the nested field. The [invite scene](../../scenes/07-invite-access-modal.scene.tsx) illustrates a picker above a modal. Full nested top-layer and modal integration is a library-stage obligation.

## Content state policies

| Case               | Appearance and result                                                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Short information  | Stable title, optional description, compact metadata. No mandatory footer.                                                                                 |
| Immediate settings | Changes persist as controls change; close does not undo them. No redundant Save action. The live name preview makes this explicit.                         |
| Transactional form | Opening starts from last saved values. Editing does not change the saved result. Cancel, Close, Escape and outside dismissal discard unsubmitted edits.    |
| Validation         | Mark the relevant field, put the message directly below it and focus the first invalid field. Keep the panel open. No full-surface error border.           |
| Saving             | Preserve fields and entered text, make them read-only, and show loading on the submit action. Keep cancellation/Close available. Prevent duplicate submit. |
| Save failure       | Keep draft values. Show a compact error above actions with a clear retry. Do not replace the form with a failure screen.                                   |
| Save success       | Commit both fields, close, return focus and show the result next to the source. No extra success panel or timed success splash.                            |
| Content loading    | Preserve title and Close; reserve a useful body height and show a quiet loading label. No indefinite animated placeholder wall.                            |
| Empty content      | A specific explanation in the body, not a blank panel or disabled surface.                                                                                 |
| Load failure       | Explanation plus retry in the same body. Surface material remains neutral.                                                                                 |

The form's 900ms save and failure switch are local simulations. Dismissing a pending save cancels this local attempt and preserves the last committed values. Real consumers must resolve request cancellation/races without announcing a save that did not happen. Retrying loaded content directly selects the ready preview; it is not a network implementation.

## What is live and what is pinned

- **Sizes, Interaction, Form, Content, Overflow:** panels start open in document flow for simultaneous six-theme comparison. Close/reopen, field editing, local save/cancel/retry and body scrolling work. They do not implement outside dismissal or complete keyboard focus transfer. Selectors explicitly pin validation, pending and fetched-content states.
- **Anchoring & focus:** native `popover="auto"`, one active panel, Escape/outside dismissal, source toggle, input-specific initial focus and bounded placement. The page remains interactive. The framing is a design harness, not reusable library architecture.
- **Folio rich editor:** contextual design preview with shared anatomy and local Apply/Cancel/Unlink, Close/Escape and source focus return. It starts open and uses scene placement, not native top-layer positioning. At narrow scene widths it is kept in flow for inspection.
- **Future library work:** exact API/state authority, fully composed events/refs, nested chains, native forms/reset, robust viewport positioning, IME, assistive technology and cross-browser contract validation. These are mechanisms to preserve the outcomes above, not an invitation to redesign them.

For review, compare all six presets, then inspect Form errors, Overflow at 360px/120%/RTL, Anchoring at each edge, and the editor at 1280–1440px. Evaluate actual material/readability together; a decorative resting border is not automatically the only cue identifying a control.
