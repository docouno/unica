import type { Ref, RefCallback } from 'react';

function releaseRefs(cleanups: readonly (() => void)[]): void {
  let failure: { error: unknown } | undefined;
  for (const cleanup of cleanups) {
    try {
      cleanup();
    } catch (error) {
      failure ??= { error };
    }
  }
  if (failure) {
    throw failure.error;
  }
}

export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  let detach: (() => void) | undefined;

  return (node) => {
    if (node === null) {
      detach?.();
      return;
    }

    detach?.();

    const cleanups: (() => void)[] = [];
    try {
      for (const ref of refs) {
        if (typeof ref === 'function') {
          // Register the null fallback before invoking a callback that can throw.
          const index =
            cleanups.push(() => {
              ref(null);
            }) - 1;
          const cleanup = ref(node);
          if (typeof cleanup === 'function') {
            cleanups[index] = cleanup;
          }
        } else if (ref) {
          cleanups.push(() => {
            ref.current = null;
          });
          ref.current = node;
        }
      }
    } catch (error) {
      try {
        releaseRefs(cleanups);
      } catch {
        // The attachment error still belongs to React's error boundary.
      }
      throw error;
    }

    const release = (): void => {
      if (detach === release) {
        detach = undefined;
        releaseRefs(cleanups);
      }
    };
    detach = release;
    return release;
  };
}
