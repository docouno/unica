import { createContext, useContext } from 'react';
import type { Context, FocusEvent, FocusEventHandler } from 'react';
import type { RovingFocus } from '../../core/collections/useRovingFocus.js';
import type { createTabCollection, TabItem } from './collection.js';
import type { TabsActivationMode, TabsMountStrategy, TabsOrientation, TabsSize } from './types.js';

interface TabsContextValue {
  readonly id: string;
  readonly size: TabsSize;
  readonly orientation: TabsOrientation;
  readonly activationMode: TabsActivationMode;
  readonly mountStrategy: TabsMountStrategy;
  readonly collection: ReturnType<typeof createTabCollection>;
  readonly items: readonly TabItem[] | null;
  readonly selected: string | null;
  readonly confirmedSelection: string | null;
  readonly select: (key: string, node: HTMLButtonElement) => void;
  readonly trackPanelFocus: (key: string, panel: HTMLDivElement) => void;
  readonly attachPanel: (panel: HTMLDivElement, key: string) => () => void;
  readonly onPanelFocusCapture: (
    key: string,
    event: FocusEvent<HTMLDivElement>,
    onFocusCapture: FocusEventHandler<HTMLDivElement> | undefined,
  ) => void;
  readonly releasePanelFocus: (event: FocusEvent<HTMLDivElement>) => void;
}

interface TabsListContextValue {
  readonly collection: TabsContextValue['collection'];
  readonly getItemProps: RovingFocus<HTMLButtonElement>['getItemProps'];
  readonly hints: ReadonlySet<string>;
  readonly reveal: (node: HTMLButtonElement) => void;
}

export const TabsContext: Context<TabsContextValue | null> =
  /* @__PURE__ */ createContext<TabsContextValue | null>(null);
export const TabsListContext: Context<TabsListContextValue | null> =
  /* @__PURE__ */ createContext<TabsListContextValue | null>(null);
export const tabFocusOptions: FocusOptions = { preventScroll: true };

export function useTabs(): TabsContextValue {
  const tabs = useContext(TabsContext);
  if (!tabs) {
    throw new Error('Place TabsList and TabsPanel inside Tabs.');
  }
  return tabs;
}

export function useTabsList(collection: TabsContextValue['collection']): TabsListContextValue {
  const list = useContext(TabsListContext);
  if (!list || list.collection !== collection) {
    throw new Error('Place TabsTrigger inside the TabsList belonging to its Tabs.');
  }
  return list;
}

export function tabPartIds(id: string, value: string): { trigger: string; panel: string } {
  // Encode all code points so arbitrary string keys remain distinct, even lone surrogates.
  const key = Array.from(value, (character) => character.codePointAt(0)!.toString(36)).join('-');
  return { trigger: `${id}-tab-${key}`, panel: `${id}-panel-${key}` };
}

export function tabAttributes<Props extends object>(
  props: Props,
  reserved: ReadonlySet<string>,
): Props {
  return Object.fromEntries(
    Object.entries(props).filter(([key]) => {
      const name = key.toLowerCase();
      return !name.startsWith('data-unica-tabs-') && !reserved.has(name);
    }),
  ) as Props;
}
