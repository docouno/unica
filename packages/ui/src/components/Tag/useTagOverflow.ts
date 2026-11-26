import { useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { getComposedParentElement, getLiveView } from '../../core/dom.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';

export function useTagOverflow(
  labelRef: RefObject<HTMLSpanElement | null>,
  children: ReactNode,
  text: string | undefined,
): boolean {
  const [clipped, setClipped] = useState(false);

  useIsoLayoutEffect(() => {
    const label = labelRef.current;
    const view = label && getLiveView(label.ownerDocument);
    if (!label || !view || !text) {
      setClipped(false);
      return;
    }

    const measure = (): void => {
      setClipped(
        label.scrollWidth > label.clientWidth &&
          label.getClientRects().length > 0 &&
          view.getComputedStyle(label).whiteSpace === 'nowrap',
      );
    };

    const resize =
      typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(measure) : null;
    resize?.observe(label);
    const content =
      typeof view.MutationObserver === 'function' ? new view.MutationObserver(measure) : null;
    content?.observe(label, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
    });
    if (content) {
      for (
        let ancestor = getComposedParentElement(label);
        ancestor;
        ancestor = getComposedParentElement(ancestor)
      ) {
        // An inherited font can change the intrinsic width without resizing the label's box.
        content.observe(ancestor, {
          attributeFilter: [
            'class',
            'style',
            'dir',
            'hidden',
            'data-theme',
            'data-text-scale',
            'data-unica-tag-layout',
          ],
        });
      }
    }
    const fonts = label.ownerDocument.fonts;
    fonts?.addEventListener('loadingdone', measure);
    fonts?.addEventListener('loadingerror', measure);
    view.addEventListener('resize', measure);
    measure();

    return () => {
      resize?.disconnect();
      content?.disconnect();
      fonts?.removeEventListener('loadingdone', measure);
      fonts?.removeEventListener('loadingerror', measure);
      view.removeEventListener('resize', measure);
    };
  }, [labelRef, children, text]);

  return clipped;
}
