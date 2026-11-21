import { cloneElement, useMemo } from 'react';
import type { ComponentPropsWithRef, ReactElement, ReactNode, RefCallback } from 'react';

type AnchorProps = ComponentPropsWithRef<'a'>;

export function RouterAnchor({
  children: [child, content],
  ref,
  ...props
}: Omit<AnchorProps, 'children'> & {
  children: readonly [ReactElement<AnchorProps>, ReactNode];
}): ReactElement {
  const routerRef = useMemo<RefCallback<HTMLAnchorElement> | undefined>(() => {
    // Slot returns a React 19 cleanup. Some routers still detach by calling ref(null).
    if (typeof ref !== 'function') {
      return;
    }

    let detach: (() => void) | undefined;
    return (node) => {
      detach?.();
      if (node === null) {
        return;
      }

      const cleanup = ref(node);
      const release = (): void => {
        if (detach === release) {
          detach = undefined;
          cleanup?.();
        }
      };
      detach = release;
      return release;
    };
  }, [ref]);

  return cloneElement(child, { ...props, ref: routerRef }, content);
}
