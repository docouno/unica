import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { flushSync } from 'react-dom';
import { hydrateRoot } from 'react-dom/client';
import MenuFixture from './menu.js';

export default function MenuHydration(): ReactElement {
  useEffect(() => {
    const host = document.querySelector('[data-testid="hydrate-menu"]');
    if (!host) {
      return;
    }
    const hydrate = () => flushSync(() => hydrateRoot(host, <MenuFixture />));
    host.addEventListener('hydrate-menu', hydrate, { once: true });
    return () => host.removeEventListener('hydrate-menu', hydrate);
  }, []);
  return <div data-testid="hydrate-menu" />;
}
