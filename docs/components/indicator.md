# Indicator

Indicator attaches a count or activity dot to a corner of one host, such as a button, avatar, or glyph. The marker stays outside the layout flow. Use an inline [Badge](badge.md) for quantities in text, clipped rows, and densely packed toolbars.

```tsx
import { Indicator } from '@docouno/unica';
import type { IndicatorPosition, IndicatorProps, IndicatorStatus } from '@docouno/unica';
import '@docouno/unica/styles.css';

function Notifications({ unread }: { unread: number }) {
  return (
    <Indicator count={unread} size="s">
      <button type="button" aria-label={`Notifications, ${unread} unread`}>
        Notifications
      </button>
    </Indicator>
  );
}
```

## API

| Prop | Values | Default and behavior |
| --- | --- | --- |
| `children` | `ReactElement` | Required. Supply one host with a measurable outer DOM box that can sit inside a span. Avoid fragments, `display: contents`, and external margins on the host. |
| `dot` | `true \| false` | `false`. Set `true` for a static dot. Dot mode excludes `count`, `max`, and `showZero`. |
| `count` | `number \| null \| undefined` | Omitted, `null`, or `undefined` means the quantity is unavailable. Accepts safe integers greater than or equal to zero. |
| `max` | `number` | `99`. Accepts a positive safe integer. Counts above it show the cap followed by `+`. |
| `showZero` | `boolean` | `false`. Set `true` to display an explicit zero. |
| `position` | `'top-end' \| 'top-start' \| 'bottom-end' \| 'bottom-start'` | `'top-end'`. Inline start and end follow the writing direction. |
| `status` | `'neutral' \| 'accent' \| 'info' \| 'success' \| 'warning' \| 'danger'` | `'accent'`. Pick a status for its meaning. Accent fits new activity, neutral fits ordinary counts, and warning and danger signal actual caution or urgency. |
| `size` | `'s' \| 'm' \| 'l'` | `'m'`. Counters start at 16, 20, or 24px and grow with the theme’s text metrics. Dots are 6, 8, or 12px. |
| `overlap` | `'rectangular' \| 'circular'` | `'rectangular'`. Circular overlap insets the anchor along a theme-shaped avatar. It follows the square corner in Pixel. |
| `width` | `'auto' \| 'full'` | `'auto'`. Full width stretches the wrapper and a host that accepts a flexible width. |
| `withBorder` | `boolean` | `true`. Paints a 2px separator outside the marker box. |
| `visible` | `boolean` | `true`. Set `false` to remove the marker while keeping the host in place. |
| `ref`, span attributes | React 19 `ref` and native span props | The ref receives the wrapper `HTMLSpanElement`. Standard attributes, classes, styles, and handlers apply to the wrapper. |

An invalid count or cap hides the numeric marker. At `max` the marker still shows the exact count. Above `max` it shows text like `99+`, with the digits and plus sign kept in left-to-right order. Supply the real quantity in the host’s label whenever it matters.

## Interaction and accessibility

The host keeps its own DOM node, ref, pointer and keyboard behavior, focus, and form participation. Clicks inside the host still reach it under the marker. The part of the marker outside the host does not enlarge its hit target. A disabled or busy host can retain a known count. The calling application owns the data and decides when it is stale.

Keep required native parent relationships intact. For example, leave a `summary` inside its `details` and wrap the summary’s label or glyph with Indicator.

The marker is hidden from assistive technology and adds no focus stop. Include the meaning in the host’s accessible name or in adjacent text. Use visible text with presence dots, for example “Available” or “Away.” Use a separate polite status if the application needs to announce an important change. Updates are immediate at every motion preference. Forced colors use system fill, ink, and an outline.

The wrapper accepts React’s boolean `hidden` prop. Hiding the wrapper or its direct host also hides the marker. For native find-in-page or fragment reveal, set `hidden="until-found"` on the wrapper or the direct HTML host via the DOM. Browsers that implement the attribute handle reveal and focus according to their native behavior. In other browsers the element stays hidden until the attribute is removed.

## Surfaces and clearance

The separator defaults to the canvas color. On a standard `data-surface="overlay"` it uses the opaque RGB pigment of the overlay background where relative colors are supported, with the overlay background color as the fallback. A nested `data-surface="base"` restores the canvas default. Set the inherited `--indicator-separator-color` on a rail, card, or custom surface to match the local material. A nested theme or standard surface starts with its own default. Set the property on that boundary or inside it to override that default. A translucent custom surface can use a solid separator to keep the edge clear over images.

Reserve space for the largest marker you expect. A count grows around its anchor and may overhang or partially cover the host’s focus outline. In a tight icon rail use size S with a cap of 9 and attach it to the glyph inside the button so the button retains its full hit area. The component follows normal ancestor clipping and stays at the specified corner when space runs out.
