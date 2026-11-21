# Badge

Badge is a compact inline label for an object's status, category, version, or count. Use short, factual text so the meaning is available without color. Small badges fit running text and dense rows, medium badges fit standalone metadata, and large badges give a status more prominence.

```tsx
import { useId, useState } from 'react';
import { Badge } from '@docouno/unica';
import '@docouno/unica/styles.css';

export const verified = <Badge size="s" status="success" dot>Verified</Badge>;

export const releaseLink = (
  <Badge asChild status="accent">
    <a href="/releases/v2">v2.0</a>
  </Badge>
);

export function ReviewDetails() {
  const detailsId = useId();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Badge asChild status="info">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => setOpen((current) => !current)}
        >
          In review
        </button>
      </Badge>
      <p id={detailsId} hidden={!open}>Two reviewers are checking this release.</p>
    </>
  );
}
```

## Props

`BadgeProps` and `BadgeStatus` are available as type imports from `@docouno/unica`, including in React Server Components. Render `Badge` inside a `'use client'` boundary in a React Server Components app.

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `children` | React content, or one native element with `asChild` | Required | Supply visible text, a number, or phrasing content such as `<bdi dir="ltr">99+</bdi>`. An empty, boolean-only, or whitespace-only label renders nothing. |
| `status` | `BadgeStatus` | `neutral` | Selects `neutral`, `accent`, `info`, `success`, `warning`, or `danger` ink and fill. |
| `size` | `'s' \| 'm' \| 'l'` | `m` | Sets the type scale, spacing, and leading cue size. Minimum heights at 100% text scale are 20px, 24px, and 28px. |
| `dot` | `boolean` | `false` | Adds a decorative status dot at inline start. |
| `iconLeft` | [`GlyphSource`](icon.md) | Omitted | Takes precedence over `dot`. Accepts an SVG component or a descriptor from `defineGlyph`. The badge sets the glyph size and the glyph inherits the label ink. |
| `asChild` | `boolean` | `false` | Uses one native `<a>` or `<button>` as the root. Put the label and action-specific attributes on that element. |
| `ref` | React 19 ref | Omitted | Receives the root span or the supplied native element. The child's own ref also receives that element. |

`Badge` forwards common HTML attributes, including `id`, `className`, `style`, `hidden`, and ARIA and application data attributes. In `asChild` composition the child's props take precedence, classes and styles merge, and the child's event handler runs first. Calling `preventDefault()` in that handler skips the corresponding handler on `Badge`.

An unadorned number or a string of ASCII digits with an optional trailing `+` uses tabular digits, centered text, and compact padding. `0` is visible. The application chooses formatting, grouping, and any cap such as `99+`.

## Layout and materials

Badge aligns to the label baseline. Leading cues keep their size and follow the container's inline direction, while the label determines its own text direction. Let a group wrap between badges. To cap a long label, set `style={{ '--badge-max-width': '148px' }}` or set that custom property in CSS. The text ellipsizes and retains its full accessible text. Keep essential statuses short and give truncated categories a visible full label nearby or in their details.

Badge uses the active theme on both Base and Overlay. Soft uses a matte, borderless plate. Frost adds a rim and a halo around the dot. Pixel uses a sharp frame and square dot. A change in label, cue, or status takes effect immediately, including with reduced motion. Forced colors use system colors for the fill, border, label, and focus outline.

## Interaction and accessibility

- The default span and an anchor without `href` are passive and outside the tab order by default. The dot and glyph are decorative. A count needs a visible noun nearby or a complete accessible name on its owning control, such as “Notifications, 4 unread”.
- Use a link for the represented category or version and a button to open status details. The label is underlined. Tab reaches native actions, Enter follows links, and Enter or Space activates buttons. The browser skips disabled buttons, including buttons disabled through a fieldset. For standalone touch actions, use an enclosing control with a target of at least 44×44px and a passive Badge inside.
- A composed button defaults to `type="button"` when its type is omitted. Explicit `submit` and `reset` types follow normal form behavior. The application owns any expanded state, overlay, and focus management for the details it opens.
- Place changing badges inside your own live region when an update needs to be announced.
