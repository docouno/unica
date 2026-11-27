# Breadcrumb

Use a breadcrumb above a page heading or in a workspace header to show the current location in a hierarchy. Link each addressable ancestor. A static label can describe an intermediate group. When a nearby heading already names the current page, an ancestor-only trail is valid.

```tsx
import '@docouno/unica/styles.css';
import { Breadcrumb, BreadcrumbLink, BreadcrumbPage } from '@docouno/unica';

export function RunbookLocation() {
  return (
    <Breadcrumb aria-label="Runbook location">
      <BreadcrumbLink href="/workspace">Workspace</BreadcrumbLink>
      <span>Incident response</span>
      <BreadcrumbLink href="/runbooks">Runbooks</BreadcrumbLink>
      <BreadcrumbPage>Failover guide</BreadcrumbPage>
    </Breadcrumb>
  );
}
```

## Parts and props

| Part | Props and defaults |
| --- | --- |
| `Breadcrumb` | Native `nav` attributes and ref. `size="s" \| "m" \| "l"` (default `"m"`) sets the type scale, icon size, and spacing. `underline="always" \| "hover" \| "none"` (default `"always"`) sets the link policy. `separator` accepts a decorative, noninteractive React node (default `"/"`), or `null` for spacing alone. |
| `BreadcrumbLink` | Native anchor attributes and ref. Supply a string `href` for an available native link, or use `asChild` with an anchor or router adapter. `disabled` and `iconOnly` default to `false`. A link can override the trail's `underline` policy. |
| `BreadcrumbPage` | Native `span` attributes and ref. Renders static content with `aria-current="page"`. |

The trail uses a named `nav` and an ordered list. The default name is “Breadcrumb”. Set a localized `aria-label` or reference a visible label with `aria-labelledby`. Distinguish trails by name when several share a page. Arrays and fragments can group items. Empty nodes and whitespace-only strings are omitted, and a numeric zero is preserved. When the trail is empty, the landmark is omitted.

Use at most one current item. Use `BreadcrumbPage` for a static location or add `aria-current="page"` to a `BreadcrumbLink` for a current permalink. The last link in an ancestor-only trail keeps its ordinary meaning. Give an icon-only root an accessible name and use a [slot Icon](icon.md#props). Decorative separators stay with their following item and stay out of the accessibility tree. A directional Icon follows RTL. The default slash retains its shape.

## Links and router composition

Enabled links use native Tab order and Enter activation, including browser context menus and modified clicks. A text permalink retains its underline in every mode. Hover underlines also appear on keyboard focus and press, and stay visible when a coarse pointer has no hover. The focus outline surrounds the complete target. A disabled link has no destination or Tab stop. A disabled current permalink keeps its current marker and semibold weight. These parts add no form data or submit actions.

With `asChild`, use one element that renders an anchor, forwards its DOM props and ref, and takes its address on the child. The child's attributes take precedence. The child click handler runs first and can cancel the transition with `preventDefault()`. Supply ordinary, noninteractive React children so the same label can render in the addressless anchor when disabled. The router component is omitted in that state, including any prefetch or render callback it would run. To use a router's render callback, wrap it in an adapter that accepts the static label as its children and creates the callback internally. Set current location explicitly on `BreadcrumbLink` or on the child when the marker must survive the disabled fallback.

```tsx
import type { ComponentPropsWithRef, JSX } from 'react';
import { NavLink } from 'react-router';
import { Breadcrumb, BreadcrumbLink } from '@docouno/unica';

type RouteProps = Omit<ComponentPropsWithRef<'a'>, 'href'> & { to: string };

function Route({ to, children, ...props }: RouteProps): JSX.Element {
  return (
    <NavLink {...props} to={to}>
      {({ isPending }) => <span aria-busy={isPending || undefined}>{children}</span>}
    </NavLink>
  );
}

export function DocumentLocation({ archived }: { archived: boolean }) {
  return (
    <Breadcrumb>
      <BreadcrumbLink href="/runbooks">Runbooks</BreadcrumbLink>
      <BreadcrumbLink asChild disabled={archived} aria-current="page">
        <Route to="/runbooks/failover">Failover guide</Route>
      </BreadcrumbLink>
    </Breadcrumb>
  );
}
```

With `target="_blank"`, native and slotted anchors receive `noopener noreferrer`, including download links. The application owns new-tab notices and can associate visible text with `aria-describedby`.

## Layout and themes

Sizes S, M, and L use Caption L, Body S, and Body M. Links have targets of at least 24 × 24 CSS pixels with a fine pointer and 48 × 48 with a coarse pointer. At narrow widths the trail wraps between items, then within labels when needed. The full path and all of its addresses stay available. Wrap mixed-direction labels in `bdi` when needed.

The trail inherits its host surface on Base and Overlay. It uses theme foregrounds and focus ink, system colors in forced-colors mode, and immediate feedback in Pixel or with reduced motion.
