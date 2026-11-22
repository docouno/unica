import { StrictMode, useRef } from 'react';
import type { JSX } from 'react';
import { hydrateRoot } from 'react-dom/client';
import ServerButtonActions from './button-ssr.js';

export default function ButtonHydrationFixture(): JSX.Element {
  const container = useRef<HTMLDivElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (container.current) {
            hydrateRoot(
              container.current,
              <StrictMode>
                <ServerButtonActions />
              </StrictMode>,
            );
          }
        }}
      >
        Hydrate server buttons
      </button>
      <div ref={container} data-testid="server-button-root" />
    </>
  );
}
