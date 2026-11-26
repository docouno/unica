import { useRef } from 'react';
import type { ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import ServerTags from './tag-ssr.js';

export default function TagHydrationFixture(): ReactElement {
  const root = useRef<HTMLDivElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (root.current) {
            hydrateRoot(root.current, <ServerTags />);
          }
        }}
      >
        Hydrate tags
      </button>
      <div data-testid="ssr-root" ref={root} />
    </>
  );
}
