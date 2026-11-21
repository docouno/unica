import './styles.css';

export { THEME_PRESETS, getUnicaRootProps } from './core/themes.js';
export type {
  ThemeConfig,
  ThemePreset,
  ThemePresetMeta,
  UnicaRootAttributes,
} from './core/themes.js';
export { UnicaProvider } from './core/UnicaProvider.js';
export type { UnicaComponentDefaults, UnicaProviderProps } from './core/UnicaProvider.js';
export { Portal, usePortalContainer } from './core/Portal.js';
export type { PortalProps } from './core/Portal.js';

export { Badge } from './components/Badge/Badge.js';
export type { BadgeProps, BadgeStatus } from './components/Badge/Badge.js';
export { Blockquote } from './components/Blockquote/Blockquote.js';
export type { BlockquoteProps, BlockquoteTone } from './components/Blockquote/Blockquote.js';
export { Code } from './components/Code/Code.js';
export type { CodeProps, CodeTone } from './components/Code/Code.js';
export { Divider } from './components/Divider/Divider.js';
export type { DividerProps } from './components/Divider/Divider.js';

export { Icon } from './components/Icon/Icon.js';
export type { IconColor, IconProps, IconSize, IconUsage } from './components/Icon/Icon.js';
export { defineGlyph } from './core/glyph.js';
export type {
  BuiltinIconAdapterName,
  GlyphComponent,
  GlyphDefinition,
  GlyphSource,
  GlyphSvgProps,
  IconAdapter,
  IconAdapterRenderContext,
} from './core/glyph.js';

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
export type { LinkProps, LinkSize } from './components/Link/Link.js';

export { Progress } from './components/Progress/Progress.js';
export type {
  ProgressProps,
  ProgressSize,
  ProgressStatus,
} from './components/Progress/Progress.js';
export { ProgressCircle } from './components/Progress/ProgressCircle.js';
export type { ProgressCircleProps } from './components/Progress/ProgressCircle.js';

export { Skeleton, SkeletonText } from './components/Skeleton/Skeleton.js';
export type { SkeletonProps, SkeletonTextProps } from './components/Skeleton/Skeleton.js';

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
