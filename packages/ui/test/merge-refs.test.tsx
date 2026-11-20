import { cleanup, render, screen } from '@testing-library/react';
import { Component, createRef } from 'react';
import type { ReactNode, RefCallback } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { mergeRefs } from '../src/core/mergeRefs.js';

afterEach(cleanup);

class RefErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render(): ReactNode {
    return this.state.failed ? 'Ref error' : this.props.children;
  }
}

it('rolls back a failed attachment before React handles the original error', () => {
  const failure = new Error('Ref attachment failed');
  const onCaughtError = vi.fn<(error: unknown) => void>();
  const release = vi.fn(() => {
    throw new Error('Rollback also failed');
  });
  const cleanupRef = vi.fn<RefCallback<HTMLDivElement>>(() => release);
  const objectRef = createRef<HTMLDivElement>();
  const plainRef = vi.fn<RefCallback<HTMLDivElement>>();
  const brokenRef = vi.fn<RefCallback<HTMLDivElement>>((node) => {
    if (node) {
      throw failure;
    }
  });
  const unusedRef = vi.fn<RefCallback<HTMLDivElement>>();
  const ref = mergeRefs(cleanupRef, objectRef, plainRef, brokenRef, unusedRef);

  render(
    <RefErrorBoundary>
      <div ref={ref} />
    </RefErrorBoundary>,
    { onCaughtError },
  );

  expect(screen.getByText('Ref error')).toBeTruthy();
  expect(onCaughtError.mock.calls.map(([error]) => error)).toEqual([failure]);
  const node = cleanupRef.mock.calls[0]?.[0];
  expect(node).toBeInstanceOf(HTMLDivElement);
  expect(cleanupRef.mock.calls).toEqual([[node]]);
  expect(release).toHaveBeenCalledOnce();
  expect(plainRef.mock.calls).toEqual([[node], [null]]);
  expect(brokenRef.mock.calls).toEqual([[node], [null]]);
  expect(unusedRef).not.toHaveBeenCalled();
  expect(objectRef.current).toBeNull();
});

it('releases other attachments even when a ref cleanup fails', () => {
  const failure = new Error('Ref cleanup failed');
  const onCaughtError = vi.fn<(error: unknown) => void>();
  const broken = vi.fn(() => {
    throw failure;
  });
  const release = vi.fn<() => void>();
  const objectRef = createRef<HTMLDivElement>();
  const plainRef = vi.fn<RefCallback<HTMLDivElement>>();
  const ref = mergeRefs(
    () => broken,
    objectRef,
    plainRef,
    () => release,
  );
  const { rerender } = render(
    <RefErrorBoundary>
      <div ref={ref}>Attached</div>
    </RefErrorBoundary>,
    { onCaughtError },
  );
  const node = screen.getByText('Attached');
  expect(objectRef.current).toBe(node);

  rerender(<RefErrorBoundary>{null}</RefErrorBoundary>);

  expect(onCaughtError.mock.calls.map(([error]) => error)).toEqual([failure]);
  expect(broken).toHaveBeenCalledOnce();
  expect(release).toHaveBeenCalledOnce();
  expect(plainRef.mock.calls).toEqual([[node], [null]]);
  expect(objectRef.current).toBeNull();
});
