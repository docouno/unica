import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@docouno/unica';
import { useLayoutEffect, useRef, useState } from 'react';
import type { JSX } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

declare global {
  interface Window {
    tabsShadowProbe: {
      focusDraft: () => void;
      switchView: () => void;
      active: () => string | null;
      transfer: (mode: ShadowRootMode) => Promise<[string | null, string | null, boolean]>;
    };
  }
}

function ShadowTransfer(): JSX.Element {
  const [keys, setKeys] = useState(['A', 'B', 'C']);
  return (
    <div
      onBlurCapture={(event) => {
        if (event.target.textContent === 'B') {
          flushSync(() => setKeys(['A', 'C']));
        }
      }}
    >
      <Tabs defaultValue="A" activationMode="manual">
        <TabsList aria-label="Views">
          {keys.map((key) => (
            <TabsTrigger key={key} value={key} data-value={key}>
              {key}
            </TabsTrigger>
          ))}
        </TabsList>
        {keys.map((key) => (
          <TabsPanel key={key} value={key}>
            {key} panel
          </TabsPanel>
        ))}
      </Tabs>
    </div>
  );
}

async function transfer(mode: ShadowRootMode): Promise<[string | null, string | null, boolean]> {
  const host = document.createElement('div');
  document.body.append(host);
  const shadow = host.attachShadow({ mode });
  const root = createRoot(shadow);
  try {
    flushSync(() => root.render(<ShadowTransfer />));
    shadow.querySelector<HTMLButtonElement>('[data-value="B"]')?.focus();
    shadow.querySelector<HTMLButtonElement>('[data-value="C"]')?.focus();
    const immediate = shadow.activeElement?.textContent ?? null;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    return [
      immediate,
      shadow.activeElement?.textContent ?? null,
      shadow.querySelector('[data-value="B"]') !== null,
    ];
  } finally {
    root.unmount();
    host.remove();
  }
}

export default function TabsShadowFixture(): JSX.Element {
  const host = useRef<HTMLDivElement>(null);
  const [shadow, setShadow] = useState<ShadowRoot | null>(null);
  const [view, setView] = useState('a');
  useLayoutEffect(() => {
    const root = host.current?.attachShadow({ mode: 'closed' });
    if (!root) {
      return;
    }
    setShadow(root);
    window.tabsShadowProbe = {
      focusDraft: () => root.querySelector('input')?.focus(),
      switchView: () => flushSync(() => setView('b')),
      active: () =>
        root.activeElement?.getAttribute('aria-label') ?? root.activeElement?.textContent ?? null,
      transfer,
    };
  }, []);

  return (
    <div ref={host}>
      {shadow &&
        createPortal(
          <Tabs value={view}>
            <TabsList aria-label="Views">
              <TabsTrigger value="a">A</TabsTrigger>
              <TabsTrigger value="b">B</TabsTrigger>
            </TabsList>
            <TabsPanel value="a">
              <input aria-label="A draft" />
            </TabsPanel>
            <TabsPanel value="b">B panel</TabsPanel>
          </Tabs>,
          shadow,
        )}
    </div>
  );
}
