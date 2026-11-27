import { StrictMode, useRef, useState } from 'react';
import type { JSX } from 'react';
import { hydrateRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import StepperFixture from './stepper.js';

export default function StepperHydrationFixture(): JSX.Element {
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
                <StepperFixture />
              </StrictMode>,
              { onRecoverableError: (error) => setErrors((old) => [...old, String(error)]) },
            );
          }
        }}
      >
        Hydrate Stepper
      </button>
      <div data-testid="stepper-hydration-root" ref={container} />
      <output data-testid="stepper-hydration-errors">{errors.join('\n')}</output>
    </>
  );
}
