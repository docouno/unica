export { Button } from './Button.js';
export type { ButtonProps, ButtonVariant } from './Button.js';

export type ThemePreset =
  'soft-dark' | 'soft-light' | 'frost-dark' | 'frost-light' | 'pixel-dark' | 'pixel-light';

export interface ThemePresetMeta {
  readonly id: ThemePreset;
  readonly label: string;
  readonly family: 'Soft' | 'Frost' | 'Pixel';
  readonly colorScheme: 'dark' | 'light';
  readonly radiusFactor: 0 | 1;
  readonly meta: string;
}

export const THEME_PRESETS: readonly ThemePresetMeta[] = [
  {
    id: 'soft-dark',
    label: 'Soft · Dark',
    family: 'Soft',
    colorScheme: 'dark',
    radiusFactor: 1,
    meta: 'Inter · R1 · Matte',
  },
  {
    id: 'soft-light',
    label: 'Soft · Light',
    family: 'Soft',
    colorScheme: 'light',
    radiusFactor: 1,
    meta: 'Inter · R1 · Vellum',
  },
  {
    id: 'frost-dark',
    label: 'Frost · Dark',
    family: 'Frost',
    colorScheme: 'dark',
    radiusFactor: 1,
    meta: 'Inter · R1 · Glass',
  },
  {
    id: 'frost-light',
    label: 'Frost · Light',
    family: 'Frost',
    colorScheme: 'light',
    radiusFactor: 1,
    meta: 'Inter · R1 · Alabaster',
  },
  {
    id: 'pixel-dark',
    label: 'Pixel · Dark',
    family: 'Pixel',
    colorScheme: 'dark',
    radiusFactor: 0,
    meta: 'JB Mono · R0 · Phosphor',
  },
  {
    id: 'pixel-light',
    label: 'Pixel · Light',
    family: 'Pixel',
    colorScheme: 'light',
    radiusFactor: 0,
    meta: 'JB Mono · R0 · Drafting',
  },
];
