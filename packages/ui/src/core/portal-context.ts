import { createContext } from 'react';
import type { Context } from 'react';

export const PortalContext: Context<HTMLElement | null | undefined> = /* @__PURE__ */ createContext<
  HTMLElement | null | undefined
>(undefined);
