import { createContext, useContext, useSyncExternalStore } from 'react';
import type { JSX, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface PortalProviderProps {
  readonly children: ReactNode;
  readonly container?: HTMLElement | null | undefined;
}

export interface PortalProps extends PortalProviderProps {
  readonly disabled?: boolean | undefined;
}

const PortalContext = /* @__PURE__ */ createContext<HTMLElement | null | undefined>(undefined);
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
      ? document.body
      : inherited
    : container;
}

export function usePortalContainer(): HTMLElement | null {
  return useContainer(undefined);
}

export function PortalProvider({ children, container }: PortalProviderProps): JSX.Element {
  const parent = useContext(PortalContext);
  return (
    <PortalContext value={container === undefined ? parent : container}>{children}</PortalContext>
  );
}

export function Portal({ children, container, disabled }: PortalProps): ReactNode {
  const target = useContainer(container);
  if (disabled) {
    return children;
  }
  return target && createPortal(<PortalContext value={target}>{children}</PortalContext>, target);
}
