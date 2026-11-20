import type { ThemeConfig, UnicaComponentDefaults } from '../src/index.js';

export const supportedTheme = {
  preset: 'soft-dark',
  defaults: { Icon: { size: 'm' } },
} satisfies ThemeConfig;

export const unknownFamily = {
  // @ts-expect-error Families opt into configurable defaults.
  Icons: { size: 'm' },
} satisfies UnicaComponentDefaults;

export const unknownAxis = {
  Icon: {
    size: 'm',
    // @ts-expect-error Event handlers are not defaults.
    onClick: (): void => {},
  },
} satisfies UnicaComponentDefaults;

export const unknownSize = {
  Icon: {
    // @ts-expect-error Only the approved Icon sizes are available.
    size: 'xl',
  },
} satisfies UnicaComponentDefaults;
