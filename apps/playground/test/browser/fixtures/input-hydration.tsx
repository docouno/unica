import { useRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import ServerInputs from './input-ssr.js';

export default function InputHydrationFixture() {
  const root = useRef<HTMLDivElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (root.current) {
            hydrateRoot(root.current, <ServerInputs />);
          }
        }}
      >
        Hydrate inputs
      </button>
      <div data-testid="input-ssr-root" ref={root} />
    </>
  );
}
