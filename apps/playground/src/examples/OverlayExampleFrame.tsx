import { UnicaProvider } from '@docouno/unica';
import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { UnicaUnderlay } from '../unica.workbench.shared.js';
import { useSubjectBounds } from '../workbench/subjectBounds.js';
import type { PreviewContext } from '../workbench/types.js';
import './overlay-example-frame.css';

const source =
  '<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body class="hint-example-document"></body></html>';

function applyEnvironment(
  target: Document,
  frame: HTMLIFrameElement,
  theme: PreviewContext['theme'],
): void {
  const root = target.documentElement;
  const inherited = frame.ownerDocument.defaultView?.getComputedStyle(frame);
  root.dataset.theme = theme.id;
  root.style.colorScheme = theme.colorScheme;
  root.dir = inherited?.direction || 'ltr';
  root.dataset.textScale =
    inherited?.getPropertyValue('--font-scale').trim() === '1.2' ? '120' : '100';
}

function FrameContent({
  children,
  surface,
  bounds,
}: {
  readonly children: ReactNode;
  readonly surface: PreviewContext['surface'];
  readonly bounds: boolean;
}): ReactElement {
  const scope = useRef<HTMLDivElement>(null);
  useSubjectBounds(scope, bounds);
  return (
    <div ref={scope} className="hint-example-viewport">
      {surface === 'overlay' && (
        <>
          <UnicaUnderlay />
          <div className="hint-example-scrim" aria-hidden="true" />
        </>
      )}
      <div className="hint-example-viewport-content" data-surface={surface}>
        {children}
      </div>
    </div>
  );
}

/** Each comparison gets its own native viewport and one physically open preview. */
export function OverlayExampleFrame({
  ctx,
  title,
  height,
  children,
}: {
  readonly ctx: PreviewContext;
  readonly title: string;
  readonly height: number;
  readonly children: ReactNode;
}): ReactElement {
  const frame = useRef<HTMLIFrameElement>(null);
  const installed = useRef<Document>(null);
  const [target, setTarget] = useState<Document | null>(null);
  const [ready, setReady] = useState<Document | null>(null);

  useLayoutEffect(() => {
    if (frame.current && target) {
      applyEnvironment(target, frame.current, ctx.theme);
    }
  });

  useLayoutEffect(() => {
    if (!target) {
      return;
    }
    let active = true;
    // The Workbench capture waits for fonts in the outer document. Queue frame fonts too.
    target.body.getBoundingClientRect();
    const markReady = (): void => {
      if (active) {
        setReady(target);
      }
    };
    void target.fonts.ready.then(markReady, markReady);
    return () => {
      active = false;
    };
  }, [target]);

  function load(node: HTMLIFrameElement): void {
    const next = node.contentDocument;
    if (!next || next === installed.current || next.URL !== 'about:srcdoc') {
      return;
    }
    installed.current = next;
    applyEnvironment(next, node, ctx.theme);
    const loads: Promise<void>[] = [];
    for (const style of node.ownerDocument.head.querySelectorAll('style, link[rel="stylesheet"]')) {
      if (style instanceof HTMLLinkElement) {
        const clone = next.importNode(style, true);
        clone.href = style.href;
        loads.push(
          new Promise<void>((resolve) => {
            clone.addEventListener('load', () => resolve(), { once: true });
            clone.addEventListener('error', () => resolve(), { once: true });
          }),
        );
        next.head.append(clone);
      } else {
        next.head.append(next.importNode(style, true));
      }
    }
    const mountDocument = (): void => {
      if (node.isConnected && node.contentDocument === next) {
        setTarget(next);
      }
    };
    void Promise.all(loads).then(mountDocument, mountDocument);
  }

  const parentSearch = target?.defaultView?.frameElement?.ownerDocument.location.search;
  const bounds = new URLSearchParams(parentSearch).get('bounds') === '1';
  return (
    <>
      <iframe
        ref={frame}
        className="hint-example-frame"
        title={title}
        height={height}
        srcDoc={source}
        data-wb-pending={target && target === ready ? undefined : ''}
        onLoad={(event) => load(event.currentTarget)}
      />
      {target &&
        createPortal(
          <UnicaProvider portalContainer={target.body}>
            <FrameContent surface={ctx.surface} bounds={bounds}>
              {children}
            </FrameContent>
          </UnicaProvider>,
          target.body,
        )}
    </>
  );
}
