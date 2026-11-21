import { useRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import ServerBadges from './badge-ssr.js';

export default function BadgeHydrationFixture() {
  const root = useRef<HTMLDivElement>(null);
  const errors = useRef<HTMLOutputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (root.current) {
            hydrateRoot(root.current, <ServerBadges />, {
              onRecoverableError: (error) => {
                if (errors.current) {
                  errors.current.textContent += String(error);
                }
              },
            });
          }
        }}
      >
        Hydrate badges
      </button>
      <div data-testid="ssr-root" ref={root} />
      <output data-testid="hydration-errors" ref={errors} />
    </>
  );
}
