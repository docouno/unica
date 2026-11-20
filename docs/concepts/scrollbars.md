# Native Scrollbars

Import `@docouno/unica/styles.css` to use `.unica-scrollbar` on a scroll owner. Add `.unica-scrollbar--compact` on the same element for compact geometry. Each scroll owner chooses its own density, including when nested inside a compact region. The playground demonstrates the approved design with its prototype recipe. See the [live scrollbar reference](../../apps/playground/src/prototypes/scrollbar/README.md).

```tsx
import '@docouno/unica/styles.css';

export function ActivityLog() {
  return (
    <section
      aria-label="Activity log"
      className="unica-scrollbar unica-scrollbar--compact"
      style={{ maxBlockSize: '16rem', overflow: 'auto' }}
      tabIndex={0}
    >
      {/* Log entries */}
    </section>
  );
}
```

The track is transparent. A quiet neutral thumb stays subordinate to text: Soft uses 22% foreground opacity at rest, Frost 16% Dark / 18% Light, and Pixel 40%. Hovering or dragging the thumb makes it clearer. The theme producer owns separate rest, hover and active opacity tokens; component CSS does not branch on theme names.

On desktop and keyboard-only Chromium/WebKit, native scrollbar parts follow `--radius-full` with rounded ends in Soft and Frost and square ends in Pixel. The ordinary gutter is 14px with an 8px visible thumb. Tables, Popover, Modal and Drawer bodies, HoverCard reading areas, Menu lists, textareas, TopRail document tabs and choice lists use 10px with a 4px thumb. Transparent borders preserve the native hit area. Explicit dimensions reserve a classic gutter when scrolling is needed, including on desktop systems that normally use overlay scrollbars. See [Chrome's scrollbar guide](https://developer.chrome.com/docs/css-ui/scrollbar-styling) for this platform tradeoff.

Touch-primary browsers and Firefox retain standard native geometry and width, with `auto` for large regions and `thin` for compact ones. Firefox does not expose CSS control over thumb corners; Pixel's square ends are not promised there. Unsupported standard properties retain system behavior, including system color on touch Safari before 26.2. There is no JavaScript scrollbar engine, wrapper viewport or event interception.

Apply the recipe to the real scroll owner. In an overlay with fixed header and footer, only Body scrolls. Reset native `[popover]` outer overflow where necessary and keep decorative layers within the bounds. The recipe itself does not introduce overflow. Reserve space for focus rings inside clipped content; opt into a stable gutter only where content width needs it.

HoverCard reading areas and Menu lists inset the native scroll owner 4px inside the border on all four sides. The thumb clears the inline rim and the outer corners. Menu uses this inset for its row clearance. HoverCard adds 12px of inner padding to preserve its 16px content inset. The scroll owner's radius subtracts both the 1px border and 4px inset from the outer radius, clamped to zero. The same spacing applies in RTL and to system scrollbar fallbacks.

Modal and Drawer inset the scrolling body 4px from the inline boundaries and the adjacent header and footer. The body compensates for this inset in its inline padding. The compact recipe follows the scroll owner when a short window switches to whole-panel scrolling.

Horizontal panel tabs keep the inline scroll owner and use in-row chevrons at overflowing edges. The strip has a single visual row with the selection rule and chevrons. Soft and Frost fade the tabs into the clear area beside a chevron. Pixel clips the row at the straight edge of that area. See the [Tabs design reference](../../apps/playground/src/prototypes/tabs/README.md#distribution-and-overflow).

Authored scrollbar parts explicitly use the default arrow cursor, rather than inheriting a text or action cursor from the scroll owner. Content cursors and native resize cursors remain independent. Track clicks and thumb dragging stay native.

Keyboard focus belongs to the region or its controls. Thumb hover/drag and direct region focus strengthen the indicator without changing the whole surface on pointer entry. Reduced motion needs no authored animation. Increased-contrast preferences strengthen the thumb; forced colors disable custom parts and return width/color to system `auto`. The subdued default does not claim a 3:1 non-text contrast guarantee.
