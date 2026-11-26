import { createContext, useContext } from 'react';
import type { Context, Ref } from 'react';
import type { MenuBranch, MenuController, MenuPanel } from './menu-controller.js';
import type { ContextMenuProps, MenuSize } from './types.js';

export interface MenuContextValue {
  readonly controller: MenuController;
  readonly size: MenuSize;
  readonly rootRef: Ref<HTMLButtonElement> | undefined;
  readonly context?: Pick<ContextMenuProps, 'longPress' | 'onInvoke' | 'shouldOpen'> | undefined;
}

interface MenuSubContextValue {
  readonly branch: MenuBranch;
  readonly ref: Ref<HTMLButtonElement> | undefined;
}

export const MenuContext: Context<MenuContextValue | null> = createContext<MenuContextValue | null>(
  null,
);
export const MenuLevelContext: Context<MenuPanel | null> = createContext<MenuPanel | null>(null);
export const MenuSubContext: Context<MenuSubContextValue | null> =
  createContext<MenuSubContextValue | null>(null);

export function useMenu(): MenuContextValue {
  const value = useContext(MenuContext);
  if (!value) {
    throw new Error('Menu parts require a Menu or ContextMenu root.');
  }
  return value;
}

export function useLevel(): MenuPanel {
  const level = useContext(MenuLevelContext);
  if (!level) {
    throw new Error('Menu rows require MenuContent or MenuSubContent.');
  }
  return level;
}
