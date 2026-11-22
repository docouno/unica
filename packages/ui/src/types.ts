import type { SPACING } from './consts.js';

export type ExactAxisSubset<
  Master extends Record<string, string>,
  Sub extends { readonly [K in keyof Sub]: K extends keyof Master ? Master[K] : never },
> = Sub;

export type Spacing = (typeof SPACING)[number];
