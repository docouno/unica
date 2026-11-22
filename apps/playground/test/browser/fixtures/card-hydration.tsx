import { useRef } from 'react';
import type { ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import ServerCards from './card-ssr.js';

export default function CardHydrationFixture(): ReactElement {
  const root = useRef<HTMLDivElement>(null);
  const errors = useRef<HTMLOutputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (root.current) {
            hydrateRoot(root.current, <ServerCards />, {
              onRecoverableError(error) {
                if (errors.current) {
                  errors.current.value += String(error);
                }
              },
            });
          }
        }}
      >
        Hydrate cards
      </button>
      <output ref={errors} data-testid="hydration-errors" />
      <div ref={root} data-testid="ssr-cards" />
    </>
  );
}
