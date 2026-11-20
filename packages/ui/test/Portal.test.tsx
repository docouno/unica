import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, render } from '@testing-library/react';
import { memo, StrictMode, useLayoutEffect } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, expectTypeOf, it, vi } from 'vitest';
import { Portal, PortalProvider, UnicaProvider, usePortalContainer } from '../src/index.js';
import type { PortalProps } from '../src/index.js';
import { useComponentDefaults } from '../src/core/UnicaProvider.js';
import { PACKAGE_VERSION } from '../src/core/version.js';

function host() {
  return document.body.appendChild(document.createElement('section'));
}

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

it('has no wrapper-specific props', () => {
  expectTypeOf<Extract<keyof PortalProps, 'ref' | 'asChild'>>().toBeNever();
});

it('keeps PACKAGE_VERSION synchronized with packages/ui/package.json', () => {
  const manifest = JSON.parse(
    readFileSync(resolve(import.meta.dirname, '../package.json'), 'utf8'),
  ) as { readonly version: string };
  expect(PACKAGE_VERSION).toBe(manifest.version);
});

it('memoizes inline theme literals in UnicaProvider without re-rendering memo consumers', () => {
  const renders = vi.fn();
  const Consumer = memo(function Consumer() {
    const size = useComponentDefaults('Icon', 'size', { builtIn: 'm' });
    renders(size);
    return <span>{size}</span>;
  });

  function Wrapper({ tick }: { readonly tick: number }) {
    return (
      <UnicaProvider theme={{ preset: 'frost-dark' }}>
        <span data-tick={tick} />
        <Consumer />
      </UnicaProvider>
    );
  }

  const { rerender } = render(<Wrapper tick={1} />);
  expect(renders).toHaveBeenCalledTimes(1);
  rerender(<Wrapper tick={2} />);
  expect(renders).toHaveBeenCalledTimes(1);
});

it('renders into the effective host without wrappers, switches hosts cleanly, and preserves React events', () => {
  const first = host();
  const second = host();
  const click = vi.fn();
  let mounts = 0;
  let unmounts = 0;

  function Tracked() {
    useLayoutEffect(() => {
      mounts++;
      return () => {
        unmounts++;
      };
    }, []);
    return <button type="button">Click</button>;
  }

  const content = (
    <div>
      <Tracked />
      <Portal>
        <span>Nested</span>
      </Portal>
    </div>
  );
  const { rerender } = render(
    <PortalProvider container={first}>
      <PortalProvider>
        <div onClick={click}>
          <Portal container={second}>{content}</Portal>
        </div>
      </PortalProvider>
    </PortalProvider>,
  );
  expect(first.children).toHaveLength(0);
  expect(second.children).toHaveLength(2);
  expect(mounts).toBe(1);
  expect(unmounts).toBe(0);
  second.querySelector('button')!.click();
  expect(click).toHaveBeenCalledOnce();

  // Direct host switch A -> B remounts cleanly without leaving a duplicate node.
  rerender(
    <PortalProvider container={first}>
      <div onClick={click}>
        <Portal container={first}>{content}</Portal>
      </div>
    </PortalProvider>,
  );
  expect(second.children).toHaveLength(0);
  expect(first.children).toHaveLength(2);
  expect(mounts).toBe(2);
  expect(unmounts).toBe(1);

  rerender(
    <PortalProvider container={first}>
      <Portal container={null}>{content}</Portal>
    </PortalProvider>,
  );
  expect(document.body.querySelector('button')).toBeNull();
  expect(unmounts).toBe(2);

  rerender(
    <PortalProvider container={first}>
      <Portal container={second} disabled>
        {content}
      </Portal>
    </PortalProvider>,
  );
  expect(first.textContent).toBe('Nested');
  expect(second.children).toHaveLength(0);
  expect(document.body.querySelector('button')?.parentElement?.parentElement).not.toBe(first);
});

it('honors a waiting provider, explicit overrides, body fallback, and a foreign host', () => {
  const iframe = document.body.appendChild(document.createElement('iframe'));
  const foreign = iframe.contentDocument!.body;
  const { rerender } = render(
    <PortalProvider container={null}>
      <Portal>
        <span>Waiting</span>
      </Portal>
      <Portal container={foreign}>
        <span>Foreign</span>
      </Portal>
    </PortalProvider>,
  );
  expect(document.body.textContent).toBe('');
  expect(foreign.textContent).toBe('Foreign');
  rerender(
    <Portal>
      <span>Body</span>
    </Portal>,
  );
  expect(foreign.textContent).toBe('');
  expect(document.body.querySelector('body > span')?.textContent).toBe('Body');
});

it.each(['body', 'explicit', 'waiting'] as const)(
  'hydrates a direct consumer and a portal with a %s host',
  async (destination) => {
    const target = host();
    const rootElement = host();
    const renders: Array<HTMLElement | null> = [];
    const mounted = new Set<Element>();
    const onRecoverableError = vi.fn();

    function Status() {
      const container = usePortalContainer();
      renders.push(container);
      return <output>{container ? 'ready' : 'waiting'}</output>;
    }

    function Child() {
      useLayoutEffect(() => {
        const node = document.querySelector('[data-hydrated-portal]')!;
        mounted.add(node);
        return () => {
          mounted.delete(node);
        };
      }, []);
      return <span data-hydrated-portal="">Portaled</span>;
    }

    function tree(container: PortalProps['container']) {
      return (
        <StrictMode>
          <PortalProvider container={container}>
            <Status />
            <Portal>
              <Child />
            </Portal>
          </PortalProvider>
        </StrictMode>
      );
    }

    const container =
      destination === 'waiting' ? null : destination === 'explicit' ? target : undefined;
    rootElement.innerHTML = renderToString(tree(container));
    expect(rootElement.textContent).toBe('waiting');
    renders.length = 0;
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(() => {
      root = hydrateRoot(rootElement, tree(container), { onRecoverableError });
      return Promise.resolve();
    });
    try {
      expect(renders[0]).toBeNull();
      expect(onRecoverableError).not.toHaveBeenCalled();
      if (destination === 'waiting') {
        expect(rootElement.textContent).toBe('waiting');
        expect(mounted.size).toBe(0);
        act(() => root!.render(tree(target)));
      }
      expect(rootElement.textContent).toBe('ready');
      expect(mounted.size).toBe(1);
      expect([...mounted][0]?.parentElement).toBe(destination === 'body' ? document.body : target);
    } finally {
      act(() => root?.unmount());
    }
    expect(mounted.size).toBe(0);
  },
);
