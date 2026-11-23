import type { ComponentType, ReactNode } from 'react';

export type ViewportSize = 'auto' | 360 | 768 | 1280 | 1440;
export type TextScale = 100 | 120;
export type TextDirection = 'ltr' | 'rtl';
export type Surface = 'base' | 'overlay';
export type SurfaceMode = 'auto' | Surface;
export type InspectorTab = 'playground' | 'matrix' | 'cases' | 'usage';
export type MatrixMode = 'slice' | 'pairwise' | 'full';
export type ComponentStatus = 'Proto' | 'UI';

export interface WorkbenchTheme {
  readonly id: string;
  readonly label: string;
  readonly family: string;
  readonly familyLabel: string;
  readonly colorScheme: 'dark' | 'light';
  readonly meta?: string;
}

export type PropValue = string | number | boolean;

interface PropMetadata {
  readonly group: string;
  readonly description: string;
  readonly label?: string;
  /** A setting of the demonstration, omitted from the default component JSX. */
  readonly demo?: true;
}

interface Choice {
  readonly value: string;
  readonly label?: string;
  readonly code?: string;
}

export type PropDefinition = PropMetadata &
  (
    | {
        readonly kind: 'enum' | 'slot';
        readonly choices: readonly Choice[];
        readonly default: string;
      }
    | { readonly kind: 'boolean'; readonly default: boolean }
    | { readonly kind: 'string'; readonly default: string; readonly examples?: readonly string[] }
    | { readonly kind: 'number'; readonly default: number; readonly examples?: readonly number[] }
    | { readonly kind: 'action'; readonly code: string }
  );

export type PropSchema = Readonly<Record<string, PropDefinition>>;
type ValueOf<Prop extends PropDefinition> = Prop extends {
  readonly choices: readonly (infer ChoiceType)[];
}
  ? ChoiceType extends Choice
    ? ChoiceType['value']
    : never
  : Prop extends { readonly kind: 'boolean' }
    ? boolean
    : Prop extends { readonly kind: 'number' }
      ? number
      : Prop extends { readonly kind: 'string' }
        ? string
        : never;

export type Values = Readonly<Record<string, PropValue>>;
export type ComponentValues<Props extends PropSchema> = Readonly<{
  [Key in keyof Props as Props[Key] extends { readonly kind: 'action' } ? never : Key]: ValueOf<
    Props[Key]
  >;
}>;

export interface Constraint {
  readonly kind: 'forbidden' | 'ignored' | 'precedence';
  readonly when: Values;
  readonly affects: readonly (string | { readonly key: string; readonly value: PropValue })[];
  readonly reason: string;
}

export interface PreviewContext {
  readonly id: string;
  readonly theme: WorkbenchTheme;
  readonly surface: Surface;
  readonly tab: InspectorTab;
  readonly comparing: boolean;
  readonly subject: { readonly 'data-wb-subject': '' };
  readonly form: { readonly 'data-wb-form': '' };
  readonly action: (name: string) => (value?: unknown) => void;
}

interface PreviewProps {
  readonly ctx: PreviewContext;
}

interface ComponentPreviewProps<Props extends PropSchema> extends PreviewProps {
  readonly values: ComponentValues<Props>;
}

export interface PreviewBlock {
  readonly id: string;
  readonly title: string;
  readonly caption?: string;
  readonly surface?: Surface;
  readonly overlayStage?: boolean;
  readonly mode?: 'live' | 'pinned';
  readonly render: ComponentType<PreviewProps>;
}

export interface CaseBlock extends PreviewBlock {
  readonly kind: 'content' | 'surface' | 'behavior';
  readonly width?: number;
  readonly compareSurfaces?: boolean;
}

export interface UsageBlock extends PreviewBlock {
  readonly code?: string;
}

export interface MatrixView {
  readonly id: string;
  readonly title: string;
  readonly caption?: string;
  readonly rows?: string;
  readonly cols?: string;
  readonly group?: string;
  readonly fixed?: Values;
  readonly surface?: Surface;
  readonly overlayStage?: boolean;
  /** Additional composition or states that give this slice context. */
  readonly reference?: ComponentType<PreviewProps>;
}

interface ComponentMetadata {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly status: ComponentStatus;
  readonly summary?: string;
  readonly componentName?: string;
  readonly defaultSurface?: Surface;
  readonly overlayStage?: boolean;
  readonly form?: 'wrap' | 'owned' | 'inline';
  readonly constraints?: readonly Constraint[];
  readonly matrixViews?: readonly MatrixView[];
  readonly cases?: readonly CaseBlock[];
  readonly usage?: readonly UsageBlock[];
}

export interface ComponentDefinition extends ComponentMetadata {
  readonly props: PropSchema;
  readonly render: ComponentType<PreviewProps & { readonly values: Values }>;
  readonly code?: (values: Values, attributes: string) => string;
}

export interface SceneDefinition {
  readonly id: string;
  readonly title: string;
  readonly group: string;
  readonly summary?: string;
  readonly defaultViewport?: ViewportSize;
  readonly surface?: Surface;
  readonly overlayStage?: boolean;
  readonly uses?: readonly string[];
  readonly render: ComponentType;
}

export interface WorkbenchStageContext {
  readonly theme: WorkbenchTheme;
  readonly surface: Surface;
  readonly overlayStage: boolean;
  readonly children: ReactNode;
}

export interface WorkbenchEmptyContext {
  readonly theme: WorkbenchTheme;
  readonly surface: Surface;
}

export interface WorkbenchArtboardContext {
  readonly theme: WorkbenchTheme;
  readonly host: HTMLDivElement | null;
  readonly children: ReactNode;
}

export type ThemeTokenKind = 'color' | 'length' | 'number' | 'choice' | 'text';

export interface ThemeTokenDefinition {
  readonly name: string;
  readonly label: string;
  readonly kind: ThemeTokenKind;
  readonly group: string;
  readonly description?: string;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly unit?: string;
  readonly choices?: readonly { readonly value: string; readonly label?: string }[];
  readonly scope?: 'theme' | 'overlay';
}

export type ThemeMacroValue = number | string;
export type ThemeMacroValues = Readonly<Record<string, ThemeMacroValue>>;

export interface ThemeMacroRangeBounds {
  readonly min: number;
  readonly max: number;
  readonly step?: number;
}

export type ThemeMacroControl =
  | {
      readonly id: string;
      readonly label: string;
      readonly description?: string;
      readonly kind: 'range';
      readonly min: number;
      readonly max: number;
      readonly step: number;
      readonly unit?: string;
      readonly schemeBounds?: Readonly<Partial<Record<'dark' | 'light', ThemeMacroRangeBounds>>>;
      readonly defaults: Readonly<Record<string, number>>;
    }
  | {
      readonly id: string;
      readonly label: string;
      readonly description?: string;
      readonly kind: 'color';
      readonly defaults: Readonly<Record<string, string>>;
    }
  | {
      readonly id: string;
      readonly label: string;
      readonly description?: string;
      readonly kind: 'choice';
      readonly choices: readonly { readonly value: string; readonly label: string }[];
      readonly defaults: Readonly<Record<string, string>>;
    };

export interface ThemeContrastPair {
  readonly id: string;
  readonly label: string;
  readonly foreground: string;
  readonly background: string;
  readonly backdrop?: string;
  readonly minRatio: number;
}

export interface ThemeEditorConfig {
  readonly storageKey?: string;
  readonly macros?: readonly ThemeMacroControl[];
  readonly computeMacros?: (
    theme: WorkbenchTheme,
    values: ThemeMacroValues,
    changedIds: ReadonlySet<string>,
  ) => Readonly<Record<string, string>>;
  readonly tokens: readonly ThemeTokenDefinition[];
  readonly contrastPairs?: readonly ThemeContrastPair[];
}

export interface WorkbenchConfig {
  readonly title: string;
  readonly subtitle?: string;
  readonly themes: readonly WorkbenchTheme[];
  readonly categories: readonly string[];
  readonly components: readonly ComponentDefinition[];
  readonly scenes: readonly SceneDefinition[];
  readonly themeEditor?: ThemeEditorConfig;
  readonly renderArtboard?: (ctx: WorkbenchArtboardContext) => ReactNode;
  readonly renderStage?: (ctx: WorkbenchStageContext) => ReactNode;
  readonly renderEmptyState?: (ctx: WorkbenchEmptyContext) => ReactNode;
}

export function defineComponent<const Props extends PropSchema>(
  definition: ComponentMetadata & {
    readonly props: Props;
    readonly render: ComponentType<ComponentPreviewProps<NoInfer<Props>>>;
    readonly code?: (values: ComponentValues<NoInfer<Props>>, attributes: string) => string;
  },
): ComponentDefinition {
  // The inspector constructs assignments from this definition's own prop schema.
  return definition as unknown as ComponentDefinition;
}

export function defineScene(definition: SceneDefinition): SceneDefinition {
  return definition;
}
