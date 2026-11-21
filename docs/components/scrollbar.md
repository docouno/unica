# Scrollbar

Unica styles the browser's scrollbar on any native scroll owner. Import the package CSS and apply the classes to the element with `overflow: auto` or `overflow: scroll`. For page scrolling, apply the class to `<html>`.

```tsx
import '@docouno/unica/styles.css';

export function ActivityLog({ entries }: { entries: string[] }) {
  return (
    <section
      aria-label="Activity log"
      className="unica-scrollbar unica-scrollbar--compact"
      style={{ maxBlockSize: '16rem', overflow: 'auto' }}
      tabIndex={0}
    >
      <ul>{entries.map((entry) => <li key={entry}>{entry}</li>)}</ul>
    </section>
  );
}
```

## Native geometry and density

| Classes on the scroll owner | Desktop Chromium and WebKit gutter / visible thumb | Standard width |
| --- | --- | --- |
| `unica-scrollbar` | 14 px / 8 px | `auto` |
| `unica-scrollbar unica-scrollbar--compact` | 10 px / 4 px | `thin` |

Ordinary density suits the page, sidebars and reading regions. Compact density suits bounded panels, lists, tables and textareas. The same recipe works on either axis. Nested scroll owners choose their density independently. The classes style the native scrollbar. The application sets the scroll bounds and overflow.

Desktop Chromium and WebKit use native parts with a transparent track and corner. A 3 px transparent border on either side of the thumb preserves its hit area. Soft and Frost use rounded ends. Pixel uses square ends. Firefox and touch-primary browsers use their standard native geometry and width. Unsupported CSS properties fall back to system behavior.

## Keyboard and system preferences

Give a standalone scroll region an accessible name and `tabIndex={0}` so users can reach it and scroll with the keyboard. For an area with focusable content, use the tab order that best serves the content. Give focus rings room inside clipped edges.

Direct keyboard focus strengthens the indicator. On desktop native parts, thumb hover and drag strengthen it independently of pointer movement over the content. Increased contrast uses a stronger thumb. Forced colors restore system width and color. State changes are immediate. The browser handles wheel, touch, keyboard, scrollbar dragging, and page find.

Open `/?item=scrollbar` in the playground to compare densities and axes. Cases include a scrolling overlay body and a named region that can toggle between fitting and overflowing. See the [scrollbar specimen](../../apps/playground/src/specimens/scrollbar/scrollbar.spec.tsx) and [native scrollbar concepts](../concepts/scrollbars.md).
