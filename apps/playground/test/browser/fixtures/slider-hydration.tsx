import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { flushSync } from 'react-dom';
import { hydrateRoot } from 'react-dom/client';
import SliderSsr from './slider-ssr.js';

export default function SliderHydration(): ReactElement {
  useEffect(() => {
    const host = document.querySelector('[data-testid="hydrate-sliders"]');
    if (!host) {
      return;
    }
    function hydrate(): void {
      flushSync(() => {
        hydrateRoot(host!, <SliderSsr />);
      });
    }
    host.addEventListener('hydrate-sliders', hydrate);
    return () => host.removeEventListener('hydrate-sliders', hydrate);
  }, []);
  return <div data-testid="hydrate-sliders" />;
}
