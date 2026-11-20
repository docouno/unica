import './styles.css';

export { THEME_PRESETS } from './core/themes.js';
export type { ThemePreset, ThemePresetMeta } from './core/themes.js';
export { UnicaProvider } from './core/UnicaProvider.js';
export type { ThemeConfig } from './core/UnicaProvider.js';
export type { UnicaComponentDefaults, UnicaProviderProps } from './core/UnicaProvider.js';

export { Icon, IconProvider } from './components/Icon/Icon.js';
export type { IconProps } from './components/Icon/Icon.js';
export { defineGlyph } from './components/Icon/glyph.js';
export type {
  BuiltinIconAdapterName,
  GlyphComponent,
  GlyphDefinition,
  GlyphSource,
  IconAdapter,
  IconAdapterRenderContext,
} from './components/Icon/glyph.js';
