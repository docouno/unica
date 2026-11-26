import { StrictMode, useRef, useState } from 'react';
import type { JSX } from 'react';
import { hydrateRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import TabsFixture from './tabs.js';

export default function TabsHydrationFixture(): JSX.Element {
  const container = useRef<HTMLDivElement>(null);
  const hydrated = useRef<Root | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (container.current && !hydrated.current) {
            hydrated.current = hydrateRoot(
              container.current,
              <StrictMode>
                <TabsFixture />
              </StrictMode>,
              {
                onRecoverableError: (error) =>
                  setErrors((previous) => [...previous, String(error)]),
              },
            );
            if (container.current.hasAttribute('data-focus-during-hydration')) {
              container.current
                .querySelector<HTMLInputElement>('input[aria-label="A draft"]')
                ?.focus();
            }
          }
        }}
      >
        Hydrate tabs
      </button>
      <div data-testid="tabs-hydration-root" ref={container} />
      <output data-testid="tabs-hydration-errors">{errors.join('\n')}</output>
    </>
  );
}
