import { useRef } from 'react';
import type { JSX } from 'react';
import { hydrateRoot } from 'react-dom/client';
import AlertSsrFixture from './alert-ssr.js';

export default function AlertHydrationFixture(): JSX.Element {
  const container = useRef<HTMLDivElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (container.current) {
            hydrateRoot(container.current, <AlertSsrFixture />);
          }
        }}
      >
        Hydrate alerts
      </button>
      <div data-testid="ssr-root" ref={container} />
    </>
  );
}
