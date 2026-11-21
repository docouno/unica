# Title

`Title` renders a native heading. Pick the heading level for the document structure and the visual size for the layout. Use [Text](text.md) for paragraphs, labels, and captions.

```tsx
import { Title } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function WorkspaceTitle() {
  return (
    <Title as="h2" size="heading-m" textWrap="balance">
      Workspace preferences
    </Title>
  );
}
```

In a React Server Components app, import `Title` from a `'use client'` module. It also renders through ordinary React DOM SSR. See [Support and Accessibility](../concepts/support-and-accessibility.md#react-19--pure-esm-package-contract).

## Props

| Prop | Values | Default |
| --- | --- | --- |
| `as` | `h1` through `h6` | `h1` |
| `children` | Native heading content, including inline links and emphasis | — |
| `ref` | React 19 ref to `HTMLHeadingElement` | — |
| `size` | `display-l`, `display-m`, `display-s`, `heading-xl`, `heading-l`, `heading-m`, `heading-s`, `body-m` | By heading level |
| `weight` | `medium`, `semibold`, `bold` | `semibold` |
| `color` | `inherit`, `primary`, `secondary`, `muted`, `subtle`, `accent`, `info`, `success`, `warning`, `danger` | `inherit` |
| `align` | `start`, `center`, `end` | From the text context |
| `italic` | Boolean | From the text context |
| `tabularNums` | Boolean. `true` enables tabular digits in fonts that provide them | From the text context when omitted or `false` |
| `textWrap` | `wrap`, `nowrap`, `pretty`, `balance` | `wrap` |
| `truncate` | Boolean | `false` |
| `lineClamp` | Positive integer number of lines | — |

The default sizes from `h1` through `h6` are `display-s`, `heading-xl`, `heading-l`, `heading-m`, `heading-s`, and `body-m`. An explicit size preserves the native heading level. `TitleProps`, `HeadingTag`, `TitleSize`, `TitleWeight`, `TitleTextWrap`, `TextColor`, and `TextAlign` are exported from `@docouno/unica`.

## Layout and accessibility

- A valid `lineClamp` takes precedence over `truncate`, which takes precedence over `textWrap`. Invalid counts are ignored. `wrap` allows wrapping in a no-wrap ancestor. `pretty` and `balance` enhance ordinary wrapping when the browser supports them.
- The active preset supplies the font stack, size, and line height. The application supplies any Inter or JetBrains Mono webfont files, including italic faces. Tracking follows the preset text scale. Logical alignment and ellipsis follow the writing direction, and forced colors use the surrounding system foreground.
- A clipped heading keeps its full text and native level. The root accepts native attributes, events, `className`, and `style`, including an explicitly supplied `title` or `tabIndex`. Native `hidden` hides the heading even when overflow is constrained. Nested links keep their normal tab stops.
- To name an overlay or region from a heading, put an `id` on `Title` and reference it on the owner with `aria-labelledby`. Form participation belongs to the surrounding native controls.
