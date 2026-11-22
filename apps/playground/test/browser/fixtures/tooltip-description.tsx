import { StrictMode, useRef } from 'react';
import type { ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import DescriptionSamples from './tooltip-description-ssr.js';

export default function DescriptionHydration(): ReactElement {
  const container = useRef<HTMLDivElement>(null);
  const errors = useRef<HTMLOutputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (container.current) {
            hydrateRoot(
              container.current,
              <StrictMode>
                <DescriptionSamples />
              </StrictMode>,
              {
                onRecoverableError(error) {
                  errors.current?.append(String(error));
                },
              },
            );
          }
        }}
      >
        Hydrate descriptions
      </button>
      <div ref={container} data-testid="description-ssr" />
      <output ref={errors} data-testid="description-errors" />
    </>
  );
}
