# Portal

Use `Portal` to render dialog content or other detached UI into a host while keeping its React context and event propagation. It adds no DOM element. An anchored native popover can stay beside its trigger and use the browser top layer to escape clipping.

```tsx
import { useState } from 'react';
import { Portal, UnicaProvider, getUnicaRootProps } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function PanelScope() {
  const [host, setHost] = useState<HTMLDivElement | null>(null);

  return (
    <section {...getUnicaRootProps({ theme: 'frost-dark' })} dir="rtl">
      <div ref={setHost} />
      <UnicaProvider theme="frost-dark" portalContainer={host}>
        <Portal>
          <p>This content inherits the host's theme and direction.</p>
        </Portal>
      </UnicaProvider>
    </section>
  );
}
```

| `container` / `portalContainer` | Portal destination |
| --- | --- |
| Omitted or `undefined` | Use the nearest `UnicaProvider` `portalContainer`, or `document.body` if none is set. A nested `UnicaProvider` with `portalContainer={undefined}` inherits its parent value. |
| `HTMLElement` | Render directly into the element, including a host in another document. An explicit `Portal` publishes its host to descendant portals. |
| `null` | Wait for a host without falling back to `document.body`. `UnicaProvider` still renders its children, so a descendant can supply its own explicit host. |

Configure scoped portal hosts through `UnicaProvider` (`portalContainer`). `Portal` accepts `children`, an optional `container` override, and `disabled`. Set `disabled` to render children inline with the surrounding context. Use a callback ref with state when the host mounts during a commit so React renders again when it becomes available.

`usePortalContainer()` returns the effective host or `null`. Both the hook and an enabled portal wait during server rendering and the first hydration pass. Disabled portals render inline during SSR. Changing hosts remounts portaled children. Keep any state that needs to survive above the portal. Use `Portal`, `UnicaProvider`, and `usePortalContainer` inside a client boundary (`'use client'`); the `react-server` entry exposes `THEME_PRESETS`, `defineGlyph`, `getUnicaRootProps`, and TypeScript types.

## Nested Themes and Portals

React events follow the component tree. CSS custom properties, `color-scheme`, native focus order, and modal inertness follow the physical DOM parent of the portal host.

Because `Portal` defaults to `document.body`, a nested themed subtree (`<div data-theme="pixel-dark">` inside an outer `frost-dark` page) must pass a local `portalContainer` located inside that themed container (`<UnicaProvider theme="pixel-dark" portalContainer={scopedHost}>`) so portaled overlays inherit the nested theme and direction. Put the host inside any `<dialog>` that must keep the portaled content interactive while modal. See [Themes and Roles](../concepts/themes-and-roles.md#structural-component-defaults) and [Overlays and Forms](../concepts/overlays-and-forms.md).
