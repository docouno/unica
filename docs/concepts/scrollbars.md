# Native Scrollbars

Approved design: the [live scrollbar reference](../../apps/playground/src/prototypes/scrollbar/README.md) defines geometry, theme colors and states on ordinary surfaces and inside overlays. The shared CSS recipe lives with the prototypes; it is not a package export.

The track is transparent. A quiet neutral thumb stays subordinate to text: Soft uses 22% foreground opacity at rest, Frost 16% Dark / 18% Light, and Pixel 40%. Hovering or dragging the thumb makes it clearer. The theme producer owns separate rest, hover and active opacity tokens; component CSS does not branch on theme names.

On desktop and keyboard-only Chromium/WebKit, native scrollbar parts follow `--radius-full`: rounded Soft/Frost and square Pixel. The ordinary gutter is 14px with an 8px visible thumb; compact Popover bodies, document tabs and choice lists use 10px with a 4px thumb. Transparent borders preserve the native hit area. Explicit dimensions reserve a classic gutter, including on desktop systems that normally use overlay scrollbars. See [Chrome's scrollbar guide](https://developer.chrome.com/docs/css-ui/scrollbar-styling) for this platform tradeoff.

Touch-primary browsers and Firefox retain standard native geometry and width, with `auto` for large regions and `thin` for compact ones. Firefox does not expose CSS control over thumb corners; Pixel's square ends are not promised there. Unsupported standard properties retain system behavior, including system color on touch Safari before 26.2. There is no JavaScript scrollbar engine, wrapper viewport or event interception.

Apply the recipe to the real scroll owner. In an overlay with fixed header and footer, only Body scrolls. Reset native `[popover]` outer overflow where necessary and keep decorative layers within the bounds. The recipe itself does not introduce overflow. Reserve space for focus rings inside clipped content; opt into a stable gutter only where content width needs it.

Keyboard focus belongs to the region or its controls. Thumb hover/drag and direct region focus strengthen the indicator without changing the whole surface on pointer entry. Reduced motion needs no authored animation. Increased-contrast preferences strengthen the thumb; forced colors disable custom parts and return width/color to system `auto`. The subdued default does not claim a 3:1 non-text contrast guarantee.
