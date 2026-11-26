# Tag

Tag represents an assigned label, filter, recipient, or other value with one remove action. Use [Badge](badge.md) for passive metadata. [TagGroup](#taggroup) adds wrapping, keyboard navigation, and optional disclosure.

```tsx
import { Tag, TagGroup } from '@docouno/unica';
import type {
  TagGroupItem,
  TagGroupMessages,
  TagGroupProps,
  TagProps,
  TagSize,
  TagStatus,
} from '@docouno/unica';
```

## Standalone Tag

```tsx
<Tag removeLabel="Remove documentation" status="info" onRemove={removeDocumentation}>
  Documentation
</Tag>
```

| Prop | Type and behavior |
| --- | --- |
| `children`, `textValue` | A nonempty string or passive phrasing content. With rich content, supply a nonempty string `textValue` with the full label. |
| `removeLabel` | Required localized name for the native button. Include both the action and the full value, for example “Remove Release verification workflow”. |
| `onRemove` | Required `() => void` that requests removal. The owner decides when the value disappears. |
| `size` | `s \| m \| l`, default `m`. |
| `status` | `neutral \| accent \| info \| success \| warning \| danger`, default `neutral`. The status describes the assigned value. |
| `iconLeft`, `removeIcon` | Decorative `GlyphSource` values. The remove icon defaults to the built-in close glyph. |
| `disabled` | Disables the native remove button while keeping the value readable. |
| `loading` | Shows a spinner and blocks removal requests while retaining the button and its focus. Disabled takes precedence. |
| `ref`, `removeRef` | React refs for the root span and remove button. |
| `removeTabIndex` | `0 \| -1`, default `0`. An editor can set `-1` and own the keyboard route to the button. |

The root span accepts passive HTML attributes such as `id`, `className`, `style`, `hidden`, `dir`, `aria-describedby`, consumer data attributes, and focus or keyboard handlers. The label accepts text and passive phrasing such as `<strong>` or `<bdi>`. Put links, buttons, and editable content outside the Tag. The label and leading icon are passive. The remove button supports native Enter, Space, click, and tap. An invalid label, remove name, or missing handler leaves the standalone action unavailable and emits a development warning.

The standalone label ellipsizes when it runs out of room. Set the `--tag-max-width` style hook to a CSS length such as `18ch` for a local width cap. The tag reserves space for the remove target, leading icon and padding even if the cap is smaller. Hover the clipped label or focus its remove button to see the full value in a [Tooltip](tooltip.md). With a tooltip inside a [Popover](popover.md), Escape first dismisses the tooltip. Provide a full-value view when users need to distinguish clipped values on touch or reach them by keyboard while removal is disabled. The full removal name is available to assistive technology independently of the tooltip.

## TagGroup

| Prop | Type and behavior |
| --- | --- |
| `items` | Required `readonly TagGroupItem[]` in reading order. Each item has a unique nonempty `id`, `label` with the same `textValue` rule as Tag, and `removeLabel`. Optional fields are `status`, `iconLeft`, `removeIcon`, `disabled`, and `loading`. The group keeps the first valid item for each ID. |
| `onRemove` | Required `(id: string) => void`. Confirm the request by removing that ID from `items`. |
| `aria-label`, `aria-labelledby` | Provide a nonempty accessible name for the toolbar. When both are present, a valid `aria-labelledby` reference takes precedence. |
| `size`, `disabled` | Shared Tag size and removal availability. Group-level `disabled` leaves disclosure available. |
| `maxVisible` | Show all by default. Finite values round down with a minimum of one. Disclosure counts all valid hidden items, including disabled values. |
| `expanded`, `defaultExpanded`, `onExpandedChange` | Control disclosure, set its initial uncontrolled state (default false), or handle a requested change. The disclosure appears when the collection exceeds `maxVisible`. |
| `emptyFocusRef` | Optional ref to a focusable element that can receive focus when all internal actions are unavailable. The named toolbar is the fallback. |
| `messages` | `Partial<TagGroupMessages>` with visible strings `empty`, `less`, and `more(count)`, accessible names `lessLabel` and `moreLabel(count)`, and a polite announcement formatter `removed(labels)`. Omitted entries use English. When you customize the visible disclosure text without its accessible name, that text also supplies the name. Start any custom accessible name with the visible text so users can activate the button by voice. |
| `ref` | React ref to the toolbar div. |

The toolbar wraps whole values with an 8 px gap. Override the gap with `--tag-group-gap`. Tab enters at the last available action or the first available action on initial entry. Shift+Tab and Tab leave the toolbar in normal document order. Left and Right move between available actions in reading order, mirrored in RTL. Home and End move to the ends. Delete and Backspace request removal of the focused value. Enter and Space use the native action. A consumer's `onKeyDown` can cancel library handling with `preventDefault()`.

Confirmation comes from committed `items`. The group announces removed labels once per update, including removed values outside the visible limit. Reordering, changing labels, and toggling disclosure are silent. If the removed action held focus, the group tries the next available value, the previous value, disclosure, then `emptyFocusRef` and the toolbar. External collapse moves focus from a hidden value to disclosure. If disclosure disappears while focused, the group tries the last available value. Focus can stay on a loading action and is preserved when the user has already moved elsewhere.

```tsx
import { useRef, useState } from 'react';
import { Button, TagGroup } from '@docouno/unica';
import type { TagGroupItem } from '@docouno/unica';

const initial: readonly TagGroupItem[] = [
  { id: 'docs', label: 'Documentation', removeLabel: 'Remove documentation' },
  { id: 'api', label: 'API', removeLabel: 'Remove API' },
];

export function Filters() {
  const [items, setItems] = useState(initial);
  const restore = useRef<HTMLButtonElement>(null);

  return (
    <>
      <TagGroup
        aria-label="Active filters"
        items={items}
        onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))}
        emptyFocusRef={restore}
      />
      <Button
        ref={restore}
        disabled={items.length === initial.length}
        onKeyDown={(event) => {
          if (event.repeat && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
          }
        }}
        onClick={() => setItems(initial)}
      >
        Restore filters
      </Button>
    </>
  );
}
```

An external fallback control receives subsequent keystrokes itself. Suppress repeated activation there if the control must wait for a fresh keypress after focus transfer, as in the example.

## Form and field integration

Both remove and disclosure actions are native `type="button"` buttons. Tag and TagGroup add no FormData entries. A form reset leaves the assigned values and disclosure as they are until the owner updates them. A native disabled fieldset disables its descendant actions according to the browser's first-legend exception.

To embed Tag in a multi-value text editor, set `data-unica-tag-layout="field"` on the immediate parent. The full label wraps and can be selected, with the remove action aligned to the first line. The editor can set `--tag-field-radius` on that parent, using the theme's `--radius-xs` as the default. Use `data-unica-tag-part="label"` to identify the selectable text in editor event delegation. The editor owns adding values, serialization, and focus recovery if it composes standalone Tags.

At default text scale, the S, M, and L capsules paint at 22, 26, and 30 px. The corresponding remove targets are at least 24, 26, and 30 px. On coarse pointers, the remove target reserves at least 44 × 44 px in the flow.
