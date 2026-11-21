# Skeleton — design reference

Status: design approved on 2026-11-16. Open `/?item=skeleton` in the playground. These local prototypes establish appearance and expected loading behavior; they are not package exports or the final React API.

## Purpose and boundaries

Skeleton holds the place of content whose structure is already known: a media slot, avatar, text block, card body, or collection row. Use it for initial content arrival or an independently loading part of a region. Keep known headings, labels, navigation, available actions, and already loaded data visible. Refreshing usable data keeps that data on screen with a small updating message.

There are two childless primitives: a geometric `Skeleton` and a typographic `SkeletonText`. There are no decorative variants, status tones, colors, speed controls, pulse modes, or loading wrappers over hidden children. The application owns requests, timing, layout, announcements, errors, and replacement with content. A spinner serves an action with unknown structure; a progress indicator serves measurable work; an empty state serves a completed request with no results. Elapsed time alone does not make a request measurable.

## Geometry and anatomy

| Part              | Design decision                                                                                                                                                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rectangle         | Full available inline width and 16px block height by default. The host sets the intended width, height, or media-slot dimensions. No intrinsic external spacing.                                                                                                  |
| Rectangle corners | `--element-radius`, falling back to `--size-m-radius` (8px in Soft/Frost, 0px in Pixel). The host must supply the radius of the actual slot, not blindly inherit an outer Card radius.                                                                            |
| Avatar silhouette | `shape="circle"` means the Avatar medallion: `--radius-full`, including square corners in Pixel. Default 40px; a supplied width alone maintains a 1:1 aspect. Both dimensions may be supplied for an explicitly non-square slot. Use equal dimensions for Avatar. |
| Flex behavior     | Shapes do not shrink along the main axis. Available inline space caps their width. The host leaves room for the avatar and gives its text sibling `min-inline-size: 0`.                                                                                           |
| Text size         | 13 steps shared with Text and Title: `caption-s/m/l`, `body-s/m/l`, `heading-s/m/l/xl`, `display-s/m/l`. Default `body-m`. Use these steps for placeholder line boxes. Text also offers a compact `body-xs` size.                                                 |
| Text row          | Outer block exactly `--text-size-{size}-lh`, with a vertically centered bar at 72% of `--text-size-{size}`. Rows have no extra gap. Bar corners use `--radius-xs` (4px, or 0px in Pixel).                                                                         |
| Text width        | Full available width by default. A single line stays full width; only the last line of a multiline block shortens to 60%. The short line starts at the logical inline start.                                                                                      |
| Line count        | Three by default; positive whole counts describe the anticipated content. The prototype clamps invalid input defensively; that normalization is not a committed package API.                                                                                      |
| Native hidden     | Removes the placeholder and its occupied space. This is not the initial request-delay mechanism; the host still reserves the region during that delay.                                                                                                            |

At 120% text, font and line-box tokens grow together. Explicit pixel media/avatar dimensions remain unchanged. Width percentages remain relative to their slot. RTL mirrors the short line, row order, and sweep; it does not change height, opacity, or radius.

The typography study compares one and three explicit text lines at every size. This proves line-box parity, not a universal zero-layout-shift guarantee. Unknown text may wrap to a different number of lines. A host that needs stable height must reserve the same number of lines, use matching truncation/clamping, and preserve its media aspect ratio. Do not hide arbitrary real content merely to measure a placeholder.

The visible bar is deliberately thinner than a full font-size block. Side-by-side inspection with real display headings showed that a full-em bar made waiting text look too heavy. The 72% bar follows the visual weight of text more closely while retaining exactly the same outer line boxes, including at 120% text scale.

The media example uses a 16:9 slot with 4px inner corners (0px in Pixel), a one-line title, a reserved two-line description, and a 24px author row. Both loading and ready cards use identical slots. The row example uses a 32px avatar, 12px horizontal gap, a `body-s` title and `caption-l` description separated by 4px, and 12px vertical padding. These are examples of host layout, not compound components or additional Skeleton sizes.

## Material and motion

Every shape paints `color-mix(in srgb, var(--fg-muted) 16%, transparent)`. It has no stroke, shadow, blur, glow, accent tint, or pressed depth. Warm Soft neutrals, cool Frost neutrals, and Pixel's sharp geometry come from existing semantic tokens. The same recipe works on canvas, raised Card, and a real overlay panel. Frost's surrounding surface supplies the glass; Skeleton adds no opaque panel of its own.

The silhouette is supporting structure, not text or an interactive boundary. Its low contrast is deliberate. Increasing it to text-like contrast makes the waiting region compete with useful content. Loading meaning is also conveyed by a readable host status; placeholders are never the sole signal.

A low-amplitude directional veil passes twice, then disappears completely:

- Each pass takes 2200ms with `ease-in-out`; it rests outside the shape for the first 12%, travels by 78%, and remains outside through 100%. Two passes total 4.4 seconds.
- The overlay gradient is transparent at 15% and 85%, with a 9% `--fg-muted` center at 50%. The base fill never pulses or becomes transparent.
- The sweep follows reading direction. Shapes mounted as one batch share timing; independently arriving regions do not require a document-wide animation clock.
- All three materials use this restrained opacity veil. Pixel retains sharp silhouettes and no glow or surface displacement; it does not gain artificial stepping just because its corners are square.
- After two passes, the base fill remains. An ordinary rerender must not restart activity; a new loading batch may start again. Content replaces its placeholder immediately when available, including mid-pass. There is no exit fade, content blur, slide, stagger, or mandatory minimum wait.
- `prefers-reduced-motion: reduce` and frozen workbench captures render a flat fill immediately, with no stationary highlight band. The static comparison is explicitly pinned by the example harness.
- Forced colors remove the veil and use Canvas fill with a 1px inward GrayText outline. System colors remain undiluted; geometry does not change.

The short motion window helps avoid persistent distraction alongside already available content. It is a local design decision, not a claim that one animation universally makes every request feel faster. [Atlassian's usage guidance](https://atlassian.design/components/skeleton/usage) likewise recommends subtle placeholders and caution with distracting shimmer. The bounded activity also accounts for [WCAG's guidance on moving content beside other content](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).

## Loading lifecycle and accessible outcome

| Situation       | Expected result                                                                                                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fast response   | Reserve the region immediately, but wait 200ms before showing its placeholders. If content arrives sooner, show it directly. Never impose a minimum Skeleton duration. The host owns this delay.                       |
| Initial request | Show the known layout, neutral shapes for unknown values, and one concise loading status for the region. Do not skeletonize the whole application shell.                                                               |
| Partial arrival | Replace each ready row or slot immediately. Keep unresolved siblings in place. A ready title or caption stays visible while its image loads.                                                                           |
| Longer wait     | Keep the silhouette still after its two passes. If the request is unusually slow (a suggested host threshold is 10 seconds), show an honest explanation and a retry/recovery action. A time threshold is not progress. |
| Success         | Replace placeholders immediately with real content. Clear the busy state and announce completion once when useful. Do not move focus or wait for an animation to finish.                                               |
| Refresh         | Keep existing usable data visible and announce the update. No return to skeletons, blanket dimming, or loss of existing focus.                                                                                         |
| Empty response  | Remove placeholders and show a compact empty-state message. No endless loading animation.                                                                                                                              |
| Failure         | Remove placeholders and show a short error with a recovery action. Retrying restarts the host's request cycle. The retry action is a real control, never a colored placeholder.                                        |

Shapes are always decorative (`aria-hidden="true"`), childless, unselectable, noneditable, and outside the tab order. They have no accessible name, hover/pressed/focus/disabled/read-only/validation states, click handlers, or interaction feedback. The pointer may show `progress` over the shape, but it is not an action. Preserve hit testing for that cursor; an `inert` wrapper over the shape would suppress it. Never put interactive children under `aria-hidden`.

The consumer marks the content region `aria-busy` and keeps one concise status **outside** that busy region, so its announcement is not deferred with the loading content. Do not put `role="status"` or `aria-busy` on each bar, or make the whole arriving collection a live region. Only the unavailable region is busy; nearby controls remain usable. Focus stays on the existing control through arrival and refresh. [WAI-ARIA defines busy regions](https://www.w3.org/TR/wai-aria-1.2/#aria-busy); [Carbon's loading guidance](https://www.carbondesignsystem.com/building-blocks/core/patterns/loading) distinguishes initial skeletons from action feedback and progressive arrival.

## Review route and implementation handoff

| Section      | What to inspect                                                                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `geometry`   | Avatar sizes 20/24/32/40/48px, an explicit 80px block, one-line and three-line text.                                                                                  |
| `typography` | Select all 13 sizes; compare real Text/Title against one and three placeholder rows. Block-edge rules make height drift visible.                                      |
| `media`      | Toggle a card between loading and ready; compare with a ready reference. Image-only mode preserves already loaded copy.                                               |
| `lifecycle`  | Pinned initial/partial/slow/ready/refresh/empty/error states, plus timed normal and fast responses. The region, heading, status slot, and action row remain in place. |
| `surfaces`   | Identical row skeletons on canvas and raised Card.                                                                                                                    |
| `overlay`    | Partially loaded content in a real Popover material over an underlay. This is a static panel, not an opening/dismissal demo.                                          |
| `motion`     | Replay two passes beside a pinned static reference; inspect reduced motion and forced colors independently.                                                           |

The existing `08-extensions-empty` scene consumes the shared text primitive for the pending connector summary. Its title, index status, and scanning message remain visible. The application scene stays separate from the specimen.

The local lifecycle harness simulates requests; it is not a fetching abstraction or a new package component. The dropdown pins states deliberately; the replay buttons and retry/refresh actions use local timers. Neighboring Card, Avatar, Button, Text, Title, and Popover are existing prototypes. Native select/checkbox elements are review controls, not new designs for those families.

Library implementation must preserve the decisions above while defining the exact React 19/TypeScript signatures, ref and DOM contract, invalid-dimension policy, decorative-attribute protection, and browser/assistive-technology verification. Keep the primitives independent of network/state management. Do not promote example helpers, request timers, or preview data attributes into public API. Replace prototype imports, remove temporary component CSS, and publish the implemented contract in `docs/components/skeleton.md` when the family ships.
