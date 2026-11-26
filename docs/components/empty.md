# Empty

Use `Empty` inside a resolved view when there is no content to show. Keep the collection heading, query controls, table headers, and navigation in place. Explain the reason in plain language and offer a way forward when one exists. The surrounding page, card, table cell, or overlay supplies the surface, inset, and space for focus indicators.

```tsx
import { FileTextIcon } from '@phosphor-icons/react';
import {
  Button,
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from '@docouno/unica';

function SavedReports({ onCreate }: { onCreate: () => void }) {
  return (
    <Empty>
      <EmptyMedia icon={FileTextIcon} color="accent" />
      <EmptyTitle as="h2">No saved reports</EmptyTitle>
      <EmptyDescription>Save a report to share it with your team.</EmptyDescription>
      <EmptyActions>
        <Button onClick={onCreate}>Create report</Button>
      </EmptyActions>
    </Empty>
  );
}
```

For a compact table, put `<Empty size="s"><EmptyDescription>No recent exports.</EmptyDescription></Empty>` inside the cell spanning the columns.

## Parts and props

Place the parts directly inside `Empty` in media, title, description, and action order. React fragments can group the parts. Each is optional. Whitespace-only strings, booleans, and empty arrays and fragments count as absent. A numeric zero counts as content. A custom React element counts as supplied. To use the icon as a fallback for conditional artwork, pass `null` when the artwork is unavailable.

| Part | Element and prop type | Own props |
| --- | --- | --- |
| `Empty` | `div`, `EmptyProps` | `size` (`EmptySize`) is `s`, `m`, or `l`, default `m`. `align` (`EmptyAlign`) is `start` or `center`, default `center`. |
| `EmptyMedia` | `div`, `EmptyMediaProps` | `icon` accepts a `GlyphSource`. `color` (`EmptyMediaColor`) is `muted`, `accent`, `info`, `success`, `warning`, or `danger`, default `muted`. Illustration `children` take precedence over the icon and its color. |
| `EmptyTitle` | `h1`–`h6`, `EmptyTitleProps` | `as` (`HeadingTag`) defaults to `h3`. Choose the level to fit the document outline. `size` on the root controls the visual scale. |
| `EmptyDescription` | `p`, `EmptyDescriptionProps` | Pass phrasing content such as text, emphasis, or an inline link as `children`. |
| `EmptyActions` | `div`, `EmptyActionsProps` | Pass buttons or links as `children` in reading order. |

Each part accepts `ref` for its native element and forwards applicable attributes such as `id`, `className`, `style`, `hidden`, `lang`, `dir`, and `aria-*`. Use JSX children for content. An empty root stays available as a ref target with zero intrinsic height. Set `color` on `EmptyMedia` to tint its medallion. The heading and description have their own theme foregrounds.

## Layout and media

| Measurement | S | M | L |
| --- | --- | --- | --- |
| Medallion / glyph | 40 / 24 px | 56 / 32 px | 72 / 40 px |
| Illustration maximum per axis | 80 px | 120 px | 160 px |
| Heading / description | `heading-s` / `body-s` | `heading-m` / `body-s` | `heading-xl` / `body-m` |
| Media to first text | 12 px | 18 px | 24 px |
| Heading to description | 6 px | 8 px | 10 px |
| Last content to actions | 16 px | 24 px | 32 px |

Use S inside compact cards, tables, and floating panels, M for ordinary collections, and L for page-level recovery. Logical start follows the reading direction. Actions wrap with an 8 px gap and keep their source order. Text wraps long identifiers and scales with the theme's text setting. Media dimensions and spacing follow the selected size. Gaps follow the visible parts, including when a part has `hidden` or the icon adapter renders no glyph.

The medallion adapts to Base and Overlay. Soft uses a rounded matte disc, Frost a translucent disc with a neutral rim, and Pixel a square rim. It is decorative and hidden from assistive technology. Place an `img` or `svg` directly inside `EmptyMedia` to preserve its aspect ratio within the size limit. Provide `alt=""` for a decorative image and a meaningful alternative for artwork that conveys information. Size custom illustration wrappers in the application. Increased contrast uses the standard secondary foreground for the description, and forced colors use system colors for the medallion and heading outline.

## Choose the message and action

| Situation | Example treatment |
| --- | --- |
| No items yet | Explain when items will appear. Include a creation or import action when the user can start the collection. |
| No search matches | Keep the current query visible. Offer to clear the relevant search or filters. |
| Paused, cleared, or restricted | Use plain copy with `info`, `success`, or `warning` media when it adds context. Offer a next step when available. |
| Initial request failed | Explain what failed and provide a retry when available. Use `danger` media as a supporting cue. |
| Missing or failed page | Use L. Link to a known destination for 404. For a failed load, offer retry and a secondary destination if useful. |

Use [Skeleton](skeleton.md) or [Spinner](spinner.md) until the first result resolves. Keep usable data present during refresh and show failures near that content with [Alert](alert.md) or the host's feedback pattern.

## Search, retry, and focus

- **Search.** Keep focus in the input while filtering. Put the result count in a persistent polite status region outside the replaced content. On explicit submission with zero matches, the host can call `headingRef.current?.focus()` on `EmptyTitle ref={headingRef} tabIndex={-1}`. The heading has a visible 2 px keyboard outline with a 3 px offset. Clearing restores the rows and returns focus to the input.
- **Retry.** Keep the explanation and the same `Button` mounted during the request. Pass `loading={retrying}` to the button, and report progress and failure in a persistent status region. On success, move focus to a heading in the replacement content if the focused retry control disappears. Preserve focus if the user moved elsewhere and announce the result in the persistent region.

Empty adds no automatic landmark, live announcement, tab stop, focus movement, or animation. Use [Button](button.md) for commands and [Link](link.md) or a button-shaped anchor for navigation. Actions keep their native activation, availability, and form behavior. Specify `type="submit"` or `type="reset"` on a Button when the action should operate the surrounding form. Empty itself contributes no form value.
