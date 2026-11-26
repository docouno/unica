import { useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { flushSync } from 'react-dom';
import { hydrateRoot } from 'react-dom/client';
import DisclosureSsr from './disclosure-ssr.js';

export default function DisclosureHydration(): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current;
    const hydrate = () => flushSync(() => hydrateRoot(host!, <DisclosureSsr />));
    host?.addEventListener('hydrate-disclosure', hydrate, { once: true });
    return () => host?.removeEventListener('hydrate-disclosure', hydrate);
  }, []);
  return <div ref={ref} data-testid="hydrate-disclosure" />;
}
