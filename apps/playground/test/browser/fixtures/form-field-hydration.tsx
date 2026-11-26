import { useRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import ServerFields from './form-field-ssr.js';

export default function FormFieldHydration() {
  const host = useRef<HTMLDivElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (host.current) {
            hydrateRoot(host.current, <ServerFields />);
          }
        }}
      >
        Hydrate fields
      </button>
      <div ref={host} data-testid="server-markup" />
    </>
  );
}
