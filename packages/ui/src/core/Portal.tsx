import { useContext, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { getDocumentBody } from './dom.js';
import { PortalContext } from './portal-context.js';

export interface PortalProps {
  readonly children: ReactNode;
  readonly container?: HTMLElement | null | undefined;
  readonly disabled?: boolean | undefined;
}

const subscribe = (): (() => void) => () => {};
const getClientSnapshot = (): boolean => typeof document !== 'undefined';
const getServerSnapshot = (): boolean => false;

function useContainer(container: PortalProps['container']): HTMLElement | null {
  const inherited = useContext(PortalContext);
  const isClient = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  if (!isClient) {
    return null;
  }
  return container === undefined
    ? inherited === undefined
      ? getDocumentBody(document)
      : inherited
    : container;
}

export function usePortalContainer(): HTMLElement | null {
  return useContainer(undefined);
}

/**
 * Renders children into a DOM container outside the current layout hierarchy while preserving
 * React context and event propagation. Publishes its resolved host to nested portals.
 */
export function Portal({ children, container, disabled }: PortalProps): ReactNode {
  const target = useContainer(container);
  if (disabled) {
    return children;
  }
  return target && createPortal(<PortalContext value={target}>{children}</PortalContext>, target);
}
