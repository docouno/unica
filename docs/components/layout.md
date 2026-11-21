# Layout

Use `Box`, `Flex`, `Stack`, `Grid`, `GridItem`, and `Container` to compose structural layout with Unica's spacing scale. Import `@docouno/unica/styles.css` once in your browser entry.

```tsx
import { Box, Container, Grid, GridItem, Stack } from '@docouno/unica';

export function OverviewPage() {
  return (
    <Box as="main" aria-labelledby="overview-title" paddingBlock={{ mobile: 'm', desktop: 'xl' }}>
      <Container size="l">
        <Stack gap="m">
          <h1 id="overview-title">Overview</h1>
          <Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="m">
            <GridItem span={{ mobile: 1, desktop: 2 }}>Activity</GridItem>
            <GridItem>Upcoming events</GridItem>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}
```

## Responsive values

Props marked responsive accept either a scalar or a readonly `Responsive<T>` map. A scalar applies at every width. A map can specify any subset of the following viewport breakpoints.

| Key | Minimum viewport width |
| --- | --- |
| `mobile` | 0px |
| `tablet` | 768px |
| `desktop` | 1024px |
| `wide` | 1440px |

The most recent value applies until the next supplied one. Before the first supplied key, the component uses its default. An empty map is equivalent to omitting the prop. Each layout root resolves its own props, so nested components retain their own defaults while inheriting the theme's spacing tokens.

Responsive values are serialized to CSS custom properties during render. The stylesheet and media queries resolve the first paint, even before React hydrates.

```tsx
import { renderToString } from 'react-dom/server';
import { OverviewPage } from './OverviewPage.js';

const markup = renderToString(<OverviewPage />);
```

Place the markup in the app root on the server. Serve the built stylesheet for `@docouno/unica/styles.css` and link its asset URL in the HTML head so the first paint includes layout. Call `hydrateRoot(root, <OverviewPage />)` with the same props on the client.

All spacing props use `0 | 'xs' | 's' | 'm' | 'l' | 'xl'` for 0, 4, 8, 16, 24, and 32px in the default themes.

## Native roots

All six components render one native root and forward its normal HTML props, events, `className`, `style`, and React 19 `ref`. `Box` defaults to `div` and accepts the static tag choices `div`, `span`, `section`, `article`, `aside`, `main`, `header`, `footer`, and `nav`. The other five render a `div`.

The components leave DOM reading order, keyboard focus order, and descendant form participation to HTML. Name a landmark where appropriate. Keep visual reordering from obscuring the order in which a keyboard or screen reader user encounters content. Use the native boolean `hidden` prop to collapse a root and its descendants.

Use ordinary CSS classes or inline styles to adapt the root. The library's display rules have zero specificity. The native cascade also allows your CSS to override `hidden`, so scope a display override to visible elements if you want to preserve it.

```css
.summary-row:not([hidden]) {
  display: inline-flex;
}
```

## Box

| Prop | Values | Default |
| --- | --- | --- |
| `as` | Native tag listed above | `div` |
| `display` | Responsive `block`, `inline`, `inline-block`, `flow-root`, or `none` | Native tag display |
| `padding`, `margin` | Responsive spacing | Native style |
| `paddingInline`, `paddingBlock`, `marginInline`, `marginBlock` | Responsive spacing for the named logical axis | Group value |
| `paddingInlineStart`, `paddingInlineEnd`, `paddingBlockStart`, `paddingBlockEnd`, and the matching `margin*` props | Responsive spacing for the named logical side | Axis or group value |

For each logical side, its own active value takes precedence over the axis and then the group. For example, `padding="m" paddingInline="s" paddingInlineStart={0}` gives 16px along the block axis, 8px at inline-end, and 0 at inline-start. Inline-start is on the right in RTL.

## Flex and Stack

| Prop | Responsive values | Flex default | Stack default |
| --- | --- | --- | --- |
| `direction` | `row`, `row-reverse`, `column`, `column-reverse` | `row` | `column` |
| `align` | `start`, `center`, `end`, `stretch`, `baseline` | `stretch` | `stretch` |
| `gap` | Spacing scale | `0` | `0` |
| `wrap` | `nowrap`, `wrap`, `wrap-reverse` | `nowrap` | — |
| `justify` | `start`, `center`, `end`, `space-between`, `space-around`, `space-evenly` | `start` | — |

`Stack` accepts a `divider` node. It inserts that node between adjacent children, including when a child or divider is the number zero. Arrays and explicit React fragments are transparent. Empty strings, empty fragments, null, undefined, and booleans are skipped. A custom component occupies one position. Use stable keys for lists and choose the divider's native semantics, such as `<hr />` for a thematic break or `<span aria-hidden="true" />` for decoration.

## Grid and GridItem

`Grid` takes responsive `columns` from 1 through 12 and responsive `gap` (default 0). Each column is an equal-width track that can shrink to zero. `flow` sets native auto-placement to `row` (default) or `column`.

Without an area map, `Grid` defaults to one column. An optional `areas` array describes a fixed map, one string per row. A dot marks an empty cell. Named cells must form rectangles. All rows must have the same width, and any supplied column counts must match that width across breakpoints. The map sets the default column count.

```tsx
<Grid areas={['nav body body', 'nav foot .']} gap="s">
  <GridItem area="nav">Navigation</GridItem>
  <GridItem area="body">Updates</GridItem>
  <GridItem area="foot">More information</GridItem>
</Grid>
```

Auto-placed `GridItem`s occupy one column by default. Use responsive `span` (1 through 12) to occupy more columns. Keep it within the current column count. Use a literal `area` name for a named placement and omit `span` on that item. Grid layout adds no ARIA widget semantics.

## Container

| Prop | Values | Default |
| --- | --- | --- |
| `size` | Responsive `s` (720px), `m` (960px), `l` (1280px) | `m` |
| `gutter` | Responsive spacing applied to both inline sides | `m` |
| `centered` | Boolean | `true` |

The container fills the available inline width up to its size limit, including both gutters. Gutters shrink equally if there is less room than their combined width. Set `centered={false}` to align it to the parent's inline-start edge.
