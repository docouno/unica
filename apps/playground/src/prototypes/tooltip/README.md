# Tooltip and HoverCard design reference

Status: approved design reference. Open `/?item=tooltip` and `/?item=hover-card`. These are design prototypes, not package exports or finalized TypeScript APIs.

## Purpose and boundaries

**Tooltip** clarifies a compact control with a short label or explanation and an optional passive keyboard shortcut. It contains plain text and keycaps, never a heading, image, link, action or form. Essential instructions, disabled reasons and validation stay visible in the page. An icon button needs its own accessible name before a tooltip is added. A tooltip does not register keyboard shortcuts.

**HoverCard** previews the destination of a real navigation link: a member, team, document, issue or commit. It contains supplementary read-only information, available in full at the destination. It never becomes the only way to obtain essential information. No buttons, links, removable tags, retry action or close control inside the card. Use Popover for an explicit interactive surface and Tooltip for a short control label.

Neither family has a decorative material variant or a size scale. Content length does not create a second style. Neither paints an arrow or a scrim, traps focus, locks the page or changes the source's normal action.

## Geometry and anatomy

| Part              | Selected design                                                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tooltip surface   | Content-sized, 20rem maximum, 30px minimum height. 4px block / 8px inline padding, 1px material border. Body-s text with its natural line height.                                                             |
| Tooltip shortcut  | 12px after the label, top-aligned with the first text line. Inherited compact Kbd metrics. A chord moves to the next row with a 4px gap if it cannot fit beside the label. Keep the chord LTR in RTL layouts. |
| HoverCard surface | 22rem width ceiling; shrinks to available space. 16px total content inset (4px outer + 12px reading-area padding), 12px between groups. No minimum content height.                                            |
| Identity          | Optional 40px Avatar, 12px from a title and secondary identity line. Title uses body-m semibold, the supporting line uses body-s. Long identities wrap; status is placed below, away from the title.          |
| Entity            | Optional neutral icon/type/identifier line in caption-l, body-m semibold title, body-s summary. No oversized title or mandatory media.                                                                        |
| Metadata          | Optional caption-l facts and S passive Badges, wrapping with 8px row / 12px column gaps. Classification is passive Badge content because the current Tag includes a remove action.                            |
| Separation        | A subtle rule may separate independent document metadata after 12px of breathing room. Identity cards do not need a default rule. No nested Card shell or second floating shadow.                             |
| Shared shape      | `surface-s` radius: 10px in Soft/Frost, 0px in Pixel. Keycaps and avatars retain their own established geometry; no geometry is derived from a material's press motion.                                       |

Omit unavailable optional metadata instead of printing blank rows or placeholder dashes. Use a short, useful summary rather than copying an entire document into a hover card. Titles, names, identifiers and supplied summaries wrap without CSS ellipsis or line clamps. Intrinsic widths never force a viewport overflow. Isolate URLs, hashes and branch identifiers with their own LTR direction.

## Material and motion

Both families use the same overlay polarity in all six presets, including Light. This keeps keycaps, neutral status markers and typography in the same surface context. Soft is opaque and quietly elevated. Frost uses the existing transparent overlay fill, 20px blur / 125.4% saturation and fading edge highlight; its background is inspected over the workbench's multitone underlay. Pixel is opaque, square and has a crisp offset shadow. HoverCard receives Pixel corner registration marks; the small Tooltip keeps a plain rectangular outline.

Tooltip uses `--_overlay-shadow-tooltip`; HoverCard uses `--_overlay-shadow-hover`. These are family-specific theme recipes, not aliases of a large panel's elevation. Dark Soft/Frost tooltips use a short contact shadow with a compact ambient footprint; Dark Pixel uses a 2px hard offset instead of the Light preset's 4px offset. Frost HoverCard uses a shorter, quieter ambient shadow in both color schemes. Its fill and backdrop filter retain the shared glass recipe. Light tooltip shadows and Soft/Pixel HoverCard shadows retain their established treatment. No theme selectors, inverse tooltip theme or extra decorative outline are needed.

The outer surface owns fill, blur, shadow, rim and corner marks. A separate inner reading area owns content layout and native overflow. Scrolling never moves the glass highlight or Pixel corner marks; the pointer bridge remains outside the scroll owner. Tooltip's inner clipping radius is the outer radius minus the 1px border, clamped to zero. HoverCard insets its reading area by 4px on every side inside that border, keeping the native scrollbar clear of the outer corners at both scroll endpoints. Its clipping radius is the outer radius minus the border and 4px inset, clamped to zero. Reading-area padding is 12px, preserving the overall 16px text inset and the existing content width and panel size. In RTL, the same breathing room applies at the scrollbar's inline edge. No second material, shadow or backdrop filter is added inside.

Both panels appear and disappear immediately in every preset, including reduced motion. Intent delay is not an entrance animation. There is no slide, scale, bounce, opacity fade or height animation. Content replacement may change height immediately; cached content stays visible during refresh. The source keeps its own material's hover, press and focus treatment.

Without backdrop-filter, use the opaque surface fallback. In forced colors, use Canvas/CanvasText with a system border, no blur, shadow, rim or corner decorations. Source focus remains a separate system Highlight outline. The panel itself never receives a focus ring.

## Intent, input and dismissal

| Input or event                             | Expected result                                                                                                                                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| First mouse/pen hover                      | Wait 600ms. Passing briefly across a source produces no flash.                                                                                                                                         |
| Nearby source in the same family           | Open immediately while another preview in that family is active or within 300ms after it closes. Tooltip and HoverCard have separate warmup domains.                                                   |
| Leave source for panel                     | Maintain an 8px pointer bridge across the gap. Leaving both regions waits 150ms before closing; re-entry cancels closing. A panel stays while it or the source is hovered.                             |
| Keyboard focus                             | Open immediately. Keep focus on the original button or link. The panel adds no Tab stop.                                                                                                               |
| Tab / Shift+Tab away                       | Close immediately and continue normal document order, including after pointer text selection has moved focus away from the source. Do not move focus into the card or restore focus to the old source. |
| Escape                                     | Close the current preview and keep source focus. Do not dismiss its containing Popover or modal. Suppress reopening until the user leaves the interaction or deliberately refocuses the source.        |
| Source activation                          | Hide the preview and execute the original action or link navigation. Preserve modified and middle-click link behavior.                                                                                 |
| Outside press                              | Hide the preview and let the pressed target receive its action/focus.                                                                                                                                  |
| Touch                                      | First tap performs the original action/navigation. No preview-first tap, long-press handler or intercepted native selection/menu gesture.                                                              |
| Disabled source                            | No opening and no fabricated focusable wrapper. A necessary disabled explanation is shown in the page.                                                                                                 |
| Text selection                             | Allow copying text. During a panel selection drag, leaving its bounds does not close it. Keep a selection in the panel readable until cleared or explicitly dismissed. Escape always remains an exit.  |
| Another preview opens                      | Replace the previous visible preview. A pending hover on an older source must not reopen over it.                                                                                                      |
| Source removed or outside the visible area | Close instead of leaving an orphaned panel.                                                                                                                                                            |

Use native `popover="manual"` so a preview does not collapse an open auto-popover chain. A Tooltip uses phrasing markup suitable beside an inline link. The library implementation resolves complete nested Escape coordination, event/ref composition and supported-browser behavior while preserving these outcomes.

The default visual label repeats the source's existing accessible name and is hidden from assistive technology to avoid a duplicate announcement. An additional Tooltip explanation is opt-in: retain the source's name and existing description, and associate the extra text while the panel is closed as well as open. The live Pin inspector example demonstrates that distinction. HoverCard content stays hidden from assistive technology; the navigation link and destination carry the accessible information. Do not announce hover previews as alerts or live regions.

## Placement and limited space

- Defaults: Tooltip top/center, HoverCard bottom/start. Both support top/bottom/start/end crossed with start/center/end. Inline sides and horizontal alignment mirror in RTL.
- Keep an 8px source gap and at least 16px viewport edge clearance. The implementation also respects safe-area insets and the visual viewport.
- Try the requested side, flip when the opposite side has more usable room, then shift along the cross-axis. When neither inline side fits, choose a vertical side. Do not overlap the source to force an inline placement.
- Clamp width first. On limited height, prefer the side with more space. The inner reading area may scroll as a final escape; the surface and its decoration stay fixed. It never becomes modal. Keep the full details accessible at the source's destination. Do not scale down the type to fit.
- Reposition on scrolling, resizing, text-scale changes and content changes. Close when the source leaves the visible area.

The live placement frame deliberately acts as a small available viewport, even with a single artboard. HoverCard's 560px frame gives the ordinary team preview room without a default scrollbar; a shared height variable keeps that constraint independent of stylesheet order. Smaller viewports or enlarged text can still require body scrolling. Internal scrolling preserves its offset and does not trigger a placement reset. The separate 200px overflow example pins a height constraint for inspecting top, middle and bottom positions. These previews do not claim complete mobile keyboard, zoom, safe-area or clipping-ancestor coverage.

## Content states

Tooltip has content or no panel. Whitespace-only/empty labels produce no surface or shortcut-only fragment. It has no loading, error or success skin. A source's selected label describes the current action (for example, “Remove from saved”). Source availability and focus never recolor the tooltip itself.

| HoverCard state        | Appearance and content                                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ready                  | Identity/title, useful summary and optional metadata.                                                                                                                                             |
| Initial loading        | Preserve the known source title, reserve a small summary area, show two quiet SkeletonText lines and “Loading preview…”. No spinner wall. The loading state must not flash for a cached response. |
| Refreshing cached data | Retain the ready content; add a quiet “Updating preview…” note. Do not replace the content with skeletons.                                                                                        |
| Missing summary        | Keep identity and available metadata, with “No summary yet.” Omit genuinely absent optional fields.                                                                                               |
| Restricted             | Neutral lock cue, “Private document” and a short access explanation. Do not reveal hidden title, excerpt or metadata.                                                                             |
| Missing destination    | “Document not found” and a specific explanation. No fabricated status badge.                                                                                                                      |
| Load failure           | “Preview unavailable” and a short note that the original link still opens the destination. No destructive color, Retry button or automatic navigation.                                            |

Loading and content state are owned by the consumer. The specimen selector explicitly pins them; it is not a network implementation. Keep source navigation available in every state. No automatic success splash or card-wide invalid border.

## What is live and what is pinned

- **Tooltip Content, States, Overflow, Context; HoverCard Identity, Entities, Overflow, Context:** in-flow comparison studies. Focus/hover styles are explicitly pinned, never a claim that actual focus moved. They do not implement outside dismissal.
- **Tooltip Interaction and Placement; HoverCard Interaction:** native manual popovers with local hover/focus intent, per-family warmup, pointer bridge, Escape, source activation, outside press and bounded placement. HoverCard selection can be copied. Trigger controls keep their native semantics.
- **HoverCard Content:** a controlled state selector. The two loading lines use the existing SkeletonText recipe.
- **Existing consumers:** the overview hint, document-owner preview, Avatar names, Chip/Tag truncated labels and Kbd specimen share these surfaces. Their existing local placement helpers remain design previews, not the library overlay engine.
- **Reader scene:** the owner card starts pinned open for composition inspection; Escape hides it and hovering/focusing the source reveals it. The source is a real link to the existing collection scene as a navigation stand-in for the team's documents. Scene placement is fixed, without the live specimen's hover-intent or native positioning harness.
- **Library work:** exact TS API, controlled/uncontrolled authority, SSR description merging, event/ref composition, document-wide coordination with all overlay families, robust geometry/selection lifecycle, nested modal/auto-popover integration, and cross-browser/assistive-technology verification. No new visual or product decisions are delegated by this list.

Review all six presets together, then narrow/120%/RTL text wrapping, keyboard focus and pointer crossing, selection, the content states, and the existing overview/reader consumers. Judge readability, hierarchy and material in the rendered interface alongside numerical contrast.

References: [WCAG content on hover or focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html), [APG Tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/), [Base UI Preview Card usage](https://base-ui.com/react/components/preview-card#usage-guidelines). These inform interaction boundaries; the selected geometry and material above are this design's decisions.
