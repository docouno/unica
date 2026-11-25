# List and ListItem design reference

Open `?item=list` in the workbench. The family covers editorial lists and vertical lists of records. A parent section, card, aside, or floating surface provides the outer padding and material. The list has no fill, border, shadow, or decorative variant.

## Editorial lists

- Use a native unordered list for unordered facts and a native ordered list for sequence. Markers sit outside the text column, so wrapped lines align with the first line of copy. Use discs at the first unordered level and open circles in nested unordered lists. Native ordered numbering respects `start`, `reversed`, and item `value`. The marker uses muted ink and tabular digits.
- The default marker gutter is `2em`. Increase `--list-marker-gutter` where labels need more room, for example `12ch` for a five-digit audit log. Gutter, text alignment, and indentation follow the inline direction. Adjacent prose items and a nested list each start with 4px of vertical separation.
- With size omitted, inherit the surrounding font size and line height. Nested lists inherit the same typography unless explicitly sized. Paragraphs, inline links, code, and nested lists stay in normal document flow. Disable markers for unnumbered, unbulleted content and keep explicit list semantics. Render group headings beside their lists, so the item count represents only entries.

## Record rows

Use a markerless list. Each item has a main area with an optional leading icon or avatar, a primary label, optional supporting text, and an optional sibling trailing area for facts or controls. Allow content to wrap and grow. Primary labels are semibold. Supporting text uses muted ink and sits 2px below the label. Use the matching icon size and a suitable avatar. With `reserveLeading`, rows without media leave the same media column empty.

| Size | Label / line height    | Secondary text | Icon / media column | Gap  | Main block padding | Action inline inset / min height |
| ---- | ---------------------- | -------------- | ------------------- | ---- | ------------------ | -------------------------------- |
| S    | Small control / body S | Caption L      | 14 / 24px           | 6px  | 4px                | 8 / 30px                         |
| M    | Body S                 | Caption L      | 16 / 32px           | 8px  | 8px                | 12 / 40px                        |
| L    | Body M                 | Body S         | 20 / 40px           | 12px | 10px               | 16 / 48px                        |

Unspecified size uses the M geometry and inherited label typography. Size and line-height tokens carry the theme's typography and text scale. Media, copy, and adjacent trailing content sit centered on the row. The action plate extends into the parent's inline-start padding by its inset, keeping the label and media aligned with a neighboring static item or heading. Allow that clearance inside the owning surface. The plate ends before the trailing slot. Its radius follows the S/M/L control radius (6/8/10px in Soft and Frost, 0px in Pixel).

The caller supplies trailing content, such as text, a badge, a switch, a button, or a group of controls. The list handles placement and wrapping. Each control uses its own size, variant, and states. The specimen uses a neutral secondary button for the available recovery action and a neutral ghost button for the quieter reviewer action.

Keep the trailing group beside the main area while it fits with a 12em main basis. When space runs out, it wraps as a group below the main area, aligned to inline end. Its controls may wrap again within the available width. Both regions preserve DOM order and separate hit areas. Long identifiers can break within a word. The list applies no line limits. Consumers supply compact status labels and keep the complete value available if a child truncates its own content.

Optional 1px dividers sit strictly between visible direct items, with 2px of clearance above and below the line for record rows. The rule stays at the list's content edges. Soft uses a subtle border, Frost uses translucent ink, and Pixel uses a crisp default border. The first and last edges stay open.

## States and interaction

| Case                  | Expected experience                                                                                                                                                                                                                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Static                | No hover, pressed treatment, cursor change, or Tab stop on the main area. Clicking beside a switch or button leaves it unchanged. Static rich content can contain its own native controls.                                                                                                                                   |
| Native or router link | Directional chevron at the end of the main area. Enter follows the link. Native link gestures such as middle-click and Cmd/Ctrl-click remain available. A router integration preserves the actual anchor and destination.                                                                                                    |
| Current link          | A short 2px accent rule inset 4px at the inline start runs along the middle half of the main area. The chevron also takes the accent ink. Expose the equivalent `aria-current` state. Hover, press, and keyboard focus still apply.                                                                                          |
| Command               | A native button activates on click, Enter, and Space. Use an action label that describes the result. Supply any confirmation or status feedback from the owning surface.                                                                                                                                                     |
| Hover and press       | Tint only the active main box with primary ink at 9% on hover and 15% during press. The base layer remains visible through the tint. Hover applies on hover-capable pointers. Use a 120ms fade in Soft and Frost and an instant change in Pixel. Reduced motion is instant. No row moves when pressed.                       |
| Keyboard focus        | One inset 2px focus outline on whichever main action has focus. Sibling controls keep their own focus treatment. Tab moves through main then trailing controls in DOM order. There is no arrow-key list navigation. Main targets are at least 44px high on coarse pointers.                                                  |
| Unavailable main      | Muted label, no link chevron, main focus stop, or hover/press. Keep a visible explanation where the cause matters. Disabled commands are native disabled buttons. Disabled links are inert with link semantics and disabled state. The router element is absent while disabled. Sibling actions keep their own availability. |

Plain-text titles, descriptions and trailing facts isolate their text direction while the row keeps the surrounding layout direction. Authors control direction inside rich slots and prose. An action's primary label names it and the optional description supplies extra context. Use non-interactive phrasing content inside a main action. In forced colors, links use system link ink, disabled labels use system disabled ink, and the focus and current indicators use the system highlight. Menus, switches, and buttons in the trailing slot own their behavior and accessible name.

## Review in the workbench

- **Prose and numbering** shows native hierarchy and inherited type. **Row sizes** compares two document commands with and without dividers. **Row anatomy** compares six records with leading media, supporting text, badges and trailing facts. **Action states** pins main-area states for side-by-side inspection. Tab to **Request access** to see the trailing button's keyboard focus.
- **Independent row actions** uses live native links, a lightweight router stand-in, local command feedback, a switch, and the shared menu preview. **Rows on a floating surface** places the same live list on a floating material. Show note link reveals a link to the local notes. Pin notes changes their row description. Verify connection shows a sample successful check. Use **Long labels and trailing content** at 360px, 120% text, and RTL to see a wrapped command and its independent trailing button.
- Folio's **Document Reader** uses the family in prose and in its inspector. The **Workspace Overview** uses informational rows with diff and time metadata. **Extensions** uses a static list with independently actionable connector controls.

The specimen pins visual comparison states without moving focus. The router preview demonstrates an anchor with client-side navigation. Its state and destinations are local. The library implementation defines the final API and integration, including real router adapters and browser and assistive-technology verification.
