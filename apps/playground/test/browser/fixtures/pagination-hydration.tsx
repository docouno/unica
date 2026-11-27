import { useRef } from 'react';
import type { ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import PaginationSSR from './pagination-ssr.js';

export default function PaginationHydration(): ReactElement {
  const host = useRef<HTMLDivElement>(null);
  return (
    <>
      <button
        onClick={() => {
          if (host.current) {
            hydrateRoot(host.current, <PaginationSSR />, {
              onRecoverableError: (error) => console.error(error),
            });
          }
        }}
      >
        Hydrate pagination
      </button>
      <div ref={host} data-testid="pager-ssr" />
    </>
  );
}
