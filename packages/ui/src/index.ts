import './styles.css';

export { THEME_PRESETS } from './core/themes.js';
export type { ThemePreset, ThemePresetMeta } from './core/themes.js';
export { UnicaProvider } from './core/UnicaProvider.js';
export type { ThemeConfig } from './core/UnicaProvider.js';
export type { UnicaComponentDefaults, UnicaProviderProps } from './core/UnicaProvider.js';
export { Portal, PortalProvider, usePortalContainer } from './core/Portal.js';
export type { PortalProps, PortalProviderProps } from './core/Portal.js';

export { Badge } from './components/Badge/Badge.js';
export type { BadgeProps, BadgeStatus } from './components/Badge/Badge.js';
export { Blockquote } from './components/Blockquote/Blockquote.js';
export type { BlockquoteProps, BlockquoteTone } from './components/Blockquote/Blockquote.js';
export { Code } from './components/Code/Code.js';
export type { CodeProps, CodeTone } from './components/Code/Code.js';
export { Divider } from './components/Divider/Divider.js';
export type { DividerProps } from './components/Divider/Divider.js';

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

export { Indicator } from './components/Indicator/Indicator.js';
export type {
  IndicatorPosition,
  IndicatorProps,
  IndicatorStatus,
} from './components/Indicator/Indicator.js';

export { Kbd, KbdGroup } from './components/Kbd/Kbd.js';
export type { KbdGroupProps, KbdProps, KbdSize } from './components/Kbd/Kbd.js';

export { Grid, GridItem } from './components/Layout/Grid.js';
export type { GridItemProps, GridProps } from './components/Layout/Grid.js';
export { Box, Container, Flex, Stack } from './components/Layout/Layout.js';
export type {
  BoxProps,
  ContainerProps,
  FlexProps,
  StackProps,
} from './components/Layout/Layout.js';
export type { Responsive } from './components/Layout/responsive.js';

export { Link } from './components/Link/Link.js';
export type { LinkProps } from './components/Link/Link.js';

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

export { Text } from './components/Text/Text.js';
export type {
  TextAlign,
  TextColor,
  TextProps,
  TextSize,
  TextTag,
  TextWeight,
} from './components/Text/Text.js';
export { Title } from './components/Title/Title.js';
export type {
  HeadingTag,
  TitleProps,
  TitleSize,
  TitleTextWrap,
  TitleWeight,
} from './components/Title/Title.js';
