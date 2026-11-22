# Skeleton

Use `Skeleton` for known media, avatar, or layout slots and `SkeletonText` for text that has yet to arrive. Reserve the slot as soon as the request starts. A brief delay, such as 200 ms, can prevent placeholder flashes on fast responses. Replace placeholders as content arrives, including independent parts of a region. During refresh, keep usable content on screen and indicate that it is updating. An empty result or a failed request ends the loading state.

## Usage

```tsx
import { Skeleton, SkeletonText } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ReportSummary({ summary }: { summary: string | null }) {
  const loading = summary === null;
  const textStyle = {
    fontSize: 'var(--text-size-body-m)',
    lineHeight: 'var(--text-size-body-m-lh)',
    margin: 0,
  };

  return (
    <>
      <article aria-busy={loading} style={{ minBlockSize: 'calc(3 * var(--text-size-body-m-lh))' }}>
        {loading ? <SkeletonText lines={3} /> : <p style={textStyle}>{summary}</p>}
      </article>
      <p role="status">{loading ? 'Loading the report…' : 'Report loaded.'}</p>
    </>
  );
}

export function AvatarPlaceholder() {
  return <Skeleton shape="circle" width={32} />;
}
```

Match the placeholder to the loaded content's width, height, and line count to preserve layout. Reserve or clamp the ready text when wrapping can change the number of lines. In a flex row, reserve the avatar width and allow the text next to it to shrink with `min-inline-size: 0`. For media, reserve the slot's aspect ratio, set `--element-radius` to its inner corner radius, and fill it with `<Skeleton height="100%" />`.

## Props

| Component | Prop | Behavior |
| --- | --- | --- |
| Both | `width?: CSSProperties['inlineSize']` | Logical width, limited to available inline space. Defaults to `100%` for the block and text and `40px` for the avatar silhouette. |
| Both | `hidden?: boolean` | Keeps the DOM node mounted and removes it from layout while true. |
| Both | `id`, `dir`, `className`, `style`, `data-*` | Root identity, direction, styling, and instrumentation. |
| `Skeleton` | `ref?: Ref<HTMLSpanElement>` | The root `span`. |
| `Skeleton` | `shape?: 'rect' \| 'circle'` | Defaults to `rect`. The `circle` avatar silhouette follows the theme's capsule radius and is square in Pixel. |
| `Skeleton` | `height?: CSSProperties['blockSize']` | Logical height. A rectangle defaults to `16px`. An avatar defaults to a 1:1 aspect ratio. When supplied, height sets that side independently. |
| `SkeletonText` | `ref?: Ref<HTMLDivElement>` | The root `div`. |
| `SkeletonText` | `size?: SkeletonTextProps['size']` | `caption-s/m/l`, `body-s/m/l`, `heading-s/m/l/xl`, or `display-s/m/l`. Defaults to `body-m`. |
| `SkeletonText` | `lines?: number` | Defaults to three. Finite counts round down and clamp to 1–20. A single line fills the slot. The last of multiple lines takes 60% of the width from inline start. |

Nonnegative finite numeric dimensions are CSS pixels. Nonempty strings are resolved by the browser as CSS. Empty or whitespace-only strings and invalid numbers use the default or supplied root style. Set `width` or `height` to override the matching logical property in `style`. The text line box uses the matching typography token at the active text scale, with a centered bar at 72% of the font size.

## Accessibility and motion

Both components are decorative, childless, and hidden from assistive technology. They have no keyboard actions, form fields, or loading announcements. Set `aria-busy` on the part of the host that is waiting, and keep one short status outside that region. Leave adjacent controls and already available content in place. The application owns loading, retry, and focus.

The neutral fill works on canvas, Card, and overlay backgrounds. The surrounding surface supplies its own background and elevation. A soft diagonal band crosses the viewport from inline start to inline end. The lit area spreads out on wider viewports, and the angle mirrors in RTL. Active placeholders with the same reading direction share its position and phase. The band tracks layout, scrolling, and CSS changes to translation, scale, or offsets of a placeholder and its containers, including changes triggered elsewhere on the page. During the two passes, one frame callback per document samples the visible paint boxes. Each box receives an initial measurement and keeps its last geometry while offscreen. A placeholder that mounts or returns to layout during a sweep joins its current phase. After two 2.2-second passes, those placeholders rest on the same fill. Mounting placeholders or returning them to layout can start another sweep. Reduced motion shows the static fill from the start. Forced colors use a static `Canvas` fill and an inset `GrayText` outline.
