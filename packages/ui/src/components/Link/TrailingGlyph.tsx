import { useRef } from 'react';
import type { ReactElement, ReactNode } from 'react';
import {
  addListenerSafe,
  getComputedStyleSafe,
  getLiveView,
  getOwnerDocument,
  removeListenerSafe,
} from '../../core/dom.js';
import { createFrameJob } from '../../core/frame-scheduler.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';

interface TrailingGlyphProps {
  readonly children: ReactNode;
}

const wrapAttribute = 'data-unica-link-wrap-terminal';
const layoutAttributes = ['class', 'style', 'dir', 'hidden'];

export function TrailingGlyph({ children }: TrailingGlyphProps): ReactElement {
  const marker = useRef<HTMLSpanElement>(null);

  useIsoLayoutEffect(() => {
    const end = marker.current;
    const anchor = end?.parentElement;
    const doc = end ? getOwnerDocument(end) : null;
    const view = getLiveView(doc);
    if (!end || !anchor || !doc || !view) {
      return;
    }

    // Inline elements have no observable size. Find the block that lays out the line.
    let container = anchor;
    while (container.parentElement) {
      const display = getComputedStyleSafe(container)?.display;
      if (display !== 'inline' && display !== 'contents') {
        break;
      }
      container = container.parentElement;
    }

    let watchedGlyph: SVGSVGElement | null = null;
    let schedule = (): void => {};
    const resize =
      typeof view.ResizeObserver === 'function'
        ? new view.ResizeObserver(() => schedule())
        : undefined;

    const task = {
      prepare: (): void => {
        anchor.removeAttribute(wrapAttribute);
      },
      measure: (): (() => void) | undefined => {
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
        if (!text || !glyph) {
          return undefined;
        }
        const lastLine = Array.from(text.getClientRects()).at(-1);
        const box = glyph.getBoundingClientRect();
        if (lastLine && box.height && box.top + box.height / 2 > lastLine.bottom) {
          // An emergency break keeps the glyph on the final text line.
          return () => {
            anchor.setAttribute(wrapAttribute, '');
          };
        }
        return undefined;
      },
    };

    const job = createFrameJob(doc, task);
    schedule = (): void => job.schedule();

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
    addListenerSafe(view, 'resize', schedule);
    const fonts = doc.fonts;
    if (fonts) {
      addListenerSafe(fonts, 'loadingdone', schedule);
    }

    // Synchronous initial check on mount avoids a post-paint layout flash.
    task.prepare();
    task.measure()?.();

    return () => {
      job.dispose();
      resize?.disconnect();
      mutations.disconnect();
      removeListenerSafe(view, 'resize', schedule);
      if (fonts) {
        removeListenerSafe(fonts, 'loadingdone', schedule);
      }
      anchor.removeAttribute(wrapAttribute);
    };
  }, []);

  return (
    <span ref={marker} aria-hidden="true" className="unica-link-glyph unica-link-glyph-end">
      {children}
    </span>
  );
}
