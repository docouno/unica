import type { ReactElement } from 'react';
import { useRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import ServerAvatars from './avatar-ssr.js';

export default function AvatarHydrationFixture(): ReactElement {
  const host = useRef<HTMLDivElement>(null);
  const errors = useRef<HTMLOutputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (host.current) {
            hydrateRoot(host.current, <ServerAvatars />, {
              onRecoverableError: (error) => {
                if (errors.current) {
                  errors.current.textContent += String(error);
                }
              },
            });
          }
        }}
      >
        Hydrate identities
      </button>
      <div data-testid="ssr-root" ref={host} />
      <output data-testid="hydration-errors" ref={errors} />
    </>
  );
}
