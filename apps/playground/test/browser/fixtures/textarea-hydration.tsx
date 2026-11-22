import { hydrateRoot } from 'react-dom/client';
import { useRef } from 'react';
import type { JSX } from 'react';
import TextareaSsr from './textarea-ssr.js';

export default function TextareaHydration(): JSX.Element {
  const target = useRef<HTMLDivElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (target.current) {
            hydrateRoot(target.current, <TextareaSsr />);
          }
        }}
      >
        Hydrate textarea
      </button>
      <div ref={target} data-testid="textarea-ssr-root" />
    </>
  );
}
