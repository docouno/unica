# Portal

Use `Portal` to render dialog content or other detached UI into a host while keeping its React context and event propagation. It adds no DOM element. An anchored native popover can stay beside its trigger and use the browser top layer to escape clipping.

```tsx
import { useState } from 'react';
import { Portal, PortalProvider } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function PanelScope() {
  const [host, setHost] = useState<HTMLDivElement | null>(null);

  return (
    <section data-theme="frost-dark" dir="rtl">
      <div ref={setHost} />
      <PortalProvider container={host}>
        <Portal>
          <p>This content inherits the host's theme and direction.</p>
        </Portal>
      </PortalProvider>
    </section>
  );
}
```

| `container` | Portal destination |
| --- | --- |
| Omitted or `undefined` | Use the nearest provider value, or `document.body` if none is set. A provider with `undefined` inherits its parent value. |
| `HTMLElement` | Render directly into the element, including a host in another document. An explicit portal publishes the host to its descendants. |
| `null` | Wait for a host. A provider still renders its children, so a descendant can supply its own explicit host. |

`PortalProvider` takes `children` and an optional `container`. `Portal` accepts the same props plus `disabled`. Set `disabled` to render children inline with the surrounding context. Use a callback ref with state when the host mounts during a commit so React renders again when it becomes available.

`usePortalContainer()` returns the effective host or `null`. Both the hook and an enabled portal wait during server rendering and the first hydration pass. Disabled portals render inline during SSR. Changing hosts remounts portaled children. Keep any state that needs to survive above the portal. Use `Portal`, `PortalProvider`, and `usePortalContainer` inside a client boundary (`'use client'`); the `react-server` entry exposes only their TypeScript types.

React events follow the component tree. CSS inheritance, native focus order, and modal inertness follow the physical DOM. Put the host inside the intended theme and inside any dialog that must contain the portaled content. See [Overlays and Forms](../concepts/overlays-and-forms.md).
