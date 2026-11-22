import { useCallback, useEffect, useRef, useState } from 'react';
import type { JSX } from 'react';
import { hydrateRoot } from 'react-dom/client';
import {
  Divider,
  Portal,
  UnicaProvider,
  getUnicaRootProps,
  usePortalContainer,
} from '@docouno/unica';

type PortalMode = 'undefined' | 'waiting' | 'host';

function PortalStatus({ testId }: { readonly testId: string }): JSX.Element {
  const container = usePortalContainer();
  return <output data-testid={testId}>{container ? 'ready' : 'waiting'}</output>;
}

function HydratableScope({
  host,
}: {
  readonly host?: HTMLElement | null | undefined;
}): JSX.Element {
  return (
    <section {...getUnicaRootProps({ theme: 'pixel-light' })} data-testid="ssr-themed-root">
      <UnicaProvider theme="pixel-light" portalContainer={host}>
        <PortalStatus testId="ssr-portal-status" />
        <Portal>
          <div data-testid="ssr-portaled-leaf">Hydrated portal content</div>
        </Portal>
      </UnicaProvider>
    </section>
  );
}

export default function PortalProviderFixture(): JSX.Element {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [waitingHost, setWaitingHost] = useState<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<PortalMode>('undefined');
  const [waitingResolved, setWaitingResolved] = useState(false);
  const hydrateBoxRef = useRef<HTMLDivElement | null>(null);
  const hydrateHostRef = useRef<HTMLDivElement | null>(null);
  const hydrateErrorsRef = useRef<string[]>([]);

  const runHydrationCheck = useCallback((serverHtml: string) => {
    const box = hydrateBoxRef.current;
    const targetHost = hydrateHostRef.current;
    if (!box || !targetHost) {
      return { ok: false, errors: ['Missing hydration containers'] };
    }
    hydrateErrorsRef.current = [];
    box.innerHTML = serverHtml;
    const beforeSection = box.querySelector('[data-testid="ssr-themed-root"]');
    const root = hydrateRoot(box, <HydratableScope host={targetHost} />, {
      onRecoverableError: (err) => {
        hydrateErrorsRef.current.push(String(err));
      },
    });
    return {
      ok: true,
      preservedNode: () => box.querySelector('[data-testid="ssr-themed-root"]') === beforeSection,
      getErrors: () => [...hydrateErrorsRef.current],
      unmount: () => root.unmount(),
    };
  }, []);

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__runPortalHydration = runHydrationCheck;
    return () => {
      delete (window as unknown as Record<string, unknown>).__runPortalHydration;
    };
  }, [runHydrationCheck]);

  const activeContainer = mode === 'host' ? host : mode === 'waiting' ? null : undefined;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div data-testid="outer-body-ref" />

      <section {...getUnicaRootProps({ theme: 'pixel-light' })} data-testid="scoped-theme-section">
        <div ref={setHost} data-testid="scoped-portal-host" />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setMode('undefined')}>
            Mode undefined
          </button>
          <button type="button" onClick={() => setMode('waiting')}>
            Mode waiting
          </button>
          <button type="button" onClick={() => setMode('host')}>
            Mode host
          </button>
        </div>
        <UnicaProvider theme="pixel-light" portalContainer={activeContainer}>
          <PortalStatus testId="mode-portal-status" />
          <Portal>
            <div data-testid="portaled-probe">
              <span>Outer portal</span>
              <Portal>
                <div data-testid="nested-portaled-probe">Self-nested portal</div>
              </Portal>
            </div>
          </Portal>
        </UnicaProvider>
      </section>

      <section {...getUnicaRootProps({ theme: 'pixel-light' })} data-testid="waiting-section">
        <div ref={setWaitingHost} data-testid="waiting-portal-host" />
        <button type="button" onClick={() => setWaitingResolved(true)}>
          Resolve waiting host
        </button>
        <UnicaProvider theme="pixel-light" portalContainer={waitingResolved ? waitingHost : null}>
          <PortalStatus testId="waiting-status" />
          <Portal>
            <div data-testid="waiting-portaled-probe">Resolved after waiting</div>
          </Portal>
        </UnicaProvider>
      </section>

      <section data-testid="surface-cascade">
        <div
          {...getUnicaRootProps({ theme: 'pixel-light' })}
          data-surface="base"
          data-testid="ref-base"
        >
          <Divider data-testid="ref-base-divider" />
        </div>
        <div
          {...getUnicaRootProps({ theme: 'pixel-light' })}
          data-surface="overlay"
          data-testid="colocated-overlay"
        >
          <Divider data-testid="colocated-overlay-divider" />
        </div>
        <div data-surface="overlay">
          <div
            {...getUnicaRootProps({ theme: 'pixel-light' })}
            data-testid="nested-theme-in-overlay"
          >
            <Divider data-testid="nested-theme-divider" />
          </div>
        </div>
        <div
          {...getUnicaRootProps({ theme: 'frost-light' })}
          data-surface="base"
          data-testid="frost-ref-base"
        />
        <div
          {...getUnicaRootProps({ theme: 'frost-light' })}
          data-surface="overlay"
          data-testid="frost-colocated-overlay"
        />
        <div data-surface="overlay">
          <div
            {...getUnicaRootProps({ theme: 'frost-light' })}
            data-testid="frost-nested-theme-in-overlay"
          />
        </div>
      </section>

      <section data-testid="ssr-preview">
        <HydratableScope host={null} />
      </section>

      <div {...getUnicaRootProps({ theme: 'pixel-light' })}>
        <div ref={hydrateHostRef} data-testid="hydrate-portal-host" />
        <div ref={hydrateBoxRef} data-testid="hydrate-box" />
      </div>
    </div>
  );
}
