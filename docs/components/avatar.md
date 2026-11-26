# Avatar and AvatarGroup

`Avatar` identifies a person with a portrait or fallback. `AvatarGroup` shows an ordered subset of people and the exact number of remaining members.

```tsx
import { Avatar, AvatarGroup, Button } from '@docouno/unica';

<Avatar
  alt="Alex Rivera"
  name="Alex Rivera"
  src="/people/alex-v2-40.jpg"
  srcSet="/people/alex-v2-80.jpg 2x"
  imagePosition="50% 35%"
/>;

<Button variant="ghost" tone="neutral">
  <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
    <Avatar alt="" name="Alex Rivera" size="xs" />
    Alex Rivera
  </span>
</Button>;

<AvatarGroup
  label="Contributors"
  members={[
    { id: 'alex', name: 'Alex Rivera', src: '/people/alex-v2-40.jpg' },
    { id: 'sam', name: 'Sam Chen' },
    { id: 'jo', name: 'Jo Martin' },
  ]}
  size="s"
  max={2}
  showNames
/>;
```

## Avatar

| Prop | Type | Behavior |
| --- | --- | --- |
| `alt` | `string`, required | Accessible name of the image. An empty or whitespace-only value hides the visual subtree from assistive technology. |
| `name` | `string` | Source for automatic initials. Supply `alt` independently of `name`. |
| `size` | `AvatarSize` | `2xs` (20px), `xs` (24px), `s` (32px), `m` (40px, default), or `l` (48px). |
| `src`, `srcSet`, `sizes` | `string` | Native image URL, responsive candidates and source size hint. `srcSet` can supply the image on its own. |
| `imagePosition` | `string` | CSS `object-position` for the cover-cropped portrait. Defaults to the center. |
| `fallback` | `string \| ReactElement` | Passive mark, such as authored initials or an icon. Keep it compact and omit interactive elements, form controls and portals. |
| `ref` | `Ref<HTMLSpanElement>` | The frame, stable across changes to image sources. |

The frame shows a ready photo, otherwise a nonblank custom mark, automatic initials, or the built-in person glyph. Initials use the first grapheme of the first and last words. One word or a `2xs` frame uses one grapheme. Uppercase expansions keep their first grapheme. The fallback stays visible during loading and after an image error, at the same dimensions as the photo.

The browser selects responsive candidates. For a different person or portrait revision, provide URLs that identify the new bytes for every selectable candidate. A changed `src`, `srcSet` or `sizes` starts with the new fallback. A viewport change within the same candidate set can retain a ready portrait while the browser obtains a better candidate. A new React key allows a fresh attempt after an error with normal browser caching. Use versioned URLs when the image bytes or a cached response need to change.

## AvatarGroup

| Prop | Type | Behavior |
| --- | --- | --- |
| `label` | `string`, required | Accessible list name. Supply a localized label. Blank input falls back to “Members”. |
| `members` | `AvatarGroupProps['members']`, required | Ordered records with unique stable `id`, `name`, and optional `src`, `srcSet`, `sizes`, `imagePosition` and `fallback`. An empty array renders nothing. |
| `size` | `'xs' \| 's' \| 'm' \| 'l'` | Defaults to `m`. The `xs` group uses one automatic initial per member. |
| `max` | `number` | Maximum visible portraits before an additional counter. Defaults to 4 and accepts a positive safe integer. |
| `showNames` | `boolean` | Opt in to full names on hover and keyboard focus. Defaults to `false`. |
| `getOverflowLabel` | `(count: number) => string` | Localize the spoken remainder. Defaults to “1 more member” or “N more members”. Blank results use the default. |
| `ref` | `Ref<HTMLUListElement>` | The list, or `null` while there are no members. |

The list keeps source order and stays on one line. Set `max` for the available space and provide a separate full-list action when people need access to every name, including on touch devices. Soft and Frost overlap the frames with a transparent 2px seam. Larger text relaxes overlap. Pixel spaces full square frames 2px apart. RTL mirrors the stack and preserves the orientation of faces and the `+N` counter.

## Accessibility and composition

- Use a nonempty `alt` for a standalone identity. Use `alt=""` beside the same visible name or inside an already named action. The photo and fallback share one accessible name.
- By default the group is a passive list. With `showNames`, Tab and Shift+Tab visit visible members with nonblank names. Focus opens the name hint immediately. Hover opens it after 300 ms on first entry and immediately when moving between members while the group is warm. Escape dismisses the hint and keeps focus. Enter and Space have no avatar action. The counter has spoken text and stays out of the tab order.
- Reordering preserves focus on a visible member with the same `id`. Removing that member follows the browser's native focus order.
- Both roots accept `id`, `className`, `style`, `dir`, `lang`, `hidden`, `inert` and consumer `data-*` attributes. A standalone Avatar can sit inside a named Button or Link, while group actions sit alongside the list. Form submission, reset, validation and disabled behavior belong to native controls in the surrounding form.
- [Tooltip](tooltip.md) provides the name hint on a floating surface, including inside dialogs. Forced colors retain frame contours and keep photographs in their original colors. Image, fallback and membership changes are immediate.
