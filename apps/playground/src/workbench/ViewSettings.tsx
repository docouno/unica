import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

const SettingsTarget = createContext<HTMLElement | null | undefined>(undefined);

export function SettingsProvider({
  target,
  children,
}: {
  readonly target: HTMLElement | null;
  readonly children: ReactNode;
}): ReactNode {
  return <SettingsTarget value={target}>{children}</SettingsTarget>;
}

export function ViewSettings({ children }: { readonly children: ReactNode }): ReactNode {
  const target = useContext(SettingsTarget);
  return target === undefined ? children : target && createPortal(children, target);
}
