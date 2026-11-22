# Card

Card groups the content and actions of one entity on a neutral surface. Use `default` for the main bounded surface and `subtle` for supporting content. Omit any part the content does not need.

```tsx
import {
  Card,
  CardAction,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardMedia,
  CardSection,
  CardTitle,
} from '@docouno/unica';
```

## Parts and props

| Part | Native element | Props and defaults |
| --- | --- | --- |
| `Card` | `div` | `variant="default" \| "subtle"` (default `default`), `size="s" \| "m" \| "l"` (default `m`), `orientation="vertical" \| "horizontal"` (default `vertical`), `asChild` (default `false`) |
| `CardHeader` | `div` | Groups the title and description. A direct `CardAction` occupies the inline-end column. |
| `CardTitle` | `h3` | Accepts [Title props](title.md). Defaults to `as="h3"`, `size="body-m"`, and `weight="semibold"`. Choose the level from the surrounding document outline. |
| `CardDescription` | `p` | A secondary paragraph using the body S scale. |
| `CardAction` | `div` | Hosts a compact action or badge in the header. |
| `CardBody` | `div` | Flexible content group and the content column of a horizontal card. |
| `CardFooter` | `div` | `justify="start" \| "end" \| "between"` (default `between`), `withBorder` (default `false`). The row wraps when needed. |
| `CardSection` | `div` | `placement="flush" \| "inset"` (default `flush`), `withBorder` and `padded` (both default `false`). A flush section reaches the inner edge of the card. |
| `CardMedia` | `div` | `fit="cover" \| "contain"` (default `cover`), optional `aspectRatio` (a CSS aspect ratio). The prop takes precedence over `style.aspectRatio`. An unconstrained image uses its natural proportions. |

The package exports a `*Props` type for each part, plus `CardVariant`, `CardSize`, `CardOrientation`, `CardFooterJustify`, `CardSectionPlacement`, and `CardMediaFit`. Each part accepts the attributes and React 19 `ref` of its native host.

`Card asChild` accepts one `div`, `article`, `section`, or `a` element, including an adapter that forwards the attributes, children and ref to that host. The Card ref receives the host as an `HTMLElement`, and a ref on the child retains its element type. Classes, styles and event handlers compose. The child handler runs first and can use `preventDefault()` to skip the outer handler. For ordinary attributes such as `aria-labelledby`, a defined child value takes precedence.

## One link for a short card

Supply a native anchor destination and use the ID of the card's visible title as `aria-labelledby`. Keep the contents passive and give the destination a visible cue in the resting state.

```tsx
import { useId } from 'react';
import {
  Card, CardDescription, CardFooter, CardHeader, CardTitle, Icon, Text,
} from '@docouno/unica';
import { ArrowRightIcon } from '@phosphor-icons/react';

function GuideCard() {
  const titleId = useId();

  return (
    <Card asChild>
      <a href="/guides/field" aria-labelledby={titleId}>
        <CardHeader>
          <CardTitle id={titleId} as="h2">Field guide</CardTitle>
          <CardDescription>Start here for installation and examples.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Text size="caption-l" color="muted">Read the guide</Text>
          <Icon usage="slot" icon={ArrowRightIcon} size="m" directional />
        </CardFooter>
      </a>
    </Card>
  );
}
```

The whole card is one Tab stop. Enter and native link gestures follow the address. The focus outline encloses the card. Fine-pointer hover underlines the title and changes the plate and edge. Holding the link changes its fill without moving it. Reduced motion removes the color transition. Forced colors use system-colored boundaries and focus outlines.

## Separate targets for a rich card

Use a regular container when the title link, selection and actions need independent focus and activation.

```tsx
<Card asChild>
  <article>
    <CardHeader>
      <CardTitle as="h2"><a href="/guides/field">Field guide</a></CardTitle>
      <CardAction><button type="button" onClick={saveGuide}>Save guide</button></CardAction>
    </CardHeader>
    <CardBody>Installation instructions and local examples.</CardBody>
    <CardFooter withBorder justify="end">
      <label><input type="checkbox" name="export" /> Include in export</label>
    </CardFooter>
  </article>
</Card>
```

The title anchor has its own underline and focus outline. Other controls keep their native order, keyboard behavior and form participation, including submission and reset. A plain Card has a passive root. Use ordinary DOM attributes for a specifically named region or a context-menu trigger.

## Media, fallback and surfaces

Place an image directly in `CardMedia` for an inset frame. Wrap it in a flush `CardSection` to reach the card edge. Corner radii follow the enclosing frame, including square corners in Pixel. With horizontal orientation, place the media or its section first and `CardBody` second. At a content width of 28rem and above, the two columns divide the available space 1:2 after the gap. Below that width the media sits above the body. Without media the body uses the full width. RTL mirrors layout and logical corners.

Use meaningful `alt` text for informative images and `alt=""` for decorative images. Reuse the frame ratio for a loading placeholder or failure message so retrying the image preserves the layout. If there is no media, omit the frame. Only the media frame clips its contents, leaving control focus outlines outside the frame visible.

For a restricted destination, use a passive card with an explanation and any available action, such as **Request access**. A composition class can add a dashed edge.

```css
.restricted-card {
  border-style: dashed;
  box-shadow: none;
}

.restricted-card::after {
  display: none;
}

@media (forced-colors: active) {
  .restricted-card {
    border-color: GrayText;
  }
}
```

Card adapts to the closest [Base or Overlay surface](../concepts/themes-and-roles.md#contextual-surface-adaptation-base-vs-overlay). A Frost overlay lets the panel material show through the card. The panel provides blur and elevation. A Card establishes neutral ink for contextual actions and inline code inside it while preserving the surrounding surface kind.
