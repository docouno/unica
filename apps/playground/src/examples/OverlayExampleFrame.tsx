import { UnicaProvider } from '@docouno/unica';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { UnicaUnderlay } from '../unica.workbench.shared.js';
import { useSubjectBounds } from '../workbench/subjectBounds.js';
import type { PreviewContext } from '../workbench/types.js';
import './overlay-example-frame.css';

function source(linksToParent: boolean): string {
  const base = linksToParent ? '<base target="_parent">' : '';
  return `<!doctype html><html class="hint-example-root" lang="en"><head><meta charset="utf-8">${base}</head><body class="hint-example-document"></body></html>`;
}

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

// Theme editor declarations are scoped to the outer artboard. Keep their token
// values and theme/surface filters in the frame, with the document root as its scope.
function mirrorThemeOverrides(target: Document, frame: HTMLIFrameElement): () => void {
  const shell = frame.closest('.wb-shell');
  const root = frame.ownerDocument.documentElement;
  const style = target.createElement('style');
  const observer = new MutationObserver(sync);
  target.head.append(style);

  function sync(): void {
    const overrides = shell?.querySelector(':scope > style[data-wb-theme-overrides]');
    const css = overrides?.textContent?.replaceAll('.wb-shell .wb-artboard', ':root') ?? '';
    if (style.textContent !== css) {
      style.textContent = css;
    }
    if (root.dataset.wbFreeze === '1' || frame.closest('[data-wb-capture-route]')) {
      target.documentElement.dataset.wbFreeze = '1';
    } else {
      delete target.documentElement.dataset.wbFreeze;
    }
    observer.disconnect();
    observer.observe(root, { attributes: true, attributeFilter: ['data-wb-freeze'] });
    if (shell) {
      observer.observe(shell, { childList: true });
    }
    if (overrides) {
      observer.observe(overrides, { childList: true, characterData: true, subtree: true });
    }
  }

  sync();
  return () => {
    observer.disconnect();
    style.remove();
  };
}

function FrameContent({
  children,
  surface,
  bounds,
  modal,
  scopePortals,
}: {
  readonly children: ReactNode;
  readonly surface: PreviewContext['surface'];
  readonly bounds: boolean;
  readonly modal: boolean;
  readonly scopePortals: boolean;
}): ReactElement {
  const scope = useRef<HTMLDivElement>(null);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const attach = useCallback(
    (node: HTMLDivElement | null): void => {
      scope.current = node;
      if (!scopePortals) {
        setHost(node);
      }
    },
    [scopePortals],
  );
  useSubjectBounds(scope, bounds);
  return (
    <div ref={attach} className="hint-example-viewport">
      {surface === 'overlay' && (
        <>
          <UnicaUnderlay />
          {!modal && <div className="hint-example-scrim" aria-hidden="true" />}
        </>
      )}
      <div
        className="hint-example-viewport-content"
        data-surface={surface}
        ref={scopePortals ? setHost : undefined}
      >
        <UnicaProvider portalContainer={host}>{children}</UnicaProvider>
      </div>
    </div>
  );
}

/** Each comparison gets its own viewport for native top-layer content. */
export function OverlayExampleFrame({
  ctx,
  title,
  height,
  modal = false,
  scopePortals = false,
  linksToParent = false,
  className,
  children,
}: {
  readonly ctx: Pick<PreviewContext, 'theme' | 'surface'>;
  readonly title: string;
  readonly height: number;
  readonly modal?: boolean;
  readonly scopePortals?: boolean;
  readonly linksToParent?: boolean;
  readonly className?: string;
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
    if (!target || !frame.current) {
      return;
    }
    const disposeOverrides = mirrorThemeOverrides(target, frame.current);
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
      disposeOverrides();
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
      {target &&
        createPortal(
          <FrameContent
            surface={ctx.surface}
            bounds={bounds}
            modal={modal}
            scopePortals={scopePortals}
          >
            {children}
          </FrameContent>,
          target.body,
        )}
      <iframe
        ref={frame}
        className={['hint-example-frame', modal && 'hint-example-frame--modal', className]
          .filter(Boolean)
          .join(' ')}
        title={title}
        height={height}
        srcDoc={source(linksToParent)}
        data-overlay-frame-contained={scopePortals ? '' : undefined}
        data-wb-pending={target && target === ready ? undefined : ''}
        onLoad={(event) => load(event.currentTarget)}
      />
    </>
  );
}
