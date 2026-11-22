import { StrictMode, useRef, useState } from 'react';
import type { JSX } from 'react';
import { hydrateRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { SegmentedFormFixture } from './segmented-control.js';

export default function SegmentedHydrationFixture(): JSX.Element {
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
                <SegmentedFormFixture />
              </StrictMode>,
              {
                onRecoverableError: (error) =>
                  setErrors((previous) => [...previous, String(error)]),
              },
            );
          }
        }}
      >
        Hydrate choices
      </button>
      <div data-testid="segmented-hydration-root" ref={container} />
      <output data-testid="segmented-hydration-errors">{errors.join('\n')}</output>
    </>
  );
}
