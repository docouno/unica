import { createElement } from 'react';
import type { ComponentType, ReactElement, ReactNode } from 'react';

export type ViewportSize = 'auto' | 360 | 768 | 1280 | 1440;
export type TextScale = 100 | 120;
export type TextDirection = 'ltr' | 'rtl';
export type Surface = 'base' | 'overlay';
export type SurfaceMode = 'auto' | Surface;
export type BuiltinTabKind = 'playground' | 'states' | 'compositions' | 'usage';
export type InspectorTab = BuiltinTabKind | (string & {});
export type MatrixMode = 'slice' | 'pairwise' | 'full';
export type StatesMode = 'overview' | MatrixMode;
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

interface EnumChoice extends Choice {
  /** Sentinel choice (e.g. `"auto"`) representing an omitted prop in Playground, code, and Usage. */
  readonly omit?: true;
}

export type PropDefinition = PropMetadata &
  (
    | {
        readonly kind: 'enum';
        readonly choices: readonly EnumChoice[];
        readonly default: string;
      }
    | {
        readonly kind: 'slot';
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

export type StoryControlValue = string | number | boolean;
export type StoryControlValues = Readonly<Record<string, StoryControlValue>>;

export interface StoryControlChoice {
  readonly value: string;
  readonly label?: string;
}

export type StoryControlDefinition =
  | {
      readonly kind: 'enum';
      readonly label: string;
      readonly choices: readonly (string | StoryControlChoice)[];
      readonly default: string;
    }
  | {
      readonly kind: 'boolean';
      readonly label: string;
      readonly default: boolean;
    }
  | {
      readonly kind: 'number';
      readonly label: string;
      readonly default: number;
      readonly min?: number;
      readonly max?: number;
      readonly step?: number;
    };

export type StoryControlSchema = Readonly<Record<string, StoryControlDefinition>>;

export interface StoryActionDefinition {
  readonly id: string;
  readonly label: string;
}

export interface StoryActionEvent {
  readonly id: string;
  readonly seq: number;
}

export interface StoryContext {
  readonly controls: StoryControlValues;
  readonly setControl: (key: string, value: StoryControlValue) => void;
  readonly revision: number;
  readonly lastAction: StoryActionEvent | null;
  readonly onAction: (listener: (actionId: string) => void) => () => void;
  readonly reset: () => void;
}

export interface StoryFrameOptions {
  readonly controls?: StoryControlSchema;
  readonly actions?: readonly StoryActionDefinition[];
  readonly reset?: boolean;
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
  readonly story?: StoryContext;
}

export interface PreviewProps {
  readonly ctx: PreviewContext;
}

interface ComponentPreviewProps<Props extends PropSchema> extends PreviewProps {
  readonly values: ComponentValues<Props>;
}

export interface PreviewBlock extends StoryFrameOptions {
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

export interface CompositionBlock extends PreviewBlock {
  readonly code?: string;
}

/**
 * @deprecated Compatibility alias for `CompositionBlock` during specimen migration.
 * Author new specimens with `compositions` instead of `usage`.
 */
export type UsageBlock = CompositionBlock;

export interface MatrixView extends StoryFrameOptions {
  readonly id: string;
  readonly title: string;
  readonly caption?: string;
  readonly rows?: string;
  readonly cols?: string;
  readonly group?: string;
  readonly fixed?: Values;
  readonly surface?: Surface;
  readonly overlayStage?: boolean;
  /**
   * @deprecated Legacy unmigrated slice reference. In v3 specimens, keep `states` slices purely
   * generated without `reference` and author standalone examples as `cases`.
   */
  readonly reference?: ComponentType<PreviewProps>;
}

export type SlotRenderers = Readonly<Record<string, Readonly<Record<string, ReactNode>>>>;

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
  /** Declarative state slices shown sequentially on the States tab. */
  readonly states?: readonly MatrixView[];
  /**
   * @deprecated Compatibility alias for `states` during specimen migration.
   * Do not combine with `states`.
   */
  readonly matrixViews?: readonly MatrixView[];
  readonly cases?: readonly CaseBlock[];
  /** Concise product-independent local compositions shown on the Compositions tab. */
  readonly compositions?: readonly CompositionBlock[];
  /**
   * @deprecated Compatibility alias for `compositions` during specimen migration.
   * Do not combine with `compositions`.
   */
  readonly usage?: readonly UsageBlock[];
}

export interface ComponentDefinition extends ComponentMetadata {
  readonly props: PropSchema;
  readonly render: ComponentType<PreviewProps & { readonly values: Values }>;
  readonly code?: (values: Values, attributes: string) => string;
  readonly defaultChildren?: ReactNode;
  readonly defaultProps?: Readonly<Record<string, unknown>>;
}

export interface SceneContext {
  readonly theme: WorkbenchTheme;
  readonly surface: Surface;
  readonly story?: StoryContext;
}

export interface SceneDefinition extends StoryFrameOptions {
  readonly id: string;
  readonly title: string;
  readonly group: string;
  readonly summary?: string;
  readonly defaultViewport?: ViewportSize;
  readonly surface?: Surface;
  readonly overlayStage?: boolean;
  readonly uses?: readonly string[];
  readonly render: ComponentType<{ readonly ctx?: SceneContext }>;
}

export interface WorkbenchCustomTabContext {
  readonly component: ComponentDefinition;
  readonly themes: readonly WorkbenchTheme[];
  readonly scenes: readonly SceneDefinition[];
  readonly raw: boolean;
  readonly renderArtboards: (render: (theme: WorkbenchTheme) => ReactNode) => ReactElement;
}

export interface WorkbenchTabDefinition {
  readonly id: string;
  readonly label: string;
  readonly kind: BuiltinTabKind | 'custom';
  readonly aliases?: readonly string[];
  readonly render?: (ctx: WorkbenchCustomTabContext) => ReactNode;
}

export interface ComponentDocsSource {
  readonly importFrom?: string;
  readonly imports?: readonly string[];
  readonly markdown?: string | (() => Promise<string>);
  readonly sourceLabel?: string;
  readonly quickStartCode?: string;
}

export interface WorkbenchDocsConfig {
  readonly defaultImportFrom?: string;
  /** Optional allowlist of symbols exported from defaultImportFrom for Quick Start import inference. */
  readonly exportedNames?: ReadonlySet<string>;
  readonly resolve?: (component: ComponentDefinition) => ComponentDocsSource | undefined;
  readonly resolveDocLink?: (
    href: string,
    component: ComponentDefinition,
  ) =>
    | {
        readonly item: string;
        readonly tab?: InspectorTab;
        readonly slice?: string;
        readonly block?: string;
        readonly mode?: StatesMode;
      }
    | undefined;
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
  readonly componentTabs?: readonly WorkbenchTabDefinition[];
  readonly docs?: WorkbenchDocsConfig;
  readonly themeEditor?: ThemeEditorConfig;
  readonly renderArtboard?: (ctx: WorkbenchArtboardContext) => ReactNode;
  readonly renderStage?: (ctx: WorkbenchStageContext) => ReactNode;
  readonly renderEmptyState?: (ctx: WorkbenchEmptyContext) => ReactNode;
}

interface DeclarativeComponentOptions {
  readonly component: ComponentType<never>;
  readonly render?: never;
  readonly defaultChildren?: ReactNode;
  readonly defaultProps?: Readonly<Record<string, unknown>>;
  readonly slotRenderers?: SlotRenderers;
}

interface CustomRenderOptions<Props extends PropSchema> {
  readonly render: ComponentType<ComponentPreviewProps<NoInfer<Props>>>;
  readonly component?: never;
  readonly defaultChildren?: never;
  readonly defaultProps?: never;
  readonly slotRenderers?: never;
}

const PASCAL_IDENTIFIER = /^[A-Z][A-Za-z0-9_$]*$/;

function validateSlotRenderers(
  id: string,
  propsSchema: PropSchema,
  slotRenderers: SlotRenderers | undefined,
): void {
  if (!slotRenderers) {
    return;
  }
  for (const [key, entries] of Object.entries(slotRenderers)) {
    const prop = Object.hasOwn(propsSchema, key) ? propsSchema[key] : undefined;
    if (!prop || prop.kind !== 'slot') {
      throw new Error(
        `Workbench: "${id}" slotRenderers key "${key}" does not match a slot prop in props.`,
      );
    }
    const allowed = new Set(prop.choices.map((choice) => choice.value));
    for (const choiceValue of Object.keys(entries)) {
      if (!allowed.has(choiceValue)) {
        throw new Error(
          `Workbench: "${id}" slotRenderers["${key}"] has unknown choice "${choiceValue}".`,
        );
      }
    }
  }
}

function createDeclarativeRenderer(
  propsSchema: PropSchema,
  options: DeclarativeComponentOptions,
): ComponentType<PreviewProps & { readonly values: Values }> {
  const Target = options.component as ComponentType<Record<string, unknown>>;
  function DeclarativeSubject({
    values,
    ctx,
  }: PreviewProps & { readonly values: Values }): ReactElement {
    const mapped: Record<string, unknown> = {
      ...options.defaultProps,
      ...ctx.subject,
    };
    let children: ReactNode =
      options.defaultChildren !== undefined
        ? options.defaultChildren
        : (options.defaultProps?.children as ReactNode);
    delete mapped.children;
    for (const [key, prop] of Object.entries(propsSchema)) {
      if (prop.demo) {
        continue;
      }
      if (prop.kind === 'action') {
        mapped[key] = ctx.action(key);
        continue;
      }
      const value = values[key];
      if (prop.kind === 'slot') {
        const rendered = options.slotRenderers?.[key]?.[String(value)];
        if (key === 'children') {
          children = rendered;
        } else if (rendered !== undefined) {
          mapped[key] = rendered;
        } else {
          delete mapped[key];
        }
        continue;
      }
      if (prop.kind === 'enum') {
        const selected = prop.choices.find((choice) => choice.value === value);
        if (selected?.omit) {
          delete mapped[key];
          continue;
        }
      }
      if (key === 'children') {
        children = value as ReactNode;
        continue;
      }
      mapped[key] = value;
    }
    return children !== undefined
      ? createElement(Target, mapped, children)
      : createElement(Target, mapped);
  }
  const targetMeta = options.component as { displayName?: string; name?: string };
  DeclarativeSubject.displayName = `WorkbenchSubject(${targetMeta.displayName ?? targetMeta.name ?? 'Component'})`;
  return DeclarativeSubject;
}

export function defineComponent<const Props extends PropSchema>(
  definition: ComponentMetadata & {
    readonly props: Props;
    readonly code?: (values: ComponentValues<NoInfer<Props>>, attributes: string) => string;
  } & (CustomRenderOptions<Props> | DeclarativeComponentOptions),
): ComponentDefinition {
  if ('component' in definition && definition.component !== undefined) {
    validateSlotRenderers(definition.id, definition.props, definition.slotRenderers);
    const targetMeta = definition.component as { displayName?: string; name?: string };
    // Prefer explicit componentName, displayName, or a PascalCase title before function.name
    // because production minifiers rename function declarations.
    const inferredName =
      definition.componentName ??
      targetMeta.displayName ??
      (PASCAL_IDENTIFIER.test(definition.title) ? definition.title : undefined) ??
      (targetMeta.name && PASCAL_IDENTIFIER.test(targetMeta.name) ? targetMeta.name : undefined) ??
      definition.title;
    const render = createDeclarativeRenderer(definition.props, definition);
    const copy: Record<string, unknown> = { ...definition };
    delete copy.component;
    delete copy.slotRenderers;
    return {
      ...copy,
      componentName: inferredName,
      render,
    } as unknown as ComponentDefinition;
  }
  // The inspector constructs assignments from this definition's own prop schema.
  return definition as unknown as ComponentDefinition;
}

export function defineScene(definition: SceneDefinition): SceneDefinition {
  return definition;
}
