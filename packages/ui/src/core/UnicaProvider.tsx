import { createContext, use, useMemo } from 'react';
import type { JSX, ReactNode } from 'react';
import type {
  ComponentDefaultAxes,
  IconSize,
  LinkSize,
  UnicaComponentDefaults,
} from './defaults.js';
import type { BuiltinIconAdapterName, IconAdapter } from './glyph.js';
import { IconAdapterContext } from './icon-adapter.js';
import { PortalContext } from './portal-context.js';
import type { ThemeConfig, ThemePreset } from './themes.js';

export type { ComponentDefaultAxes, UnicaComponentDefaults } from './defaults.js';
export type { ThemeConfig } from './themes.js';

export interface UnicaProviderProps {
  readonly children: ReactNode;
  readonly theme?: ThemePreset | ThemeConfig | undefined;
  readonly overrides?: UnicaComponentDefaults | undefined;
  readonly portalContainer?: HTMLElement | null | undefined;
  readonly iconAdapter?: BuiltinIconAdapterName | IconAdapter | undefined;
}

interface UnicaInternalScope {
  readonly preset: ThemePreset;
  readonly themeIconSize: IconSize | undefined;
  readonly themeLinkSize: LinkSize | undefined;
  readonly overrideIconSize: IconSize | undefined;
  readonly overrideLinkSize: LinkSize | undefined;
}

const DEFAULT_SCOPE: UnicaInternalScope = /* @__PURE__ */ Object.freeze({
  preset: 'soft-dark',
  themeIconSize: undefined,
  themeLinkSize: undefined,
  overrideIconSize: undefined,
  overrideLinkSize: undefined,
});

// Read only by nested UnicaProvider instances so leaf components never subscribe to unrelated scopes.
const UnicaInternalScopeContext = /* @__PURE__ */ createContext<UnicaInternalScope>(DEFAULT_SCOPE);
const ThemePresetContext = /* @__PURE__ */ createContext<ThemePreset>('soft-dark');
const IconDefaultsContext = /* @__PURE__ */ createContext<IconSize | undefined>(undefined);
const LinkDefaultsContext = /* @__PURE__ */ createContext<LinkSize | undefined>(undefined);

/**
 * Wrapper-less root and scope provider for Unica structural defaults, portal containers,
 * and icon adapters. Renders `children` directly without emitting DOM nodes.
 */
export function UnicaProvider({
  children,
  theme,
  overrides,
  portalContainer,
  iconAdapter,
}: UnicaProviderProps): JSX.Element {
  const parentScope = use(UnicaInternalScopeContext);
  const parentPortal = use(PortalContext);
  const parentIconAdapter = use(IconAdapterContext);

  const preset: ThemePreset =
    theme === undefined ? parentScope.preset : typeof theme === 'string' ? theme : theme.preset;
  const themeIconSize: IconSize | undefined =
    theme === undefined
      ? parentScope.themeIconSize
      : typeof theme === 'string'
        ? undefined
        : theme.defaults?.Icon?.size;
  const themeLinkSize: LinkSize | undefined =
    theme === undefined
      ? parentScope.themeLinkSize
      : typeof theme === 'string'
        ? undefined
        : theme.defaults?.Link?.size;

  const overrideIconSize: IconSize | undefined =
    overrides?.Icon?.size ?? parentScope.overrideIconSize;
  const overrideLinkSize: LinkSize | undefined =
    overrides?.Link?.size ?? parentScope.overrideLinkSize;

  const scope = useMemo<UnicaInternalScope>(() => {
    if (
      preset === parentScope.preset &&
      themeIconSize === parentScope.themeIconSize &&
      themeLinkSize === parentScope.themeLinkSize &&
      overrideIconSize === parentScope.overrideIconSize &&
      overrideLinkSize === parentScope.overrideLinkSize
    ) {
      return parentScope;
    }
    return {
      preset,
      themeIconSize,
      themeLinkSize,
      overrideIconSize,
      overrideLinkSize,
    };
  }, [parentScope, preset, themeIconSize, themeLinkSize, overrideIconSize, overrideLinkSize]);

  const resolvedIconSize = overrideIconSize ?? themeIconSize;
  const resolvedLinkSize = overrideLinkSize ?? themeLinkSize;
  const resolvedPortal = portalContainer === undefined ? parentPortal : portalContainer;
  const resolvedAdapter = iconAdapter === undefined ? parentIconAdapter : iconAdapter;

  // Always render split contexts in a fixed order so toggling optional props never remounts children.
  return (
    <UnicaInternalScopeContext value={scope}>
      <ThemePresetContext value={preset}>
        <IconDefaultsContext value={resolvedIconSize}>
          <LinkDefaultsContext value={resolvedLinkSize}>
            <PortalContext value={resolvedPortal}>
              <IconAdapterContext value={resolvedAdapter}>{children}</IconAdapterContext>
            </PortalContext>
          </LinkDefaultsContext>
        </IconDefaultsContext>
      </ThemePresetContext>
    </UnicaInternalScopeContext>
  );
}

interface DefaultInputs<Value> {
  readonly instance?: Value | undefined;
  readonly group?: Value | undefined;
  readonly builtIn: Value;
}

export function useComponentDefaults<
  Family extends keyof ComponentDefaultAxes,
  Axis extends keyof ComponentDefaultAxes[Family],
>(
  family: Family,
  axis: Axis,
  { instance, group, builtIn }: DefaultInputs<ComponentDefaultAxes[Family][Axis]>,
): ComponentDefaultAxes[Family][Axis] {
  if (instance !== undefined) {
    return instance;
  }
  if (group !== undefined) {
    return group;
  }

  let resolved: ComponentDefaultAxes[Family][Axis] | undefined;
  if (family === 'Icon' && axis === 'size') {
    resolved = use(IconDefaultsContext) as ComponentDefaultAxes[Family][Axis] | undefined;
  } else if (family === 'Link' && axis === 'size') {
    resolved = use(LinkDefaultsContext) as ComponentDefaultAxes[Family][Axis] | undefined;
  }
  return resolved === undefined ? builtIn : resolved;
}
