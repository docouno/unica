import type { Ref, RefCallback } from 'react';

export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return (node) => {
    if (node === null) {
      for (const ref of refs) {
        if (typeof ref === 'function') {
          ref(null);
        } else if (ref) {
          ref.current = null;
        }
      }
      return;
    }

    const detach: (() => void)[] = [];
    for (const ref of refs) {
      if (typeof ref === 'function') {
        const cleanup = ref(node);
        if (typeof cleanup === 'function') {
          detach.push(cleanup);
        } else {
          detach.push(() => {
            ref(null);
          });
        }
      } else if (ref) {
        ref.current = node;
        detach.push(() => {
          ref.current = null;
        });
      }
    }

    return () => {
      for (const cleanup of detach) {
        cleanup();
      }
    };
  };
}
