import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef, Fragment, memo, StrictMode, useCallback } from 'react';
import type {
  ComponentPropsWithRef,
  MouseEvent,
  ReactElement,
  ReactNode,
  RefCallback,
} from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { Link, UnicaProvider, defineGlyph } from '../src/index.js';
import type { GlyphSvgProps, LinkProps } from '../src/index.js';

type RouterProps = Omit<ComponentPropsWithRef<'a'>, 'href'> & { to: string; prefetch?: boolean };

function Route({ to, prefetch, ...props }: RouterProps): ReactElement {
  return <a {...props} href={to} data-prefetch={prefetch} />;
}

function NullDetachRoute({ ref, ...props }: RouterProps): ReactElement {
  const forwardRef = useCallback<RefCallback<HTMLAnchorElement>>(
    (node) => {
      // This simulates adapters that intentionally discard the returned cleanup.
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );
  return <Route {...props} ref={forwardRef} />;
}

function Mark(props: GlyphSvgProps): ReactElement {
  return <svg {...props} data-source="mark" />;
}
const fixedMark = defineGlyph(Mark);

afterEach(cleanup);

it('resolves only Link.size from instance, override, theme, and built-in defaults', () => {
  render(
    <>
      <Link href="/plain">Built in</Link>
      <UnicaProvider theme={{ preset: 'soft-light', defaults: { Link: { size: 'body-l' } } }}>
        <Link href="/guide">Theme</Link>
        <UnicaProvider overrides={{ Link: { size: 'caption-l' } }}>
          <UnicaProvider overrides={{ Icon: { size: 's' } }}>
            <Link href="/guide">Override</Link>
            <Link href="/guide" size="inherit">
              Instance
            </Link>
          </UnicaProvider>
        </UnicaProvider>
      </UnicaProvider>
    </>,
  );
  expect(screen.getAllByRole('link').map((node) => node.dataset.unicaLinkSize)).toEqual([
    'inherit',
    'body-l',
    'caption-l',
    'inherit',
  ]);
});

it('combines child attributes, actions and refs while owning secure navigation and the glyphs', () => {
  const outerRef = createRef<HTMLAnchorElement>();
  const childRef = createRef<HTMLAnchorElement>();
  const calls: string[] = [];
  let stopInChild = true;
  const outer = (event: MouseEvent) => {
    calls.push('outer');
    event.preventDefault();
  };
  const inner = (event: MouseEvent) => {
    calls.push('child');
    if (stopInChild) {
      event.preventDefault();
    }
  };
  render(
    <>
      <span id="source">PDF</span>
      <Link
        asChild
        ref={outerRef}
        onClick={outer}
        iconLeft={fixedMark}
        iconRight={fixedMark}
        aria-describedby="outer-description"
        className="outer"
        style={{ color: 'red', margin: '8px' }}
      >
        <Route
          to="#report"
          ref={childRef}
          target="_BLANK"
          rel={' Opener NoFoLlOw nofollow NOOPENER\tNoReFeRrEr '}
          className="inner"
          style={{ color: 'blue' }}
          aria-describedby="source source"
          aria-disabled="true"
          onClick={inner}
        >
          Report
        </Route>
      </Link>
    </>,
  );
  const anchor = screen.getByRole<HTMLAnchorElement>('link', { name: 'Report' });
  expect(screen.getAllByRole('link')).toEqual([anchor]);
  expect(anchor).toBe(childRef.current);
  expect(anchor).toBe(outerRef.current);
  expect(anchor.getAttribute('href')).toBe('#report');
  expect(anchor.getAttribute('rel')).toBe('NoFoLlOw noopener noreferrer');
  expect(anchor.hasAttribute('aria-disabled')).toBe(false);
  expect(anchor.className).toBe('unica-link outer inner');
  expect(anchor.style.color).toBe('blue');
  expect(anchor.style.margin).toBe('8px');
  const ids = anchor.getAttribute('aria-describedby')?.split(' ') ?? [];
  expect(ids).toHaveLength(3);
  expect(ids[0]).toBe('source');
  expect(ids[1]).toBe('outer-description');
  expect(document.getElementById(ids[2]!)?.textContent?.trim()).toBe('Opens in a new tab');
  expect(anchor.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(2);
  expect(anchor.querySelectorAll('[data-source="mark"]')).toHaveLength(1);

  expect(fireEvent.click(anchor)).toBe(false);
  stopInChild = false;
  expect(fireEvent.click(anchor)).toBe(false);
  expect(calls).toEqual(['child', 'child', 'outer']);
});

it.each([
  { kind: 'React cleanup', Adapter: Route },
  { kind: 'router null detach', Adapter: NullDetachRoute },
])('releases refs across replacement, disabled and unmount with $kind', ({ Adapter }) => {
  const outerRef = createRef<HTMLAnchorElement>();
  const attached = new Set<HTMLAnchorElement>();
  const first = vi.fn<RefCallback<HTMLAnchorElement>>((node) => {
    if (node) {
      expect(attached.has(node)).toBe(false);
      attached.add(node);
      return () => expect(attached.delete(node)).toBe(true);
    }
    throw new Error('React 19 cleanup must replace ref(null) for this callback');
  });
  const replacement = createRef<HTMLAnchorElement>();
  const action = vi.fn();
  const ancestor = vi.fn();
  function view(disabled: boolean, ref: ComponentPropsWithRef<'a'>['ref']): ReactNode {
    return (
      <StrictMode>
        <div onClick={ancestor} onAuxClick={ancestor}>
          <Link
            asChild
            ref={outerRef}
            disabled={disabled}
            onClick={action}
            onClickCapture={action}
            onAuxClickCapture={action}
          >
            <Adapter
              to="#guide"
              id="route"
              ref={ref}
              prefetch
              target="_blank"
              rel="opener"
              download
              aria-current="page"
              aria-description="Pending export"
              onAuxClick={action}
            >
              Guide
            </Adapter>
          </Link>
        </div>
      </StrictMode>
    );
  }

  const { rerender, unmount } = render(view(false, first));
  const enabled = screen.getByRole('link');
  expect([...attached]).toEqual([enabled]);
  rerender(view(false, replacement));
  expect(attached.size).toBe(0);
  expect(replacement.current).toBe(outerRef.current);
  expect(replacement.current).toBe(enabled);

  rerender(view(true, replacement));
  const unavailable = screen.getByRole('link');
  expect(unavailable).not.toBe(enabled);
  expect(outerRef.current).toBe(unavailable);
  expect(replacement.current).toBe(unavailable);
  expect(unavailable.id).toBe('route');
  expect(unavailable.getAttribute('aria-description')).toBe('Pending export');
  expect(unavailable.getAttribute('aria-disabled')).toBe('true');
  expect(unavailable.tabIndex).toBe(-1);
  for (const field of [
    'href',
    'target',
    'rel',
    'download',
    'aria-current',
    'to',
    'prefetch',
    'data-prefetch',
  ]) {
    expect(unavailable.hasAttribute(field), field).toBe(false);
  }
  act(() => unavailable.click());
  fireEvent(
    unavailable,
    new window.MouseEvent('auxclick', { button: 1, bubbles: true, cancelable: true }),
  );
  expect(action).not.toHaveBeenCalled();
  expect(ancestor).not.toHaveBeenCalled();

  rerender(view(false, first));
  expect([...attached]).toEqual([screen.getByRole('link')]);
  expect(replacement.current).toBeNull();
  unmount();
  expect(attached.size).toBe(0);
  expect(outerRef.current).toBeNull();
});

const MemoFragment = memo(Fragment);

it.each<{ label: string; value: ReactNode }>([
  { label: 'no child', value: null },
  { label: 'raw text', value: 'child' },
  { label: 'an array', value: [<a key="a" href="/a" />] },
  {
    label: 'a fragment',
    value: (
      <>
        <a href="/a" />
      </>
    ),
  },
  {
    label: 'a memoized fragment',
    value: (
      <MemoFragment>
        <a href="/a" />
      </MemoFragment>
    ),
  },
  { label: 'a button', value: <button>Submit</button> },
  { label: 'a div', value: <div /> },
  { label: 'an anchor without href', value: <a /> },
])('rejects $label before emitting interactive markup', ({ value }) => {
  expect(() => renderToString(<Link asChild>{value as ReactElement}</Link>)).toThrow(
    /Link asChild/,
  );
});

it('keeps the download request and still protects the target without an automatic marker', () => {
  const { rerender } = render(
    <Link href="/report.pdf" download="" target="_blank">
      Report
    </Link>,
  );
  const anchor = screen.getByRole('link');
  expect(anchor.getAttribute('download')).toBe('');
  expect(anchor.getAttribute('target')).toBe('_blank');
  expect(anchor.getAttribute('rel')).toBe('noopener noreferrer');
  expect(anchor.getAttribute('aria-describedby')).toBeNull();
  expect(anchor.querySelector('svg')).toBeNull();

  rerender(
    <UnicaProvider iconAdapter={() => null}>
      <Link href="/report.pdf" download target="_blank" external iconLeft={Mark} iconRight={Mark}>
        Report
      </Link>
    </UnicaProvider>,
  );
  const external = screen.getByRole('link');
  expect(external.querySelectorAll('svg')).toHaveLength(1);
  expect(external.querySelector('[data-source]')).toBeNull();
});

it('preserves a title description for a static formatted label before hydration', () => {
  const container = document.createElement('div');
  container.innerHTML = renderToString(
    <Link href="/report" target="_blank" title="PDF, 4 MB">
      <strong>
        <em>Report</em>
      </strong>
    </Link>,
  );
  const id = container.querySelector('a')?.getAttribute('aria-describedby');
  expect(id).toBeTruthy();
  expect(container.querySelector('[hidden]')?.textContent).toBe('PDF, 4 MB Opens in a new tab');
  expect(container.querySelector('a')?.title).toBe('PDF, 4 MB');
});

it('preserves applicable titles while omitting a duplicate of the rendered text', () => {
  const container = document.createElement('div');
  container.innerHTML = renderToString(
    <>
      <Link href="/report" target="_blank" title="Annual report">
        <strong>Annual</strong> <em>report</em>
      </Link>
      <Link href="/report" target="_blank" title="Annual report" aria-label="Annual report">
        Read the report
      </Link>
      <Link href="/report" target="_blank" title=" Annual report " aria-label="Annual report">
        Annual report
      </Link>
      <Link href="/report" target="_blank" title="Annual report">
        <img alt="Annual report" />
      </Link>
      <Link href="/report" target="_blank" title="Annualreport">
        Annual
        <br />
        report
      </Link>
    </>,
  );
  expect(
    Array.from(container.querySelectorAll('[hidden]'), (span) => span.textContent?.trim()),
  ).toEqual([
    'Opens in a new tab',
    'Annual report Opens in a new tab',
    'Opens in a new tab',
    'Annual report Opens in a new tab',
    'Annualreport Opens in a new tab',
  ]);
});

it.each(['presentation', 'none', 'presentation none'] as const)(
  'does not repeat a title used as the SSR name with role %s',
  (role) => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(
      <Link href="/report" target="_blank" title="Report">
        <img role={role} alt="Decorative illustration" />
      </Link>,
    );
    expect(container.querySelector('[hidden]')?.textContent?.trim()).toBe('Opens in a new tab');
    expect(container.querySelector('a')?.title).toBe('Report');
  },
);

it('preserves child identity when a trailing glyph or the final word changes', () => {
  const attachment = vi.fn();
  const detach = vi.fn();
  const labelRef: RefCallback<HTMLElement> = (element) => {
    if (element) {
      attachment(element);
      return detach;
    }
  };
  function view(external: boolean, append = false): ReactElement {
    return (
      <Link href="#report" external={external}>
        Read <strong ref={labelRef}>report</strong>
        {append && ' online'}
      </Link>
    );
  }

  const { rerender } = render(view(false));
  const anchor = screen.getByRole('link');
  const label = anchor.querySelector('strong');
  expect(label).not.toBeNull();

  rerender(view(true));
  expect(anchor.querySelector('svg')).not.toBeNull();
  expect(anchor.querySelector('strong')).toBe(label);
  rerender(view(true, true));
  expect(anchor.querySelector('strong')).toBe(label);
  rerender(view(false, true));
  expect(screen.getByRole('link')).toBe(anchor);
  expect(anchor.querySelector('strong')).toBe(label);
  expect(attachment).toHaveBeenCalledTimes(1);
  expect(attachment).toHaveBeenCalledWith(label);
  expect(detach).not.toHaveBeenCalled();
});

it('leaves authored sibling keys available when the terminal text needs markup', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    render(
      <Link href="#report" external>
        {[<strong key="terminal-1">Read</strong>, ' report']}
      </Link>,
    );
    expect(screen.getByRole('link', { name: 'Read report' })).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();
  } finally {
    consoleError.mockRestore();
  }
});

it('hydrates stable, unique descriptions and a native fallback from server HTML', async () => {
  const router = vi.fn();
  function Adapter(props: RouterProps): ReactElement {
    router();
    return <Route {...props} />;
  }

  function view() {
    const conflictingProps = { 'aria-disabled': 'true' } as unknown as Pick<
      LinkProps,
      'aria-disabled'
    >;
    return (
      <>
        <Link {...conflictingProps} href="/file" target="_blank" newTabHint=" ">
          File
        </Link>
        <Link href="/report" target="_blank" newTabHint="Die Seite öffnet sich in einem neuen Tab">
          Report
        </Link>
        <Link asChild disabled>
          <Adapter to="/archive">Archive</Adapter>
        </Link>
      </>
    );
  }
  const container = document.createElement('div');
  container.innerHTML = renderToString(view());
  document.body.append(container);
  const ids = Array.from(container.querySelectorAll('a'), (a) =>
    a.getAttribute('aria-describedby'),
  );
  expect(new Set(ids).size).toBe(3);
  expect(container.querySelector('#archive')).toBeNull();
  expect(container.querySelectorAll('a[href]')).toHaveLength(2);
  expect(container.querySelector('a')?.hasAttribute('aria-disabled')).toBe(false);
  expect(container.querySelector('[aria-disabled=true]')?.textContent).toBe('Archive');
  expect(router).not.toHaveBeenCalled();

  const onRecoverableError = vi.fn();
  const root = hydrateRoot(container, view(), { onRecoverableError });
  try {
    await act(async () => {});
    expect(
      Array.from(container.querySelectorAll('a'), (a) => a.getAttribute('aria-describedby')),
    ).toEqual(ids);
    expect(router).not.toHaveBeenCalled();
    expect(onRecoverableError).not.toHaveBeenCalled();
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});

it('resolves all 8 Link fields consistently without concatenating aria-labelledby and preserves single childRef null-detach', () => {
  const attached = new Set<HTMLAnchorElement>();
  const singleChildRef = vi.fn<RefCallback<HTMLAnchorElement>>((node) => {
    if (node) {
      attached.add(node);
      return () => {
        attached.delete(node);
      };
    }
    throw new Error('Cleanup must replace ref(null) even when Link has no outer ref');
  });

  const { unmount } = render(
    <>
      <span id="outer-lbl">Outer label</span>
      <span id="inner-lbl">Inner label</span>
      <span id="outer-desc">Outer desc</span>
      <Link
        asChild
        target="_blank"
        aria-labelledby="outer-lbl"
        aria-describedby="outer-desc"
        title="Outer tip"
      >
        <NullDetachRoute
          to="#x"
          ref={singleChildRef}
          target={undefined}
          aria-labelledby="inner-lbl"
          aria-describedby="inner-desc outer-desc"
        >
          Go
        </NullDetachRoute>
      </Link>
    </>,
  );

  const anchor = screen.getByRole<HTMLAnchorElement>('link');
  expect(anchor.getAttribute('target')).toBe('_blank');
  expect(anchor.getAttribute('rel')).toBe('noopener noreferrer');
  expect(anchor.getAttribute('aria-labelledby')).toBe('inner-lbl');
  const descIds = anchor.getAttribute('aria-describedby')?.split(' ') ?? [];
  expect(descIds.slice(0, 2)).toEqual(['inner-desc', 'outer-desc']);
  expect(descIds).toHaveLength(3);
  expect(attached.has(anchor)).toBe(true);

  unmount();
  expect(attached.size).toBe(0);
});

it('does not recreate TrailingGlyph or NewTabDescription observers on equivalent rerenders and logs zero SSR errors', () => {
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const observeCalls = vi.spyOn(MutationObserver.prototype, 'observe');
  const disconnectCalls = vi.spyOn(MutationObserver.prototype, 'disconnect');

  try {
    const html = renderToString(
      <Link href="/report" target="_blank" title="Details" aria-describedby="note" external>
        Report
      </Link>,
    );
    expect(html).toContain('Opens in a new tab');
    expect(errorSpy).not.toHaveBeenCalled();

    const { rerender, unmount } = render(
      <Link href="/report" target="_blank" title="Details" aria-describedby="note" external>
        Report
      </Link>,
    );
    const initialObserves = observeCalls.mock.calls.length;
    const initialDisconnects = disconnectCalls.mock.calls.length;
    expect(initialObserves).toBeGreaterThan(0);

    for (let tick = 0; tick < 3; tick++) {
      rerender(
        <Link href="/report" target="_blank" title="Details" aria-describedby="note" external>
          Report
        </Link>,
      );
    }

    expect(observeCalls.mock.calls.length).toBe(initialObserves);
    expect(disconnectCalls.mock.calls.length).toBe(initialDisconnects);
    unmount();
    expect(errorSpy).not.toHaveBeenCalled();
  } finally {
    observeCalls.mockRestore();
    disconnectCalls.mockRestore();
    errorSpy.mockRestore();
  }
});
