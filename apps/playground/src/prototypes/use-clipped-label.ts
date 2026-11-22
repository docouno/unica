import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export function useClippedLabel<T extends HTMLElement>(
  text: string | undefined,
  axis: 'inline' | 'block' = 'inline',
): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [clipped, setClipped] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !text) {
      setClipped(false);
      return;
    }

    const measure = (): void => {
      setClipped(
        axis === 'block'
          ? element.clientHeight > 0 && element.scrollHeight > element.clientHeight
          : element.clientWidth > 0 && element.scrollWidth > element.clientWidth,
      );
    };
    const Observer = element.ownerDocument.defaultView?.ResizeObserver;
    const observer = Observer ? new Observer(measure) : undefined;
    const fonts = element.ownerDocument.fonts;
    observer?.observe(element);
    fonts?.addEventListener('loadingdone', measure);
    measure();
    return () => {
      observer?.disconnect();
      fonts?.removeEventListener('loadingdone', measure);
    };
  }, [text, axis]);

  return [ref, clipped];
}
