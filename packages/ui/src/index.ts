import './styles.css';

export { THEME_PRESETS } from './core/themes.js';
export type { ThemePreset, ThemePresetMeta } from './core/themes.js';
export { UnicaProvider } from './core/UnicaProvider.js';
export type { ThemeConfig } from './core/UnicaProvider.js';
export type { UnicaComponentDefaults, UnicaProviderProps } from './core/UnicaProvider.js';
export { Portal, PortalProvider, usePortalContainer } from './core/Portal.js';
export type { PortalProps, PortalProviderProps } from './core/Portal.js';

export { Icon, IconProvider } from './components/Icon/Icon.js';
export type {
  IconColor,
  IconProps,
  IconProviderProps,
  IconSize,
  IconUsage,
} from './components/Icon/Icon.js';
export { defineGlyph } from './components/Icon/glyph.js';
export type {
  BuiltinIconAdapterName,
  GlyphComponent,
  GlyphDefinition,
  GlyphSource,
  GlyphSvgProps,
  IconAdapter,
  IconAdapterRenderContext,
} from './components/Icon/glyph.js';

export { Progress } from './components/Progress/Progress.js';
export type {
  ProgressProps,
  ProgressSize,
  ProgressStatus,
} from './components/Progress/Progress.js';
export { ProgressCircle } from './components/Progress/ProgressCircle.js';
export type { ProgressCircleProps } from './components/Progress/ProgressCircle.js';
export { Spinner } from './components/Progress/Spinner.js';
export type { SpinnerProps, SpinnerSize, SpinnerTone } from './components/Progress/Spinner.js';
