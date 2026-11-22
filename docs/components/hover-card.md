# HoverCard

HoverCard offers a read-only preview of the person, team, or document behind a link. Keep essential information available at the link destination. Use an interactive popover for help that requires controls or actions.

```tsx
import { HoverCard, HoverCardContent, HoverCardTrigger, Link } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ProjectOwner() {
  return (
    <HoverCard>
      <p>
        Owned by{' '}
        <HoverCardTrigger asChild>
          <Link href="/teams/database">Database reliability</Link>
        </HoverCardTrigger>
        .
      </p>
      <HoverCardContent>
        <strong>Database reliability</strong>
        <div>On-call owners for production data stores.</div>
      </HoverCardContent>
    </HoverCard>
  );
}
```

## Parts and props

| Part | Props |
| --- | --- |
| `HoverCard` | Holds one trigger and content pair without adding a DOM node. `open` controls visibility, and `defaultOpen` sets its initial uncontrolled value (default `false`). `onOpenChange` uses the [shared preview change details](tooltip.md#open-state-and-events). |
| `HoverCardTrigger` | Renders a native anchor with `href`, anchor attributes, and ordinary events. With `asChild`, one native anchor, [Link](link.md), or router link supplies the destination and forwards anchor props and ref. The ref points to the `HTMLAnchorElement`. |
| `HoverCardContent` | Takes passive content and presentation attributes such as `id`, `className`, `style`, and `data-*`. `side` is `top`, `bottom` (default), `start`, or `end`. `align` is `start` (default), `center`, or `end`. The ref points to the outer `HTMLDivElement`. |

The exported types are `HoverCardProps`, `HoverCardTriggerProps`, `HoverCardContentProps`, and `HoverPreviewChangeDetails`. Content may include static text, images, and passive status or loading indicators. Keep links, buttons, form fields, and focusable descendants in the destination or in a separate interactive surface. The preview content stays outside the accessibility tree. The link retains its accessible name, description, and native semantics.

For a link in running text, put `HoverCardContent` after the paragraph so its native `div` is valid HTML. Keep both parts under the same `HoverCard` root.

## Interaction and placement

- Mouse hover and hover-capable pen input open after 600 ms on a cold entry. Keyboard focus opens immediately. [TooltipProvider](tooltip.md#interaction) can change the delay and group the timing. HoverCard warms independently from Tooltip, and either family replaces the visible preview in the same document.
- Moving the pointer from the link to the card keeps it visible. Users can scroll a constrained card and select or copy text, including a drag that ends beyond the card. When the pointer leaves and neither trigger focus nor selection holds the card, it closes after 150 ms.
- Escape closes the preview and leaves focus in place. Tab and Shift+Tab continue through the document without a stop inside the card. Pressing outside closes it without taking over the target action.
- Ordinary click, modified click, middle click, and the first touch tap keep the link's navigation. An unavailable link suppresses its preview.
- The panel follows the link and flips or shifts to fit the visible viewport. Logical sides follow the link's direction. Short cards fit their content. A constrained card scrolls its inner reading area while the outer material stays in place.

The panel is a native manual popover. Its theme supplies fill, rim, and shadow, with immediate show and hide in normal and reduced motion. Forced-colors mode uses the system canvas and border. HoverCard follows the [shared open-state rules](tooltip.md#open-state-and-events).

[Tooltip](tooltip.md) · [Native scrollbars](../concepts/scrollbars.md) · [Workbench](../workbench.md)
