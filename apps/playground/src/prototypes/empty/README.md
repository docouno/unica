# Empty design reference

The visual and interaction design was approved on 2026-11-19. Open `/?item=empty` in the playground for the prototype and implementation reference.

## When to use it

Empty replaces the missing content of a resolved view. Keep the owner of that view visible, including collection headers, query controls, table column headers, and page navigation. Give the user a plain-language reason and a way forward when one exists.

| Situation                                        | Media and copy                                                                                                                | Action                                                                                                      |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| A collection has no items yet                    | Default muted glyph or copy alone. Explain when items will appear.                                                            | Omit actions when the person has nothing to do.                                                             |
| First-run collection                             | Accent glyph or product illustration. Name the item the person can create or import.                                          | One primary action for the collection’s main task. Use a secondary action if it is a supporting widget.     |
| Search or filters return zero matches            | Muted search glyph or a single sentence in a dense table. Say that the current search or filters found nothing.               | Use an ordinary secondary action to clear the relevant restriction. Keep the search and filters accessible. |
| A collection is paused or pending a prerequisite | Info glyph when orientation helps. Explain what will make the content available.                                              | Give a secondary action if the user can resume or complete the prerequisite.                                |
| A queue is cleared                               | Success glyph where it helps distinguish the completed work. State that the person is caught up.                              | Usually omit actions.                                                                                       |
| Access is restricted                             | Warning glyph. State the restriction plainly without revealing inaccessible contents.                                         | Request access if that path is available, or explain who can grant it.                                      |
| A request failed with no content to show         | Danger glyph. Identify the failed task and keep the recovery copy short.                                                      | Secondary retry in an embedded area. A full-page failure can give retry primary weight.                     |
| A route is missing or failed to load             | L-scale heading and medallion or local artwork. A 404 explains the missing page. A 500 explains that the page failed to load. | On 404 offer a known destination as a link. On 500 offer retry plus a secondary destination if useful.      |

Use Skeleton or Spinner for the first unresolved load. Keep available data in place during refresh and use the host’s progress or inline error treatment. When data remains usable after a failure, place Alert or another existing feedback pattern near the affected content. Card or the page owns the containing surface. A file drop target uses its own drop affordance.

## Anatomy and geometry

Arrange the slots in reading order from media and title through description and actions. All slots are optional. For example, a table cell with `colSpan` can contain only `EmptyDescription`. The heading is a real `h1`–`h6`, chosen by the caller to fit the document outline. Its level is independent of the visual size. Description is a paragraph. Keep feedback about the cause in the copy even when an icon repeats it.

| Measurement                     | S                      | M (default)            | L                       |
| ------------------------------- | ---------------------- | ---------------------- | ----------------------- |
| Medallion / glyph               | 40 / 24px              | 56 / 32px              | 72 / 40px               |
| Artwork maximum per axis        | 80px                   | 120px                  | 160px                   |
| Heading / description           | `heading-s` / `body-s` | `heading-m` / `body-s` | `heading-xl` / `body-m` |
| Media to first visible text     | 12px                   | 18px                   | 24px                    |
| Title to description            | 6px                    | 8px                    | 10px                    |
| Last visible content to actions | 16px                   | 24px                   | 32px                    |

The outer composition paints no surface, adds no padding, and introduces no minimum stage height. The host provides the outer inset, block-axis placement, and clearance for focus and action paint. Use S for narrow cards, table rows, and popovers. M suits a standalone panel or collection. L gives a page-level message more emphasis while keeping its copy compact. Center is the default. Start aligns every slot, text, and the action row along the logical start edge. Both alignments work at every size. RTL mirrors that edge and the first action’s placement without changing reading or tab order.

Use primary ink at weight 600 for the heading. Keep the title and description close, then leave a larger gap before the action. Supporting copy uses a blend of 80% `fg-subtle` and 20% `fg-muted` in Oklab. Use `fg-secondary` when increased contrast is requested. Heading lines balance within 28ch. Descriptions wrap to 34ch, 38ch, and 42ch at S, M, and L. Centered descriptions balance short lines. Start-aligned descriptions keep a natural rag. Long identifiers break as needed. Keep all copy visible with no clamping. The 120% text control scales the typography and line heights through the theme while media dimensions and spacing retain their selected size. Missing slots leave only the gap between the remaining neighbors. If just actions remain, they start at the top. Empty slot values like `null`, `false`, or an empty string collapse, and a displayed `0` remains visible.

Use the component’s native action types. Commands use Button and destinations use links, including a button-shaped link for a prominent destination. The first action in source order is the most important. Usually one action is enough. A pair uses an 8px gap in both axes, wraps in source order, and keeps natural widths as space allows. Long labels wrap with their own button padding. Use one control size in a row. Start with S controls in tight regions and M controls in ordinary panels and route layouts. See the [Button](../../../../../docs/components/button.md) and [Link](../../../../../docs/components/link.md) contracts for geometry and interaction states.

## Media and material

`EmptyMedia` can show a glyph in a medallion or the caller’s artwork. A medallion uses the shared regular-weight icon, centered, and is hidden from the accessibility tree. Decorative illustrations use an empty alternative. Provide meaningful alternative text when artwork adds information. Place an image or SVG directly in the illustration slot to keep its aspect ratio, fit the available width, and show all of its edges. The caller sizes illustrations that use a custom wrapper within the same bounds. The illustrated examples use transparent local SVG and PNG pairs with a common neutral palette.

| Family | Medallion                                                                                                                                                                     |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Soft   | Rounded matte disc with a quiet tint and no rim.                                                                                                                              |
| Frost  | Translucent round disc with a 1px neutral rim. The tint follows the underlying paint. On Overlay the rim comes from the surface cascade and the host provides glass.          |
| Pixel  | Square tinted disc with a crisp 1px `border-default` on Base, with the overlay context’s card border on Overlay. A coordinate grid belongs to the surrounding canvas or Card. |

Use `muted` by default. `accent`, `info`, `success`, `warning`, and `danger` change only the glyph and its local tint. Use `fg-subtle`, `accent-soft-fg`, or the corresponding `status-*-soft-fg` as the source color. Blend 76% source with 24% `fg-subtle` in Oklab for the glyph. Mix 6% of the source into transparency for the disc. The rim remains neutral and follows `card-border` and `pill-border-width`. The mask shape uses `radius-full`. The disc stays flat and static. In forced colors it uses Canvas, CanvasText, and a GrayText perimeter. Copy, action semantics, and the independent focus indicator still carry the experience. Use no backdrop blur on the disc. Actions retain their theme-specific press, hover, loading and reduced-motion treatments.

## State changes and focus

- Static Empty has no implicit landmark, tab stop, live announcement, or hover treatment. Tab moves through the actual actions in source order. A disabled action uses normal Button behavior. If there is no available recovery action, say what happens next and omit the action group when possible.
- During live search, keep focus in the query/filter controls. The host has a persistent polite result-count region outside the part of the view it replaces. If the person explicitly submits a search that returns zero results, focus the empty heading programmatically. Give that heading `tabIndex={-1}` and a visible 2px focus ring with 3px offset for keyboard focus. Use Highlight for the ring in forced colors. Avoid a second announcement of the same result if the heading just received focus. Clearing through the recovery action resets the search and returns focus to the search input. The query and table header stay in place, and the columns keep their widths throughout.
- While retrying inside a failed view, keep the recovery context present. Pending Button preserves its name and dimensions, suppresses repeat activation, and retains keyboard focus. Keep the explanation and action in place. Show and announce progress in a persistent status line in the host. If another attempt fails, keep focus where it is, make Retry available again, and report the outcome in the same line. If it succeeds and the focused control disappears, move focus to a meaningful heading in the replacement content. If the user has moved elsewhere, leave focus alone and announce completion when needed. On a successful response with zero results, show the reason appropriate to the resolved collection.
- On synchronous replacement of an empty panel after a setup action, focus the newly available content if the previously used control disappears. The Folio scene transfers focus from Create webhook sandbox to the new sandbox heading, and from Remove sandbox back to the empty heading. When a route changes, the router owns title, focus and scroll restoration for the destination.
- Content replacement is immediate. Empty adds no enter/exit motion or synthetic delay. Keep its host’s dimensions stable where the screen would otherwise jump, and allow the layout to grow for longer text.

## Review in the playground

| Location                  | What to inspect                                                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sizes`, `reasons`        | Compare size steps and the difference between passive emptiness and first-time setup.                                                                    |
| `activity`, `unavailable` | Paused and completed activity, access restrictions, and failed loads.                                                                                    |
| `placement`, `overflow`   | Flush alignment with a card’s heading, a description-only native table row, long copy, wrapped actions, and RTL.                                         |
| `media`, `routes`         | Both file formats and orientations across the artwork bounds, plus the balance of artwork, copy and actions on a missing or failed route.                |
| `search`, `retry`         | Live filtering and clear, focus after explicit empty submission, and both retry outcomes. The first retry fails and the second shows the loaded reports. |
| `overlay`                 | A compact state on the workbench’s floating surface. Look at the rim, ink hierarchy and button against the actual overlay.                               |
| `08-extensions-empty`     | The webhook sandbox card and the filtered installed-connectors message in their collection context.                                                      |

Inspect all six presets. Use 360/768/1280/1440px, 120% text, RTL and the overlay sample. The matrices and layout examples pin their visual content and actions. Search, Retry and Folio use local state and native controls. Requests, navigation and service responses outside those examples belong to the consuming application. Public package signatures and reusable implementation mechanics are defined when the family ships.
