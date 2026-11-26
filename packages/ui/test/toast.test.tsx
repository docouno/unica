import { StrictMode, createRef, useLayoutEffect } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ToastQueue } from '../src/components/Toast/store.js';
import { Toast, ToastProvider, ToastViewport, UnicaProvider, useToast } from '../src/index.js';
import type { ToastId, ToastStore } from '../src/index.js';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('accepts 100 live entries synchronously, retaining earlier actions at capacity', () => {
  const queue = new ToastQueue();
  const toast = queue.commands;
  const undo = vi.fn();
  const first = toast.show({
    title: 'Archived',
    operationKey: 'archive',
    action: { label: 'Undo', onClick: undo },
  })!;
  const ids = Array.from({ length: 99 }, () => toast.show({ title: 'Same file' })!);
  expect(new Set([first, ...ids]).size).toBe(100);
  expect(toast.show({ title: 'Rejected' })).toBeNull();
  expect(
    toast.show({
      title: 'Still archived',
      operationKey: 'archive',
      action: { label: 'Undo', onClick: undo },
    }),
  ).toBe(first);
  expect(queue.getSnapshot()[0]?.id).toBe(first);
  queue.getSnapshot()[0]?.action?.onClick();
  expect(undo).toHaveBeenCalledOnce();
  expect(toast.update(ids[0]!, { status: 'danger' })).toBe(true);
  expect(toast.dismiss(first)).toBe(true);
  const replacement = toast.show({ title: 'Archived again', operationKey: 'archive' });
  expect(replacement).not.toBe(first);
  expect(toast.update(first, { title: 'Stale result' })).toBe(false);
  expect(toast.dismiss(first)).toBe(false);
  expect(queue.getSnapshot().at(-1)?.id).toBe(replacement);
  expect(queue.getSnapshot()).toHaveLength(100);
});

it('updates atomically, checks titles, and supports explicit clearing', () => {
  const queue = new ToastQueue();
  const { show, update } = queue.commands;
  const id = show({ title: 'Old title', description: 'Previous detail', status: 'danger' })!;
  const before = queue.getSnapshot();
  expect(() => update(id, { title: undefined, status: 'info' } as never)).toThrow(TypeError);
  expect(() => update(id, { action: { label: ' ', onClick: vi.fn() } })).toThrow(TypeError);
  expect(queue.getSnapshot()).toBe(before);
  expect(update(id, { description: undefined, status: undefined })).toBe(true);
  expect(queue.getSnapshot()[0]).toMatchObject({
    title: 'Old title',
    description: undefined,
    status: 'neutral',
  });
});

it('spends only monotonic readable time and starts a fresh budget on timed outcomes', () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  const queue = new ToastQueue();
  const { show, update } = queue.commands;
  const id = show({ title: 'Preparing export', loading: true })!;
  const timed = new Set<ToastId>([id]);
  let visible = true;
  const detach = queue.attachReading({ window, readable: () => (visible ? timed : new Set()) });

  queue.refreshReading();
  vi.advanceTimersByTime(20_000);
  expect(queue.getSnapshot()).toHaveLength(1);
  update(id, { title: 'Export ready', loading: false, status: 'success' });
  queue.refreshReading();
  vi.advanceTimersByTime(2000);
  visible = false;
  queue.refreshReading();
  vi.advanceTimersByTime(20_000);
  expect(queue.getSnapshot()).toHaveLength(1);
  expect(vi.getTimerCount()).toBe(0);

  visible = true;
  queue.refreshReading();
  vi.advanceTimersByTime(2000);
  update(id, { actionLayout: 'below' });
  detach();
  vi.advanceTimersByTime(20_000);
  const detachAgain = queue.attachReading({ window, readable: () => timed });
  queue.refreshReading();
  vi.advanceTimersByTime(1999);
  expect(queue.getSnapshot()).toHaveLength(1);
  vi.advanceTimersByTime(1);
  expect(queue.getSnapshot()).toHaveLength(0);
  expect(update(id, { title: 'Too late' })).toBe(false);
  detachAgain();
});

it('delivers only the latest meaningful revision and consumes each delivery once', () => {
  const queue = new ToastQueue();
  const { show, update, dismiss } = queue.commands;
  const announce = vi.fn();
  const id = show({ title: 'Preparing', loading: true })!;
  const stale = queue.nextDelivery('polite')!;
  update(id, { status: 'danger' }, { announce: false });
  expect(queue.nextDelivery('polite')).toBe(stale);
  update(id, { title: 'Already known' }, { announce: false });
  expect(queue.nextDelivery('polite')).toBeUndefined();
  queue.deliver(stale, announce);
  expect(announce).not.toHaveBeenCalled();

  update(id, { title: 'Retry failed', loading: false });
  const result = queue.nextDelivery('polite')!;
  expect(queue.nextDelivery('assertive')).toBeUndefined();
  queue.deliver(result, announce);
  queue.deliver(result, announce);
  expect(announce.mock.calls[0]?.[0]).toMatchObject({ title: 'Retry failed', status: 'danger' });
  expect(announce).toHaveBeenCalledOnce();

  update(id, { title: 'Service unavailable', urgency: 'assertive' });
  const removed = queue.nextDelivery('assertive')!;
  dismiss(id);
  queue.deliver(removed, announce);
  expect(announce).toHaveBeenCalledOnce();
});

it('keeps the first waiting slot when a revision changes within the same channel', () => {
  const queue = new ToastQueue();
  const { show, update } = queue.commands;
  const first = show({ title: 'First' })!;
  const second = show({ title: 'Second' })!;
  update(first, { title: 'First revised' });
  const revised = queue.nextDelivery('polite')!;
  expect(revised.entry).toMatchObject({ id: first, title: 'First revised' });
  queue.deliver(revised, () => {});
  expect(queue.nextDelivery('polite')?.entry.id).toBe(second);
});

it('keeps the first ref command through StrictMode and disposes on real unmount', () => {
  let firstId: ToastId | null = null;
  let firstStore: ToastStore | undefined;
  let childStore: ToastStore | undefined;
  const owner = (store: ToastStore | null): void => {
    if (store && !firstStore) {
      firstStore = store;
      firstId = store.show({ title: 'Preparing', operationKey: 'sample', loading: true });
    }
  };
  function Child() {
    const store = useToast();
    useLayoutEffect(() => {
      childStore = store;
    }, [store]);
    return <ToastViewport />;
  }
  const nested = createRef<ToastStore>();
  const view = render(
    <StrictMode>
      <UnicaProvider portalContainer={null}>
        <ToastProvider ref={owner}>
          <Child />
          <ToastProvider ref={nested}>
            <ToastViewport />
          </ToastProvider>
        </ToastProvider>
      </UnicaProvider>
    </StrictMode>,
  );
  expect(firstStore).toBe(childStore);
  expect(firstId).not.toBeNull();
  expect(nested.current?.update(firstId!, { title: 'Wrong owner' })).toBe(false);
  expect(firstStore?.update(firstId!, { title: 'Ready' })).toBe(true);
  view.unmount();
  expect(firstStore?.update(firstId!, { title: 'Too late' })).toBe(false);
  expect(firstStore?.show({ title: 'Too late' })).toBeNull();
});

it('keeps standalone cards passive with a localized name and state', () => {
  const ref = createRef<HTMLDivElement>();
  render(
    <ToastProvider messages={{ dismiss: (title) => `Hide ${title}`, stateLabel: () => 'Finished' }}>
      <Toast
        {...{ role: 'alert', 'aria-live': 'assertive', 'data-unica-toast-loading': true }}
        ref={ref}
        title="Report ready"
        status="success"
        onDismiss={vi.fn()}
      >
        Includes <bdi>release-notes.md</bdi>
      </Toast>
    </ToastProvider>,
  );
  expect(ref.current).toBe(
    screen.getByRole('group', { name: 'Report ready', description: 'Finished' }),
  );
  expect(ref.current?.hasAttribute('data-unica-toast-loading')).toBe(false);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByRole('button', { name: 'Hide Report ready' }).getAttribute('type')).toBe(
    'button',
  );
});
