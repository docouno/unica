# Link

`Link` navigates to a URL, document fragment, or application route. Its inline anchor inherits surrounding typography and underlines destinations by default. Use a specific destination name and keep the underline in running prose. Use `Button` for commands and `Button asChild` with an anchor for button-shaped navigation. [Button and IconButton](button.md)

```tsx
import { Link } from '@docouno/unica';
import type { LinkProps } from '@docouno/unica';
import '@docouno/unica/styles.css';

const guide = { href: '/guides/editing', tone: 'accent' } satisfies LinkProps;

export function EditingHelp() {
  return (
    <p>
      Read the <Link {...guide}>editing guide</Link> before publishing.
    </p>
  );
}
```

## Props

| Prop | Values and defaults |
| --- | --- |
| `href` | String URL, including a fragment or the empty URL. Required for an enabled native Link. Optional when disabled. |
| `asChild` | Defaults to `false`. With `true`, a single anchor or router element supplies the address and receives Link's anchor props. |
| `tone` | `accent` (default), `neutral`, or `inherit`. Use `inherit` to follow the parent text ink, including painted contexts such as Alert. |
| `underline` | `always` (default), `hover` (also underlines on keyboard focus and press), or `none`. Reserve optional underlining for recognizable navigation groups. |
| `size` | `inherit` (default), `body-l`, `body-m`, `body-s`, `caption-l`, `caption-m`, or `caption-s`. The instance wins over the nearest `UnicaProvider` override, then the theme's `defaults.Link.size`. Weight, family, italics, and tracking inherit in every size. |
| `iconLeft`, `iconRight` | Decorative [glyph sources](icon.md) at logical start and end. The frame follows the text size. Use a directional `Icon` in the label when a specific arrow should mirror in RTL. |
| `external` | Defaults to `false`. Displays an external arrow at the logical end, in place of `iconRight`. It keeps the chosen target. |
| `newTabHint` | Localized accessible description for new-tab navigation. Blank strings use “Opens in a new tab.” |
| `disabled` | Defaults to `false`. Keeps the label and appearance of an unavailable destination and removes its URL and activation. |
| `children`, `ref` | The label (or the single element with `asChild`) and an optional React 19 ref to the `HTMLAnchorElement`. |

Native anchor attributes and events flow to the anchor, including `target`, `rel`, `download`, `id`, `className`, `style`, and naming and description attributes. Use `aria-current="page"` or another meaningful current value for the current destination. It remains a link and receives a persistent 2px underline. Use `disabled` to set availability and React children for content.

## Router composition

Use one child that renders an anchor, forwards DOM props and ref, and takes an explicit React label. Pass the route to that child. Its DOM props take precedence at collisions, while classes combine and child style properties win. The child event handler runs first. Calling `preventDefault()` there skips Link's handler. Calling it from either handler cancels the transition when the router honors default prevention.

```tsx
import { Link } from '@docouno/unica';
import { Link as RouterLink } from 'react-router';

export function GuideLink() {
  return (
    <Link asChild>
      <RouterLink to="/guides/editing">Editing guide</RouterLink>
    </Link>
  );
}
```

```tsx
'use client';

import { Link } from '@docouno/unica';
import NextLink from 'next/link';

export function GuideLink() {
  return (
    <Link asChild>
      <NextLink href="/guides/editing">Editing guide</NextLink>
    </Link>
  );
}
```

```tsx
import { Link } from '@docouno/unica';
import { Link as RouterLink } from '@tanstack/react-router';

export function GuideLink() {
  return (
    <Link asChild>
      <RouterLink to="/guides/editing" activeProps={{ className: 'active-guide' }}>
        Editing guide
      </RouterLink>
    </Link>
  );
}
```

TanStack Router's active and inactive props can provide styling while the router supplies `aria-current`. Keep `rel`, accessible descriptions, handlers, and refs in statically forwarded props so the eventual anchor retains them after route changes. Set availability on Unica's Link. Use ordinary children for the label and keep controls out of the anchor. Both refs receive the same anchor, including the fallback while disabled. React DOM SSR and hydration work with the normal entry. The `react-server` entry exposes `LinkProps` as a type, and client modules import `Link` from the normal entry.

## Unavailable destinations

The anchor stays readable with `role="link"`, `aria-disabled="true"`, and `tabIndex={-1}`. Its address, target, download, current state, and automatic new-tab description are removed. Click and auxiliary click are suppressed, including the link's activation handlers. A slotted link unmounts the router child while disabled and renders its supplied label in a native anchor. Enabling it mounts a fresh router instance. Provide the reason in visible nearby text when it helps users decide what to do next.

```tsx
import { Link } from '@docouno/unica';
import { useId } from 'react';

export function PendingArchive() {
  const reason = useId();
  return (
    <p>
      <Link disabled aria-describedby={reason}>Download archive</Link>{' '}
      <span id={reason}>Available after export finishes.</span>
    </p>
  );
}
```

## External links and downloads

A case-insensitive `target="_blank"` adds `noopener noreferrer`, removing `opener` and keeping other relationship tokens. New-tab navigation adds the external glyph in place of `iconRight` and appends the localized notice to the destination's accessible description. The destination name stays the same. Existing description IDs remain live. A caller description or applicable tooltip provides the description when no author ID resolves. References to other elements and labels produced by child components resolve in the document when React mounts or hydrates the link. The cue follows the explicit target on the Link or child.

An explicit download (`true`, an empty string, or a file name) keeps the destination, target, and safe rel. It suppresses the automatic glyph and notice. Request `external` to show the glyph for an external download. Browsers may ignore the download request for cross-origin URLs and follow the supplied target. Use a native anchor or an adapter that supports document navigation.

```tsx
<Link href="/handbook" target="_blank" newTabHint="Se abre en una pestaña nueva">
  Manual
</Link>
<Link href="/reports/annual.pdf" download="annual.pdf">
  Download the annual report
</Link>
```

## Keyboard, layout, and surfaces

Tab and Shift+Tab visit available links. Enter follows the address. Space keeps native scrolling, and context menu, middle click, and modifier behavior remain available. A focused link gets a 2px outline with a 3px offset. Wrapped links keep their inline fragments and natural word breaks. If the trailing glyph would wrap onto a line by itself, the client allows the last authored text run to break with it. Keep link labels as text or inline markup when the label and glyph must wrap together. Link uses system colors in forced-colors mode and changes states without motion.

Use a named navigation group and give standalone links their target area through layout. A nav can use `display: flex; flex-wrap: wrap; gap: 8px` with `align-content: center; min-block-size: 44px; min-inline-size: 44px` on each link for coarse pointers. The links are flex items and their content stays inline. Inline links inside sentences follow the text's line box.

Link inherits the enclosing base or overlay theme. In a painted context, `tone="inherit"` follows surrounding text, uses the context action ink for focus, and strengthens that ink on press. A new surface boundary clears the outer context. Inside a form a link follows its destination without submitting or contributing form data. Focus after a route transition is owned by the application.

[Workbench and inspection](../workbench.md) · [Support and accessibility](../concepts/support-and-accessibility.md)
