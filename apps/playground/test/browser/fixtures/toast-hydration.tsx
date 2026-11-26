import { StrictMode, useEffect } from 'react';
import type { ReactElement } from 'react';
import { flushSync } from 'react-dom';
import { hydrateRoot } from 'react-dom/client';
import ToastSsr from './toast-ssr.js';

export default function ToastHydration(): ReactElement {
  useEffect(() => {
    const host = document.querySelector('[data-toast-hydration]');
    if (!host) {
      return;
    }
    const hydrate = (): void => {
      flushSync(() =>
        hydrateRoot(
          host,
          <StrictMode>
            <ToastSsr />
          </StrictMode>,
        ),
      );
    };
    host.addEventListener('hydrate-toast', hydrate, { once: true });
    return () => host.removeEventListener('hydrate-toast', hydrate);
  }, []);
  return <div data-toast-hydration="" />;
}
