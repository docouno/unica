import { createContext, use } from 'react';
import type { Context } from 'react';
import type { BuiltinIconAdapterName, IconAdapter } from './glyph.js';

export const IconAdapterContext: Context<BuiltinIconAdapterName | IconAdapter> =
  /* @__PURE__ */ createContext<BuiltinIconAdapterName | IconAdapter>('phosphor');

export function useIconAdapter(): BuiltinIconAdapterName | IconAdapter {
  return use(IconAdapterContext);
}
