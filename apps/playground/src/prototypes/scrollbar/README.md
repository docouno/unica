# Native scrollbar design reference

The design was approved on 2026-11-15. Open `/?item=scrollbar` in the playground to inspect the prototype recipe. Applications can use the utilities shipped in `@docouno/unica/styles.css`. See [Native Scrollbars](../../../../../docs/concepts/scrollbars.md).

## Purpose and appearance

Keep the position indicator subordinate to the content and its surface. The track and two-axis corner are transparent, with no rail, shadow, glow or accent color. Soft uses a quiet warm neutral thumb; Frost is lighter still so the scrollbar does not cut through the glass. Pixel has a firmer rectangular indicator with square ends.

The theme producer in `packages/ui/src/styles.css` owns three opacity tokens. Each scroll owner mixes its current `--fg-primary` with transparency, so nested themes resolve locally and the actual surface remains visible through the thumb.

| Preset             | Rest | Thumb hover / region keyboard focus | Thumb drag |
| ------------------ | ---- | ----------------------------------- | ---------- |
| Soft Dark / Light  | 22%  | 36%                                 | 48%        |
| Frost Dark         | 16%  | 30%                                 | 42%        |
| Frost Light        | 18%  | 32%                                 | 44%        |
| Pixel Dark / Light | 40%  | 56%                                 | 68%        |

The tokens are `--scrollbar-thumb-opacity`, `--scrollbar-thumb-hover-opacity` and `--scrollbar-thumb-active-opacity`. Hovering the content does not brighten the thumb; pointing at the thumb does. Changes are immediate, with no fade, scale or animated width. Drag takes priority over hover and keyboard focus.

The subdued resting indicator deliberately prioritizes visual hierarchy; it is not a guaranteed 3:1 non-text contrast treatment. Review it on the rendered surface, particularly Frost. Increased-contrast preferences use a 70% thumb, then full foreground on hover/focus/drag. Forced colors return entirely to system rendering. These modes do not establish blanket WCAG conformance for the quieter default.

## Native geometry and density

Desktop and keyboard-only Chromium/WebKit expose native scrollbar parts through `::-webkit-scrollbar`. The recipe uses those parts to follow `--radius-full`: rounded Soft/Frost, `0px` Pixel. Standard `scrollbar-color` and `scrollbar-width` are reset to `auto` in this path because non-auto values suppress the pseudo-element styles.

| Owner                                                                    | Scrollbar gutter | Visible thumb | Standard fallback |
| ------------------------------------------------------------------------ | ---------------- | ------------- | ----------------- |
| Page, sidebar, reading region, CodeBlock                                 | 14px             | 8px           | `auto` width      |
| Table, PopoverBody, DialogBody, Textarea, document tabs, bounded choices | 10px             | 4px           | `thin` width      |

A 3px transparent border on each side supplies breathing room while retaining the native thumb's full hit area. The minimum thumb length is 24px; its actual length follows the content ratio. The track has no authored end buttons. The same dimensions apply to both axes. Explicit pseudo-element dimensions reserve a classic gutter on desktop, including systems that normally use overlay scrollbars; this is an intentional cost of controlling the shape. Content that fits still has no scrollbar because the owner uses `overflow: auto`.

Touch-primary browsers keep standard native color/width styling and system geometry, hiding and touch inertia. Firefox also uses the standard path: CSS cannot force square thumb ends there. Pixel's square geometry is therefore a Chromium/WebKit desktop treatment, not a cross-browser promise. Native wheel, touch, keyboard movement, selection autoscroll and browser find remain intact in both paths. No event interception or extra scroll viewport is added.

## States and placement

- Rest: a quiet position indicator, visible when the platform paints a scrollbar.
- Thumb hover and drag: the dedicated theme colors become clearer without recoloring the content area. Standard fallback browsers own their native feedback.
- Pointer: authored scrollbar parts explicitly use `cursor: default`, independent of a text, link, or other cursor on their scroll owner. Native track clicks and thumb dragging keep their scrolling behavior; the content keeps its own cursor. A native resize handle retains its browser-owned directional cursor.
- Keyboard: focus belongs to the scroll region or its normal controls. A directly focused region retains its visible focus ring and strengthens its thumb.
- Forced colors: both standard properties return to `auto`; custom pseudo-element styles are inactive, restoring system geometry and colors.
- Increased contrast: a stronger thumb without additional motion. Reduced motion needs no special animation override.
- Popover: Body is the scroll owner inside the panel padding. Header, Close and footer stay outside it. The outer native `[popover]` must not introduce a second scrollbar, and decorations must not enlarge scroll bounds.
- Modal and Drawer: Body owns the compact scrollbar and sits 4px inside the surface and adjacent header and footer. When the entire panel scrolls on a short viewport, it takes over the compact scrollbar.
- Keep a useful gap between text and thumb. The examples reserve 4px for inner focus rings; list rows add 8px inline. Textareas retain their own native internal scroll area.
- Let the browser place the scrollbar in RTL; code remains LTR inside an RTL layout. Do not draw a separate physical-right rail.
- Do not set `scrollbar-gutter: stable` globally. A consumer may reserve stable space when it needs width stability. Extreme-height fallbacks belong to the containing component.

## Live reference and consumers

Open `base` in Usage for ordinary examples. Cases `overlay`, `states`, and `axes` show ordinary and compact density, body-only scrolling in a pinned Popover, content that fits, keyboard focus and both axes. The checkbox changes real content length. The browser renders and operates every thumb; no simulated drag handle is used.

The shared `.scrollbar-proto` class in `scrollbar.css` is connected to PopoverBody, DialogBody, AppShell document tabs, TableScroll, CodeBlock, Textarea, TagsInput and choice panels. Compact owners set both `--scrollbar-size: 10px` and `--scrollbar-width: thin` for the two platform paths. These are shared density settings; a consumer adjusts the scroll viewport's placement through its own layout rather than copying thumb rules. TagsInput keeps a real compact track 4px from its inner field edge by extending the viewport into its content padding, while keeping the draft and Add in place. This placement uses the same 10px gutter, 4px thumb, and 3px transparent thumb border; it does not introduce another scrollbar style. Ordinary owners use the defaults. AppShell asides remain normal document flow and do not gain a scroll container. `--scrollbar-thumb` can locally override the resting color; it is not a decorative component prop. The portable workbench shell is separate from these product surfaces.

A standalone reading region needs an accessible name and `tabIndex={0}` for cross-browser keyboard access; an area containing normal focusable controls does not automatically need an extra tab stop. An application's page scrollbar belongs to `<html>`, not `<body>`. The recipe does not style the workbench document scrollbar.

## Platform and library handoff

Use separate feature queries for standard color, standard width and native pseudo-element support. The geometry treatment is excluded on touch-primary devices and in forced colors. Safari 18.2 added standard width support; standard color arrived in Safari 26.2. Earlier touch Safari retains system color. Desktop WebKit can use the pseudo-element treatment without those standard properties.

The package exports `.unica-scrollbar` and `.unica-scrollbar--compact` through its CSS entry. The live reference and existing playground consumers still demonstrate the design with `.scrollbar-proto`. Their migration to the package classes is tracked in [the scrollbar integration issue](https://github.com/docouno/unica/issues/96).

Sources: [Chrome scrollbar styling](https://developer.chrome.com/docs/css-ui/scrollbar-styling), [CSS Scrollbars Level 1](https://drafts.csswg.org/css-scrollbars/), [CSS Overflow: scrollbar gutter](https://drafts.csswg.org/css-overflow-3/#scrollbar-gutter-property), [Safari 18.2](https://webkit.org/blog/16301/webkit-features-in-safari-18-2/), [Safari 26.2](https://webkit.org/blog/17640/webkit-features-for-safari-26-2/).
