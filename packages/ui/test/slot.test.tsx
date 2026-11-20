import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef, Fragment, lazy, memo, StrictMode, Suspense } from 'react';
import type {
  ComponentPropsWithRef,
  MouseEvent,
  ReactElement,
  ReactNode,
  RefCallback,
} from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { composeEventHandlers } from '../src/core/composeEventHandlers.js';
import { mergeRefs } from '../src/core/mergeRefs.js';
import { Slot } from '../src/core/Slot.js';

afterEach(cleanup);

it('composes a slotted anchor and lets the child cancel the slot action', () => {
  const outerRef = createRef<HTMLAnchorElement>();
  const childRef = createRef<HTMLAnchorElement>();
  const calls: string[] = [];
  let cancel = false;

  render(
    <div onClick={() => calls.push('ancestor')}>
      <Slot
        ref={outerRef}
        title="Outer title"
        className="slot"
        style={{ color: 'red', padding: '4px' }}
        onClick={() => calls.push('slot')}
      >
        <a
          ref={childRef}
          href="#details"
          title="Child title"
          className="child"
          style={{ color: 'blue', display: 'inline-flex' }}
          onClick={(event) => {
            calls.push('child');
            event.stopPropagation();
            if (cancel) {
              event.preventDefault();
            }
          }}
        >
          Details
        </a>
      </Slot>
    </div>,
  );

  const anchor = screen.getByRole<HTMLAnchorElement>('link', { name: 'Details' });
  expect(screen.getAllByRole('link')).toEqual([anchor]);
  expect(anchor.getAttribute('href')).toBe('#details');
  expect(anchor.getAttribute('title')).toBe('Child title');
  expect(anchor.className).toBe('slot child');
  expect(anchor.style.color).toBe('blue');
  expect(anchor.style.padding).toBe('4px');
  expect(anchor.style.display).toBe('inline-flex');
  expect(outerRef.current).toBe(anchor);
  expect(childRef.current).toBe(anchor);

  fireEvent.click(anchor);
  expect(calls).toEqual(['child', 'slot']);
  cancel = true;
  fireEvent.click(anchor);
  expect(calls).toEqual(['child', 'slot', 'child']);
});

it.each<[string, ReactNode]>([
  ['no element', null],
  ['text', 'Text'],
  ['siblings', [<a key="one" />, <a key="two" />]],
  [
    'a fragment',
    <Fragment key="fragment">
      <a />
    </Fragment>,
  ],
  [
    'a Suspense boundary',
    <Suspense key="suspense" fallback="Loading">
      <a />
    </Suspense>,
  ],
  [
    'a StrictMode wrapper',
    <StrictMode key="strict-mode">
      <a />
    </StrictMode>,
  ],
])('reports %s as an invalid Slot child', (_name, children) => {
  expect(() => render(<Slot>{children}</Slot>)).toThrow('Slot requires exactly one React element');
});

it('forwards props and refs through a lazy memoized component', async () => {
  const ref = createRef<HTMLAnchorElement>();

  function Link(props: ComponentPropsWithRef<'a'>): ReactElement {
    return <a {...props} />;
  }

  const loaded = Promise.resolve({ default: memo(Link) });
  const LazyLink = lazy(() => loaded);
  await act(async () => {
    render(
      <Suspense fallback="Loading">
        <Slot className="slot" ref={ref}>
          <LazyLink href="#details">Details</LazyLink>
        </Slot>
      </Suspense>,
    );
    await loaded;
  });

  const anchor = screen.getByRole('link', { name: 'Details' });
  expect(anchor.className).toBe('slot');
  expect(ref.current).toBe(anchor);
});

it('preserves live ref attachments across prop-only updates in Strict Mode', () => {
  const outerRef = createRef<HTMLAnchorElement>();
  const plainRef = vi.fn<(node: HTMLAnchorElement | null) => void>();
  const cleanup = vi.fn();
  const replacementCleanup = vi.fn();
  const childRef = vi.fn<RefCallback<HTMLAnchorElement>>(() => cleanup);
  const replacementRef = vi.fn<RefCallback<HTMLAnchorElement>>(() => replacementCleanup);
  const mergedOuterRef = mergeRefs(outerRef, plainRef, undefined, null);

  function view(className: string, ref: RefCallback<HTMLAnchorElement>, key: string): ReactNode {
    return (
      <StrictMode>
        <Slot ref={mergedOuterRef} className={className}>
          <a href="#details" key={key} ref={ref}>
            Details
          </a>
        </Slot>
      </StrictMode>
    );
  }

  const { rerender, unmount } = render(view('before', childRef, 'original'));
  const original = screen.getByRole('link');
  expect(childRef.mock.calls).toEqual([[original], [original]]);
  expect(cleanup).toHaveBeenCalledTimes(1);
  expect(plainRef.mock.calls).toEqual([[original], [null], [original]]);

  rerender(view('after', childRef, 'original'));
  expect(screen.getByRole('link')).toBe(original);
  expect(original.className).toBe('after');
  expect(childRef).toHaveBeenCalledTimes(2);
  expect(cleanup).toHaveBeenCalledTimes(1);
  expect(plainRef).toHaveBeenCalledTimes(3);

  rerender(view('after', replacementRef, 'original'));
  expect(childRef).toHaveBeenCalledTimes(2);
  expect(cleanup).toHaveBeenCalledTimes(2);
  expect(replacementRef.mock.calls).toEqual([[original]]);
  expect(outerRef.current).toBe(original);

  rerender(view('after', replacementRef, 'replacement'));
  const replacement = screen.getByRole('link');
  expect(replacement).not.toBe(original);
  expect(outerRef.current).toBe(replacement);
  expect(replacementRef.mock.calls).toEqual([[original], [replacement], [replacement]]);
  expect(replacementCleanup).toHaveBeenCalledTimes(2);

  unmount();
  expect(outerRef.current).toBeNull();
  expect(replacementCleanup).toHaveBeenCalledTimes(3);
  expect(plainRef.mock.calls).toEqual([
    [original],
    [null],
    [original],
    [null],
    [original],
    [null],
    [replacement],
    [null],
    [replacement],
    [null],
  ]);
});

it('composes user and internal handlers without inventing a canceled event', () => {
  const internal = vi.fn<(event: MouseEvent<HTMLButtonElement>) => void>();
  const handler = composeEventHandlers((event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  }, internal);
  const { rerender } = render(<button onClick={handler}>Act</button>);
  fireEvent.click(screen.getByRole('button'));
  expect(internal).not.toHaveBeenCalled();

  rerender(<button onClick={composeEventHandlers(undefined, internal)}>Act</button>);
  fireEvent.click(screen.getByRole('button'));
  expect(internal).toHaveBeenCalledOnce();
});
