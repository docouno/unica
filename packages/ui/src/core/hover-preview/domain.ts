import { createContext } from 'react';
import type { Context } from 'react';

export const DEFAULT_PREVIEW_DELAY = 600;

export interface PreviewDomain {
  readonly scope: object;
  readonly delay: number;
}

export const PreviewDomainContext: Context<PreviewDomain | null> =
  createContext<PreviewDomain | null>(null);

export function nonnegative(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) ? Math.max(0, value) : fallback;
}
