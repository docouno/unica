# Avatar & AvatarGroup design reference

Status: approved design reference. This is a playground reference, not an exported package API. Inspect `?item=avatar` in all six presets. The component source and this handoff describe the same approved design.

## Purpose and boundaries

Avatar identifies a person through an image or a quiet fallback. AvatarGroup summarizes people attached to an object. Both are passive. Names, profile links, selection, online status, invitations, uploads and account menus belong to surrounding components. There is no material, status-color, random palette, selected or disabled axis on an identity frame. The enclosing action owns unavailable feedback: the account composition mutes its label and reduces the identity visual to 45% opacity.

Photos keep their original colors. Fallbacks and remainder counters use `--neutral-soft-bg` / `--neutral-soft-fg`; semantic status colors are reserved for neighboring feedback. Soft has matte borderless fallback plates, Frost a subtle neutral rim, and Pixel a square structural frame. There is no glow, drop shadow, scale or press travel on the avatar itself.

## Anatomy and geometry

A fixed square frame contains a fallback and a cover-cropped image. The image replaces the fallback when ready. The inner hairline is painted over the image, never subtracts from its dimensions, and uses primary foreground at 16% opacity. Fallback rims consume `--_pill-border-width` and `--neutral-border`. The frame uses `--radius-full`: circular in Soft/Frost and square in Pixel. The glyph uses the regular person icon from the shared Icon family.

| Size  | Frame | Initials token         | Glyph | Group overlap    |
| ----- | ----- | ---------------------- | ----- | ---------------- |
| `2xs` | 20px  | caption-s, one initial | 12px  | Not a group size |
| `xs`  | 24px  | caption-s              | 14px  | 4px              |
| `s`   | 32px  | caption-m              | 18px  | 4px              |
| `m`   | 40px  | body-s                 | 20px  | 6px              |
| `l`   | 48px  | body-m                 | 24px  | 8px              |

`m` is the default. Initials use weight 600. Center the capital-letter body on the frame, not the font's line box; accents and descenders keep their natural extension. Icons retain geometric centering. The prototype uses a cap-height baseline strut for text and counters, with no font-specific offsets or movement of the glyph slot. Letter spacing and indentation reset at the identity boundary. Typography follows the active theme and font scale; frame geometry stays fixed at 120% text. Compact sizes are for bylines, table cells and headers, not standalone touch targets. Do not enlarge or shrink a frame to fit a long name.

Images default to `object-fit: cover; object-position: 50% 50%`. The host can supply a focal point for an off-center portrait. Images are never mirrored in RTL or tinted by the theme. The portrait fixtures test real faces and light/dark boundaries; the existing wide/tall geometric fixtures separately expose aspect-ratio cropping.

## Identity and fallback precedence

1. Successfully loaded image.
2. Explicit non-interactive fallback mark, including authored initials when automatic extraction is unsuitable.
3. Initials from a trimmed name: first grapheme of first and last whitespace-separated words, uppercased; take the first grapheme again after uppercasing to prevent expansion (`ß mann` becomes `SM`). A single word gives one initial. `2xs` always takes only the first initial.
4. Neutral person glyph for an absent or whitespace-only name.

Combining marks remain attached to their letter. Preserve name order; do not infer culturally specific surnames, reorder scripts or derive a color from the name. Hosts can supply a compact mark where word segmentation is inappropriate. Custom fallback content must fit the frame, remain passive and avoid long strings. A full name stays in the accessible label or adjacent text, never inside the frame.

The CJK example uses a local two-glyph Noto Sans SC font fixture so its appearance is reproducible in the capture container. The optional-name case similarly supplies local Noto Sans Arabic text subsets for its Arabic fixture (`public/assets/licenses/avatar-arabic-*.txt`). These fonts belong to the specimen only; production hosts supply appropriate script coverage through their typography. Font provenance and its Open Font License are included in `public/assets/licenses/avatar-cjk.txt` and `avatar-cjk-OFL.txt`.

## Image states and transitions

| Situation               | Visible result                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| Missing/empty source    | Fallback immediately                                                                           |
| Source pending          | Same fallback, same dimensions                                                                 |
| Valid image loaded      | Image immediately replaces fallback                                                            |
| Failed image            | Fallback remains; no broken-file glyph, error badge or retry control inside the avatar         |
| Image source changes    | New identity's fallback until its new image is ready; no stale portrait of the previous person |
| Image removed           | Fallback immediately                                                                           |
| Retry requested by host | Same frame, then photo if successful                                                           |

There is no loading spinner, shimmer, delayed placeholder or crossfade. Image loading does not mean that a person is unavailable. Loading the person record itself is a separate Skeleton use case. Motion is absent in every material and reduced-motion mode.

The specimen includes real image success/failure/removal/retry, changing identity and a clearly labeled held waiting state. Holding a state is a visual inspection control, not a network simulator. Production must preserve these outcomes for responsive-image changes, cache hits, stale requests, errors and hidden subtrees; those mechanisms are not implemented or claimed here.

## Group structure, seams and overflow

The group is an ordered, named list of passive people. It preserves supplied order; later items paint in front. There is no animation on membership or limit changes. `max` defaults to four visible people; the remainder is additional to that limit. Empty groups render nothing, a single person has no offset, and a group at or below the limit has no `+0`.

All member frames keep the full size in the table. A 2px transparent seam is cut out of the preceding frame around the next silhouette. It exposes the actual underlying surface, including translucent glass and patterned underlays; it is not a canvas-colored border and does not require a background-color prop. Pixel uses complete square frames separated by a 2px gap, retaining all four edges; the theme sets `--_avatar-group-overlap-factor: 0` instead of the overlapping rounded recipe (`1`). The final member remains complete. Groups calibrate their monograms for the smaller exposed area: `xs` uses one initial with caption-s; `s` uses two with caption-s, `m` with caption-l, and `l` with body-s. This fixed group scale applies to every name, rather than shrinking arbitrary text to fit. Counters use the same group type scale. Initials and glyphs stay horizontally centered in the full frame, exactly like a standalone Avatar. Overlap never changes their alignment; there is no compensation for the exposed silhouette, neighbor count, text or reading direction. Photographs retain their original center crop. At 120% text, each overlap relaxes by 2px while letters and frames retain their defined sizes.

The remainder is static, neutral and exact (`+1`, `+12`, `+128`, `+1200`). It shares the avatar height and has a minimum width of one frame, with 5px inline padding. Longer numbers expand its width into a capsule in Soft/Frost or a rectangle in Pixel. Do not reduce the type size, abbreviate to `+99+`, pretend that the counter is a person, or make it a small hidden button. A localized accessible label describes the remainder, for example “12 more members”.

The entire stack remains on one line. Hosts choose a visible-member limit that fits their available space; they must move adjacent actions to another line or reduce the limit before clipping the stack. No automatic resizing, wrapping individual members, hidden reordering or automatic member-count measurement is part of this design. Four visible `l` members plus a short remainder fit a 360px review container. Large counts have their own width and can require a smaller limit.

RTL mirrors logical overlap and the seam, preserving source order. Faces and letter order remain unchanged. The `+N` text is isolated left-to-right so the plus stays before the number.

## Optional name hints

Name hints are opt-in (`showNames` in this prototype). The default group remains entirely passive and unfocusable. When enabled, each visible identity is a focusable information graphic, not a button or link: Tab / Shift+Tab visits names, and Enter / Space has no activation behavior. The full supplied name is its accessible name whether the tooltip is open or closed; do not announce a duplicate description.

- Each group configures its own 300 ms cold hover delay with `TooltipProvider`. For example, hover member A for 300 ms, then move to B. B appears immediately while A is open or within 300 ms of its closing. Keyboard focus opens the hint immediately. Opening a new hint replaces the visible one.
- The [Tooltip](../../../../../docs/components/tooltip.md) is centered 8px above the full member frame and flips below when space is tight. Set `collisionPadding={8}` for the viewport edge. Long names wrap within 20rem and the available space. Name text keeps its own direction in LTR and RTL groups.
- Keep the original stack, masks and member order on hover/focus. Keyboard focus draws one outer group contour; the positioned name identifies the current member. No avatar is raised, enlarged or turned into a selected state.
- The tooltip is hoverable, remains visible while its trigger or bubble is hovered or the trigger focused, and has a 150ms pointer-transfer grace period. Escape dismisses it without moving focus; it stays dismissed until the trigger is left and revisited.
- The bubble contains only the name. It is not a profile preview, menu, online-status badge or source of hidden member names. The remainder remains an unfocusable exact count.
- Touch does not depend on hover or long press. Offer the external full member list when people need to discover identities; the live disclosure demonstrates this route.

## Avatar inside an action

An identity and label form an explicit flex row, vertically centered with a fixed avatar and a wrapping text slot. Do not put an inline avatar immediately next to bare text or rely on text-baseline alignment. The example is an action composition, not a new AvatarButton component or library API.

| Action size | Avatar | Minimum height | Leading / vertical visual inset | Avatar-to-label gap |
| ----------- | ------ | -------------- | ------------------------------- | ------------------- |
| S           | 20px   | 30px           | 5px                             | 6px                 |
| M           | 24px   | 40px           | 8px                             | 8px                 |
| L           | 32px   | 48px           | 8px                             | 10px                |

The listed insets include the action border. The borderless Soft secondary button places the avatar 1px closer to the leading edge. The trailing label padding follows Button (S 12px / Pixel 10px, M 16px, L 20px, before its border). At increased text scale or with a wrapped label, the row may increase the action height; avatar and label stay centered together. Keep native coarse-pointer target expansion from Button. Photo, initials and unknown glyph use the same geometry. Loading hides the entire row without changing its dimensions. Disabled keeps the frame in place and subdues its image/fallback to 45% opacity together with Button's muted label. Focus, hover, press and material travel belong to Button.

## Interaction and accessibility outcomes

- Informative standalone identity: announce the full supplied name once as an image, regardless of whether photo or fallback is visible. Do not read initials as a second label.
- Decorative identity next to the same person's name, or inside an already named action: `alt=""`; hide the entire visual subtree from accessibility. A loading or failed image must not change this choice.
- Default group: named list, each visible person's full name, then a descriptive remainder. Without name hints, no member or counter creates a Tab stop. Hidden members are not silently presented as though they were visible; an external full-list action provides access when needed.
- Custom fallback glyphs are decorative and passive. No focusable descendants belong inside an Avatar.
- An enclosing Button/Link owns keyboard input, hit area, focus ring, hover, press and unavailable states. The avatar has no separate focus contour. Use live hover, press, and keyboard focus on the account buttons. The loading and disabled samples hold their availability state for comparison.
- The live “View all” example is an external inline disclosure: Enter/Space toggles it, `aria-expanded` changes, and focus stays on the button. Closing removes the visible list without a focus jump. The example does not define a built-in AvatarGroup menu or profile picker.
- Forced colors retain frame geometry and use Canvas / CanvasText contours and text. Photographs remain photographs. Group cutouts continue to expose the surface.

## Review route and implementation boundary

The States tab compares five frame sizes and three image sources in `sizes`. Its cases include `fallback`, `images`, `crop`, `groups`, `surfaces`, `direction`, `names`, and `action-geometry`. The `usage` and `actions` compositions show a full member list and an account profile. Their copied examples and the Usage Quick Start import the prototype relative to `apps/playground/src/`. The surface study paints Shell, Canvas, Card and real Overlay material over the workbench underlay. Check the existing overview/editor collaboration bars, collection table, document-owner HoverCard and inspector/member rows in the Folio scenes; these are consumers, not duplicate application screens inside the specimen.

Check 360/768/1280/1440px, 120% text, RTL, keyboard disclosure, image failure/retry, forced colors and reduced motion. Inspect capital-body centering and action insets at a readable zoom, including the actual owner HoverCard. Judge face recognition, text fit, edge weight and visual quietness together with numerical contrast. A frame perimeter is not a field boundary and should not be strengthened just to resemble an interactive control.

The prototype's props and SVG mask are inspection tools. Wave 2 designs the exact React 19 API, DOM/image lifecycle, generation-safe responsive sources, localization surface, attribute restrictions and browser compatibility while preserving this experience. It must verify clipping and transparent cutouts on all supported engines, particularly SVG-mask/forced-colors behavior. No package export, production contract or acceptance of those mechanisms is implied here.

Industry references used as input: [Radix Avatar](https://www.radix-ui.com/primitives/docs/components/avatar), [Mantine Avatar](https://mantine.dev/core/avatar/), and [Fluent Avatar](https://fluent2.microsoft.design/components/web/react/core/avatar/usage). Their available options are research inputs, not requirements to reproduce every feature.
