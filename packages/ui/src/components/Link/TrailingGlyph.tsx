import { useLayoutEffect, useRef } from 'react';
import type { ReactElement, ReactNode } from 'react';

interface TrailingGlyphProps {
  readonly children: ReactNode;
}

const wrapAttribute = 'data-unica-link-wrap-terminal';
const layoutAttributes = ['class', 'style', 'dir', 'hidden'];

export function TrailingGlyph({ children }: TrailingGlyphProps): ReactElement {
  const marker = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const end = marker.current;
    const anchor = end?.parentElement;
    const view = end?.ownerDocument.defaultView;
    if (!end || !anchor || !view || !anchor.querySelector('.unica-link-terminal-text')) {
      return;
    }

    // Inline elements have no observable size. Find the block that lays out the line.
    let container = anchor;
    while (
      container.parentElement &&
      ['inline', 'contents'].includes(view.getComputedStyle(container).display)
    ) {
      container = container.parentElement;
    }

    let watchedGlyph: SVGSVGElement | null = null;
    const check = (): void => {
      const text = anchor.querySelector('.unica-link-terminal-text');
      const glyph = end.querySelector('svg');
      if (glyph !== watchedGlyph) {
        if (watchedGlyph) {
          resize?.unobserve(watchedGlyph);
        }
        if (glyph) {
          resize?.observe(glyph);
        }
        watchedGlyph = glyph;
      }
      anchor.removeAttribute(wrapAttribute);
      const lastLine = text && Array.from(text.getClientRects()).at(-1);
      const box = glyph?.getBoundingClientRect();
      if (lastLine && box?.height && box.top + box.height / 2 > lastLine.bottom) {
        // An emergency break keeps the glyph on the final text line.
        anchor.setAttribute(wrapAttribute, '');
      }
    };

    let frame = 0;
    const schedule = (): void => {
      if (!frame) {
        frame = view.requestAnimationFrame(() => {
          frame = 0;
          check();
        });
      }
    };

    const resize =
      typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(schedule) : undefined;
    resize?.observe(container);
    // Text, styles, or an adapter can change the line without resizing the block.
    const mutations = new view.MutationObserver(schedule);
    mutations.observe(container, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: layoutAttributes,
    });
    // Typography can inherit from an ancestor outside the line container.
    for (let ancestor = container.parentElement; ancestor; ancestor = ancestor.parentElement) {
      mutations.observe(ancestor, { attributes: true, attributeFilter: layoutAttributes });
    }
    view.addEventListener('resize', schedule);
    const fonts = end.ownerDocument.fonts;
    fonts?.addEventListener('loadingdone', schedule);
    check();
    return () => {
      resize?.disconnect();
      mutations.disconnect();
      view.removeEventListener('resize', schedule);
      fonts?.removeEventListener('loadingdone', schedule);
      view.cancelAnimationFrame(frame);
      anchor.removeAttribute(wrapAttribute);
    };
  });

  return (
    <span ref={marker} aria-hidden="true" className="unica-link-glyph unica-link-glyph-end">
      {children}
    </span>
  );
}
