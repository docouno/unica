# Spinner

`Spinner` shows local activity when the amount of work is unknown. Pair it with visible text that names the operation. For measured work, use [Progress or ProgressCircle](progress.md).

```tsx
import { Spinner } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function SaveIndicator({ saving }: { saving: boolean }) {
  return (
    <span>
      {saving && <Spinner size="s" delay={150} />} {saving ? 'Saving changes…' : 'Changes saved'}
    </span>
  );
}
```

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `size` | `SpinnerSize` | `inherit` | `inherit` follows the surrounding font at `1em`. `s`, `m`, and `l` match the 14, 16, and 20 px icon slots. |
| `tone` | `SpinnerTone` | `inherit` | `inherit` uses the surrounding text color. `neutral`, `muted`, and `accent` use theme foreground colors. |
| `delay` | `number` | `0` | Milliseconds from entry into layout. The SVG reserves its space immediately. Changing the prop updates the threshold on the existing timeline while the SVG stays in layout. Negative and non-finite delays are treated as zero. |
| `aria-label`, `aria-labelledby` | `string` | — | Give a standalone glyph a name when it conveys information that is absent from the surrounding text. |
| `aria-hidden` | React ARIA boolean | — | `true` keeps even a named glyph decorative. |
| `ref` | `Ref<SVGSVGElement>` | — | React 19 ref to the SVG. Native placement attributes such as `id`, `className`, and `style` also target this element. |

The SVG contains the track and moving arc in Soft and Frost, and an eight-cell trail in Pixel. The same size and tone work on base and overlay surfaces. Right-to-left layout preserves the clockwise reading of the glyph. Reduced motion uses a still arc or trail and preserves the reveal delay. Forced colors use system paint for the visible drawing. Removing the SVG from layout with `hidden` or `display: none` starts a fresh reveal when it returns.

Without an accessible name, the glyph is decorative. A named glyph has the `img` role. The delay affects paint only. Use the surrounding region for `aria-busy` and operation announcements. Spinner is passive in keyboard navigation and forms. It has no focus stop or submitted value, and form resets leave its state to the application.
