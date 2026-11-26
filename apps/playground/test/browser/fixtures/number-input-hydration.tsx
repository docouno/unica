import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { flushSync } from 'react-dom';
import { hydrateRoot } from 'react-dom/client';
import NumberInputSsr from './number-input-ssr.js';

export default function NumberInputHydration(): ReactElement {
  useEffect(() => {
    const host = document.querySelector('[data-testid="hydrate-number-input"]');
    if (!host) {
      return;
    }
    const hydrate = () => flushSync(() => hydrateRoot(host, <NumberInputSsr />));
    host.addEventListener('hydrate-number-input', hydrate, { once: true });
    return () => host.removeEventListener('hydrate-number-input', hydrate);
  }, []);
  return <div data-testid="hydrate-number-input" />;
}
