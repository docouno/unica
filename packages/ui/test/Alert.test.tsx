import { StrictMode, createRef, useState } from 'react';
import type { ReactElement } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Alert, AlertActions, AlertClose, AlertDescription, AlertTitle } from '../src/index.js';
import type { AlertCloseProps, AlertProps } from '../src/index.js';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('composes native nodes and refs in document order and delegates close requests', () => {
  const root = createRef<HTMLDivElement>();
  const title = createRef<HTMLHeadingElement>();
  const description = createRef<HTMLDivElement>();
  const actions = createRef<HTMLDivElement>();
  const close = createRef<HTMLButtonElement>();
  const onClose = vi.fn();
  const { rerender } = render(
    <Alert
      role="none"
      ref={root}
      id="notice"
      className="custom"
      aria-describedby="reason"
      close={
        <AlertClose
          ref={close}
          onClose={onClose}
          aria-label="Dismiss import notice"
          data-close="yes"
        />
      }
    >
      <AlertTitle as="h2" ref={title}>
        Read before importing
      </AlertTitle>
      <AlertDescription ref={description} id="reason">
        Use a <a href="#guide">supported file</a>.
      </AlertDescription>
      <AlertActions ref={actions}>
        <button type="button">Retry</button>
      </AlertActions>
    </Alert>,
  );
  expect(root.current?.id).toBe('notice');
  expect(root.current?.classList.contains('custom')).toBe(true);
  expect(root.current?.getAttribute('aria-describedby')).toBe('reason');
  expect(title.current).toBe(screen.getByRole('heading', { level: 2 }));
  expect(description.current?.id).toBe('reason');
  expect(actions.current?.firstElementChild).toBe(screen.getByRole('button', { name: 'Retry' }));
  expect(root.current?.querySelectorAll('a, button')).toEqual(
    expect.objectContaining({
      0: screen.getByRole('link'),
      1: actions.current?.firstElementChild,
      2: close.current,
    }),
  );
  expect(close.current?.type).toBe('button');
  expect(close.current?.dataset.close).toBe('yes');

  for (let index = 0; index < 3; index++) {
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss import notice' }));
  }
  expect(onClose).toHaveBeenCalledTimes(3);
  expect(onClose.mock.calls[0]?.[0]).toMatchObject({ type: 'click' });
  expect(root.current?.isConnected).toBe(true);
  rerender(
    <Alert role="none" hidden>
      Read before importing
    </Alert>,
  );
  expect(close.current).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
});

it('filters owned semantics supplied through an untyped spread', () => {
  const leaked: Record<string, unknown> = {
    ROLE: 'alert',
    'ARIA-LIVE': 'assertive',
    'Aria-Atomic': 'false',
    'aria-relevant': 'all',
  };
  const rootInput = {
    ...leaked,
    role: 'none',
    TABINDEX: 0,
    contenteditable: true,
    popover: 'auto',
    autoFocus: true,
    dangerouslySetInnerHTML: { __html: 'Replacement' },
  } as unknown as Omit<AlertProps, 'children'>;
  const onClose = vi.fn();
  const closeInput = {
    onClose,
    onClick: vi.fn(),
    'aria-label': 'Dismiss',
    'aria-labelledby': 'other',
    children: 'Other',
    TYPE: 'reset',
    form: 'other',
    tabIndex: -1,
  } as unknown as AlertCloseProps;

  const { container, rerender } = render(
    <Alert {...rootInput} close={<AlertClose {...closeInput} />}>
      <AlertTitle {...leaked} as="h2" id="heading">
        Check the source
      </AlertTitle>
      <AlertDescription {...leaked}>Details</AlertDescription>
      <AlertActions {...leaked}>
        <button type="button">Retry</button>
      </AlertActions>
    </Alert>,
  );
  expect(
    container.querySelectorAll('[role],[aria-live],[aria-relevant],[aria-atomic]'),
  ).toHaveLength(0);
  expect(container.querySelector('[tabindex],[contenteditable],[popover],[autofocus]')).toBeNull();
  expect(screen.getByRole('heading').id).toBe('heading');
  const close = screen.getByRole<HTMLButtonElement>('button', { name: 'Dismiss' });
  expect(close.type).toBe('button');
  expect(close.getAttribute('form')).toBeNull();
  expect(close.textContent).toBe('');
  fireEvent.click(close);
  expect(onClose).toHaveBeenCalledOnce();

  rerender(
    <Alert status="warning" {...{ ...rootInput, role: undefined }}>
      <AlertTitle {...leaked}>Check again</AlertTitle>
      <AlertDescription {...leaked}>Details</AlertDescription>
      <AlertActions {...leaked}>Recovery actions</AlertActions>
    </Alert>,
  );
  expect(container.querySelectorAll('[role],[aria-live]')).toHaveLength(1);
  expect(screen.getByRole('alert').getAttribute('aria-atomic')).toBe('true');
});

it('omits empty slots and rejects invalid close content at the DOM boundary', () => {
  const { container, rerender } = render(
    <Alert role="none" close={<button type="button">Invalid close</button>}>
      <AlertTitle>
        {false}
        {null}
      </AlertTitle>
      <AlertDescription>
        <>
          {''}
          {undefined}
        </>
      </AlertDescription>
      <AlertActions>{[false, null]}</AlertActions>
      {0}
    </Alert>,
  );
  expect(container.textContent).toBe('0');
  expect(
    container.querySelector(
      '.unica-alert-title,.unica-alert-description,.unica-alert-actions,button',
    ),
  ).toBeNull();
  rerender(
    <Alert role="none" close={<AlertClose aria-label=" " onClose={() => {}} />}>
      Tip
    </Alert>,
  );
  expect(screen.queryByRole('button')).toBeNull();
  rerender(
    <Alert role="none" close={<AlertClose {...({ 'aria-label': 'Dismiss' } as AlertCloseProps)} />}>
      Tip
    </Alert>,
  );
  expect(screen.queryByRole('button')).toBeNull();
});

describe('local announcement delivery', () => {
  async function wait(milliseconds: number): Promise<void> {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(milliseconds);
    });
  }

  it('waits for registration, keeps the latest text, and clears each delivery independently', async () => {
    vi.useFakeTimers();
    function Message({ text }: { readonly text: string }): ReactElement {
      return (
        <StrictMode>
          <Alert status="danger">
            <AlertTitle>Import</AlertTitle>
            <p>{text}</p>
          </Alert>
        </StrictMode>
      );
    }

    const { rerender } = render(<Message text="A" />);
    const live = screen.getByRole('alert');
    await wait(99);
    expect(live.textContent).toBe('');
    rerender(<Message text="B" />);
    rerender(<Message text="C" />);
    await wait(1);
    expect(live.textContent).toBe('Import C');
    await wait(6000);
    rerender(<Message text="D" />);
    await wait(0);
    expect(live.textContent).toBe('Import D');
    await wait(6999);
    expect(live.textContent).toBe('Import D');
    await wait(1);
    expect(live.textContent).toBe('');
    expect(within(live.parentElement!).getByText('D')).toBeTruthy();
    rerender(<Message text="D" />);
    await wait(100);
    expect(live.textContent).toBe('');
  });

  it('derives text from child state and starts a fresh delivery on reveal and urgency changes', async () => {
    vi.useFakeTimers();
    function Details(): ReactElement {
      const [text, setText] = useState('Check the manifest');
      return (
        <AlertDescription>
          {text} with <code>validate</code> and <a href="#guide">the guide</a>.
          <span hidden>Never read this.</span>
          <span aria-hidden="true">Decorative</span>
          <button type="button" onClick={() => setText('Review the package')}>
            Change text
          </button>
        </AlertDescription>
      );
    }
    function Message({
      hidden,
      urgent,
    }: {
      readonly hidden?: boolean;
      readonly urgent?: boolean;
    }): ReactElement {
      return (
        <Alert status="warning" role={urgent ? 'alert' : 'status'} hidden={hidden}>
          <AlertTitle>Package build</AlertTitle>
          <p>Review the result.</p>
          <Details />
          <AlertActions>
            <button type="button">Retry</button>
          </AlertActions>
          <Alert role="none">Nested message</Alert>
        </Alert>
      );
    }
    const { container, rerender, unmount } = render(<Message />);
    const status = screen.getByRole('status');
    rerender(<Message hidden />);
    await wait(100);
    expect(status.textContent).toBe('');
    expect(screen.queryByRole('status')).toBeNull();
    rerender(<Message />);
    await wait(99);
    expect(status.textContent).toBe('');
    await wait(1);
    expect(status.textContent).toBe(
      'Package build Review the result. Check the manifest with validate and the guide.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Change text' }));
    await wait(0);
    expect(status.textContent).toContain('Review the package');
    rerender(<Message urgent />);
    const urgent = screen.getByRole('alert');
    expect(status.isConnected).toBe(false);
    expect(urgent.textContent).toBe('');
    await wait(100);
    expect(urgent.textContent).toContain('Review the package');

    rerender(<Message />);
    unmount();
    await wait(100);
    expect(container.textContent).toBe('');
    expect(vi.getTimerCount()).toBe(0);
  });
});
