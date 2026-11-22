# Native Scrollbars

The [Scrollbar reference](../components/scrollbar.md) covers the package classes, density options and keyboard setup.

The track and corner are transparent. Each scroll owner mixes its local `--fg-primary` with transparency. Themes supply internal preset opacity recipes for rest, thumb hover or direct keyboard focus, and thumb drag through `--_scrollbar-thumb-opacity`, `--_scrollbar-thumb-hover-opacity`, and `--_scrollbar-thumb-active-opacity`.

| Preset | Rest | Hover / focus | Drag |
| --- | --- | --- | --- |
| Soft Dark / Light | 22% | 36% | 48% |
| Frost Dark | 16% | 30% | 42% |
| Frost Light | 18% | 32% | 44% |
| Pixel Dark / Light | 40% | 56% | 68% |

Thumb state changes are immediate. Increased contrast raises the resting thumb to 70% and uses the full foreground for interaction. Forced colors restore system geometry and color.

On desktop and keyboard-only Chromium/WebKit, native scrollbar parts follow `--radius-full` with rounded ends in Soft and Frost and square ends in Pixel. The ordinary gutter is 14px with an 8px visible thumb. A 24px minimum thumb length applies on both axes. Tables, Popover, Modal and Drawer bodies, HoverCard reading areas, Menu lists, textareas, AppShell aside bodies and bounded canvases, the all-documents list, choice lists and the expanded Toast queue use 10px with a 4px thumb. Transparent borders preserve the native hit area. Explicit dimensions reserve a classic gutter when scrolling is needed, including on desktop systems that normally use overlay scrollbars. See this behavior in [Chrome's scrollbar guide](https://developer.chrome.com/docs/css-ui/scrollbar-styling).

Touch-primary browsers and Firefox retain standard native geometry and width, with `auto` for large regions and `thin` for compact ones. Firefox controls the shape of the thumb ends. Unsupported standard properties retain system behavior, including system color on touch Safari before 26.2. The browser owns the scroll viewport and interaction.

Apply the recipe to the real scroll owner. In an overlay with fixed header and footer, only Body scrolls. Reset native `[popover]` outer overflow where necessary and keep decorative layers within the bounds. The owner sets its own overflow. Leave space for focus rings inside clipped content and reserve a stable gutter where content width needs it.

HoverCard reading areas and Menu lists inset the native scroll owner 4px inside the border on all four sides. The thumb clears the inline rim and the outer corners. Menu uses this inset for its row clearance. HoverCard adds 12px of inner padding to preserve its 16px content inset. The scroll owner's radius subtracts both the 1px border and 4px inset from the outer radius, clamped to zero. The same spacing applies in RTL and to system scrollbar fallbacks.

Modal and Drawer inset the scrolling body 4px from the inline boundaries and the adjacent header and footer. The body compensates for this inset in its inline padding. The compact recipe follows the scroll owner when a short window switches to whole-panel scrolling.

Horizontal panel tabs keep the inline scroll owner and use in-row chevrons at overflowing edges. The strip has a single visual row with the selection rule and chevrons. Soft and Frost fade the tabs into the clear area beside a chevron. Pixel clips the row at the straight edge of that area. See the [Tabs design reference](../../apps/playground/src/prototypes/tabs/README.md#distribution-and-overflow). The open-document strip also hides its horizontal scrollbar and keeps the native scroll viewport. Its all-documents button opens a list of every open document.

Authored scrollbar parts use the default arrow cursor. Content cursors and native resize cursors remain independent. Track clicks and thumb dragging stay native.

Keyboard focus belongs to the region or its controls. Moving the pointer onto the content leaves the indicator at rest. Resting contrast varies with the theme and surface.

The expanded Toast queue keeps the dock outside the scrolling list. The list reserves 12px for card shadows and extends by the space occupied by the browser's scrollbar. The single-toast scroll owner uses ordinary density.

[WebKit added native width support in Safari 18.2](https://webkit.org/blog/16301/webkit-features-in-safari-18-2/) and [native color support in Safari 26.2](https://webkit.org/blog/17640/webkit-features-for-safari-26-2/).
