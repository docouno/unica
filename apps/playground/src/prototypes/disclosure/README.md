# Accordion and Collapsible design reference

Draft for visual approval. Open `/?item=accordion` and `/?item=collapsible` in the playground. The shared prototype establishes the intended experience for the library implementation.

## Use and anatomy

- **Collapsible** reveals one secondary area in place. The standard full-width row pairs a leading chevron with a label. Their proximity works for a short label in an inspector or on a wider canvas. A consumer may delegate to a native button or Unica Button when a standalone action fits the surrounding layout. Keep its original visual role and accessible name. The delegated trigger gets disclosure semantics and supplies its own icon, if any.
- **Accordion** groups peer sections that readers can find by heading. Each item has a real heading at the level chosen by its parent and a full-width disclosure button within that heading. In a group of disclosure-only headers, the chevron sits at the logical end of the button. A group with a sibling action puts every chevron at the logical start beside its title. Optional section dividers are on by default. They appear between visible items only, including after the full open panel. Reserve 4px of clear space on either side of each divider. The line remains visible during hover, press, focus, and motion. A host Card can bound the group.
- Use a sibling action when the action makes sense with the section closed. A control that enables or disables the settings belongs with those settings so availability and disclosure follow one clear model.
- Place the command at the logical end with an 8px gap and its own hit area and focus. Align it to the first title line when the label wraps. A row without a command uses the full width. Keep commands short enough to leave room for the title. An action that needs more space belongs in the content or elsewhere in the host.
- The open body is in normal flow and inherits the host surface. Use it for text, settings, lists, and tables. Nested disclosure is useful when a genuine secondary detail exists inside a panel. Essential instructions, validation summaries, and primary actions should be visible at the point of use.

Use the standard row's label as the button name and keep it stable across opening and closing. For an additional button near the end of a long panel, a visible action name such as “Close details” is appropriate. State is carried by the chevron, visible panel, and `aria-expanded`. The disclosure adds no “Expanded” or “Collapsed” label or selection marker.

The header-action studies show three application interactions.

| Study           | Heading                                                    | Adjacent action                                                                                                            |
| --------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Release preview | Shows the preview address and expiry.                      | Copy link writes the address to the clipboard and gives inline feedback.                                                   |
| Changed files   | Shows the file diff, including after the file is reviewed. | Reviewed records progress and folds the reviewed file. Unchecking updates progress and keeps the current disclosure state. |
| Query library   | Shows the query criteria.                                  | The star toggles favorites and retains each query's disclosure state.                                                      |

## Geometry

| Size        | Minimum row | Label/body | Icon and gap  | Minimum row padding block × inline | Body padding start / end / bottom                             |
| ----------- | ----------- | ---------- | ------------- | ---------------------------------- | ------------------------------------------------------------- |
| S           | 30px        | `body-xs`  | 14px and 6px  | 5px × 8px                          | Collapsible 28px / 8px / 8px · Accordion 8px / 8px / 8px      |
| M (default) | 40px        | `body-s`   | 16px and 8px  | 8px × 12px                         | Collapsible 36px / 12px / 12px · Accordion 12px / 12px / 12px |
| L           | 48px        | `body-m`   | 20px and 10px | 10px × 16px                        | Collapsible 46px / 16px / 16px · Accordion 16px / 16px / 16px |

Labels use weight 600 and the primary foreground. Bodies default to the secondary foreground and regular weight. Children keep their own typography and layout. The label, caret, and optional adjacent action share the first-line axis. Block padding grows symmetrically when the minimum hit height needs more room. A wrapped label adds complete lines below that axis. Long labels wrap and grow the row, including unbroken values. The caret keeps its own column. In narrow layouts and at 120% text, the body and label still share the same start edge. On coarse pointers the standard row has a minimum of 44px, with L retaining 48px. Delegated buttons keep the host control's dimensions.

The padded body starts 4px below the row and lines up with the label. Accordion groups with leading chevrons use the same label inset as Collapsible. Full-width bodies have zero automatic spacing on all edges and let the consumer lay out a table, list, or form. Empty bodies have zero height. Supply a meaningful empty message when the person needs to distinguish an empty result from missing content. The closed panel occupies zero space. At rest the open panel allows overflow so descendant focus outlines and floating content have clearance.

RTL mirrors indentation and header action placement. Collapsible points toward the label when closed, then down when open. Accordion points down when closed and up when open in both directions. Neither glyph flips along the block axis in RTL.

## Material, states, and motion

| Case                 | Treatment                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rest, closed or open | Clear row. Quiet `fg-muted` chevron at rest, `fg-secondary` when open. The title weight, row bounds, and panel alignment stay stable.                                                                           |
| Hover                | Neutral Ghost Button hover on fine, hover-capable pointers. The heading and adjacent command paint their own hit areas.                                                                                         |
| Held press           | Neutral Ghost Button press. The row stays stationary and the panel changes on activation.                                                                                                                       |
| Keyboard focus       | Neutral Ghost Button focus color and 2px outline. The disclosure places the outline inside its own radius, over any hover or press treatment. An adjacent action or body control owns a separate focus outline. |
| Unavailable          | Dampened title and indicator using the neutral Ghost Button's disabled ink. Hover, press, and keyboard focus are unavailable. Open panels keep their original content contrast and active controls.             |
| Forced colors        | Ghost Button uses system ButtonText for its border, GrayText for disabled controls, and Highlight for focus. Accordion dividers use GrayText.                                                                   |

Density controls geometry. Themes supply the material through their palette, size radius, and two disclosure tokens:

| Family | Hairline between Accordion sections                   | Reveal and close          |
| ------ | ----------------------------------------------------- | ------------------------- |
| Soft   | 1px `border-subtle`                                   | 180ms reveal, 144ms close |
| Frost  | 1px translucent 12% primary ink on the actual surface | 140ms reveal, 112ms close |
| Pixel  | 1px `border-default`                                  | Immediate                 |

The default disclosure row uses neutral Ghost Button paint in its host context. Expanded rows retain the transparent resting plate so the open panel and indicator carry the expanded state.

The moving panel takes neighboring content with it. Height eases with `cubic-bezier(0.2, 0, 0, 1)`, and the chevron turns with the theme's reveal duration. Keep the early part responsive, clip the panel during travel, and clear the clip at rest. A quick reversal starts at the current visible height. Reduced motion snaps both height and chevron, retaining the state cues. Glass and elevation belong to the host on Overlay. Disclosure itself stays planar across all themes.

## Interaction to preserve

- Click, Enter, and Space toggle the focused trigger. Tab and Shift+Tab use document order, including each independent header action and the controls inside open panels. Arrow keys retain native behavior. Opening keeps focus on its current control. An unavailable trigger skips the normal tab sequence.
- Accordion allows any number of open items by default. Exclusive mode allows zero or one. Activating the open heading closes it in either mode. Opening another exclusive item closes the previous one, including an initially open disabled item. When a long section above the newly activated heading closes in exclusive mode, keep that heading visible in the relevant scroll container through the transition. Keep its screen position if scroll bounds permit and make any correction without smooth scrolling. If activation leaves focus inside the closing sibling, move it to the newly activated heading button.
- Every trigger references the same persistent panel shell by ID. A plain disclosure adds no landmark. An explicitly useful region can be named by its heading for a small group of significant panels.
- At the start of collapse, make the panel inert and return focus **if it was inside**. Prefer the most recently used eligible trigger outside the closing panel, then the first eligible external trigger of that disclosure, then the focusable disclosure root. Keep the focus return target visible. If it is outside a scrollport, make the smallest immediate scroll to bring it into view. A previously focused control outside the panel keeps focus and scroll position. When an entire parent closes, use a target outside the parent's closed subtree. Settled closed panels are hidden from layout and the accessibility tree.
- By default preserve draft values and local state across disclosure. For future lifecycle options, deferred first mount shows the initial body on first opening and then preserves it. Unmount on close removes the children after the visual exit and a later reveal starts fresh. The panel shell still exists while closed. Preserve native form participation for mounted fields. To surface an invalid field in a closed panel, the owning flow reveals and then focuses it before showing its error. The disclosure trigger itself never submits a form.
- An open disclosure is independent of selection, validation, loading and disabled state in its child controls. Put feedback in or next to the affected content. If a closed section cannot be opened, show any essential reason in the surrounding UI.

## Review routes and remaining implementation

| Workbench location                                                                  | What to inspect                                                                                                                  |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Collapsible · Row sizes, Trigger feedback, Unavailable triggers                     | Leading indicator, body alignment, pinned pointer/focus paint, and live checkbox in a disabled open section.                     |
| Collapsible · Long label, Full-width content, Existing button                       | Wrap and first-line alignment, an unclipped table focus contour, and a draft that survives the second trigger closing the panel. |
| Accordion · Group sizes, Opening modes, Without dividers                            | Heading rhythm, first and last boundaries, multiple open sections, exclusive replacement and all-closed state.                   |
| Accordion · Focus and availability, Independent header actions                      | Shared Ghost feedback, separate focus, copying while closed, folding a reviewed diff, and favoriting a query.                    |
| Both · On a floating surface                                                        | Live disclosure inside a static material host. There is no floating-surface dismissal in these samples.                          |
| Document Reader (`04-document-reader`) and User Preferences (`09-user-preferences`) | Compact reader inspector and grouped settings in the actual compositions.                                                        |

Inspect the six presets, Base and on Overlay, at 360/768/1280/1440px, 120% text, and RTL. The pinned rows display feedback paint and still respond when activated. The live examples use local state, ordinary native buttons and headings, an in-flow motion preview, and focus restoration for the illustrated closing path. The exact package signatures, generalized focus and controlled state lifecycle, exclusive scroll anchoring, mount policy and native form integration are implementation work. Keep the shared anatomy and use these samples when switching the scenes and specimens to the shipped exports.
