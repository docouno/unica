# Breadcrumb design reference

Open **Breadcrumb** in the Workbench. **Sizes and separators** and **Link underlines** compare the same trail across all six presets. **Path anatomy** includes a current permalink whose underline remains visible beside plain ancestor links. **Link states** starts with a live trail and follows with comparison rows. **Narrow and long paths** stresses a trail at up to 320 px of available space. **Ancestor trail above a panel title** shows the same component on a floating surface. For a full header, open **Workspace Overview**, **Document Reader**, or **Rich Editor**.

## Use and anatomy

Breadcrumb is secondary navigation through an existing hierarchy. Place it above the heading or in a workspace header. Use an ancestor-only trail if the heading already identifies the current page and repeating it adds no context. A single page label is supported when the header needs to show the current location. The trail sits directly on its host surface.

| Part             | Intended experience                                                                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Breadcrumb`     | A named navigation landmark with an ordered list. Omit the landmark when the trail is empty. The default name is “Breadcrumb”. Localize it or reference a visible label, and give separate trails distinct names if both are present. |
| `BreadcrumbLink` | A real link to an ancestor or an explicitly marked current permalink. An icon-only root uses the standard Icon, a recognizable glyph such as Home, and a localized accessible name on the link.                                       |
| Static group     | Plain secondary hierarchy text where no destination exists. It uses muted ink, regular weight, and the same alignment as other labels.                                                                                                |
| `BreadcrumbPage` | Static current location in primary ink at weight 600. It announces the current page without adding a keyboard stop.                                                                                                                   |
| Separator        | A muted slash before each item after the first. A decorative Icon can replace the slash. A spacing-only trail keeps the combined space on either side of the slash. Decorative separators are hidden from assistive technology.       |

Current location is explicit. A trail of ancestor links remains fully navigable even if its last item precedes the page title elsewhere. Use a single current item per trail. Routing history, permission checks, and post-navigation focus belong to the application.

## Geometry and material

| Size        | Type token | Inline gap on each side of a separator | Root glyph at 100% |
| ----------- | ---------- | -------------------------------------- | ------------------ |
| S           | Caption L  | 8 px                                   | 14 px              |
| M (default) | Body S     | 8 px                                   | 15 px              |
| L           | Body M     | 12 px                                  | 16 px              |

Follow the selected type token's line height and the theme's base font. Separator icons inherit 1 em. The slash uses 82% muted ink over the underlying surface. Links and noninteractive labels align on the first line. The visual text starts flush with the container. Center an icon-only root within its hit area.

Allocate at least 24 × 24 CSS px per link with a fine pointer and 48 × 48 CSS px with a coarse pointer. Center the first line in that row height. Continue a long label below its first line inside the same hit area. Keep 4 px between trail rows and avoid overlapping activation areas. The outer focus outline fits within the spacing of the header or panel.

Wrap between complete items when they fit on a fresh row. Keep the separator with the following item and align it to the item's first line. A label wider than a full row wraps at normal text breaks first. An unbroken identifier can split at any character as a last resort. Align continuation lines under their label. All ancestors remain available at narrow widths. RTL starts at the right, preserves root-to-leaf reading and focus order, and mirrors directional icons. A slash and a Home glyph retain their shape. Mixed-direction user content can use bidi isolation within its label.

Soft and Frost use Inter and a short color fade on hover entry and release. Frost gets its appearance from the glass surface beneath it. Pixel uses JetBrains Mono, produces rectangular focus corners, and switches states immediately. Press feedback starts immediately in all presets. State changes preserve layout and leave the background clear. Reduced motion makes every state change immediate.

## Link feedback

| State             | Intended treatment                                                                                                                                                                                                                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rest and visited  | Secondary ink. The default one-pixel underline uses 58% of the link ink, a 0.2 em offset, and native skip-ink. Previously visited links retain the same treatment.                                                                                                                                              |
| Hover             | Primary ink and a full-ink underline where the selected mode permits it. A current permalink also gains full line ink.                                                                                                                                                                                          |
| Pressed           | The active link uses the theme's soft accent foreground. The underline keeps its thickness. The link and adjacent items stay in place.                                                                                                                                                                          |
| Keyboard focus    | A 2 px theme focus outline with a 2 px offset and the theme's extra-small radius. The outline adds to hover or press and surrounds the entire link, including wrapped text.                                                                                                                                     |
| Current permalink | The same primary ink and weight 600 as the static page, plus a permanent one-pixel line at 76% of its ink. The link keeps native interaction. An icon-only current link uses primary ink and the shared focus outline.                                                                                          |
| Unavailable       | Readable ink between the muted and disabled foregrounds, with no underline or state feedback. The link is exposed as disabled and has no destination or Tab stop. A disabled current item retains its current meaning and semibold weight. Prefer the static page part when the current location has no action. |

`Always` is the default, especially when links and static groups share a trail. `Hover` adds the line on hover, keyboard focus, and press. A coarse pointer without hover keeps the resting line. `None` suits a clearly identifiable group of links, with a color response on hover and an outline on keyboard focus. The current permalink retains its line across all modes. Icon-only links have no underline.

Tab and Shift+Tab follow enabled links in document order. Enter follows the address. Space keeps native scrolling. Context menus, open-in-new-tab gestures, and modified clicks follow the browser's ordinary link behavior. In forced colors, use LinkText for available links, CanvasText for static content, GrayText for unavailable links, and Highlight for focus. Weight and underlining retain their structural meaning.

## Preview and handoff

Live ancestor links open the workspace and document collection scenes. The current permalink opens the document reader. Copyable examples accept destination addresses for the consuming application. Clearing the current page in Playground leaves the named navigation with both ancestor links. Hover, press, and focus in the comparison rows are visual pins. The panel above the title stays open for inspection. Folio uses the same small trail in its workspace headers. The header gives its actions a separate row when the sidebar and actions together leave too little room for the trail. Link a segment when the Workbench has a matching destination and show the other ancestors as static groups.

The next stage owns the library API and reusable router composition. Addressable links retain native navigation semantics. When a router link becomes unavailable, omit the router child and its render callback so the path does not prefetch or navigate. The shipped list should flatten groups of children in fragments, omit empty nodes, and preserve a numeric zero label.
