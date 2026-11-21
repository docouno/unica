# Text

`Text` renders prose, labels, metadata, and inline emphasis. Use [Title](title.md) for document headings.

```tsx
import { Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ProfileField() {
  return (
    <div>
      <Text as="label" htmlFor="display-name" size="body-s" weight="medium">
        Display name
      </Text>
      <input id="display-name" name="displayName" aria-describedby="display-name-help" />
      <Text id="display-name-help" size="body-xs" color="secondary">
        Your teammates see this name in shared documents.
      </Text>
    </div>
  );
}
```

In a React Server Components app, import `Text` from a `'use client'` module. It also renders through ordinary React DOM SSR. See [Support and Accessibility](../concepts/support-and-accessibility.md#react-19--pure-esm-package-contract).

## Props

| Prop | Values | Default |
| --- | --- | --- |
| `as` | `p`, `span`, `div`, `label`, `strong`, `em` | `p` |
| `children` | React content valid inside the selected element | — |
| `ref` | React 19 ref for the selected native element | — |
| `htmlFor` | ID of the labeled native control. Available with `as="label"` | — |
| `size` | `body-l`, `body-m`, `body-s`, `body-xs`, `caption-l`, `caption-m`, `caption-s` | `body-m` |
| `weight` | `light`, `regular`, `medium`, `semibold`, `bold` | `bold` for `strong`, `regular` otherwise |
| `color` | `inherit`, `primary`, `secondary`, `muted`, `subtle`, `accent`, `info`, `success`, `warning`, `danger` | `inherit` |
| `align` | `start`, `center`, `end` | From the text context |
| `italic` | Boolean | `true` for `em`, `false` otherwise |
| `tabularNums` | Boolean. `true` enables tabular digits in fonts that provide them | From the text context when omitted or `false` |
| `truncate` | Boolean | `false` |
| `lineClamp` | Positive integer number of lines | — |

`TextProps`, `TextTag`, `TextSize`, `TextWeight`, `TextColor`, and `TextAlign` are exported from `@docouno/unica`. Native attributes, events, `className`, and `style` apply to the single root. The selected tag determines the types of `ref` and event `currentTarget`.

## Layout and accessibility

- Use body sizes for reading and captions for secondary metadata. The active preset supplies the font stack, size, and line height. Soft and Frost use Inter when available, and Pixel uses JetBrains Mono. The application supplies any webfont files, including italic faces, and the CSS stacks provide local and system fallbacks. The preset's text scale is applied once through the size tokens.
- Inherit the foreground in links, buttons, or other surfaces that already set the appropriate ink. Use semantic colors on compatible theme surfaces. In forced colors, the component's foreground follows the surrounding system color. Logical alignment follows the element's writing direction.
- A valid `lineClamp` takes precedence over `truncate` and allows wrapping inside a no-wrap ancestor. Invalid counts are ignored. Truncation needs a width constraint and uses an ellipsis at the logical line end. Inline roots become inline blocks during single-line truncation.
- Clipping preserves the underlying text. Provide enough room or an accessible way to reveal the full content if reading it is necessary. Pass a native `title` only when you want that attribute. Native `hidden` also hides clamped and truncated content.
- A label names and activates the associated control through native HTML. The control participates in submission and reset. Event handling, focus, and overlay labeling follow the native element and its containing UI.
