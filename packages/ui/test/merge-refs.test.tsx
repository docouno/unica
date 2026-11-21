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

it('handles attach A -> B, stale cleanup A after attach B, and idempotent null + cleanup in both orders', () => {
  const events: string[] = [];
  const objRef = createRef<string>();
  const cbRef: RefCallback<string> = (node) => {
    events.push(`attach:${node}`);
    if (node) {
      return () => {
        events.push(`cleanup:${node}`);
      };
    }
  };
  const merged = mergeRefs(objRef, cbRef);

  // Order 1: attach A -> attach B directly (auto-releases A) -> stale cleanup A is a no-op.
  const cleanupA = merged('A');
  expect(objRef.current).toBe('A');
  const cleanupB = merged('B');
  expect(objRef.current).toBe('B');
  expect(events).toEqual(['attach:A', 'cleanup:A', 'attach:B']);

  cleanupA?.();
  expect(objRef.current).toBe('B');
  expect(events).toEqual(['attach:A', 'cleanup:A', 'attach:B']);

  // Order 2: legacy ref(null) releases B once, then React 19 cleanupB is a no-op.
  merged(null);
  expect(objRef.current).toBeNull();
  expect(events).toEqual(['attach:A', 'cleanup:A', 'attach:B', 'cleanup:B']);
  cleanupB?.();
  expect(events).toEqual(['attach:A', 'cleanup:A', 'attach:B', 'cleanup:B']);

  // Order 3: React 19 cleanup releases C once, then legacy ref(null) is a no-op.
  const cleanupC = merged('C');
  expect(objRef.current).toBe('C');
  cleanupC?.();
  expect(objRef.current).toBeNull();
  merged(null);
  expect(events).toEqual([
    'attach:A',
    'cleanup:A',
    'attach:B',
    'cleanup:B',
    'attach:C',
    'cleanup:C',
  ]);
});
