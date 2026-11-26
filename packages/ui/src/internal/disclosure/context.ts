import { createContext, useContext } from 'react';
import type { Context, Ref, RefObject } from 'react';

export interface PanelPolicy {
  readonly lazyMount?: boolean | undefined;
  readonly unmountOnExit?: boolean | undefined;
}

export interface DisclosureState extends PanelPolicy {
  readonly family: 'Accordion' | 'Collapsible';
  readonly open: boolean;
  readonly disabled: boolean;
  readonly panelId: string;
  readonly triggerId?: string;
  readonly panel?: Ref<HTMLDivElement> | undefined;
  readonly root: RefObject<HTMLDivElement | null>;
  readonly triggers: Set<HTMLButtonElement>;
  readonly lastTrigger?: RefObject<HTMLButtonElement | null>;
  readonly toggle: (trigger: HTMLButtonElement) => void;
  readonly preferredTrigger?: (panel: HTMLElement) => HTMLButtonElement | undefined;
}

export const DisclosureContext: Context<DisclosureState | null> =
  createContext<DisclosureState | null>(null);

export function useDisclosure(family: DisclosureState['family']): DisclosureState {
  const state = useContext(DisclosureContext);
  if (!state || state.family !== family) {
    throw new Error(
      `${family} parts need their own ${family === 'Accordion' ? 'AccordionItem' : 'Collapsible'}.`,
    );
  }
  return state;
}
