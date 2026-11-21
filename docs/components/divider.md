# Divider

Divider adds a thin boundary between sections or action groups. A horizontal divider can carry a short connecting phrase between alternative paths.

```tsx
import '@docouno/unica/styles.css';
import { Divider, type DividerProps } from '@docouno/unica';

const boundary = {
  decorative: false,
  'aria-label': 'Account sections',
} satisfies DividerProps;

<Divider />;
<Divider {...boundary} />;
<Divider orientation="vertical" />;
<Divider label="or continue with email" labelPosition="center" />;
```

## Props

| Prop | Type and default | Behavior |
| --- | --- | --- |
| `orientation` | `'horizontal' \| 'vertical'`, default `'horizontal'` | The line's axis. Labels are horizontal. |
| `label` | `string` | A short phrase. Empty or whitespace-only text falls back to a decorative horizontal line. |
| `labelPosition` | `'start' \| 'center' \| 'end'`, default `'center'` | Logical position for a label. Center has two equal line segments. Start and end have one segment on the opposite side. |
| `decorative` | `boolean`, default `true` | Applies to a plain line. Set `false` to expose a static separator to assistive technology. |
| `aria-label`, `aria-labelledby` | `string` | Optional names for plain lines with `decorative={false}`. A valid `aria-labelledby` takes precedence when both are supplied. |
| `ref` | `Ref<HTMLDivElement>` | References the same outer element across all configurations. |
| `id`, `className`, `style`, `dir`, `lang`, `hidden`, `data-*` | Root attributes | `hidden` removes the divider from layout and the accessibility tree. The `data-unica-divider-*` namespace belongs to the component. |

The labeled form accepts plain text. Place headings and interactive content in the surrounding layout.

## Layout and material

A horizontal divider fills the available inline space. In a flex or grid row a vertical divider stretches across the row by default. The parent sets its length, inset, and spacing. For example, apply block margins to shorten a vertical divider between taller controls. When a toolbar wraps, keep the divider and its adjacent groups in the same row.

The line is 1 CSS pixel. The nearest explicit `data-surface` selects the color token for a plain horizontal line. Base uses `--border-subtle` and Overlay uses `--border-default`. Labeled and vertical lines use `--border-default` on either surface. Colors resolve in the divider's local theme.

The label uses caption-l typography and `--fg-muted`. It wraps and follows the inherited direction. Allow 48px beyond the text for the tails and gaps of a centered label, or 24px for an edge-aligned label. With forced colors active, the line and text use CanvasText.

## Accessibility

Decorative lines are hidden from assistive technology. A semantic horizontal line exposes the native `hr` separator. A semantic vertical line exposes `separator` with vertical orientation. A labeled divider exposes its phrase once in the normal reading order. Its line segments are decorative.

Divider is static and skipped by Tab. It has no animations or form state and contributes no form values. Inside an overlay it follows the surface of its host and leaves focus and dismissal to that host.
